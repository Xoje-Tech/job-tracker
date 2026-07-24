# Tasks: Multi-Portal Search Engine

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

## Phase 1: Search External Jobs Use-Case
- [x] 1.1 RED: In `search-external-jobs.test.ts`, write tests asserting `SearchExternalJobsUseCase` dynamically discovers active scrapers in `/home/hermes/projects/job-tracker/.agents/skills/` ending in `-search` using `fs.readdirSync`, spawns subprocesses in parallel via Bun with `{ shell: false }`, enforces a 10s timeout, gracefully skips failed scrapers logging to `console.error` while returning partial results, and aggregates, normalizes, and deduplicates the standard job cards. GREEN: Implement the use-case in `search-external-jobs.ts`. REFACTOR: Optimize process execution and timeout logic.

## Phase 2: REST API & CLI Integration
- [x] 2.1 RED: In `jobs.test.ts`, test `GET /api/v1/jobs/search` returns 400 if `location` is missing, skips unknown requested sources, and routes to use-case. GREEN: Update `jobs-router.ts` to map the search GET route with parameter validation. REFACTOR: Clean up routing and validation.
- [x] 2.2 RED: Test `client.searchExternalJobs` formats request parameters. GREEN: Add `searchExternalJobs` method to `cli/api/client.ts`. REFACTOR: Standardize query param parsing.
- [x] 2.3 RED: Test that `pnpm cli jobs search` prints a table on success and exits 1 with stderr on missing location or API error. GREEN: Update `cli/commands/jobs.ts` `search` subcommand to query client. REFACTOR: Refactor option schema parsing.

## Phase 3: MCP Tool Integration
- [x] 3.1 RED: In `src/mcp-server.test.ts`, test `job_tracker_search_external_jobs` tool rejects missing location with RPC error `-32602` and invokes the use-case in-process on success. GREEN: Update the tool in `src/mcp-server.ts` to execute `SearchExternalJobsUseCase`. REFACTOR: Standardize tool definition.

## Phase 4: Verification
- [x] 4.1 Run verification: backend Vitest `pnpm test`, typecheck `pnpm typecheck`, and build `pnpm build`.

---
Out of scope: UI search/import interfaces, cron/periodic scraping schedules, non-LinkedIn platform scrapers.
