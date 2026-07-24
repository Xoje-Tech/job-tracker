import { describe, it, expect } from "vitest";
import { parseUpdateJobDto } from "./update-job.dto.js";
import { AppError } from "@/shared/middleware/error.js";

describe("parseUpdateJobDto", () => {
  it("should accept valid body with source and sourceId", () => {
    const body = {
      title: "Senior Engineer",
      source: "LINKEDIN",
      sourceId: "linkedin-67890",
    };
    const result = parseUpdateJobDto(body);
    expect(result.source).toBe("LINKEDIN");
    expect(result.sourceId).toBe("linkedin-67890");
  });

  it("should accept null sourceId", () => {
    const body = {
      title: "Senior Engineer",
      sourceId: null,
    };
    const result = parseUpdateJobDto(body);
    expect(result.sourceId).toBeNull();
  });

  it("should throw AppError if source is not a string", () => {
    const body = {
      source: 456,
    };
    expect(() => parseUpdateJobDto(body)).toThrow(AppError);
    expect(() => parseUpdateJobDto(body)).toThrow("source must be a string");
  });

  it("should throw AppError if sourceId is not a string or null", () => {
    const body = {
      sourceId: 456,
    };
    expect(() => parseUpdateJobDto(body)).toThrow(AppError);
    expect(() => parseUpdateJobDto(body)).toThrow("sourceId must be a string or null");
  });
});
