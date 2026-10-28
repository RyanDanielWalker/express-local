import { useEffect, useRef, type CSSProperties } from "react";
import { LINES } from "../data";
import { DIVISIONS } from "../engine/questions";
import { isDue, isUnlocked, readinessOf } from "../engine/progression";
import type { Division, SaveData } from "../engine/types";
import { Bullet } from "./Bullet";

interface Props {
  save: SaveData;
  current: number;
  dailyIdx: number | null;
  onSelect: (idx: number) => void;
  /** Divisions showing their lines. The rest show only their header. */
  open: Division[];
  onToggle: (d: Division) => void;
}

/** The map, one row per division. A closed division shows its name and readiness. */
export function LineMap({
  save,
  current,
  dailyIdx,
  onSelect,
  open,
  onToggle,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cur = box.current?.querySelector<HTMLElement>(
      `[data-i="${current}"]`,
    );
    const row = cur?.closest<HTMLElement>(".mapbox");
    if (row && cur && row.scrollWidth > row.clientWidth)
      row.scrollLeft = cur.offsetLeft - (row.clientWidth - cur.offsetWidth) / 2;
  }, [current, open]);

  const groups = DIVISIONS.map((d) => ({
    division: d,
    lines: LINES.map((line, i) => ({ line, i })).filter(
      (x) => x.line.division === d.id,
    ),
  })).filter((g) => g.lines.length > 0);

  return (
    <div className="divisions" ref={box}>
      {groups.map(({ division, lines }) => {
        const cleared = lines.filter(
          (x) => save.levels[x.line.id]?.cleared,
        ).length;
        const ready = readinessOf(
          lines.map((x) => x.line),
          save,
        );
        const isOpen = open.includes(division.id);
        return (
          <section
            className="division"
            key={division.id}
            aria-label={`${division.name} lines`}
          >
            <h3 className="dhead">
              <button
                aria-expanded={isOpen}
                aria-controls={`map-${division.id}`}
                onClick={() => onToggle(division.id)}
              >
                <span className="dname">{division.name}</span>
                <span className="blurb">{division.blurb}</span>
                <span
                  className="xp"
                  title="How ready this division is right now"
                >
                  {ready}% ready · {cleared}/{lines.length}
                </span>
                <span className="meter ok" aria-hidden="true">
                  <i style={{ width: `${ready}%` }} />
                </span>
              </button>
            </h3>
            <nav className="mapbox" id={`map-${division.id}`} hidden={!isOpen}>
              <div
                className="map"
                style={{ "--n": lines.length } as CSSProperties}
              >
                {lines.map(({ line, i }) => {
                  const p = save.levels[line.id];
                  const locked = !isUnlocked(save, i);
                  const tier = p?.tier ?? 0;
                  return (
                    <button
                      key={line.id}
                      className={`stop ${locked ? "locked" : ""}`}
                      data-i={i}
                      aria-current={i === current}
                      aria-label={`${line.name}${locked ? " (locked)" : ""}, ${tier} of 3 tiers cleared`}
                      onClick={() => onSelect(i)}
                    >
                      <Bullet line={line} />
                      <span className="lbl">{line.short}</span>
                      <span className="sub">
                        {locked ? "Locked" : line.name}
                      </span>
                      <span className="pips" aria-hidden="true">
                        {[1, 2, 3].map((k) => (
                          <i key={k} className={tier >= k ? "on" : ""} />
                        ))}
                      </span>
                      {isDue(p) ? (
                        <span className="flag due">Review</span>
                      ) : i === dailyIdx ? (
                        <span className="flag daily">Daily</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </nav>
          </section>
        );
      })}
    </div>
  );
}
