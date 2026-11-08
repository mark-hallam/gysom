# OPAL runtime adapters

An adapter is one row per runtime. It declares, for each of the six capability verbs, whether the runtime has it **natively**, needs the compiler's **degrade** path, or lacks it (**absent**). Nothing else crosses the boundary between OPAL and a provider: the program never names a runtime, and the runtime never needs to know OPAL exists beyond reading Markdown.

| Runtime | READ | WRITE | RUN | SEARCH | FETCH | SPAWN | How to feed a session package |
|---|---|---|---|---|---|---|---|
| Claude Code | native | native | native | native | native | native (Agent tool) | `claude "$(cat out/session-1.md)"` or paste. Parallel layers run as subagents. |
| OpenAI Codex CLI | native | native | native | native | native | degrade | `codex "$(cat out/session-1.md)"`. Build with `--serial`. |
| Gemini CLI | native | native | native | native | native | degrade | `gemini -p "$(cat out/session-1.md)"`. Build with `--serial`. |
| Cursor (Agent mode) | native | native | native | native | native | degrade | Paste the package into the agent chat. Build with `--serial`. |
| Aider | native | native | native (`/run`) | native | native (`/web`) | degrade | `aider --message-file out/session-1.md`. Build with `--serial`. |
| OpenCode | native | native | native | native | native | degrade | Paste the package. Build with `--serial`. |
| Local model via Ollama + any shell tool loop | native | native | native | degrade | absent | degrade | Paste the package. Build with `--serial`; keep `budget.words` ≤ 800 for small models. |
| Plain chat window (no tools) | absent | absent | absent | absent | absent | absent | The model emits file contents and commands; a human applies them and runs `verify`. OPAL still works because every directive is a verb plus a path plus a command. |

## Degradation rules (applied by `opalc`, not by the agent)

- **SPAWN degrade** → `--serial`: layers are flattened into topological order, and each package says "run tasks in listed order". Correctness is unchanged; only wall-clock changes.
- **SEARCH degrade** → the agent `READ`s files named in `context` and `owns`. Programs intended for small models should name paths explicitly.
- **FETCH absent** → `FETCH` directives are a compile warning; put the needed facts in `context`.
- **RUN absent** → the package is a checklist for a human. `verify` is still the definition of done; a human types the commands.

## Adding a runtime

Add a row. If a verb is `degrade` or `absent`, confirm the matching rule above covers it. Do not add runtime-specific syntax to OPAL; if you feel the need, the missing thing is a decision (`## decide`) or a budget, not a feature.
