import type { PrismaClient, Prisma } from "@prisma/client";
import type { CompanyRepository } from "../../domain/repositories/company-repository.js";
import type {
  Company,
  CompanyWithJobs,
  CompanyListFilters,
  PaginatedResult,
} from "../../domain/entities/company.js";
import type { CreateCompanyInput } from "../../domain/repositories/company-repository.js";

export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(filters: CompanyListFilters): Promise<PaginatedResult<CompanyWithJobs>> {
    const { industry, limit, offset } = filters;

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where: { industry: industry ?? undefined },
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        include: { _count: { select: { jobs: true } } },
      }) as unknown as Promise<CompanyWithJobs[]>,
      this.prisma.company.count({ where: { industry: industry ?? undefined } }),
    ]);

    return { data: companies, total, limit, offset };
  }

  async findById(id: string): Promise<CompanyWithJobs | null> {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        jobs: {
          include: { tags: { include: { tag: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }) as unknown as Promise<CompanyWithJobs | null>;
  }

  async create(data: CreateCompanyInput): Promise<Company> {
    return this.prisma.company.create({
      data: {
        name: data.name,
        website: data.website ?? null,
        industry: data.industry ?? null,
        size: (data.size ?? "UNKNOWN") as Prisma.CompanyCreateInput["size"],
        description: data.description ?? null,
      },
    });
  }
}
