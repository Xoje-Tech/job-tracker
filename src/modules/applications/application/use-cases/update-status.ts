import type { ApplicationRepository } from "@/modules/applications/domain/repositories/application-repository.js";
import type { ApplicationWithRelations } from "@/modules/applications/domain/entities/application.js";
import { AppError } from "@/shared/middleware/error.js";

export interface UpdateStatusCommand {
  status: string;
  note?: string;
}

export class UpdateStatusUseCase {
  constructor(private readonly repository: ApplicationRepository) {}

  async execute(id: string, command: UpdateStatusCommand): Promise<ApplicationWithRelations> {
    if (!command.status) throw new AppError(400, "status is required");

    const existing = await this.repository.findById(id);
    if (!existing) throw new AppError(404, "Application not found");

    const application = await this.repository.updateStatus(id, command.status);

    await this.repository.addEvent({
      applicationId: id,
      type: "STATUS_CHANGE",
      oldValue: existing.status,
      newValue: command.status,
      note: command.note ?? null,
    });

    return application;
  }
}
