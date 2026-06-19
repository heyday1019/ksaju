import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const url = (q: string) => new NextRequest(`http://localhost/api/tarot-spread-reading?${q}`);

afterEach(() => vi.restoreAllMocks());

describe("GET /api/tarot-spread-reading", () => {
  it("400 when cardIds is not 3 numbers", async () => {
    const res = await GET(url("cardIds=1,2&dayMaster=%E8%BE%9B&locale=en"));
    expect(res.status).toBe(400);
  });

  it("400 on invalid dayMaster", async () => {
    const res = await GET(url("cardIds=0,1,2&dayMaster=X&locale=en"));
    expect(res.status).toBe(400);
  });

  it("returns the localized fallback shape when the LLM call fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const res = await GET(url("cardIds=0,1,2&dayMaster=%E8%BE%9B&locale=en"));
    expect(res.status).toBe(200);
    const json = await res.json();
    for (const k of ["past", "present", "future", "synthesis"]) {
      expect(typeof json[k]).toBe("string");
      expect(json[k].length).toBeGreaterThan(0);
    }
  });
});
