import type { JobStatus, RemoteType, JobSource, Priority } from "@prisma/client";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: RemoteType;
  salaryMin: number | null;
  salaryMax: number | null;
  url: string | null;
  description: string;
  source: JobSource;
  status: JobStatus;
  priority: Priority;
  appliedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobWithRelations extends Job {
  tags: { tag: { id: string; name: string; color: string | null } }[];
  companyRef: { id: string; name: string } | null;
  applications?: { id: string }[];
  documents?: { id: string }[];
  reminders?: { id: string }[];
}

export interface JobListFilters {
  status?: JobStatus;
  company?: string;
  source?: JobSource;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
