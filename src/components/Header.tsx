import { rankFor, streakStatus } from '../engine/progression';
import type { SaveData } from '../engine/types';

export function Header({ save }: { save: SaveData }) {
  const r = rankFor(save.xp);
  return (
    <header className="top">
      <div className="brand">
        <h1>Express &amp; Local</h1>
        <p>You're the train. Ride each algorithm stop by stop until it's muscle memory.</p>
      </div>
      <div className="card" aria-live="polite">
        <div>
          <div className="rank">{r.name}</div>
          <div className="meter"><i style={{ width: `${r.pct}%` }} /></div>
          <small>
            <span className="xp">{save.xp.toLocaleString()} XP</span> · {r.next ? `${r.toNext} to ${r.next}` : 'Top rank'}
          </small>
          <small style={{ marginTop: 2 }}>{streakStatus(save)}</small>
        </div>
      </div>
    </header>
  );
}
