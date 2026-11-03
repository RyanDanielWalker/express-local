import type { PredictQuestion } from "./types";

/**
 * Whether a typed guess counts as the proven answer by itself.
 *
 * A match counts as right with no further step. Anything else goes to the
 * player, who sees both and says whether they had it ([ADR 0024]). So this
 * may miss a right answer written another way, and the player marks it. What
 * it must never do is accept a wrong answer.
 *
 * [ADR 0024]: ../../docs/adr/0024-how-a-predict-first-guess-is-checked.md
 */
export function guessMatches(
  question: PredictQuestion,
  guess: string,
): boolean {
  switch (question.predict) {
    case "type":
      return sameType(guess, question.a);
  }
}

/**
 * Two ways of writing a type that are the same text, give or take spacing
 * and the order of a union's members: `string|number` matches
 * `number | string`. Case, quotes and brackets all count, so `String` does
 * not match `string`, and `(string | number)[]` does not match
 * `string | number[]`.
 */
export function sameType(guess: string, answer: string): boolean {
  const g = members(tokens(guess));
  const a = members(tokens(answer));
  if (!g.length || g.length !== a.length) return false;
  const sorted = (xs: string[]) => [...xs].sort();
  const [gs, as] = [sorted(g), sorted(a)];
  return gs.every((m, i) => m === as[i]);
}

/**
 * Split a type into words, string literals and single symbols, dropping the
 * spaces between them. `=>` stays one token, so its `>` is never read as a
 * closing bracket. An unclosed quote takes the rest of the text.
 */
function tokens(text: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) {
      i++;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < text.length && text[j] !== c) j += text[j] === "\\" ? 2 : 1;
      out.push(text.slice(i, j + 1));
      i = j + 1;
    } else if (/[\w$]/.test(c)) {
      let j = i;
      while (j < text.length && /[\w$]/.test(text[j])) j++;
      out.push(text.slice(i, j));
      i = j;
    } else if (text.startsWith("=>", i)) {
      out.push("=>");
      i += 2;
    } else {
      out.push(c);
      i++;
    }
  }
  return out;
}

/**
 * Words that change how a top-level `|` reads. In `() => A | B` the union is
 * the return type, and in `T extends U ? A | B : C` it is one branch, so
 * moving its members around would change the type. A type with any of these
 * outside brackets is compared as written.
 */
const GREEDY = new Set(["=>", "?", ":", "is", "extends", "asserts", "infer"]);
const OPEN = new Set(["(", "[", "{", "<"]);
const CLOSE = new Set([")", "]", "}", ">"]);

/**
 * The members of a top-level union, each as text with no spaces except
 * between two words (`readonly string[]`). A type that is not a union, or
 * one that is not safe to reorder, comes back as one member.
 */
function members(toks: string[]): string[] {
  const join = (ts: string[]) =>
    ts.reduce(
      (s, t, k) =>
        k > 0 && /^[\w$]/.test(t) && /[\w$]$/.test(ts[k - 1])
          ? `${s} ${t}`
          : s + t,
      "",
    );
  if (!toks.length) return [];
  let depth = 0;
  let greedy = false;
  const parts: string[][] = [[]];
  for (const t of toks) {
    if (OPEN.has(t)) depth++;
    if (CLOSE.has(t)) depth--;
    if (depth === 0 && GREEDY.has(t)) greedy = true;
    if (depth === 0 && t === "|") parts.push([]);
    else parts[parts.length - 1].push(t);
  }
  if (greedy || depth !== 0) return [join(toks)];
  // A leading `|` is allowed in TypeScript and changes nothing.
  if (parts.length > 1 && parts[0].length === 0) parts.shift();
  // An empty member (`string | | number`) is not a type, so it cannot match.
  if (parts.some((p) => p.length === 0)) return [join(toks) + "|"];
  return parts.map(join);
}
