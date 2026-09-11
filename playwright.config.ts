import { defineConfig, devices } from "@playwright/test";

/**
 * The suite runs against a production build, not the dev server: the bug it
 * exists to catch, a MapLibre style expression the bundler happily ships and
 * the map rejects at runtime, only shows up in a real build.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3122",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx next start -p 3122",
    url: "http://127.0.0.1:3122",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
