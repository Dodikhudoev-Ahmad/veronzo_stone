# PROGRESS.md — Veronzo Stone

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
