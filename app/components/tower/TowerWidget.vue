<script setup lang="ts">
import type Phaser from 'phaser';
import type { TowerScene } from '~/phaser/TowerScene';
import { ARENA_HEIGHT, ARENA_WIDTH } from '~/phaser/TowerScene';
import { isBossFloor } from '#shared/tower';

// Арена башни: справа внизу, над полосой героев (bottom-64, 256 px: ник, титул и облачко над ходящим героем
// занимают до ~230 px от низа), чтобы они проходили под ней и не перекрывались.
// Бой считает бот, здесь он только проигрывается. Появляется на время боя, потом прячется.
// Phaser грузится динамически: он трогает window и canvas, и на сервере его импорт упал бы.
const tower = useTowerStore();
const host = ref<HTMLElement | null>(null);
let game: Phaser.Game | null = null;
let scene: TowerScene | null = null;
let disposed = false;

const heroHp = ref(0);
const enemyHp = ref(0);
const result = ref<'win' | 'lose' | null>(null);
// Пока листы грузятся в первый раз, карточка уже на экране, и этот флаг не даёт показать пустую арену
const visible = ref(false);

const fight = computed(() => tower.current);
const title = computed(() => {
  const f = fight.value;
  if (!f) return '';
  return isBossFloor(f.floor) ? `БОСС · этаж ${f.floor}` : `Этаж ${f.floor}`;
});

const ensureScene = async (): Promise<TowerScene | null> => {
  if (scene) return scene;
  const el = host.value;
  if (!el) return null;
  const { createTowerGame } = await import('~/phaser/createTowerGame');
  if (disposed) return null;
  const created = await createTowerGame(el);
  game = created.game;
  scene = created.scene;
  return scene;
};

watch(
  fight,
  async (current) => {
    if (!current) {
      visible.value = false;
      return;
    }
    heroHp.value = current.hero.maxHp;
    enemyHp.value = current.enemy.maxHp;
    result.value = null;
    visible.value = true;
    const arena = await ensureScene();
    if (!arena || disposed || tower.current?.id !== current.id) return;
    await arena.play(current, {
      onTurn: (turn) => {
        heroHp.value = turn.heroHp;
        enemyHp.value = turn.enemyHp;
      },
      onResult: (won) => (result.value = won ? 'win' : 'lose'),
      onEnd: () => {
        if (tower.current?.id === current.id) tower.finish();
      },
    });
  },
  { immediate: true, flush: 'post' },
);

onBeforeUnmount(() => {
  disposed = true;
  game?.destroy(true);
  game = null;
  scene = null;
});
</script>

<template>
  <Transition name="arena-fade">
    <div
      v-show="visible"
      class="font-quicksand pointer-events-none absolute right-3 bottom-64 rounded-2xl border-2 border-sticker-edge bg-sticker-body/95 text-sticker-ink shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
      :style="{ width: ARENA_WIDTH + 'px' }"
    >
      <div class="flex items-center justify-between gap-3 border-b-2 border-sticker-edge/60 px-4 py-2.5">
        <div class="text-base font-extrabold tracking-wide uppercase">{{ title }}</div>
        <div class="truncate text-base font-bold text-sticker-ink/85">{{ fight?.displayName }}</div>
      </div>

      <div
        class="relative"
        :style="{ height: ARENA_HEIGHT + 'px' }"
      >
        <div
          ref="host"
          class="absolute inset-0"
        />
        <div class="absolute top-2 left-4">
          <TowerHpBar
            :value="heroHp"
            :max="fight?.hero.maxHp ?? 1"
            :name="fight ? `${fight.hero.name} · ур. ${fight.level}` : ''"
            align="left"
          />
        </div>
        <div class="absolute top-2 right-4">
          <TowerHpBar
            :value="enemyHp"
            :max="fight?.enemy.maxHp ?? 1"
            :name="fight?.enemy.name ?? ''"
            align="right"
          />
        </div>

        <Transition name="arena-fade">
          <div
            v-if="result"
            class="absolute inset-x-0 top-1/3 flex justify-center"
          >
            <div
              class="rounded-xl border-2 border-sticker-edge px-6 py-1.5 text-2xl font-extrabold tracking-wider uppercase shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
              :class="result === 'win' ? 'bg-sticker-mint text-[#1b2b26]' : 'bg-sticker-rose text-[#2e1620]'"
            >
              {{ result === 'win' ? 'Победа' : 'Поражение' }}
            </div>
          </div>
        </Transition>
      </div>

      <div
        v-if="fight?.queued.length"
        class="truncate border-t-2 border-sticker-edge/60 px-4 py-1.5 text-[13px] font-semibold text-sticker-muted"
      >
        Дальше: {{ fight.queued.join(', ') }}
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.arena-fade-enter-active,
.arena-fade-leave-active {
  transition: opacity 300ms;
}
.arena-fade-enter-from,
.arena-fade-leave-to {
  opacity: 0;
}
</style>
