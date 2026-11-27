// Числа и даты в разделах админки.
const NUMBER = new Intl.NumberFormat('ru-RU');
const DATE = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });

export const formatNumber = (value: number): string => NUMBER.format(value);

// null — события ещё не было
export const formatDate = (iso: string | null): string => (iso ? DATE.format(new Date(iso)) : '—');
