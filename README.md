# GYSOM — Get Your Skates On Mate

A "prompt compiler" web app at gysom.com that takes a user's natural language project description and compiles it into an agent-optimized execution plan — not a human todo list, but a machine-executable orchestration document with maximum parallelism, dependency graphs (DAGs), batched human input, and token-efficient agent handoffs.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript (strict mode)
- **Styling**: Tailwind CSS (dark mode)
- **AI**: Claude API (Opus 4.6, Opus 4.5, Sonnet 4.5) with model routing
- **Visualization**: ReactFlow for DAG graphs
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (GitHub OAuth + email magic link)

## 6-Stage Compilation Pipeline

1. **Intent Extraction** — Parse project goals, constraints, tech stack
2. **Dependency Analysis** — Generate DAG with cycle detection and parallelism scoring
3. **Agent Assignment** — Match agent roles to tasks using template library
4. **Human Input ID** — Batch decisions into prioritized questionnaire
5. **Prompt Generation** — Create per-agent execution prompts
6. **Execution Plan** — Assemble CLAUDE.md + AGENTS.md orchestration manifest

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
```

## License

MIT
