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
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    internalSecret: process.env.INTERNAL_SECRET,
  },
});
