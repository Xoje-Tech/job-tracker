# Design: Model Context Protocol (MCP) Server

## Technical Approach
An in-process MCP server over stdio will expose job tracking capabilities directly to AI agents. It instantiates repository and use-case layers directly to avoid network overhead, while utilizing `@modelcontextprotocol/sdk` for standard-compliant RPC handling. All domain outputs are JSON-RPC compliant, with validation layers returning protocol-appropriate standard error codes.

## Architecture Decisions
- **Decision**: In-Process Domain Interaction
  - **Choice**: Direct instantiation of `PrismaJobRepository`, `ListJobsUseCase`, `CreateJobUseCase`, and `UpdateJobUseCase`.
  - **Rationale**: Bypasses HTTP layer for speed, reliability, and simple error mapping.
- **Decision**: Stream Separation
  - **Choice**: All diagnostic logs, Prisma outputs, and subprocess errors go to `console.error`. `stdout` is reserved strictly for JSON-RPC.
  - **Rationale**: Prevent stream corruption on the stdio transport.
- **Decision**: External Integration Execution
  - **Choice**: Subprocess spawn using safe `child_process.spawnSync("bun", args, { shell: false })`.
  - **Rationale**: Reuses the validated Bun scraper codebase without SQL/command injection vulnerabilities.

## Data Flow
```
Client ──[JSON-RPC stdin/stdout]──→ MCP Server (src/mcp-server.ts)
                                           │
       ┌───────────────────────────────────┼───────────────────────────────────┐
       ▼ (Direct Instantiation)            ▼ (Subprocess Spawn)                ▼ (Direct Instantiation)
  Use Cases & Prisma Repos            Bun Scraper Process                 Database (via Prisma)
```

## File Changes
- `package.json` (Modify): Add `"mcp:start": "tsx src/mcp-server.ts"` to scripts, and add `@modelcontextprotocol/sdk` to dependencies.
- `src/mcp-server.ts` (Create): Implement the MCP Server exposing the 5 tools and interfacing directly with database use cases.

## Interfaces / Contracts

```typescript
import { z } from "zod";

const JobStatusSchema = z.enum(["SAVED", "INTERESTING", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN", "EXPIRED"]);
const JobSourceSchema = z.enum(["MANUAL", "LINKEDIN", "INDEED", "INFOJOBS", "GLASSDOOR", "WELCOME_TO_THE_JUNTLE", "REMOTE_OK", "SCRAPER", "API_REFERRAL", "OTHER"]);
const PrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const SearchSchema = z.object({ query: z.string().optional(), location: z.string().min(1), limit: z.number().optional() });
export const ListSchema = z.object({ status: JobStatusSchema.optional(), company: z.string().optional(), source: JobSourceSchema.optional(), limit: z.number().optional().default(20), offset: z.number().optional().default(0) });
export const AddSchema = z.object({ title: z.string().min(1), company: z.string().min(1), location: z.string().optional(), url: z.string().optional(), description: z.string().optional(), source: JobSourceSchema.optional().default("MANUAL") });
export const UpdateSchema = z.object({ id: z.string().min(1), status: JobStatusSchema, priority: PrioritySchema.optional() });
```

## Testing Strategy
- **Unit/Integration**: Write automated integration tests running the server via a mock stdio harness. Verify that calling tools invokes correct use cases and schema validations match standard JSON-RPC error frames (`-32602`).
- **Subprocess**: Mock `child_process.spawnSync` to assert correct args execution for `job_tracker_search_external_jobs` and `job_tracker_import_external_job`.

## Threat Matrix
- Documentation-like paths: N/A - The server does not classify or process local documentation paths.
- Git repository selection: N/A - No Git/VCS commands or repo-selection boundary.
- Commit state: N/A - No version control or index inspection tasks.
- Push state: N/A - No code publishing or Git pushes.
- PR commands: N/A - No PR or review automation.
*Subprocess Security Note*: Argument injection is prevented by utilizing `spawnSync` without `{ shell: true }`, ensuring arguments are passed as an explicit array to prevent shell command expansion.

## Migration / Rollout
No database migration is required. Rollout is accomplished by registering `"mcp:start"` in `package.json` for agent configurations.

## Open Questions
None. Operational flag: Bun CLI environment and path to `.agents/skills/linkedin-search/cli/src/cli.ts` must be available during testing.
