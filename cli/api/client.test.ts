import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JobTrackerClient } from "./client.js";

describe("JobTrackerClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, limit: 50, offset: 0 }),
      } as Response),
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should serialize source and sourceId in query string", async () => {
    const apiClient = new JobTrackerClient({ baseUrl: "http://localhost:3000" });
    await apiClient.listJobs({
      source: "LINKEDIN",
      sourceId: "linkedin-abc-123",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/jobs?source=LINKEDIN&sourceId=linkedin-abc-123"),
      expect.any(Object),
    );
  });
});
