import { Router } from "express";
import { prisma } from "@/shared/lib/prisma.js";
import { AppError } from "@/shared/middleware/error.js";
import { PrismaCompanyRepository } from "@/modules/companies/infrastructure/persistence/prisma-company-repository.js";
import { ListCompaniesUseCase } from "@/modules/companies/application/use-cases/list-companies.js";
import { GetCompanyUseCase } from "@/modules/companies/application/use-cases/get-company.js";
import { CreateCompanyUseCase } from "@/modules/companies/application/use-cases/create-company.js";

const repository = new PrismaCompanyRepository(prisma);
const listCompaniesUseCase = new ListCompaniesUseCase(repository);
const getCompanyUseCase = new GetCompanyUseCase(repository);
const createCompanyUseCase = new CreateCompanyUseCase(repository);

export const companiesRouter = Router();

// GET /api/v1/companies — List companies
companiesRouter.get("/", async (req, res) => {
  const { industry, limit = "50", offset = "0" } = req.query;

  const result = await listCompaniesUseCase.execute({
    industry: industry as string | undefined,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json(result);
});

// GET /api/v1/companies/:id — Get company with its jobs
companiesRouter.get("/:id", async (req, res) => {
  const company = await getCompanyUseCase.execute(req.params.id);
  res.json({ data: company });
});

// POST /api/v1/companies — Create a company
companiesRouter.post("/", async (req, res) => {
  const { name, website, industry, size, description } = req.body;

  if (!name) throw new AppError(400, "name is required");

  const company = await createCompanyUseCase.execute({
    name,
    website,
    industry,
    size,
    description,
  });

  res.status(201).json({ data: company });
});
