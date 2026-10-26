import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GUIDE } from "../data";
import { GAMES } from "../games";
import { QuizRun } from "../games/QuizRun";
import { FlowGame } from "../games/FlowGame";
import type { GameApi, Tone } from "../games/types";
import { fmtTime, TIERS } from "../engine/progression";
import type {
  AlgoLineId,
  Line,
  Question,
  QuestionStat,
  Tier,
} from "../engine/types";
import { useTimers } from "../hooks/useTimers";
import { Bullet, lineStyle } from "./Bullet";
import { Words } from "./FieldGuide";
import { Prose } from "./Rich";

export interface RideStats {
  tier: Tier;
  rideXp: number;
  mistakes: number;
  time: number;
  /** Every question answered this run, in order, for stats and the recap. */
  answers: { question: Question; correct: boolean }[];
}

interface Props {
  line: Line;
  tier: Tier;
  /** Hearts for this run. Lines get 3, or 4 when the run ends on a puzzle. The cram drill gets 5. */
  hearts?: number;
  firstTime: boolean;
  onArrive: (stats: RideStats) => void;
  /** Out of hearts. The run still reports what was answered, so misses are tracked. */
  onDerail: (stats: RideStats) => void;
  /** Answer history and ride count, so replays show new questions and rotate puzzles. */
  history?: Record<string, QuestionStat>;
  turn?: number;
}

const DEFAULT_HEARTS = 3;

export function PlayScreen({
  line,
  tier,
  hearts: maxHearts = DEFAULT_HEARTS,
  firstTime,
  onArrive,
  onDerail,
  history,
  turn,
}: Props) {
  const later = useTimers();
  const [status, setStatus] = useState<{ msg: ReactNode; tone: Tone }>({
    msg: null,
    tone: "",
  });
  const [hearts, setHearts] = useState(maxHearts);
  const [xp, setXp] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [held, setHeld] = useState(false);
  const run = useRef({
    over: false,
    xp: 0,
    mistakes: 0,
    hearts: maxHearts,
    t0: Date.now(),
    heldAt: 0,
    answers: [] as RideStats["answers"],
  });

  useEffect(() => {
    const id = window.setInterval(() => {
      const r = run.current;
      if (!r.over && !r.heldAt) setElapsed((Date.now() - r.t0) / 1000);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Stable for the whole ride, so games can safely list it as an effect dependency.
  const api = useMemo<GameApi>(() => {
    const r = run.current;
    /** Elapsed seconds, releasing the clock first if it was held. */
    const stop = () => {
      if (r.heldAt) {
        r.t0 += Date.now() - r.heldAt;
        r.heldAt = 0;
        setHeld(false);
      }
      return (Date.now() - r.t0) / 1000;
    };
    return {
      tier,
      assist: tier < 3,
      get over() {
        return r.over;
      },
      say: (msg, tone = "") => setStatus({ msg, tone }),
      hold() {
        if (r.over || r.heldAt) return;
        r.heldAt = Date.now();
        setHeld(true);
      },
      resume() {
        if (!r.heldAt) return;
        r.t0 += Date.now() - r.heldAt;
        r.heldAt = 0;
        setHeld(false);
      },
      record(question, correct) {
        r.answers.push({ question, correct });
      },
      correct(points = 10, msg) {
        r.xp += points;
        setXp(r.xp);
        if (msg) setStatus({ msg, tone: "good" });
      },
      wrong(msg) {
        if (r.over) return;
        r.mistakes++;
        r.hearts--;
        setHearts(r.hearts);
        setStatus({ msg, tone: "bad" });
        if (r.hearts <= 0) {
          const time = stop();
          r.over = true;
          later(
            () =>
              onDerail({
                tier,
                rideXp: r.xp,
                mistakes: r.mistakes,
                time,
                answers: r.answers,
              }),
            1600,
          );
        }
      },
      finish() {
        if (r.over) return;
        const time = stop();
        r.over = true;
        setElapsed(time);
        later(
          () =>
            onArrive({
              tier,
              rideXp: r.xp,
              mistakes: r.mistakes,
              time,
              answers: r.answers,
            }),
          2000,
        );
      },
    };
  }, [tier, later, onArrive, onDerail]);

  const Game =
    line.kind === "quiz"
      ? QuizRun
      : line.kind === "flow"
        ? FlowGame
        : GAMES[line.id as AlgoLineId];
  const g = GUIDE[line.id] as (typeof GUIDE)[keyof typeof GUIDE] | undefined;

  return (
    <div style={lineStyle(line)}>
      <div className="play-head">
        <div className="l">
          <Bullet line={line} size="sm" />
          <h2>{line.name}</h2>
          {!line.preset && <span className="tchip">{TIERS[tier].name}</span>}
        </div>
        <div className="row">
          <span
            className={`clock ${held ? "held" : ""}`}
            aria-label={held ? "Clock paused while you read" : "Elapsed time"}
          >
            {fmtTime(elapsed)}
          </span>
          {tier === 3 && !line.preset && (
            <span className="hint" style={{ margin: 0 }}>
              par {fmtTime(line.par)}
            </span>
          )}
          <span className="xp">+{xp} XP</span>
          <div
            className="hearts"
            aria-label={`${hearts} of ${maxHearts} hearts left`}
          >
            {Array.from({ length: maxHearts }, (_, i) => (
              <span key={i} className={i < hearts ? "" : "gone"}>
                ♥
              </span>
            ))}
          </div>
        </div>
      </div>
      {/*
        Only the algorithm games get the guide on the play screen, where it explains the
        mechanic. On quiz and flow lines it is the answer key: the glossary for the
        building blocks line literally lists what each block is for. Study on the intro
        screen; the play screen is the test.
      */}
      {g && line.kind === "game" && (
        <details className="explain" open={firstTime}>
          <summary>What's going on here?</summary>
          <Prose text={g.plain} />
          <Words words={g.words} />
        </details>
      )}
      <div className={`status ${status.tone}`} aria-live="polite">
        {status.msg}
      </div>
      <div className="play">
        <Game api={api} line={line} history={history} turn={turn} />
      </div>
    </div>
  );
}
