/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { SECURITY_HEADERS, headersFile } from "./src/lib/securityHeaders";

export default defineConfig({
  plugins: [
    react(),
    // Cloudflare reads `dist/_headers` and sends those headers with every
    // response. It is written from the same list `preview` sends below.
    {
      name: "security-headers",
      apply: "build",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "_headers",
          source: headersFile(SECURITY_HEADERS),
        });
      },
    },
  ],
  // The end-to-end test runs against preview, so it runs under the deployed
  // Content-Security-Policy. Anything the policy blocks logs a console error,
  // and the test fails on those.
  preview: { headers: SECURITY_HEADERS },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Vitest blanks CSS files unless told otherwise. The contrast test reads
    // app.css as text, so let that one file through.
    css: { include: [/app\.css/] },
  },
});
