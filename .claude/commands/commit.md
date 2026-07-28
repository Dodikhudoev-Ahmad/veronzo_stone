---
description: Prepare a commit proposal without actually committing anything
allowed-tools: Bash(git status:*), Bash(git diff:*)
---

Never perform the commit yourself.

1. Run `git status --short`.
2. Run `git diff --stat`.
3. Do not change any files.
4. Never run `git add`, `git commit`, or `git push`.
5. Propose:
   - the list of files to `git add`;
   - one Conventional Commit message;
   - `Ready for commit: YES` or `NO`;
   - if `NO`, a short reason (e.g. unrelated files mixed in, build not verified, secrets present).

Report in at most 12 lines.
