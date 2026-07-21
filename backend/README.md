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
| `Smtp__Host` | адрес SMTP-сервера |
| `Smtp__Port` | обычно `587` |
| `Smtp__UseStartTls` | `true` |
| `Smtp__User` | логин SMTP |
| `Smtp__Password` | пароль/app-password SMTP |
| `Smtp__FromAddress` | адрес отправителя, например `no-reply@veronzo.ru` |
| `Smtp__FromName` | `Veronzo — сайт` |
| `Smtp__NotifyToAddress` | куда присылать уведомления о заявках |

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
