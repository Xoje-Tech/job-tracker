# Proposal: Multi-Portal Search Engine

## Intent
Enable aggregate, parallel, and pluggable job searching across multiple job portals (e.g., LinkedIn, indeed, etc.) via API, CLI, and MCP, while keeping scraper integrations decoupled.

## Scope
### In Scope
- Decoupled sub-scrapers under `.agents/skills/<portal-name>/` with unified CLI search interface.
- Orchestrator in `src/modules/jobs/application/use-cases/search-external-jobs.ts` for discovery, parallel spawning, aggregation, normalization, and deduplication.
- Endpoint `GET /api/v1/jobs/search` accepting `query`, `location`, `limit`, `sources[]`.
- CLI command `pnpm cli jobs search` filtering by `--sources`.
- MCP tool `job_tracker_search_external_jobs` searching active portals.

### Out of Scope
- Automatic database persistence of searched jobs (requires explicit import/create).
- Frontend Web UI search page.
- Modifying database schema or `Job` models (already supports `source`/`sourceId`).

## Capabilities
### New Capabilities
- `multi-portal-search`: Search across active, decoupled external portals in parallel with unified CLI, REST API, and MCP entry points.

### Modified Capabilities
- None.

## Approach
- **Pluggable Sub-scrapers**: Scrapers live under `.agents/skills/<portal-name>/`. Each exposes a CLI interface: `bun run .agents/skills/<portal-name>/cli/src/cli.ts search --query <query> --location <location> --limit <limit> --format json` returning standard job card JSON.
- **Backend Orchestration**: `search-external-jobs.ts` use-case dynamically reads `.agents/skills/` directories, executes active portals in parallel using `child_process.spawn`, aggregates results, maps them to standard schema, and deduplicates by `source`/`sourceId`.
- **API, CLI, MCP Integration**: Router exposes route `GET /api/v1/jobs/search`. CLI subcommand `jobs search` in `cli/commands/jobs.ts` queries API. MCP server imports the use-case to serve the search.

## Affected Areas
- `src/modules/jobs/application/use-cases/search-external-jobs.ts` — New: Multi-portal orchestration use-case.
- `src/modules/jobs/interface/routes/jobs-router.ts` — Modified: Add search GET endpoint.
- `cli/commands/jobs.ts` — Modified: Add search subcommand.
- `src/mcp-server.ts` — Modified: Register the MCP external search tool.

## Risks
- Scraper CLI failure (Med): Timeout or malformed JSON handles gracefully via try/catch and logs warnings.
- Process exhaustion (Low): Limit parallel subprocess count and execution timeout to 10 seconds.

## Rollback Plan
- Application: Revert git commit and remove `/search` endpoints. Deleting new use-case disables orchestration.
- Schema: No-op. Database schema is unmodified.
- Verification: Execute `pnpm test` and verify health.

## Dependencies
- Active scraper tools placed under `.agents/skills/` (e.g. `linkedin-search`).

## Success Criteria
- [ ] Backend parallelly spawns multiple active portal sub-scrapers and aggregates results.
- [ ] API endpoint `/api/v1/jobs/search` retrieves merged deduplicated results.
- [ ] `pnpm cli jobs search` displays results correctly from specified portals.
- [ ] MCP tool returns clean JSON matching standard job card schema.
- [ ] All Vitest tests pass with >80% coverage.
