import type { JobRepository } from "@/modules/jobs/domain/repositories/job-repository.js";
import type { CreateJobDto } from "@/modules/jobs/application/dto/create-job.dto.js";
import type { Job } from "@/modules/jobs/domain/entities/job.js";

export class CreateJobUseCase {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(dto: CreateJobDto): Promise<Job> {
    return this.jobRepository.create(dto);
  }
}
