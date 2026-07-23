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

> Раньше здесь были `Smtp__*` переменные (MailKit/SMTP) — Railway блокирует исходящий SMTP на нашем плане, поэтому отправка переведена на Resend HTTP API. Если старые `Smtp__*` переменные ещё стоят в Railway — их можно удалить, код их больше не читает.

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
