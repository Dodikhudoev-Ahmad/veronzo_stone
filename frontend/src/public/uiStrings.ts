// Fixed UI-chrome strings (nav labels, button text, form labels, empty/error
// states, ...) that were previously hardcoded Russian JSX text with no path
// to translation at all -- unlike hero/about/contacts copy, these aren't
// admin-editable "content" (no business reason to expose "Loading…" in the
// admin panel), so they live in a static dictionary here rather than going
// through the SiteContent API. The public site is Russian-only — see
// useLanguage.ts's removal note for why no other language lives here.
const STRINGS = {
  'nav.about': 'О компании',
  'nav.catalog': 'Каталог',
  'nav.portfolio': 'Портфолио',
  'nav.why': 'Почему мы',
  'nav.contacts': 'Контакты',
  'nav.consultation': 'Консультация',
  'nav.menu': 'Меню',

  'footer.rights': 'Все права защищены.',

  'breadcrumb.aria': 'Хлебные крошки',
  'breadcrumb.home': 'Главная',

  'loading': 'Загрузка…',
  'retry': 'Повторить попытку',

  'hero.ctaPrimary': 'Смотреть каталог',
  'hero.ctaSecondary': 'Заявка на консультацию',
  'hero.imageAlt': 'Чёрный мрамор Nero Marquina',

  'catalog.eyebrow': 'Каталог',
  'catalog.heading': 'Материалы и инженерные решения в одной системе',
  'catalog.unavailable': 'Каталог временно недоступен.',

  'stones.heading': 'Камень, который задаёт тон интерьеру',
  'stones.description':
    'Мрамор, кварц, гранит, травертин, оникс и полудрагоценный камень подобраны для разных сценариев: от спокойной облицовки до акцентных деталей.',
  'stones.cta': 'Каталог камня →',

  'catalog.loadProductsError': 'Не удалось загрузить товары. Проверьте соединение и попробуйте ещё раз.',
  'catalog.categoryEmpty': 'В этой категории пока нет товаров.',

  'product.notFound': 'Товар не найден. Возможно, он был снят с публикации.',
  'product.loadError': 'Не удалось загрузить товар. Проверьте соединение и попробуйте ещё раз.',
  'product.imagesAria': 'Изображения товара',
  'product.imageLabel': 'Изображение {n}',
  'product.related': 'Похожие товары',
  'product.requestPrice': 'Запросить цену',
  'product.requestPriceAria': 'Запросить цену: {title}',

  'notfound.message': 'Страница не найдена. Возможно, ссылка устарела или адрес введён с ошибкой.',
  'notfound.cta': 'На главную',

  'about.eyebrow': 'О компании',
  'about.tag1': 'Проектирование и BIM',
  'about.tag2': 'Собственное производство',
  'about.tag3': 'Монтаж и шеф-надзор',
  'about.imageAlt': 'Мастерская обработки камня',

  'portfolio.eyebrow': 'Портфолио',
  'portfolio.heading': 'Объекты, которыми мы гордимся',
  'portfolio.loadError': 'Не удалось загрузить портфолио. Попробуйте обновить страницу или свяжитесь с нами напрямую.',
  'portfolio.empty': 'Портфолио скоро пополнится новыми объектами.',

  'why.eyebrow': 'Почему мы',
  'why.card1.title': 'Единый подрядчик',
  'why.card1.text': 'Камень, двери и лифты в одном контракте — без стыковочных ошибок между бригадами разных компаний.',
  'why.card2.title': 'Язык проекта',
  'why.card2.text': 'Работаем с чертежами, BIM-моделями и спецификациями. Понимаем архитектора и дизайнера с полуслова.',
  'why.card3.title': 'Собственное производство',
  'why.card3.text': 'Контролируем качество и сроки на каждом этапе — от раскроя слэба до финального монтажа на объекте.',
  'why.card4.title': 'Премиум-исполнение',
  'why.card4.text': 'Ателье-подход и внимание к деталям на уровне частных резиденций и клубных домов.',

  'contacts.eyebrow': 'Контакты',
  'contacts.socialAria': 'Открыть {platform}',

  'contact.type.stone': 'Натуральный камень',
  'contact.type.doors': 'Элитные двери',
  'contact.type.windows': 'Окна',
  'contact.type.elevators': 'Лифты',
  'contact.type.complex': 'Комплексный проект',

  'contact.nameRequired': 'Пожалуйста, укажите имя.',
  'contact.phoneRequired': 'Пожалуйста, укажите телефон.',
  'contact.successTitle': 'Заявка отправлена',
  'contact.successMessage': 'Мы получили вашу заявку и свяжемся с вами в ближайшее время.',
  'contact.clearForm': 'Очистить форму',
  'contact.nameLabel': 'Имя',
  'contact.namePlaceholder': 'Как к вам обращаться',
  'contact.phoneLabel': 'Телефон',
  'contact.emailLabel': 'Email',
  'contact.interestLabel': 'Интересует',
  'contact.messageLabel': 'О проекте',
  'contact.messagePlaceholder': 'Объект, объём, сроки',
  'contact.submitting': 'Отправка…',
  'contact.submit': 'Отправить заявку',
  'contact.disclaimer': 'Нажимая кнопку, вы соглашаетесь на обработку персональных данных.',
  'contact.errorTitle': 'Не удалось отправить заявку',
  'contact.errorMessage':
    'Проверьте подключение к интернету и попробуйте ещё раз, либо свяжитесь с нами напрямую по телефону или в мессенджере.',
} as const;

export type UIStringKey = keyof typeof STRINGS;

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

// No language argument — the public site is Russian-only (see
// useLanguage.ts's removal note). Kept as a function (not a bare lookup)
// so call sites didn't need to change their `ui('key', vars)` call shape.
export function useT() {
  return (key: UIStringKey, vars?: Record<string, string | number>) => interpolate(STRINGS[key], vars);
}
