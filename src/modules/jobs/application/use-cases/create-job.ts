import type { JobRepository } from "../../domain/repositories/job-repository.js";
import type { CreateJobDto } from "../dto/create-job.dto.js";
import type { Job } from "../../domain/entities/job.js";

export class CreateJobUseCase {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(dto: CreateJobDto): Promise<Job> {
    return this.jobRepository.create(dto);
  }
}
