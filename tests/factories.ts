// Test factories — create test data with realistic defaults
import { prisma } from "../src/shared/lib/prisma.js";

export async function createTestCompany(overrides: Record<string, unknown> = {}) {
  return prisma.company.create({
    data: {
      name: `Test Company ${Date.now()}`,
      website: "https://test-company.com",
      industry: "Technology",
      size: "SMALL",
      ...overrides,
    },
  });
}

export async function createTestJob(overrides: Record<string, unknown> = {}) {
  return prisma.job.create({
    data: {
      title: `Test Job ${Date.now()}`,
      company: "Test Company",
      location: "Barcelona",
      remote: "REMOTE",
      source: "MANUAL",
      status: "SAVED",
      description: "Test job description",
      ...overrides,
    },
  });
}

export async function createTestApplication(
  jobId: string,
  overrides: Record<string, unknown> = {}
) {
  return prisma.application.create({
    data: {
      jobId,
      status: "DRAFT",
      ...overrides,
    },
    include: { job: true },
  });
}

export async function cleanupTestData() {
  await prisma.applicationEvent.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.company.deleteMany({});
}
