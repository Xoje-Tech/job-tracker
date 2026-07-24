# Proposal: Job Tracker Model Context Protocol (MCP) Server

## Intent
Expose Job Tracker features natively via standard Model Context Protocol (MCP) for direct agent-level search, import, listing, addition, and status updates.

## Scope

### In Scope
- Add `@modelcontextprotocol/sdk` dependency.
- Implement stdio transport MCP server in `src/mcp/server.ts`.
- Register five tools mapped to use cases:
  - `job_tracker_search_external_jobs`: Search via Bun scraper.
  - `job_tracker_import_external_job`: Search and import LinkedIn jobs.
  - `job_tracker_list_jobs`: Filter and list jobs.
  - `job_tracker_add_job`: Add manual or scraped job.
  - `job_tracker_update_job_status`: Update job status or priority.
- Add script `pnpm mcp:start` to run stdio server.
- Add unit/integration tests for handshake and tools.

### Out of Scope
- HTTP/SSE transport (stdio only).
- Custom MCP prompts/resources.
- Direct command-line integration with MCP clients.

## Capabilities

### New Capabilities
- `mcp-server`: Stdio interface exposing Job Tracker to AI systems.

### Modified Capabilities
- `v1-core-api`: Direct programmatic scraping, importing, and CRUD.

## Approach
- Add the SDK to `package.json`.
- Boot `McpServer` with tools mapped directly to use-cases.
- Redirect server logs to `stderr` to avoid JSON-RPC stream corruption.
- Re-use Zod schemas from CLI/API for tool input validations.

## Affected Areas
- `package.json` — Modified: Add dependencies and `mcp:start` script.
- `src/mcp/server.ts` — New: `McpServer` instance and tool registrations.
- `tests/mcp/server.test.ts` — New: Tool schema and execution tests.

## Risks
- Stdio Corruption (Med): Prisma/scraper logs must go to `stderr`.
- Stale SDK (Low): Pin standard SDK version.

## Rollback Plan
- Application: `git revert <merge-sha>` and redeploy. Deleting files disables MCP.
- Schema: None. No database modifications are introduced.
- Data: Clean test jobs via API/DB delete if needed.
- Backup: Verify SQLite `dev.db` backup before redeploy.
- Anti-commands: Never run `prisma migrate reset` in production.
- Verification: Run `pnpm test` and use MCP inspector.

## Dependencies
- `@modelcontextprotocol/sdk` NPM package.

## Success Criteria
- [ ] `pnpm mcp:start` launches the stdio JSON-RPC loop.
- [ ] Tool schemas validate inputs exactly as defined.
- [ ] Test suite passes with high tool coverage.
- [ ] No stdout noise (all logs go to `stderr`).
