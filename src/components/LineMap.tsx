import { useEffect, useRef, type CSSProperties } from 'react';
import { LINES } from '../data';
import { isDue, isUnlocked } from '../engine/progression';
import type { SaveData } from '../engine/types';
import { Bullet } from './Bullet';

interface Props {
  save: SaveData;
  current: number;
  dailyIdx: number | null;
  onSelect: (idx: number) => void;
}

export function LineMap({ save, current, dailyIdx, onSelect }: Props) {
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = box.current;
    const cur = el?.querySelector<HTMLElement>(`[data-i="${current}"]`);
    if (el && cur && el.scrollWidth > el.clientWidth) el.scrollLeft = cur.offsetLeft - (el.clientWidth - cur.offsetWidth) / 2;
  }, [current]);

  return (
    <nav className="mapbox" aria-label="Lines" ref={box}>
      <div className="map" style={{ '--n': LINES.length } as CSSProperties}>
        {LINES.map((line, i) => {
          const p = save.levels[line.id];
          const locked = !isUnlocked(save, i);
          const tier = p?.tier ?? 0;
          return (
            <button
              key={line.id}
              className={`stop ${locked ? 'locked' : ''}`}
              data-i={i}
              aria-current={i === current}
              aria-label={`${line.name}${locked ? ' (locked)' : ''}, ${tier} of 3 tiers cleared`}
              onClick={() => onSelect(i)}
            >
              <Bullet line={line} />
              <span className="lbl">{line.short}</span>
              <span className="sub">{locked ? 'Locked' : line.name}</span>
              <span className="pips" aria-hidden="true">
                {[1, 2, 3].map(k => <i key={k} className={tier >= k ? 'on' : ''} />)}
              </span>
              {isDue(p) ? <span className="flag due">Review</span> : i === dailyIdx ? <span className="flag daily">Daily</span> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
