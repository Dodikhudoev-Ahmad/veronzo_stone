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
Status: IN PROGRESS

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
Status: PLANNED

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
Status: PLANNED

- перенести публичный сайт в React;
- сохранить текущий дизайн;
- сохранить SEO;
- сохранить accessibility;
- сохранить responsive behavior;
- получать контент из API;
- public site остаётся без login.

## Stage 19 — New catalog architecture
Status: PLANNED

- отдельные страницы категорий;
- category slug routes;
- product listing;
- product detail structure;
- filters where justified;
- loading, empty and error states;
- multilingual catalog content.

## Stage 20 — Windows category
Status: PLANNED

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
Status: PLANNED

- новый логотип;
- обновлённая visual identity;
- улучшение UI/UX;
- единая дизайн-система;
- адаптация admin/public UI;
- без потери узнаваемости бренда.

## Stage 22 — Production readiness
Status: PLANNED

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
