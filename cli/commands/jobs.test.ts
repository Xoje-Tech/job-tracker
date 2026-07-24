import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import child_process from "node:child_process";
import { jobsCommand } from "./jobs.js";
import { client } from "../api/client.js";

describe("jobs subcommand CLI tests", () => {
  let mockExit: MockInstance<typeof process.exit>;
  let mockConsoleLog: MockInstance<typeof console.log>;
  let mockConsoleError: MockInstance<typeof console.error>;
  let mockConsoleTable: MockInstance<typeof console.table>;
  let mockSpawnSync: MockInstance<typeof child_process.spawnSync>;

  beforeEach(() => {
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockConsoleTable = vi.spyOn(console, "table").mockImplementation(() => {});
    mockSpawnSync = vi.spyOn(child_process, "spawnSync");
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleTable.mockRestore();
    mockSpawnSync.mockRestore();
  });

  describe("jobs:search", () => {
    it("should exit with 1 and print error if --location is missing", async () => {
      // Commander stores previous arguments/options, so we need to pass a clean argument array to parseAsync.
      await jobsCommand.parseAsync(["node", "jobs", "search"]);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("location is required"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should spawn scraper with exact flags and display table", async () => {
      mockSpawnSync.mockReturnValue({
        status: 0,
        stdout: JSON.stringify({
          meta: { count: 2, page: 1 },
          results: [
            { id: "1", title: "Job A", company: "Company A", location: "Berlin", url: "url-a" },
            { id: "2", title: "Job B", company: "Company B", location: "Berlin", url: "url-b" },
          ],
        }),
        stderr: "",
      } as any);

      await jobsCommand.parseAsync([
        "node",
        "jobs",
        "search",
        "--location",
        "Berlin",
        "--query",
        "Frontend",
        "--limit",
        "2",
      ]);

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "bun",
        [
          "run",
          ".agents/skills/linkedin-search/cli/src/cli.ts",
          "search",
          "--query",
          "Frontend",
          "--location",
          "Berlin",
          "--limit",
          "2",
          "--format",
          "json",
        ],
        { encoding: "utf8" },
      );

      expect(mockConsoleTable).toHaveBeenCalledWith([
        { id: "1", title: "Job A", company: "Company A", location: "Berlin", url: "url-a" },
        { id: "2", title: "Job B", company: "Company B", location: "Berlin", url: "url-b" },
      ]);
      expect(mockExit).not.toHaveBeenCalled();
    });
  });

  describe("jobs:import", () => {
    it("should exit with 1 and print error if --location is missing", async () => {
      await jobsCommand.parseAsync(["node", "jobs", "import"]);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("location is required"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should fetch, deduplicate and import listings correctly", async () => {
      mockSpawnSync.mockReturnValue({
        status: 0,
        stdout: JSON.stringify({
          meta: { count: 2, page: 1 },
          results: [
            {
              id: "101",
              title: "Job 101",
              company: "Company A",
              location: "Paris",
              url: "url-101",
            },
            {
              id: "102",
              title: "Job 102",
              company: "Company B",
              location: "Paris",
              url: "url-102",
            },
          ],
        }),
        stderr: "",
      } as any);

      // Mock client.listJobs and client.createJob
      // For ID 101, pretend it exists (data has length 1)
      // For ID 102, pretend it is new (data has length 0)
      const spyList = vi.spyOn(client, "listJobs").mockImplementation(async (params) => {
        if (params?.sourceId === "101") {
          return { data: [{ id: "existing-id" }], total: 1, limit: 10, offset: 0 };
        }
        return { data: [], total: 0, limit: 10, offset: 0 };
      });

      const spyCreate = vi
        .spyOn(client, "createJob")
        .mockResolvedValue({ data: { id: "imported-102" } });

      await jobsCommand.parseAsync([
        "node",
        "jobs",
        "import",
        "--location",
        "Paris",
        "--query",
        "React",
        "--limit",
        "2",
      ]);

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "bun",
        [
          "run",
          ".agents/skills/linkedin-search/cli/src/cli.ts",
          "search",
          "--query",
          "React",
          "--location",
          "Paris",
          "--limit",
          "2",
          "--format",
          "json",
        ],
        { encoding: "utf8" },
      );

      // Verify listJobs was called for both
      expect(spyList).toHaveBeenCalledWith({ source: "LINKEDIN", sourceId: "101" });
      expect(spyList).toHaveBeenCalledWith({ source: "LINKEDIN", sourceId: "102" });

      // Verify createJob was called only for "102"
      expect(spyCreate).toHaveBeenCalledTimes(1);
      expect(spyCreate).toHaveBeenCalledWith({
        title: "Job 102",
        company: "Company B",
        location: "Paris",
        url: "url-102",
        source: "LINKEDIN",
        sourceId: "102",
        description: "Imported from LinkedIn - URL: url-102",
      });

      // Verify summary stats
      expect(mockConsoleLog).toHaveBeenCalledWith("Found 2 jobs. Imported: 1, Skipped: 1");
      expect(mockExit).not.toHaveBeenCalled();

      spyList.mockRestore();
      spyCreate.mockRestore();
    });
  });
});
