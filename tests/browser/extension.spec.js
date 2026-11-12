import { test, expect, chromium } from "@playwright/test";
import { resolve } from "node:path";
import { cp, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

test("annotates across pages and exports the correct project and element context", async ({}, testInfo) => {
  const path = await mkdtemp(resolve(tmpdir(), "annot-browser-test-"));
  await cp(resolve("extension"), path, { recursive: true });
  const manifestPath = resolve(path, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.host_permissions = ["http://127.0.0.1/*"];
  await writeFile(manifestPath, JSON.stringify(manifest));
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium", headless: true,
    args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`],
    viewport: { width: 1440, height: 1000 }
  });
  try {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4173");
    // Browser-chrome clicks aren't exposed by Playwright. Only this temporary test
    // copy has host access, allowing the real injection and navigation paths to run.
    await worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.storage.session.set({ [`tab:${tab.id}`]: "http://127.0.0.1:4173" });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["core.js", "content.js"] });
    });
    const panel = page.locator("annot-workspace");
    await panel.getByRole("button", { name: "Set up project" }).click();
    await panel.getByLabel("Project name", { exact: true }).fill("Fieldwork");
    await panel.getByLabel("Checkout path").fill("/work/fieldwork");
    await panel.getByLabel("Development base URL").fill("http://localhost:3000");
    await panel.getByLabel("Source hints").fill("/pricing = src/pages/Pricing.tsx");
    await panel.getByRole("button", { name: "Create project" }).click();
    await panel.getByRole("button", { name: "Select an element" }).click();
    await page.getByTestId("primary-cta").click();
    expect(new URL(page.url()).pathname).toBe("/");
    await panel.getByLabel("Change request").fill("Shorten this CTA and use the same style everywhere.");
    await panel.getByLabel("Apply to").selectOption("shared");
    await panel.getByRole("button", { name: "Save annotation" }).click();
    await expect(panel.getByText("01 · shared")).toBeVisible();
    await page.getByRole("link", { name: "Pricing", exact: true }).click();
    await expect(panel.getByText("01 · shared")).toBeVisible();
    await panel.getByRole("button", { name: "Select an element" }).click();
    await page.getByRole("heading", { level: 1 }).click();
    await panel.getByLabel("Change request").fill("Make the heading more compact on this route.");
    await panel.getByRole("button", { name: "Save annotation" }).click();
    await panel.getByRole("button", { name: "Prompt", exact: true }).click();
    const output = await panel.getByRole("textbox", { name: "Compiled coding prompt" }).inputValue();
    const data = JSON.parse(output.split("Annotation data (JSON):\n")[1]);
    expect(data.checkout).toBe("/work/fieldwork");
    expect(data.changes).toHaveLength(2);
    expect(data.changes[0].element.selector).toBe('[data-testid="primary-cta"]');
    expect(data.changes[0].scope).toBe("shared");
    expect(data.changes[1].developmentURL).toBe("http://localhost:3000/pricing");
    expect(data.changes[1].sourceHints).toEqual(["src/pages/Pricing.tsx"]);
    expect(output).not.toContain("private@example.com");
    const downloadPromise = page.waitForEvent("download");
    await panel.getByRole("button", { name: "Download prompt" }).click();
    const download = await downloadPromise;
    await download.saveAs(testInfo.outputPath("annot-prompt.txt"));
    expect(await readFile(testInfo.outputPath("annot-prompt.txt"), "utf8")).toBe(output);
    await panel.getByRole("button", { name: "Copy prompt", exact: true }).click();
    await expect(panel.getByRole("status")).toContainText(/Copied|Clipboard unavailable/);
    await page.screenshot({ path: "test-results/annot-prompt.png" });
    await panel.getByRole("button", { name: "Annotations", exact: true }).click();
    await panel.getByRole("button", { name: "Select an element" }).click();
    await page.keyboard.press("Escape");
    await expect(panel.getByRole("button", { name: "Select an element" })).toBeVisible();
    await panel.getByRole("button", { name: "Remove", exact: true }).first().click();
    await expect(panel.getByText("01 · page")).toBeVisible();
    await page.reload();
    await expect(panel.getByText("01 · page")).toBeVisible();

    // Exercise prefix translation and rejection through the real UI, not isolated functions.
    await panel.getByRole("button", { name: "Project", exact: true }).click();
    await panel.getByLabel("Deployed base URL").fill("https://user:password@example.com");
    await panel.getByRole("button", { name: "Save project", exact: true }).click();
    await expect(panel.getByRole("status")).toContainText("no credentials");
    await panel.getByLabel("Deployed base URL").fill("http://127.0.0.1:4173/pricing/");
    await panel.getByLabel("Development base URL").fill("http://localhost:4321/help/");
    await panel.getByRole("button", { name: "Save project", exact: true }).click();
    await page.goto("http://127.0.0.1:4173/pricing?plan=team#compare");
    await panel.getByRole("button", { name: "Select an element" }).click();
    await page.getByRole("textbox", { name: "Email", exact: true }).click();
    await panel.getByLabel("Change request").fill("Improve the email field border.");
    await panel.getByRole("button", { name: "Save annotation" }).click();
    await panel.getByRole("button", { name: "Prompt", exact: true }).click();
    const prefixedOutput = await panel.getByRole("textbox", { name: "Compiled coding prompt" }).inputValue();
    const prefixedData = JSON.parse(prefixedOutput.split("Annotation data (JSON):\n")[1]);
    expect(prefixedData.changes[1].developmentURL).toBe("http://localhost:4321/help?plan=team#compare");
    expect(prefixedData.changes[1].element.attributes["aria-label"]).toBe("Email");
    expect(prefixedOutput).not.toContain("private@example.com");
    await page.goto("http://127.0.0.1:4173/");
    await panel.getByRole("button", { name: "Select an element" }).click();
    await expect(panel.getByRole("status")).toContainText("does not match");
    await panel.getByRole("button", { name: "Project", exact: true }).click();
    await panel.getByRole("button", { name: "Add another project" }).click();
    await panel.getByLabel("Project name", { exact: true }).fill("Separate project");
    await panel.getByLabel("Checkout path").fill("/work/other");
    await panel.getByRole("button", { name: "Create project" }).click();
    await expect(panel.getByText("0 saved changes")).toBeVisible();
    await panel.getByRole("combobox", { name: "Project", exact: true }).selectOption({ label: "Fieldwork" });
    await expect(panel.getByText("2 saved changes")).toBeVisible();

    await page.setViewportSize({ width: 480, height: 800 });
    await page.evaluate(() => { window.scrollTo(0, 0); });
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    await expect(panel).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath("annot-narrow.png") });
    const panelBounds = await panel.locator(".panel").boundingBox();
    expect(panelBounds.x).toBeGreaterThanOrEqual(0);
    expect(panelBounds.x + panelBounds.width).toBeLessThanOrEqual(480);
    await panel.getByRole("button", { name: "Close Annot" }).click();
    await page.reload();
    await expect(panel).toHaveCount(0);
    expect(errors).toEqual([]);
    const report = {
      coverage: "Browser E2E in Chromium with the real MV3 worker and content scripts; a temporary extension copy grants the fixture origin host access instead of a browser-toolbar gesture.",
      result: "PASS",
      exercised: ["project configuration and validation", "element selection without following links", "cross-page persistence and reload", "page and shared scopes", "prefix/query/fragment URL translation", "source hints", "exclusion of form values", "clipboard feedback and prompt download", "project isolation", "annotation deletion", "wrong-route rejection", "narrow viewport", "close stops reinjection"],
      reproduce: "npm ci && PLAYWRIGHT_BROWSERS_PATH=/private/tmp/annot-browsers npx playwright install chromium && PLAYWRIGHT_BROWSERS_PATH=/private/tmp/annot-browsers npm run test:browser",
      limitations: ["Native toolbar activation is not automated", "No live external site, source checkout, or Codex session was exercised"],
      artifacts: ["annot-prompt.txt", "annot-narrow.png", "../annot-prompt.png"]
    };
    await writeFile(testInfo.outputPath("verification.json"), JSON.stringify(report, null, 2));
  } finally { await context.close(); await rm(path, { recursive: true, force: true }); }
});
