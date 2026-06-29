import type { Job, JobWithRelations, JobListFilters, PaginatedResult } from "@/modules/jobs/domain/entities/job.js";

export interface JobRepository {
  findAll(filters: JobListFilters): Promise<PaginatedResult<JobWithRelations>>;
  findById(id: string): Promise<JobWithRelations | null>;
  create(data: CreateJobInput): Promise<Job>;
  update(id: string, data: UpdateJobInput): Promise<Job>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export interface CreateJobInput {
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

export interface UpdateJobInput {
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
