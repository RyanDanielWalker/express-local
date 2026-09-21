import { useCallback, useEffect, useRef, useState } from 'react';
import { LINES } from './data/lines';
import { dailyDone, ensureDailyPick, finishTrip, isDue, isUnlocked, maxTier, type TripResult } from './engine/progression';
import { loadSave, persistSave } from './engine/save';
import type { SaveData, Tier } from './engine/types';
import { Header } from './components/Header';
import { LineMap } from './components/LineMap';
import { Intro } from './components/Intro';
import { PlayScreen, type RideStats } from './components/PlayScreen';
import { Quiz } from './components/Quiz';
import { Results } from './components/Results';
import { Derailed } from './components/Derailed';
import { Badges } from './components/Badges';
import { SaveTransfer } from './components/SaveTransfer';

type Screen =
  | { kind: 'intro' }
  | { kind: 'play'; tier: Tier; run: number }
  | { kind: 'quiz'; ride: RideStats }
  | { kind: 'result'; ride: RideStats; result: TripResult }
  | { kind: 'derailed' };

/** Open on whatever needs attention: a due review, then the next new line. */
function startingLine(save: SaveData): number {
  const due = LINES.findIndex(l => isDue(save.levels[l.id]));
  if (due > -1) return due;
  const fresh = LINES.findIndex((l, i) => isUnlocked(save, i) && !save.levels[l.id]?.cleared);
  return fresh > -1 ? fresh : 0;
}

export default function App() {
  const [save, setSave] = useState<SaveData>(() => {
    const s = loadSave();
    ensureDailyPick(s);
    return s;
  });
  const [current, setCurrent] = useState(() => startingLine(save));
  const [screen, setScreen] = useState<Screen>({ kind: 'intro' });
  const [picked, setPicked] = useState<Partial<Record<string, Tier>>>({});

  useEffect(() => persistSave(save), [save]);

  // Keep the stage in view when the screen changes (e.g. quiz after a long ride).
  const stageRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [screen.kind, current]);

  const line = LINES[current];
  const top = maxTier(save.levels[line.id]);
  const tier = Math.min(picked[line.id] ?? top, top) as Tier;
  const dailyIdx = dailyDone(save) ? null : (save.dailyPick?.idx ?? null);

  const board = (t: Tier = tier) => {
    setPicked(p => ({ ...p, [line.id]: t }));
    setScreen(s => ({ kind: 'play', tier: t, run: s.kind === 'play' ? s.run + 1 : Date.now() }));
  };
  const toIntro = () => setScreen({ kind: 'intro' });
  const select = (i: number) => {
    setCurrent(i);
    setScreen({ kind: 'intro' });
  };

  const onArrive = useCallback((ride: RideStats) => setScreen({ kind: 'quiz', ride }), []);
  const onDerail = useCallback(() => setScreen({ kind: 'derailed' }), []);

  function onQuizDone(ride: RideStats, quizOk: boolean) {
    const result = finishTrip(save, { lineIdx: current, quizOk, ...ride });
    setSave(result.save);
    setScreen({ kind: 'result', ride, result });
  }

  let stage;
  switch (screen.kind) {
    case 'intro':
      stage = (
        <Intro
          save={save}
          idx={current}
          tier={tier}
          isDaily={current === dailyIdx && isUnlocked(save, current)}
          onPickTier={t => setPicked(p => ({ ...p, [line.id]: t }))}
          onBoard={() => board()}
        />
      );
      break;
    case 'play':
      stage = (
        <PlayScreen
          key={screen.run}
          line={line}
          tier={screen.tier}
          firstTime={!save.levels[line.id]?.trips}
          onArrive={onArrive}
          onDerail={onDerail}
        />
      );
      break;
    case 'quiz':
      stage = <Quiz line={line} onDone={ok => onQuizDone(screen.ride, ok)} />;
      break;
    case 'result':
      stage = (
        <Results
          line={line}
          ride={screen.ride}
          result={screen.result}
          nextName={LINES[current + 1]?.name ?? null}
          onAgain={() => board(screen.ride.tier)}
          onNext={() => select(current + 1)}
          onTier={t => board(t)}
          onMap={toIntro}
        />
      );
      break;
    case 'derailed':
      stage = <Derailed line={line} onAgain={() => board()} onMap={toIntro} />;
      break;
  }

  return (
    <div className="wrap">
      <Header save={save} />
      <LineMap save={save} current={current} dailyIdx={dailyIdx} onSelect={select} />
      <main className="stage" ref={stageRef}>{stage}</main>
      <Badges save={save} />
      <SaveTransfer save={save} onImport={s => { ensureDailyPick(s); setSave(s); select(startingLine(s)); }} />
    </div>
  );
}
