const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const appTmp = path.join(repoRoot, 'app', 'tmp');
const reportPath = path.join(appTmp, 'console-report.json');
const baselinePath = path.join(repoRoot, 'app', 'tests', 'console-baseline.json');

// Helper to write json
function writeJson(p, obj) {
  if (!fs.existsSync(path.dirname(p))) fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

function runCompare(mode) {
  const env = Object.assign({}, process.env, { CONSOLE_BASELINE_MODE: mode });
  const res = spawnSync('node', [path.join(repoRoot, 'scripts', 'compare-console-baseline.js')], { env, encoding: 'utf8' });
  return res;
}

// 1) Prepare baseline and report that match -> should succeed in fail mode
const baseline = [ { testName: 'foo', calls: [] } ];
writeJson(baselinePath, baseline);
writeJson(reportPath, baseline);

console.log('Running compare in fail mode with matching report...');
let r = runCompare('fail');
if (r.status !== 0) {
  console.error('Expected status 0, got', r.status);
  console.error(r.stdout);
  console.error(r.stderr);
  process.exit(1);
}
console.log('OK');

// 2) Prepare report with extra message -> fail mode should exit non-zero
const reportWithMsg = [ { testName: 'foo', calls: [ { method: 'error', args: ['something bad'] } ] } ];
writeJson(reportPath, reportWithMsg);

console.log('Running compare in warn mode with new messages (should pass) ...');
r = runCompare('warn');
if (r.status !== 0) {
  console.error('Expected status 0 in warn mode, got', r.status);
  console.error(r.stdout);
  console.error(r.stderr);
  process.exit(1);
}
console.log('OK (warn)');

console.log('Running compare in fail mode with new messages (should fail) ...');
r = runCompare('fail');
if (r.status === 0) {
  console.error('Expected non-zero exit in fail mode when new messages present');
  console.error(r.stdout);
  process.exit(1);
}
console.log('OK (fail)');

console.log('All script checks passed');
process.exit(0);
