# Design: Multi-Portal Search Engine

## Technical Approach

We implement a pluggable, parallel search orchestrator as `SearchExternalJobsUseCase`. It dynamically discovers sub-scrapers under `.agents/skills/` ending with `-search`, filters them by requested `sources`, and spawns their CLIs (`bun run`) in parallel with standard argument parsing and format flags. Subprocesses run asynchronously with a 10s timeout. Results are merged, normalized to standard job cards, and deduplicated. Errors in individual scrapers are handled gracefully, allowing partial successes.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Orchestration | Use Case Class | Centralizes discovery, spawning, timeout handling, and normalisation logic. |
| Execution | Async `spawn` | Standard Node.js `child_process.spawn` wrapped in Promises with a 10s execution timeout per subprocess. Non-blocking parallel execution. |
| API / CLI | Routing-First | Expose `GET /api/v1/jobs/search`. CLI subcommand queries the REST API endpoint, keeping the CLI light and decoupled. |

## Data Flow

```
[CLI / MCP Client]
       │
       ▼ (HTTP GET)
[jobs-router.ts] ──(invoke)──→ [SearchExternalJobsUseCase]
                                       │
                         ┌─────────────┼─────────────┐ (Parallel Async spawn)
                         ▼             ▼             ▼
                     [linkedin]   [mercadona]     [other]
```

## File Changes

- `src/modules/jobs/application/use-cases/search-external-jobs.ts` (Create): Implement dynamic discovery of `-search` skills, parallel async child process spawning (Bun), 10s timeout, aggregation, normalization, and deduplication.
- `src/modules/jobs/interface/routes/jobs-router.ts` (Modify): Map `GET /api/v1/jobs/search` route with Zod validation. Return status 400 if `location` is missing.
- `cli/api/client.ts` (Modify): Add `searchExternalJobs` method calling `GET /api/v1/jobs/search`.
- `cli/commands/jobs.ts` (Modify): Update `search` subcommand to use `client.searchExternalJobs`. Print formatted table on stdout; validation errors or API errors exit with 1.
- `src/mcp-server.ts` (Modify): Update `job_tracker_search_external_jobs` tool to instantiate and execute `SearchExternalJobsUseCase` in-process.

## Interfaces / Contracts

```typescript
export interface SearchExternalJobsInput {
  query?: string;
  location: string;
  limit?: number;
  sources?: string[];
}

export interface ExternalJobCard {
  sourceId: string;
  source: string;
  title: string;
  company: string;
  location?: string;
  url?: string;
}
```

## Testing Strategy

- **Unit**: Verify `SearchExternalJobsUseCase` correctly filters discovered sub-scrapers, executes them with a mocked child process, aggregates cards, and handles 10s timeouts or parsing crashes.
- **Integration**: Verify route `GET /api/v1/jobs/search` responds with 400 when missing `location`, and 200 with aggregated deduplicated results under normal operations or when individual sub-scrapers fail.
- **CLI**: Verify `pnpm cli jobs search` prints a formatted table and exits with code 1 on missing parameters.

## Threat Matrix

| Boundary | Minimum adversarial cases | Applicability | Design response | Planned RED tests |
|---|---|---|---|---|
| Documentation-like paths | `requirements.txt`, `CMakeLists.txt`, MDX, `README.sh` | N/A | Sub-scrapers are searched as directory prefixes ending in `-search` under `.agents/skills/`. No arbitrary files or user paths are executed. | None |
| Git repository selection | `git -C`, relative paths, absolute paths | N/A | No repository operations or VCS-related directory context transitions occur. | None |
| Commit state | staged, `commit -a`, empty index | N/A | No code commit, worktree mutation, or git index actions are executed. | None |
| Push state | tracking branch, first push, explicit refspec | N/A | No remote repository pushing operations are involved in external searching. | None |
| PR commands | explicit `--head`, environment prefix, composed commands | N/A | No PR creation, automated reviews, or git push hooks are executed. | None |

*Security reinforcement*: Command injection is fully prevented by setting `{ shell: false }` inside `child_process.spawn`, passing arguments solely as a clean string array.

## Migration / Rollout

No database migration required. Roll out API changes and update CLI and MCP consumers.

## Open Questions

None.
