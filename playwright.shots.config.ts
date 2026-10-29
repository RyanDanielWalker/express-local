import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// The README's screenshots and GIF clip, taken from the production build by
// e2e/readme.shots.ts. `npm run screenshots` builds first, then makes the GIF.
export default defineConfig({
  ...base,
  testMatch: "*.shots.ts",
  // One browser at a time, so each screenshot sees the timing a player would.
  workers: 1,
});
