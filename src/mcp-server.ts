import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import child_process from "child_process";
import { prisma } from "@/shared/lib/prisma.js";
import { PrismaJobRepository } from "@/modules/jobs/infrastructure/persistence/prisma-job-repository.js";
import { ListJobsUseCase } from "@/modules/jobs/application/use-cases/list-jobs.js";
import { CreateJobUseCase } from "@/modules/jobs/application/use-cases/create-job.js";
import { UpdateJobUseCase } from "@/modules/jobs/application/use-cases/update-job.js";

// Safe redirect of all console.log to console.error
console.log = (...args) => {
  console.error(...args);
};

// Types/schemas
export const JobStatusSchema = z.enum([
  "SAVED",
  "INTERESTING",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
]);

export const JobSourceSchema = z.enum([
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
]);

export const PrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const SearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().min(1),
  limit: z.number().optional(),
});

export const ListSchema = z.object({
  status: JobStatusSchema.optional(),
  company: z.string().optional(),
  source: JobSourceSchema.optional(),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
});

export const AddSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  source: JobSourceSchema.optional().default("MANUAL"),
});

export const UpdateSchema = z.object({
  id: z.string().min(1),
  status: JobStatusSchema,
  priority: PrioritySchema.optional(),
});

// Helper for MCP responses
export function toSuccessResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function toErrorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

// Instantiate server
export const server = new McpServer({
  name: "job-tracker",
  version: "1.0.0",
});

// Domain instantiation
const jobRepository = new PrismaJobRepository(prisma);
const listJobsUseCase = new ListJobsUseCase(jobRepository);
const createJobUseCase = new CreateJobUseCase(jobRepository);
const updateJobUseCase = new UpdateJobUseCase(jobRepository);

// Define tools
server.registerTool(
  "job_tracker_search_external_jobs",
  {
    description: "Search external job listings on LinkedIn using the guest scraper.",
    inputSchema: SearchSchema,
  },
  async (rawArgs) => {
    const args = SearchSchema.parse(rawArgs);
    const cmdArgs = ["run", ".agents/skills/linkedin-search/cli/src/cli.ts", "search"];
    if (args.query) {
      cmdArgs.push("--query", args.query);
    }
    cmdArgs.push("--location", args.location);
    if (args.limit) {
      cmdArgs.push("--limit", String(args.limit));
    }
    cmdArgs.push("--format", "json");

    const res = child_process.spawnSync("bun", cmdArgs, { shell: false, encoding: "utf8" });
    if (res.error) {
      throw new Error(`Failed to run scraper: ${res.error.message}`);
    }
    if (res.status !== 0) {
      throw new Error(`Scraper exited with code ${res.status}: ${res.stderr}`);
    }

    try {
      const parsed = JSON.parse(res.stdout);
      return toSuccessResult(parsed.results || []);
    } catch (err: any) {
      throw new Error(`Failed to parse scraper output: ${err.message}`);
    }
  }
);

server.registerTool(
  "job_tracker_import_external_job",
  {
    description: "Search LinkedIn jobs and import them into the database while skipping duplicates.",
    inputSchema: SearchSchema,
  },
  async (rawArgs) => {
    const args = SearchSchema.parse(rawArgs);
    const cmdArgs = ["run", ".agents/skills/linkedin-search/cli/src/cli.ts", "search"];
    if (args.query) {
      cmdArgs.push("--query", args.query);
    }
    cmdArgs.push("--location", args.location);
    if (args.limit) {
      cmdArgs.push("--limit", String(args.limit));
    }
    cmdArgs.push("--format", "json");

    const res = child_process.spawnSync("bun", cmdArgs, { shell: false, encoding: "utf8" });
    if (res.error) {
      throw new Error(`Failed to run scraper: ${res.error.message}`);
    }
    if (res.status !== 0) {
      throw new Error(`Scraper exited with code ${res.status}: ${res.stderr}`);
    }

    let results: any[] = [];
    try {
      const parsed = JSON.parse(res.stdout);
      results = parsed.results || [];
    } catch (err: any) {
      throw new Error(`Failed to parse scraper output: ${err.message}`);
    }

    let imported = 0;
    let skipped = 0;

    for (const card of results) {
      const check = await jobRepository.findAll({
        source: "LINKEDIN",
        sourceId: card.id,
        limit: 1,
        offset: 0,
      });

      if (check.data && check.data.length > 0) {
        skipped++;
      } else {
        await createJobUseCase.execute({
          title: card.title,
          company: card.company,
          location: card.location,
          url: card.url,
          source: "LINKEDIN",
          sourceId: card.id,
          description: `Imported from LinkedIn - URL: ${card.url}`,
        });
        imported++;
      }
    }

    return toSuccessResult({
      total: results.length,
      imported,
      skipped,
    });
  }
);

server.registerTool(
  "job_tracker_list_jobs",
  {
    description: "List tracked job listings with optional status, company, and source filters.",
    inputSchema: ListSchema,
  },
  async (rawArgs) => {
    const args = ListSchema.parse(rawArgs);
    const result = await listJobsUseCase.execute({
      status: args.status,
      company: args.company,
      source: args.source,
      limit: args.limit,
      offset: args.offset,
    });
    return toSuccessResult(result);
  }
);

server.registerTool(
  "job_tracker_add_job",
  {
    description: "Manually add a new job tracking entry.",
    inputSchema: AddSchema,
  },
  async (rawArgs) => {
    const args = AddSchema.parse(rawArgs);
    const job = await createJobUseCase.execute({
      title: args.title,
      company: args.company,
      location: args.location ?? null,
      url: args.url ?? null,
      description: args.description,
      source: args.source,
    });
    return toSuccessResult(job);
  }
);

server.registerTool(
  "job_tracker_update_job_status",
  {
    description: "Update the status and priority of an existing job entry.",
    inputSchema: UpdateSchema,
  },
  async (rawArgs) => {
    const args = UpdateSchema.parse(rawArgs);
    try {
      const job = await updateJobUseCase.execute(args.id, {
        status: args.status,
        priority: args.priority,
      });
      return toSuccessResult(job);
    } catch (err: any) {
      return toErrorResult(err.message || "Job not found");
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio transport");
}

if (process.env.NODE_ENV !== "test") {
  main().catch((error) => {
    console.error("Fatal error in MCP Server:", error);
    process.exit(1);
  });
}
