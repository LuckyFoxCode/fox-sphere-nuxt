// Прозрачный фон страницы: обязателен для OBS Browser Source.
export const useTransparentPage = () => {
  useHead({
    htmlAttrs: { style: 'background: transparent' },
    bodyAttrs: { style: 'background: transparent; overflow: hidden' },
  });
};
