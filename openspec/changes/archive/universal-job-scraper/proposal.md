# Change: Universal Job Scraper

## Intent

Allow users to paste any job posting URL and have the system auto-extract structured data for review before saving. Eliminates manual data entry for job offers found online.

## Why

Currently every job offer must be entered manually. The Job model already has `source`, `sourceId`, and `url` fields — the data layer is ready. This change adds the scraping pipeline that populates those fields from a URL.

User validated the scraped data is reviewed before persistence (two-step flow: scrape → review/edit → save). No automatic imports without confirmation.

## Scope

### In scope
- New `src/modules/scraper/` module (hexagonal: domain, application, infrastructure, interface)
- D-pipeline implementation: URL → fetch HTML → detect platform → extract via JSON-LD (Schema.org JobPosting) → OpenGraph → Mozilla Readability (in that order, first match wins)
- Platform profiles DB table for known platforms (LinkedIn, InfoJobs, enterprise career pages) with CSS selectors; auto-created after first successful scrape
- B-pipeline interface stub (`ai-extractor.ts`) that throws "Not implemented — vllm integration pending" as placeholder for future AI-based extraction
- `POST /api/v1/scrape` endpoint — accepts `{ url }`, returns `ScrapedJob` with extracted fields + extraction method + confidence score (no persistence)
- Queue system for batch scraping (multiple URLs per session), rate limiting per domain, and periodic refresh of stored scrapes
- Confidence threshold: title + company + description all required; if any missing → low confidence → frontend warns user
- Existing `POST /api/v1/jobs` endpoint receives validated data (already exists, no changes needed)

### Out of scope
- AI/B-pipeline actual implementation (placeholder only)
- CLI commands for scraping
- Web UI scraping trigger (API-only for now)
- Headless browser scraping (future: for JS-rendered SPAs like Greenhouse)
- Authentication for scrape endpoint (reuses existing API key pattern)

## Capabilities

### CAP-01: Scrape single job URL
**Given** a valid job posting URL
**When** user submits to `POST /api/v1/scrape`
**Then** system returns extracted `{ title, company, description, location, salary, url, source, confidence, method }`

### CAP-02: Confidence gating
**Given** extraction result with missing required field
**When** confidence falls below threshold
**Then** response includes `confidence: "low"` and lists missing fields so user is warned

### CAP-03: Platform detection and prioritization
**Given** a URL matching a known platform
**When** scraping pipeline runs
**Then** platform-specific selectors are used before generic D-pipeline fallbacks

### CAP-04: User-confirmed persistence
**Given** a scrape result returned to the user
**When** user confirms or edits and submits to `POST /api/v1/jobs`
**Then** job is created with `source` set to detected platform or `SCRAPER`, `url` preserved, `sourceId` set to original posting ID if available

### CAP-05: Batch scrape queue
**Given** multiple URLs submitted in a session
**When** queue processes them
**Then** rate limiting per domain prevents aggressive scraping (min 1 req/sec per domain); results returned individually

### CAP-06: Periodic refresh
**Given** a previously scraped job
**When** refresh interval elapsed (configurable, default 24h)
**Then** system re-scrapes to check if offer is still open and updates `sourceId`/`url` metadata

## Technical Approach

- **Libraries**: cheerio (HTML parsing), @mozilla/readability (content extraction), native fetch (no axios)
- **Module pattern**: hexagonal — `domain/` (ScrapedJob entity, ScraperPort interface), `application/` (ScrapeService), `infrastructure/` (CheerioAdapter, JsonLdAdapter, PlatformProfileRepo), `interface/` (scrapeRouter)
- **Platform profiles**: stored in Prisma DB, keyed by domain, with CSS selectors for title/company/description/location/salary
- **Extraction cascade**: platform profile → JSON-LD → OpenGraph → Readability → AI stub (throws)
- **Rate limiting**: in-memory queue with per-domain timestamps, configurable interval
- **Confidence scoring**: binary per-field presence → weighted average → high/medium/low threshold

## Priority

High — user stated daily use, multiple offers per session. This is the primary data entry path going forward.
