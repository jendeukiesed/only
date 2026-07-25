import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Unit/integration config — deliberately excludes `tests/e2e/**`, which is
 * Playwright's domain (a real browser hitting a real running server, not
 * something Vitest's node environment can execute). Path aliases mirror
 * tsconfig.json exactly so a test's imports never diverge from the app's.
 *
 * Default environment is "node" (fast, and correct for the service/action
 * tests that make up most of the suite). The handful of component tests
 * that need a DOM opt in per-file with a `// @vitest-environment jsdom`
 * docblock at the top of the file instead of paying the jsdom cost for
 * every test in the project.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "actions/**/*.ts",
        "services/**/*.ts",
        "lib/**/*.ts",
        "utils/**/*.ts",
        "schemas/**/*.ts",
      ],
      exclude: ["**/*.d.ts", "**/index.ts"],
    },
  },
  resolve: {
    alias: {
      "@/components": path.resolve(__dirname, "./components"),
      "@/features": path.resolve(__dirname, "./features"),
      "@/hooks": path.resolve(__dirname, "./hooks"),
      "@/services": path.resolve(__dirname, "./services"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/db": path.resolve(__dirname, "./db"),
      "@/actions": path.resolve(__dirname, "./actions"),
      "@/schemas": path.resolve(__dirname, "./schemas"),
      "@/types": path.resolve(__dirname, "./types"),
      "@/emails": path.resolve(__dirname, "./emails"),
      "@/providers": path.resolve(__dirname, "./providers"),
      "@/utils": path.resolve(__dirname, "./utils"),
      "@/": path.resolve(__dirname, "./"),
    },
  },
});
