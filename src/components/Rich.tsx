import { Fragment } from 'react';

/** Renders copy with `inline code` and **bold** markers. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p.startsWith('`') && p.endsWith('`') && p.length > 1 ? (
            <code>{p.slice(1, -1)}</code>
          ) : p.startsWith('**') && p.endsWith('**') ? (
            <b>{p.slice(2, -2)}</b>
          ) : (
            p
          )}
        </Fragment>
      ))}
    </>
  );
}
