import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const files = await readdir("test-results", { recursive: true });
const reports = files.filter((file) => file.endsWith("/verification.json"));
if (reports.length !== 1) throw new Error("Run the browser E2E suite first; expected one verification report.");
const source = dirname(resolve("test-results", reports[0]));
const verification = JSON.parse(await readFile(resolve(source, "verification.json"), "utf8"));
const packageReport = JSON.parse(await readFile("dist/package-report.json", "utf8"));
if (verification.result !== "PASS" || verification.package?.sha256 !== packageReport.sha256) {
  throw new Error("The passing browser verification must cover the current release ZIP.");
}
const httpFile = files.find((file) => file.endsWith("/project-http-verification.json"));
if (!httpFile) throw new Error("Run the plain HTTP project-form browser regression before preparing a release.");
const httpVerification = JSON.parse(await readFile(resolve("test-results", httpFile), "utf8"));
if (httpVerification.result !== "PASS" || httpVerification.package?.sha256 !== packageReport.sha256) {
  throw new Error("The plain HTTP browser regression must pass against the current release ZIP.");
}
await mkdir("store/assets", { recursive: true });
for (const name of ["select", "annotations", "prompt"]) {
  await copyFile(resolve(source, `store-${name}.png`), `store/assets/screenshot-${name}.png`);
}
await copyFile(resolve(source, "verification.json"), "store/verification.json");
await copyFile("extension/privacy.html", "store/privacy.html");
await mkdir("store/bugs", { recursive: true });
await copyFile(resolve("test-results", httpFile), "store/bugs/project-http-after.json");
await copyFile(resolve("test-results", dirname(httpFile), "project-http.png"), "store/bugs/project-http-after.png");
console.log("Collected screenshots, browser verification, and the public-hosting copy of the privacy policy.");
