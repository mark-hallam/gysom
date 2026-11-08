# OPAL — Optimum Provider-Agnostic Language for AI Agents

**Version 0.1 · MIT License · Successor to GYSOM session packages**

OPAL is a programming language whose *runtime is an AI coding agent*. A human (or a planning model) writes an OPAL program; any agent built on any model from any provider executes it to completion without asking questions. The output of execution is working software plus a machine-readable handoff.

This document is the whole language. If a rule is not here, it is not part of OPAL.

---

## 0. Design from first principles

Every feature below was derived from six physical facts about LLM agents. Nothing was added because another language does it.

| Fact about agents | Consequence for the language |
|---|---|
| **F1. Tokens are the cost, the context window is the memory.** | Programs have hard size budgets the compiler enforces. Every byte in a program must earn its place. |
| **F2. Accuracy tracks training data.** Models read Markdown, YAML-style `key: value`, and shell near-perfectly; novel syntax degrades every model. | OPAL is a *strict subset of Markdown*. Zero new punctuation. It renders in any viewer and is parsed by any model with no instruction. |
| **F3. Models are stochastic; shells are not.** | Truth is defined by commands, never by prose. A task is done when its `verify` commands exit 0. "I believe it works" is not a state. |
| **F4. Agents stall on questions.** | All questions are resolved at compile time in `decide`. An unbound decision is a compile error. The word "ask" in a directive is a compile error. |
| **F5. Agents lose state** (compaction, crash, hand-off to another model). | Tasks are idempotent units with explicit file ownership and a JSON handoff. Any agent can resume any session from the handoff alone. |
| **F6. Providers differ only in affordances** (can it spawn subagents? run shell? fetch URLs?). | The program never names a provider or tool. It uses six abstract capability verbs. A one-page runtime adapter maps verbs to a given agent, and every capability degrades gracefully (no `spawn` → run the DAG serially). |

**Idiot index target:** a program should be no longer than the English description of the work plus the commands that prove it. The reference compiler is under 400 lines with no dependencies.

---

## 1. Lexical structure

An OPAL program is a UTF-8 Markdown file with extension `.opal`.

- **Header** — the first non-blank line is `# opal <name>`. Exactly one.
- **Sections** — lines beginning with `## ` open a section. Section kinds: `decide`, `context`, `task <id>`, `finally`.
- **Fields** — inside a section, a line matching `^[a-z][a-z0-9_.]*:` at column 0 is a field. The value is the rest of the line, or, if empty, every following line until the next field or section (a *block value*).
- **Fences** — a block value may be wrapped in a ```` ``` ```` fence. Fences are stripped; they exist for readability.
- **Comments** — `#` after a value on a field line, to end of line. (`# ` at column 0 is reserved for the header.)
- **Interpolation** — `{{decide.<id>}}` anywhere in `context`, `do`, or `verify` is replaced by the bound decision value at compile time.
- **Identifiers** — `[a-z][a-z0-9_-]*`.

That is the entire grammar. There are no expressions, loops, or conditionals: branching happens in the agent's head, bounded by `verify`.

---

## 2. Sections

### 2.1 Header

```
# opal todo-api
version: 1
budget.files: 12      # max files a task may create or modify (default 12)
budget.words: 1500    # max words in a task's `do` block (default 1500)
budget.context: 600   # max words in `## context` (default 600)
```

Defaults come from GYSOM v2 field data (8–12 files per unit is the reliable zone across models). Raise them only with a reason you can write down.

### 2.2 `## decide` — close every question before execution

```
## decide
auth: clerk              # Which auth provider?
db: postgres             # Which database?
api_style: rest          # REST or GraphQL?
empty_submit: reject-400 # What happens on an empty form submission?
```

- One decision per line: `id: value  # question`.
- A value of `?` or empty is **unbound** → compile error `E_UNBOUND`.
- The agent treats bound decisions as law. It may not revisit them.
- `{{decide.auth}}` interpolates `clerk`.

This is the single most important section. Decision harvesting is where human time goes; everything after it is machine time.

### 2.3 `## context` — the minimum the agent must hold

