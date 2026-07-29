# Veronzo Roadmap

- docs/ROADMAP.md — единственный источник истины по Stage.
- docs/PROGRESS.md хранит фактический прогресс и отчёты.
- git log подтверждает реализацию, но не заменяет roadmap.
- Claude не имеет права придумывать новые Stage без обновления этого документа.

## Статусы

- COMPLETED — завершено и зафиксировано
- IN PROGRESS — текущая работа
- PLANNED — запланировано
- BLOCKED — требует решения

## Stage 0 — Resend email migration
Status: COMPLETED

- заменить SMTP на Resend;
- сохранить работу contact form;
- Railway-compatible email delivery.

## Stage 1 — Content domain models and seeding
Status: COMPLETED

- Category;
- Product;
- PortfolioItem;
- SiteContent;
- HeroStat;
- SocialLink;
- ContactInfo;
- SeoMeta;
- idempotent seeding;
- AddCatalogContent migration.

## Stage 2 — Admin authentication
Status: COMPLETED

- AdminUser;
- RefreshToken;
- login;
- refresh;
- logout;
- me;
- JWT;
- CSRF-safe refresh flow;
- first admin seeding.

## Stage 3 — Admin CRUD API
Status: COMPLETED

- Categories;
- Products;
- Portfolio;
- SiteContent;
- HeroStats;
- SocialLinks;
- ContactInfo;
- SeoMeta.

## Stage 4 — API refinements
Status: COMPLETED

- pagination;
- search;
- sorting;
- filters;
- consistent error envelopes;
- audit logging;
- rate limiting;
- ContactRequest status.

## Stage 5 — React admin foundation
Status: COMPLETED

- React 19;
- TypeScript;
- Vite;
- routes;
- authentication flow;
- shared UI components;
- API client;
- theme.

## Stage 6 — Dashboard and Categories
Status: COMPLETED

- KPI dashboard;
- Categories CRUD;
- pagination;
- sorting;
- search;
- validation;
- delete conflict handling.

## Stage 7 — Products management
Status: COMPLETED

- Products CRUD;
- category filter;
- pagination;
- image preview;
- validation;
- visibility management.

## Stage 8 — Portfolio management
Status: COMPLETED

- Portfolio CRUD;
- featured filter;
- pagination;
- sorting;
- image preview;
- visibility management.

## Stage 9 — SiteContent management
Status: COMPLETED

- admin CRUD/UI for SiteContent;
- validation;
- loading, empty and error states.

## Stage 10 — HeroStats management
Status: COMPLETED

- admin CRUD/UI for HeroStats;
- visibility;
- sorting;
- validation.

## Stage 11 — SocialLinks management
Status: COMPLETED

- admin CRUD/UI for SocialLinks;
- validation;
- ordering.

## Stage 12 — ContactInfo management
Status: COMPLETED

- admin CRUD/UI for ContactInfo;
- label/value management;
- ordering;
- visibility.

## Stage 13 — SeoMeta management
Status: COMPLETED

- admin CRUD/UI for SeoMeta;
- title;
- description;
- canonical;
- Open Graph metadata.

## Stage 14 — Multilingual backend architecture
Status: COMPLETED

- SupportedLanguages;
- ru, tg, en, zh;
- language normalization;
- translation entities;
- CategoryTranslation;
- ProductTranslation;
- PortfolioItemTranslation;
- GalleryItemTranslation;
- SiteContentTranslation;
- HeroStatTranslation;
- SeoMetaTranslation;
- ContactInfo label translation;
- fallback to Russian;
- unique ParentId + LanguageCode indexes.

## Stage 15 — Translation management UI
Status: COMPLETED

- admin interface for managing translations;
- supported language selector;
- translation forms;
- fallback behavior;
- validation;
- multilingual CRUD integration.

Примечание:
после Stage 15 были добавлены временные production login diagnostics.
Это не отдельный Stage.
Они должны быть удалены после завершения диагностики.

## Stage 16 — Production authentication cleanup
Status: COMPLETED

