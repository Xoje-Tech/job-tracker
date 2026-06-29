// Test setup — load environment variables
import { config } from "dotenv";
config({ path: ".env" });

// Set test defaults
process.env.NODE_ENV = "test";
// Use a unique DB per test file to avoid cross-file collisions
process.env.DATABASE_URL =
  process.env.DATABASE_URL || `file:./test-${process.pid}.db`;
