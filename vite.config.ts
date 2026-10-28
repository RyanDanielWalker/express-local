/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Vitest blanks CSS files unless told otherwise. The contrast test reads
    // app.css as text, so let that one file through.
    css: { include: [/app\.css/] },
  },
});
