import { describe, it, expect, beforeAll } from "vitest";
import { PrismaJobRepository } from "./prisma-job-repository.js";
import { prisma } from "@/shared/lib/prisma.js";

describe("PrismaJobRepository Integration Tests", () => {
  let repository: PrismaJobRepository;

  beforeAll(() => {
    repository = new PrismaJobRepository(prisma);
  });

  it("should persist sourceId during create and update", async () => {
    const job = await repository.create({
      title: "Staff Systems Engineer",
      company: "Prisma Corp",
      location: "San Francisco",
      remote: "HYBRID",
      description: "Prisma and Node.js role",
      source: "LINKEDIN",
      sourceId: "linkedin-999888",
    });

    expect(job).toHaveProperty("id");
    expect(job.sourceId).toBe("linkedin-999888");

    // Retrieve and verify from database directly
    const dbJob = await prisma.job.findUnique({
      where: { id: job.id },
    });
    expect(dbJob?.sourceId).toBe("linkedin-999888");

    // Update the sourceId and other fields
    const updatedJob = await repository.update(job.id, {
      title: "Senior Staff Systems Engineer",
      sourceId: "linkedin-999888-updated",
    });

    expect(updatedJob.sourceId).toBe("linkedin-999888-updated");

    const dbJobUpdated = await prisma.job.findUnique({
      where: { id: job.id },
    });
    expect(dbJobUpdated?.sourceId).toBe("linkedin-999888-updated");

    // Cleanup
    await prisma.job.delete({ where: { id: job.id } });
  });

  it("should filter by sourceId and source in findAll", async () => {
    const job1 = await repository.create({
      title: "Rust Developer",
      company: "Mozilla",
      source: "LINKEDIN",
      sourceId: "linkedin-111222",
    });

    const job2 = await repository.create({
      title: "Go Developer",
      company: "Google",
      source: "INDEED",
      sourceId: "indeed-333444",
    });

    // Find all filtering by sourceId
    const resultBySourceId = await repository.findAll({
      sourceId: "linkedin-111222",
      limit: 10,
      offset: 0,
    });

    expect(resultBySourceId.data).toHaveLength(1);
    expect(resultBySourceId.data[0].id).toBe(job1.id);
    expect(resultBySourceId.total).toBe(1);

    // Find all filtering by source
    const resultBySource = await repository.findAll({
      source: "INDEED",
      limit: 10,
      offset: 0,
    });

    // Should find job2 since it has source INDEED (plus any existing INDEED jobs in DB)
    const indeedJobIds = resultBySource.data.map((j) => j.id);
    expect(indeedJobIds).toContain(job2.id);

    // Cleanup
    await prisma.job.deleteMany({
      where: {
        id: { in: [job1.id, job2.id] },
      },
    });
  });
});