- определить причину production login failure;
- проверить adminFound;
- проверить IsActive;
- проверить password verification result;
- удалить временные login diagnostics;
- удалить временные reset-переменные после успешного восстановления;
- подтвердить production login;
- проверить logout/refresh/me;
- убедиться, что секреты не попадают в логи.

Definition of Done:

- production login работает;
- refresh работает;
- logout работает;
- /me работает;
- diagnostic logging удалён;
- временные reset environment variables больше не требуются;
- build проходит;
- review passed.

## Stage 17 — Public API for dynamic content
Status: COMPLETED

- read-only public endpoints;
- categories;
- products;
- portfolio;
- site content;
- hero stats;
- social links;
- contact info;
- SEO;
- language query/header support;
- Russian fallback;
- visible-only records;
- caching strategy.

## Stage 18 — Public frontend migration to React
Status: COMPLETED

- перенести публичный сайт в React;
- сохранить текущий дизайн;
- сохранить SEO;
- сохранить accessibility;
- сохранить responsive behavior;
- получать контент из API;
- public site остаётся без login.

## Stage 19 — New catalog architecture
Status: COMPLETED

- отдельные страницы категорий;
- category slug routes;
- product listing;
- product detail structure;
- filters where justified;
- loading, empty and error states;
- multilingual catalog content.

## Stage 20 — Windows category
Status: COMPLETED

- добавить категорию Окна;
- slug windows;
- sort order 4;
- минимум один Product;
- минимум один PortfolioItem;
- изображения AVIF/WebP;
- обновить тексты с трёх направлений на четыре;
- добавить Окна в contact form;
- обновить footer/catalog/navigation.

## Stage 21 — Brand and visual modernization
Status: COMPLETED (logo replacement only — see docs/PROGRESS.md)

- новый логотип;
- обновлённая visual identity;
- улучшение UI/UX;
- единая дизайн-система;
- адаптация admin/public UI;
- без потери узнаваемости бренда.

