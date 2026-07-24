# Tasks: Job Tracker MCP Server

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

## Phase 1: Foundation / Infrastructure
- [x] 1.1 RED: Verify pnpm run mcp:start fails before installation. GREEN: Add `@modelcontextprotocol/sdk` to dependencies in `package.json` and add script `"mcp:start": "tsx src/mcp-server.ts"`. REFACTOR: Standardize dependency formatting.
- [x] 1.2 RED: Assert validation schemas fail on invalid structures. GREEN: In `src/mcp-server.ts`, define and export Zod schemas for Search, List, Add, and Update matching the design specification. REFACTOR: Refactor enum definitions to match database schema models.

## Phase 2: Core MCP Server & Tools
- [x] 2.1 RED: Verify stdio initialization fails without server setup. GREEN: Establish the stdio McpServer instance in `src/mcp-server.ts`, ensuring all debug logs and Prisma queries route to `stderr`. REFACTOR: Abstract the bootstrap configuration.
- [x] 2.2 RED: Verify search and import tools throw on missing required parameters or fail during scraper execution. GREEN: Implement tool handlers for `job_tracker_search_external_jobs` and `job_tracker_import_external_job` using `spawnSync` on the LinkedIn scraper. REFACTOR: Prevent shell command expansion by avoiding shell execution options.
- [x] 2.3 RED: Verify list, add, and update tools throw RPC standard error `-32602` on invalid params. GREEN: Implement tool handlers for `job_tracker_list_jobs`, `job_tracker_add_job`, and `job_tracker_update_job_status`, mapping inputs directly to Prisma repositories/use-cases and handling domain constraints. REFACTOR: Standardize use-case error handling across handlers.

## Phase 3: Testing & Verification
- [x] 3.1 RED: Assert mock JSON-RPC commands fail before test implementations. GREEN: Write comprehensive unit/integration tests in `src/mcp-server.test.ts` to verify handshake, tool registration, output redirection, and invalid param handling. REFACTOR: Clean up test suites.
- [x] 3.2 RED: Verify build failures on type mismatches. GREEN: Verify the five-step pre-deploy ladder runs cleanly: `pnpm typecheck`, `pnpm test`, `pnpm lint`, and `pnpm build`. REFACTOR: Ensure all test artifacts are cleaned up.

## Out of Scope
- HTTP/SSE transport, prompts, resources, or web/CLI integration.
