# VERONZO PROJECT WORKFLOW

## Scope

Эти инструкции действуют только для проекта Veronzo.

Не сохранять их в долговременную память.

## Roadmap status (important)

`docs/ROADMAP.md` — единственный источник истины по Stage (Stage 0–22, со статусами COMPLETED/IN PROGRESS/PLANNED/BLOCKED).

`docs/PROGRESS.md` хранит фактический прогресс/отчёты, включая компактный блок "Current Project Status" (Last completed / Current / Next planned Stage). `docs/MASTER.md` — историческая справка по раннему лендингу, не источник Stage.

`git log` подтверждает, что реализовано, но не заменяет roadmap.

Правила для `/go`:

- читает только следующий Stage со статусом **IN PROGRESS** в `docs/ROADMAP.md`;
- если IN PROGRESS отсутствует — разрешается выбрать первый **PLANNED** Stage, но только после явного подтверждения пользователя (задать вопрос, не начинать молча);
- `/go` **не переходит автоматически** на следующий Stage после завершения текущего;
- один вызов `/go` = один Stage максимум;
- Claude не имеет права придумывать новые Stage без обновления `docs/ROADMAP.md`.

## Token-efficient mode

- Использовать минимально достаточный контекст.
- Не читать весь репозиторий.
- Не перечитывать завершённые Stage.
- Не запускать глобальный поиск без необходимости.
- Использовать `git status` и `git diff` как основной источник контекста.
- Читать только файлы, связанные с текущей задачей.
- Не печатать полный diff без запроса.
- Не писать длинные объяснения.
- Отчёт после работы — максимум 20 строк.
- Не выполнять глубокий анализ для локальной задачи.
- Не повторять уже выполненные проверки без причины.

## Project safety

Никогда самостоятельно не выполнять:

- git add
- git commit
- git push
- git reset
- git restore
- git clean
- force push
- deploy
- применение production-миграций
- удаление production-данных
- изменение Railway или Netlify без прямого запроса

Не изменять несвязанные файлы.

Не выполнять рефакторинг «заодно».

Не удалять legacy-код без прямого требования текущего Stage.

## Architecture

При изменении кода соблюдать:

- OOP
- SOLID
- DRY
- KISS
- YAGNI
- Separation of Concerns
- существующую архитектуру проекта

Не создавать интерфейсы, слои, сервисы и паттерны без практической необходимости.

## Backend

Проверять только применительно к изменённому коду:

- ASP.NET Core conventions
- Dependency Injection
- async/await
- CancellationToken
- nullable reference types
- validation
- structured logging
- authentication and authorization
- JWT and cookies
- CORS and CSRF
- EF Core tracking
- N+1
- indexes and constraints
- transaction safety
- API backward compatibility
- отсутствие секретов в коде и логах

Никогда не выводить:

- пароли
- password hashes
- access tokens
- refresh tokens
- JWT secrets
- environment secrets

## Frontend

Проверять только применительно к изменённому коду:

- TypeScript strictness
- корректность React hooks
- component responsibility
- form validation
- API error handling
- loading state
- empty state
- error state
- accessibility
- responsive behaviour
- отсутствие ненужных rerender
- отсутствие дублированной логики

## Validation

Запускать только релевантные проверки.

Если изменён только backend:

- `dotnet build`
- `dotnet test` только при изменении тестируемой бизнес-логики или существующих тестов

Если изменён только frontend:

- `npm run build`
- `npm run lint` только если затронут frontend-код
- tests только если они существуют и относятся к изменению

Не запускать backend и frontend проверки одновременно без необходимости.

## Stage rules

Перед реализацией Stage:

1. Прочитать текущий Stage из `docs/PROGRESS.md` и `docs/ROADMAP.md` (если существует).
2. Убедиться, что Stage описан однозначно.
3. Проверить `git status --short`.
4. Проверить `git diff --stat`.
5. Определить минимальный список файлов.
6. Реализовать только требования текущего Stage.
7. Запустить только необходимые проверки.
8. Выдать короткий отчёт.

Если следующий Stage определить невозможно:
- задать один короткий уточняющий вопрос;
- ничего не изменять.

## Report format

```
Stage:

Что сделано:

Изменённые файлы:

Build:

Риски:

Git status:
```

Максимум 20 строк.
