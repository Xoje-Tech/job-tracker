#!/usr/bin/env -S npx tsx
import { Command } from "commander";
import { jobsCommand } from "./commands/jobs.js";
import { applicationsCommand } from "./commands/applications.js";
import { companiesCommand } from "./commands/companies.js";
import { statusCommand } from "./commands/status.js";

const program = new Command();

program.name("job-tracker").description("AI-powered job search tracker CLI").version("0.1.0");

program.addCommand(jobsCommand);
program.addCommand(applicationsCommand);
program.addCommand(companiesCommand);
program.addCommand(statusCommand);

program.parse();
