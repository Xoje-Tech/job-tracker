import { Command } from "commander";
import { client } from "../api/client.js";

export const statusCommand = new Command("status").description("Show system status");

statusCommand
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const health = await client.health();
      const jobs = await client.listJobs({ limit: 1 });
      const apps = await client.listApplications({ limit: 1 });
      const companies = await client.listCompanies({ limit: 1 });

      if (opts.json) {
        console.log(
          JSON.stringify(
            {
              server: health.status,
              version: health.version,
              jobs: jobs.total,
              applications: apps.total,
              companies: companies.total,
            },
            null,
            2
          )
        );
      } else {
        console.log("🟢 Server:", health.status);
        console.log("📦 Version:", health.version);
        console.log(`📋 Total jobs: ${jobs.total}`);
        console.log(`📝 Total applications: ${apps.total}`);
        console.log(`🏢 Total companies: ${companies.total}`);
      }
    } catch (err) {
      console.error("🔴 Server unreachable:", (err as Error).message);
      process.exit(1);
    }
  });
