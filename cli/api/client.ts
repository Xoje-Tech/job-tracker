/**
 * Job Tracker API Client
 * Used by the CLI to communicate with the server.
 * Agents can also import this client for programmatic access.
 */

import { env } from "@/shared/config/env.js";

export interface JobTrackerClientOptions {
  baseUrl?: string;
  apiKey?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export class JobTrackerClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(options: JobTrackerClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? `http://localhost:${env.PORT}`;
    this.apiKey = options.apiKey;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(`API Error ${res.status}: ${body.error || res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  // Health
  async health() {
    return this.request<{ status: string; version: string }>("/api/health");
  }

  // Jobs
  async listJobs(params?: { status?: string; company?: string; limit?: number; offset?: number }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.company) qs.set("company", params.company);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return this.request<PaginatedResponse<Record<string, unknown>>>(`/api/v1/jobs${query}`);
  }

  async getJob(id: string) {
    return this.request<{ data: Record<string, unknown> }>(`/api/v1/jobs/${id}`);
  }

  async createJob(data: Record<string, unknown>) {
    return this.request<{ data: Record<string, unknown> }>("/api/v1/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateJob(id: string, data: Record<string, unknown>) {
    return this.request<{ data: Record<string, unknown> }>(`/api/v1/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteJob(id: string) {
    return this.request<{ data: Record<string, unknown> }>(`/api/v1/jobs/${id}`, {
      method: "DELETE",
    });
  }

  // Applications
  async listApplications(params?: { status?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return this.request<PaginatedResponse<Record<string, unknown>>>(`/api/v1/applications${query}`);
  }

  async createApplication(jobId: string, data?: Record<string, unknown>) {
    return this.request<{ data: Record<string, unknown> }>("/api/v1/applications", {
      method: "POST",
      body: JSON.stringify({ jobId, ...data }),
    });
  }

  async updateApplicationStatus(id: string, status: string, note?: string) {
    return this.request<{ data: Record<string, unknown> }>(`/api/v1/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    });
  }

  async scheduleInterview(applicationId: string, data: Record<string, unknown>) {
    return this.request<{ data: Record<string, unknown> }>(
      `/api/v1/applications/${applicationId}/interviews`,
      { method: "POST", body: JSON.stringify(data) },
    );
  }

  // Companies
  async listCompanies(params?: { industry?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.industry) qs.set("industry", params.industry);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return this.request<PaginatedResponse<Record<string, unknown>>>(`/api/v1/companies${query}`);
  }

  async getCompany(id: string) {
    return this.request<{ data: Record<string, unknown> }>(`/api/v1/companies/${id}`);
  }

  async createCompany(data: Record<string, unknown>) {
    return this.request<{ data: Record<string, unknown> }>("/api/v1/companies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const client = new JobTrackerClient();
