import type { CompanyRepository } from "../../domain/repositories/company-repository.js";
import type {
  CompanyWithJobs,
  CompanyListFilters,
  PaginatedResult,
} from "../../domain/entities/company.js";

export class ListCompaniesUseCase {
  constructor(private readonly repository: CompanyRepository) {}

  async execute(filters: CompanyListFilters): Promise<PaginatedResult<CompanyWithJobs>> {
    return this.repository.findAll(filters);
  }
}
