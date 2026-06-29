import { Command } from "commander";
import { client } from "../api/client.js";

export const companiesCommand = new Command("companies").description("Manage companies");

companiesCommand
  .command("list")
  .description("List companies")
  .option("-i, --industry <industry>", "Filter by industry")
  .option("-l, --limit <n>", "Limit results", "20")
  .option("--offset <n>", "Offset for pagination", "0")
  .option("--json", "Output as JSON")
  .action(async (opts, cmd) => {
    try {
      const res = await client.listCompanies({
        industry: opts.industry,
        limit: Number(opts.limit),
      });
      if (cmd.opts().json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.table(
          res.data.map((c: Record<string, unknown>) => ({
            id: c.id,
            name: c.name,
            industry: c.industry,
            jobs: (c as Record<string, unknown>)._count ?? "N/A",
          })),
        );
        console.log(`\n${res.total} total companies`);
      }
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });

companiesCommand
  .command("get")
  .description("Get company details with jobs")
  .requiredOption("-i, --id <id>", "Company ID")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const res = await client.getCompany(opts.id);
      console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });

companiesCommand
  .command("add")
  .description("Add a new company")
  .requiredOption("-n, --name <name>", "Company name")
  .option("-w, --website <url>", "Company website")
  .option("--industry <industry>", "Industry")
  .option("--size <size>", "Company size (UNKNOWN/STARTUP/SMALL/MEDIUM/LARGE/ENTERPRISE)")
  .option("--description <desc>", "Description")
  .option("--json", "Output as JSON")
  .action(async (opts, cmd) => {
    try {
      const res = await client.createCompany({
        name: opts.name,
        website: opts.website,
        industry: opts.industry,
        size: opts.size?.toUpperCase(),
        description: opts.description,
      });
      if (cmd.opts().json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log("✅ Company created:", res.data.id);
      }
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });
