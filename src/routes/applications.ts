import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error.js";

export const applicationsRouter = Router();

// GET /api/v1/applications — List applications
applicationsRouter.get("/", async (req, res) => {
  const { status, limit = "50", offset = "0" } = req.query;

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: { status: status as never | undefined },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { updatedAt: "desc" },
      include: { job: true, events: true, interviews: true },
    }),
    prisma.application.count({ where: { status: status as never | undefined } }),
  ]);

  res.json({ data: applications, total, limit: Number(limit), offset: Number(offset) });
});

// POST /api/v1/applications — Create application for a job
applicationsRouter.post("/", async (req, res) => {
  const { jobId, coverLetter, expectedSalary } = req.body;

  if (!jobId) throw new AppError(400, "jobId is required");

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError(404, "Job not found");

  const application = await prisma.application.create({
    data: { jobId, coverLetter, expectedSalary },
    include: { job: true },
  });

  // Update job status
  await prisma.job.update({
    where: { id: jobId },
    data: { status: "APPLIED", appliedAt: new Date() },
  });

  // Create event
  await prisma.applicationEvent.create({
    data: {
      applicationId: application.id,
      type: "STATUS_CHANGE",
      newValue: "DRAFT",
      note: "Application created",
    },
  });

  res.status(201).json({ data: application });
});

// PATCH /api/v1/applications/:id/status — Update application status
applicationsRouter.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status) throw new AppError(400, "status is required");

  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Application not found");

  const [application] = await prisma.$transaction([
    prisma.application.update({
      where: { id },
      data: { status },
      include: { job: true, events: true },
    }),
    prisma.applicationEvent.create({
      data: {
        applicationId: id,
        type: "STATUS_CHANGE",
        oldValue: existing.status,
        newValue: status,
        note,
      },
    }),
  ]);

  res.json({ data: application });
});

// POST /api/v1/applications/:id/interviews — Schedule interview
applicationsRouter.post("/:id/interviews", async (req, res) => {
  const { id } = req.params;
  const { type, scheduledAt, duration, interviewer } = req.body;

  if (!scheduledAt) throw new AppError(400, "scheduledAt is required");

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) throw new AppError(404, "Application not found");

  const interview = await prisma.interview.create({
    data: {
      applicationId: id,
      type: type || "VIDEO",
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      interviewer,
    },
  });

  // Update application status
  await prisma.application.update({
    where: { id },
    data: { status: "TECHNICAL" },
  });

  res.status(201).json({ data: interview });
});
