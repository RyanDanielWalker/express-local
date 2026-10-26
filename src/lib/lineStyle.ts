import type { CSSProperties } from "react";
import type { Line } from "../engine/types";

/** Sets --c to the line's color, for anything drawn in that line's color. */
export const lineStyle = (line: Line) =>
  ({ "--c": `var(${line.color})` }) as CSSProperties;
