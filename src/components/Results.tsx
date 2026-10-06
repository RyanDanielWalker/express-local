import { GUIDE } from '../data';
import { fmtTime, TIERS, type TripResult } from '../engine/progression';
import type { Line, Tier } from '../engine/types';
import { lineStyle } from './Bullet';
import { Rich } from './Rich';
import type { RideStats } from './PlayScreen';
import { BadgeCard } from './Badges';

interface Props {
  cram?: boolean;
  line: Line;
  ride: RideStats;
  result: TripResult;
  nextName: string | null;
  onAgain: () => void;
  onNext: () => void;
  onTier: (t: Tier) => void;
  onMap: () => void;
}

export function Results({ cram, line, ride, result, nextName, onAgain, onNext, onTier, onMap }: Props) {
  const { ledger, total, badges, beatPar, newBest, unlockedTier, reviewInDays } = result;
  const g = GUIDE[line.id] as typeof GUIDE[keyof typeof GUIDE] | undefined;
  const prompts = (g?.famous ?? g?.say ?? []) as string[];
  const tryIt = prompts.length ? prompts[(ride.rideXp + ride.mistakes) % prompts.length] : null;
  const perfect = ride.mistakes === 0;
  const missed = ride.answers.filter(a => !a.correct);

  return (
    <div className="result" style={lineStyle(line)}>
      <div className="eyebrow">Arrived · {line.topic} · {TIERS[ride.tier].name}</div>
      <h2>{perfect ? 'Perfect run' : 'Line cleared'}</h2>
      <p className="mono" style={{ margin: 0 }}>
        Time {fmtTime(ride.time)}
        {ride.tier === 3 && ` · par ${fmtTime(line.par)}${beatPar ? ' · beat it' : ''}`}
        {` · ${ride.mistakes} mistake${ride.mistakes === 1 ? '' : 's'}`}
        {newBest && <> · <b>new personal best</b></>}
      </p>
      <div className="ledger">
        {ledger.map(([k, v]) => (
          <div key={k} style={{ display: 'contents' }}>
            <span>{k}</span>
            <span className="xp">+{v}</span>
          </div>
        ))}
        <span className="t">Total</span>
        <span className="t xp">+{total}</span>
      </div>
      {badges.length > 0 && (
        <div>
          <div className="eyebrow">New badge{badges.length > 1 ? 's' : ''}</div>
          <div className="newbadges">{badges.map(b => <BadgeCard key={b.id} badge={b} earned />)}</div>
        </div>
      )}
      {unlockedTier && <div className="daily">{TIERS[unlockedTier].name} is now open on this line. {TIERS[unlockedTier].blurb}</div>}
      {missed.length > 0 && (
        <div>
          <div className="eyebrow">What you missed</div>
          <ol className="recap">
            {missed.map(({ question }, i) => (
              <li key={i}>
                <p className="rq"><Rich text={question.q} /></p>
                <p className="ra"><b>{question.a}</b></p>
                <p className="rw"><Rich text={question.why} /></p>
              </li>
            ))}
          </ol>
          <p className="hint" style={{ margin: 0 }}>These come back in your next cram drill until you get them twice in a row.</p>
        </div>
      )}
      {!cram && line.bigO && <div><span className="stamp">{line.bigO}</span></div>}
      {tryIt && <div className="hook"><b>{g?.famous ? 'Try it for real' : 'Say this out loud'}</b><Rich text={tryIt} /></div>}
      {cram ? (
        <p className="hint" style={{ margin: 0 }}>
          Cram drills do not change line progress or review dates. They keep your streak alive and show you what is shaky.
        </p>
      ) : (
        <p className="hint" style={{ margin: 0 }}>
          Next review in {reviewInDays} day{reviewInDays === 1 ? '' : 's'}. Come back when the map says <b>Review</b>. Riding it again right before you forget is what makes it stick.
        </p>
      )}
      <div className="row">
        {!cram && unlockedTier && <button className="btn big" onClick={() => onTier(unlockedTier)}>Ride {TIERS[unlockedTier].name}</button>}
        {nextName && !unlockedTier && !cram && <button className="btn big" onClick={onNext}>Next line: {nextName}</button>}
        <button className="btn ghost" onClick={onAgain}>Ride again</button>
        {nextName && unlockedTier && !cram && <button className="btn ghost" onClick={onNext}>Next line</button>}
        <button className="btn ghost" onClick={onMap}>Map</button>
      </div>
    </div>
  );
}
