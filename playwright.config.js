import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30000,
  workers: 1,
  reporter: "list",
  webServer: { command: "npm run demo", url: "http://127.0.0.1:4173", reuseExistingServer: false }
});
