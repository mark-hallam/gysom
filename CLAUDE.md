# GYSOM — Get Your Skates On Mate

## Project Overview

**GYSOM** is a prompt compiler web app that transforms human natural language project ideas into agent-first execution plans. Rather than generating human-readable sequential task lists, GYSOM produces machine-executable orchestration documents optimized for autonomous agent execution.

- **Domain**: gysom.com
- **Git repo**: gysom
- **Core Function**: Takes natural language project description → outputs agent-optimized execution plans with parallel DAG-based orchestration
- **Key Differentiator**: Agent-first from token one—never generates human-oriented sequential plans; all outputs are designed for agent consumption and parallel execution

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Graph Visualization**: ReactFlow for interactive dependency DAGs
- **UI Components**: Custom React components with error boundaries

### Backend
- **API Framework**: Next.js API routes with TypeScript
- **AI Models**:
  - Claude Opus 4.6: Complex analysis, reasoning stages (Stages 1-3)
  - Claude Opus 4.5: Balanced analysis tasks
  - Claude Sonnet 4.5: Structured generation, speed-critical stages (Stages 4-6)
- **Model Routing**: Dynamic selection based on pipeline stage and token budget

### Data & Persistence
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Cache**: In-memory for template library, Redis for session state (optional)

### Testing & Quality
- **Unit/Integration**: Vitest
- **E2E**: Playwright
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode

### Deployment
- **Platform**: Vercel
- **Environment Management**: .env.local for secrets, .env for public config
- **CI/CD**: GitHub Actions (lint → test → build → deploy)

## Architecture Overview

### 6-Stage Compilation Pipeline

GYSOM processes user input through a specialized 6-stage pipeline, each stage optimized for agent orchestration:

```
User Input
    ↓
[Stage 1] Intent Extraction (Claude Opus 4.6)
    └─ Extracts project goals, constraints, scope boundaries
    ↓
[Stage 2] Dependency Analysis (Claude Opus 4.6)
    └─ Generates DAG of task dependencies, identifies parallelizable workstreams
    ↓
[Stage 3] Agent Assignment (Claude Opus 4.6)
    └─ Assigns agents to tasks, identifies human decision points
    ↓
[Stage 4] Human Input Identification (Claude Sonnet 4.5)
    └─ Batches human decisions into questionnaire, prioritizes by impact
    ↓
[Stage 5] Prompt Generation (Claude Sonnet 4.5)
    └─ Generates CLAUDE.md and per-agent execution prompts
    ↓
[Stage 6] Execution Plan (Claude Sonnet 4.5)
    └─ Produces AGENTS.md orchestration manifest with timing & dependencies
    ↓
Execution Plan Output
```

### Model Routing Strategy

- **Stages 1-3** (Extraction, Analysis, Assignment): Claude Opus 4.6 for superior reasoning
- **Stages 4-6** (Batching, Generation, Planning): Claude Sonnet 4.5 for structured output speed
- **Token Budget**: Displayed to user; pipeline auto-adjusts model choice if budget threatened
- **Fallback**: Opus 4.5 available for any stage if Opus 4.6 quota exhausted

### Key Design Principles

- **Agent-First Optimization**: All generated prompts assume autonomous agent execution; no human reading/approval in critical path
- **Parallelism Maximization**: DAG analysis explicitly identifies independent workstreams
- **Compressed Handoffs**: Agents pass only essential JSON state, never full conversation history
- **CLAUDE.md as Source of Truth**: Single unified document for all project context
- **Execution Transparency**: Each agent's capabilities, constraints, and decision gates clearly defined in AGENTS.md

## Directory Structure

