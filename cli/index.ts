#!/usr/bin/env -S npx tsx
import { Command } from "commander";
import { jobsCommand } from "@cli/commands/jobs.js";
import { applicationsCommand } from "@cli/commands/applications.js";
import { companiesCommand } from "@cli/commands/companies.js";
import { statusCommand } from "@cli/commands/status.js";

const program = new Command();

program.name("job-tracker").description("AI-powered job search tracker CLI").version("0.1.0");

program.addCommand(jobsCommand);
program.addCommand(applicationsCommand);
program.addCommand(companiesCommand);
program.addCommand(statusCommand);

program.parse();
