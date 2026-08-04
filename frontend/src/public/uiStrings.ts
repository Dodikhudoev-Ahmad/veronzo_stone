import { useMemo } from 'react';
import type { LanguageCode } from './useLanguage';

// Fixed UI-chrome strings (nav labels, button text, form labels, empty/error
// states, ...) that were previously hardcoded Russian JSX text with no path
// to translation at all -- unlike hero/about/contacts copy, these aren't
// admin-editable "content" (no business reason to expose "Filters" or
// "Loading…" in the admin panel), so they live in a static per-language
// dictionary here rather than going through the SiteContent API.
const STRINGS = {
  'nav.about': { ru: 'О компании', en: 'About', tg: 'Дар бораи мо', fa: 'درباره ما' },
  'nav.catalog': { ru: 'Каталог', en: 'Catalog', tg: 'Каталог', fa: 'کاتالوگ' },
  'nav.portfolio': { ru: 'Портфолио', en: 'Portfolio', tg: 'Портфолио', fa: 'نمونه‌کارها' },
  'nav.why': { ru: 'Почему мы', en: 'Why us', tg: 'Чаро мо', fa: 'چرا ما' },
  'nav.contacts': { ru: 'Контакты', en: 'Contacts', tg: 'Тамос', fa: 'تماس' },
  'nav.consultation': { ru: 'Консультация', en: 'Consultation', tg: 'Машварат', fa: 'مشاوره' },
  'nav.menu': { ru: 'Меню', en: 'Menu', tg: 'Меню', fa: 'منو' },

  'footer.rights': {
    ru: 'Все права защищены.',
    en: 'All rights reserved.',
    tg: 'Ҳама ҳуқуқҳо ҳифз шудаанд.',
    fa: 'کلیه حقوق محفوظ است.',
  },

  'breadcrumb.aria': { ru: 'Хлебные крошки', en: 'Breadcrumb', tg: 'Масири навигатсионӣ', fa: 'مسیر ناوبری' },
  'breadcrumb.home': { ru: 'Главная', en: 'Home', tg: 'Асосӣ', fa: 'خانه' },

  'loading': { ru: 'Загрузка…', en: 'Loading…', tg: 'Боркунӣ…', fa: 'در حال بارگذاری…' },
  'retry': { ru: 'Повторить попытку', en: 'Try again', tg: 'Такрор кардан', fa: 'تلاش مجدد' },

  'hero.ctaPrimary': { ru: 'Смотреть каталог', en: 'View catalog', tg: 'Дидани каталог', fa: 'مشاهده کاتالوگ' },
  'hero.ctaSecondary': { ru: 'Заявка на консультацию', en: 'Request a consultation', tg: 'Дархости машварат', fa: 'درخواست مشاوره' },
  'hero.imageAlt': { ru: 'Мраморный интерьер Calacatta', en: 'Calacatta marble interior', tg: 'Интерйери мармари Calacatta', fa: 'دکوراسیون داخلی مرمر کالاکاتا' },

  'catalog.eyebrow': { ru: 'Каталог', en: 'Catalog', tg: 'Каталог', fa: 'کاتالوگ' },
  'catalog.heading': {
    ru: 'Материалы и инженерные решения в одной системе',
    en: 'Materials and engineering solutions in one system',
    tg: 'Маводҳо ва ҳалли муҳандисӣ дар як система',
    fa: 'متریال و راهکارهای مهندسی در یک سیستم',
  },
  'catalog.unavailable': {
    ru: 'Каталог временно недоступен.',
    en: 'The catalog is temporarily unavailable.',
    tg: 'Каталог муваққатан дастнорас аст.',
    fa: 'کاتالوگ موقتاً در دسترس نیست.',
  },
  'catalog.searchPlaceholder': {
    ru: 'Поиск по товарам…',
    en: 'Search products…',
    tg: 'Ҷустуҷӯи молҳо…',
    fa: 'جستجوی محصولات…',
  },
  'catalog.searchAria': { ru: 'Поиск по товарам', en: 'Search products', tg: 'Ҷустуҷӯи молҳо', fa: 'جستجوی محصولات' },

  'stones.heading': {
    ru: 'Камень, который задаёт тон интерьеру',
    en: 'The stone that sets the tone of your interior',
    tg: 'Санге, ки оҳанги интерйерро муайян мекунад',
    fa: 'سنگی که فضای داخلی را تعریف می‌کند',
  },
  'stones.description': {
    ru: 'Мрамор, кварц, гранит, травертин, оникс и полудрагоценный камень подобраны для разных сценариев: от спокойной облицовки до акцентных деталей.',
    en: 'Marble, quartz, granite, travertine, onyx, and semi-precious stone selected for different scenarios — from calm cladding to accent details.',
    tg: 'Мармар, кварц, гранит, травертин, оникс ва санги нимқиматбаҳо барои вазъиятҳои гуногун интихоб шудаанд — аз рӯпӯшкунии ором то ҷузъиёти акцентӣ.',
    fa: 'مرمر، کوارتز، گرانیت، تراورتن، اونیکس و سنگ نیمه‌قیمتی برای سناریوهای مختلف انتخاب شده‌اند — از نمای آرام تا جزئیات تأکیدی.',
  },
  'stones.cta': { ru: 'Каталог камня →', en: 'Stone catalog →', tg: 'Каталоги санг →', fa: 'کاتالوگ سنگ →' },
  'catalog.filters': { ru: 'Фильтры', en: 'Filters', tg: 'Филтрҳо', fa: 'فیلترها' },
  'catalog.updating': { ru: 'Обновление…', en: 'Updating…', tg: 'Навсозӣ…', fa: 'در حال بروزرسانی…' },
  'catalog.foundCount': {
    ru: 'Найдено: {n}',
    en: '{n} found',
    tg: 'Ёфт шуд: {n}',
    fa: '{n} مورد یافت شد',
  },
  'catalog.loadProductsError': {
    ru: 'Не удалось загрузить товары. Проверьте соединение и попробуйте ещё раз.',
    en: 'Failed to load products. Check your connection and try again.',
    tg: 'Молҳо бор нашуданд. Пайвастшавиро санҷед ва аз нав кӯшиш кунед.',
    fa: 'بارگذاری محصولات ناموفق بود. اتصال خود را بررسی کرده و دوباره تلاش کنید.',
  },
  'catalog.noMatches': {
    ru: 'По заданным условиям ничего не найдено.',
    en: 'Nothing matches the selected filters.',
    tg: 'Тибқи шартҳои додашуда чизе ёфт нашуд.',
    fa: 'با فیلترهای انتخاب‌شده موردی یافت نشد.',
  },
  'catalog.categoryEmpty': {
    ru: 'В этой категории пока нет товаров.',
    en: 'There are no products in this category yet.',
    tg: 'Дар ин категория ҳанӯз мол нест.',
    fa: 'در حال حاضر محصولی در این دسته وجود ندارد.',
  },
  'catalog.clearFilters': { ru: 'Очистить фильтры', en: 'Clear filters', tg: 'Тоза кардани филтрҳо', fa: 'پاک کردن فیلترها' },

  'filters.title': { ru: 'Фильтры', en: 'Filters', tg: 'Филтрҳо', fa: 'فیلترها' },
  'filters.clear': { ru: 'Очистить', en: 'Clear', tg: 'Тоза кардан', fa: 'پاک کردن' },
  'filters.showAll': { ru: 'Показать все ({n})', en: 'Show all ({n})', tg: 'Ҳамаро нишон додан ({n})', fa: 'نمایش همه ({n})' },
  'filters.close': { ru: 'Закрыть фильтры', en: 'Close filters', tg: 'Пӯшидани филтрҳо', fa: 'بستن فیلترها' },
  'filters.apply': { ru: 'Применить', en: 'Apply', tg: 'Татбиқ кардан', fa: 'اعمال' },

  'product.notFound': {
    ru: 'Товар не найден. Возможно, он был снят с публикации.',
    en: 'Product not found. It may have been unpublished.',
    tg: 'Мол ёфт нашуд. Эҳтимол он аз нашр бардошта шудааст.',
    fa: 'محصول یافت نشد. ممکن است از انتشار خارج شده باشد.',
  },
  'product.loadError': {
    ru: 'Не удалось загрузить товар. Проверьте соединение и попробуйте ещё раз.',
    en: 'Failed to load the product. Check your connection and try again.',
    tg: 'Мол бор нашуд. Пайвастшавиро санҷед ва аз нав кӯшиш кунед.',
    fa: 'بارگذاری محصول ناموفق بود. اتصال خود را بررسی کرده و دوباره تلاش کنید.',
  },
  'product.imagesAria': { ru: 'Изображения товара', en: 'Product images', tg: 'Тасвирҳои мол', fa: 'تصاویر محصول' },
  'product.imageLabel': { ru: 'Изображение {n}', en: 'Image {n}', tg: 'Тасвири {n}', fa: 'تصویر {n}' },
  'product.related': { ru: 'Похожие товары', en: 'Related products', tg: 'Молҳои монанд', fa: 'محصولات مرتبط' },

  'notfound.message': {
    ru: 'Страница не найдена. Возможно, ссылка устарела или адрес введён с ошибкой.',
    en: 'Page not found. The link may be outdated or the address may be mistyped.',
    tg: 'Саҳифа ёфт нашуд. Эҳтимол пайванд кӯҳна аст ё суроға хато ворид шудааст.',
    fa: 'صفحه یافت نشد. ممکن است پیوند منسوخ شده یا آدرس اشتباه وارد شده باشد.',
  },
  'notfound.cta': { ru: 'На главную', en: 'Go home', tg: 'Ба саҳифаи асосӣ', fa: 'بازگشت به خانه' },

  'about.eyebrow': { ru: 'О компании', en: 'About', tg: 'Дар бораи мо', fa: 'درباره ما' },
  'about.tag1': { ru: 'Проектирование и BIM', en: 'Design and BIM', tg: 'Тарҳрезӣ ва BIM', fa: 'طراحی و BIM' },
  'about.tag2': { ru: 'Собственное производство', en: 'In-house production', tg: 'Истеҳсоли худӣ', fa: 'تولید داخلی' },
  'about.tag3': { ru: 'Монтаж и шеф-надзор', en: 'Installation and site supervision', tg: 'Насб ва назорати сарп ронандагӣ', fa: 'نصب و نظارت اجرایی' },
  'about.imageAlt': { ru: 'Мастерская обработки камня', en: 'Stone-working workshop', tg: 'Устохонаи коркарди санг', fa: 'کارگاه فرآوری سنگ' },

  'portfolio.eyebrow': { ru: 'Портфолио', en: 'Portfolio', tg: 'Портфолио', fa: 'نمونه‌کارها' },
  'portfolio.heading': {
    ru: 'Объекты, которыми мы гордимся',
    en: 'Projects we are proud of',
    tg: 'Объектҳое, ки мо ифтихор мекунем',
    fa: 'پروژه‌هایی که به آن‌ها افتخار می‌کنیم',
  },
  'portfolio.loadError': {
    ru: 'Не удалось загрузить портфолио. Попробуйте обновить страницу или свяжитесь с нами напрямую.',
    en: 'Failed to load the portfolio. Try refreshing the page or contact us directly.',
    tg: 'Портфолио бор нашуд. Саҳифаро нав кунед ё бевосита бо мо тамос гиред.',
    fa: 'بارگذاری نمونه‌کارها ناموفق بود. صفحه را دوباره بارگذاری کنید یا مستقیماً با ما تماس بگیرید.',
  },
  'portfolio.empty': {
    ru: 'Портфолио скоро пополнится новыми объектами.',
    en: 'New projects will be added to the portfolio soon.',
    tg: 'Портфолио ба зудӣ бо объектҳои нав пур мешавад.',
    fa: 'به‌زودی پروژه‌های جدید به نمونه‌کارها اضافه می‌شود.',
  },

  'why.eyebrow': { ru: 'Почему мы', en: 'Why us', tg: 'Чаро мо', fa: 'چرا ما' },
  'why.card1.title': { ru: 'Единый подрядчик', en: 'Single contractor', tg: 'Пудратчии ягона', fa: 'پیمانکار واحد' },
  'why.card1.text': {
    ru: 'Камень, двери и лифты в одном контракте — без стыковочных ошибок между бригадами разных компаний.',
    en: 'Stone, doors, and elevators under one contract — no coordination errors between different companies’ crews.',
    tg: 'Санг, дарҳо ва лифтҳо дар як шартнома — бе хатогиҳои пайвастшавӣ байни бригадаҳои ширкатҳои гуногун.',
    fa: 'سنگ، در و آسانسور در یک قرارداد — بدون خطاهای هماهنگی بین گروه‌های شرکت‌های مختلف.',
  },
  'why.card2.title': { ru: 'Язык проекта', en: 'The language of the project', tg: 'Забони лоиҳа', fa: 'زبان پروژه' },
  'why.card2.text': {
    ru: 'Работаем с чертежами, BIM-моделями и спецификациями. Понимаем архитектора и дизайнера с полуслова.',
    en: 'We work with drawings, BIM models, and specifications — we understand architects and designers instantly.',
    tg: 'Мо бо нақшаҳо, моделҳои BIM ва спецификатсияҳо кор мекунем. Меъмор ва дизайнерро аз ним калима мефаҳмем.',
    fa: 'ما با نقشه‌ها، مدل‌های BIM و مشخصات فنی کار می‌کنیم. معمار و طراح را با یک اشاره درک می‌کنیم.',
  },
  'why.card3.title': { ru: 'Собственное производство', en: 'In-house production', tg: 'Истеҳсоли худӣ', fa: 'تولید داخلی' },
  'why.card3.text': {
    ru: 'Контролируем качество и сроки на каждом этапе — от раскроя слэба до финального монтажа на объекте.',
    en: 'We control quality and timelines at every stage — from slab cutting to final on-site installation.',
    tg: 'Мо сифат ва мӯҳлатҳоро дар ҳар марҳала назорат мекунем — аз буриши слэб то насби ниҳоӣ дар объект.',
    fa: 'کیفیت و زمان‌بندی را در هر مرحله کنترل می‌کنیم — از برش اسلب تا نصب نهایی در محل پروژه.',
  },
  'why.card4.title': { ru: 'Премиум-исполнение', en: 'Premium craftsmanship', tg: 'Иҷрои премиум', fa: 'اجرای پریمیوم' },
  'why.card4.text': {
    ru: 'Ателье-подход и внимание к деталям на уровне частных резиденций и клубных домов.',
    en: 'An atelier approach and attention to detail at the level of private residences and club houses.',
    tg: 'Равиши ателье ва диққат ба тафсилот дар сатҳи резиденсияҳои хусусӣ ва хонаҳои клубӣ.',
    fa: 'رویکرد استودیویی و توجه به جزئیات در سطح رزیدنس‌های خصوصی و خانه‌های باشگاهی.',
  },

  'contacts.eyebrow': { ru: 'Контакты', en: 'Contacts', tg: 'Тамос', fa: 'تماس' },
  'contacts.socialAria': { ru: 'Открыть {platform}', en: 'Open {platform}', tg: 'Кушодани {platform}', fa: 'باز کردن {platform}' },

  'contact.type.stone': { ru: 'Натуральный камень', en: 'Natural stone', tg: 'Санги табиӣ', fa: 'سنگ طبیعی' },
  'contact.type.doors': { ru: 'Элитные двери', en: 'Premium doors', tg: 'Дарҳои элитӣ', fa: 'درهای لوکس' },
  'contact.type.windows': { ru: 'Окна', en: 'Windows', tg: 'Тирезаҳо', fa: 'پنجره‌ها' },
  'contact.type.elevators': { ru: 'Лифты', en: 'Elevators', tg: 'Лифтҳо', fa: 'آسانسورها' },
  'contact.type.complex': { ru: 'Комплексный проект', en: 'Complex project', tg: 'Лоиҳаи комплексӣ', fa: 'پروژه جامع' },

  'contact.nameRequired': { ru: 'Пожалуйста, укажите имя.', en: 'Please provide your name.', tg: 'Лутфан номро нишон диҳед.', fa: 'لطفاً نام خود را وارد کنید.' },
  'contact.phoneRequired': { ru: 'Пожалуйста, укажите телефон.', en: 'Please provide a phone number.', tg: 'Лутфан рақами телефонро нишон диҳед.', fa: 'لطفاً شماره تلفن خود را وارد کنید.' },
  'contact.successTitle': { ru: 'Заявка отправлена', en: 'Request sent', tg: 'Дархост фиристода шуд', fa: 'درخواست ارسال شد' },
  'contact.successMessage': {
    ru: 'Мы получили вашу заявку и свяжемся с вами в ближайшее время.',
    en: 'We have received your request and will contact you shortly.',
    tg: 'Мо дархости шуморо гирифтем ва дар вақти наздик бо шумо тамос мегирем.',
    fa: 'درخواست شما دریافت شد و به‌زودی با شما تماس خواهیم گرفت.',
  },
  'contact.clearForm': { ru: 'Очистить форму', en: 'Clear form', tg: 'Тоза кардани форма', fa: 'پاک کردن فرم' },
  'contact.nameLabel': { ru: 'Имя', en: 'Name', tg: 'Ном', fa: 'نام' },
  'contact.namePlaceholder': { ru: 'Как к вам обращаться', en: 'How should we address you', tg: 'Чӣ тавр муроҷиат кунем', fa: 'نام شما' },
  'contact.phoneLabel': { ru: 'Телефон', en: 'Phone', tg: 'Телефон', fa: 'تلفن' },
  'contact.emailLabel': { ru: 'Email', en: 'Email', tg: 'Email', fa: 'ایمیل' },
  'contact.interestLabel': { ru: 'Интересует', en: 'Interested in', tg: 'Ҷолиб аст', fa: 'علاقه‌مند به' },
  'contact.messageLabel': { ru: 'О проекте', en: 'About the project', tg: 'Дар бораи лоиҳа', fa: 'درباره پروژه' },
  'contact.messagePlaceholder': { ru: 'Объект, объём, сроки', en: 'Property, scope, timeline', tg: 'Объект, ҳаҷм, мӯҳлат', fa: 'پروژه، حجم کار، زمان‌بندی' },
  'contact.submitting': { ru: 'Отправка…', en: 'Sending…', tg: 'Фиристодан…', fa: 'در حال ارسال…' },
  'contact.submit': { ru: 'Отправить заявку', en: 'Send request', tg: 'Фиристодани дархост', fa: 'ارسال درخواست' },
  'contact.disclaimer': {
    ru: 'Нажимая кнопку, вы соглашаетесь на обработку персональных данных.',
    en: 'By clicking the button, you agree to the processing of your personal data.',
    tg: 'Бо пахш кардани тугма, шумо бо коркарди маълумоти шахсии худ розӣ мешавед.',
    fa: 'با کلیک روی دکمه، با پردازش اطلاعات شخصی خود موافقت می‌کنید.',
  },
  'contact.errorTitle': { ru: 'Не удалось отправить заявку', en: 'Failed to send the request', tg: 'Дархост фиристода нашуд', fa: 'ارسال درخواست ناموفق بود' },
  'contact.errorMessage': {
    ru: 'Проверьте подключение к интернету и попробуйте ещё раз, либо свяжитесь с нами напрямую по телефону или в мессенджере.',
    en: 'Check your internet connection and try again, or contact us directly by phone or messenger.',
    tg: 'Пайвастшавии интернетро санҷед ва аз нав кӯшиш кунед, ё бевосита бо мо тавассути телефон ё мессенҷер тамос гиред.',
    fa: 'اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید، یا مستقیماً از طریق تلفن یا پیام‌رسان با ما تماس بگیرید.',
  },

  'lang.ariaLabel': { ru: 'Выбор языка', en: 'Language selection', tg: 'Интихоби забон', fa: 'انتخاب زبان' },
} as const;

export type UIStringKey = keyof typeof STRINGS;

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

// Reads the dictionary above for the current language, falling back to ru
// (never to English) since ru is this site's actual source-of-truth
// language, matching the same requested→ru fallback the API-backed content
// already uses.
export function useT(language: LanguageCode) {
  return useMemo(() => {
    return (key: UIStringKey, vars?: Record<string, string | number>) => {
      const entry = STRINGS[key];
      const template = entry[language] ?? entry.ru;
      return interpolate(template, vars);
    };
  }, [language]);
}
