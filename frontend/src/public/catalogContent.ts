import type { LanguageCode } from './useLanguage';

// Presentational copy (blurb/image/CTA label) for each catalog category slug.
// Category.Name/Slug/SortOrder come from the API (Stage 17); the rest has no
// backing model field yet, so it stays a static, slug-keyed lookup here —
// same approach the old static site used. A category without an entry here
// (e.g. a newly added one before Stage 20 supplies real copy) is skipped
// rather than rendered with placeholder content. description/cta/imageAlt
// are per-language (Stage 24) since this copy shows up site-wide (homepage
// tiles, CategoryHero, catalog-page OG description) and must actually change
// with the language switcher, not just the API-backed fields.
export interface CatalogCardCopy {
  index: string;
  description: Record<LanguageCode, string>;
  cta: Record<LanguageCode, string>;
  imageBase: string;
  imageAlt: Record<LanguageCode, string>;
  width: number;
  height: number;
}

export const CATALOG_CARD_COPY: Record<string, CatalogCardCopy> = {
  stone: {
    index: '01',
    description: {
      ru: 'Мрамор, оникс, травертин и гранит — облицовка, полы, порталы, фасады.',
      en: 'Marble, onyx, travertine, and granite — cladding, flooring, portals, facades.',
      tg: 'Мармар, оникс, травертин ва гранит — рӯпӯшкунӣ, фарш, портал, фасад.',
      fa: 'مرمر، اونیکس، تراورتن و گرانیت — نما، کف‌پوش، درگاه و نمای ساختمان.',
    },
    cta: {
      ru: '60+ ВИДОВ В НАЛИЧИИ →',
      en: '60+ TYPES IN STOCK →',
      tg: '60+ НАВЪ ДАР МАВҶУДӢ →',
      fa: 'بیش از ۶۰ نوع موجود →',
    },
    imageBase: '/assets/images/catalog-stone',
    imageAlt: { ru: 'Камень', en: 'Stone', tg: 'Санг', fa: 'سنگ' },
    width: 900,
    height: 900,
  },
  doors: {
    index: '02',
    description: {
      ru: 'Скрытые и распашные системы из шпона и массива, высота до потолка.',
      en: 'Concealed and hinged door systems in veneer and solid wood, floor-to-ceiling height.',
      tg: 'Системаҳои дари пинҳонӣ ва тобдор аз шпон ва чӯби яклухт, баландии то шифт.',
      fa: 'سیستم‌های در پنهان و لولایی از روکش و چوب توپر، با ارتفاع تا سقف.',
    },
    cta: {
      ru: 'СТОЛЯРНОЕ ПРОИЗВОДСТВО →',
      en: 'JOINERY WORKSHOP →',
      tg: 'ИСТЕҲСОЛИ ДУРУДГАРӢ →',
      fa: 'کارگاه نجاری →',
    },
    imageBase: '/assets/images/catalog-doors',
    imageAlt: { ru: 'Двери', en: 'Doors', tg: 'Дарҳо', fa: 'درها' },
    width: 900,
    height: 599,
  },
  lifts: {
    index: '03',
    description: {
      ru: 'Панорамные и представительские кабины в едином материале с интерьером.',
      en: 'Panoramic and executive cabins finished in materials that match the interior.',
      tg: 'Кабинаҳои панорамӣ ва намояндагӣ дар як маводи ягона бо интерйер.',
      fa: 'کابین‌های پانوراما و اداری با متریال هماهنگ با دکوراسیون داخلی.',
    },
    cta: {
      ru: 'ОТДЕЛКА КАБИН →',
      en: 'CABIN FINISHING →',
      tg: 'ОРОИШИ КАБИНА →',
      fa: 'تزئینات کابین →',
    },
    imageBase: '/assets/images/catalog-lifts',
    imageAlt: { ru: 'Лифты', en: 'Elevators', tg: 'Лифтҳо', fa: 'آسانسورها' },
    width: 900,
    height: 1350,
  },
  // Stage 20: placeholder photo (reused from "doors") pending real windows
  // product photography — see docs/PROGRESS.md.
  windows: {
    index: '04',
    description: {
      ru: 'Оконные системы и алюминиевые фасадные конструкции для премиум-объектов.',
      en: 'Window systems and aluminum facade structures for premium properties.',
      tg: 'Системаҳои тиреза ва конструксияҳои фасадии алюминӣ барои объектҳои премиум.',
      fa: 'سیستم‌های پنجره و سازه‌های نمای آلومینیومی برای پروژه‌های پریمیوم.',
    },
    cta: {
      ru: 'СКОРО В КАТАЛОГЕ →',
      en: 'COMING SOON →',
      tg: 'БА ЗУДӢ ДАР КАТАЛОГ →',
      fa: 'به‌زودی در کاتالوگ →',
    },
    imageBase: '/assets/images/catalog-doors',
    imageAlt: { ru: 'Окна', en: 'Windows', tg: 'Тирезаҳо', fa: 'پنجره‌ها' },
    width: 900,
    height: 599,
  },
};

// Homepage "stones" section (grid of stone material cards next to the sticky
// intro text). Card identity/order is fixed editorial content, same status as
// CATALOG_CARD_COPY above — not an API-backed entity list. `filterValue` links
// a card to the matching `stone_type` product-attribute option (seeded in
// DbSeeder.SeedProductAttributesAsync) so the card deep-links into the real,
// already-filterable catalog instead of duplicating that data; "semi-precious"
// has no such option yet, so it links to the unfiltered stone catalog.
export interface StoneTypeCard {
  filterValue: string | null;
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  imageBase: string;
  imageAlt: Record<LanguageCode, string>;
  width: number;
  height: number;
}

