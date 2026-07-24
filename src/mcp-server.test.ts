import { describe, it, expect } from "vitest";
import { server, SearchSchema, ListSchema, AddSchema, UpdateSchema } from "@/mcp-server.js";

describe("MCP Server Tests", () => {
  it("should initialize the McpServer instance", () => {
    expect(server).toBeDefined();
  });

  describe("Validation Schemas", () => {
    it("SearchSchema should validate valid input", () => {
      const parsed = SearchSchema.parse({ query: "Node", location: "Madrid", limit: 5 });
      expect(parsed.location).toBe("Madrid");
      expect(parsed.query).toBe("Node");
    });

    it("SearchSchema should throw on missing location", () => {
      expect(() => SearchSchema.parse({ query: "Node" })).toThrow();
    });

    it("ListSchema should validate valid input with defaults", () => {
      const parsed = ListSchema.parse({});
      expect(parsed.limit).toBe(20);
      expect(parsed.offset).toBe(0);
    });

    it("AddSchema should validate manual job inputs", () => {
      const parsed = AddSchema.parse({ title: "Backend", company: "Merkle" });
      expect(parsed.title).toBe("Backend");
      expect(parsed.company).toBe("Merkle");
      expect(parsed.source).toBe("MANUAL");
    });

    it("UpdateSchema should validate status updates", () => {
      const parsed = UpdateSchema.parse({ id: "job-1", status: "APPLIED", priority: "HIGH" });
      expect(parsed.id).toBe("job-1");
      expect(parsed.status).toBe("APPLIED");
      expect(parsed.priority).toBe("HIGH");
    });
  });
});
