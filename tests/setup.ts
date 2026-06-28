// Test setup — load environment variables
import { config } from "dotenv";
config({ path: ".env" });

// Set test defaults
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://jobtracker:***@localhost:5432/jobtracker_test?schema=public";
