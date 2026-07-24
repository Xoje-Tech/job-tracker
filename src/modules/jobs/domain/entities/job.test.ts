import { describe, it, expect } from "vitest";
import type { Job, JobListFilters } from "./job.js";

describe("Job Entity Structure", () => {
  it("should support sourceId property of type string or null on Job interface", () => {
    const job: Job = {
      id: "1",
      title: "Test",
      company: "Test Company",
      location: null,
      remote: "REMOTE",
      salaryMin: null,
      salaryMax: null,
      url: null,
      description: "Test description",
      source: "LINKEDIN",
      sourceId: "ext-1234",
      status: "SAVED",
      priority: "MEDIUM",
      appliedAt: null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(job.sourceId).toBe("ext-1234");
  });

  it("should support optional sourceId filter in JobListFilters", () => {
    const filters: JobListFilters = {
      sourceId: "ext-1234",
      limit: 10,
      offset: 0,
    };
    expect(filters.sourceId).toBe("ext-1234");
  });
});
