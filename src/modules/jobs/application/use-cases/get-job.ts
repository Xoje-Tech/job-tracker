import type { JobRepository } from "../../domain/repositories/job-repository.js";
import type { JobWithRelations } from "../../domain/entities/job.js";
import { AppError } from "../../../../shared/middleware/error.js";

export class GetJobUseCase {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(id: string): Promise<JobWithRelations> {
    const job = await this.jobRepository.findById(id);
    if (!job) throw new AppError(404, "Job not found");
    return job;
  }
}
