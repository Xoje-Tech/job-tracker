# External Job Search Specification

## Purpose
The `external-job-search` capability allows searching and importing job postings from external platforms (such as LinkedIn) via CLI commands without direct database modifications for search, and with structured upserts for importing. It utilizes a guest scraper subprocess to interact with external job portals.

## Requirements

### Requirement: jobs:search - External Search via CLI
The CLI tool MUST support a `jobs:search` command to query public job listings on external platforms.
- It MUST accept `--query` (or `-q`) and `--location` (or `-l`) as flags, along with an optional `--limit` (or `-n`) to cap the output.
- The `--location` parameter MUST be mandatory. If omitted, the command MUST print a validation error and exit with code 1.
- It MUST execute the `.agents/skills/linkedin-search` tool via subprocess (using Bun).
- It MUST format the command parameters properly (e.g. `--query`, `--location`, `--limit`, and force `--format json` for the subprocess).
- It MUST parse the returned JSON results and print them to the user's terminal as a table (displaying at least: Job ID, Title, Company, Location, Date, URL).
- It MUST NOT save any of the retrieved job listings to the database.

#### Scenario: Successful external job search
- GIVEN the CLI tool is available
- WHEN the user executes `pnpm cli jobs:search --query "software engineer" --location "Remote" --limit 2`
- THEN a subprocess is spawned running `bun run .agents/skills/linkedin-search/cli/src/cli.ts search --query "software engineer" --location "Remote" --limit 2 --format json`
- AND the subprocess exits with code 0 returning JSON job listings
- AND the CLI displays the listings in a formatted table on stdout
- AND no new jobs are added to the database

#### Scenario: Missing location parameter
- GIVEN the CLI tool is available
- WHEN the user executes `pnpm cli jobs:search --query "software engineer"`
- THEN the command rejects the request with an error indicating that `--location` is required
- AND the process exits with code 1

#### Scenario: Scraper subprocess fails
- GIVEN the CLI tool is available
- WHEN the user executes `pnpm cli jobs:search --query "invalid" --location "Nonexistent"`
- THEN the spawned subprocess exits with a non-zero code or error JSON on stderr
- AND the CLI prints the error message to stderr
- AND the process exits with code 1


### Requirement: jobs:import - External Job Import and Deduplication
The CLI tool MUST support a `jobs:import` command to search and import job listings into the database.
- It MUST accept `--query` (or `-q`) and `--location` (or `-l`) as flags, along with an optional `--limit` (or `-n`) to cap the import count.
- The `--location` parameter MUST be mandatory. If omitted, the command MUST print a validation error and exit with code 1.
- It MUST search external job listings using the guest scraper subprocess in JSON format.
- For each retrieved job listing, it MUST check if a job with the same `sourceId` and `source='LINKEDIN'` already exists in the database.
- If the job already exists, it MUST be skipped to prevent duplication.
- If the job does NOT exist, it MUST create a new job entry via the REST API or the database repository, setting `source` to `'LINKEDIN'` and `sourceId` to the external listing's ID.
- Since search results do not include full descriptions, a default description (e.g., "Imported from LinkedIn - URL: <url>") MUST be provided.
- The command MUST output a summary of the import operation showing: the total listings retrieved, the number of new listings successfully imported, and the number of listings skipped as duplicates.

#### Scenario: Successful import of new jobs
- GIVEN the database contains no jobs from LinkedIn
- WHEN the user executes `pnpm cli jobs:import --query "software engineer" --location "Remote" --limit 2`
- THEN the CLI searches for listings using the subprocess
- AND it checks each listing's `sourceId` and `source='LINKEDIN'` against the database
- AND both listings are identified as new
- AND both listings are created in the database with `source='LINKEDIN'` and their respective external IDs as `sourceId`
- AND the CLI prints a summary: "Found 2 jobs. Imported: 2, Skipped: 0"

#### Scenario: Importing with duplicate jobs in the database
- GIVEN the database already contains a job with `source='LINKEDIN'` and `sourceId='4439336029'`
- WHEN the user executes `pnpm cli jobs:import --query "software engineer" --location "Remote" --limit 2`
- THEN the CLI searches for listings using the subprocess and retrieves 2 listings (including `sourceId='4439336029'`)
- AND it checks each listing against the database
- AND the listing with `sourceId='4439336029'` is identified as a duplicate and skipped
- AND the other listing is identified as new and created in the database
- AND the CLI prints a summary: "Found 2 jobs. Imported: 1, Skipped: 1"

#### Scenario: All listings are duplicates
- GIVEN the database already contains all listings returned by the search
- WHEN the user executes `pnpm cli jobs:import --query "software engineer" --location "Remote" --limit 2`
- THEN the CLI searches for listings using the subprocess and retrieves 2 listings
- AND it checks each listing against the database
- AND both are identified as duplicates and skipped
- AND no new jobs are created in the database
- AND the CLI prints a summary: "Found 2 jobs. Imported: 0, Skipped: 2"
