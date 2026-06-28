import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { healthRouter } from "./routes/health.js";
import { jobsRouter } from "./routes/jobs.js";
import { applicationsRouter } from "./routes/applications.js";
import { companiesRouter } from "./routes/companies.js";
import { openapiRouter } from "./routes/openapi.js";

export function createApp() {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use("/api/health", healthRouter);
  app.use("/api/v1/jobs", jobsRouter);
  app.use("/api/v1/applications", applicationsRouter);
  app.use("/api/v1/companies", companiesRouter);

  // API Documentation (OpenAPI/Swagger)
  app.use("/api/docs", openapiRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
