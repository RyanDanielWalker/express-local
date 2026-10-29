import { useCallback, useEffect, useRef, useState } from "react";
import { LINES } from "./data";
import {
  dailyDone,
  dailyIndex,
  ensureDailyPick,
  finishCram,
  finishDerail,
  finishRehearsal,
  finishTrip,
  isDue,
  isUnlocked,
  maxTier,
  type TripResult,
} from "./engine/progression";
import {
  cramPool,
  cramQuestions,
  CRAM_SIZE,
  heartsFor,
  ownerOf,
  recordAnswers,
  shakyQuestions,
  SHAKY_DRILL,
} from "./engine/questions";
import { loadSave, persistSave } from "./engine/save";
import { todayPlan } from "./engine/today";
import type { Division, Line, Question, SaveData, Tier } from "./engine/types";
import { Header } from "./components/Header";
import { LineMap } from "./components/LineMap";
import { Intro } from "./components/Intro";
import { PlayScreen, type RideStats } from "./components/PlayScreen";
import { Quiz } from "./components/Quiz";
import { Results } from "./components/Results";
import { Derailed } from "./components/Derailed";
import { Badges } from "./components/Badges";
import { SaveTransfer } from "./components/SaveTransfer";
import { CramBand } from "./components/CramBand";
import { TodayBand } from "./components/TodayBand";
import { Rehearse } from "./components/Rehearse";
import { GUIDE } from "./data";
import { isDoing } from "./lib/modes";
import { parsePath, pathFor, screenRoute } from "./lib/route";
import { currentPath, useUrl } from "./hooks/useUrl";

/** Which drill: a cram drill, or the shaky questions (one line's, or all). */
type DrillPick = { kind: "cram" } | { kind: "shaky"; lineId?: string };
/**
 * A drill on screen: which one it is, so its ending can start it again, and
 * its questions dressed as a line for the play screen.
 */
type Drill = { pick: DrillPick; line: Line };

type Screen =
  | { kind: "intro" }
  | { kind: "cram"; drill: Drill; run: number }
  | { kind: "rehearse"; run: number }
  | { kind: "play"; tier: Tier; run: number }
  | { kind: "quiz"; ride: RideStats }
  | {
      kind: "result";
      ride: RideStats;
      result: TripResult;
      mode?: "line" | "cram" | "rehearsal";
      drill?: Drill;
    }
  | {
      kind: "derailed";
      ride?: RideStats;
      cost: number;
      mode?: "cram";
      drill?: Drill;
    };

const indexOf = (id: string) => LINES.findIndex((l) => l.id === id);

/** Open on whatever needs attention: a due review, then the next new line. */
function startingLine(save: SaveData): number {
  const due = LINES.findIndex((l) => isDue(save.levels[l.id]));
  if (due > -1) return due;
  const fresh = LINES.findIndex(
    (l, i) => isUnlocked(save, i) && !save.levels[l.id]?.cleared,
  );
  return fresh > -1 ? fresh : 0;
}

