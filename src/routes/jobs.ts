import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error.js";

export const jobsRouter = Router();

// GET /api/v1/jobs — List all jobs with optional filters
jobsRouter.get("/", async (req, res) => {
  const { status, company, source, limit = "50", offset = "0" } = req.query;

  const where = {
    status: status as never | undefined,
    company: company ? { contains: company as string, mode: "insensitive" as const } : undefined,
    source: source as never | undefined,
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: "desc" },
      include: { tags: { include: { tag: true } }, companyRef: true },
    }),
    prisma.job.count({ where: where as never }),
  ]);

  res.json({ data: jobs, total, limit: Number(limit), offset: Number(offset) });
});

// GET /api/v1/jobs/:id — Get single job
jobsRouter.get("/:id", async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      tags: { include: { tag: true } },
      companyRef: true,
      applications: true,
      documents: true,
      reminders: true,
    },
  });

  if (!job) throw new AppError(404, "Job not found");
  res.json({ data: job });
});

// POST /api/v1/jobs — Create a new job entry
jobsRouter.post("/", async (req, res) => {
  const { title, company, location, remote, url, description, source, salaryMin, salaryMax } =
    req.body;

  if (!title || !company) throw new AppError(400, "title and company are required");

  const job = await prisma.job.create({
    data: { title, company, location, remote, url, description, source, salaryMin, salaryMax },
  });

  res.status(201).json({ data: job });
});

// PATCH /api/v1/jobs/:id — Update a job
jobsRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Job not found");

  const job = await prisma.job.update({
    where: { id },
    data: req.body,
  });

  res.json({ data: job });
});

// DELETE /api/v1/jobs/:id — Delete a job
jobsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Job not found");

  await prisma.job.delete({ where: { id } });
  res.status(204).send();
});
