// «1 монета, 2 монеты, 5 монет»: правила языка берутся из встроенного Intl.PluralRules.
export const counter = (locale: 'uk' | 'ru') => {
  const rules = new Intl.PluralRules(locale);
  return (count: number, one: string, few: string, many: string): string => {
    const form = rules.select(count);
    return `${count} ${form === 'one' ? one : form === 'few' ? few : many}`;
  };
};
