import { describe, expect, it } from "vitest";
import { LINES } from "../data";
import { DAY, dayKey } from "./progression";
import { qid } from "./questions";
import { emptyProgress, emptySave } from "./save";
import { nextLine, todayPlan } from "./today";
import type { Division, SaveData } from "./types";

const NOW = new Date("2026-09-21T15:00:00").getTime();
const TODAY = dayKey(NOW);

const first = (d: Division) => LINES.findIndex((l) => l.division === d);
const NEST = first("nest");
const REACT = first("react");

/** Clear a line, with its next review due at `due`. */
function clear(save: SaveData, idx: number, due = NOW + DAY): SaveData {
  return {
    ...save,
    levels: {
      ...save.levels,
      [LINES[idx].id]: { ...emptyProgress(), cleared: true, tier: 1, due },
    },
  };
}

/** A save whose Daily Ride today is the line at `idx`. */
const withDaily = (idx: number, save = emptySave()): SaveData => ({
  ...save,
  dailyPick: { day: TODAY, id: LINES[idx].id },
});

const kinds = (save: SaveData, current = 0) =>
  todayPlan(save, current, NOW).map((x) => x.kind);

describe("next line", () => {
  it("is the first line on a fresh save", () => {
    expect(nextLine(emptySave(), 0)).toBe(0);
  });

  it("stays in the division you are on", () => {
    expect(nextLine(emptySave(), REACT)).toBe(REACT);
    const save = clear(emptySave(), REACT);
    expect(nextLine(save, REACT)).toBe(REACT + 1);
  });

  it("skips a locked line and falls back to map order", () => {
    // NestJS's second line is locked until its first is cleared.
    expect(nextLine(emptySave(), NEST + 1)).toBe(NEST);
    let save = emptySave();
    LINES.forEach((l, i) => {
      if (l.division === "react") save = clear(save, i);
    });
    expect(nextLine(save, REACT)).toBe(0);
  });

  it("is null when every line is cleared", () => {
    let save = emptySave();
    LINES.forEach((_, i) => (save = clear(save, i)));
    expect(nextLine(save, 0)).toBeNull();
  });
});

describe("today", () => {
  it("suggests the Daily Ride and a new line on a fresh save", () => {
    expect(todayPlan(withDaily(REACT), 0, NOW)).toEqual([
      { kind: "daily", lineIdx: REACT },
      { kind: "next", lineIdx: 0 },
    ]);
  });

  it("puts a due review first and counts the rest", () => {
    let save = withDaily(REACT);
    save = clear(save, NEST, NOW - DAY);
    save = clear(save, 0, NOW - 1);
    save = clear(save, NEST + 1, NOW + DAY);
    expect(todayPlan(save, 0, NOW)[0]).toEqual({
      kind: "review",
      lineIdx: 0,
      more: 1,
    });
  });

  it("orders review, shaky, daily, then new", () => {
    let save = clear(withDaily(REACT), NEST, NOW - DAY);
    const line = LINES[REACT];
    const missed = { seen: 2, missed: 1, last: NOW };
    save = {
      ...save,
      questions: {
        [qid(line.id, line.questions![0])]: missed,
        [qid(line.id, line.questions![1])]: missed,
      },
    };
    expect(todayPlan(save, 0, NOW)).toEqual([
      { kind: "review", lineIdx: NEST, more: 0 },
      { kind: "shaky", count: 2 },
      { kind: "daily", lineIdx: REACT },
      { kind: "next", lineIdx: 0 },
    ]);
  });

  it("drops the Daily Ride once it is done today", () => {
    expect(kinds({ ...withDaily(REACT), daily: TODAY })).toEqual(["next"]);
    // Yesterday's ride does not count for today.
    expect(kinds({ ...withDaily(REACT), daily: dayKey(NOW - DAY) })).toEqual([
      "daily",
      "next",
    ]);
  });

  it("shows a line once, even when it is two things", () => {
    // The Daily Ride is due for review: it is a review, not a second item.
    const due = clear(withDaily(NEST), NEST, NOW - 1);
    expect(kinds(due)).toEqual(["review", "next"]);
    // The Daily Ride is also the next new line: it is the Daily Ride.
    expect(kinds(withDaily(0))).toEqual(["daily"]);
  });

  it("skips a Daily Ride on a line that is still locked", () => {
    expect(kinds(withDaily(NEST + 1))).toEqual(["next"]);
  });

  it("is empty when there is nothing to do", () => {
    let save = { ...withDaily(REACT), daily: TODAY };
    LINES.forEach((_, i) => (save = clear(save, i)));
    expect(todayPlan(save, 0, NOW)).toEqual([]);
  });
});
