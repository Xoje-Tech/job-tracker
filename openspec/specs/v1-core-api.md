# Specification: Core API v1

## Status: IN PROGRESS

## Overview
REST API for job tracking management.

## Endpoints

### Jobs
- [x] GET /api/v1/jobs — List (paginated, filterable)
- [x] POST /api/v1/jobs — Create
- [x] GET /api/v1/jobs/:id — Read
- [x] PATCH /api/v1/jobs/:id — Update
- [x] DELETE /api/v1/jobs/:id — Delete

### Applications
- [x] GET /api/v1/applications — List
- [x] POST /api/v1/applications — Create
- [x] PATCH /api/v1/applications/:id/status — Update status
- [x] POST /api/v1/applications/:id/interviews — Schedule interview

### Companies
- [x] GET /api/v1/companies — List
- [x] POST /api/v1/companies — Create
- [ ] GET /api/v1/companies/:id — Read with jobs

## Future Specs
- v2: AI integration (cover letter, interview prep)
- v3: Job scraping (LinkedIn, Indeed, InfoJobs)
- v4: Web UI (React)
- v5: Notifications & reminders
- v6: Analytics dashboard
