import type { JobRepository } from "../../domain/repositories/job-repository.js";
import type {
  JobWithRelations,
  JobListFilters,
  PaginatedResult,
} from "../../domain/entities/job.js";

export class ListJobsUseCase {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(filters: JobListFilters): Promise<PaginatedResult<JobWithRelations>> {
    return this.jobRepository.findAll(filters);
  }
}
