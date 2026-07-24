import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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

export class SearchExternalJobsUseCase {
  private readonly skillsDir: string;
  private readonly timeoutMs: number;

  constructor(
    skillsDir: string = "/home/hermes/projects/job-tracker/.agents/skills",
    timeoutMs: number = 10000
  ) {
    this.skillsDir = skillsDir;
    this.timeoutMs = timeoutMs;
  }

  async execute(input: SearchExternalJobsInput): Promise<ExternalJobCard[]> {
    const { query, location, limit, sources } = input;

    // 1. Discover active scrapers
    let scraperDirs: string[] = [];
    try {
      if (fs.existsSync(this.skillsDir)) {
        const rawFiles = fs.readdirSync(this.skillsDir);
        scraperDirs = rawFiles.filter(
          (file) =>
            fs.statSync(path.join(this.skillsDir, file)).isDirectory() &&
            file.endsWith("-search")
        );
      }
    } catch (err) {
      console.error(`Failed to scan skills directory: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Map scraper directories to sources (e.g., "linkedin-search" -> "LINKEDIN")
    const discoveredScrapers = scraperDirs.map((dir) => {
      const prefix = dir.slice(0, -7); // remove "-search"
      const sourceName = prefix.toUpperCase();
      return {
        dirName: dir,
        source: sourceName,
      };
    });

    // 2. Filter by requested sources if provided
    let scrapersToRun = discoveredScrapers;
    if (sources && sources.length > 0) {
      const uppercaseRequested = sources.map((s) => s.toUpperCase());
      scrapersToRun = discoveredScrapers.filter((s) =>
        uppercaseRequested.includes(s.source)
      );

      // Log warning for requested sources that were not found
      const discoveredSources = discoveredScrapers.map((s) => s.source);
      for (const requested of uppercaseRequested) {
        if (!discoveredSources.includes(requested)) {
          console.error(`Requested source ${requested} was not found among discovered scrapers.`);
        }
      }
    }

    // 3. Execute in parallel with timeout
    const promises = scrapersToRun.map((scraper) => {
      return this.runScraper(scraper.dirName, scraper.source, query, location, limit);
    });

    const resultsArray = await Promise.all(promises);

    // 4. Flatten, normalize, and deduplicate results
    const allCards: ExternalJobCard[] = [];
    const seen = new Set<string>();

    for (const cards of resultsArray) {
      for (const card of cards) {
        const dupKey = `${card.source}:${card.sourceId}`;
        if (!seen.has(dupKey)) {
          seen.add(dupKey);
          allCards.push(card);
        }
      }
    }

    return allCards;
  }

  private async runScraper(
    dirName: string,
    source: string,
    query: string | undefined,
    location: string,
    limit: number | undefined
  ): Promise<ExternalJobCard[]> {
    const cliPath = path.join(this.skillsDir, dirName, "cli", "src", "cli.ts");
    return new Promise<ExternalJobCard[]>((resolve) => {
      const args = ["run", cliPath, "search", "--location", location, "--format", "json"];

      if (query) {
        args.push("--query", query);
      }
      if (limit !== undefined) {
        args.push("--limit", String(limit));
      }

      const proc = spawn("bun", args, { shell: false });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      proc.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      const timeout = setTimeout(() => {
        proc.kill("SIGTERM");
        console.error(`Scraper ${source} timed out after ${this.timeoutMs}ms.`);
        resolve([]);
      }, this.timeoutMs);

      proc.on("error", (err) => {
        clearTimeout(timeout);
        console.error(`Failed to start scraper ${source}: ${err.message}`);
        resolve([]);
      });

      proc.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          console.error(`Scraper ${source} exited with code ${code}. Stderr: ${stderr}`);
          return resolve([]);
        }

        try {
          const parsed = JSON.parse(stdout);
          let rawCards: any[] = [];
          if (Array.isArray(parsed)) {
            rawCards = parsed;
          } else if (parsed && Array.isArray(parsed.results)) {
            rawCards = parsed.results;
          } else if (parsed && Array.isArray(parsed.data)) {
            rawCards = parsed.data;
          }

          const normalized: ExternalJobCard[] = rawCards.map((card: any) => ({
            sourceId: String(card.id || card.sourceId),
            source,
            title: String(card.title || ""),
            company: String(card.company || "Unknown"),
            location: card.location ? String(card.location) : undefined,
            url: card.url ? String(card.url) : undefined,
          }));

          resolve(normalized);
        } catch (err) {
          console.error(`Failed to parse JSON output from scraper ${source}: ${err instanceof Error ? err.message : String(err)}. Output was: ${stdout}`);
          resolve([]);
        }
      });
    });
  }
}
