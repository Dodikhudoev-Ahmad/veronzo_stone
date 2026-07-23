# Veronzo API — деплой на Railway

## 1. Создать проект в Railway
- New Project → Deploy from GitHub repo → выбрать `veronzo_stone`
- В настройках сервиса: **Settings → Root Directory** = `backend/VeronzoApi`
- Билдер определится автоматически по `railway.json` (Dockerfile)

## 2. Переменные окружения (Settings → Variables)
| Переменная | Значение |
|---|---|
| `ConnectionStrings__Default` | не задавать — при наличии volume путь строится автоматически из `RAILWAY_VOLUME_MOUNT_PATH` |
| `Cors__AllowedOrigins__0` | `https://veronzotj.netlify.app` |
| `Resend__ApiKey` | API-ключ из [resend.com](https://resend.com) (Dashboard → API Keys) |
| `Resend__FromAddress` | адрес отправителя, например `no-reply@veronzo.ru` (домен должен быть подтверждён в Resend) |
| `Resend__FromName` | `Veronzo — сайт` |
| `Resend__NotifyToAddress` | куда присылать уведомления о заявках |
| `Jwt__Secret` | **обязательно в production** — случайная строка ≥32 символов для подписи JWT. Приложение откажется стартовать в Production без неё (или если она короче 32 символов) |
| `Jwt__Issuer` | опционально, по умолчанию `veronzo-api` |
| `Jwt__Audience` | опционально, по умолчанию `veronzo-admin` |
| `Jwt__AccessTokenMinutes` | опционально, по умолчанию `15` |
| `Jwt__RefreshTokenDays` | опционально, по умолчанию `30` |
| `DEFAULT_ADMIN_EMAIL` | email первого администратора — используется один раз при старте, только если в БД ещё нет ни одного администратора |
| `DEFAULT_ADMIN_PASSWORD` | пароль первого администратора — используется один раз при старте, только если в БД ещё нет ни одного администратора. Хранится только как хеш (`PasswordHasher<AdminUser>`), никогда не логируется |
| `ForwardedHeaders__KnownProxies__0` | опционально — реальный IP прокси Railway перед контейнером, если известен. Без него `X-Forwarded-For` не доверяется (см. раздел 2c) |
| `ForwardedHeaders__KnownNetworks__0` | опционально — CIDR-диапазон прокси Railway (`IP/prefixLength`), альтернатива `KnownProxies` для диапазона адресов |

> Раньше здесь были `Smtp__*` переменные (MailKit/SMTP) — Railway блокирует исходящий SMTP на нашем плане, поэтому отправка переведена на Resend HTTP API. Если старые `Smtp__*` переменные ещё стоят в Railway — их можно удалить, код их больше не читает.

## 2a. Создание первого администратора

При старте приложения, если в таблице `AdminUsers` ещё нет ни одной записи:
- если заданы `DEFAULT_ADMIN_EMAIL` и `DEFAULT_ADMIN_PASSWORD` — создаётся администратор с этим email/паролем (пароль хешируется, plaintext нигде не сохраняется и не логируется);
- если хотя бы одна из переменных не задана — создание пропускается, в лог пишется предупреждение; повторный старт с уже заданными переменными создаст администратора на следующем запуске.

Повторный запуск **не меняет** пароль уже существующего администратора — переменные `DEFAULT_ADMIN_*` читаются только один раз, при первом создании записи. Смена пароля существующего администратора через эти переменные не поддерживается — это задача будущего этапа (admin CRUD/UI).

## 2b. Auth endpoints

| Endpoint | Назначение |
|---|---|
| `POST /api/auth/login` | вход по email/паролю, ограничен rate limiting (5 запросов/мин с одного IP). Возвращает access token (JWT, `AccessTokenMinutes` минут) в теле ответа и refresh token в `HttpOnly` cookie (`refreshToken`, scope `/api/auth`) |
| `POST /api/auth/refresh` | обновление пары токенов по refresh-cookie (rotation: старый токен атомарно помечается использованным, выдаётся новый — см. ниже). Повторное использование уже (заранее) отозванного refresh-токена трактуется как возможная компрометация — отзываются все активные сессии администратора. Требует заголовок `X-CSRF-Token` при cookie-flow (см. раздел 2c) |
| `POST /api/auth/logout` | отзывает переданный refresh token и очищает cookie. Требует заголовок `X-CSRF-Token` при cookie-flow |
| `GET /api/auth/me` | требует `Authorization: Bearer <access token>` с ролью `Admin`, возвращает текущего администратора |

Cookie `refreshToken` выставляется с `Secure=true` и `SameSite=None` вне Development (необходимо для cross-site связки Netlify↔Railway); в Development — `Secure=false`/`SameSite=Lax`, чтобы локальный `dotnet run` по обычному HTTP работал без дополнительной настройки.

`RefreshTokenRequest.RefreshToken` (тело запроса) — запасной путь только для non-browser клиентов, которые не могут полагаться на cookies; refresh token в JSON-теле ответа никогда не возвращается. Браузерный клиент должен всегда использовать cookie-flow.

## 2c. CSRF-защита refresh/logout

Поскольку в production refresh-cookie выставляется с `SameSite=None` (нужно для cross-site Netlify↔Railway), `/api/auth/refresh` и `/api/auth/logout` требуют произвольный непустой заголовок `X-CSRF-Token` при cookie-flow (когда в запросе присутствует cookie `refreshToken`). Без заголовка — `403`.

Значение заголовка не обязано быть секретом: защита строится на том, что кастомный заголовок вынуждает браузер сделать CORS preflight, а недоверенный origin не проходит его (CORS ограничен явно заданными `Cors:AllowedOrigins`, `AllowAnyOrigin` не используется). **Будущий React-клиент должен отправлять `X-CSRF-Token: 1`** (или любое непустое значение) с каждым запросом на `/api/auth/refresh` и `/api/auth/logout`.

`/api/auth/login` этого заголовка не требует — до успешного логина refresh-cookie ещё не существует, CSRF на него не распространяется.

## 2d. Атомарная rotation refresh-токена

`/api/auth/refresh` использует `ExecuteUpdateAsync` — прямое условное `UPDATE RefreshTokens SET RevokedAt = @now WHERE Id = @id AND RevokedAt IS NULL`, а не read-modify-write через EF change tracker. Это гарантирует, что при двух параллельных запросах с одним и тем же токеном ровно один получит `200` (обновит строку), а второй — `401` (`"Refresh token already used"`, 0 затронутых строк), без создания лишней "осиротевшей" сессии. Reuse-detection (отзыв всех активных сессий администратора) срабатывает только если токен был отозван **до** начала обработки текущего запроса — то есть при повторном использовании токена, отозванного заметно раньше, а не при проигрыше обычной гонки параллельных запросов. Подход не зависит от конкретной СУБД (работает одинаково на SQLite и на любой будущей production-БД), так как опирается на обычную атомарность `UPDATE ... WHERE`, а не на специфику SQLite.

## 2e. Forwarded headers и rate limiting за Railway

Rate limiting (`/api/auth/login`, `/api/auth/refresh`, 5 запросов/мин) партиционируется по `HttpContext.Connection.RemoteIpAddress`. Railway терминирует TLS на своём edge и проксирует запросы на контейнер по внутренней сети — без обработки `X-Forwarded-For` этот адрес будет адресом прокси Railway, а не реального клиента.

`UseForwardedHeaders` подключён (до CORS/аутентификации/rate limiting), но **по умолчанию ничего не доверяет** — `KnownProxies`/`KnownNetworks` намеренно не сброшены и не расширены "вслепую": если бы `X-Forwarded-For` принимался от любого отправителя, любой внешний клиент мог бы подделать свой IP и обойти или подставить чужой IP под rate limiting. Реальный IP/подсеть прокси Railway нигде не задокументированы стабильно, поэтому это оставлено конфигурируемым: задайте `ForwardedHeaders__KnownProxies__0` (точный IP) или `ForwardedHeaders__KnownNetworks__0` (CIDR, `IP/prefixLength`) переменными окружения, когда реальный адрес прокси Railway будет известен.

**Известное ограничение**: пока эти переменные не заданы, `X-Forwarded-For` не применяется, и rate limiting фактически партиционируется по IP прокси Railway (возможно общему для разного трафика), а не по реальному IP посетителя — это не полноценная защита per-visitor, а лучшее, что можно сделать без слепого доверия заголовкам. Задокументировано намеренно, а не выдаётся за решённую проблему.

## 3. Volume для SQLite (сохраняет заявки между деплоями)
- Settings → Volumes → Add Volume
- Mount path: любой, например `/data`
- Railway сам прокидывает `RAILWAY_VOLUME_MOUNT_PATH=/data` в контейнер — `Program.cs` уже это учитывает и положит `veronzo.db` туда

## 4. Домен
- Settings → Networking → Generate Domain (или подключить свой)
- Полученный `https://<project>.up.railway.app` — это прод-URL API, его нужно прописать в `js/main.js` (см. `API_BASE_URL`)

## 5. Проверка после деплоя
```bash
curl -X POST https://<project>.up.railway.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест","contact":"+7 900 000-00-00"}'
```
Ожидается `201` и запись в БД. Логи — Railway → Deployments → View Logs.
