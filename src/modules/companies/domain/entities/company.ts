export type CompanySize = "UNKNOWN" | "STARTUP" | "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE";

export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: CompanySize;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyWithJobs extends Company {
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    status: string;
    tags: { tag: { id: string; name: string; color: string | null } }[];
    createdAt: Date;
  }>;
  _count?: { jobs: number };
}

export interface CompanyListFilters {
  industry?: string;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
