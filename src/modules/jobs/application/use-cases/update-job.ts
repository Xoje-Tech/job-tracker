import type { JobRepository } from "../../domain/repositories/job-repository.js";
import type { UpdateJobDto } from "../dto/update-job.dto.js";
import type { Job } from "../../domain/entities/job.js";
import { AppError } from "../../../../shared/middleware/error.js";

export class UpdateJobUseCase {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(id: string, dto: UpdateJobDto): Promise<Job> {
    const exists = await this.jobRepository.exists(id);
    if (!exists) throw new AppError(404, "Job not found");
    return this.jobRepository.update(id, dto);
  }
}
