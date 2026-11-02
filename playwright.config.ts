import { defineConfig, devices } from "@playwright/test";

// The end-to-end test runs against the production build, served the way
// `npm run preview` serves it, with the deploy's security headers. CI
// deploys that same build only if this passes (ADR 0021). `npm run e2e`
// builds first.
const port = 4173;

export default defineConfig({
  testDir: "e2e",
  // CI adds --forbid-only and --reporter=github on the command line, which
  // keeps Node's types (for `process.env.CI`) out of the app's tsconfig.
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    // A server left running could be serving an older build.
    reuseExistingServer: false,
  },
});
