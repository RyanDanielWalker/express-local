import { CRAM_SIZE, DIVISIONS } from "../engine/questions";
import type { Division } from "../engine/types";

interface Props {
  divisions: Division[];
  onToggle: (d: Division) => void;
  onStart: () => void;
  poolSize: number;
  shakyCount: number;
}

/** Mixed drill across everything you have opened. Built for the morning of an interview. */
export function CramBand({
  divisions,
  onToggle,
  onStart,
  poolSize,
  shakyCount,
}: Props) {
  const all = divisions.length === 0;
  return (
    <section className="cram" aria-label="Cram drill">
      <div>
        <b>Cram drill</b>
        <p>
          {CRAM_SIZE} mixed questions from every line you have opened, 5 hearts,
          no tiers. {poolSize} in the pool
          {shakyCount > 0
            ? `, and up to half the drill comes from the ${shakyCount} you have missed before.`
            : "."}
        </p>
        <div className="chipbar">
          <button
            className={`dchip ${all ? "on" : ""}`}
            onClick={() => divisions.forEach((d) => onToggle(d))}
            aria-pressed={all}
          >
            Everything
          </button>
          {DIVISIONS.map((d) => (
            <button
              key={d.id}
              className={`dchip ${divisions.includes(d.id) ? "on" : ""}`}
              onClick={() => onToggle(d.id)}
              aria-pressed={divisions.includes(d.id)}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>
      <button className="btn" onClick={onStart} disabled={poolSize === 0}>
        Start drill
      </button>
    </section>
  );
}
