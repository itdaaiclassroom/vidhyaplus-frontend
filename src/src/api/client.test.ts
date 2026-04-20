import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getApiBase } from "./client";

describe("API client", () => {
  describe("getApiBase", () => {
    it("is a function returning a string", () => {
      expect(typeof getApiBase).toBe("function");
      const base = getApiBase();
      expect(typeof base).toBe("string");
    });
  });

  describe("fetchAll", () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });
    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("throws when fetch returns 404", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not found"),
      }));
      const { fetchAll } = await import("./client");
      await expect(fetchAll()).rejects.toThrow();
    });

    it("returns parsed JSON when fetch returns 200", async () => {
      const mockData = { schools: [], classes: [] };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      }));
      const { fetchAll } = await import("./client");
      const result = await fetchAll();
      expect(result).toEqual(mockData);
    });
  });
});
