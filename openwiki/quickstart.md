# Job Tracker Documentation

AI-powered job search management system with CLI, REST API, and agent integration.

## Quick Start

### Prerequisites
- Node.js 26+ installed
- PostgreSQL 16+ or SQLite (for local development)
- Docker Compose installed
- pnpm package manager

### One-Step Setup
```bash
# 1. Start database container
docker compose up -d db

# 2. Install dependencies & generate Prisma client
pnpm install
pnpm db:generate
pnpm db:push

# 3. Run tests
pnpm test

# 4. Start dev server
pnpm dev
```

API available at `http://localhost:3000`

### CLI Commands
```bash
pnpm cli status           # Server status
pnpm cli jobs list        # List all jobs
pnpm cli jobs add -t "Title" -c "Company"  # Add new job
pnpm cli applications list  # List applications
pnpm cli applications apply -j <jobId>  # Apply to job
```

## Project Structure

```
job-tracker/
├── src/                    # Main application (hexagonal architecture)
│   ├── modules/           # Domain modules (jobs, applications, companies)
│   ├── shared/            # Shared utilities, middleware, config
│   ├── server.ts          # Express app factory
│   └── index.ts           # Bootstrap entry point
├── cli/                   # CLI commands and API client
├── prisma/                # Database schema and migrations
├── openspec/              # OpenAPI specifications
├── tests/                 # Test files
└── docker-compose.yml     # Service orchestration
```

## Tech Stack
- **Runtime**: Node.js 26 + TypeScript 5
- **Framework**: Express 5 REST API
- **Database**: PostgreSQL 16+ with Prisma 7 ORM (SQLite for local dev)
- **Infrastructure**: Docker Compose, GitHub Actions CI/CD
- **Testing**: Vitest with coverage

## Architecture Overview

The application follows **hexagonal architecture** (clean architecture) with three main layers:

1. **Domain Layer** (`src/modules/*/domain/`) - Pure business logic, entities, and repository interfaces
2. **Application Layer** (`src/modules/*/application/`) - Use cases that orchestrate domain objects
3. **Infrastructure Layer** (`src/modules/*/infrastructure/`) - Concrete implementations (Prisma repositories)
4. **Interface Layer** (`src/modules/*/interface/`) - REST routes and CLI commands

See [Architecture](architecture/overview.md) for detailed breakdown.

## Key Domains

- **Jobs**: Job postings to track
- **Applications**: Applications submitted to jobs
- **Companies**: Companies hiring

See [Domain Concepts](domain/concepts.md) for entity relationships.

## API Documentation

See `openspec/specs/v1-core-api.md` for detailed endpoint specifications.

## Development

- `pnpm dev` - Start dev server with hot reload
- `pnpm build` - Compile TypeScript
- `pnpm test` - Run tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Check linting
- `pnpm format` - Format code with Prettier

## Next Steps

- [Architecture Overview](architecture/overview.md) - System design and patterns
- [API Reference](api/reference.md) - Endpoint documentation
- [Domain Concepts](domain/concepts.md) - Entities and workflows
- [Development Setup](development/setup.md) - Environment configuration