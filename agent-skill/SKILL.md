---
name: job-tracker
description: "Interact with the Job Tracker system to manage job postings, applications, companies, and interviews. Use when the user wants to track job applications, search for jobs, apply to positions, schedule interviews, or get job search status."
version: 1.0.0
author: job-tracker
platforms: [linux, macos]
tags: [job-tracker, job-search, applications, api, cli]
trigger:
  - "track this job"
  - "show my applications"
  - "apply to job"
  - "job search status"
  - "add job from"
  - "list my jobs"
  - "schedule interview"
  - "update application"
  - "job tracker"
  - "what jobs do I have"
  - "what applications are"
  - "add a job"
---

# Job Tracker — Agent Skill

This skill enables AI agents to interact with the Job Tracker system via its REST API
or CLI. It covers job postings, companies, applications, interviews, and the overall
job search workflow.

## When to Use This Skill

Activate when the user mentions:
- Job tracking, job search, job applications
- Applying to a job or posting
- Scheduling or preparing for interviews
- Checking status of their job search
- Managing companies they've applied to
- Adding jobs from LinkedIn, Indeed, or other sources

## Prerequisites

- The job-tracker service must be running: `pnpm dev` (or via Docker)
- Default URL: `http://localhost:3000`
- Override with `JOB_TRACKER_URL` environment variable
- Database must be running for full functionality (`docker compose up -d db`)

## API Base URL

Default: `http://localhost:3000`
Override with `JOB_TRACKER_URL` environment variable.

## Available Operations

### Health Check
```bash
curl $JOB_TRACKER_URL/api/health
```

### Jobs

#### List jobs
```bash
curl "$JOB_TRACKER_URL/api/v1/jobs?status=SAVED&limit=20"
```

#### Get job details
```bash
curl "$JOB_TRACKER_URL/api/v1/jobs/{job_id}"
```

#### Create job
```bash
curl -X POST "$JOB_TRACKER_URL/api/v1/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Backend Developer",
    "company": "Acme Corp",
    "location": "Barcelona",
    "remote": "REMOTE",
    "url": "https://...",
    "description": "...",
    "source": "MANUAL"
  }'
```

#### Update job
```bash
curl -X PATCH "$JOB_TRACKER_URL/api/v1/jobs/{job_id}" \
  -H "Content-Type: application/json" \
  -d '{"status": "INTERESTING", "priority": "HIGH"}'
```

#### Delete job
```bash
curl -X DELETE "$JOB_TRACKER_URL/api/v1/jobs/{job_id}"
```

### Applications

#### List applications
```bash
curl "$JOB_TRACKER_URL/api/v1/applications?status=TECHNICAL"
```

#### Create application (apply to a job)
```bash
curl -X POST "$JOB_TRACKER_URL/api/v1/applications" \
  -H "Content-Type: application/json" \
  -d '{"job_id": "...", "coverLetter": "..."}'
```

#### Update application status
```bash
curl -X PATCH "$JOB_TRACKER_URL/api/v1/applications/{app_id}/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "TECHNICAL", "note": "Completed tech interview"}'
```

#### Schedule interview
```bash
curl -X POST "$JOB_TRACKER_URL/api/v1/applications/{app_id}/interviews" \
  -H "Content-Type: application/json" \
  -d '{"type": "TECHNICAL", "scheduledAt": "2026-07-15T10:00:00Z", "duration": 90}'
```

### Companies

#### List companies
```bash
curl "$JOB_TRACKER_URL/api/v1/companies"
```

#### Create company
```bash
curl -X POST "$JOB_TRACKER_URL/api/v1/companies" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "industry": "Tech", "website": "https://acme.com"}'
```

#### Get company with jobs
```bash
curl "$JOB_TRACKER_URL/api/v1/companies/{company_id}"
```

## Response Format

All endpoints return JSON with consistent structure:

**Single resource:**
```json
{ "data": { ... } }
```

**List:**
```json
{ "data": [...], "total": 42, "limit": 20, "offset": 0 }
```

**Error:**
```json
{ "error": "Description", "details": {...} }
```

## Status Workflows

### Job Status
`SAVED` → `INTERESTING` → `APPLIED` → `INTERVIEW` → `OFFER` / `REJECTED` / `WITHDRAWN` / `EXPIRED`

### Application Status
`DRAFT` → `SUBMITTED` → `SCREENING` → `PHONE_SCREEN` → `TECHNICAL` → `ONSITE` → `OFFER_RECEIVED` → `NEGOTIATION` → `ACCEPTED` / `REJECTED` / `GHOSTED` / `WITHDRAWN`

### Interview Types
`PHONE`, `VIDEO`, `ONSITE`, `TECHNICAL`, `CULTURE_FIT`, `PANEL`, `FINAL`

### Interview Results
`PENDING`, `PASSED`, `FAILED`, `CANCELLED`, `RESCHEDULED`

## Agent Workflow Patterns

### Adding a job
1. Check if company exists: `GET /api/v1/companies?name=...`
2. If not, create it: `POST /api/v1/companies`
3. Create job with `source: "MANUAL"` or detected source
4. Ask user if they want to apply immediately

### Applying to a job
1. Get job details: `GET /api/v1/jobs/{id}`
2. Create application: `POST /api/v1/applications` with `job_id`
3. Optionally update job status to `APPLIED`

### Tracking interview progress
1. Get application: `GET /api/v1/applications/{id}`
2. Schedule interview: `POST /api/v1/applications/{id}/interviews`
3. After interview, update status: `PATCH /api/v1/applications/{id}/status`

### Status overview
1. `GET /api/v1/jobs?status=APPLIED` — active pipeline
2. `GET /api/v1/applications?status=TECHNICAL` — pending interviews
3. `GET /api/v1/companies` — prospect/employer landscape

## CLI Alternative

The project also provides a CLI for terminal usage:
```bash
pnpm cli jobs list
pnpm cli jobs add -t "Title" -c "Company"
pnpm cli applications apply -j <jobId>
pnpm cli status
```

Note: CLI output is human-readable. Prefer the API for programmatic interaction.
The CLI will support `--json` flag in future versions for machine-readable output.

## Notes
- All IDs are CUID strings (e.g., `clxqxyz123abc...`)
- Timestamps are ISO 8601 format
- The API is stateless; no authentication required for local use
- For production, set `API_KEY` env var to enable bearer <REDACTED>
- See `AGENTS.md` in the project root for development conventions
