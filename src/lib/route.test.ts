import { describe, expect, it } from "vitest";
import { LINES } from "../data";
import { parsePath, pathFor, screenRoute, type Route } from "./route";

describe("routes", () => {
  it("gives every line its own URL, and reads each one back", () => {
    const paths = new Set<string>();
    for (const l of LINES)
      for (const kind of ["line", "ride", "rehearse"] as const) {
        const route: Route = { kind, id: l.id };
        const path = pathFor(route);
        expect(parsePath(path), path).toEqual(route);
        paths.add(path);
      }
    expect(paths.size).toBe(LINES.length * 3);
  });

  it("names a line by its division, then its id", () => {
    expect(pathFor({ kind: "line", id: "life" })).toBe("/nest/life");
    expect(pathFor({ kind: "ride", id: "render" })).toBe("/react/render/ride");
    expect(pathFor({ kind: "home" })).toBe("/");
    expect(pathFor({ kind: "drill" })).toBe("/drill");
  });

  it("reads home and the drill, with or without a trailing slash", () => {
    expect(parsePath("/")).toEqual({ kind: "home" });
    expect(parsePath("")).toEqual({ kind: "home" });
    expect(parsePath("/drill/")).toEqual({ kind: "drill" });
    expect(parsePath("/nest/life/")).toEqual({ kind: "line", id: "life" });
  });

  it("finds no page at a path that names nothing", () => {
    for (const path of [
      "/nest",
      "/nest/nope",
      "/react/life", // a real line, in the wrong division
      "/nest/life/play",
      "/nest/life/ride/again",
      "/drill/nest",
    ])
      expect(parsePath(path), path).toBeNull();
  });
});

describe("the route for each screen", () => {
  it("keeps a bare / until a line is picked", () => {
    expect(screenRoute({ kind: "intro" }, "life", true)).toEqual({
      kind: "home",
    });
    expect(screenRoute({ kind: "intro" }, "life", false)).toEqual({
      kind: "line",
      id: "life",
    });
  });

  it("keeps a ride on one URL from the first question to the results", () => {
    for (const kind of ["play", "quiz", "result", "derailed"] as const)
      expect(screenRoute({ kind }, "life", false), kind).toEqual({
        kind: "ride",
        id: "life",
      });
  });

  it("puts a drill and a rehearsal on their own URLs, results included", () => {
    expect(screenRoute({ kind: "cram" }, "life", true)).toEqual({
      kind: "drill",
    });
    expect(
      screenRoute({ kind: "derailed", mode: "cram" }, "life", true),
    ).toEqual({ kind: "drill" });
    expect(screenRoute({ kind: "rehearse" }, "life", false)).toEqual({
      kind: "rehearse",
      id: "life",
    });
    expect(
      screenRoute({ kind: "result", mode: "rehearsal" }, "life", false),
    ).toEqual({ kind: "rehearse", id: "life" });
  });
});
