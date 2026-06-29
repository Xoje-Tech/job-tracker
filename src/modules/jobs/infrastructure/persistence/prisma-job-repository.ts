import type { PrismaClient } from "@prisma/client";
import type {
  Job,
  JobWithRelations,
  JobListFilters,
  PaginatedResult,
  RemoteType,
  JobSource,
} from "@/modules/jobs/domain/entities/job.js";
import type { JobRepository } from "@/modules/jobs/domain/repositories/job-repository.js";
import type { CreateJobInput, UpdateJobInput } from "@/modules/jobs/domain/repositories/job-repository.js";

export class PrismaJobRepository implements JobRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(filters: JobListFilters): Promise<PaginatedResult<JobWithRelations>> {
    const { status, company, source, limit, offset } = filters;

    const where = {
      status: status ?? undefined,
      company: company ? { contains: company, mode: "insensitive" as const } : undefined,
      source: source ?? undefined,
    };

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: { tags: { include: { tag: true } }, companyRef: true },
      }) as unknown as Promise<JobWithRelations[]>,
      this.prisma.job.count({ where }),
    ]);

    return { data: jobs, total, limit, offset };
  }

  async findById(id: string): Promise<JobWithRelations | null> {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        companyRef: true,
        applications: true,
        documents: true,
        reminders: true,
      },
    }) as unknown as Promise<JobWithRelations | null>;
  }

  async create(data: CreateJobInput): Promise<Job> {
    return this.prisma.job.create({
      data: {
        title: data.title,
        company: data.company,
        location: data.location ?? null,
        remote: (data.remote as RemoteType) ?? "UNKNOWN",
        url: data.url ?? null,
        description: data.description ?? "",
        source: (data.source as JobSource) ?? "MANUAL",
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
      },
    }) as unknown as Promise<Job>;
  }

  async update(id: string, data: UpdateJobInput): Promise<Job> {
    return this.prisma.job.update({
      where: { id },
      data: {
        title: data.title,
        company: data.company,
        status: data.status as Job["status"],
        priority: data.priority as Job["priority"],
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        url: data.url,
        description: data.description,
        location: data.location,
        remote: data.remote as RemoteType | undefined,
        source: data.source as JobSource | undefined,
      },
    }) as unknown as Promise<Job>;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.job.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.job.count({ where: { id } });
    return count > 0;
  }
}
