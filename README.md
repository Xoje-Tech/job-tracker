# Job Tracker

AI-powered job search management system.

## Quick Start

1. Start DB: `docker compose up -d db`
2. Install: `pnpm install && pnpm db:generate && pnpm db:push`
3. Dev: `pnpm dev`

## CLI

- `pnpm cli status` - Server status
- `pnpm cli jobs list` - List jobs
- `pnpm cli jobs add -t "Title" -c "Company"` - Add job
- `pnpm cli applications list` - List applications
- `pnpm cli applications apply -j <jobId>` - Apply to job

## API

- `GET /api/health` - Health check
- `GET /api/v1/jobs` - List jobs
- `POST /api/v1/jobs` - Create job
- `GET /api/v1/jobs/:id` - Get job
- `PATCH /api/v1/jobs/:id` - Update job
- `DELETE /api/v1/jobs/:id` - Delete job
- `GET /api/v1/applications` - List applications
- `POST /api/v1/applications` - Create application
- `PATCH /api/v1/applications/:id/status` - Update status
- `POST /api/v1/applications/:id/interviews` - Schedule interview
- `GET /api/v1/companies` - List companies
- `POST /api/v1/companies` - Create company

## Stack

Node.js + TypeScript + Express + Prisma + PostgreSQL + Docker + Vitest
