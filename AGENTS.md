# AGENTS.md — Job Tracker

> This file is the entry point for any AI agent working on the job-tracker project.
> Read this first before making any changes. It tells you how to run, test, and
> interact with the project safely.

---

## What is job-tracker

A job application tracking system built as a REST API + CLI, dockerized and ready
for AI agent assistance. Track job postings, companies, and your applications through
their full lifecycle.

- **Stack:** Node.js 26 + TypeScript 5 + Express 5 + Prisma 7 + PostgreSQL 16
- **Package manager:** pnpm (never npm)
- **Test runner:** Vitest
- **Containerization:** Docker Compose (app + postgres)

---

## Quick Start (one-shot)

```bash
cd /home/hermes/proyectos/job-tracker

# 1. Start database
docker compose up -d db

# 2. Install deps
pnpm install

# 3. Generate Prisma client + push schema
pnpm db:generate
pnpm db:push

# 4. Run tests
pnpm test

# 5. Start dev server (hot reload)
pnpm dev
```

API available at `http://localhost:3000`.

---

## Essential Commands

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload (tsx watch) |
| `pnpm build` | Compile TypeScript → `dist/` |
| `pnpm start` | Run compiled production build |
| `pnpm test` | Run all tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm typecheck` | TypeScript type-check without emitting |
| `pnpm lint` | ESLint on src/ and cli/ |
| `pnpm lint:fix` | ESLint with auto-fix |
| `pnpm format` | Prettier format on src/ and cli/ |
| `pnpm format:check` | Prettier check without modifying |
| `pnpm db:migrate` | Create + apply Prisma migration |
| `pnpm db:push` | Push schema to DB without migration files |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:studio` | Open Prisma Studio (DB GUI) |
| `pnpm cli <command>` | Run CLI commands (see below) |

---

## Environment Variables

Configured in `.env` (loaded via Zod in `src/config/env.ts`):

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | **yes** | — | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | no | `development` | `development` \| `production` \| `test` |
| `PORT` | no | `3000` | HTTP server port |
| `API_KEY` | no | — | Bearer <REDACTED> required in production |
| `LOG_LEVEL` | no | `info` | `debug` \| `info` \| `warn` \| `error` |

Docker Compose uses: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`.

---

## API Endpoints

Base URL: `http://localhost:3000` (override with `JOB_TRACKER_URL` env).

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness probe |
| GET | `/api/health/db` | Database connectivity check |

### Jobs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/jobs` | List (query: `status`, `companyId`, `source`, `limit`, `offset`) |
| POST | `/api/v1/jobs` | Create job |
| GET | `/api/v1/jobs/:id` | Get job by ID |
| PATCH | `/api/v1/jobs/:id` | Update job fields |
| DELETE | `/api/v1/jobs/:id` | Delete job |

### Applications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/applications` | List (query: `status`, `jobId`, `limit`, `offset`) |
| POST | `/api/v1/applications` | Create application (apply to a job) |
| PATCH | `/api/v1/applications/:id/status` | Update application status |
| POST | `/api/v1/applications/:id/interviews` | Schedule an interview |

