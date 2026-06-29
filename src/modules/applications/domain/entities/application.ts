export interface ApplicationWithRelations {
  id: string;
  jobId: string;
  status: string;
  coverLetter: string | null;
  cvVersion: string | null;
  expectedSalary: number | null;
  availabilityDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  job: { id: string; title: string; company: string; [key: string]: unknown };
  events: Array<{
    id: string;
    type: string;
    oldValue: string | null;
    newValue: string | null;
    note: string | null;
    [key: string]: unknown;
  }>;
  interviews?: Array<{
    id: string;
    type: string;
    scheduledAt: Date;
    [key: string]: unknown;
  }>;
}

export interface ApplicationListFilters {
  status?: string;
  jobId?: string;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface Interview {
  id: string;
  applicationId: string;
  round: number;
  type: string;
  scheduledAt: Date;
  duration: number;
  interviewer: string | null;
}
