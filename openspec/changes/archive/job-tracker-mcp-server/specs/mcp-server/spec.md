# Specification: Model Context Protocol (MCP) Server

## Purpose
Expose Job Tracker capabilities natively via the standard Model Context Protocol (MCP) for direct agentic search, import, listing, manual addition, and status tracking. The communication is established over standard input/output (stdio) streams with isolated telemetry.

## Non-Goals
- Custom prompts or resource definitions are out of scope for this spec.
- HTTP or SSE (Server-Sent Events) transport is out of scope.

## Requirements

### Requirement: Stdio Transport Isolation
The MCP server MUST operate strictly using stdio as its transport layer.
- All JSON-RPC communication frames MUST be printed directly to standard output (`stdout`).
- `stdout` MUST be reserved exclusively for JSON-RPC protocol messages. Non-protocol output (e.g., debug logs, startup logs, error traces, console prints, database logs) MUST NOT be emitted on `stdout`.
- All server diagnostics, startup messages, informational logs, warnings, errors, and database adapter logs MUST be redirected strictly to standard error (`stderr`) to prevent stream corruption.

#### Scenario: Handshake initialization isolated stream
- GIVEN the MCP server is executed via `pnpm mcp:start`
- WHEN the client sends an MCP `initialize` request frame via stdin
- THEN the server MUST write a valid JSON-RPC `initialize` response frame to stdout
- AND any startup initialization messages or warning logs MUST be emitted to stderr, leaving stdout completely clean of non-JSON-RPC text

---

### Requirement: Tool Input Validation & Protocol Error Handling
The MCP server MUST validate all tool inputs against their schemas using Zod.
- If tool arguments fail validation, the server MUST NOT crash or emit validation traces to stdout.
- The server MUST catch validation errors and return a structured JSON-RPC error response containing a clear validation message and a proper protocol error code (standard RPC code `-32602` Invalid Params).
- For well-formed inputs that violate domain invariants (e.g., updating a non-existent job ID), the server MUST return an error indicating that the entity does not exist or a domain conflict has occurred.

#### Scenario: Tool call with invalid arguments
- GIVEN the MCP server is initialized and running
- WHEN the client sends a `tools/call` request for `job_tracker_add_job` with the `title` parameter missing
- THEN the server MUST return a JSON-RPC error response with code `-32602` (Invalid Params)
- AND the stdout stream MUST remain a valid JSON-RPC frame sequence

---

### Requirement: Tool Registration
The MCP server MUST register exactly 5 tools:
1. `job_tracker_search_external_jobs`
2. `job_tracker_import_external_job`
3. `job_tracker_list_jobs`
4. `job_tracker_add_job`
5. `job_tracker_update_job_status`

---

### Requirement: `job_tracker_search_external_jobs` Tool
The server MUST expose external job searches via the `job_tracker_search_external_jobs` tool.
- Input Schema:
  - `query` (string, optional): Search keyword.
  - `location` (string, required): Location to search (non-empty string).
  - `limit` (number, optional): Max results to return.
- Behavior: Spawns the LinkedIn scraper subprocess using `bun` (running `.agents/skills/linkedin-search/cli/src/cli.ts search`) and parses the standard output as JSON.
- It MUST NOT mutate the database.

#### Scenario: Happy path search for software engineer jobs
- GIVEN the MCP server is running and scraper dependencies are available
- WHEN the client calls `job_tracker_search_external_jobs` with `location="London"`, `query="software engineer"`, and `limit=5`
- THEN the server spawns the LinkedIn scraper subprocess with arguments: `search --query "software engineer" --location "London" --limit 5 --format json`
- AND the scraper returns job listings on stdout with exit code 0
- AND the server returns those listings in the tool's output array to the MCP client
- AND no records are created in the database

#### Scenario: Failure due to missing required location
- GIVEN the MCP server is running
- WHEN the client calls `job_tracker_search_external_jobs` without providing the `location` parameter
- THEN the tool validates input schemas and immediately returns a validation error indicating `location` is required

---

### Requirement: `job_tracker_import_external_job` Tool
The server MUST support external job search and automatic deduplicated database import.
- Input Schema:
  - `query` (string, optional): Search keyword.
  - `location` (string, required): Location to search.
  - `limit` (number, optional): Max results to retrieve.
