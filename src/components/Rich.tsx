import { Fragment } from "react";

/**
 * Renders copy with `inline code` and **bold** markers. One span holds it all,
 * so a flex parent (a numbered option button) lays it out as one run of text
 * instead of spacing each piece apart, and the button's name stays one phrase.
 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p.startsWith("`") && p.endsWith("`") && p.length > 1 ? (
            <code>{p.slice(1, -1)}</code>
          ) : p.startsWith("**") && p.endsWith("**") ? (
            <b>{p.slice(2, -2)}</b>
          ) : (
            p
          )}
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Longer copy: a blank line starts a new paragraph, and each paragraph gets
 * the same `code` and **bold** formatting as <Rich />.
 */
export function Prose({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <>
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className={className}>
          <Rich text={para} />
        </p>
      ))}
    </>
  );
}
