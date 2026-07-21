# MASTER.md — Veronzo Stone

## О проекте
Одностраничный сайт-визитка (лендинг) для компании Veronzo — натуральный камень, уличные двери, лицевые решения.
Репозиторий: https://github.com/Dodikhudoev-Ahmad/veronzo_stone
Демо: https://veronzotj.netlify.app

## Стек
### Frontend (готово)
- HTML5, CSS3 (Grid/Flexbox), Vanilla JS
- Без фреймворков, без сборщика
- Хостинг: Netlify (авто-деплой из ветки)

### Backend (в разработке)
- ASP.NET Core Web API (minimal API), .NET — как в BrigadaCRM
- FluentValidation для валидации входящих заявок
- Деплой отдельно от статики (Render/Railway/VPS — не определено)

## Структура
```
index.html
css/style.css
js/main.js
assets/            (иконки, изображения AVIF/WebP)
backend/           (новое: ASP.NET Core API)
```

## Готово (Done)
- Адаптивная вёрстка 320–1920px
- Доступность: :focus-visible, aria-live/aria-invalid, prefers-reduced-motion
- Микроанимации: IntersectionObserver для секций, hero-анимация, счётчик статистики
- Оптимизация изображений: AVIF/WebP + <picture>, заданы width/height (без layout shift)
- Базовое SEO: title, meta description, Open Graph, theme-color
- Секции: hero, каталог (камень/двери/лист), о компании, портфолио, форма заявки, footer

## Не готово / известные проблемы
1. **Backend формы отсутствует** — сейчас в разработке (.NET API, см. PROGRESS.md Phase 1)
2. Скриншот в README — пустой плейсхолдер
3. Визуальный аудит выявил:
   - Однообразие секций — одна и та же схема "заголовок + карточки" почти везде
   - Мало крупных фото текстуры камня/дверей — продукт продаётся через фактуру материала
   - Не проверен контраст текста на фото-тонах в отдельных блоках

## Принципы работы
- Правки — маленькими коммитами, по одной задаче за раз
- Не трогать структуру, которая уже "готово", без явного запроса
- Перед пушем — визуальная проверка в браузере (скриншот основных breakpoints: 375/768/1440)
