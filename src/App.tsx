import { useCallback, useEffect, useRef, useState } from 'react';
import { LINES } from './data';
import { dailyDone, ensureDailyPick, finishCram, finishRehearsal, finishTrip, isDue, isUnlocked, maxTier, type TripResult } from './engine/progression';
import { cramPool, cramQuestions, CRAM_SIZE, recordAnswers, shakyQuestions } from './engine/questions';
import { loadSave, persistSave } from './engine/save';
import type { Division, Line, Question, SaveData, Tier } from './engine/types';
import { Header } from './components/Header';
import { LineMap } from './components/LineMap';
import { Intro } from './components/Intro';
import { PlayScreen, type RideStats } from './components/PlayScreen';
import { Quiz } from './components/Quiz';
import { Results } from './components/Results';
import { Derailed } from './components/Derailed';
import { Badges } from './components/Badges';
import { SaveTransfer } from './components/SaveTransfer';
import { CramBand } from './components/CramBand';
import { Rehearse } from './components/Rehearse';
import { GUIDE } from './data';

type Screen =
  | { kind: 'intro' }
  | { kind: 'cram'; line: Line; run: number }
  | { kind: 'rehearse'; run: number }
  | { kind: 'play'; tier: Tier; run: number }
  | { kind: 'quiz'; ride: RideStats }
  | { kind: 'result'; ride: RideStats; result: TripResult; mode?: 'line' | 'cram' | 'rehearsal' }
  | { kind: 'derailed'; ride?: RideStats };

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
  const [cramDivisions, setCramDivisions] = useState<Division[]>([]);

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

  /** Score the run, bank the new save, show the results screen. */
  const finish = useCallback(
    (ride: RideStats, quizOk: boolean) => {
      const withStats = recordAnswers(save, ride.answers.map(a => ({ lineId: LINES[current].id, question: a.question, correct: a.correct })));
      const result = finishTrip(withStats, { lineIdx: current, quizOk, ...ride });
      setSave(result.save);
      setScreen({ kind: 'result', ride, result });
    },
    [current, save],
  );

  // Algorithm lines end with a code check. Quiz and flow lines already asked their questions.
  const onArrive = useCallback(
    (ride: RideStats) => (LINES[current].quiz?.length ? setScreen({ kind: 'quiz', ride }) : finish(ride, false)),
    [current, finish],
  );
  const onDerail = useCallback(
    (ride: RideStats) => {
      // A run can end out of hearts and still teach: keep the misses.
      setSave(s => recordAnswers(s, ride.answers.map(a => ({ lineId: a.question.from ?? LINES[current].id, question: a.question, correct: a.correct }))));
      setScreen({ kind: 'derailed', ride });
    },
    [current],
  );

  /* ---------- cram drill: mixed questions, no line progress ---------- */
  const pool = cramPool(LINES, (_, i) => isUnlocked(save, i), cramDivisions);
  const shaky = shakyQuestions(save, LINES);
  const drillOwner = new Map<Question, string>();
  LINES.forEach(l => (l.questions ?? []).forEach(q => drillOwner.set(q, l.id)));

  const drillLine = (name: string, topic: string, questions: Question[]): Line => ({
    id: 'cram' as Line['id'], division: 'algos', kind: 'quiz', bullet: '\u2605', color: '--ink',
    short: 'Drill', name, topic, pitch: '', rules: [],
    hook: 'Mixed drill. Answer out loud before you click.', par: 0, questions, preset: true,
  });

  const startShaky = (lineId?: string) => {
    const questions = shakyQuestions(save, LINES, lineId).slice(0, 10).map(s => s.question);
    if (!questions.length) return;
    setScreen({ kind: 'cram', line: drillLine('Shaky Questions', `${questions.length} you have missed before`, questions), run: Date.now() });
  };

  const startRehearsal = () => setScreen({ kind: 'rehearse', run: Date.now() });
  const onRehearsed = (r: { nailed: string[]; shaky: string[] }) => {
    const result = finishRehearsal(save, { lineId: line.id, ...r });
    setSave(result.save);
    setScreen({ kind: 'result', ride: { tier, rideXp: 0, mistakes: r.shaky.length, time: 0, answers: [] }, result, mode: 'rehearsal' });
  };

  const startCram = () => {
    const questions = cramQuestions(pool, CRAM_SIZE, shaky.map(s => s.question));
    setScreen({ kind: 'cram', line: drillLine('Cram Drill', `${questions.length} mixed questions`, questions), run: Date.now() });
  };
  const onCramDone = (ride: RideStats, asked: number) => {
    const right = Math.max(0, asked - ride.mistakes);
    const withStats = recordAnswers(save, ride.answers.map(a => ({ lineId: a.question.from ?? drillOwner.get(a.question) ?? 'cram', question: a.question, correct: a.correct })));
    const result = finishCram(withStats, { right, asked, time: ride.time });
    setSave(result.save);
    setScreen({ kind: 'result', ride, result, mode: 'cram' });
  };

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
          shakyCount={shakyQuestions(save, LINES, line.id).length}
          onDrillShaky={() => startShaky(line.id)}
          rehearseCount={GUIDE[line.id]?.rehearse?.length ?? 0}
          lastRehearsed={save.rehearsal[line.id]?.last}
          onRehearse={startRehearsal}
        />
      );
      break;
    case 'cram':
      stage = (
        <PlayScreen
          key={screen.run}
          line={screen.line}
          tier={1}
          hearts={5}
          firstTime={false}
          onArrive={ride => onCramDone(ride, screen.line.questions?.length ?? CRAM_SIZE)}
          onDerail={onDerail}
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
    case 'rehearse':
      stage = <Rehearse key={screen.run} line={line} save={save} onDone={onRehearsed} onQuit={toIntro} />;
      break;
    case 'quiz':
      stage = <Quiz line={line} onDone={ok => finish(screen.ride, ok)} />;
      break;
    case 'result':
      stage = (
        <Results
          mode={screen.mode}
          line={screen.mode && screen.mode !== 'line' ? { ...line, bigO: undefined } : line}
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
      stage = (
        <Derailed
          line={line}
          missed={(screen.ride?.answers ?? []).filter(a => !a.correct).map(a => a.question)}
          onAgain={() => board()}
          onMap={toIntro}
        />
      );
      break;
  }

  return (
    <div className="wrap">
      <Header save={save} />
      <LineMap save={save} current={current} dailyIdx={dailyIdx} onSelect={select} />
      {screen.kind === 'intro' && (
        <CramBand
          divisions={cramDivisions}
          poolSize={pool.length}
          shakyCount={shaky.length}
          onShaky={() => startShaky()}
          onToggle={d => setCramDivisions(ds => (ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]))}
          onStart={startCram}
        />
      )}
      <main className="stage" ref={stageRef}>{stage}</main>
      <Badges save={save} />
      <SaveTransfer save={save} onImport={s => { ensureDailyPick(s); setSave(s); select(startingLine(s)); }} />
    </div>
  );
}
