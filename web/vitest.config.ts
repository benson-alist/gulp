import { defineConfig } from "vitest/config";
import path from "node:path";

/** Vitest config for the Gulp web client. Scoped to pure-TS unit tests. */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
