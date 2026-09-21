import type { CSSProperties } from 'react';
import type { Line } from '../engine/types';

export const lineStyle = (line: Line) => ({ '--c': `var(${line.color})` }) as CSSProperties;

export function Bullet({ line, size }: { line: Line; size?: 'sm' | 'lg' }) {
  return (
    <span className={`bullet ${size ?? ''} ${line.darkText ? 'dark-text' : ''}`} style={lineStyle(line)} aria-hidden="true">
      {line.bullet}
    </span>
  );
}