```
gysom/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout with error boundary
│   │   ├── page.tsx                  # Landing page + input form
│   │   ├── compile/
│   │   │   └── page.tsx              # Compilation results / download page
│   │   ├── api/
│   │   │   ├── compile/
│   │   │   │   └── route.ts          # POST /api/compile - main pipeline
│   │   │   ├── stream/
│   │   │   │   └── route.ts          # POST /api/stream - SSE streaming
│   │   │   ├── projects/
│   │   │   │   ├── route.ts          # GET/POST projects (save/load)
│   │   │   │   └── [id]/route.ts     # GET/PUT/DELETE project by ID
│   │   │   ├── templates/
│   │   │   │   └── route.ts          # GET available templates
│   │   │   └── health/
│   │   │       └── route.ts          # GET /api/health for monitoring
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # NextAuth.js auth routes
│   │
│   ├── components/
│   │   ├── ProjectInput.tsx          # Main text input + voice option
│   │   ├── DependencyGraph.tsx       # ReactFlow DAG visualization
│   │   ├── AgentCards.tsx            # Agent assignment display
│   │   ├── DecisionQueue.tsx         # Human decision questionnaire
│   │   ├── ExecutionPrompts.tsx      # Copy-ready prompt output sections
│   │   ├── TokenBudget.tsx           # Real-time token budget display
│   │   ├── CompilationProgress.tsx   # Pipeline stage progress indicator
│   │   ├── ErrorBoundary.tsx         # Error boundary wrapper
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Spinner.tsx
│   │       └── Toast.tsx
│   │
│   ├── lib/
│   │   ├── pipeline/
│   │   │   ├── index.ts              # Pipeline orchestrator (runs stages sequentially)
│   │   │   ├── intent.ts             # Stage 1: Intent extraction logic
│   │   │   ├── dependencies.ts       # Stage 2: DAG generation & cycle detection
│   │   │   ├── agents.ts             # Stage 3: Agent assignment & role selection
│   │   │   ├── humanInput.ts         # Stage 4: Human decision batching
│   │   │   ├── prompts.ts            # Stage 5: Prompt generation
│   │   │   ├── execution.ts          # Stage 6: Execution plan assembly
│   │   │   └── validation.ts         # Cross-stage validation rules
│   │   │
│   │   ├── templates/
│   │   │   ├── claude-md.ts          # CLAUDE.md generation templates
│   │   │   ├── agents-md.ts          # AGENTS.md orchestration templates
│   │   │   ├── roles.ts              # Agent role definitions & capabilities
│   │   │   └── examples/
│   │   │       ├── web-app.ts        # Example: SaaS web application
│   │   │       ├── data-pipeline.ts  # Example: ETL data pipeline
│   │   │       ├── ml-training.ts    # Example: ML model training
│   │   │       └── devops.ts         # Example: Infrastructure automation
│   │   │
│   │   ├── ai/
│   │   │   ├── client.ts             # Claude API client with model routing
│   │   │   ├── models.ts             # Model config (Opus 4.6, 4.5, Sonnet 4.5)
│   │   │   ├── prompts.ts            # System prompts for each pipeline stage
│   │   │   ├── streaming.ts          # Server-sent events streaming handler
│   │   │   └── tokenCounter.ts       # Estimate tokens for budget display
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts              # Core type definitions
│   │   │   ├── dag.ts                # DAG/graph types and utilities
│   │   │   ├── pipeline.ts           # Pipeline input/output types
│   │   │   ├── agents.ts             # Agent capability and assignment types
│   │   │   └── project.ts            # User project and saved state types
│   │   │
│   │   ├── db/
│   │   │   ├── seed.ts               # Database seeding scripts
│   │   │   └── migrate.ts            # Migration helpers
│   │   │
│   │   ├── utils/
│   │   │   ├── formatting.ts         # Markdown/output formatting
│   │   │   ├── storage.ts            # localStorage helpers
│   │   │   ├── analytics.ts          # Event tracking wrapper
│   │   │   └── validators.ts         # Reusable validation functions
│   │   │
│   │   └── hooks/
│   │       ├── useCompilation.ts     # Main compilation state management
│   │       ├── useDAGVisualization.ts # ReactFlow DAG state
│   │       ├── useTokenBudget.ts     # Real-time token tracking
│   │       └── useSavedProjects.ts   # Project persistence
│   │
│   └── styles/
│       ├── globals.css               # Tailwind + global CSS
│       └── animations.css            # Reusable animations
│
├── prisma/
│   ├── schema.prisma                 # Database schema (projects, templates, runs)
│   ├── migrations/                   # Auto-generated migration files
│   └── seed.ts                       # Database seeding
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── examples/
│       └── sample-projects.json      # Example project inputs
│
├── tests/
│   ├── unit/
│   │   ├── pipeline/
│   │   │   ├── intent.test.ts
│   │   │   ├── dependencies.test.ts
│   │   │   └── agents.test.ts
│   │   └── utils/
│   │       └── formatters.test.ts
│   ├── integration/
│   │   └── pipeline.integration.test.ts
│   └── e2e/
│       ├── compilation.spec.ts
│       └── saved-projects.spec.ts
│
├── .env.local                        # Local secrets (CLAUDE_API_KEY, DATABASE_URL)
├── .env.example                      # Template for environment variables
├── .eslintrc.json                    # ESLint configuration
├── tsconfig.json                     # TypeScript configuration (strict: true)
├── tailwind.config.ts                # Tailwind CSS configuration
├── next.config.js                    # Next.js configuration
├── vitest.config.ts                  # Vitest configuration
├── playwright.config.ts              # Playwright configuration
├── package.json                      # Dependencies and scripts
├── README.md                         # Project README
└── CLAUDE.md                         # This file

```

## Coding Standards

