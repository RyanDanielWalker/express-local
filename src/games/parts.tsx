import type { ReactNode } from 'react';

export const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="panel">
    <h3>{title}</h3>
    {children}
  </div>
);

export const CodePanel = ({ title, code }: { title: string; code: string }) => (
  <Panel title={title}>
    <pre className="code" style={{ fontSize: 12.5, padding: '10px 12px' }}>{code}</pre>
  </Panel>
);

export const Note = ({ children }: { children: ReactNode }) => <p style={{ margin: 0 }}>{children}</p>;

export const Mono = ({ children }: { children: ReactNode }) => <span className="mono">{children}</span>;

export const Kbd = ({ children }: { children: ReactNode }) => <kbd>{children}</kbd>;

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
