import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Results } from './Results';
import { Derailed } from './Derailed';
import { LINES } from '../data';
import { finishCram, finishTrip } from '../engine/progression';
import { emptySave } from '../engine/save';

const ride = { tier: 1 as const, rideXp: 60, mistakes: 1, time: 72 };
const noop = () => {};
const props = { ride, nextName: 'Next Line', onAgain: noop, onNext: noop, onTier: noop, onMap: noop };

describe('results screen', () => {
  it('renders for every line without blowing up', () => {
    for (const line of LINES) {
      const result = finishTrip(emptySave(), { lineIdx: LINES.indexOf(line), quizOk: true, ...ride });
      const html = renderToStaticMarkup(<Results {...props} line={line} result={result} />);
      expect(html, line.id).toContain('Total');
    }
  });

  it('renders a cram drill result without a line to review', () => {
    const result = finishCram(emptySave(), { right: 9, asked: 12, time: 140 });
    const cramLine = { ...LINES[0], id: 'cram' as (typeof LINES)[number]['id'], bigO: undefined, name: 'Cram Drill' };
    const html = renderToStaticMarkup(<Results {...props} cram line={cramLine} result={result} />);
    expect(html).toContain('Cram drills do not change line progress');
    expect(html).not.toContain('Next review in');
  });

  it('renders the out-of-hearts screen for every line', () => {
    for (const line of LINES) {
      expect(renderToStaticMarkup(<Derailed line={line} onAgain={noop} onMap={noop} />), line.id).toContain('Service suspended');
    }
  });
});
