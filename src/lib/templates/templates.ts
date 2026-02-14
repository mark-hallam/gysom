/**
 * Template definitions for common project types.
 * Each template provides default agent roles and markdown templates.
 */

import type { ProjectType, ModelTier, Priority } from "@/lib/types";

interface TemplateRole {
  name: string;
  expertise: string[];
  model: ModelTier;
  priority: Priority;
}

interface TemplateDefinition {
  projectType: ProjectType;
  name: string;
  description: string;
  typicalAgentCount: number;
  agentRoles: TemplateRole[];
  claudeMdTemplate: string;
  agentsMdTemplate: string;
}

export const TEMPLATE_DEFINITIONS: Record<ProjectType, TemplateDefinition> = {
  SaaS: {
    projectType: "SaaS",
    name: "Standard SaaS Application",
    description:
      "Multi-tenant SaaS platform with auth, billing, and core features",
    typicalAgentCount: 9,
    agentRoles: [
      { name: "Backend Architecture Lead", expertise: ["backend", "database", "api", "architecture"], model: "opus46", priority: "critical" },
      { name: "Frontend Architecture Lead", expertise: ["frontend", "react", "ux", "components"], model: "opus46", priority: "critical" },
      { name: "Database Engineer", expertise: ["database", "sql", "schema", "indexing"], model: "opus45", priority: "high" },
      { name: "API Engineer", expertise: ["api", "rest", "http", "backend"], model: "opus45", priority: "high" },
      { name: "Authentication Engineer", expertise: ["auth", "security", "tokens"], model: "opus45", priority: "critical" },
      { name: "Frontend Components Engineer", expertise: ["frontend", "react", "components", "ui"], model: "sonnet45", priority: "high" },
      { name: "Payment Integration Engineer", expertise: ["backend", "payments", "stripe", "billing"], model: "opus45", priority: "high" },
      { name: "DevOps Engineer", expertise: ["devops", "deployment", "infrastructure"], model: "sonnet45", priority: "high" },
      { name: "QA Engineer", expertise: ["testing", "qa", "integration-tests", "e2e"], model: "sonnet45", priority: "normal" },
    ],
    claudeMdTemplate: `# {{PROJECT_NAME}}

## Overview
{{PROJECT_DESCRIPTION}}

## Goals
{{GOALS}}

## Constraints
{{CONSTRAINTS}}

## Scope
- Complexity: {{COMPLEXITY_SCORE}}/10
- Estimated Agents: {{AGENT_COUNT}}
- Estimated Tokens: {{TOKEN_ESTIMATE}}

## Architecture
See AGENTS.md for detailed agent assignments and execution layers.
`,
    agentsMdTemplate: `# {{PROJECT_NAME}} — Agent Assignments

## Backend Team
- Backend Architecture Lead (Opus 4.6) — API design, data models, service layer
- Database Engineer (Opus 4.5) — Schema, migrations, indexes
- API Engineer (Opus 4.5) — REST endpoints, middleware, validation
- Authentication Engineer (Opus 4.5) — Auth flows, session management
- Payment Integration (Opus 4.5) — Billing, subscriptions, webhooks

## Frontend Team
- Frontend Architecture Lead (Opus 4.6) — Component hierarchy, routing, state
- Frontend Components (Sonnet 4.5) — UI components, styling, forms

## Infrastructure
- DevOps Engineer (Sonnet 4.5) — CI/CD, deployment, monitoring
- QA Engineer (Sonnet 4.5) — Tests, coverage, E2E
`,
  },

  ecommerce: {
    projectType: "ecommerce",
    name: "E-commerce Platform",
    description: "Full-featured e-commerce with products, cart, checkout, and admin",
    typicalAgentCount: 8,
    agentRoles: [
      { name: "Product Service Engineer", expertise: ["backend", "catalog", "search"], model: "opus46", priority: "critical" },
      { name: "Cart & Checkout Engineer", expertise: ["backend", "cart", "checkout"], model: "opus45", priority: "critical" },
      { name: "Payment Integration", expertise: ["payments", "stripe", "security"], model: "opus45", priority: "critical" },
      { name: "Admin Portal Engineer", expertise: ["frontend", "admin", "dashboard"], model: "opus45", priority: "high" },
      { name: "Frontend Engineer", expertise: ["frontend", "react", "ux"], model: "sonnet45", priority: "high" },
      { name: "Database Engineer", expertise: ["database", "sql", "schema"], model: "opus45", priority: "high" },
      { name: "DevOps Engineer", expertise: ["devops", "deployment"], model: "sonnet45", priority: "normal" },
      { name: "QA Engineer", expertise: ["testing", "qa"], model: "sonnet45", priority: "normal" },
    ],
    claudeMdTemplate: `# {{PROJECT_NAME}}

## Overview
{{PROJECT_DESCRIPTION}}

## Core Features
- Product catalog with search and filtering
- Shopping cart and checkout
- Payment processing
- Order management
- Admin dashboard

## Goals
{{GOALS}}

## Constraints
{{CONSTRAINTS}}
`,
    agentsMdTemplate: `# {{PROJECT_NAME}} — Agent Assignments

## Core
- Product Service (Opus 4.6) — Catalog, search, inventory
- Cart & Checkout (Opus 4.5) — Cart logic, checkout flow
- Payment Integration (Opus 4.5) — Stripe, webhooks, refunds

## Frontend
- Admin Portal (Opus 4.5) — Admin dashboard, order management
- Storefront (Sonnet 4.5) — Product pages, cart UI, checkout UI

## Infrastructure
- Database (Opus 4.5) — Schema, indexes, queries
- DevOps (Sonnet 4.5) — Deployment, monitoring
- QA (Sonnet 4.5) — Tests, E2E flows
`,
  },

  api: {
    projectType: "api",
    name: "REST API Service",
    description: "Scalable REST API with authentication, rate limiting, and documentation",
    typicalAgentCount: 6,
    agentRoles: [
      { name: "API Architect", expertise: ["api", "architecture", "rest"], model: "opus46", priority: "critical" },
      { name: "Service Implementation", expertise: ["backend", "business-logic"], model: "opus45", priority: "critical" },
      { name: "Authentication Engineer", expertise: ["auth", "security", "jwt"], model: "opus45", priority: "high" },
      { name: "Database Engineer", expertise: ["database", "sql", "schema"], model: "opus45", priority: "high" },
      { name: "DevOps Engineer", expertise: ["devops", "deployment", "monitoring"], model: "sonnet45", priority: "normal" },
      { name: "QA Engineer", expertise: ["testing", "qa", "api-testing"], model: "sonnet45", priority: "normal" },
    ],
    claudeMdTemplate: `# {{PROJECT_NAME}}

## Overview
{{PROJECT_DESCRIPTION}}

## Goals
{{GOALS}}

## Constraints
{{CONSTRAINTS}}
`,
    agentsMdTemplate: `# {{PROJECT_NAME}} — Agent Assignments

- API Architect (Opus 4.6) — Endpoint design, data contracts
- Service Implementation (Opus 4.5) — Business logic, handlers
- Auth Engineer (Opus 4.5) — JWT, rate limiting, security
- Database (Opus 4.5) — Schema, queries, migrations
- DevOps (Sonnet 4.5) — Deployment, CI/CD
- QA (Sonnet 4.5) — Integration tests, load tests
`,
  },

  mobile: {
    projectType: "mobile",
    name: "Mobile Application",
    description: "Cross-platform mobile app (React Native or native)",
    typicalAgentCount: 7,
    agentRoles: [
      { name: "Mobile Lead", expertise: ["mobile", "architecture", "react-native"], model: "opus46", priority: "critical" },
      { name: "UI Implementation", expertise: ["mobile", "ui", "animations"], model: "opus45", priority: "high" },
      { name: "Backend Integration", expertise: ["api", "backend", "sync"], model: "opus45", priority: "high" },
      { name: "State Management", expertise: ["state", "redux", "persistence"], model: "opus45", priority: "high" },
      { name: "Navigation Engineer", expertise: ["navigation", "routing", "deep-links"], model: "sonnet45", priority: "normal" },
      { name: "DevOps Engineer", expertise: ["devops", "app-store", "ci-cd"], model: "sonnet45", priority: "normal" },
      { name: "QA Engineer", expertise: ["testing", "mobile-testing", "qa"], model: "sonnet45", priority: "normal" },
    ],
    claudeMdTemplate: `# {{PROJECT_NAME}}

## Overview
{{PROJECT_DESCRIPTION}}

## Goals
{{GOALS}}

## Constraints
{{CONSTRAINTS}}
`,
    agentsMdTemplate: `# {{PROJECT_NAME}} — Agent Assignments

- Mobile Lead (Opus 4.6) — Architecture, screen flows
- UI Implementation (Opus 4.5) — Components, animations
- Backend Integration (Opus 4.5) — API calls, data sync
- State Management (Opus 4.5) — Redux/Context, persistence
- Navigation (Sonnet 4.5) — Routing, deep links
- DevOps (Sonnet 4.5) — Build, deploy, app store
- QA (Sonnet 4.5) — Device testing, E2E
`,
  },

  cli: {
    projectType: "cli",
    name: "Command Line Tool",
    description: "Developer-focused CLI tool with rich terminal UI",
    typicalAgentCount: 5,
    agentRoles: [
      { name: "CLI Architect", expertise: ["cli", "architecture", "commands"], model: "opus46", priority: "critical" },
      { name: "Command Implementation", expertise: ["cli", "commands", "parsers"], model: "opus45", priority: "critical" },
      { name: "Terminal UI Engineer", expertise: ["tui", "terminal", "ui"], model: "sonnet45", priority: "high" },
      { name: "DevOps Engineer", expertise: ["devops", "npm", "distribution"], model: "sonnet45", priority: "normal" },
      { name: "QA Engineer", expertise: ["testing", "qa", "cli-testing"], model: "sonnet45", priority: "normal" },
    ],
    claudeMdTemplate: `# {{PROJECT_NAME}}

## Overview
{{PROJECT_DESCRIPTION}}

## Goals
{{GOALS}}

## Constraints
{{CONSTRAINTS}}
`,
    agentsMdTemplate: `# {{PROJECT_NAME}} — Agent Assignments

- CLI Architect (Opus 4.6) — Command structure, plugin system
- Command Implementation (Opus 4.5) — Core commands, argument parsing
- Terminal UI (Sonnet 4.5) — Rich output, progress bars, prompts
- DevOps (Sonnet 4.5) — npm publish, CI/CD
- QA (Sonnet 4.5) — Command tests, integration tests
`,
  },

  data_pipeline: {
    projectType: "data_pipeline",
    name: "Data Pipeline System",
    description: "ETL/ELT data processing and transformation pipeline",
    typicalAgentCount: 6,
    agentRoles: [
      { name: "Data Architect", expertise: ["data", "architecture", "etl"], model: "opus46", priority: "critical" },
      { name: "ETL Implementation", expertise: ["etl", "transforms", "connectors"], model: "opus45", priority: "critical" },
      { name: "Data Quality Engineer", expertise: ["validation", "quality", "monitoring"], model: "opus45", priority: "high" },
      { name: "Infrastructure Engineer", expertise: ["infrastructure", "scheduling", "orchestration"], model: "sonnet45", priority: "high" },
      { name: "DevOps Engineer", expertise: ["devops", "deployment", "monitoring"], model: "sonnet45", priority: "normal" },
      { name: "QA Engineer", expertise: ["testing", "data-testing", "qa"], model: "sonnet45", priority: "normal" },
    ],
    claudeMdTemplate: `# {{PROJECT_NAME}}

## Overview
{{PROJECT_DESCRIPTION}}

## Goals
{{GOALS}}

## Constraints
{{CONSTRAINTS}}
`,
    agentsMdTemplate: `# {{PROJECT_NAME}} — Agent Assignments

- Data Architect (Opus 4.6) — Schema design, data flows
- ETL Implementation (Opus 4.5) — Extractors, transformers, loaders
- Data Quality (Opus 4.5) — Validation rules, anomaly detection
- Infrastructure (Sonnet 4.5) — Scheduling, orchestration
- DevOps (Sonnet 4.5) — Deployment, monitoring
- QA (Sonnet 4.5) — Data tests, pipeline tests
`,
  },
};
