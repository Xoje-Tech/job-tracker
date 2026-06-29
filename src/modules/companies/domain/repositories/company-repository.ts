import type {
  Company,
  CompanyWithJobs,
  CompanyListFilters,
  PaginatedResult,
} from "../entities/company.js";

export interface CompanyRepository {
  findAll(filters: CompanyListFilters): Promise<PaginatedResult<CompanyWithJobs>>;
  findById(id: string): Promise<CompanyWithJobs | null>;
  create(data: CreateCompanyInput): Promise<Company>;
}

export interface CreateCompanyInput {
  name: string;
  website?: string | null;
  industry?: string | null;
  size?: string;
  description?: string | null;
}
