import { Router } from "express";
import { prisma } from "@/shared/lib/prisma.js";
import { AppError } from "@/shared/middleware/error.js";
import { PrismaJobRepository } from "@/modules/jobs/infrastructure/persistence/prisma-job-repository.js";
import { ListJobsUseCase } from "@/modules/jobs/application/use-cases/list-jobs.js";
import { GetJobUseCase } from "@/modules/jobs/application/use-cases/get-job.js";
import { CreateJobUseCase } from "@/modules/jobs/application/use-cases/create-job.js";
import { UpdateJobUseCase } from "@/modules/jobs/application/use-cases/update-job.js";
import { DeleteJobUseCase } from "@/modules/jobs/application/use-cases/delete-job.js";
import { SearchExternalJobsUseCase } from "@/modules/jobs/application/use-cases/search-external-jobs.js";
import { validateCreateJobDto } from "@/modules/jobs/application/dto/create-job.dto.js";
import { parseUpdateJobDto } from "@/modules/jobs/application/dto/update-job.dto.js";

const jobRepository = new PrismaJobRepository(prisma);
const listJobsUseCase = new ListJobsUseCase(jobRepository);
const getJobUseCase = new GetJobUseCase(jobRepository);
const createJobUseCase = new CreateJobUseCase(jobRepository);
const updateJobUseCase = new UpdateJobUseCase(jobRepository);
const deleteJobUseCase = new DeleteJobUseCase(jobRepository);
const searchExternalJobsUseCase = new SearchExternalJobsUseCase();

export const jobsRouter = Router();

// GET /api/v1/jobs/search — Search external job listings across multiple portals
jobsRouter.get("/search", async (req, res) => {
  const { query, location, limit, sources } = req.query;

  if (typeof location !== "string" || !location) {
    throw new AppError(400, "location is required");
  }

  const result = await searchExternalJobsUseCase.execute({
    query: query as string | undefined,
    location: location as string,
    limit: limit ? Number(limit) : undefined,
    sources: typeof sources === "string" ? sources.split(",") : undefined,
  });

  res.json({ data: result });
});

// GET /api/v1/jobs — List all jobs with optional filters
jobsRouter.get("/", async (req, res) => {
  const { status, company, source, sourceId, limit = "50", offset = "0" } = req.query;

  const result = await listJobsUseCase.execute({
    status: status as never,
    company: company as string | undefined,
    source: source as never,
    sourceId: sourceId as string | undefined,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json(result);
});

// GET /api/v1/jobs/:id — Get single job
jobsRouter.get("/:id", async (req, res) => {
  const job = await getJobUseCase.execute(req.params.id);
  res.json({ data: job });
});

// POST /api/v1/jobs — Create a new job entry
jobsRouter.post("/", async (req, res) => {
  const dto = validateCreateJobDto(req.body);
  const job = await createJobUseCase.execute(dto);
  res.status(201).json({ data: job });
});

// PATCH /api/v1/jobs/:id — Update a job
jobsRouter.patch("/:id", async (req, res) => {
  const dto = parseUpdateJobDto(req.body);
  const job = await updateJobUseCase.execute(req.params.id, dto);
  res.json({ data: job });
});

// DELETE /api/v1/jobs/:id — Delete a job
jobsRouter.delete("/:id", async (req, res) => {
  await deleteJobUseCase.execute(req.params.id);
  res.status(204).send();
});
