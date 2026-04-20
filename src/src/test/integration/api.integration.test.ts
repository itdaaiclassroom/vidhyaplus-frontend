/**
 * Integration tests: API client behavior with mocked fetch.
 * Run with: npm run test (vitest)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("API integration", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetchAll sends GET to /api/all", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ schools: [], classes: [], teachers: [] }),
    });
    vi.stubGlobal("fetch", fetchSpy);
    const { fetchAll } = await import("@/api/client");
    await fetchAll();
    expect(fetchSpy).toHaveBeenCalled();
    const [url] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/all");
  });

  it("fetchAll throws on 500", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    }));
    const { fetchAll } = await import("@/api/client");
    await expect(fetchAll()).rejects.toThrow();
  });
});
