# Tasks: External Job Search & Integration

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

## Phase 1: Domain, Database, & DTO Extensions
- [x] 1.1 RED: Test mapping of job entities with sourceId. GREEN: Extend interface Job in src/modules/jobs/domain/entities/job.ts with sourceId (string or null). Extend JobListFilters with sourceId. REFACTOR: keep domain model clean.
- [x] 1.2 RED: Test that CreateJobInput and UpdateJobInput reject missing/wrong sourceId. GREEN: Extend input interfaces in src/modules/jobs/domain/repositories/job-repository.ts with sourceId.
- [x] 1.3 RED: Test that PrismaJobRepository persists and filters by sourceId. GREEN: Update create, update, and findAll methods in prisma-job-repository.ts to map sourceId and filter by it.
- [x] 1.4 RED: Test that validateCreateJobDto and parseUpdateJobDto validate source and sourceId (400 Bad Request on invalid types). GREEN: Update create-job.dto.ts and update-job.dto.ts with type assertions and validations.
- [x] 1.5 RED: Test that GET /api/v1/jobs filters results by query parameters source and sourceId. GREEN: Update jobs-router.ts to map query params and pass sourceId filter to ListJobsUseCase.

## Phase 2: CLI Client Extension & CLI Subcommands
- [x] 2.1 RED: Test that client.listJobs serializes source and sourceId in query string. GREEN: Update JobTrackerClient.listJobs in cli/api/client.ts to support optional source and sourceId query options.
- [x] 2.2 RED: Test that jobs:search validates --location and spawns scraper with exact flags. GREEN: Register jobs:search in cli/commands/jobs.ts using child_process.spawnSync running bun on guest scraper, output formatted table on stdout, do not save to DB.
- [x] 2.3 RED: Test that jobs:import validates location, calls listJobs to filter duplicates, runs createJob for new listings, and outputs summary statistics. GREEN: Register jobs:import subcommand in cli/commands/jobs.ts using client.listJobs for deduplication and client.createJob to import new jobs.

## Phase 3: Final Verification
- [x] 3.1 Verify clean build, lint, and types by executing backend checks: pnpm test, pnpm typecheck, and pnpm build.

---
Out of scope: UI search/import interfaces, cron/periodic scraping schedules, non-LinkedIn platform scrapers.
