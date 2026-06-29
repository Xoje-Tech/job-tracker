import type { ApplicationRepository } from "@/modules/applications/domain/repositories/application-repository.js";
import type { ApplicationWithRelations } from "@/modules/applications/domain/entities/application.js";
import { AppError } from "@/shared/middleware/error.js";

export interface CreateApplicationCommand {
  jobId: string;
  coverLetter?: string | null;
  expectedSalary?: number | null;
}

export class CreateApplicationUseCase {
  constructor(private readonly repository: ApplicationRepository) {}

  async execute(command: CreateApplicationCommand): Promise<ApplicationWithRelations> {
    if (!command.jobId) throw new AppError(400, "jobId is required");

    const jobExists = await this.repository.jobExists(command.jobId);
    if (!jobExists) throw new AppError(404, "Job not found");

    const application = await this.repository.create({
      jobId: command.jobId,
      coverLetter: command.coverLetter,
      expectedSalary: command.expectedSalary,
    });

    await this.repository.addEvent({
      applicationId: application.id,
      type: "STATUS_CHANGE",
      newValue: "DRAFT",
      note: "Application created",
    });

    return application;
  }
}
