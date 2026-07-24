# Design: External Job Search & Integration

## Technical Approach
We will extend the job tracker backend and Commander CLI to support searching and importing LinkedIn jobs. The system will invoke the LinkedIn guest scraper as a node child process under the `bun` runtime, parse the resulting JSON data, validate and filter against existing jobs in the database to prevent duplicates, and persist new jobs via the REST API.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Subprocess Execution** | `spawnSync` via Bun | Executes the JS-based scraper synchronously and parses its stdout JSON cleanly without async overhead. |
| **Deduplication Method** | Filter via `listJobs` API query | Avoids direct DB modification from the CLI; queries `/api/v1/jobs?source=LINKEDIN&sourceId=X` to check existences. |
| **Backend Integration** | Extend Prisma and DTOS | Seamlessly adds `sourceId: string | null` to existing jobs, aligning with the PostgreSQL schema field. |

## Data Flow
```
[CLI jobs:search/import] ──(spawn)──→ [LinkedIn Scraper]
         │                                   │ (JSON output)
         │◄──────────────────────────────────┘
         ├──(GET /api/v1/jobs?source=LINKEDIN&sourceId=X)──→ [Backend Check]
         │                                                      │
         ▼ (if not exists)                                      ▼
[POST /api/v1/jobs] ───────────────────────────────────────→ [Prisma / DB]
```

## File Changes
- `src/modules/jobs/domain/entities/job.ts`: Add `sourceId: string | null` to `Job` and `sourceId?: string` to `JobListFilters`.
- `src/modules/jobs/domain/repositories/job-repository.ts`: Add `sourceId?: string | null` to `CreateJobInput`/`UpdateJobInput`.
- `src/modules/jobs/infrastructure/persistence/prisma-job-repository.ts`: Handle `sourceId` in `findAll`, `create`, and `update`.
- `src/modules/jobs/application/dto/create-job.dto.ts` & `update-job.dto.ts`: Add `sourceId?: string | null` to DTO interfaces and validate/parse string/null types.
- `cli/api/client.ts`: Update `listJobs` to pass `source` and `sourceId` in the query string.
- `cli/commands/jobs.ts`: Register subcommands `jobs:search` and `jobs:import` executing scraper via Bun.

## Interfaces / Contracts

```typescript
export interface CreateJobDto {
  title: string;
  company: string;
  location?: string | null;
  remote?: string;
  url?: string | null;
  description?: string;
  source?: string;
  sourceId?: string | null;
}

export interface ScraperJobCard {
  id: string;
  title: string;
  company?: string;
  location?: string;
  date?: string;
  url?: string;
}
```

## Testing Strategy

- **Unit**: Verify `validateCreateJobDto` enforces strict string/null type validations on `source` and `sourceId`.
- **Integration**: Verify `PrismaJobRepository` filters jobs by `sourceId` and correctly persists `sourceId`.
- **E2E / CLI**: Verify `jobs:search` and `jobs:import` successfully spawn the subprocess, output a formatted table/summary, and skip duplicate listings.

## Threat Matrix

| Boundary | Minimum adversarial cases | Applicability | Design response | Planned RED tests |
|---|---|---|---|---|
| Documentation-like paths | `requirements.txt`, `CMakeLists.txt` | N/A | Subprocess does not parse or load manifest files. | None |
| Git repository selection | `git -C`, relative/absolute paths | N/A | Command does not switch git context or path authority. | None |
| Commit state | staged, `commit -a`, empty index | N/A | No git index interaction or VCS mutations occur. | None |
| Push state | tracking branch, explicit refspec | N/A | No push actions are conducted. | None |
| PR commands | explicit `--head`, composed commands | N/A | No pull request triggers or git branching occurs. | None |

## Migration / Rollout
No database schema migration is required as the database already defines `sourceId` on the `Job` model. Standard REST API rollback involves reverting the code changes. Deduplication relies on existing database query filters.

## Open Questions
- None. The guest scraper's JSON format and the database's existing indices are fully aligned.
