---
description: Determine and execute the next unfinished Veronzo Stage
allowed-tools: Read, Edit, Write, Grep, Glob, Bash(git status:*), Bash(git diff:*), Bash(dotnet build:*), Bash(dotnet test:*), Bash(npm run build:*), Bash(npm run lint:*), Bash(npm run typecheck:*)
---

Work economically — read only what the determined Stage actually requires; never scan the whole repository.

1. Read `CLAUDE.md`.
2. Run:
   - `git status --short`
   - `git diff --stat`
3. Read `docs/ROADMAP.md` — the single source of truth for Stage status — and `docs/PROGRESS.md`'s "Current Project Status" block.
4. Determine the Stage to work on:
   - find the Stage marked **IN PROGRESS** in `docs/ROADMAP.md` — that is the one to implement;
   - if no Stage is IN PROGRESS, the first **PLANNED** Stage may be selected, but ONLY after asking the user for explicit confirmation first — never start it silently;
   - never invent, guess, or extrapolate a Stage that isn't written in `docs/ROADMAP.md`.
5. Implement ONLY that one Stage. One `/go` call = one Stage, maximum. Never continue on to the next Stage after finishing this one, even if it seems like the obvious next step — stop and report instead.
6. If the Stage (or its scope) is ambiguous even after reading ROADMAP.md/PROGRESS.md, ask ONE short clarifying question and stop — make no changes.
7. Read only files related to the determined Stage. Do not analyze the whole project.
8. Do not perform unrelated refactoring.
9. Run only the relevant build — backend changes → `dotnet build`; frontend changes → `npm run build`. Don't run both if only one side changed.
10. Fix only errors caused by the current changes.
11. Never run `git add`, `git commit`, `git push`, `git reset`, `git restore`, `git clean`, or any deploy command.
12. Report in at most 20 lines, in exactly this format:

Stage:
Что сделано:
Изменённые файлы:
Build:
Риски:
Git status:
