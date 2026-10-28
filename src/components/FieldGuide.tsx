import { GUIDE } from "../data";
import type { Line } from "../engine/types";
import { lineStyle } from "../lib/lineStyle";
import { Prose, Rich } from "./Rich";

export function Words({ words }: { words: [string, string][] }) {
  return (
    <dl className="words">
      {words.map(([t, d]) => (
        <div key={t} style={{ display: "contents" }}>
          <dt>{t}</dt>
          <dd>
            <Rich text={d} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function FieldGuide({ line }: { line: Line }) {
  const g = GUIDE[line.id];
  return (
    <section className="guide" style={lineStyle(line)} aria-label="Field guide">
      <h3 className="gh">Field guide</h3>
      <div className="ggrid">
        <div className="gwide plain">
          <div className="eyebrow">In plain English</div>
          <Prose text={g.plain} />
        </div>
        <div>
          <div className="eyebrow">Words to know</div>
          <Words words={g.words} />
        </div>
        <div>
          <div className="eyebrow">Where you'll see it: {g.code.label}</div>
          <pre className="code" tabIndex={0}>
            {g.code.snippet}
          </pre>
          {g.code.note && (
            <p className="hint" style={{ margin: 0 }}>
              {g.code.note}
            </p>
          )}
        </div>
        {g.when && (
          <div>
            <div className="eyebrow">Reach for it when</div>
            <ul className="rules">
              {g.when.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        {g.famous && (
          <div>
            <div className="eyebrow">Famous problems</div>
            <ul className="rules">
              {g.famous.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        {g.say && (
          <div className="gwide">
            <div className="eyebrow">If they ask, say this</div>
            <ul className="say">
              {g.say.map((x) => (
                <li key={x}>
                  <Rich text={x} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {g.gotcha && (
          <div className="gwide hook">
            <b>Gotcha</b>
            <p>
              <Rich text={g.gotcha} />
            </p>
          </div>
        )}
        {g.lore && (
          <div className="gwide">
            <div className="eyebrow">Backstory</div>
            <p>{g.lore}</p>
          </div>
        )}
      </div>
    </section>
  );
}
