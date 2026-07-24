# Proposal: External Job Search & Integration

## Intent
Integrate LinkedIn job scraping to enable CLI-driven external job search and automated job import into the tracking database.

## Scope
### In Scope
- Copy LinkedIn guest scraper into `.agents/skills/linkedin-search`.
- `pnpm cli jobs:search`: Display LinkedIn search results without persistence.
- `pnpm cli jobs:import`: Query and persist listings, deduplicated by `source` & `sourceId`.
- Extend backend repository & schemas to support `sourceId`.

### Out of Scope
- Web UI search/import interface (deferred to v4).
- Automatic periodic scraping cron jobs.
- Scrapers for other platforms (e.g., Indeed, InfoJobs).

## Capabilities
### New Capabilities
- `external-job-search`: Search and import jobs from external platforms like LinkedIn.

### Modified Capabilities
- `v1-core-api`: Add `sourceId` support to create and check job endpoints.

## Approach
- Scraper Integration: Copied `linkedin-search` guest scraper as shared code.
- CLI Subcommands: Add `jobs:search` and `jobs:import` to `cli/commands/jobs.ts` via Commander.
- Backend DB Support: Update `CreateJobInput`, `validateCreateJobDto`, and `PrismaJobRepository` to support `sourceId`.
- Deduplication: In `jobs:import`, skip if `source='LINKEDIN'` and `sourceId` exists in DB; else persist.

## Affected Areas
- `.agents/skills/linkedin-search` — New: Scraper source files.
- `cli/commands/jobs.ts` — Modified: Subcommands `jobs:search` and `jobs:import`.
- `src/modules/jobs/domain/repositories/job-repository.ts` — Modified: Add `sourceId` to `CreateJobInput`.
- `src/modules/jobs/application/dto/create-job.dto.ts` — Modified: Add `sourceId` to validation.
- `src/modules/jobs/infrastructure/persistence/prisma-job-repository.ts` — Modified: Pass `sourceId` to Prisma create.

## Risks
- Scraper breakage (Med): Keep scraper isolated and easy to update.
- Missing dependencies (Low): Validate required modules in `package.json`.
- Index failures (Low): Prisma unique guards prevent duplicate inserts.

## Rollback Plan
- Application: `git revert <merge-sha>` and redeploy. Deleting copied files disables the CLI subcommands.
- Schema: None needed (source/sourceId already exist in prisma schema).
- Data: To purge, run `DELETE FROM "Job" WHERE source = 'LINKEDIN'`. Backup database first.
- Anti-commands: Never run `prisma db push --force` or `prisma migrate reset` in production.
- Verification: Run `pnpm cli status` & `pnpm test` to verify health.

## Dependencies
- `.agents/skills/linkedin-search` tool source copied from global tools.

## Success Criteria
- [ ] `pnpm cli jobs:search` successfully queries LinkedIn and displays results in a table.
- [ ] `pnpm cli jobs:import` successfully imports new listings into the database.
- [ ] Repeated imports of the same job are skipped with zero duplicates.
- [ ] Standard test suite passes with high statement and branch coverage.
