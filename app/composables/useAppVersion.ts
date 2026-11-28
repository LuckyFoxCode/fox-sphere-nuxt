// Версия проекта из package.json (попадает в публичный конфиг в nuxt.config.ts)
export const useAppVersion = (): string => useRuntimeConfig().public.appVersion;
