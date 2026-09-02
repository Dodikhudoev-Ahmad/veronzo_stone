# Veronzo Stone

Премиальный сайт-каталог для компании, работающей с натуральным камнем, элитными дверями, окнами и лифтовыми решениями — публичная витрина с CMS-редактируемым контентом и админ-панелью.

## Демо

https://veronzotj.netlify.app

## Стек

- **Frontend:** React 19 + TypeScript + Vite, Tailwind CSS 4, React Router, TanStack Query, React Hook Form + Zod — `frontend/`
- **Backend:** ASP.NET Core (`VeronzoApi`), EF Core — `backend/`
- **Деплой:** frontend на Netlify (сборка через `netlify.toml` в корне), backend на Railway

## Возможности

- Публичный каталог (камень, двери, окна, лифты) с динамическими фильтрами по характеристикам товара
- Карточки товаров, страницы категорий и товара, портфолио, форма обратной связи
- Админ-панель: категории, товары, характеристики, галерея, портфолио, контент сайта, SEO-мета, переводы (ru/tg/en/fa)
- Адаптивная вёрстка, доступность (WCAG AA), базовое SEO (title/description/OG/canonical/robots/sitemap)
- Аутентификация в админке — JWT + refresh-cookie

## Структура репозитория

```
veronzo_stone/
├── netlify.toml        ← конфигурация деплоя фронтенда на Netlify
├── frontend/            ← React + Vite + TS, единственный источник сайта
│   ├── src/
│   │   ├── public/      ← публичный сайт (каталог, товар, портфолио, контакты)
│   │   └── admin/        ← админ-панель
│   └── public/          ← статические файлы (favicon, manifest, локальные изображения)
├── backend/
│   └── VeronzoApi/      ← ASP.NET Core API (деплой на Railway)
└── docs/                ← roadmap и журнал прогресса проекта
```

## Как запустить локально

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Перед первым запуском скопируйте `frontend/.env.example` в `frontend/.env.local` и укажите адрес локального backend (`VITE_API_URL`).

**Backend:** см. `backend/README.md` (запуск, переменные окружения, деплой на Railway).

## Деплой

Frontend деплоится на Netlify автоматически по `netlify.toml` в корне репозитория (`base = frontend`, `publish = frontend/dist`). Backend — на Railway, см. `backend/README.md`.

## Лицензия

Все права защищены. Внутренний проект компании Veronzo — не является open-source.
