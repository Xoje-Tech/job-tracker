import { describe, it, expect } from "vitest";
import { validateCreateJobDto } from "./create-job.dto.js";
import { AppError } from "@/shared/middleware/error.js";

describe("validateCreateJobDto", () => {
  it("should accept valid body with source and sourceId", () => {
    const body = {
      title: "Software Engineer",
      company: "Nous Research",
      source: "LINKEDIN",
      sourceId: "linkedin-12345",
    };
    const result = validateCreateJobDto(body);
    expect(result.source).toBe("LINKEDIN");
    expect(result.sourceId).toBe("linkedin-12345");
  });

  it("should accept null sourceId", () => {
    const body = {
      title: "Software Engineer",
      company: "Nous Research",
      source: "LINKEDIN",
      sourceId: null,
    };
    const result = validateCreateJobDto(body);
    expect(result.sourceId).toBeNull();
  });

  it("should throw AppError if source is not a string", () => {
    const body = {
      title: "Software Engineer",
      company: "Nous Research",
      source: 123,
    };
    expect(() => validateCreateJobDto(body)).toThrow(AppError);
    expect(() => validateCreateJobDto(body)).toThrow("source must be a string");
  });

  it("should throw AppError if sourceId is not a string or null", () => {
    const body = {
      title: "Software Engineer",
      company: "Nous Research",
      sourceId: 123,
    };
    expect(() => validateCreateJobDto(body)).toThrow(AppError);
    expect(() => validateCreateJobDto(body)).toThrow("sourceId must be a string or null");
  });
});
