---
name: commit
description: Create a Git commit from already staged changes, with a concise subject and a body describing the changes. Use when the user says "commit", invokes `$commit`, or asks to commit staged work.
---

# Commit Staged Changes

Create a commit only from the index. Never stage, unstage, reset, amend, or include unstaged/untracked work unless explicitly asked.

## Workflow

1. Read repository instructions, then inspect `git status --short`, `git diff --cached --check`, `git diff --cached --stat`, and the full staged diff.
2. Stop and tell the user if nothing is staged, whitespace errors exist, or staged files contain likely secrets. Do not fix or stage anything implicitly.
3. Inspect recent commits with `git log --oneline -10`. Match the repository's commit style; otherwise use a concise Conventional Commit subject.
4. Run repository-required checks relevant to staged code. Stop before committing when a required check fails.
5. Write an imperative subject of at most 72 characters. Add a commit body with short bullets describing user-visible behavior, important implementation changes, and validation when useful.
6. Run `git commit` with the subject and body. If Git rejects the commit, report its exact reason and leave the index unchanged.
7. Report the new short hash, subject, and summary. Do not push.

## Commit Content Rules

- Describe only staged changes; never claim unstaged or untracked work is included.
- Omit formatting-only, generated, and incidental files unless they materially affect behavior.
- Keep the body factual. Do not invent fixes, tests, performance claims, or breaking changes.
