import { Router } from "express";
import swaggerUi from "swagger-ui-express";

const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Job Tracker API",
    description:
      "REST API for tracking job postings, applications, companies, and interviews. All endpoints return JSON. IDs are CUIDs. Timestamps are ISO 8601.",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3000", description: "Local development" }],
  tags: [
    { name: "Health", description: "System health checks" },
    { name: "Jobs", description: "Job postings management" },
    { name: "Applications", description: "Job application tracking" },
    { name: "Companies", description: "Company management" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness check",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    version: { type: "string", example: "0.1.0" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/health/db": {
      get: {
        tags: ["Health"],
        summary: "Database connectivity check",
        responses: {
          "200": { description: "Database is reachable" },
          "503": { description: "Database is unreachable" },
        },
      },
    },
    "/api/v1/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "List jobs",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "SAVED",
                "INTERESTING",
                "APPLIED",
                "INTERVIEW",
                "OFFER",
                "REJECTED",
                "WITHDRAWN",
                "EXPIRED",
              ],
            },
          },
          { name: "company", in: "query", schema: { type: "string" } },
          {
            name: "source",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "MANUAL",
                "LINKEDIN",
                "INDEED",
                "INFOJOBS",
                "GLASSDOOR",
                "WELCOME_TO_THE_JUNTLE",
                "REMOTE_OK",
                "SCRAPER",
                "API_REFERRAL",
                "OTHER",
              ],
            },
          },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          "200": {
            description: "Paginated list of jobs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Job" } },
                    total: { type: "integer" },
                    limit: { type: "integer" },
                    offset: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Jobs"],
        summary: "Create a job",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "company"],
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  location: { type: "string" },
                  remote: { type: "string", enum: ["ONSITE", "REMOTE", "HYBRID", "UNKNOWN"] },
                  url: { type: "string" },
                  description: { type: "string" },
                  source: {
                    type: "string",
                    enum: [
                      "MANUAL",
                      "LINKEDIN",
                      "INDEED",
                      "INFOJOBS",
                      "GLASSDOOR",
                      "WELCOME_TO_THE_JUNTLE",
                      "REMOTE_OK",
                      "SCRAPER",
                      "API_REFERRAL",
                      "OTHER",
                    ],
                  },
                  salaryMin: { type: "number" },
                  salaryMax: { type: "number" },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Job created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Job" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/v1/jobs/{id}": {
      get: {
        tags: ["Jobs"],
        summary: "Get job by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Job details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Job" } },
                },
              },
            },
          },
          "404": { description: "Job not found" },
        },
      },
      patch: {
        tags: ["Jobs"],
        summary: "Update a job",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  status: {
                    type: "string",
                    enum: [
                      "SAVED",
                      "INTERESTING",
                      "APPLIED",
                      "INTERVIEW",
                      "OFFER",
                      "REJECTED",
                      "WITHDRAWN",
                      "EXPIRED",
                    ],
                  },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                  salaryMin: { type: "number" },
                  salaryMax: { type: "number" },
                  url: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Job updated" },
          "404": { description: "Job not found" },
        },
      },
      delete: {
        tags: ["Jobs"],
        summary: "Delete a job",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Job deleted" },
          "404": { description: "Job not found" },
        },
      },
    },
    "/api/v1/applications": {
      get: {
        tags: ["Applications"],
        summary: "List applications",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "DRAFT",
                "SUBMITTED",
                "SCREENING",
                "PHONE_SCREEN",
                "TECHNICAL",
                "ONSITE",
                "OFFER_RECEIVED",
                "NEGOTIATION",
                "ACCEPTED",
                "REJECTED",
                "GHOSTED",
                "WITHDRAWN",
              ],
            },
          },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          "200": { description: "Paginated list of applications" },
        },
      },
      post: {
        tags: ["Applications"],
        summary: "Create application (apply to a job)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["jobId"],
                properties: {
                  jobId: { type: "string" },
                  coverLetter: { type: "string" },
                  expectedSalary: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Application created" },
          "400": { description: "Validation error" },
          "404": { description: "Job not found" },
        },
      },
    },
    "/api/v1/applications/{id}/status": {
      patch: {
        tags: ["Applications"],
        summary: "Update application status",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "DRAFT",
                      "SUBMITTED",
                      "SCREENING",
                      "PHONE_SCREEN",
                      "TECHNICAL",
                      "ONSITE",
                      "OFFER_RECEIVED",
                      "NEGOTIATION",
                      "ACCEPTED",
                      "REJECTED",
                      "GHOSTED",
                      "WITHDRAWN",
                    ],
                  },
                  note: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Status updated" },
          "404": { description: "Application not found" },
        },
      },
    },
    "/api/v1/applications/{id}/interviews": {
      post: {
        tags: ["Applications"],
        summary: "Schedule an interview",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "scheduledAt"],
                properties: {
                  type: {
                    type: "string",
                    enum: [
                      "PHONE",
                      "VIDEO",
                      "ONSITE",
                      "TECHNICAL",
                      "CULTURE_FIT",
                      "PANEL",
                      "FINAL",
                    ],
                  },
                  scheduledAt: { type: "string", format: "date-time" },
                  duration: { type: "integer", description: "Duration in minutes" },
                  interviewer: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Interview scheduled" },
          "404": { description: "Application not found" },
        },
      },
    },
    "/api/v1/companies": {
      get: {
        tags: ["Companies"],
        summary: "List companies",
        parameters: [
          { name: "industry", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          "200": { description: "Paginated list of companies" },
        },
      },
      post: {
        tags: ["Companies"],
        summary: "Create a company",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  website: { type: "string" },
                  industry: { type: "string" },
                  size: {
                    type: "string",
                    enum: ["UNKNOWN", "STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"],
                  },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Company created" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/v1/companies/{id}": {
      get: {
        tags: ["Companies"],
        summary: "Get company with jobs",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Company details with associated jobs" },
          "404": { description: "Company not found" },
        },
      },
    },
  },
  components: {
    schemas: {
      Job: {
        type: "object",
        properties: {
          id: { type: "string", description: "CUID" },
          title: { type: "string" },
          company: { type: "string" },
          location: { type: "string", nullable: true },
          remote: { type: "string", enum: ["ONSITE", "REMOTE", "HYBRID", "UNKNOWN"] },
          url: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          salaryMin: { type: "number", nullable: true },
          salaryMax: { type: "number", nullable: true },
          status: {
            type: "string",
            enum: [
              "SAVED",
              "INTERESTING",
              "APPLIED",
              "INTERVIEW",
              "OFFER",
              "REJECTED",
              "WITHDRAWN",
              "EXPIRED",
            ],
          },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
          source: {
            type: "string",
            enum: [
              "MANUAL",
              "LINKEDIN",
              "INDEED",
              "INFOJOBS",
              "GLASSDOOR",
              "WELCOME_TO_THE_JUNTLE",
              "REMOTE_OK",
              "SCRAPER",
              "API_REFERRAL",
              "OTHER",
            ],
          },
          appliedAt: { type: "string", format: "date-time", nullable: true },
          archivedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

export const openapiRouter = Router();
openapiRouter.use("/", swaggerUi.serve);
openapiRouter.get(
  "/",
  swaggerUi.setup(openapiSpec, {
    customSiteTitle: "Job Tracker API",
    customCss: ".swagger-ui .topbar { display: none }",
  }),
);
