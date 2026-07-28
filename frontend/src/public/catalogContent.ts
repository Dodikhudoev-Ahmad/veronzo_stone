// Presentational copy (blurb/image/CTA label) for each catalog category slug.
// Category.Name/Slug/SortOrder come from the API (Stage 17); the rest has no
// backing model field yet, so it stays a static, slug-keyed lookup here —
// same approach the old static site used. A category without an entry here
// (e.g. a newly added one before Stage 20 supplies real copy) is skipped
// rather than rendered with placeholder content.
export interface CatalogCardCopy {
  index: string;
  description: string;
  cta: string;
  imageBase: string;
  imageAlt: string;
  width: number;
  height: number;
}

export const CATALOG_CARD_COPY: Record<string, CatalogCardCopy> = {
  stone: {
    index: '01',
    description: 'Мрамор, оникс, травертин и гранит — облицовка, полы, порталы, фасады.',
    cta: '60+ ВИДОВ В НАЛИЧИИ →',
    imageBase: '/assets/images/catalog-stone',
    imageAlt: 'Камень',
    width: 900,
    height: 900,
  },
  doors: {
    index: '02',
    description: 'Скрытые и распашные системы из шпона и массива, высота до потолка.',
    cta: 'СТОЛЯРНОЕ ПРОИЗВОДСТВО →',
    imageBase: '/assets/images/catalog-doors',
    imageAlt: 'Двери',
    width: 900,
    height: 599,
  },
  lifts: {
    index: '03',
    description: 'Панорамные и представительские кабины в едином материале с интерьером.',
    cta: 'ОТДЕЛКА КАБИН →',
    imageBase: '/assets/images/catalog-lifts',
    imageAlt: 'Лифты',
    width: 900,
    height: 1350,
  },
  // Stage 20: placeholder photo (reused from "doors") pending real windows
  // product photography — see docs/PROGRESS.md.
  windows: {
    index: '04',
    description: 'Оконные системы и алюминиевые фасадные конструкции для премиум-объектов.',
    cta: 'СКОРО В КАТАЛОГЕ →',
    imageBase: '/assets/images/catalog-doors',
    imageAlt: 'Окна',
    width: 900,
    height: 599,
  },
};

export const SOCIAL_ICON_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  instagram: 'Instagram',
};
