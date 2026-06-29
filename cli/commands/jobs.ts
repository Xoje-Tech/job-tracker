import { Command } from "commander";
import { client } from "../api/client.js";

export const jobsCommand = new Command("jobs").description("Manage job listings");

jobsCommand
  .command("list")
  .description("List all jobs")
  .option("-s, --status <status>", "Filter by status")
  .option("-c, --company <company>", "Filter by company")
  .option("--source <source>", "Filter by source")
  .option("-l, --limit <n>", "Limit results", "20")
  .option("--offset <n>", "Offset for pagination", "0")
  .option("--json", "Output as JSON")
  .action(async (opts, cmd) => {
    try {
      const res = await client.listJobs({
        status: opts.status,
        company: opts.company,
        limit: Number(opts.limit),
        offset: Number(opts.offset),
      });
      if (cmd.opts().json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.table(
          res.data.map((j: Record<string, unknown>) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            status: j.status,
            source: j.source,
            created: j.createdAt,
          })),
        );
        console.log(`\n${res.total} total jobs`);
      }
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });

jobsCommand
  .command("add")
  .description("Add a new job entry")
  .requiredOption("-t, --title <title>", "Job title")
  .requiredOption("-c, --company <company>", "Company name")
  .option("-l, --location <location>", "Location")
  .option("-u, --url <url>", "Job URL")
  .option("-d, --description <desc>", "Description")
  .option("--salary-min <n>", "Minimum salary")
  .option("--salary-max <n>", "Maximum salary")
  .option("--remote <type>", "Remote type (ONSITE/REMOTE/HYBRID)")
  .option("--priority <priority>", "Priority (LOW/MEDIUM/HIGH/URGENT)")
  .option("--source <source>", "Job source (default: MANUAL)")
  .option("--json", "Output as JSON")
  .action(async (opts, cmd) => {
    try {
      const res = await client.createJob({
        title: opts.title,
        company: opts.company,
        location: opts.location,
        url: opts.url,
        description: opts.description,
        source: opts.source || "MANUAL",
        remote: opts.remote?.toUpperCase(),
        priority: opts.priority?.toUpperCase(),
        salaryMin: opts.salaryMin ? Number(opts.salaryMin) : undefined,
        salaryMax: opts.salaryMax ? Number(opts.salaryMax) : undefined,
      });
      if (cmd.opts().json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log("✅ Job created:", res.data.id);
      }
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });

jobsCommand
  .command("get")
  .description("Get job details")
  .requiredOption("-i, --id <id>", "Job ID")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const res = await client.getJob(opts.id);
      console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });

jobsCommand
  .command("update")
  .description("Update a job")
  .requiredOption("-i, --id <id>", "Job ID")
  .option("--status <status>", "Update status")
  .option("--priority <priority>", "Update priority")
  .option("-t, --title <title>", "Update title")
  .option("-c, --company <company>", "Update company")
  .option("--salary-min <n>", "Update minimum salary")
  .option("--salary-max <n>", "Update maximum salary")
  .option("-u, --url <url>", "Update URL")
  .option("--description <desc>", "Update description")
  .option("--json", "Output as JSON")
  .action(async (opts, cmd) => {
    try {
      const data: Record<string, unknown> = {};
      if (opts.status) data.status = opts.status.toUpperCase();
      if (opts.priority) data.priority = opts.priority.toUpperCase();
      if (opts.title) data.title = opts.title;
      if (opts.company) data.company = opts.company;
      if (opts.salaryMin) data.salaryMin = Number(opts.salaryMin);
      if (opts.salaryMax) data.salaryMax = Number(opts.salaryMax);
      if (opts.url) data.url = opts.url;
      if (opts.description) data.description = opts.description;

      const res = await client.updateJob(opts.id, data);
      if (cmd.opts().json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log("✅ Job updated:", res.data.id);
      }
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });

jobsCommand
  .command("remove")
  .description("Delete a job")
  .requiredOption("-i, --id <id>", "Job ID")
  .option("--json", "Output as JSON")
  .action(async (opts, cmd) => {
    try {
      await client.deleteJob(opts.id);
      if (cmd.opts().json) {
        console.log(JSON.stringify({ success: true, id: opts.id }, null, 2));
      } else {
        console.log("🗑️ Job deleted:", opts.id);
      }
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });
