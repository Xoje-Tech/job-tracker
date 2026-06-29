import type { CompanyRepository } from "@/modules/companies/domain/repositories/company-repository.js";
import type { CreateCompanyInput } from "@/modules/companies/domain/repositories/company-repository.js";
import type { Company } from "@/modules/companies/domain/entities/company.js";

export class CreateCompanyUseCase {
  constructor(private readonly repository: CompanyRepository) {}

  async execute(data: CreateCompanyInput): Promise<Company> {
    return this.repository.create(data);
  }
}
