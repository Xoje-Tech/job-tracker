# Core Domain — Job Tracker

This page details the core entities and business rules of the Job Tracker system.

## Domain Models

The application is built around the following key entities:
1. **Job**: Represents a job posting with its metadata (title, company, description, status, remote type).
2. **Application**: Represents the candidate's active application for a Job, tracking statuses through a defined timeline.
3. **Company**: Represents an organization posting jobs.

## Essential Enums

- **JobStatus**: `SAVED` → `INTERESTING` → `APPLIED` → `INTERVIEW` → `OFFER` → `REJECTED` / `WITHDRAWN`
- **ApplicationStatus**: `DRAFT` → `SUBMITTED` → `SCREENING` → `PHONE_SCREEN` → `TECHNICAL` → `ONSITE` → `OFFER_RECEIVED` → `ACCEPTED` / `REJECTED` / `GHOSTED`
- **RemoteType**: `ONSITE`, `REMOTE`, `HYBRID`, `UNKNOWN`
