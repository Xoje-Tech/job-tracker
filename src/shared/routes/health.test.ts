import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "@/server.js";

describe("Health Routes", () => {
  it("GET /api/health returns ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("job-tracker");
  });

  it("GET /api/health/db returns database status", async () => {
    const res = await request(app).get("/api/health/db");
    // Will be 503 if no DB connected, 200 if connected
    expect([200, 503]).toContain(res.status);
  });
});
