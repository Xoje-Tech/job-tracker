import type { PrismaClient } from "@prisma/client";

export type ApplicationStatus = "DRAFT" | "SUBMITTED" | "SCREENING" | "PHONE_SCREEN" | "TECHNICAL" | "ONSITE" | "OFFER_RECEIVED" | "NEGOTIATION" | "ACCEPTED" | "REJECTED" | "GHOSTED" | "WITHDRAWN";
export type ApplicationEventType = "STATUS_CHANGE" | "NOTE_ADDED" | "DOCUMENT_ATTACHED" | "INTERVIEW_SCHEDULED" | "REMINDER_SET" | "AI_INTERACTION";
export type InterviewType = "PHONE" | "VIDEO" | "ONSITE" | "TECHNICAL" | "CULTURE_FIT" | "PANEL" | "FINAL";
import type { ApplicationRepository } from "@/modules/applications/domain/repositories/application-repository.js";
import type {
  ApplicationWithRelations,
  ApplicationListFilters,
  PaginatedResult,
  Interview,
} from "@/modules/applications/domain/entities/application.js";
import type {
  CreateApplicationInput,
  AddEventInput,
  CreateInterviewInput,
} from "@/modules/applications/domain/repositories/application-repository.js";

export class PrismaApplicationRepository implements ApplicationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(
    filters: ApplicationListFilters,
  ): Promise<PaginatedResult<ApplicationWithRelations>> {
    const { status, limit, offset } = filters;

    const where = status ? { status: status as ApplicationStatus } : {};

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { updatedAt: "desc" },
        include: { job: true, events: true, interviews: true },
      }) as unknown as Promise<ApplicationWithRelations[]>,
      this.prisma.application.count({ where }),
    ]);

    return { data: applications, total, limit, offset };
  }

  async findById(id: string): Promise<ApplicationWithRelations | null> {
    return this.prisma.application.findUnique({
      where: { id },
      include: { job: true, events: true, interviews: true },
    }) as unknown as Promise<ApplicationWithRelations | null>;
  }

  async create(data: CreateApplicationInput): Promise<ApplicationWithRelations> {
    const application = (await this.prisma.application.create({
      data: {
        jobId: data.jobId,
        coverLetter: data.coverLetter ?? null,
        expectedSalary: data.expectedSalary ?? null,
      },
      include: { job: true, events: true },
    })) as unknown as ApplicationWithRelations;

    // Update job status
    await this.prisma.job.update({
      where: { id: data.jobId },
      data: { status: "APPLIED", appliedAt: new Date() },
    });

    return application;
  }

  async updateStatus(id: string, status: string): Promise<ApplicationWithRelations> {
    return this.prisma.application.update({
      where: { id },
      data: { status: status as ApplicationStatus },
      include: { job: true, events: true },
    }) as unknown as Promise<ApplicationWithRelations>;
  }

  async addEvent(data: AddEventInput): Promise<void> {
    await this.prisma.applicationEvent.create({
      data: {
        applicationId: data.applicationId,
        type: data.type as ApplicationEventType,
        oldValue: data.oldValue ?? null,
        newValue: data.newValue,
        note: data.note ?? null,
      },
    });
  }

  async createInterview(data: CreateInterviewInput): Promise<Interview> {
    return this.prisma.interview.create({
      data: {
        applicationId: data.applicationId,
        type: data.type as InterviewType,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        interviewer: data.interviewer ?? null,
      },
    });
  }

  async jobExists(jobId: string): Promise<boolean> {
    const count = await this.prisma.job.count({ where: { id: jobId } });
    return count > 0;
  }
}
