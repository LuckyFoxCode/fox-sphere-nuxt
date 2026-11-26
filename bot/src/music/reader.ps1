#Requires -Version 5.1
<#
    Читатель «что играет» для бота fox-sphere. Запускается самим ботом (bot/src/music/index.ts),
    руками и планировщиком не нужен.

    Читает системную медиасессию Windows (GSMTC) - то, что Brave сообщает системе, - и пишет в stdout
    по одной JSON-строке: {"state": {...}} или {"state": null} («ничего не играет»).
    Всё остальное (диагностика) идёт в stderr, бот печатает это в свой лог. Сети здесь нет.

    Нужен именно Windows PowerShell 5.1 (powershell.exe): WinRT-типы в pwsh 7 не загружаются.

    Позицию трека считаем сами: Brave (Chromium) обновляет `Position` в системе только на старте
    трека и при перемотке. Замеры из старого проекта: `Position` стоит на 0.01 с, `LastUpdatedTime`
    не двигается, статус при этом `Playing`. Сырое значение нельзя отдавать как «текущую позицию» -
    полоска в оверлее замерла бы. Держим якорь (позиция, момент) и отдаём позицию + (сейчас - момент).

    Выход: когда пропал родитель (бот убит жёстко, tsx watch перезапустился) или закрылся stdout.
#>

$ErrorActionPreference = "Continue"

# Побайтовый вывод вместо Console.Out: без консоли (windowsHide, пайпы) смена кодировки консоли
# бросает "handle is invalid", а кириллица в названиях треков должна доехать как есть.
$utf8 = New-Object System.Text.UTF8Encoding($false)
$stdout = [Console]::OpenStandardOutput()
$stderr = [Console]::OpenStandardError()

function Write-Line {
    param($Stream, [string]$Text)

    $bytes = $utf8.GetBytes($Text + "`n")
    $Stream.Write($bytes, 0, $bytes.Length)
    $Stream.Flush()
}

function Write-Log {
    param([string]$Message)

    try { Write-Line $stderr $Message } catch { }
}

$pollMs = 1000
if ($env:MUSIC_POLL_MS -match '^\d+$' -and [int]$env:MUSIC_POLL_MS -ge 200) { $pollMs = [int]$env:MUSIC_POLL_MS }

$parentPid = 0
if ($env:MUSIC_PARENT_PID -match '^\d+$') { $parentPid = [int]$env:MUSIC_PARENT_PID }

$heartbeatMs = 15000
$seekThresholdMs = 1500
$maxArtworkBytes = 200000

Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing

# WinRT-задачи нельзя ждать напрямую из PowerShell: нужен адаптер AsTask.
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
} | Select-Object -First 1

$asStreamGeneric = [System.IO.WindowsRuntimeStreamExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsStreamForRead' -and $_.GetParameters().Count -eq 1
} | Select-Object -First 1

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null

$managerType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]
try {
    $manager = Await ($managerType::RequestAsync()) $managerType
} catch {
    # Единственная ошибка, которую цикл не поймает: без менеджера работать нечем.
    # Бот увидит код выхода и перезапустит читателя с паузой.
    Write-Log "Cannot reach Windows media sessions (GSMTC): $($_.Exception.Message)"
    exit 1
}

function Get-PredictedPosition {
    param(
        [double]$AnchorPosMs,
        [datetime]$AnchorAt,
        [datetime]$Now,
        [bool]$Running
    )

    if (-not $Running) { return $AnchorPosMs }

    return $AnchorPosMs + ($Now - $AnchorAt).TotalMilliseconds
}

