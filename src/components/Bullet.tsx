import type { Line } from "../engine/types";
import { lineStyle } from "../lib/lineStyle";

export function Bullet({ line, size }: { line: Line; size?: "sm" | "lg" }) {
  return (
    <span
      className={`bullet ${size ?? ""} ${line.darkText ? "dark-text" : ""}`}
      style={lineStyle(line)}
      aria-hidden="true"
    >
      {line.bullet}
    </span>
  );
}
