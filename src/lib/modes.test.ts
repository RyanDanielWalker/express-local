import { describe, expect, it } from "vitest";
import { isDoing } from "./modes";

describe("deciding vs doing", () => {
  it("gives the page to a ride, a drill, rehearsal and the code check", () => {
    for (const kind of ["play", "cram", "rehearse", "quiz"] as const)
      expect(isDoing(kind), kind).toBe(true);
  });

  it("shows the map again wherever the next move is a choice", () => {
    for (const kind of ["intro", "result", "derailed"] as const)
      expect(isDoing(kind), kind).toBe(false);
  });
});
