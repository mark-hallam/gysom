# GYSOM - Get Your Skates On Mate

An agent-first prompt compilation methodology for autonomous AI coding agent execution.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[gysom.com](https://gysom.com)**

## About

GYSOM is a context engineering methodology that introduces prompt compilation as a new pattern for structuring AI coding agent execution. Rather than interacting with AI agents through ad hoc conversational prompts that degrade as project complexity grows, GYSOM compiles human intent and decisions into machine-executable session packages that an agent can run autonomously from start to finish. The methodology eliminates mid-execution bottlenecks through upfront decision harvesting, prevents context window exhaustion via session decomposition with explicit size budgets, and enables parallel execution through DAG-based dependency analysis.

## What's New in v2

v2 is based on feedback from a 34-session, 8-layer autonomous build executed entirely through GYSOM v1. Three structural fixes address the failure modes encountered in real-world execution:

- **Scoped Commit Strategy** — Every session ends with explicit file staging, never `git add .`. Foundation configures lint-staged to process only committed files.
- **Smaller Sessions + Checkpoint Resume** — Session target reduced from 15–25 files to 8–12 with checkpoint markers every 3–5 files for resumable execution after context compaction.
- **File Manifest + Completion Audit** — Every session includes a numbered file manifest. Verification audits actual files against expected, catching missing files immediately.

## License

MIT License - Copyright 2026 Mark Hallam. See [LICENSE](LICENSE) for details.
