import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const env = { ...process.env };

// Next.js 16 enables internal test mode whenever any of these variables exist.
// The host IDE sets DEBUG=release, which otherwise makes `next dev` consume
// memory until it stops accepting requests.
delete env.DEBUG;
delete env.NEXT_TEST_MODE;
delete env.__NEXT_TEST_MODE;

console.log("Starting Next.js dev server with Next test-mode variables cleared.");

const child = spawn(process.execPath, [nextBin, "dev"], {
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
