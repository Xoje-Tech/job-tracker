import type { CompanyRepository } from "../../domain/repositories/company-repository.js";
import type { CreateCompanyInput } from "../../domain/repositories/company-repository.js";
import type { Company } from "../../domain/entities/company.js";

export class CreateCompanyUseCase {
  constructor(private readonly repository: CompanyRepository) {}

  async execute(data: CreateCompanyInput): Promise<Company> {
    return this.repository.create(data);
  }
}
