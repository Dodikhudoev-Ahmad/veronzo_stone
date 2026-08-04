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

export const SOCIAL_ICON_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  instagram: 'Instagram',
};
