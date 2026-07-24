import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import { app } from "@/server.js";
import { prisma } from "@/shared/lib/prisma.js";

// Skip DB tests if no database is available
let dbAvailable = true;
try {
  await prisma.$queryRaw`SELECT 1`;
} catch {
  dbAvailable = false;
}

describe("Jobs API", () => {
  let testJobId: string;

  afterEach(async () => {
    if (testJobId && dbAvailable) {
      await prisma.job.delete({ where: { id: testJobId } }).catch(() => {});
      testJobId = "";
    }
  });

  it("GET /api/v1/jobs returns paginated list", async () => {
    const res = await request(app).get("/api/v1/jobs");
    if (!dbAvailable) {
      expect([500, 200]).toContain(res.status);
      return;
    }
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/v1/jobs creates a new job", async () => {
    if (!dbAvailable) {
      console.log("  ⚠️  Skipping: no database");
      return;
    }
    const res = await request(app).post("/api/v1/jobs").send({
      title: "Senior Backend Developer",
      company: "Test Corp",
      location: "Barcelona",
      remote: "REMOTE",
      description: "Node.js and TypeScript role",
      source: "MANUAL",
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.title).toBe("Senior Backend Developer");

    testJobId = res.body.data.id;
  });

  it("POST /api/v1/jobs rejects missing required fields", async () => {
    const res = await request(app).post("/api/v1/jobs").send({ location: "Madrid" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /api/v1/jobs/:id returns 404 for unknown id", async () => {
    if (!dbAvailable) {
      console.log("  ⚠️  Skipping: no database");
      return;
    }
    const res = await request(app).get("/api/v1/jobs/nonexistent-id-12345");
    expect(res.status).toBe(404);
  });

  it("GET /api/v1/jobs filters results by query parameters source and sourceId", async () => {
    if (!dbAvailable) {
      console.log("  ⚠️  Skipping: no database");
      return;
    }

    // Create a job with unique sourceId
    const res1 = await request(app).post("/api/v1/jobs").send({
      title: "Unique Developer",
      company: "Filter Corp",
      source: "LINKEDIN",
      sourceId: "filter-unique-123",
    });
    expect(res1.status).toBe(201);
    const job1Id = res1.body.data.id;

    try {
      // Query filter by sourceId
      const resFilter = await request(app)
        .get("/api/v1/jobs")
        .query({ source: "LINKEDIN", sourceId: "filter-unique-123" });

      expect(resFilter.status).toBe(200);
      expect(resFilter.body.data).toHaveLength(1);
      expect(resFilter.body.data[0].id).toBe(job1Id);
    } finally {
      // Cleanup
      await prisma.job.delete({ where: { id: job1Id } }).catch(() => {});
    }
  });
});
