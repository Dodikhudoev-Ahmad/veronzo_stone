// Presentational copy (blurb/image/CTA label) for each catalog category slug.
// Category.Name/Slug/SortOrder come from the API (Stage 17); the rest has no
// backing model field yet, so it stays a static, slug-keyed lookup here —
// same approach the old static site used. A category without an entry here
// (e.g. a newly added one before Stage 20 supplies real copy) is skipped
// rather than rendered with placeholder content. The public site is
// Russian-only (see useLanguage.ts's removal note), so description/cta/
// imageAlt are plain strings, not per-language records.
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
    cta: '60+ ВИДОВ В НАЛИЧИИ',
    imageBase: '/assets/images/catalog-stone',
    imageAlt: 'Камень',
    width: 900,
    height: 900,
  },
  doors: {
    index: '02',
    description: 'Скрытые и распашные системы из шпона и массива, высота до потолка.',
    cta: 'СТОЛЯРНОЕ ПРОИЗВОДСТВО',
    imageBase: '/assets/images/catalog-doors',
    imageAlt: 'Двери',
    width: 900,
    height: 599,
  },
  lifts: {
    index: '03',
    description: 'Панорамные и представительские кабины в едином материале с интерьером.',
    cta: 'ОТДЕЛКА КАБИН',
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
    cta: 'СКОРО В КАТАЛОГЕ',
    imageBase: '/assets/images/catalog-doors',
    imageAlt: 'Окна',
    width: 900,
    height: 599,
  },
};

// Homepage "stones" section (grid of stone material cards next to the sticky
// intro text). Card identity/order is fixed editorial content, same status as
// CATALOG_CARD_COPY above — not an API-backed entity list. Every card links
// to the plain, unfiltered `/catalog/stone` — the catalog no longer supports
// filtering by stone type (or anything else), it just lists every product
// in the category.
//
// Card images (catalog-stone-{marble,quartz,granite,travertine,onyx,semiprecious})
// are real material surface photography, not the furniture/interior stock
// photos used elsewhere in this file — sourced from ambientCG
// (https://ambientcg.com, assets Marble012/Marble021/Granite002A/
// Travertine009/Onyx012/Onyx006), released under CC0 1.0 (public domain,
// free for commercial use, no attribution required).
export interface StoneTypeCard {
  title: string;
  description: string;
  imageBase: string;
  imageAlt: string;
  width: number;
  height: number;
}

export const STONE_TYPE_CARDS: StoneTypeCard[] = [
  {
    title: 'Мрамор',
    description: 'Классика с благородным рисунком прожилок — для полов, лестниц и облицовки.',
    imageBase: '/assets/images/catalog-stone-marble',
    imageAlt: 'Мрамор',
    width: 900,
    height: 900,
  },
  {
    title: 'Кварц',
    description: 'Инженерный камень без пор — стабильный цвет и прочность для кухонь и полов.',
    imageBase: '/assets/images/catalog-stone-quartz',
    imageAlt: 'Кварц',
    width: 900,
    height: 900,
  },
  {
    title: 'Гранит',
    description: 'Плотная текстура и высокая износостойкость — для фасадов и столешниц.',
    imageBase: '/assets/images/catalog-stone-granite',
    imageAlt: 'Гранит',
    width: 900,
    height: 900,
  },
  {
    title: 'Травертин',
    description: 'Тёплая пористая фактура — для стен, террас и спа-зон.',
    imageBase: '/assets/images/catalog-stone-travertine',
    imageAlt: 'Травертин',
    width: 900,
    height: 900,
  },
  {
    title: 'Полудрагоценный камень',
    description: 'Акцентные вставки с подсветкой — для деталей, которые запоминаются.',
    imageBase: '/assets/images/catalog-stone-semiprecious',
    imageAlt: 'Полудрагоценный камень',
    width: 900,
    height: 900,
  },
  {
    title: 'Оникс',
    description: 'Просвечивающий рисунок с подсветкой — для акцентных панелей и барных стоек.',
    imageBase: '/assets/images/catalog-stone-onyx',
    imageAlt: 'Оникс',
    width: 900,
    height: 900,
  },
];

export const SOCIAL_ICON_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  instagram: 'Instagram',
};
