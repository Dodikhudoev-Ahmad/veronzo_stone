---
description: Review current uncommitted changes for real architecture/security issues
allowed-tools: Read, Grep, Glob, Bash(git status:*), Bash(git diff:*)
---

Review ONLY the current uncommitted changes — never the whole repository.

1. Read `CLAUDE.md`.
2. Run:
   - `git status --short`
   - `git diff --stat`
   - `git diff` for the changed files only
3. Review only these changes. Read dependent files only when genuinely necessary to judge a specific change.
4. Do not fix the code automatically.
5. Never run `git add`, `git commit`, `git push`, or any deploy command.

Check for real issues only, in: functional correctness, security, authentication and authorization, secret leakage, breaking API changes, data-loss risk, OOP, SOLID, Clean Architecture, EF Core, React/TypeScript, performance, accessibility, error handling, leftover temporary/diagnostic logging, accidentally added `.env`/`dist`/`node_modules`/`bin`/`obj`, missing critical checks.

Do not invent findings for the sake of quantity. Do not demand abstractions or patterns without a concrete practical benefit.

Finding format:

```
BLOCKER
- файл:строка
- причина
- риск
- минимальное исправление

HIGH
- файл:строка
- причина
- риск
- минимальное исправление

MEDIUM
- файл:строка
- причина
- риск
- минимальное исправление
```

Do not report LOW-severity/style-only/personal-preference items.

If there are no real problems, output exactly:

```
REVIEW PASSED

Build: PASS / NOT RUN
Tests: PASS / NOT RUN
Lint: PASS / NOT RUN
Secrets: NOT FOUND
Ready for commit: YES
```

Max 20 lines when there are no critical problems.
