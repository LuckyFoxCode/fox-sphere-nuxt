// Готовые наборы цветов админки. Меняются только роли primary и neutral: цвета меток (success, info,
// warning, error, secondary) остаются из app/app.config.ts, чтобы метки не перемешались.
// Значения — имена цветов Tailwind, swatch — кружок в выборе. Первый набор — тот, что в app.config.ts.
export const ADMIN_PALETTES = [
  { id: 'amber', label: 'Янтарь', primary: 'amber', neutral: 'stone', swatch: '#f59e0b' },
  { id: 'violet', label: 'Фиалка', primary: 'violet', neutral: 'zinc', swatch: '#8b5cf6' },
  { id: 'teal', label: 'Бирюза', primary: 'teal', neutral: 'slate', swatch: '#14b8a6' },
  { id: 'sky', label: 'Небо', primary: 'sky', neutral: 'slate', swatch: '#0ea5e9' },
  { id: 'lime', label: 'Лайм', primary: 'lime', neutral: 'neutral', swatch: '#84cc16' },
] as const;

export type AdminPaletteId = (typeof ADMIN_PALETTES)[number]['id'];
