import { describe, it, expect, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "@/server.js";
import { prisma } from "@/shared/lib/prisma.js";
import { cleanupTestData, createTestJob } from "@/shared/test/factories.js";

let dbAvailable = true;
try {
  await prisma.$queryRaw`SELECT 1`;
} catch {
  dbAvailable = false;
}

afterAll(async () => {
  if (dbAvailable) await prisma.$disconnect();
});

afterEach(async () => {
  if (dbAvailable) await cleanupTestData();
});

describe("Applications API", () => {
  it("GET /api/v1/applications returns paginated list", async () => {
    const res = await request(app).get("/api/v1/applications");
    if (!dbAvailable) {
      expect([500, 200]).toContain(res.status);
      return;
    }
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/v1/applications creates an application", async () => {
    if (!dbAvailable) return;
    const job = await createTestJob();

    const res = await request(app)
      .post("/api/v1/applications")
      .send({ jobId: job.id });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.jobId).toBe(job.id);
  });

  it("POST /api/v1/applications requires jobId", async () => {
    const res = await request(app).post("/api/v1/applications").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("PATCH /api/v1/applications/:id/status updates status", async () => {
    if (!dbAvailable) return;
    const job = await createTestJob();
    const app_record = await prisma.application.create({
      data: { jobId: job.id, status: "DRAFT" },
    });

    const res = await request(app)
      .patch(`/api/v1/applications/${app_record.id}/status`)
      .send({ status: "SUBMITTED", note: "Applied via LinkedIn" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("SUBMITTED");
  });

  it("POST /api/v1/applications/:id/interviews schedules interview", async () => {
    if (!dbAvailable) return;
    const job = await createTestJob();
    const app_record = await prisma.application.create({
      data: { jobId: job.id, status: "TECHNICAL" },
    });

    const res = await request(app)
      .post(`/api/v1/applications/${app_record.id}/interviews`)
      .send({
        type: "TECHNICAL",
        scheduledAt: "2026-07-15T10:00:00Z",
        duration: 60,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.type).toBe("TECHNICAL");
  });
});
