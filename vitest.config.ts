import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@jobs": path.resolve(__dirname, "./src/modules/jobs"),
      "@applications": path.resolve(__dirname, "./src/modules/applications"),
      "@companies": path.resolve(__dirname, "./src/modules/companies"),
      "@cli": path.resolve(__dirname, "./cli"),
      "@cliApi": path.resolve(__dirname, "./cli/api"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    // SQLite doesn't handle concurrent writes — run all tests in a single fork
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"],
    },
  },
});
