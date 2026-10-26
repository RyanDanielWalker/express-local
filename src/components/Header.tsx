import { rankFor, readinessReport, streakStatus } from "../engine/progression";
import { DIVISIONS } from "../engine/questions";
import type { SaveData } from "../engine/types";

/** Plain words for a readiness number, so it reads as a verdict and not a score. */
function readAs(pct: number): string {
  if (pct >= 85) return "Could walk into it cold.";
  if (pct >= 65) return "Solid. Keep the reviews up.";
  if (pct >= 40) return "Getting there. Reviews are what move this.";
  if (pct > 0) return "Early. Most of the map is still cold.";
  return "Nothing locked in yet. Clear a line.";
}

export function Header({ save }: { save: SaveData }) {
  const r = rankFor(save.xp);
  const ready = readinessReport(save);
  return (
    <header className="top">
      <div className="brand">
        <h1>Express &amp; Local</h1>
        <p>
          Learn it by doing it. Ride each line until it's muscle memory, then
          keep it there.
        </p>
      </div>
      <div className="card" aria-live="polite">
        <div>
          <div className="ready">
            <b>{ready.all}</b>
            <span>
              <i>Ready</i>
              {readAs(ready.all)}
            </span>
          </div>
          <div className="meter ok">
            <i style={{ width: `${ready.all}%` }} />
          </div>
          <div className="splits">
            {DIVISIONS.map((d) => (
              <span key={d.id}>
                <b>{d.name}</b> {ready[d.id] ?? 0}
              </span>
            ))}
          </div>
          <div className="rank">{r.name}</div>
          <small>
            <span className="xp">{save.xp.toLocaleString()} XP</span> ·{" "}
            {r.next ? `${r.toNext.toLocaleString()} to ${r.next}` : "Top rank"}
          </small>
          <small style={{ marginTop: 2 }}>{streakStatus(save)}</small>
        </div>
      </div>
    </header>
  );
}