### Companies
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/companies` | List (query: `industry`, `limit`, `offset`) |
| POST | `/api/v1/companies` | Create company |
| GET | `/api/v1/companies/:id` | Get company with its jobs |

### Response Format
- Success: `{ data: ... }` or `{ data: [], total, limit, offset }` for lists
- Error: `{ error: string, details?: unknown }`
- IDs are CUIDs
- Timestamps are ISO 8601

---

## CLI Commands

Run via `pnpm cli <command>`:

| Command | Usage | Description |
|---------|-------|-------------|
| `jobs list` | `[-s status] [-c companyId] [-l limit]` | List jobs |
| `jobs add` | `-t title -c company [options]` | Add new job |
| `jobs get` | `-i id` | Get job details |
| `applications list` | `[-s status] [-l limit]` | List applications |
| `applications apply` | `-j jobId [options]` | Apply to a job |
| `applications status` | `-i id -s status [-n note]` | Update application status |
| `companies list` | `[-i industry] [-l limit]` | List companies |
| `status` | — | Show system status |

**Agent note:** Use `--json` flag (when available) for machine-readable output.
When not available, parse `console.table` output carefully or prefer the HTTP API.

---

## Project Structure

```
job-tracker/
├── src/
│   ├── index.ts          # Bootstrap: connect DB + listen
│   ├── server.ts         # createApp() factory (testable)
│   ├── config/
│   │   └── env.ts        # Zod-validated env vars
│   ├── lib/
│   │   └── prisma.ts     # Prisma client singleton
│   ├── middleware/
│   │   └── error.ts      # Global error handler
│   └── routes/
│       ├── health.ts     # Health endpoints
│       ├── jobs.ts       # Jobs CRUD
│       ├── applications.ts # Applications CRUD + interviews
│       └── companies.ts  # Companies CRUD
├── cli/
│   ├── index.ts          # CLI entry point (Commander)
│   ├── api/
│   │   └── client.ts     # HTTP client for API
│   └── commands/
│       ├── jobs.ts       # Job commands
│       ├── applications.ts # Application commands
│       ├── companies.ts  # Company commands
│       └── status.ts     # Status command
├── prisma/
│   └── schema.prisma     # Database schema (11 models, 12 enums)
├── tests/
│   ├── setup.ts          # Test bootstrap (dotenv, NODE_ENV=test)
│   └── routes/
│       ├── health.test.ts
│       └── jobs.test.ts
├── agent-skill/
│   └── SKILL.md          # Hermes skill definition
├── openspec/
│   ├── config.yaml       # SDD project config
│   └── specs/
│       └── v1-core-api.md # API specification
├── docker-compose.yml    # App + Postgres
├── Dockerfile            # Multi-stage build
├── package.json          # Scripts and dependencies
├── tsconfig.json         # TypeScript config (strict, path alias @/)
├── vitest.config.ts      # Test config
├── eslint.config.js      # ESLint config
└── .prettierrc.json      # Prettier config
```

---

## Architecture Conventions

### Code Style
- **Strict TypeScript** — `noUnusedLocals`, `noImplicitReturns`, strict mode
- **Type-only imports** — use `import type` for type-only imports
- **Path alias** — `@/` maps to `src/`
- **ESLint + Prettier** — enforced, run `pnpm lint:fix` before committing
- **File size** — keep files small and focused. Split at ~200-300 lines.

### API Patterns
- Routes use `createApp()` factory pattern for testability
- Responses wrapped in `{ data }` envelope
- Errors use custom `AppError` class with status codes
- Zod for validation (env vars already validated, route validation in progress)
- Pagination: `limit` + `offset` query params, response includes `total`

### Database
- Prisma ORM with PostgreSQL
- CUIDs for all primary keys
- Soft relations with cascade deletes where appropriate
- Enums map directly to PostgreSQL enum types

### Testing
- Vitest with Node environment
- Tests gracefully skip if DB unavailable (soft fallback pattern)
- Coverage targets: 80% statements, 70% branches, 80% functions/lines
- Test pattern: `tests/{layer}/{module}.test.ts`

---

## Key Enums (for validation)

**JobStatus:** SAVED → INTERESTING → APPLIED → INTERVIEW → OFFER → REJECTED / WITHDRAWN / EXPIRED

**ApplicationStatus:** DRAFT → SUBMITTED → SCREENING → PHONE_SCREEN → TECHNICAL → ONSITE → OFFER_RECEIVED → NEGOTIATION → ACCEPTED / REJECTED / GHOSTED / WITHDRAWN

**RemoteType:** ONSITE, REMOTE, HYBRID, UNKNOWN

**Priority:** LOW, MEDIUM, HIGH, URGENT

**InterviewType:** PHONE, VIDEO, ONSITE, TECHNICAL, CULTURE_FIT, PANEL, FINAL

**InterviewResult:** PENDING, PASSED, FAILED, CANCELLED, RESCHEDULED

---

## Agent Interaction Guidelines

### When implementing a new feature:
1. Check `openspec/specs/` for the spec
2. Run `pnpm typecheck` before and after changes
3. Run `pnpm test` to verify nothing breaks
4. Run `pnpm lint:fix` to ensure code style
5. Update the spec checklist when done

### When adding a new API endpoint:
1. Add route handler in `src/routes/`
2. Register route in `src/server.ts`
3. Add tests in `tests/routes/`
4. Update `openspec/specs/` with the new endpoint
5. Update `agent-skill/SKILL.md` with curl examples

### When adding a CLI command:
1. Create command file in `cli/commands/`
2. Register in `cli/index.ts`
3. Use `JobTrackerClient` from `cli/api/client.ts`
4. Support `--json` flag for machine-readable output

### When modifying the database schema:
1. Edit `prisma/schema.prisma`
2. Run `pnpm db:generate` to update the client
3. Run `pnpm db:push` (dev) or `pnpm db:migrate` (with migration history)
4. Update any affected routes/tests

---

## SDD (Spec-Driven Development)

This project uses SDD via openspec. Pipeline:
```
/sdd-new → explore → propose → spec → design → tasks → apply → verify → archive
```

- Specs live in `openspec/specs/`
- Config in `openspec/config.yaml`
- Strict TDD mode is active

---

## Hermes Skill

The `agent-skill/SKILL.md` file defines how Hermes interacts with this project.
It documents the API, provides curl examples, and status workflows.

When the API changes, update the skill file to keep it in sync.

---

*Last updated: 2026-06-28*
