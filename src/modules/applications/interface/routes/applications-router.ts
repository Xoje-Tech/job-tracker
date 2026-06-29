import { Router } from "express";
import { prisma } from "../../../../shared/lib/prisma.js";
import { AppError } from "../../../../shared/middleware/error.js";
import { PrismaApplicationRepository } from "../../infrastructure/persistence/prisma-application-repository.js";
import { ListApplicationsUseCase } from "../../application/use-cases/list-applications.js";
import { CreateApplicationUseCase } from "../../application/use-cases/create-application.js";
import { UpdateStatusUseCase } from "../../application/use-cases/update-status.js";
import { ScheduleInterviewUseCase } from "../../application/use-cases/schedule-interview.js";

const repository = new PrismaApplicationRepository(prisma);
const listApplicationsUseCase = new ListApplicationsUseCase(repository);
const createApplicationUseCase = new CreateApplicationUseCase(repository);
const updateStatusUseCase = new UpdateStatusUseCase(repository);
const scheduleInterviewUseCase = new ScheduleInterviewUseCase(repository);

export const applicationsRouter = Router();

// GET /api/v1/applications — List applications
applicationsRouter.get("/", async (req, res) => {
  const { status, limit = "50", offset = "0" } = req.query;

  const result = await listApplicationsUseCase.execute({
    status: status as string | undefined,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json(result);
});

// POST /api/v1/applications — Create application for a job
applicationsRouter.post("/", async (req, res) => {
  const { jobId, coverLetter, expectedSalary } = req.body;

  const application = await createApplicationUseCase.execute({
    jobId,
    coverLetter,
    expectedSalary,
  });

  res.status(201).json({ data: application });
});

// PATCH /api/v1/applications/:id/status — Update application status
applicationsRouter.patch("/:id/status", async (req, res) => {
  const { status, note } = req.body;

  const application = await updateStatusUseCase.execute(req.params.id, { status, note });

  res.json({ data: application });
});

// POST /api/v1/applications/:id/interviews — Schedule interview
applicationsRouter.post("/:id/interviews", async (req, res) => {
  const { type, scheduledAt, duration, interviewer } = req.body;

  if (!scheduledAt) throw new AppError(400, "scheduledAt is required");

  const interview = await scheduleInterviewUseCase.execute(req.params.id, {
    type: type || "VIDEO",
    scheduledAt: new Date(scheduledAt),
    duration: duration || 60,
    interviewer,
  });

  res.status(201).json({ data: interview });
});
