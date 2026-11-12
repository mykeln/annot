import { test, expect, chromium } from "@playwright/test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

test("project form renders and creates projects on a plain HTTP hostname", async ({}, testInfo) => {
  await run("python3", ["scripts/package-extension.py"]);
  const release = JSON.parse(await readFile("dist/package-report.json", "utf8"));
  const path = await mkdtemp(resolve(tmpdir(), "annot-http-test-"));
  await run("unzip", ["-q", resolve("dist", release.archive), "-d", path]);
  const manifestPath = resolve(path, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.host_permissions = ["http://annot.test/*"];
  await writeFile(manifestPath, JSON.stringify(manifest));
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium", headless: true,
    args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`, "--host-resolver-rules=MAP annot.test 127.0.0.1", "--no-proxy-server"],
    viewport: { width: 1280, height: 900 }
  });
  const errors = [];
  const exercised = [];
  let page, capabilities, result = "FAIL";
  try {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");
    page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://annot.test:4173");
    expect(await page.evaluate(() => isSecureContext)).toBe(false);
    exercised.push("plain HTTP origin loaded without a secure context");
    capabilities = await worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.storage.session.set({ [`tab:${tab.id}`]: "http://annot.test:4173" });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["core.js", "content.js"] });
      const [observed] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => ({ secureContext: isSecureContext, randomUUID: typeof crypto.randomUUID }) });
      return observed.result;
    });
    const panel = page.locator("annot-workspace");
    await panel.getByRole("button", { name: "Project", exact: true }).click();
    await expect(panel.getByRole("heading", { name: "From live site to local source." })).toBeVisible();
    exercised.push("Project tab opened and form heading rendered");
    await expect(panel.getByLabel("Project name", { exact: true })).toBeVisible();
    exercised.push("project form fields rendered");
    await panel.getByLabel("Project name", { exact: true }).fill("HTTP site");
    await panel.getByLabel("Checkout path").fill("/work/http-site");
    await panel.getByRole("button", { name: "Create project", exact: true }).click();
    await expect(panel.getByRole("combobox", { name: "Project", exact: true })).toHaveValue(/.+/);
    exercised.push("first project created");
    await panel.getByRole("button", { name: "Select an element" }).click();
    await page.getByRole("heading", { level: 1 }).click();
    await panel.getByLabel("Change request").fill("Use a more compact heading.");
    await panel.getByRole("button", { name: "Save annotation" }).click();
    await panel.getByRole("button", { name: "Prompt", exact: true }).click();
    const prompt = await panel.getByRole("textbox", { name: "Compiled coding prompt" }).inputValue();
    expect(prompt).toContain("Use a more compact heading.");
    exercised.push("element selected, annotation saved, and prompt compiled");
    await panel.getByRole("button", { name: "Project", exact: true }).click();
    await panel.getByRole("button", { name: "Add another project" }).click();
    await expect(panel.getByLabel("Project name", { exact: true })).toBeVisible();
    await panel.getByLabel("Project name", { exact: true }).fill("Second HTTP project");
    await panel.getByLabel("Checkout path").fill("/work/second");
    await panel.getByRole("button", { name: "Create project", exact: true }).click();
    await expect(panel.getByRole("combobox", { name: "Project", exact: true }).getByRole("option")).toHaveCount(2);
    exercised.push("second project created");
    expect(errors).toEqual([]);
    result = "PASS";
  } finally {
    if (page) await page.screenshot({ path: testInfo.outputPath("project-http.png") });
    await writeFile(testInfo.outputPath("project-http-verification.json"), JSON.stringify({
      coverage: "Browser E2E using the packaged extension on a non-secure HTTP hostname resolved to the local fixture; a temporary test-only host grant substitutes for toolbar activation.",
      result,
      capabilities,
      workspaceStatus: page ? await page.locator("annot-workspace").getByRole("status").textContent().catch(() => "unavailable") : "unavailable",
      exercised,
      pageErrors: errors,
      package: release,
      reproduce: "PLAYWRIGHT_BROWSERS_PATH=/private/tmp/annot-browsers npm run test:browser -- project-http.spec.js",
      artifacts: ["project-http.png"],
      limitations: ["Fixture site; native toolbar activation and a live coding session are not exercised"]
    }, null, 2));
    await context.close(); await rm(path, { recursive: true, force: true });
  }
});
