# Specification: Multi-Portal Search

## Purpose
The `multi-portal-search` capability enables aggregate, parallel, and pluggable job searching across multiple job portals (e.g., LinkedIn, Indeed, etc.) via REST API, CLI, and MCP. It decouples scraper implementations and handles individual scraper failures gracefully to provide a unified, robust search interface.

## Non-Goals
- Automatic database persistence of searched jobs during search operations (persistence requires an explicit import/create action).
- Web UI search pages or UI views.

## Requirements

### Requirement: Unified REST API Search Endpoint
The backend API MUST expose a `GET /api/v1/jobs/search` route to perform aggregated searches.
- It MUST accept the following query parameters:
  - `query` (string, optional): The search term or job title keyword.
  - `location` (string, required): The target location for the search.
  - `limit` (string/number, optional): Maximum number of results to return per source or in total.
  - `sources` (string, optional): A comma-separated list of sources to search (e.g., `LINKEDIN,MERCADONA`).
- If the `location` query parameter is missing, the endpoint MUST return a `400 Bad Request` status code.
- It MUST dynamically discover active sub-scraper directories under `.agents/skills/`.
  - Directory discovery MUST look for directories ending in `-search` (e.g., `linkedin-search`).
  - The source identifier MUST be the folder prefix converted to uppercase (e.g., `linkedin-search` -> `LINKEDIN`).
- If the `sources` query parameter is provided, the search MUST only spawn sub-scrapers for the requested sources (case-insensitive mapping). If any requested source is not discovered or active, it MUST be skipped with a logged warning.
- If the `sources` query parameter is omitted, the search MUST spawn all dynamically discovered active sub-scrapers.
- It MUST execute all active sub-scrapers in parallel as separate subprocesses (e.g., spawning `bun run .agents/skills/<folder>/cli/src/cli.ts search --query <query> --location <location> --limit <limit> --format json` using Node.js `child_process`).
- Subprocess execution MUST have a hard execution timeout of 10 seconds.
- It MUST aggregate and normalize outputs from all subprocesses into a standard array of job cards.
- Each normalized job card object MUST include the following properties:
  - `sourceId` (string, required): The source-specific unique identifier of the job listing.
  - `source` (string, required): The uppercase name of the portal source (e.g., `LINKEDIN`).
  - `title` (string, required): The job title.
  - `company` (string, required): The hiring company name.
  - `location` (string, optional): The job location.
  - `url` (string, optional): The original URL of the job post.
- It MUST deduplicate any listings with identical combinations of `sourceId` and `source`.
- Individual sub-scraper execution failures (e.g., subprocess crash, exit code non-zero, timeout, or invalid JSON output) MUST NOT crash the API request. The orchestrator MUST handle these gracefully, skip the failing source, log a warning, and return results from other working sources. If all sources fail, it MUST return a `200 OK` response with an empty array.

#### Scenario: Successful multi-portal search with all discovered scrapers
- GIVEN the `.agents/skills/` directory contains active sub-scrapers `linkedin-search` and `mercadona-search`
- WHEN a client sends a `GET /api/v1/jobs/search?location=Madrid&query=engineer` request
- THEN the backend dynamically discovers both `linkedin-search` and `mercadona-search`
- AND the backend spawns both scrapers in parallel with the given parameters and `--format json`
- AND both scrapers complete successfully returning JSON results
- AND the backend merges, normalizes, and deduplicates the results
- AND the backend returns a `200 OK` response with the aggregated standard job card array

#### Scenario: Multi-portal search filtering by specific sources
- GIVEN the `.agents/skills/` directory contains active sub-scrapers `linkedin-search` and `mercadona-search`
- WHEN a client sends a `GET /api/v1/jobs/search?location=Madrid&sources=LINKEDIN` request
- THEN the backend only spawns the `linkedin-search` scraper
- AND the backend does NOT spawn the `mercadona-search` scraper
- AND the backend returns a `200 OK` response with the normalized results from LinkedIn only

