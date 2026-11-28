import pkg from './package.json' with { type: 'json' };

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: true },
  // Nuxt UI нужен только админке (/admin). Он же подключает плагин Tailwind для Vite
  modules: ['@pinia/nuxt', '@nuxt/ui'],
  // Тема админки всегда тёмная, шрифты локальные: ни переключатель темы, ни загрузка шрифтов не нужны
  ui: { colorMode: false, fonts: false },
  // Стили оверлеев. Стили админки (assets/css/admin.css) подключают только её layout'ы
  css: ['~/assets/css/main.css'],
  // Оверлей — только клиентский рендер (OBS browser source). Админка тоже: данные идут через API после входа
  routeRules: {
    '/overlay/**': { ssr: false },
    '/dev/**': { ssr: false },
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
  },
  // Компоненты без префикса папки: <StickerFrame>, <StreamXpWidget>
  components: [{ path: '~/components', pathPrefix: false }],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Секреты (INTERNAL_SECRET, ADMIN_SESSION_SECRET) сервер читает из process.env: здесь они попали бы в сборку
    public: {
      // Версия проекта: показывается в админке и считает ярлык NEW (shared/features.ts)
      appVersion: pkg.version,
      // Socket.io-сервер бота. Пустой socketUrl → тот же хост страницы + socketPort
      socketPort: Number(process.env.SOCKET_PORT) || 3002,
      socketUrl: process.env.SOCKET_URL || '',
    },
  },
});
