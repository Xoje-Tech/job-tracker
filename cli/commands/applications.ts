import { Command } from "commander";
import { client } from "../api/client.js";

export const applicationsCommand = new Command("applications").description("Manage job applications");

applicationsCommand
  .command("list")
  .description("List applications")
  .option("-s, --status <status>", "Filter by status")
  .option("-j, --job-id <id>", "Filter by job ID")
  .option("-l, --limit <n>", "Limit results", "20")
  .option("--offset <n>", "Offset for pagination", "0")
  .option("--json", "Output as JSON")
  .action(async (opts, cmd) => {
    try {
      const res = await client.listApplications({
        status: opts.status,
        limit: Number(opts.limit),
      });
      if (cmd.opts().json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.table(
          res.data.map((a: Record<string, unknown>) => ({
            id: a.id,
            job: (a.job as Record<string, unknown>)?.title,
            status: a.status,
            updated: a.updatedAt,
          }))
        );
        console.log(`\n${res.total} total applications`);
      }
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });

applicationsCommand
  .command("apply")
  .description("Apply to a job")
  .requiredOption("-j, --job-id <id>", "Job ID")
  .option("--cover-letter <text>", "Cover letter text")
  .option("--expected-salary <n>", "Expected salary")
  .option("--json", "Output as JSON")
  .action(async (opts, cmd) => {
    try {
      const res = await client.createApplication(opts.jobId, {
        coverLetter: opts.coverLetter,
        expectedSalary: opts.expectedSalary ? Number(opts.expectedSalary) : undefined,
      });
      if (cmd.opts().json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log("✅ Application created:", res.data.id);
      }
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });

applicationsCommand
  .command("status")
  .description("Update application status")
  .requiredOption("-i, --id <id>", "Application ID")
  .requiredOption("-s, --status <status>", "New status")
  .option("-n, --note <note>", "Status change note")
  .option("--json", "Output as JSON")
  .action(async (opts, cmd) => {
    try {
      const res = await client.updateApplicationStatus(opts.id, opts.status, opts.note);
      if (cmd.opts().json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log("✅ Status updated to:", res.data.status);
      }
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });

applicationsCommand
  .command("interview")
  .description("Schedule an interview")
  .requiredOption("-i, --id <id>", "Application ID")
  .requiredOption("-t, --type <type>", "Interview type (PHONE/VIDEO/ONSITE/TECHNICAL/CULTURE_FIT/PANEL/FINAL)")
  .requiredOption("--at <datetime>", "Scheduled datetime (ISO 8601)")
  .option("--duration <minutes>", "Duration in minutes")
  .option("--interviewer <name>", "Interviewer name")
  .option("--notes <notes>", "Notes")
  .option("--json", "Output as JSON")
  .action(async (opts, cmd) => {
    try {
      const res = await client.scheduleInterview(opts.id, {
        type: opts.type,
        scheduledAt: opts.at,
        duration: opts.duration ? Number(opts.duration) : undefined,
        interviewer: opts.interviewer,
        notes: opts.notes,
      });
      if (cmd.opts().json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log("✅ Interview scheduled:", res.data.id);
      }
    } catch (err) {
      console.error("❌ Error:", (err as Error).message);
      process.exit(1);
    }
  });
