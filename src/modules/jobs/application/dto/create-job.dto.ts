import { AppError } from "@/shared/middleware/error.js";

export interface CreateJobDto {
  title: string;
  company: string;
  location?: string | null;
  remote?: string;
  url?: string | null;
  description?: string;
  source?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
}

export function validateCreateJobDto(body: unknown): CreateJobDto {
  if (typeof body !== "object" || body === null) {
    throw new AppError(400, "Request body must be an object");
  }
  const obj = body as Record<string, unknown>;
  if (typeof obj.title !== "string" || !obj.title) {
    throw new AppError(400, "title and company are required");
  }
  if (typeof obj.company !== "string" || !obj.company) {
    throw new AppError(400, "title and company are required");
  }
  return {
    title: obj.title,
    company: obj.company,
    location: obj.location as string | null | undefined,
    remote: obj.remote as string | undefined,
    url: obj.url as string | null | undefined,
    description: obj.description as string | undefined,
    source: obj.source as string | undefined,
    salaryMin: obj.salaryMin as number | null | undefined,
    salaryMax: obj.salaryMax as number | null | undefined,
  };
}
