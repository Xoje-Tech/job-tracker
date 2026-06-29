import type { ApplicationRepository } from "@/modules/applications/domain/repositories/application-repository.js";
import type {
  ApplicationWithRelations,
  ApplicationListFilters,
  PaginatedResult,
} from "@/modules/applications/domain/entities/application.js";

export class ListApplicationsUseCase {
  constructor(private readonly repository: ApplicationRepository) {}

  async execute(
    filters: ApplicationListFilters,
  ): Promise<PaginatedResult<ApplicationWithRelations>> {
    return this.repository.findAll(filters);
  }
}