### TypeScript
- **Strict Mode**: All tsconfig.json files include `"strict": true`
- **No `any` Type**: Explicitly type all parameters and return values
- **Interface Over Type Aliases**: Use `interface` for object contracts, `type` for unions/primitives
- **Exhaustive Checks**: Use `satisfies` operator and exhaustive switch statements

### React Components
- **Functional Components Only**: No class components
- **Hooks-Based State Management**: useState, useReducer, useContext
- **Server Components by Default**: Use `'use client'` only when client interactivity required
- **Error Boundaries**: Wrap every major section with custom ErrorBoundary component
- **Prop Drilling Prevention**: Use React Context for cross-cutting concerns

### API & Validation
- **Zod Schemas**: All API inputs validated with Zod before processing
- **Try-Catch-Finally**: All async operations wrapped with proper error handling
- **Status Codes**: Return appropriate HTTP status (400 for validation, 500 for server errors, 503 for rate limits)
- **Structured Logging**: All errors logged with context (stage, user_id, model, tokens_used)

### Code Organization
- **Single Responsibility**: Each file/function has one clear purpose
- **JSDoc Comments**: Every function documented with parameter types and return value
- **Constants File**: Project-wide constants in `src/lib/constants.ts`
- **No Magic Numbers**: All hardcoded values extracted to named constants
- **DRY Principle**: Shared logic extracted to utilities, zero duplication in pipeline stages

### Naming Conventions
- **Files**: kebab-case (e.g., `intent-extractor.ts`)
- **Components**: PascalCase (e.g., `ProjectInput.tsx`)
- **Functions/Variables**: camelCase (e.g., `extractIntent()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_TOKENS_PER_REQUEST`)
- **Types/Interfaces**: PascalCase (e.g., `CompilationResult`, `AgentAssignment`)

### Testing
- **Unit Tests**: Test pure functions in isolation, 80%+ coverage target
- **Integration Tests**: Test pipeline stages with mocked Claude API
- **E2E Tests**: Test full user flows (input → compilation → download)
- **Test Naming**: `describe('ComponentName', () => { it('should ...') })`

## Agent Coordination Rules

### Parallelism First
- **Sub-agents MUST be spawned** for independent workstreams identified in Stage 2 (Dependency Analysis)
- **Never sequential when parallel is possible**: DAG must explicitly call out parallelizable tasks
- **Execution Plan indicates timing**: Use time windows and dependency annotations

### Communication Protocol
- **Handoff Format**: Compressed JSON with only essential state
- **No Conversation History**: Agents receive filtered, context-rich summaries, not full chat logs
- **State Mutation**: Agents can modify only their assigned tasks; cross-task mutations forbidden
- **Conflict Resolution**: Priority defined in AGENTS.md; parent agent arbitrates tie-breaks

### CLAUDE.md as Source of Truth
- **Single Document**: All project context lives in generated CLAUDE.md
- **No Side Channels**: Agents never rely on external config files or environment variables for task definition
- **Versioning**: Each compilation produces immutable CLAUDE.md v1.0, v2.0, etc.
- **Update Protocol**: Only the orchestration agent (parent) can update CLAUDE.md between compilation runs

### Execution Plan Guarantees
- **Dependency Satisfaction**: No task executes until all dependencies complete
- **Resource Constraints**: Plans account for token limits, API rate limits, model availability
- **Timeout Definitions**: Each agent task includes max_execution_time and failure_behavior
- **Monitoring**: Plans include checkpoints for progress tracking and anomaly detection

## Key Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000
npm run build            # Build for production
npm run start            # Run production build

# Testing
npm run test             # Run Vitest (watch mode)
npm run test:once        # Run Vitest once
npm run test:ui          # Vitest UI dashboard
npm run test:e2e         # Run Playwright E2E tests
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run type-check       # Run TypeScript type checking

# Database
npm run db:push          # Push Prisma schema to database
npm run db:generate      # Generate Prisma client
npm run db:seed          # Seed database with examples
npm run db:migrate       # Run pending migrations
npm run db:reset         # Reset database (WARNING: destructive)
npm run db:studio        # Open Prisma Studio GUI

# Utilities
npm run format           # Format code with Prettier
npm run clean            # Remove node_modules and build artifacts
```

## Environment Variables

Create `.env.local` with:

```
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gysom_db

