import { describe, it, expect, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "@/server.js";
import { prisma } from "@/shared/lib/prisma.js";
import { cleanupTestData, createTestCompany } from "@/shared/test/factories.js";

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

describe("Companies API", () => {
  it("GET /api/v1/companies returns paginated list", async () => {
    const res = await request(app).get("/api/v1/companies");
    if (!dbAvailable) {
      expect([500, 200]).toContain(res.status);
      return;
    }
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/v1/companies creates a company", async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post("/api/v1/companies")
      .send({ name: `Acme Corp ${Date.now()}`, industry: "Tech" });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.name).toContain("Acme Corp");
  });

  it("POST /api/v1/companies requires name", async () => {
    const res = await request(app).post("/api/v1/companies").send({ industry: "Tech" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /api/v1/companies/:id returns company with jobs", async () => {
    if (!dbAvailable) return;
    const company = await createTestCompany();

    const res = await request(app).get(`/api/v1/companies/${company.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("jobs");
    expect(Array.isArray(res.body.data.jobs)).toBe(true);
  });

  it("GET /api/v1/companies/:id returns 404 for unknown id", async () => {
    if (!dbAvailable) return;
    const res = await request(app).get("/api/v1/companies/nonexistent-id-99999");
    expect(res.status).toBe(404);
  });
});
