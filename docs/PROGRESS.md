# PROGRESS.md — Veronzo Stone

# Current Project Status

- Last completed Stage: 22 (Stage 0–22 roadmap now fully COMPLETED)
- Current Stage: none
- Next planned Stage: none — roadmap exhausted, awaiting new Stage definition in ROADMAP.md
- Official roadmap: docs/ROADMAP.md
- Stage 16: production login/refresh/logout/me confirmed working; diagnostic logging and temporary reset env vars removed (commit 588f0b0)
- Stage 17: public read-only endpoints (categories/products/portfolio/gallery/site-content/hero-stats/social-links/contact-info/seo-meta) existed from earlier work; this pass added Accept-Language header fallback (query ?lang= still takes precedence) and a 60s OutputCache policy varying by lang/categorySlug/Accept-Language
- Stage 18: public site ported into `frontend/src/public/` (React, consumes `/api/public/*`), mounted at `/*` alongside AdminRouter at `/admin/*` in App.tsx. Design/CSS/assets copied verbatim from root `css/style.css`+`assets/`; catalog card blurbs/images and "why us" cards stay static (no backing model field) while name/hero-stats/portfolio/social-links/contact-info/site-content text/SEO title+description are API-driven. Root `index.html`/`css/`/`js/` and Netlify config left untouched — switching production to the new build is a Netlify config change reserved for the user. Hero-stat count-up animation from the old main.js was dropped (decorative only)
- Stage 19: added `/catalog/:categorySlug` (product grid, client-side search filter, loading/empty/error states) and `/catalog/:categorySlug/:productId` (product detail; no single-product public endpoint exists yet, so it reuses the category's product list and picks by Id, sharing react-query's cache). Added a localStorage-backed language switcher (`useLanguage`) in the shared header, wired into `?lang=` for categories/products — homepage's other sections stay ru-only for now (out of this stage's scope). Extracted `SiteHeader`/`SiteFooter` out of PublicHomePage for reuse across pages (DRY)
- Stage 22: added `frontend/public/robots.txt` + hand-authored `sitemap.xml` (home + 4 category pages; product URLs deliberately excluded — too dynamic for a static file); canonical URL + per-page `<title>` via new `frontend/src/public/seo.ts` on all 3 public routes; JSON-LD structured data (`Organization` on home, `Product` on detail pages); added a `/api/contact` rate-limit policy (3/5min per IP — was previously unthrottled); documented backup/recovery (manual, no automation yet) and a production checklist in `backend/README.md`. Deliberately NOT done: automated smoke tests (no test project exists — adding one is a bigger decision than this stage's scope), deep accessibility/security audit tooling (axe/Lighthouse/pen-test), and any Railway/Netlify env var changes (reserved for the user per project safety rules)
- Stage 21: scoped to logo replacement only (user declined the broader visual-identity/UI-UX/design-system rework — that remains open, not started). `assets/images/FINAL LOGO copy.pdf` (vector VERONZO wordmark, user-supplied) rasterized via PyMuPDF into `logo-veronzo.png` (dark, for light backgrounds) and `logo-veronzo-white.png` (white, for dark backgrounds), cropped/trimmed, copied to `frontend/public/assets/images/`. Replaced the text "VERONZO" wordmark with the image in: public SiteHeader, SiteFooter, homepage contacts panel (all white — those backgrounds are dark), admin Sidebar (white) and LoginPage (dark, light background). Root legacy index.html's 3 text-wordmark instances left untouched (superseded static site, not maintained per Stage 18 decision)
- Stage 20: "Окна" category (slug `windows`, sortOrder 4) flipped to IsVisible=true with a placeholder Product and PortfolioItem — **no real photos/copy supplied**, so both reuse an existing photo (doors/Lumière) and generic (non-fabricated) copy; user explicitly chose "use placeholders" over blocking. Replace `Product.ImageUrl`/`Description` and add a real `PortfolioItem` photo via the admin CMS once real assets exist. "три"→"четыре" wording updated in `catalog.sectionNote`/`about.paragraph1` seed defaults and the React fallback text — **this only affects fresh databases**; any already-seeded dev/production DB keeps the old wording until an admin edits it via the SiteContent CMS page (Stage 9), since idempotent seeding never overwrites existing rows. "Окна" added to the contact form's type dropdown

## Статус: разработка backend для формы (.NET)

### Phase 0 — Аудит (сделано)
- [x] Визуальный обзор всех секций сайта (hero → каталог → о компании → портфолио → форма → footer)
- [x] Дизайн-оценка: премиальная тёмная тема держится стабильно, но секции однотипны

### Phase 1 — .NET backend для формы (текущий, следующий шаг)
- [x] Создать минимальный ASP.NET Core Web API проект (Program.cs, minimal API) — `backend/VeronzoApi`, .NET 10
- [x] Endpoint POST /api/contact — имя/телефон/email/материал/описание проекта
- [x] Валидация (FluentValidation) — `Validators/ContactRequestValidator.cs`
- [x] Отправка заявки: решено — оба варианта: сохранение в SQLite (`ContactRequests`, EF Core, миграция `InitialCreate`) + email-уведомление
- [x] Исправлена блокировка ответа на ~2 мин из-за синхронного ожидания email-отправки: сохранение в БД остаётся синхронным, email теперь уходит в фоновую очередь (`IEmailNotificationQueue` + `EmailNotificationBackgroundService`, Channel-based) — `POST /api/contact` отвечает сразу после записи в БД; ошибка отправки только логируется и не влияет на response
- [x] **Переход с SMTP (MailKit) на Resend API** — Railway блокирует исходящий SMTP на текущем плане (`TimeoutException` при коннекте), поэтому `Services/SmtpEmailSender.cs` заменён на `Services/ResendEmailSender.cs`: HTTP POST на `https://api.resend.com/emails` с `Authorization: Bearer {ApiKey}`, JSON-тело (from/to/reply_to/subject/text). Сигнатура `IEmailSender.SendContactNotificationAsync` не менялась — вызывающий код (`EmailNotificationBackgroundService`) не тронут. API-ключ читается из `Resend:ApiKey` (`Resend__ApiKey` в env). Пакет MailKit/MimeKit удалён из `.csproj`, `SmtpEmailSender.cs`/`SmtpOptions.cs` удалены. Старые ключи `Smtp:*` оставлены в `appsettings.json` с пометкой `_comment_Smtp_deprecated` (не используются, безопасно убрать позже вместе с env vars в Railway). Проверено локально против мок-HTTP-сервера: запрос/заголовки/JSON-тело корректны, `POST /api/contact` по-прежнему отвечает быстро, ошибка от Resend (протестирован 401) логируется и не роняет запрос. **Осталось**: добавить реальный `Resend__ApiKey` в Railway и убрать старые `Smtp__*` переменные оттуда
- [x] CORS — разрешён домен veronzotj.netlify.app (настраивается через `Cors:AllowedOrigins` в appsettings)
- [x] Деплой выбран: Railway. Конфиг готов — `backend/VeronzoApi/Dockerfile`, `railway.json`, `backend/README.md` (пошаговая инструкция: root directory, env vars, volume для SQLite, домен). Сам деплой (создание проекта, подключение репо, ввод SMTP-креденшлов) выполняет пользователь — агент не имеет доступа к Railway-аккаунту
- [x] fetch() подключён в `js/main.js` (`CONTACT_API_URL`, обработка успеха/ошибки, disable кнопки на время отправки) — проверено в реальном браузере (Playwright) на локальном API: успешная отправка показывает "Заявка отправлена" и очищает форму, недоступность API показывает блок ошибки. **Осталось**: заменить плейсхолдер `CONTACT_API_URL` на реальный домен после генерации в Railway
- [x] Логика реальной отправки email проверена — SMTP-путь (MailKit/Ethereal test-inbox) технически исправен; сама доставка не подтверждена из песочницы (исходящие OCSP/CRL-проверки сертификата заблокированы в этой среде — не проблема кода, на Railway отработает). Финальную проверку "письмо дошло" нужно сделать после деплоя на реальных SMTP-креденшлах

### Phase 2 — Визуальные улучшения
- [ ] Разбить однообразие секций — добавить минимум 1 акцентную полноэкранную секцию (крупные фото материала)
- [ ] Добавить крупные фото текстуры камня/дверей (не только иконки/миниатюры)
- [ ] Проверить контраст текста на фото-тонах во всех секциях (особенно hero и портфолио)
- [ ] Залить реальный скриншот в README вместо плейсхолдера

### Отложено
- Ничего не отложено пока

## Правила обновления
- После каждого выполненного пункта — отмечать [x] и коммитить
- Новые найденные проблемы — сразу добавлять в соответствующую фазу, не забывать
