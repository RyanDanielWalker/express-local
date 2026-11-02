import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS, headersFile } from "./securityHeaders";

describe("security headers", () => {
  it("writes one rule for every path, with each header indented under it", () => {
    expect(headersFile({ "X-A": "1", "X-B": "two words" })).toBe(
      "/*\n  X-A: 1\n  X-B: two words\n",
    );
  });

  it("keeps every line inside Cloudflare's 2,000 character limit", () => {
    for (const line of headersFile(SECURITY_HEADERS).split("\n")) {
      expect(line.length).toBeLessThanOrEqual(2000);
    }
  });

  it("allows no inline script, no eval and no other site", () => {
    const csp = SECURITY_HEADERS["Content-Security-Policy"];
    expect(csp).not.toMatch(/unsafe-|https?:|\*|data:/);
    expect(csp).toMatch(/(^|; )script-src 'self'(;|$)/);
    expect(csp).toMatch(/(^|; )frame-ancestors 'none'(;|$)/);
  });
});