Free Markdown, ≤ `budget.context` words. Architecture in one paragraph, conventions as a list, nothing the agent can read from disk instead. Reference files by path; the agent `READ`s them on demand (F1: don't paste what can be fetched).

### 2.4 `## task <id>` — the unit of work

```
## task auth
needs: foundation, schema
owns: src/auth/**, src/middleware/auth.ts
do:
1. WRITE src/auth/provider.ts wrapping {{decide.auth}} with a `getSession()` export.
2. WRITE src/middleware/auth.ts that rejects unauthenticated requests with 401.
3. RUN the typecheck and fix any errors inside files you own.
verify:
```sh
npm run typecheck
npm test -- auth
test -f src/auth/provider.ts
```
done: src/auth/provider.ts, src/middleware/auth.ts
commit: feat(auth): add {{decide.auth}} session provider and middleware
session: 2            # optional: pin to a session; otherwise the compiler packs it
```

| Field | Required | Meaning |
|---|---|---|
| `needs` | no | Task ids this task depends on. Forms the DAG. Cycles → `E_CYCLE`. |
| `owns` | yes | Glob list of paths this task may create or modify. Writing outside `owns` is a runtime violation. |
| `do` | yes | Numbered directives, ≤ `budget.words`. Should use capability verbs (§3). |
| `verify` | yes | Shell commands. Task is DONE iff **every command exits 0**. Non-empty, or `E_NOVERIFY`. |
| `done` | yes | Exact files that must exist on completion, each matching an `owns` glob (`E_DONE_OUTSIDE_OWNS`). ≤ `budget.files`. |
| `commit` | no | Commit message. The commit stages **exactly the `done` files**. `git add .` anywhere → `E_UNSCOPED_ADD`. |
| `session` | no | Pin to a session number. |

**Ownership rule.** Two tasks may own overlapping paths only if one transitively `needs` the other. Otherwise `E_COLLISION`. This is what makes parallel execution safe without a lock manager: collisions are impossible by construction, not detected at runtime.

### 2.5 `## finally` — whole-program audit

```
## finally
verify:
```sh
npm run build
npm test
```
```

Runs after every task is DONE. It is the completion audit: the compiler also emits a manifest of every `done` file across all tasks and the agent checks each exists.

---

## 3. Capability verbs — the provider-agnostic instruction set

An OPAL agent has exactly six operations. Directives in `do` are written with these verbs in capitals so any model recognises the operation and any runtime can map it.

| Verb | Meaning | If the runtime lacks it |
|---|---|---|
| `READ <path>` | Load a file into working memory. | Never absent. |
| `WRITE <path>` | Create or replace a file the task owns. | Never absent. |
| `RUN <cmd>` | Execute a shell command, observe exit code and output. | Program is not executable on this runtime (`verify` depends on it). Compile with `--no-shell` to get a checklist for a human to run. |
| `SEARCH <pattern>` | Find text or files in the workspace. | Degrade to `READ` of likely files. |
| `FETCH <url>` | Retrieve a web resource. | Degrade: treat as unavailable, use `context` only. |
| `SPAWN <task>` | Execute an independent task concurrently. | Degrade: the compiler linearises the DAG; the agent runs tasks in topological order in one thread. |

There is deliberately **no `ASK` verb.** Asking is a compile-time activity (`decide`). An `ASK`, "ask the user", or "confirm with" inside `do` is `E_ASK_AT_RUNTIME`.

Because the verbs are English words in capitals inside Markdown, a program is executable *as plain text* by any chat model with no tooling: paste the emitted session package, and the model acts. The adapter (§6) only tells the compiler which degradations to apply.

---

## 4. Compilation

`opalc` is the reference compiler (`opal/opalc.py`, stdlib only).

```
opalc check program.opal            # parse + validate, print errors, exit 1 on any
opalc build program.opal -o out/    # check, then emit plan + session packages
opalc build program.opal --serial   # force SPAWN degradation (single-thread runtimes)
```

### 4.1 Validation (all errors are reported, not just the first)

| Code | Rule |
|---|---|
| `E_HEADER` | First line must be `# opal <name>`. |
| `E_UNBOUND` | A `decide` value is `?` or empty. |
| `E_UNKNOWN_DECIDE` | `{{decide.x}}` refers to an id that does not exist. |
| `E_DUP_TASK` | Task id declared twice. |
| `E_UNKNOWN_NEED` | `needs` names a task that does not exist. |
| `E_CYCLE` | Dependency graph has a cycle. |
| `E_NOVERIFY` | Task has no `verify` commands. |
| `E_NO_OWNS` / `E_NO_DONE` / `E_NO_DO` | Required field missing. |
| `E_DONE_OUTSIDE_OWNS` | A `done` file matches none of the task's `owns` globs. |
| `E_COLLISION` | Two tasks own the same path and neither depends on the other. |
| `E_BUDGET_FILES` / `E_BUDGET_WORDS` / `E_BUDGET_CONTEXT` | Budget exceeded. |
| `E_UNSCOPED_ADD` | `git add .` or `git add -A` appears anywhere. |
| `E_ASK_AT_RUNTIME` | A directive asks the human. |

Warnings (printed, do not fail the build):

| Code | Rule |
|---|---|
| `W_LOCKFILE` | A task runs an installer (`npm install`, `pip install`, `cargo add`, ...) but owns no lockfile. Generated files outside `owns` are never committed, so the program would be incomplete. |

### 4.2 Planning

1. Topologically sort tasks (Kahn). Tasks with all `needs` satisfied at the same depth form a **layer**; a layer may run in parallel.
2. Pack tasks into **sessions**: within a layer, greedily fill a session until the next task would push its file count over `budget.files`. Pinned `session:` values are honoured first.
3. Emit `plan.json`: layers, sessions, per-session file manifest, serial order.

### 4.3 Emission — the session package

For each session the compiler emits `session-N.md`, a self-contained prompt any agent can execute. Structure, in order:

1. **Agent Contract** (§5) — identical in every package so every model gets the same rules.
2. **Header** — program, session N of M, layer, tasks, predecessors, file budget.
3. **Decisions** — the full bound `decide` table (small, and it prevents relitigation).
4. **Context** — the `## context` section, interpolated.
5. **Prior state** — a slot the agent fills by `READ`ing `handoff-<N-1>.json`.
6. **Tasks** — each task's `do`, `verify`, `done`, `commit`, with a `CHECKPOINT` marker after every 3 directives (F5: resume after compaction).
7. **Session verify** — the union of task verifies plus the manifest check.
8. **Handoff** — the agent must `WRITE handoff-N.json` matching §5.2 before it stops.

---

## 5. Runtime semantics

### 5.1 The Agent Contract

Every executing agent follows these rules. They are embedded verbatim in every session package.

1. **Never ask.** Every decision is in the Decisions table. If something genuinely cannot be decided from the package and the workspace, stop, write the handoff with `status: "blocked"` and the exact question in `blockers`, and end. Do not guess silently; do not ask interactively.
2. **Verify is truth.** A task is DONE only when every `verify` command exits 0 and every `done` file exists. Report the actual output on failure.
3. **Stay inside `owns`.** Do not create or modify any path outside the task's `owns` globs. If a fix requires it, that is a blocker, not a liberty.
4. **Scoped commits.** Stage exactly the `done` files. Never `git add .`. The commit message is exactly the `commit:` text: no trailers, no co-author lines, whatever the runtime's own habits are.
5. **Checkpoint.** At every `CHECKPOINT` marker, write the handoff with `status: "in_progress"`. If you resume with no memory, `READ` the handoff first.
6. **No scope creep.** Do not refactor, rename, "improve", or add tests not listed. Extra work is a defect.
7. **Fail loudly.** On the first `verify` failure you cannot fix within `owns`, stop and hand off. Do not continue to later tasks.
8. **Hand off.** The last action of every session is writing `.opal/handoff-N.json`. A session with no handoff did not happen. Every choice the agent made that was not in the Decisions table is listed in `decisions_made`, so silent decisions become visible to the human.
9. **Orchestrate.** When a session has several tasks and the runtime can `SPAWN`, the agent reading the package is the session orchestrator. It gives each worker the Contract, Decisions, Context and exactly one Task section. Workers return a task report (§5.3). The orchestrator, never a worker, writes the session handoff.

### 5.2 Handoff schema

Written to `.opal/handoff-N.json`. The `.opal/` directory is runtime state, not source: the foundation task's `.gitignore` should list it. Archive it if you want an audit trail.

```json
{
  "program": "todo-api",
  "session": 2,
  "status": "done | in_progress | blocked | failed",
  "tasks_done": ["schema", "auth"],
  "files_created": ["src/auth/provider.ts"],
  "files_modified": ["src/middleware/auth.ts"],
  "verify": [{ "cmd": "npm test -- auth", "exit": 0 }],
  "decisions_made": ["unknown id on PATCH returns 404"],
  "blockers": [],
  "notes": "One line a human or the next agent needs. Nothing else."
}
```

This is the only state that crosses a session boundary. It is deliberately flat so a 7B local model and a frontier model read it the same way. `decisions_made` is the feedback loop into `## decide`: anything that appears there should become a decision in the next revision of the program.

### 5.3 Task report schema

What a `SPAWN`ed worker returns to its orchestrator: the handoff minus `program` and `session`, plus `task`.

```json
{ "task": "schema", "status": "done", "files_created": [], "files_modified": [], "verify": [], "decisions_made": [], "blockers": [], "notes": "" }
```

---

## 6. Runtime adapters

An adapter is a table, not code. It tells the compiler which verbs a runtime has so it can choose degradations, and tells a human how to feed the package in. See `opal/runtimes/README.md` for Claude Code, OpenAI Codex CLI, Gemini CLI, Cursor, Aider, OpenCode, and a plain chat window.

An adapter declares, for each of the six verbs: `native`, `degrade`, or `absent`. That is the whole interface between OPAL and a provider. Adding a provider is adding a row.

---

## 7. What OPAL refuses to have

- **No provider names, model names, or tool names in a program.** If you need one, the design is wrong.
- **No conditionals or loops.** The agent is the control flow; `verify` is the bound on it. Programs that need `if` need another `decide` entry.
- **No natural-language success criteria.** "Make sure it works" does not compile. `npm test` does.
- **No shared mutable state between tasks** other than files, governed by `owns`.
- **No long prose.** If a `do` block exceeds the budget, split the task. The compiler will not let you talk your way around F1.

## 7.1 Authoring rules learned in the field

From the first end-to-end run (`examples/FIELD-TEST.md`):

- **Verify meaning, not formatting.** `grep -q "POST /todos" README.md` failed because the agent rendered a table. Check for the facts, not the layout.
- **Own what you generate.** If a task runs an installer, it owns the lockfile. `W_LOCKFILE` reminds you.
- **Harvest the error paths.** Agents will decide 404-vs-400 and 200-vs-204 silently if you do not. Read `decisions_made` after every run and promote each entry into `## decide`.

---

## 8. Relationship to GYSOM / DAC

GYSOM v2 session packages were hand-written Markdown with six mandatory sections and empirically derived budgets. OPAL formalises exactly that into a grammar with a compiler, so the budgets, DAG, conflict matrix, file manifest, scoped commits, checkpoints, and handoff schema are enforced mechanically rather than by discipline. A GYSOM session package is approximately the *output* of `opalc build`; OPAL is the *source*.

---

## 9. Minimal complete example

```
# opal hello
budget.files: 4

## decide
lang: python      # Which language?

## context
Single-file CLI. No dependencies.

## task cli
owns: hello.py, test_hello.py
do:
1. WRITE hello.py printing "hello, opal" when run.
2. WRITE test_hello.py asserting that output using subprocess.
3. RUN the tests.
verify:
python3 -m pytest -q test_hello.py
done: hello.py, test_hello.py
commit: feat: hello cli

## finally
verify:
python3 hello.py
```

Compile: `python3 opal/opalc.py build hello.opal -o out/`. Hand `out/session-1.md` to any agent.
