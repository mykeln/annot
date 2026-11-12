import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const url = "https://www.halfcorp.co/annot-privacy.html";
const [source, policy, homepage] = await Promise.all([
  readFile("extension/privacy.html"),
  fetch(url),
  fetch("https://www.halfcorp.co/")
]);
const hosted = Buffer.from(await policy.arrayBuffer());
const checks = {
  policyReturnsHTTP200: policy.status === 200,
  policyMatchesBundledSource: source.equals(hosted),
  homepageReturnsHTTP200: homepage.status === 200
};
const report = {
  coverage: "Live HTTPS integration verification only; this is not browser E2E coverage.",
  result: Object.values(checks).every(Boolean) ? "PASS" : "FAIL",
  checkedAt: new Date().toISOString(),
  privacyPolicyUrl: url,
  policySHA256: createHash("sha256").update(hosted).digest("hex"),
  checks,
  reproduce: "node scripts/verify-privacy-host.js"
};
await writeFile("store/privacy-hosting-verification.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (report.result !== "PASS") process.exitCode = 1;
