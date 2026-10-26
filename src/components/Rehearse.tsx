import { useState } from "react";
import { GUIDE } from "../data";
import type { Line, SaveData } from "../engine/types";
import { Bullet } from "./Bullet";
import { lineStyle } from "../lib/lineStyle";
import { Rich } from "./Rich";

interface Props {
  line: Line;
  save: SaveData;
  onDone: (result: { nailed: string[]; shaky: string[] }) => void;
  onQuit: () => void;
}

/**
 * Say the answer out loud, then check yourself against the model answer.
 * Self-graded on purpose: the point is hearing yourself explain it, which is
 * what an interview actually asks for. Prompts you called shaky come first.
 */
export function Rehearse({ line, save, onDone, onQuit }: Props) {
  const all = GUIDE[line.id]?.rehearse ?? [];
  const [prompts] = useState(() => {
    const wasShaky = new Set(save.rehearsal[line.id]?.shaky ?? []);
    return [...all].sort(
      (a, b) => Number(wasShaky.has(b.prompt)) - Number(wasShaky.has(a.prompt)),
    );
  });
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [nailed, setNailed] = useState<string[]>([]);
  const [shaky, setShaky] = useState<string[]>([]);

  const item = prompts[i];
  if (!item) return null;
  const repeat = (save.rehearsal[line.id]?.shaky ?? []).includes(item.prompt);

  function grade(ok: boolean) {
    const next = ok
      ? { nailed: [...nailed, item.prompt], shaky }
      : { nailed, shaky: [...shaky, item.prompt] };
    setNailed(next.nailed);
    setShaky(next.shaky);
    if (i + 1 >= prompts.length) return onDone(next);
    setI(i + 1);
    setRevealed(false);
  }

  return (
    <div className="rehearse" style={lineStyle(line)}>
      <div className="play-head">
        <div className="l">
          <Bullet line={line} size="sm" />
          <h2>Out Loud</h2>
          <span className="tchip">{line.short}</span>
        </div>
        <div className="row">
          <span className="xp">
            {i + 1} of {prompts.length}
          </span>
          <button className="btn ghost" onClick={onQuit}>
            Stop
          </button>
        </div>
      </div>

      <div className="progress" aria-hidden="true">
        {prompts.map((p, k) => (
          <i
            key={k}
            className={
              nailed.includes(p.prompt)
                ? "ok"
                : shaky.includes(p.prompt)
                  ? "no"
                  : k === i
                    ? "now"
                    : ""
            }
          />
        ))}
      </div>

      <div className="qcard">
        {repeat && (
          <div className="eyebrow">You called this one shaky last time</div>
        )}
        <p className="prompt">{item.prompt}</p>
        {!revealed ? (
          <>
            <p className="hint">
              Say your answer out loud, in full sentences, before you look.
              Talking is the part interviews actually test.
            </p>
            <div className="row">
              <button className="btn big" onClick={() => setRevealed(true)}>
                I said it. Show the answer
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="why">
              <b>What you were going for</b>
              <Rich text={item.answer} />
            </div>
            <p className="hint">
              Did yours cover that, out loud, without reading?
            </p>
            <div className="decide">
              <button className="btn" onClick={() => grade(true)}>
                Nailed it
              </button>
              <button className="btn ghost" onClick={() => grade(false)}>
                Shaky, ask me again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
