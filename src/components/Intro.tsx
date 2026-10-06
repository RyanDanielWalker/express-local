import { LINES } from '../data';
import { DAY, fmtTime, isUnlocked, maxTier, TIERS } from '../engine/progression';
import type { SaveData, Tier } from '../engine/types';
import { Bullet, lineStyle } from './Bullet';
import { FieldGuide } from './FieldGuide';
import { Rich } from './Rich';

interface Props {
  save: SaveData;
  idx: number;
  tier: Tier;
  isDaily: boolean;
  onPickTier: (t: Tier) => void;
  onBoard: () => void;
}

export function Intro({ save, idx, tier, isDaily, onPickTier, onBoard }: Props) {
  const line = LINES[idx];
  const p = save.levels[line.id];
  const locked = !isUnlocked(save, idx);
  const top = maxTier(p);
  let status = 'New line';
  if (p?.cleared) {
    const d = Math.ceil((p.due - Date.now()) / DAY);
    status = d <= 0 ? 'Due for review today' : `Ridden ${p.trips}× · review in ${d} day${d === 1 ? '' : 's'}`;
  }

  return (
    <>
      <div className="intro" style={lineStyle(line)}>
        <Bullet line={line} size="lg" />
        <div className="body">
          <div>
            <div className="eyebrow">{line.topic} · {status}</div>
            <h2>{line.name}</h2>
          </div>
          <p><Rich text={line.pitch} /></p>
          {isDaily && <div className="daily">Today's Daily Ride. Clear it on any tier for +100 XP.</div>}
          <div>
            <div className="eyebrow">How to ride</div>
            <ul className="rules">{line.rules.map(r => <li key={r}><Rich text={r} /></li>)}</ul>
          </div>
          <div className="hook"><b>Remember it</b><Rich text={line.hook} /></div>
          {!locked && (
            <div className="tiers" role="group" aria-label="Difficulty">
              {([1, 2, 3] as Tier[]).map(t => {
                const open = t <= top;
                const best = p?.best[t];
                return (
                  <button key={t} className={`tier ${t === tier ? 'sel' : ''}`} disabled={!open} aria-pressed={t === tier} onClick={() => onPickTier(t)}>
                    <b>{TIERS[t].name}</b>
                    <span>{open ? TIERS[t].blurb : `Clear ${TIERS[(t - 1) as Tier].name} to unlock.`}</span>
                    {t === 3 && <em>Par {fmtTime(line.par)}</em>}
                    {best && <em>Best: {best.m} mistake{best.m === 1 ? '' : 's'}, {fmtTime(best.t)}</em>}
                  </button>
                );
              })}
            </div>
          )}
          <div className="row">
            {locked ? (
              <>
                <button className="btn big" disabled>Locked</button>
                <span className="hint">Clear {LINES[idx - 1].name} to open this line.</span>
              </>
            ) : (
              <>
                <button className="btn big" onClick={onBoard}>Board: {TIERS[tier].name}</button>
                <span className="hint">3 hearts per trip. A code check waits at the last stop.</span>
              </>
            )}
          </div>
        </div>
      </div>
      <FieldGuide line={line} />
    </>
  );
}