- Behavior: Runs the LinkedIn scraper subprocess. For each retrieved listing, checks if a job already exists in the database with `source='LINKEDIN'` and `sourceId` equal to the listing's ID.
  - If a duplicate is found, the job is skipped.
  - If no duplicate is found, a new job is created in the database with status `'SAVED'`, priority `'MEDIUM'`, `source='LINKEDIN'`, `sourceId` set to the card ID, and description set to `"Imported from LinkedIn - URL: <url>"`.
- It MUST return a summary of the operation: total retrieved, imported, and skipped.

#### Scenario: Importing new and duplicate external jobs
- GIVEN the database contains 1 existing job with `source="LINKEDIN"` and `sourceId="L100"`
- WHEN the client calls `job_tracker_import_external_job` with `location="Berlin"`
- AND the LinkedIn scraper subprocess retrieves 2 jobs: one with ID `"L100"` and one with ID `"L200"`
- THEN the server identifies `"L100"` as a duplicate and skips it
- AND the server imports `"L200"` into the database as a new job with `sourceId="L200"` and description `"Imported from LinkedIn - URL: <url-for-L200>"`
- AND the tool returns a JSON object summarizing: `{"total": 2, "imported": 1, "skipped": 1}`

---

### Requirement: `job_tracker_list_jobs` Tool
The server MUST allow listing and filtering tracked jobs.
- Input Schema:
  - `status` (string, optional, must match `JobStatus` enums: SAVED, INTERESTING, APPLIED, INTERVIEW, OFFER, REJECTED, WITHDRAWN, EXPIRED)
  - `company` (string, optional)
  - `source` (string, optional, must match `JobSource` enums: MANUAL, LINKEDIN, INDEED, INFOJOBS, GLASSDOOR, WELCOME_TO_THE_JUNTLE, REMOTE_OK, SCRAPER, API_REFERRAL, OTHER)
  - `limit` (number, optional, defaults to 20)
  - `offset` (number, optional, defaults to 0)
- Behavior: Queries the job database with the provided filters and returns a paginated list of job objects.

#### Scenario: List jobs with multiple active filters
- GIVEN the database has multiple jobs (some under `'MANUAL'` and some under `'LINKEDIN'`)
- WHEN the client calls `job_tracker_list_jobs` with `source="LINKEDIN"` and `limit=2`
- THEN the tool returns a paginated list containing up to 2 jobs that have their `source` set to `'LINKEDIN'`

---

### Requirement: `job_tracker_add_job` Tool
The server MUST allow manually adding a new tracked job to the database.
- Input Schema:
  - `title` (string, required)
  - `company` (string, required)
  - `location` (string, optional)
  - `url` (string, optional)
  - `description` (string, optional)
  - `source` (string, optional, defaults to `'MANUAL'`, must match `JobSource` enums)
- Behavior: Creates a job entry in the database with the given parameters and returns the created job details.

#### Scenario: Create a manual job entry with all optional parameters
- GIVEN the database is available
- WHEN the client calls `job_tracker_add_job` with `title="DevOps Engineer"`, `company="Cloud Co"`, `location="Remote"`, `url="https://cloudco.jobs/devops"`, and `description="Automate all things"`
- THEN the database inserts the job record
- AND the tool returns the fully created job object including its generated unique ID, status set to `'SAVED'`, and priority set to `'MEDIUM'`

---

### Requirement: `job_tracker_update_job_status` Tool
The server MUST support updating the status and priority of an existing job listing.
- Input Schema:
  - `id` (string, required): The database unique ID of the target job.
  - `status` (string, required): The target status, which MUST be a valid `JobStatus` enum value.
  - `priority` (string, optional): The target priority, which MUST be a valid `Priority` enum value (LOW, MEDIUM, HIGH, URGENT).
- Behavior: Retrieves the existing job. If the job ID does not exist, returns a domain-level error. Otherwise, updates its status and/or priority and returns the updated job object.

#### Scenario: Successfully update status and priority
- GIVEN a job with ID `"job-123"` exists in the database with status `'SAVED'` and priority `'MEDIUM'`
- WHEN the client calls `job_tracker_update_job_status` with `id="job-123"`, `status="APPLIED"`, and `priority="HIGH"`
- THEN the database updates the job record to status `'APPLIED'` and priority `'HIGH'`
- AND the tool returns the updated job object with those new values

#### Scenario: Fails to update non-existent job
- GIVEN no job with ID `"job-none"` exists in the database
- WHEN the client calls `job_tracker_update_job_status` with `id="job-none"` and `status="INTERVIEW"`
- THEN the tool returns an error response indicating that the job with ID `"job-none"` was not found