export default function App() {
  const [save, setSave] = useState<SaveData>(() => {
    const s = loadSave();
    ensureDailyPick(s);
    return s;
  });
  // The URL opened says which line to show. A ride or rehearsal URL shows
  // its line, since what was on screen did not survive the reload.
  const [opened] = useState(() => parsePath(currentPath()));
  const [current, setCurrent] = useState(() => {
    const i = opened && "id" in opened ? indexOf(opened.id) : -1;
    return i > -1 ? i : startingLine(save);
  });
  // True until the player picks a line, so the bare / stays bare.
  const [home, setHome] = useState(!opened || !("id" in opened));
  const [screen, setScreen] = useState<Screen>({ kind: "intro" });
  const [picked, setPicked] = useState<Partial<Record<string, Tier>>>({});
  const [cramDivisions, setCramDivisions] = useState<Division[]>([]);
  // Divisions start closed, except the one you are on. Kept here, not in the
  // map, so it survives the map hiding during a ride.
  const [openDivisions, setOpenDivisions] = useState<Division[]>(() => [
    LINES[current].division,
  ]);

  useEffect(() => persistSave(save), [save]);

  // Riding collapses the map, cram band, badges and save box. See lib/modes.ts.
  const doing = isDoing(screen.kind);

  // Keep the stage in view when the screen changes (e.g. quiz after a long ride).
  // Boarding from low on the map would otherwise land at the ride's bottom,
  // since the page shrinks under the scroll position: start a ride at the top.
  const stageRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (doing) window.scrollTo({ top: 0 });
    else if (el && el.getBoundingClientRect().top < 0)
      el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [screen.kind, current, doing]);

  const line = LINES[current];
  const top = maxTier(save.levels[line.id]);
  const tier = Math.min(picked[line.id] ?? top, top) as Tier;
  const dailyIdx = dailyDone(save) ? null : dailyIndex(save);

  const board = (t: Tier = tier) => {
    // The intro disables Board on a locked line, but a line opened by URL is
    // selected whether it is open or not. Nothing else may ride it either.
    if (!isUnlocked(save, current)) return;
    setPicked((p) => ({ ...p, [line.id]: t }));
    setScreen((s) => ({
      kind: "play",
      tier: t,
      run: s.kind === "play" ? s.run + 1 : Date.now(),
    }));
  };
  const toIntro = () => setScreen({ kind: "intro" });
  const select = (i: number) => {
    setCurrent(i);
    setHome(false);
    setScreen({ kind: "intro" });
    const d = LINES[i].division;
    setOpenDivisions((ds) => (ds.includes(d) ? ds : [...ds, d]));
  };

  /** Score the run, bank the new save, show the results screen. */
  const finish = useCallback(
    (ride: RideStats, quizOk: boolean) => {
      const withStats = recordAnswers(
        save,
        ride.answers.map((a) => ({
          lineId: LINES[current].id,
          question: a.question,
          correct: a.correct,
        })),
      );
      const result = finishTrip(withStats, {
        lineIdx: current,
        quizOk,
        ...ride,
      });
      setSave(result.save);
      setScreen({ kind: "result", ride, result });
    },
    [current, save],
  );

  // Algorithm lines end with a code check. Quiz and flow lines already asked their questions.
  const onArrive = useCallback(
    (ride: RideStats) =>
      LINES[current].quiz?.length
        ? setScreen({ kind: "quiz", ride })
        : finish(ride, false),
    [current, finish],
  );
  const onDerail = useCallback(
    (ride: RideStats, drill?: Drill) => {
      // A run can end out of hearts and still teach: keep the misses, each
      // under the line it came from, so a drill's misses show up as shaky.
      const withStats = recordAnswers(
        save,
        ride.answers.map((a) => ({
          lineId: ownerOf(a.question, LINES) ?? LINES[current].id,
          question: a.question,
          correct: a.correct,
        })),
      );
      const { save: next, cost } = finishDerail(withStats, { drill: !!drill });
      setSave(next);
      setScreen({
        kind: "derailed",
        ride,
        cost,
        mode: drill ? "cram" : undefined,
        drill,
      });
    },
    [current, save],
  );

  /* ---------- cram drill: mixed questions, no line progress ---------- */
  const pool = cramPool(LINES, (_, i) => isUnlocked(save, i), cramDivisions);
  const shaky = shakyQuestions(save, LINES);

  const drillLine = (
    name: string,
    topic: string,
    questions: Question[],
  ): Line => ({
    id: "cram" as Line["id"],
    division: "algos",
    kind: "quiz",
    bullet: "\u2605",
    color: "--ink",
    short: "Drill",
    name,
    topic,
    pitch: "",
    rules: [],
    hook: "Mixed drill. Answer out loud before you click.",
    par: 0,
    questions,
    preset: true,
  });

  const drillQuestions = (pick: DrillPick) =>
    pick.kind === "cram"
      ? cramQuestions(
          pool,
          CRAM_SIZE,
          shaky.map((s) => s.question),
        )
      : shakyQuestions(save, LINES, pick.lineId)
          .slice(0, SHAKY_DRILL)
          .map((s) => s.question);
  /** False once a shaky drill has nothing left to ask. */
  const canDrill = (pick: DrillPick) =>
    pick.kind === "cram"
      ? pool.length > 0
      : shakyQuestions(save, LINES, pick.lineId).length > 0;

  const startDrill = (pick: DrillPick) => {
    const questions = drillQuestions(pick);
    if (!questions.length) return;
    const line =
      pick.kind === "cram"
        ? drillLine(
            "Cram Drill",
            `${questions.length} mixed questions`,
            questions,
          )
        : drillLine(
            "Shaky Questions",
            `${questions.length} you have missed before`,
            questions,
          );
    setScreen({ kind: "cram", drill: { pick, line }, run: Date.now() });
  };

  const startRehearsal = () => setScreen({ kind: "rehearse", run: Date.now() });
  const onRehearsed = (r: { nailed: string[]; shaky: string[] }) => {
    const result = finishRehearsal(save, { lineId: line.id, ...r });
    setSave(result.save);
    setScreen({
      kind: "result",
      ride: { tier, rideXp: 0, mistakes: r.shaky.length, time: 0, answers: [] },
      result,
      mode: "rehearsal",
    });
  };

  const onCramDone = (ride: RideStats, drill: Drill) => {
    const asked = drill.line.questions?.length ?? CRAM_SIZE;
    const right = Math.max(0, asked - ride.mistakes);
    const withStats = recordAnswers(
      save,
      ride.answers.map((a) => ({
        lineId: ownerOf(a.question, LINES) ?? "cram",
        question: a.question,
        correct: a.correct,
      })),
    );
    const result = finishCram(withStats, { right, asked, time: ride.time });
    setSave(result.save);
    setScreen({ kind: "result", ride, result, mode: "cram", drill });
  };

  // Back and Forward land on a line's intro, or on the map with the same line
  // still picked. A ride or drill left behind in history is gone, so its URL
  // shows the page it started from.
  const onPop = (path: string) => {
    const route = parsePath(path);
    const i = route && "id" in route ? indexOf(route.id) : -1;
    if (i > -1) select(i);
    else {
      if (route?.kind !== "drill") setHome(true);
      setScreen({ kind: "intro" });
    }
  };
  const route = screenRoute(screen, line.id, home);
  const where =
    route.kind === "drill" ? "Drill" : "id" in route ? line.name : "";
  const title = where ? `${where} · Express & Local` : "Express & Local";
  useUrl(pathFor(route), title, onPop);

  let stage;
  switch (screen.kind) {
    case "intro":
      stage = (
        <Intro
          save={save}
          idx={current}
          tier={tier}
          isDaily={current === dailyIdx && isUnlocked(save, current)}
          onPickTier={(t) => setPicked((p) => ({ ...p, [line.id]: t }))}
          onBoard={() => board()}
          shakyCount={shakyQuestions(save, LINES, line.id).length}
          onDrillShaky={() => startDrill({ kind: "shaky", lineId: line.id })}
          rehearseCount={GUIDE[line.id]?.rehearse?.length ?? 0}
          lastRehearsed={save.rehearsal[line.id]?.last}
          onRehearse={startRehearsal}
        />
      );
      break;
    case "cram":
      stage = (
        <PlayScreen
          key={screen.run}
          line={screen.drill.line}
          tier={1}
          hearts={5}
          firstTime={false}
          onArrive={(ride) => onCramDone(ride, screen.drill)}
          onDerail={(ride) => onDerail(ride, screen.drill)}
        />
      );
      break;
    case "play":
      stage = (
        <PlayScreen
          key={screen.run}
          line={line}
          tier={screen.tier}
          hearts={heartsFor(line, screen.tier)}
          firstTime={!save.levels[line.id]?.trips}
          history={save.questions}
          turn={save.levels[line.id]?.trips ?? 0}
          onArrive={onArrive}
          onDerail={onDerail}
        />
      );
      break;
    case "rehearse":
      stage = (
        <Rehearse
          key={screen.run}
          line={line}
          save={save}
          onDone={onRehearsed}
          onQuit={toIntro}
        />
      );
      break;
    case "quiz":
      stage = <Quiz line={line} onDone={(ok) => finish(screen.ride, ok)} />;
      break;
    case "result": {
      // A drill's ending is about the drill: its own line, and Again runs it
      // again. Anything else ends a ride or rehearsal on the selected line.
      const { drill } = screen;
      stage = (
        <Results
          mode={screen.mode}
          line={
            drill
              ? drill.line
              : screen.mode === "rehearsal"
                ? { ...line, bigO: undefined }
                : line
          }
          ride={screen.ride}
          result={screen.result}
          nextName={LINES[current + 1]?.name ?? null}
          onAgain={
            !drill
              ? () => board(screen.ride.tier)
              : canDrill(drill.pick)
                ? () => startDrill(drill.pick)
                : undefined
          }
          onNext={() => select(current + 1)}
          onTier={(t) => board(t)}
          onMap={toIntro}
        />
      );
      break;
    }
    case "derailed": {
      const { drill } = screen;
      stage = (
        <Derailed
          line={drill ? drill.line : line}
          cost={screen.cost}
          missed={(screen.ride?.answers ?? [])
            .filter((a) => !a.correct)
            .map((a) => a.question)}
          onAgain={drill ? () => startDrill(drill.pick) : () => board()}
          onMap={toIntro}
        />
      );
      break;
    }
  }

  return (
    <div className="wrap">
      <Header save={save} onLeave={doing ? toIntro : undefined} />
      {screen.kind === "intro" && (
        <TodayBand
          items={todayPlan(save, current)}
          onLine={select}
          onShaky={() => startDrill({ kind: "shaky" })}
        />
      )}
      {!doing && (
        <LineMap
          save={save}
          current={current}
          dailyIdx={dailyIdx}
          onSelect={select}
          open={openDivisions}
          onToggle={(d) =>
            setOpenDivisions((ds) =>
              ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d],
            )
          }
        />
      )}
      {screen.kind === "intro" && (
        <CramBand
          divisions={cramDivisions}
          poolSize={pool.length}
          shakyCount={shaky.length}
          onToggle={(d) =>
            setCramDivisions((ds) =>
              ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d],
            )
          }
          onStart={() => startDrill({ kind: "cram" })}
        />
      )}
      <main className="stage" ref={stageRef}>
        {stage}
      </main>
      {!doing && (
        <>
          <Badges save={save} />
          <SaveTransfer
            save={save}
            onImport={(s) => {
              ensureDailyPick(s);
              setSave(s);
              select(startingLine(s));
            }}
          />
        </>
      )}
    </div>
  );
}