export const STONE_TYPE_CARDS: StoneTypeCard[] = [
  {
    filterValue: 'marble',
    title: { ru: 'Мрамор', en: 'Marble', tg: 'Мармар', fa: 'مرمر' },
    description: {
      ru: 'Классика с благородным рисунком прожилок — для полов, лестниц и облицовки.',
      en: 'A timeless veined classic — for floors, staircases, and cladding.',
      tg: 'Классикаи бо нақши рагҳои муаззам — барои фарш, зинапоя ва рӯпӯшкунӣ.',
      fa: 'کلاسیکی با رگه‌های اصیل — برای کف‌پوش، پلکان و نما.',
    },
    imageBase: '/assets/images/portfolio-ostozhenka',
    imageAlt: { ru: 'Мрамор', en: 'Marble', tg: 'Мармар', fa: 'مرمر' },
    width: 1200,
    height: 799,
  },
  {
    filterValue: 'quartz',
    title: { ru: 'Кварц', en: 'Quartz', tg: 'Кварц', fa: 'کوارتز' },
    description: {
      ru: 'Инженерный камень без пор — стабильный цвет и прочность для кухонь и полов.',
      en: 'Non-porous engineered stone — consistent color and strength for kitchens and floors.',
      tg: 'Санги муҳандисӣ бе сӯрох — ранги устувор ва мустаҳкамӣ барои ошхона ва фарш.',
      fa: 'سنگ مهندسی بدون منفذ — رنگ ثابت و استحکام برای آشپزخانه و کف.',
    },
    imageBase: '/assets/images/catalog-stone',
    imageAlt: { ru: 'Кварц', en: 'Quartz', tg: 'Кварц', fa: 'کوارتز' },
    width: 900,
    height: 900,
  },
  {
    filterValue: 'granite',
    title: { ru: 'Гранит', en: 'Granite', tg: 'Гранит', fa: 'گرانیت' },
    description: {
      ru: 'Плотная текстура и высокая износостойкость — для фасадов и столешниц.',
      en: 'Dense texture and high wear resistance — for facades and countertops.',
      tg: 'Матни фишурда ва тобоварии баланд — барои фасад ва рӯимизӣ.',
      fa: 'بافت متراکم و مقاومت بالا — برای نما و رویه‌کار.',
    },
    imageBase: '/assets/images/catalog-stone',
    imageAlt: { ru: 'Гранит', en: 'Granite', tg: 'Гранит', fa: 'گرانیت' },
    width: 900,
    height: 900,
  },
  {
    filterValue: 'travertine',
    title: { ru: 'Травертин', en: 'Travertine', tg: 'Травертин', fa: 'تراورتن' },
    description: {
      ru: 'Тёплая пористая фактура — для стен, террас и спа-зон.',
      en: 'A warm, porous texture — for walls, terraces, and spa areas.',
      tg: 'Матни гарм ва сӯрохдор — барои девор, тарраса ва фазои спа.',
      fa: 'بافت گرم و متخلخل — برای دیوار، تراس و فضای اسپا.',
    },
    imageBase: '/assets/images/portfolio-rublevka',
    imageAlt: { ru: 'Травертин', en: 'Travertine', tg: 'Травертин', fa: 'تراورتن' },
    width: 800,
    height: 533,
  },
  {
    filterValue: null,
    title: { ru: 'Полудрагоценный камень', en: 'Semi-precious stone', tg: 'Санги нимқиматбаҳо', fa: 'سنگ نیمه‌قیمتی' },
    description: {
      ru: 'Акцентные вставки с подсветкой — для деталей, которые запоминаются.',
      en: 'Backlit accent inlays — for details that leave an impression.',
      tg: 'Ниёзаҳои акцентӣ бо равшанидиҳӣ — барои ҷузъиёте, ки дар хотир мемонанд.',
      fa: 'قطعات تزئینی نورپردازی‌شده — برای جزئیاتی که در ذهن می‌مانند.',
    },
    imageBase: '/assets/images/catalog-stone',
    imageAlt: { ru: 'Полудрагоценный камень', en: 'Semi-precious stone', tg: 'Санги нимқиматбаҳо', fa: 'سنگ نیمه‌قیمتی' },
    width: 900,
    height: 900,
  },
  {
    filterValue: 'onyx',
    title: { ru: 'Оникс', en: 'Onyx', tg: 'Оникс', fa: 'اونیکس' },
    description: {
      ru: 'Просвечивающий рисунок с подсветкой — для акцентных панелей и барных стоек.',
      en: 'Translucent veining with backlighting — for accent panels and bar counters.',
      tg: 'Нақши шаффоф бо равшанӣ — барои панелҳои акцентӣ ва пешхони бар.',
      fa: 'رگه‌های شفاف با نورپردازی — برای پنل‌های تزئینی و پیشخوان بار.',
    },
    imageBase: '/assets/images/portfolio-patriarshie',
    imageAlt: { ru: 'Оникс', en: 'Onyx', tg: 'Оникс', fa: 'اونیکس' },
    width: 800,
    height: 800,
  },
];

export const SOCIAL_ICON_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  instagram: 'Instagram',
};
