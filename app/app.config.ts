// Палитра админки (Nuxt UI). Оверлеи эти цвета не используют: у них свои токены в assets/css/main.css.
// Значение — имя цвета Tailwind (amber, orange, rose, teal, stone, zinc, slate…) или своего оттенка,
// описанного в assets/css/admin.css.
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber', // акцент: главные кнопки, активный пункт меню
      neutral: 'stone', // фоны, рамки и текст
      // Остальные роли можно переопределить здесь же: secondary, success, info, warning, error
      warning: 'orange', // иначе предупреждения сливаются с янтарным акцентом
    },
  },
});
