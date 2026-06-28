import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error.js";

export const companiesRouter = Router();

companiesRouter.get("/", async (req, res) => {
  const { industry, limit = "50", offset = "0" } = req.query;

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where: { industry: industry as string | undefined },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { name: "asc" },
      include: { _count: { select: { jobs: true } } },
    }),
    prisma.company.count({ where: { industry: industry as string | undefined } }),
  ]);

  res.json({ data: companies, total, limit: Number(limit), offset: Number(offset) });
});

companiesRouter.get("/:id", async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: req.params.id },
    include: {
      jobs: {
        include: { tags: { include: { tag: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) throw new AppError(404, "Company not found");
  res.json({ data: company });
});

companiesRouter.post("/", async (req, res) => {
  const { name, website, industry, size, description } = req.body;

  if (!name) throw new AppError(400, "name is required");

  const company = await prisma.company.create({
    data: { name, website, industry, size, description },
  });

  res.status(201).json({ data: company });
});
