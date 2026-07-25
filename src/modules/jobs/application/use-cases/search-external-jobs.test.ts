import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { SearchExternalJobsUseCase } from "./search-external-jobs.js";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

describe("SearchExternalJobsUseCase", () => {
  let mockConsoleError: any;

  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      "linkedin-search" as any,
      "mercadona-search" as any,
      "some-other-dir" as any,
    ]);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as any);

    mockConsoleError = vi.spyOn(console, "error");
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  const createMockProcess = (stdoutData: string, exitCode = 0, delay = 0) => {
    const proc = new EventEmitter() as any;
    const stdout = new Readable({
      read() {}
    });
    proc.stdout = stdout;
    
    const stderr = new Readable({
      read() {}
    });
    proc.stderr = stderr;

    proc.kill = vi.fn();

    setTimeout(() => {
      if (stdoutData) {
        stdout.push(stdoutData);
      }
      stdout.push(null);
      stderr.push(null);
      
      setTimeout(() => {
        proc.emit("close", exitCode);
      }, 0);
    }, delay);

    return proc;
  };

  it("should dynamically discover and run all scrapers in parallel when no sources filter is passed", async () => {
    const linkedinData = JSON.stringify({
      results: [
        { id: "li-1", title: "LinkedIn Engineer", company: "LinkedIn Corp", location: "Remote", url: "url-li" }
      ]
    });
    const mercadonaData = JSON.stringify({
      results: [
        { id: "mer-1", title: "Mercadona Dev", company: "Mercadona", location: "Valencia", url: "url-mer" }
      ]
    });

    vi.mocked(spawn).mockImplementation((_cmd, args) => {
      const argsStr = args?.join(" ") || "";
      if (argsStr.includes("linkedin-search")) {
        return createMockProcess(linkedinData);
      } else if (argsStr.includes("mercadona-search")) {
        return createMockProcess(mercadonaData);
      }
      return createMockProcess("[]");
    });

    const useCase = new SearchExternalJobsUseCase();
    const result = await useCase.execute({ location: "Madrid" });

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      sourceId: "li-1",
      source: "LINKEDIN",
      title: "LinkedIn Engineer",
      company: "LinkedIn Corp",
      location: "Remote",
      url: "url-li"
    });
    expect(result).toContainEqual({
      sourceId: "mer-1",
      source: "MERCADONA",
      title: "Mercadona Dev",
      company: "Mercadona",
      location: "Valencia",
      url: "url-mer"
    });
  });

  it("should filter scrapers based on the sources query parameter (case-insensitive)", async () => {
    const linkedinData = JSON.stringify({
      results: [
        { id: "li-1", title: "LinkedIn Engineer", company: "LinkedIn Corp", location: "Remote", url: "url-li" }
      ]
    });

    vi.mocked(spawn).mockImplementation(() => {
      return createMockProcess(linkedinData);
    });

    const useCase = new SearchExternalJobsUseCase();
    const result = await useCase.execute({ location: "Madrid", sources: ["linkedin"] });

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("LINKEDIN");
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it("should gracefully handle a scraper that fails (e.g. non-zero exit code) and return other results", async () => {
    const linkedinData = JSON.stringify({
      results: [
        { id: "li-1", title: "LinkedIn Engineer", company: "LinkedIn Corp", location: "Remote", url: "url-li" }
      ]
    });

    vi.mocked(spawn).mockImplementation((_cmd, args) => {
      const argsStr = args?.join(" ") || "";
      if (argsStr.includes("linkedin-search")) {
        return createMockProcess(linkedinData);
      } else {
        return createMockProcess("", 1); // fails
      }
    });

    const useCase = new SearchExternalJobsUseCase();
    const result = await useCase.execute({ location: "Madrid" });

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("LINKEDIN");
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it("should gracefully handle a scraper that outputs invalid JSON", async () => {
    const linkedinData = JSON.stringify({
      results: [
        { id: "li-1", title: "LinkedIn Engineer", company: "LinkedIn Corp", location: "Remote", url: "url-li" }
      ]
    });

    vi.mocked(spawn).mockImplementation((_cmd, args) => {
      const argsStr = args?.join(" ") || "";
      if (argsStr.includes("linkedin-search")) {
        return createMockProcess(linkedinData);
      } else {
        return createMockProcess("not valid json");
      }
    });

    const useCase = new SearchExternalJobsUseCase();
    const result = await useCase.execute({ location: "Madrid" });

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("LINKEDIN");
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it("should enforce a timeout and kill the hanging scraper", async () => {
    const linkedinData = JSON.stringify({
      results: [
        { id: "li-1", title: "LinkedIn Engineer", company: "LinkedIn Corp", location: "Remote", url: "url-li" }
      ]
    });

    const mockKill = vi.fn();
    vi.mocked(spawn).mockImplementation((_cmd, args) => {
      const argsStr = args?.join(" ") || "";
      if (argsStr.includes("linkedin-search")) {
        return createMockProcess(linkedinData);
      } else {
        const proc = createMockProcess(JSON.stringify({ results: [] }), 0, 15000); // 15 seconds, exceeds 10s timeout
        proc.kill = mockKill;
        return proc;
      }
    });

    const useCase = new SearchExternalJobsUseCase("/home/hermes/projects/job-tracker/.agents/skills", 100); // 100ms timeout for testing
    const result = await useCase.execute({ location: "Madrid" });

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("LINKEDIN");
    expect(mockKill).toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it("should deduplicate job listings with identical source and sourceId", async () => {
    const linkedinData = JSON.stringify({
      results: [
        { id: "li-1", title: "LinkedIn Engineer", company: "LinkedIn Corp", location: "Remote", url: "url-li" },
        { id: "li-1", title: "Duplicate LinkedIn Engineer", company: "LinkedIn Corp", location: "Remote", url: "url-li" }
      ]
    });

    vi.mocked(spawn).mockImplementation(() => {
      return createMockProcess(linkedinData);
    });

    const useCase = new SearchExternalJobsUseCase();
    const result = await useCase.execute({ location: "Madrid", sources: ["linkedin"] });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("LinkedIn Engineer"); // keeps the first one
  });
});
