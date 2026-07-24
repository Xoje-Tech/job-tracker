import { describe, it, expect } from "vitest";
import type { CreateJobInput, UpdateJobInput } from "./job-repository.js";

describe("Job Repository Inputs Structure", () => {
  it("should support sourceId property on CreateJobInput", () => {
    const createInput: CreateJobInput = {
      title: "Backend Engineer",
      company: "Tech Corp",
      sourceId: "ext-abc-123",
    };
    expect(createInput.sourceId).toBe("ext-abc-123");
  });

  it("should support sourceId property on UpdateJobInput", () => {
    const updateInput: UpdateJobInput = {
      sourceId: "ext-abc-updated",
    };
    expect(updateInput.sourceId).toBe("ext-abc-updated");
  });
});
