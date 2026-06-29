import type { JobRepository } from "@/modules/jobs/domain/repositories/job-repository.js";
import { AppError } from "@/shared/middleware/error.js";

export class DeleteJobUseCase {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(id: string): Promise<void> {
    const exists = await this.jobRepository.exists(id);
    if (!exists) throw new AppError(404, "Job not found");
    await this.jobRepository.delete(id);
  }
}
