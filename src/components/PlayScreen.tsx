import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { GUIDE } from '../data';
import { GAMES } from '../games';
import { QuizGame } from '../games/QuizGame';
import { FlowGame } from '../games/FlowGame';
import type { GameApi, Tone } from '../games/types';
import { fmtTime, TIERS } from '../engine/progression';
import type { AlgoLineId, Line, Tier } from '../engine/types';
import { useTimers } from '../hooks/useTimers';
import { Bullet, lineStyle } from './Bullet';
import { Words } from './FieldGuide';

export interface RideStats {
  tier: Tier;
  rideXp: number;
  mistakes: number;
  time: number;
}

interface Props {
  line: Line;
  tier: Tier;
  /** Hearts for this run. Lines get 3, the cram drill gets 5. */
  hearts?: number;
  firstTime: boolean;
  onArrive: (stats: RideStats) => void;
  onDerail: () => void;
}

const DEFAULT_HEARTS = 3;

export function PlayScreen({ line, tier, hearts: maxHearts = DEFAULT_HEARTS, firstTime, onArrive, onDerail }: Props) {
  const later = useTimers();
  const [status, setStatus] = useState<{ msg: ReactNode; tone: Tone }>({ msg: null, tone: '' });
  const [hearts, setHearts] = useState(maxHearts);
  const [xp, setXp] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const run = useRef({ over: false, xp: 0, mistakes: 0, hearts: maxHearts, t0: Date.now() });

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!run.current.over) setElapsed((Date.now() - run.current.t0) / 1000);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Stable for the whole ride, so games can safely list it as an effect dependency.
  const api = useMemo<GameApi>(() => {
    const r = run.current;
    return {
      tier,
      assist: tier < 3,
      get over() {
        return r.over;
      },
      say: (msg, tone = '') => setStatus({ msg, tone }),
      correct(points = 10, msg) {
        r.xp += points;
        setXp(r.xp);
        if (msg) setStatus({ msg, tone: 'good' });
      },
      wrong(msg) {
        if (r.over) return;
        r.mistakes++;
        r.hearts--;
        setHearts(r.hearts);
        setStatus({ msg, tone: 'bad' });
        if (r.hearts <= 0) {
          r.over = true;
          later(onDerail, 1600);
        }
      },
      finish() {
        if (r.over) return;
        r.over = true;
        const time = (Date.now() - r.t0) / 1000;
        setElapsed(time);
        later(() => onArrive({ tier, rideXp: r.xp, mistakes: r.mistakes, time }), 2000);
      },
    };
  }, [tier, later, onArrive, onDerail]);

  const Game = line.kind === 'quiz' ? QuizGame : line.kind === 'flow' ? FlowGame : GAMES[line.id as AlgoLineId];
  const g = GUIDE[line.id] as typeof GUIDE[keyof typeof GUIDE] | undefined;

  return (
    <div style={lineStyle(line)}>
      <div className="play-head">
        <div className="l">
          <Bullet line={line} size="sm" />
          <h2>{line.name}</h2>
          {!line.preset && <span className="tchip">{TIERS[tier].name}</span>}
        </div>
        <div className="row">
          <span className="clock" aria-label="Elapsed time">{fmtTime(elapsed)}</span>
          {tier === 3 && !line.preset && <span className="hint" style={{ margin: 0 }}>par {fmtTime(line.par)}</span>}
          <span className="xp">+{xp} XP</span>
          <div className="hearts" aria-label={`${hearts} of ${maxHearts} hearts left`}>
            {Array.from({ length: maxHearts }, (_, i) => <span key={i} className={i < hearts ? '' : 'gone'}>♥</span>)}
          </div>
        </div>
      </div>
      {g && (
        <details className="explain" open={firstTime}>
          <summary>What's going on here?</summary>
          <p>{g.plain}</p>
          <Words words={g.words} />
        </details>
      )}
      <div className={`status ${status.tone}`} aria-live="polite">{status.msg}</div>
      <div className="play">
        <Game api={api} line={line} />
      </div>
    </div>
  );
}
