# GYSOM - Get Your Skates On Mate

> **GYSOM has evolved into [DAC — Declarative Agent Compilation (v3)](https://markhallam.com.au).** The latest methodology, instructions, and documentation are now at [markhallam.com.au](https://markhallam.com.au). This repository remains as the GYSOM v2 archive.

An agent-first prompt compilation methodology for autonomous AI coding agent execution.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[gysom.com](https://gysom.com)** | **[DAC v3 at markhallam.com.au](https://markhallam.com.au)**

## About

GYSOM is a context engineering methodology that introduces prompt compilation as a new pattern for structuring AI coding agent execution. Rather than interacting with AI agents through ad hoc conversational prompts that degrade as project complexity grows, GYSOM compiles human intent and decisions into machine-executable session packages that an agent can run autonomously from start to finish. The methodology eliminates mid-execution bottlenecks through upfront decision harvesting, prevents context window exhaustion via session decomposition with explicit size budgets, and enables parallel execution through DAG-based dependency analysis.

## What's New in v2

v2 is based on feedback from a 34-session, 8-layer autonomous build executed entirely through GYSOM v1. Three structural fixes address the failure modes encountered in real-world execution:

- **Scoped Commit Strategy** — Every session ends with explicit file staging, never `git add .`. Foundation configures lint-staged to process only committed files.
- **Smaller Sessions + Checkpoint Resume** — Session target reduced from 15–25 files to 8–12 with checkpoint markers every 3–5 files for resumable execution after context compaction.
- **File Manifest + Completion Audit** — Every session includes a numbered file manifest. Verification audits actual files against expected, catching missing files immediately.

## OPAL — a programming language for AI agents

[`opal/`](opal/) contains **OPAL (Optimum Provider-Agnostic Language)**, the formalisation of GYSOM session packages into a real language with a compiler. An OPAL program is strict Markdown: `decide` (every question closed before execution), `context`, DAG-linked `task`s with file ownership, shell `verify` blocks that define done, and a JSON handoff. `opalc` validates budgets, dependency cycles, file collisions, unscoped commits and runtime questions, then emits self-contained session packages that any agent on any model can execute.

```sh
python3 opal/opalc.py check opal/examples/todo-api.opal
python3 opal/opalc.py build opal/examples/todo-api.opal -o out/
python3 -m unittest opal/test_opalc.py
```

See [opal/SPEC.md](opal/SPEC.md) and [opal/runtimes/README.md](opal/runtimes/README.md).

## License

MIT License - Copyright 2026 Mark Hallam. See [LICENSE](LICENSE) for details.