# NextAuth
NEXTAUTH_SECRET=generated-secret-here
NEXTAUTH_URL=http://localhost:3000

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_USER_ACCOUNTS=true
LOG_LEVEL=debug
```

## Git Conventions

### Branch Naming
- `feature/description` - New features
- `fix/issue-number` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/topic` - Documentation only
- `test/feature-name` - Test additions
- No commits directly to `main`

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(pipeline): add intent extraction stage
fix(api): handle rate limit errors gracefully
refactor(components): extract ProjectInput logic
docs(README): update setup instructions
test(pipeline): add unit tests for DAG validation
```

Format: `<type>(<scope>): <description>`

### Pull Request Workflow
1. Create feature branch from `main`
2. Make commits following conventional commits
3. Ensure all tests pass: `npm run test && npm run test:e2e`
4. Run linter: `npm run lint:fix`
5. Open PR with descriptive title and body
6. Require 1 approval before merge
7. All CI checks must pass (lint, test, build)
8. Merge with "Squash and merge" strategy for clean history

### CI/CD Pipeline
- **On PR**: Run `npm run lint`, `npm run test`, `npm run build`
- **On Merge to main**: Run full test suite, deploy to Vercel staging
- **On Deployment**: Verify health check endpoint returns 200

## Deployment

### Vercel Configuration
- **Framework**: Next.js
- **Root Directory**: `.`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Environment Variables**: Manage in Vercel dashboard, pull from `.env.example`

### Pre-Deployment Checklist
- [ ] All tests passing (`npm run test && npm run test:e2e`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting issues (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables configured in Vercel
- [ ] Database migrations up to date
- [ ] CHANGELOG.md updated with release notes

### Monitoring
- Health check: `GET /api/health` returns `{ status: 'ok', timestamp: '...' }`
- Error tracking: Sentry integration for production errors
- Usage analytics: PostHog for compilation pipeline metrics
- Logs: Structured logging to CloudWatch with context tags

## Stages Deep Dive

### Stage 1: Intent Extraction
**Model**: Claude Opus 4.6 | **Output**: ProjectIntent object

Analyzes raw user input to extract:
- Primary goals and success criteria
- Project constraints (timeline, budget, team size)
- Technical scope and non-goals
- Stakeholders and decision authority

**Example Output**:
```json
{
  "goals": ["Build scalable REST API"],
  "constraints": { "timeline": "3 months", "team": 5 },
  "scope": { "included": [...], "excluded": [...] },
  "decisionAuthority": "Product Manager"
}
```

### Stage 2: Dependency Analysis
**Model**: Claude Opus 4.6 | **Output**: DirectedAcyclicGraph

Builds task dependency graph:
- Identifies all subtasks
- Determines prerequisites and blocking dependencies
- Highlights parallelizable workstreams
- Detects impossible/circular requirements (fails fast)

**Algorithm**: Topological sort with parallelism scoring

### Stage 3: Agent Assignment
**Model**: Claude Opus 4.6 | **Output**: AgentAssignments array

Matches agents to tasks:
- Code generation → Agent.CodeGeneration
- Testing → Agent.QA
- DevOps → Agent.Infrastructure
- Etc.

Identifies decision gates requiring human input before task execution.

### Stage 4: Human Input Identification
**Model**: Claude Sonnet 4.5 | **Output**: DecisionQuestionnaire

Batches all human decisions into single questionnaire:
- Prioritizes by impact (high-impact decisions first)
- Groups related questions
- Provides sensible defaults
- Estimates impact if decision delayed

### Stage 5: Prompt Generation
**Model**: Claude Sonnet 4.5 | **Output**: PromptLibrary (CLAUDE.md + per-agent prompts)

Generates production-ready prompts:
- CLAUDE.md: Project context, goals, constraints
- Per-agent prompts: Task-specific execution directives
- All prompts include failure modes and escalation paths

### Stage 6: Execution Plan
**Model**: Claude Sonnet 4.5 | **Output**: AGENTS.md

Orchestration manifest with:
- Agent execution order and dependencies
- Parallel execution windows
- Resource requirements (tokens, time)
- Monitoring checkpoints
- Rollback procedures

## Token Budget Management

- **Input**: User specifies max tokens for entire compilation
- **Pipeline Tracking**: Each stage tracks token consumption
- **Real-time Display**: Frontend shows remaining budget during streaming
- **Model Downgrade**: If budget threatened, auto-downgrade to cheaper model for remaining stages
- **Warning Threshold**: Alert user at 80% budget consumption

## Performance Targets

- **Compilation Time**: <10 seconds for typical project (5 subtasks)
- **DAG Visualization**: Render 100+ nodes in <1s
- **Token Efficiency**: <2000 tokens for small project, <5000 for complex
- **API Response**: 99.5% uptime, <500ms latency (excluding model inference)

## Future Extensions

- Template library for common project types (web app, API, ML pipeline, DevOps)
- Multi-user collaboration on projects
- Version history and rollback
- Custom agent library for specialized domains
- Voice input compilation
- Slack integration for team notifications
- GitHub workflow generation from execution plans
- Real-time compilation progress via WebSockets

---

**Last Updated**: February 2026 | **Version**: 1.0.0
