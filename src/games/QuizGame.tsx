import { useEffect, useState } from "react";
import { guessMatches } from "../engine/predict";
import { pickQuestions, solidIn } from "../engine/questions";
import type { Question } from "../engine/types";
import { useKeys } from "../hooks/useKeys";
import { Rich } from "../components/Rich";
import { shuffle } from "../lib/random";
import { Panel } from "./parts";
import type { GameProps } from "./types";

const PROMPT = "Pick the answer you would give out loud in an interview.";
const PREDICT_PROMPT = "No options on this one. Type what you think it is.";
const promptFor = (q: Question | undefined) =>
  q?.predict ? PREDICT_PROMPT : PROMPT;

/**
 * Multiple choice drill. Wrong costs a heart, and every answer shows why.
 *
 * Nothing advances on a timer. The explanation is the teaching, and the old
 * 1.5 second auto-advance meant you never read it, least of all when you were
 * right, which is exactly when it catches you being right for a bad reason.
 *
 * A predict-first question has no options. The player types a guess before
 * anything else shows. A guess `guessMatches()` accepts counts by itself;
 * any other guess shows beside the proven answer, and the player says
 * whether they had it (ADR 0024). Marking moves straight on, since the
 * explanation was on screen while they decided.
 */
export function QuizGame({ api, line, role, history }: GameProps) {
  const [items] = useState<Question[]>(() =>
    line.preset
      ? (line.questions ?? [])
      : pickQuestions(
          line.questions ?? [],
          api.tier,
          undefined,
          solidIn(history, line.id),
        ),
  );
  const [i, setI] = useState(0);
  const [opts, setOpts] = useState<string[]>(() =>
    shuffle([...(items[0]?.opts ?? [])]),
  );
  /** The option picked, or the guess checked. Null while still deciding. */
  const [picked, setPicked] = useState<string | null>(null);
  /** Whether the answer counted. Null until it is scored. */
  const [right, setRight] = useState<boolean | null>(null);
  const [draft, setDraft] = useState("");
  const [marks, setMarks] = useState<("ok" | "no")[]>([]);
  useEffect(() => api.say(promptFor(items[0])), [api, items]);

  const q = items[i];
  const last = i + 1 >= items.length;

  /** Score the answer: a heart and XP, the history, and the clock held for reading. */
  function score(ok: boolean) {
    if (!q) return;
    setRight(ok);
    setMarks((m) => [...m, ok ? "ok" : "no"]);
    api.record(q, ok);
    if (ok) api.correct(10, "Correct. Read why before you move on.");
    else api.wrong(<>Not quite. The reason is below.</>);
    api.hold();
  }

  function choose(o: string) {
    if (api.over || picked || !q || q.predict) return;
    setPicked(o);
    score(o === q.a);
  }

  function check() {
    const guess = draft.trim();
    if (api.over || picked !== null || !q?.predict || !guess) return;
    setPicked(guess);
    if (guessMatches(q, guess)) return score(true);
    // Not a match: the player compares, and the clock waits while they read.
    api.say("Compare your guess with the answer, then say whether you had it.");
    api.hold();
  }

  /** The player's own verdict on a guess that did not match. */
  function mark(had: boolean) {
    if (api.over || picked === null || right !== null) return;
    score(had);
    if (!api.over) advance();
  }

  function next() {
    if (api.over || right === null) return;
    advance();
  }

  function advance() {
    api.resume();
    if (last) return api.finish();
    const upcoming = items[i + 1];
    setI(i + 1);
    setOpts(shuffle([...(upcoming.opts ?? [])]));
    setPicked(null);
    setRight(null);
    setDraft("");
    // Clear the last verdict, or "Not quite" sits over a question not yet answered.
    api.say(promptFor(upcoming));
  }

  // Number keys pick (or mark a guess), space or enter moves on, so a fast
  // run never needs the mouse. Keys typed into the guess box are left alone.
  useKeys((e) => {
    if (api.over) return;
    if (right !== null) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        next();
      }
      return;
    }
    if (q?.predict) {
      if (picked !== null && (e.key === "1" || e.key === "2"))
        mark(e.key === "1");
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= opts.length) choose(opts[n - 1]);
  });

  if (!q) return null;

  const continueLabel = !last
    ? "Continue"
    : role === "opener"
      ? "On to the last stop"
      : "See how you did";

  return (
    <>
      <div className="board">
        <div className="qcard">
          <div className="progress" aria-hidden="true">
            {items.map((_, k) => (
              <i key={k} className={marks[k] ?? (k === i ? "now" : "")} />
            ))}
          </div>
          <div className="eyebrow">
            Question {i + 1} of {items.length}
            {q.predict && " · Predict it"}
          </div>
          <p className="q">
            <Rich text={q.q} />
          </p>
          {q.code && (
            <pre className="code" tabIndex={0}>
              {q.code}
            </pre>
          )}
          {q.predict ? (
            picked === null ? (
              <form
                key={i}
                className="guess"
                onSubmit={(e) => {
                  e.preventDefault();
                  check();
                }}
              >
                <label htmlFor="guess">Your guess</label>
                <div className="guess-row">
                  <input
                    id="guess"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button className="btn" disabled={!draft.trim()}>
                    Check
                  </button>
                </div>
              </form>
            ) : (
              <div className="why">
                <b>
                  {right === true
                    ? "Right"
                    : right === false
                      ? "Missed"
                      : "Compare them"}
                </b>
                <dl className="compare">
                  <dt>You typed</dt>
                  <dd>
                    <code className="solo">{picked}</code>
                  </dd>
                  <dt>The answer</dt>
                  <dd>
                    <code className="solo">{q.a}</code>
                  </dd>
                </dl>
                <Rich text={q.why} />
              </div>
            )
          ) : (
            <>
              <div className="opts stack">
                {opts.map((o, k) => (
                  <button
                    key={o}
                    disabled={!!picked}
                    className={
                      picked && o === q.a
                        ? "right"
                        : picked === o
                          ? "wrongpick"
                          : ""
                    }
                    onClick={() => choose(o)}
                  >
                    <span className="kb" aria-hidden="true">
                      {k + 1}
                    </span>
                    <Rich text={o} />
                  </button>
                ))}
              </div>
              {picked && (
                <div className="why">
                  <b>{picked === q.a ? "Right" : "The answer is: " + q.a}</b>
                  <Rich text={q.why} />
                </div>
              )}
            </>
          )}
          {q.predict && picked !== null && right === null && (
            <>
              <p className="hint" style={{ margin: 0 }}>
                Same type written another way? That counts. The clock is paused.
              </p>
              <div className="decide">
                <button className="btn" onClick={() => mark(true)}>
                  <kbd aria-hidden="true">1</kbd> I had it
                </button>
                <button className="btn ghost" onClick={() => mark(false)}>
                  <kbd aria-hidden="true">2</kbd> I missed it
                </button>
              </div>
            </>
          )}
          {right !== null && (
            <div className="decide">
              <button className="btn big" onClick={next} autoFocus>
                {continueLabel}
              </button>
              <span className="hint" style={{ margin: 0 }}>
                or press space. The clock is paused.
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="side">
        {/* A line whose hook is the answer key gives a `drill` instead. Rush Hour gets neither. */}
        {api.assist && (
          <Panel title={line.drill ? "Think it through" : "Remember it"}>
            <p style={{ margin: 0 }}>
              <Rich text={line.drill ?? line.hook} />
            </p>
          </Panel>
        )}
        <Panel title="Scoring">
          <div className="mono" style={{ lineHeight: 1.8 }}>
            right = {marks.filter((m) => m === "ok").length}
            <br />
            wrong = {marks.filter((m) => m === "no").length}
            <br />
            left = {items.length - marks.length}
          </div>
        </Panel>
      </div>
    </>
  );
}