function Get-ArtworkDataUrl {
    param($ThumbnailReference)

    if ($null -eq $ThumbnailReference) { return $null }

    try {
        $winRtStream = Await ($ThumbnailReference.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
        $contentType = $winRtStream.ContentType
        if ([string]::IsNullOrWhiteSpace($contentType)) { $contentType = "image/png" }

        # `AsStreamForRead` живёт в System.IO.WindowsRuntimeStreamExtensions, а не в
        # System.WindowsRuntimeSystemExtensions - иначе получаешь NullArray.
        $netStream = $asStreamGeneric.Invoke($null, @($winRtStream))
        $buffer = [System.IO.MemoryStream]::new()
        $netStream.CopyTo($buffer)
        $bytes = $buffer.ToArray()

        $buffer.Dispose()
        $netStream.Dispose()

        if ($bytes.Length -eq 0) { return $null }

        # Обложка едет в data URL целиком, поэтому крупные картинки ужимаются до 256 px:
        # 200 КБ бинарника - это ~270 КБ base64 на каждую смену трека.
        if ($bytes.Length -gt $maxArtworkBytes) {
            $sourceStream = [System.IO.MemoryStream]::new($bytes)
            $image = [System.Drawing.Image]::FromStream($sourceStream)

            $scale = [Math]::Min(256 / $image.Width, 256 / $image.Height)
            $width = [int][Math]::Max(1, [Math]::Round($image.Width * $scale))
            $height = [int][Math]::Max(1, [Math]::Round($image.Height * $scale))

            $bitmap = [System.Drawing.Bitmap]::new($width, $height)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($image, 0, 0, $width, $height)

            $resized = [System.IO.MemoryStream]::new()
            $bitmap.Save($resized, [System.Drawing.Imaging.ImageFormat]::Png)
            $bytes = $resized.ToArray()
            $contentType = "image/png"

            $resized.Dispose()
            $graphics.Dispose()
            $bitmap.Dispose()
            $image.Dispose()
            $sourceStream.Dispose()
        }

        return "data:$contentType;base64," + [Convert]::ToBase64String($bytes)
    } catch {
        Write-Log "Artwork failed: $($_.Exception.Message)"
        return $null
    }
}

# Состояние якоря. Каждая строка несёт уже посчитанную позицию, поэтому оверлей ничего не
# восстанавливает и не догадывается.
$anchorPosMs = 0.0
$anchorAt = Get-Date
$anchorRunning = $false

$lastTrackKey = $null
$lastRawPosMs = $null
$lastIsPlaying = $null
$lastArtwork = $null
$lastSendAt = [datetime]::MinValue

Write-Log "Reader ready (pid $PID, pollMs=$pollMs)"

while ($true) {
    if ($parentPid -gt 0 -and -not (Get-Process -Id $parentPid -ErrorAction SilentlyContinue)) {
        Write-Log "Parent $parentPid is gone, exiting"
        exit 0
    }

    try {
        $now = Get-Date
        $session = $manager.GetCurrentSession()
        $properties = $null

        if ($null -ne $session) {
            $properties = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])

            # Пустой заголовок - это не трек: бот такое состояние всё равно отбросил бы.
            if ([string]::IsNullOrWhiteSpace($properties.Title)) { $properties = $null }
        }

        $payloadState = $null
        $shouldSend = $false

        if ($null -eq $properties) {
            # Нет сессии: вкладка закрыта или плеер ничего не отдаёт в систему.
            # Это не пауза - пауза остаётся сессией со статусом Paused.
            if ($lastTrackKey -ne "<none>") {
                $lastTrackKey = "<none>"
                $lastIsPlaying = $null
                $lastArtwork = $null
                $lastRawPosMs = $null
                $anchorPosMs = 0.0
                $anchorAt = $now
                $anchorRunning = $false
                $shouldSend = $true
                Write-Log "No media session - sending null"
            }
        } else {
            $playbackInfo = $session.GetPlaybackInfo()
            $timeline = $session.GetTimelineProperties()

            $isPlaying = $playbackInfo.PlaybackStatus.ToString() -eq "Playing"
            # Разделитель, которого не бывает в названии: `|` встречается в заголовках роликов,
            # и тогда разные треки склеились бы в один ключ.
            $trackKey = $properties.Title + [char]0 + $properties.Artist
            $rawPosMs = $timeline.Position.TotalMilliseconds
            $durationMs = [int64][Math]::Max(0, $timeline.EndTime.TotalMilliseconds)

            # Позиция, которую предсказывает текущий якорь - до всех правок ниже.
            $predicted = Get-PredictedPosition -AnchorPosMs $anchorPosMs -AnchorAt $anchorAt -Now $now -Running $anchorRunning

            $trackChanged = $trackKey -ne $lastTrackKey
            $seeked = $false

            if ($trackChanged) {
                $anchorPosMs = $rawPosMs
                $anchorAt = $now
                $anchorRunning = $isPlaying
                $lastArtwork = Get-ArtworkDataUrl -ThumbnailReference $properties.Thumbnail
                Write-Log "Track: $($properties.Artist) - $($properties.Title) (dur $([int64]$timeline.EndTime.TotalSeconds)s)"
            } else {
                # Сырая позиция сдвинулась сама - значит это настоящая перемотка (или браузер наконец
                # прислал обновление). Дрожание на доли секунды перемоткой не считается. У потока
                # (радио) длительности нет вовсе, и `Position` приходит нулевым на каждом опросе:
                # сравнивать нечего, это не перемотка, а отсутствие таймлайна.
                if ($durationMs -gt 0 -and $null -ne $lastRawPosMs -and [Math]::Abs($rawPosMs - $lastRawPosMs) -gt $seekThresholdMs) {
                    $anchorPosMs = $rawPosMs
                    $anchorAt = $now
                    $anchorRunning = $isPlaying
                    $seeked = $true
                    Write-Log "Seek detected: raw=$([int64]$rawPosMs)ms"
                } elseif ($null -ne $lastIsPlaying -and $lastIsPlaying -ne $isPlaying) {
                    # Пауза фиксирует предсказанную позицию, продолжение идёт с неё же, а не с того,
                    # что пришлёт Brave: он пришлёт старое значение.
                    $anchorPosMs = $predicted
                    $anchorAt = $now
                    $anchorRunning = $isPlaying
                }
            }

            $positionMs = Get-PredictedPosition -AnchorPosMs $anchorPosMs -AnchorAt $anchorAt -Now $now -Running $anchorRunning
            $positionMs = [Math]::Min([Math]::Max($positionMs, 0), [Math]::Max($durationMs, 0))

            $album = $properties.AlbumTitle
            if ([string]::IsNullOrWhiteSpace($album)) { $album = $null }

            # Обложка едет только при смене трека: сердцебиение с ней же - это ~270 КБ base64
            # каждые 15 секунд. Бот вернёт прежнюю картинку к состоянию того же трека.
            $artworkForPayload = $null
            if ($trackChanged) { $artworkForPayload = $lastArtwork }

            $payloadState = @{
                title      = [string]$properties.Title
                artist     = [string]$properties.Artist
                album      = $album
                artwork    = $artworkForPayload
                durationMs = $durationMs
                positionMs = [int64][Math]::Round($positionMs)
                isPlaying  = $isPlaying
                sentAt     = [int64]([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
            }

            $statusChanged = $null -ne $lastIsPlaying -and $lastIsPlaying -ne $isPlaying
            $heartbeatDue = ($now - $lastSendAt).TotalMilliseconds -ge $heartbeatMs

            if ($trackChanged -or $seeked -or $statusChanged -or $heartbeatDue) {
                $shouldSend = $true
            }

            $lastTrackKey = $trackKey
            $lastRawPosMs = $rawPosMs
            $lastIsPlaying = $isPlaying
        }

        if ($shouldSend) {
            $json = @{ state = $payloadState } | ConvertTo-Json -Depth 4 -Compress

            try {
                Write-Line $stdout $json
            } catch {
                # stdout закрыт - бота рядом уже нет
                exit 0
            }

            $lastSendAt = $now
        }

        Start-Sleep -Milliseconds $pollMs
    } catch {
        Write-Log "Loop error: $($_.Exception.Message)"
        Start-Sleep -Milliseconds $pollMs
    }
}
