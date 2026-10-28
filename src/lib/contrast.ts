/**
 * Color contrast as WCAG 2 measures it. A ratio runs from 1 (the same color)
 * to 21 (black on white). Normal text needs 4.5 to pass AA. Large text needs
 * 3, and large means at least 24px, or at least 18.66px (14pt) in bold.
 */

type Rgb = [number, number, number];

/** `#1c5bbe` as three 0 to 255 channels. */
export function parseHex(hex: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a six-digit hex color: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (rgb: Rgb) =>
  "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");

/** How bright a color looks, from 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The contrast ratio between two colors. Order does not matter. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** What CSS `color-mix(in srgb, a pct%, b)` gives. */
export function mix(a: string, pct: number, b: string): string {
  const [x, y] = [parseHex(a), parseHex(b)];
  const t = pct / 100;
  return toHex(x.map((c, i) => c * t + y[i] * (1 - t)) as Rgb);
}

/** The ratio text needs to pass AA. */
export const needed = (large: boolean) => (large ? 3 : 4.5);

/** Whether text of this size and weight counts as large. */
export const isLarge = (px: number, weight: number) =>
  px >= 24 || (px >= 18.66 && weight >= 700);
