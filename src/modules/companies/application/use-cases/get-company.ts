import type { CompanyRepository } from "@/modules/companies/domain/repositories/company-repository.js";
import type { CompanyWithJobs } from "@/modules/companies/domain/entities/company.js";
import { AppError } from "@/shared/middleware/error.js";

export class GetCompanyUseCase {
  constructor(private readonly repository: CompanyRepository) {}

  async execute(id: string): Promise<CompanyWithJobs> {
    const company = await this.repository.findById(id);
    if (!company) throw new AppError(404, "Company not found");
    return company;
  }
}
