import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3123);

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 900 },
    video: "on",
    screenshot: "on",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } }],
  webServer: {
    command: "node server.js",
    url: `http://localhost:${PORT}/`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
  },
});
