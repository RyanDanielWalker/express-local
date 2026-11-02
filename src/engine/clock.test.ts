import { describe, expect, it } from "vitest";
import { clockSeconds, holdClock, releaseClock, startClock } from "./clock";

const S = 1000;

describe("ride clock", () => {
  it("counts while nothing holds it", () => {
    const c = startClock(0);
    expect(clockSeconds(c, 42 * S)).toBe(42);
  });

  it("skips the time spent on another tab", () => {
    const c = startClock(0);
    holdClock(c, "hidden", 10 * S);
    expect(clockSeconds(c, 70 * S)).toBe(10);
    releaseClock(c, "hidden", 70 * S);
    expect(clockSeconds(c, 75 * S)).toBe(15);
  });

  it("stays paused for reading after you come back to the tab", () => {
    const c = startClock(0);
    holdClock(c, "reading", 10 * S);
    holdClock(c, "hidden", 20 * S);
    releaseClock(c, "hidden", 80 * S);
    expect(clockSeconds(c, 90 * S)).toBe(10);
    releaseClock(c, "reading", 100 * S);
    expect(clockSeconds(c, 105 * S)).toBe(15);
  });

  it("stays paused for a hidden tab after reading ends", () => {
    const c = startClock(0);
    holdClock(c, "hidden", 10 * S);
    holdClock(c, "reading", 20 * S);
    releaseClock(c, "reading", 30 * S);
    expect(clockSeconds(c, 40 * S)).toBe(10);
    releaseClock(c, "hidden", 50 * S);
    expect(clockSeconds(c, 55 * S)).toBe(15);
  });

  it("ignores a release it never held, and a hold it already has", () => {
    const c = startClock(0);
    releaseClock(c, "hidden", 10 * S);
    expect(clockSeconds(c, 20 * S)).toBe(20);
    holdClock(c, "reading", 20 * S);
    holdClock(c, "reading", 30 * S);
    releaseClock(c, "reading", 40 * S);
    expect(clockSeconds(c, 40 * S)).toBe(20);
  });
});
