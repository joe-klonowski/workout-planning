#!/usr/bin/env node
/*
  Simple script to compare current console report to baseline.
  Exits with code 0 in WARN mode (default), non-zero in FAIL mode when new messages are found.
  Usage: CONSOLE_BASELINE_MODE=warn|fail node scripts/compare-console-baseline.js
*/
const fs = require('fs');
const path = require('path');

const mode = process.env.CONSOLE_BASELINE_MODE || process.env.CONSOLE_MODE || 'warn'; // warn or fail
const repoRoot = path.resolve(__dirname, '..');
const reportPath = path.join(repoRoot, 'app', 'tmp', 'console-report.json');
const baselinePath = path.join(repoRoot, 'app', 'tests', 'console-baseline.json');

function loadJson(p) {
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
}

const report = loadJson(reportPath) || [];
const baseline = loadJson(baselinePath) || [];

// Build maps by testName for quick lookup
const baseMap = new Map(baseline.map(item => [item.testName, item]));

const newMessages = [];

report.forEach(item => {
  const base = baseMap.get(item.testName);
  const baseCalls = (base && base.calls) || [];
  const repCalls = item.calls || [];

  // Simple check: any calls present in report that were not in baseline
  if (repCalls.length > (baseCalls.length || 0)) {
    // Find calls that are new (naive: calls at indexes beyond baseline length)
    const extra = repCalls.slice(baseCalls.length);
    if (extra.length > 0) {
      newMessages.push({ testName: item.testName, newCalls: extra });
    }
  }
});

if (newMessages.length === 0) {
  console.log('Console baseline check: OK — no new console messages');
  process.exit(0);
}

console.log(`Console baseline check: FOUND ${newMessages.length} tests with new console messages`);
newMessages.slice(0, 20).forEach(m => {
  console.log('\nTest:', m.testName);
  m.newCalls.forEach(call => {
    console.log(`  [${call.method}]`, JSON.stringify(call.args));
  });
});

console.log('\n(Showing up to 20 tests with new messages)');

if (mode === 'fail') {
  console.error('Console baseline mode is FAIL — failing CI due to new console messages');
  process.exit(2);
} else {
  console.warn('Console baseline mode is WARN — continue but review the new messages and update baseline if intended');
  process.exit(0);
}