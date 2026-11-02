/**
 * The security headers every page and file of the deployed app is sent with.
 * The build writes them into Cloudflare's `_headers` file, and
 * `npm run preview` sends the same ones, so the end-to-end test runs under
 * them too (see `vite.config.ts`).
 *
 * The app loads nothing from other sites: its scripts, styles and fonts are
 * all files of its own, and progress stays in `localStorage`. So the policy
 * can be strict.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  // Only this site's own files run or load. No inline script, no eval().
  // React's `style` prop is not inline CSS here: React sets it through the
  // DOM, which this policy allows.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
  // Another site cannot show the app inside a frame. Older browsers read this
  // one; newer ones read frame-ancestors above.
  "X-Frame-Options": "DENY",
  // A file is only ever treated as the type the server says it is.
  "X-Content-Type-Options": "nosniff",
  // A link out sends only the site's address, never the page's path.
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // The app never asks for these, so a script that somehow got in can't either.
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  // A page this one opens cannot reach back into it.
  "Cross-Origin-Opener-Policy": "same-origin",
  // Browsers use HTTPS for this site for a year, even if a link says http.
  "Strict-Transport-Security": "max-age=31536000",
};

/** Cloudflare's `_headers` format: one rule for every path, then the headers, indented. */
export function headersFile(headers: Record<string, string>): string {
  const lines = Object.entries(headers).map(
    ([name, value]) => `  ${name}: ${value}`,
  );
  return ["/*", ...lines].join("\n") + "\n";
}
