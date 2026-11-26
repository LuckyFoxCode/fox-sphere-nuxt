// Круглое превью героя в карточках: первый кадр листа «вид спереди» (portrait), без него — первый кадр idle.
import { getHeroById, type HeroDefinition } from '#shared/heroes';

export const buildPortraitStyle = (hero: HeroDefinition): Record<string, string> => {
  const sheet = hero.portrait ?? hero.idle;
  return {
    backgroundImage: `url('/${sheet.path}')`,
    backgroundSize: `${sheet.columns * 100}% ${sheet.rows * 100}%`,
    backgroundPosition: '0 0',
    backgroundRepeat: 'no-repeat',
  };
};

export const buildHeroPortraitStyle = (heroId: string): Record<string, string> =>
  buildPortraitStyle(getHeroById(heroId));
