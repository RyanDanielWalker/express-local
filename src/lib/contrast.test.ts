import { describe, expect, it } from "vitest";
import {
  contrast,
  isLarge,
  luminance,
  mix,
  needed,
  parseHex,
} from "./contrast";

describe("contrast math", () => {
  it("runs from 1 for the same color to 21 for black on white", () => {
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#5a636d", "#5a636d")).toBe(1);
  });

  it("matches known WCAG values", () => {
    // #777777 on white is the classic near miss for normal text.
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
    expect(contrast("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(luminance("#ffffff")).toBe(1);
    expect(luminance("#000000")).toBe(0);
  });

  it("mixes colors the way color-mix in srgb does", () => {
    expect(mix("#ffffff", 50, "#000000")).toBe("#808080");
    expect(mix("#ff0000", 100, "#0000ff")).toBe("#ff0000");
    expect(mix("#ff0000", 0, "#0000ff")).toBe("#0000ff");
  });

  it("asks 4.5 of normal text and 3 of large text", () => {
    expect(needed(false)).toBe(4.5);
    expect(needed(true)).toBe(3);
    expect(isLarge(24, 400)).toBe(true);
    expect(isLarge(19, 700)).toBe(true);
    expect(isLarge(18, 900)).toBe(false);
    expect(isLarge(20, 400)).toBe(false);
  });

  it("refuses a color it cannot read", () => {
    expect(() => parseHex("#fff")).toThrow();
    expect(() => parseHex("red")).toThrow();
  });
});
