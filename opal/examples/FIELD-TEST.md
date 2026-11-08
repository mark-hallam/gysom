# OPAL field test #1 — `todo-api.opal`, end to end

**Date:** 2026-11-08 · **Program:** `examples/todo-api.opal` (5 tasks, 4 layers) · **Result: PASS**

## Setup

- Compiled with `opalc build` into 4 session packages (470–540 words each).
- Fresh empty git repo. No files, no instructions, no human in the loop after compile.
- Each session was handed to a **fresh agent with empty context** that received only the package text and the working directory. Sessions were deliberately run on **different models** so cross-session state had to travel through `handoff-N.json` alone.
- Session 2 has two independent tasks; it was run as **two concurrent workers in the same worktree** to test the static collision guarantee.

Cross-provider execution (OpenAI, Google, local) was not run: no other provider CLI or key was available in the test environment. The packages contain nothing provider-specific; that claim remains to be exercised.

## Run

| Session | Tasks | Model | Wall time | Questions asked | Verify | Commit |
|---|---|---|---|---|---|---|
| 1 | foundation | Sonnet | 2m18s | 0 | pass | `09f5c78`, 5 files, scoped |
| 2 | readme ∥ schema | Haiku ×2 (concurrent) | 23s | 0 | pass | `3ed1e9c`, `8e4ce59`, scoped, no lock contention |
| 3 | todos-routes | Opus | 1m01s | 0 | pass | `2b2e130`, scoped |
| 4 | tests + finally | Sonnet | 46s | 0 | pass (2 tests) | `7493147`, scoped |

Whole-program audit re-run independently by the orchestrator: typecheck green, 2/2 tests green, all 10 manifest files present, 5 commits each staging exactly the `done` files.

## What held

- **Never ask** held across all models. Zero clarifying questions over 5 agent runs.
- **Verify is truth** caught a real defect (F5 below) and the agent fixed it inside `owns` and moved on, exactly per contract rule 7.
- **Static ownership** was sufficient for safe concurrency: two workers, one repo, disjoint globs, zero conflicts.
- **Handoff-only state transfer** worked across three different models and four fresh contexts.
- **Dependency discipline** held: Opus implemented UUID v7 with `node:crypto` rather than add an unlisted package, because context said to add only named deps.

## Findings → changes made

| # | Finding | Change |
|---|---|---|
| F1 | `npm install` produced `package-lock.json`, which no task owned, so it was never committed. Program silently incomplete. | New compiler warning `W_LOCKFILE`. Example now owns the lockfile. |
| F2 | Handoff files were untracked clutter at repo root; spec never said where they live. | Handoffs now live in `.opal/handoff-N.json`; foundation gitignores `.opal/`. |
| F3 | A multi-task session says "SPAWN concurrently" but emitted one handoff file for all workers to write. | Contract rule 9: the package reader is the orchestrator; workers return task reports (§5.3); orchestrator writes the handoff. |
| F4 | Concurrent workers in one worktree: no git `index.lock` contention observed. | None needed; documented. |
| F5 | `grep -q "POST /todos"` is a formatting check, not a meaning check; failed on a Markdown table. | Authoring rule in §7.1; example verify split into two greps. |
| F6 | A worker appended co-author trailers to its commit from its own runtime's habits. | Contract rule 4 now says the commit message is exactly `commit:`, no trailers. |
| F7 | Opus silently decided 404 for unknown ids and 204 for DELETE. Correct behaviour under rule 1, invisible to the human. | New handoff field `decisions_made`. Example `decide` now has `unknown_id` and `delete_response`. |
| F8 | Dependency discipline from a one-line context rule had real effect. | None needed; keep the rule in example programs. |

## Next test

Run the same four packages through a non-Anthropic agent (Codex CLI or Gemini CLI) with no changes to the packages. If it passes, the agnosticism claim is demonstrated rather than designed. If it fails, the failure is the next finding.
