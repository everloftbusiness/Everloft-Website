/**
 * Local Performance Benchmark Runner
 * Delegates execution to the TypeScript benchmark script src/scripts/run-benchmarks.ts
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const serverOnlyPath = path.join(process.cwd(), "node_modules", "server-only", "index.js");
const originalContent = fs.existsSync(serverOnlyPath) ? fs.readFileSync(serverOnlyPath, "utf8") : "";

try {
  // Temporarily bypass server-only guard for standalone script runner
  fs.writeFileSync(serverOnlyPath, "module.exports = {};");
  execSync("npx tsx src/scripts/run-benchmarks.ts", { stdio: "inherit", cwd: process.cwd() });
} catch (err) {
  console.error("Failed to run benchmark script:", err);
  process.exit(1);
} finally {
  if (originalContent) {
    fs.writeFileSync(serverOnlyPath, originalContent);
  }
}
