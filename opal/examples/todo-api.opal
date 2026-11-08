# opal todo-api
version: 1
budget.files: 10
budget.words: 1200

## decide
runtime: node-22            # Which runtime?
framework: hono             # Which HTTP framework?
db: sqlite                  # Which database for v1?
orm: drizzle                # Which ORM?
api_style: rest             # REST or GraphQL?
auth: none                  # Auth in v1?
empty_title: reject-400     # Empty todo title?
id_format: uuid-v7          # ID format?
test_runner: vitest         # Test runner?

## context
A minimal REST API for todos on {{decide.framework}} with {{decide.orm}} over {{decide.db}}.
Conventions: TypeScript strict, ESM, 2-space indent, named exports only.
Routes: `GET /todos`, `POST /todos`, `PATCH /todos/:id`, `DELETE /todos/:id`.
A todo is `{ id, title, done, createdAt }`. Validation errors return 400 with `{ error }`.
Read `package.json` before adding dependencies; add only what a task's `do` names.

## task foundation
owns: package.json, tsconfig.json, vitest.config.ts, src/index.ts, .gitignore
do:
1. WRITE package.json with scripts `dev`, `build`, `test` ({{decide.test_runner}}), `typecheck` (tsc --noEmit); deps {{decide.framework}}, @hono/node-server, {{decide.orm}}-orm, better-sqlite3; devDeps typescript, {{decide.test_runner}}, @types/better-sqlite3.
2. WRITE tsconfig.json: strict, ESM, NodeNext, outDir dist.
3. WRITE vitest.config.ts with node environment.
4. WRITE src/index.ts creating a {{decide.framework}} app with `GET /health` returning `{ ok: true }` and exporting `app`.
5. WRITE .gitignore with node_modules, dist, *.db.
6. RUN npm install, then the typecheck.
verify:
npm run typecheck
node -e "import('./src/index.ts').catch(()=>process.exit(0))"
done: package.json, tsconfig.json, vitest.config.ts, src/index.ts, .gitignore
commit: chore: scaffold {{decide.framework}} + {{decide.test_runner}} foundation

## task schema
needs: foundation
owns: src/db/**
do:
1. WRITE src/db/schema.ts defining a `todos` table with {{decide.orm}}: id text primary key, title text not null, done integer not null default 0, created_at integer not null.
2. WRITE src/db/client.ts exporting `db` ({{decide.orm}} over better-sqlite3 at `./todo.db`) and `migrate()` that creates the table if missing.
3. RUN the typecheck.
verify:
npm run typecheck
test -f src/db/schema.ts
done: src/db/schema.ts, src/db/client.ts
commit: feat(db): todos schema and {{decide.db}} client

## task todos-routes
needs: schema
owns: src/routes/**, src/index.ts
do:
1. WRITE src/routes/todos.ts exporting a {{decide.framework}} router with the four routes from context. Titles are trimmed; empty titles are handled per decision empty_title={{decide.empty_title}}. IDs are {{decide.id_format}}.
2. WRITE src/index.ts: call `migrate()` on startup and mount the router at `/todos`, keeping `GET /health`.
3. RUN the typecheck.
verify:
npm run typecheck
grep -q "/todos" src/index.ts
done: src/routes/todos.ts, src/index.ts
commit: feat(api): todos CRUD routes

## task tests
needs: todos-routes
owns: test/**
do:
1. WRITE test/todos.test.ts using {{decide.test_runner}} and the exported `app`: create, list, patch done=true, delete, and the empty-title 400 case.
2. RUN the test suite; fix failures only inside test/** or report as blocker.
verify:
npm test
done: test/todos.test.ts
commit: test(api): todos route coverage

## task readme
needs: foundation
owns: README.md
do:
1. WRITE README.md: one paragraph, install/run/test commands, the four routes, and the bound decisions as a table.
verify:
grep -q "POST /todos" README.md
done: README.md
commit: docs: readme

## finally
verify:
npm run typecheck
npm test
