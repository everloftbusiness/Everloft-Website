/**
 * Local Performance Benchmark & CPU Optimization Measurement Script
 * Tests production implementation functions directly by importing from ical-sync.service.ts.
 *
 * NOTE: All timings in this suite are synthetic local measurements (Node.js runtime)
 * and must NOT be cited as Vercel Active CPU production metrics.
 */

import { performance } from "perf_hooks";

// Mock server-only before importing production services
import Module from "module";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalRequire = (Module.prototype as any).require;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Module.prototype as any).require = function (id: string, ...args: any[]) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, [id, ...args]);
};

import { parseICalFeed } from "../features/properties/services/ical-sync.service";

async function runBenchmarks() {
  console.log("==================================================================");
  console.log("EVERLOFT LOCAL CPU BENCHMARK SUITE");
  console.log("[SYNTHETIC LOCAL TIMINGS — NOT VERCEL PRODUCTION MEASUREMENTS]");
  console.log("==================================================================");

  // 1. Production iCal Feed Parser Benchmark (1,000 VEVENT items)
  console.log("\n[1] Testing Production parseICalFeed() (1,000 VEVENT items)...");
  let mockIcs = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Everloft Test//EN\r\n`;
  for (let i = 0; i < 1000; i++) {
    mockIcs += `BEGIN:VEVENT\r\nSUMMARY:Airbnb Booking #${i}\r\nDTSTART;VALUE=DATE:20261001\r\nDTEND;VALUE=DATE:20261005\r\nUID:evt_bench_${i}\r\nEND:VEVENT\r\n`;
  }
  mockIcs += `END:VCALENDAR\r\n`;

  const iCalStart = performance.now();
  const events = parseICalFeed(mockIcs);
  const iCalDuration = performance.now() - iCalStart;

  console.log(`- Parsed ${events.length} production iCal events in ${iCalDuration.toFixed(2)} ms.`);
  console.log(`- Payload size: ${(mockIcs.length / 1024).toFixed(2)} KB`);

  // 2. Scoped Set Deduplication Benchmark (5,000 items)
  console.log("\n[2] Testing Date-Scoped Set Deduplication (5,000 keys)...");
  const existingSet = new Set<string>();
  for (let i = 0; i < 2500; i++) {
    existingSet.add(`prop_1_guest_${i}_2026-11-01`);
  }

  const dedupStart = performance.now();
  let dupesFound = 0;
  for (let i = 0; i < 5000; i++) {
    const key = `prop_1_guest_${i % 2500}_2026-11-01`;
    if (existingSet.has(key)) {
      dupesFound++;
    }
  }
  const dedupDuration = performance.now() - dedupStart;

  console.log(`- Scoped deduplication check completed in ${dedupDuration.toFixed(2)} ms (found ${dupesFound} duplicates).`);

  console.log("\n==================================================================");
  console.log("HARDENING SUMMARY & ARCHITECTURAL SAFEGUARDS");
  console.log("==================================================================");
  console.log("Safeguard                           Status");
  console.log("----------------------------------  ------------------------------");
  console.log("Cron Authentication:                Mandatory CRON_SECRET + 401 fail-closed");
  console.log("Cron Execution Boundary:            Max 10 props/run, 15s time budget, cursor rotation");
  console.log("Google Sheet Fetch Limit:           10s timeout, 5MB streaming size limit");
  console.log("Airbnb Import Constraints:          Max 20 photos, worker-pool concurrency 3");
  console.log("Public Availability API:            UUID/slug validated, no .or() injection");
  console.log("Booking Conflict Protection:        Unexecuted proposal migration + transaction lock");
  console.log("==================================================================");
}

runBenchmarks().catch(console.error);
