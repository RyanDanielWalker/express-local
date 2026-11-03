import { describe, expect, it } from "vitest";
import { guessMatches, sameType } from "./predict";
import type { PredictQuestion } from "./types";

describe("a predict-first guess", () => {
  it("matches the answer whatever the spacing", () => {
    expect(sameType("string[]", "string[]")).toBe(true);
    expect(sameType("  string | number  ", "string | number")).toBe(true);
    expect(sameType("string|number", "string | number")).toBe(true);
    expect(sameType("{a:string;b:number}", "{ a: string; b: number }")).toBe(
      true,
    );
    expect(sameType("Promise< User[] >", "Promise<User[]>")).toBe(true);
    expect(sameType("readonly  string[]", "readonly string[]")).toBe(true);
    expect(sameType("(x:number)=>string", "(x: number) => string")).toBe(true);
  });

  it("matches a union written in any order", () => {
    expect(sameType("number | string", "string | number")).toBe(true);
    expect(
      sameType("undefined | number | string", "string | number | undefined"),
    ).toBe(true);
    expect(sameType('"b" | "a"', '"a" | "b"')).toBe(true);
    expect(sameType("number[] | string", "string | number[]")).toBe(true);
    // `&` binds tighter than `|`, so each side of the `|` is one member.
    expect(sameType("C | A & B", "A & B | C")).toBe(true);
    // TypeScript allows a leading `|`, and it changes nothing.
    expect(sameType("| 'a' | 'b'", "'a' | 'b'")).toBe(true);
  });

  // The rule can miss a right answer (the player marks it), but it must never
  // accept a wrong one. Every pair here is two different types, or a guess
  // that is not the same text.
  it("does not match a near miss", () => {
    const misses: [string, string][] = [
      ["string", "string[]"],
      ["String", "string"],
      ["string & number", "string | number"],
      ["string | number[]", "(string | number)[]"],
      ["string[] | number[]", "(string | number)[]"],
      ["string[]", "readonly string[]"],
      ["readonlystring[]", "readonly string[]"],
      ["string | number", "string | number | undefined"],
      ["string | number | undefined", "string | number"],
      ['"a" | "a" | "b"', '"a" | "b"'],
      ['"ab"', '"a b"'],
      ['"b|a"', '"a|b"'],
      ["{ a: string }", "{ a?: string }"],
      ["{ b: number; a: string }", "{ a: string; b: number }"],
      ["Array<number>", "Array<string>"],
      ["Promise<User>", "Promise<User[]>"],
      ["1 | 'a'", "string | number"],
      ["unknown", "never"],
      ["", "string"],
      ["   ", "string"],
      ["string | | number", "string | number"],
      ["string |", "string"],
    ];
    for (const [guess, answer] of misses)
      expect(sameType(guess, answer), `${guess} vs ${answer}`).toBe(false);
  });

  // In these, the `|` belongs to something bigger, so swapping members
  // around it could change the type. The rule compares them as written. That
  // misses a few right answers, like `() => B | A`, and the player marks those.
  it("leaves a union alone when moving it would change the type", () => {
    // `B | () => A` is a union with a function in it, not a function.
    expect(sameType("B | () => A", "() => A | B")).toBe(false);
    expect(sameType("() => B | A", "() => A | B")).toBe(false);
    expect(sameType("C | T extends U ? A : B", "T extends U ? A : B | C")).toBe(
      false,
    );
    expect(sameType("number | x is string", "x is string | number")).toBe(
      false,
    );
    // Written exactly, they still match.
    expect(sameType("() => A | B", "()=>A|B")).toBe(true);
  });

  it("checks a question's guess by the kind of answer it has", () => {
    const q: PredictQuestion = {
      t: 1,
      predict: "type",
      q: "What is the type of `x`?",
      code: "const x = first([1, 'a']);",
      a: "string | number | undefined",
      why: "because",
    };
    expect(guessMatches(q, "number | string | undefined")).toBe(true);
    expect(guessMatches(q, "number | undefined")).toBe(false);
  });
});
