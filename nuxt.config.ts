import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  // Оверлей — только клиентский рендер (OBS browser source)
  routeRules: {
    '/overlay/**': { ssr: false },
    '/dev/**': { ssr: false },
  },
  // Компоненты без префикса папки: <StickerFrame>, <StreamXpWidget>
  components: [{ path: '~/components', pathPrefix: false }],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    internalSecret: process.env.INTERNAL_SECRET,
    public: {
      // Socket.io-сервер бота. Пустой socketUrl → тот же хост страницы + socketPort
      socketPort: Number(process.env.SOCKET_PORT) || 3002,
      socketUrl: process.env.SOCKET_URL || '',
    },
  },
});
