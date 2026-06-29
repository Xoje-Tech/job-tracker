import type { ApplicationRepository } from "@/modules/applications/domain/repositories/application-repository.js";
import type { Interview } from "@/modules/applications/domain/entities/application.js";
import { AppError } from "@/shared/middleware/error.js";

export interface ScheduleInterviewCommand {
  type: string;
  scheduledAt: Date;
  duration: number;
  interviewer?: string | null;
}

export class ScheduleInterviewUseCase {
  constructor(private readonly repository: ApplicationRepository) {}

  async execute(applicationId: string, command: ScheduleInterviewCommand): Promise<Interview> {
    if (!command.scheduledAt) throw new AppError(400, "scheduledAt is required");

    const existing = await this.repository.findById(applicationId);
    if (!existing) throw new AppError(404, "Application not found");

    const interview = await this.repository.createInterview({
      applicationId,
      type: command.type,
      scheduledAt: command.scheduledAt,
      duration: command.duration,
      interviewer: command.interviewer ?? null,
    });

    await this.repository.updateStatus(applicationId, "TECHNICAL");

    return interview;
  }
}