#### Scenario: Missing required location parameter
- GIVEN the search API is available
- WHEN a client sends a `GET /api/v1/jobs/search?query=engineer` request
- THEN the backend rejects the request with a `400 Bad Request` status code indicating that `location` is required

#### Scenario: Graceful handling of individual sub-scraper failures
- GIVEN the `.agents/skills/` directory contains active sub-scrapers `linkedin-search` and `mercadona-search`
- WHEN a client sends a `GET /api/v1/jobs/search?location=Remote` request
- AND the `linkedin-search` scraper completes successfully
- AND the `mercadona-search` scraper fails (e.g., times out or exits with a non-zero code)
- THEN the backend catches the failure, logs a warning
- AND the backend returns a `200 OK` response containing only the normalized results from `linkedin-search`

---

### Requirement: CLI Search Command Integration
The CLI command `jobs search` in `cli/commands/jobs.ts` MUST be updated to route queries through the backend unified search API instead of running local scraper subprocesses directly.
- It MUST support the following options:
  - `--query` / `-q` (string, optional)
  - `--location` / `-l` (string, required)
  - `--limit` / `-n` (string, optional)
  - `--sources` / `-s` (string, optional comma-separated list of sources)
- If `--location` is missing, the CLI command MUST print a validation error to `stderr` and exit with code 1.
- It MUST execute a `GET /api/v1/jobs/search` HTTP request to the backend with the formatted query parameters.
- It MUST parse the returned aggregated standard job card array and display them in a formatted table on standard output.
- If the API request fails, the CLI command MUST print the error to `stderr` and exit with code 1.

#### Scenario: Successful CLI job search
- GIVEN the CLI tool and backend API are running
- WHEN the user executes `pnpm cli jobs search --location "Remote" --query "developer" --sources "LINKEDIN"`
- THEN the CLI command sends an HTTP request to `GET /api/v1/jobs/search` with parameters `location=Remote&query=developer&sources=LINKEDIN`
- AND the backend returns a successful list of aggregated job cards
- AND the CLI formats and prints the results in a table on stdout
- AND the command exits with code 0

#### Scenario: CLI search missing required location
- GIVEN the CLI tool is available
- WHEN the user executes `pnpm cli jobs search --query "developer"`
- THEN the CLI identifies that `--location` is missing
- AND it prints a validation error to stderr
- AND the process exits with code 1

---

### Requirement: MCP Search Tool Integration
The MCP server tool `job_tracker_search_external_jobs` in `src/mcp-server.ts` MUST route queries through the multi-portal search orchestrator (or make a GET request to the unified search API).
- Input Schema MUST accept:
  - `query` (string, optional)
  - `location` (string, required)
  - `limit` (number, optional)
  - `sources` (array of strings, optional)
- If the `location` parameter is missing, the tool MUST return a protocol validation error with RPC code `-32602` (Invalid Params).
- It MUST return a standard JSON-RPC success result containing the aggregated, normalized, and deduplicated job card array.
- Individual scraper failures during MCP tool execution MUST be handled gracefully, returning successful results from other active sub-scrapers.

#### Scenario: Successful MCP tool external job search
- GIVEN the MCP server is initialized and running
- WHEN the client sends a `tools/call` request for `job_tracker_search_external_jobs` with `location="London"` and `sources=["LINKEDIN"]`
- THEN the server routes the request through the unified search orchestrator
- AND the orchestrator runs the LinkedIn scraper and successfully returns results
- AND the MCP server returns a JSON-RPC response with the results array
- AND no new jobs are saved in the database

#### Scenario: MCP search missing required location parameter
- GIVEN the MCP server is running
- WHEN the client calls `job_tracker_search_external_jobs` with `query="developer"` but no `location`
- THEN the tool input validation fails
- AND the server returns a JSON-RPC error response with code `-32602` (Invalid Params)
