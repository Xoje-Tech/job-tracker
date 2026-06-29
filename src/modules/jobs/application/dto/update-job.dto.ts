export interface UpdateJobDto {
  title?: string;
  company?: string;
  status?: string;
  priority?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  url?: string | null;
  description?: string;
  location?: string | null;
  remote?: string;
  source?: string;
}

export function parseUpdateJobDto(body: unknown): UpdateJobDto {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be an object");
  }
  const obj = body as Record<string, unknown>;
  return {
    title: obj.title as string | undefined,
    company: obj.company as string | undefined,
    status: obj.status as string | undefined,
    priority: obj.priority as string | undefined,
    salaryMin: obj.salaryMin as number | null | undefined,
    salaryMax: obj.salaryMax as number | null | undefined,
    url: obj.url as string | null | undefined,
    description: obj.description as string | undefined,
    location: obj.location as string | null | undefined,
    remote: obj.remote as string | undefined,
    source: obj.source as string | undefined,
  };
}