## Stage 22 — Production readiness
Status: COMPLETED (code/docs items only — see docs/PROGRESS.md for what's deliberately left open)

- sitemap.xml;
- robots.txt;
- canonical URLs;
- Open Graph;
- structured data;
- image optimization;
- accessibility audit;
- security audit;
- rate-limit review;
- backup strategy;
- database recovery instructions;
- Railway/Netlify environment documentation;
- smoke tests;
- final production checklist.

## Stage 23a — Product attribute/filter backend
Status: COMPLETED

- ProductAttributeDefinition/Option/Value entities + migration;
- admin CRUD endpoints для definitions/options/values;
- public filter-metadata endpoint (categorySlug → filterable attributes);
- whitelist-based dynamic filtering на GET /api/public/products;
- backward compatibility текущих Product endpoints;
- idempotent seed данные для Stone/Doors/Lifts/Windows attributes;
- backend tests для фильтрации.

## Stage 23b — Admin attribute management
Status: COMPLETED

- /admin/product-attributes: управление ProductAttributeDefinition/Option по категориям;
- create/edit/delete definition (key/name/sortOrder/isFilterable/isVisible) + translations ru/tg/en/zh;
- create/edit/delete option (value/label/sortOrder/isVisible) + translations ru/tg/en/zh;
- интеграция с Product create/edit: подстановка характеристик выбранной категории, сохранение ProductAttributeValue;
- Sidebar: пункт «Характеристики»;
- публичный каталог в этом этапе не меняется.

## Stage 23c — Public filters integration
Status: COMPLETED

- CatalogCategoryPage: получать filter definitions через GET /api/public/product-attributes?categorySlug=;
- динамический filter UI (checkbox list / collapsible list в зависимости от количества значений), без hardcoded фильтров;
- состояние фильтров в URL query params (комма-разделённые значения на ключ), поддержка back/forward/reload/share URL;
- передача фильтров в существующий GET /api/public/products без изменения backend;
- количество найденных товаров, loading skeleton, empty/error state, «Очистить фильтры», плавное обновление без перезагрузки;
- responsive: sidebar (desktop) / кнопка «Фильтры» → drawer → «Применить» (mobile/tablet);
- accessibility: label/fieldset/keyboard/focus-visible/aria-expanded/aria-controls;
- не ломать language switch, SEO, breadcrumbs, product cards, анимации.

## Stage 23d — Premium catalog category-page redesign
Status: COMPLETED

- category hero (существующее изображение категории/fallback, eyebrow, название, описание);
- product grid: 3/2/1 колонки, стабильный aspect-ratio, hover, без hardcoded technical keys;
- визуальная полировка FilterPanel/FilterDrawer (иерархия, sticky, active count, кнопка очистки) без изменения логики Stage 23c;
- loading skeleton по геометрии карточек, empty state с кнопкой очистки фильтров, error state с retry;
- сдержанные анимации (entrance reveal, hover scale, stagger, смена результатов) с prefers-reduced-motion;
- responsive QA: 1440/1024/768/430/375;
- backend, API contracts, URL filter semantics, admin frontend, auth, translations architecture не меняются.

## Stage 23e — Product detail redesign & catalog QA
Status: COMPLETED

- public product detail редизайн (gallery, attributes table, related products);
- route transition анимация;
- frontend tests (URL params, reset, empty state, mobile filter UI);
- data repair тестовых переводов ("Stone (test v2)", "Elevators v2").

## Stage 23f — Public site visual polish pass
Status: SUPERSEDED — merged into Stage 24 (раздел 2, по решению пользователя)

Только визуальная полировка публичного сайта, без изменения логики:
- типографика;
- отступы и композиция;
- микроанимации кнопок и карточек;
- hover-эффекты;
- улучшение карточек товаров;
- плавные переходы между состояниями;
- цвета, тени, контраст;
- hero-блоки;
- единый визуальный язык всего сайта.

Не менять: backend, API, бизнес-логику, маршрутизацию, систему (аналогично ограничениям Stage 23d).

## Stage 24 — Production Readiness, Final Polish & Release Audit
Status: COMPLETED

Цель: довести проект до уровня коммерческого production-ready продукта. Новые крупные функции не добавляются.

1. **Languages** — поддерживаемые языки: ru, tg, en, fa (полный отказ от zh). Проверка Category/Product/Portfolio/Hero/Site Content/SEO/Gallery/Product Attributes; удаление test/v2/demo/placeholder/временных строк; fallback ru → без 500 и пустых строк.
2. **Public UI Polish** (поглощает Stage 23f) — Home/Category/Product Detail/Portfolio/Contact/404: spacing, typography, hierarchy, hover, buttons, cards, forms, hero, breadcrumbs, transitions, mobile spacing, focus states, shadows, colors. Без изменения архитектуры/бренда/responsive.
3. **Final UX Audit** — сценарий Главная→Каталог→Фильтр→Товар→Назад→Другая категория→Портфолио→Контакты; back/forward/reload/deep links/share URL; loading/error/empty/skeleton.
4. **Accessibility** — keyboard, tab order, focus-visible, aria, labels, contrast, screen reader basics, prefers-reduced-motion.
5. **SEO** — title, meta description, canonical, OpenGraph, Twitter, robots, sitemap, structured data, favicon, lang, hreflang.
6. **Performance** — CLS, LCP, lazy loading, image sizes, cache, bundle, лишние re-render.
7. **Production Audit** — console.error/warn/log, React warnings, TS/ESLint ошибки, битые ссылки/изображения, localhost URL, тестовые данные, TODO/FIXME/DEBUG.
8. **Security** — admin routes, JWT, refresh, cookies, CORS, headers, утечка информации в ошибках.
9. **Browser QA** — Chrome/Safari/Firefox × Desktop/Tablet/Mobile.
10. **Deployment Readiness** — Railway, Netlify, production env, API URL, CORS, build, migration, seed.

Не менять: backend-архитектуру, API, database schema (без критической необходимости). Не commit/push.
