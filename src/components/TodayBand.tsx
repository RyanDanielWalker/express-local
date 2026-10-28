import { LINES } from "../data";
import { SHAKY_DRILL } from "../engine/questions";
import type { TodayItem } from "../engine/today";
import { plural } from "../lib/plural";
import { Bullet } from "./Bullet";

interface Props {
  items: TodayItem[];
  /** Open a line's intro screen. */
  onLine: (idx: number) => void;
  onShaky: () => void;
}

/** What to do right now, most urgent first. The first one gets the solid button. */
export function TodayBand({ items, onLine, onShaky }: Props) {
  return (
    <section className="today" aria-label="Today">
      <b>Today</b>
      {items.length === 0 ? (
        <p>
          Nothing due and nothing shaky. Pick any line below, or run a cram
          drill.
        </p>
      ) : (
        <ol>
          {items.map((item, n) => {
            const { label, title, detail, action, go, line } = describe(item);
            return (
              <li key={item.kind}>
                {line && <Bullet line={line} />}
                <div>
                  <small>{label}</small>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </div>
                <button
                  className={n === 0 ? "btn" : "btn ghost"}
                  onClick={go === "shaky" ? onShaky : () => onLine(go)}
                >
                  {action}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/** The copy for one item, and where its button goes. */
function describe(item: TodayItem) {
  if (item.kind === "shaky") {
    const drill = Math.min(item.count, SHAKY_DRILL);
    return {
      label: "Shaky questions",
      title: plural(item.count, "question"),
      detail:
        item.count > drill
          ? `You have missed these before. A drill asks the ${drill} you miss most.`
          : "You have missed these before. A right answer cancels one miss.",
      action: `Drill ${drill} shaky`,
      go: "shaky" as const,
    };
  }
  const line = LINES[item.lineIdx];
  const go = item.lineIdx;
  switch (item.kind) {
    case "review":
      return {
        label: "Review due",
        title: line.name,
        detail:
          "A review on time keeps it from fading." +
          (item.more
            ? ` ${plural(item.more, "more line")} due after this one.`
            : ""),
        action: `Review ${line.name}`,
        go,
        line,
      };
    case "daily":
      return {
        label: "Daily Ride",
        title: line.name,
        detail: "Today's pick. Clear it for 100 bonus XP.",
        action: `Ride ${line.name}`,
        go,
        line,
      };
    case "next":
      return {
        label: "Next new line",
        title: line.name,
        detail: `${line.topic}.`,
        action: `Start ${line.name}`,
        go,
        line,
      };
  }
}
