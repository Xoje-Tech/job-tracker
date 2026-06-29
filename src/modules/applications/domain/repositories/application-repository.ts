import type {
  ApplicationWithRelations,
  ApplicationListFilters,
  PaginatedResult,
  Interview,
} from "../entities/application.js";

export interface ApplicationRepository {
  findAll(filters: ApplicationListFilters): Promise<PaginatedResult<ApplicationWithRelations>>;
  findById(id: string): Promise<ApplicationWithRelations | null>;
  create(data: CreateApplicationInput): Promise<ApplicationWithRelations>;
  updateStatus(id: string, status: string): Promise<ApplicationWithRelations>;
  addEvent(data: AddEventInput): Promise<void>;
  createInterview(data: CreateInterviewInput): Promise<Interview>;
  jobExists(jobId: string): Promise<boolean>;
}

export interface CreateApplicationInput {
  jobId: string;
  coverLetter?: string | null;
  expectedSalary?: number | null;
}

export interface AddEventInput {
  applicationId: string;
  type: string;
  oldValue?: string | null;
  newValue: string;
  note?: string | null;
}

export interface CreateInterviewInput {
  applicationId: string;
  type: string;
  scheduledAt: Date;
  duration: number;
  interviewer?: string | null;
}
