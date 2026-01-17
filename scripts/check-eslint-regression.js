#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COUNT_FILE = path.resolve(process.cwd(), '.eslint_error_count');
const APP_GLOB = 'src/**/*.{js,jsx}';

function runEslintJson() {
  try {
    // Run the lint command from the `app/` working directory so the package-local
    // config file (`app/.eslintrc.cjs`) is picked up when using ESLint v9+.
    const out = execSync(`npm run lint --silent -- --format json "${APP_GLOB}"`, { encoding: 'utf8', cwd: path.join(process.cwd(), 'app') });
    return out;
  } catch (err) {
    // eslint exits non-zero when there are problems; the stdout is still available
    if (err.stdout) return err.stdout.toString();
    throw err;
  }
}

function countErrorsFromJson(jsonStr) {
  let results;
  try {
    results = JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse ESLint JSON output');
    throw e;
  }
  let errors = 0;
  for (const fileResult of results) {
    for (const msg of fileResult.messages || []) {
      // ESLint severity: 2 = error, 1 = warning
      if (msg.severity === 2) errors += 1;
      // Older ESLint may provide `fatal: true` on some errors
      else if (msg.fatal) errors += 1;
    }
  }
  return errors;
}

function readPreviousCount() {
  try {
    const txt = fs.readFileSync(COUNT_FILE, 'utf8').trim();
    const n = parseInt(txt, 10);
    if (Number.isFinite(n)) return n;
  } catch (e) {
    // file missing or unreadable
  }
  return null;
}

function writeCount(n) {
  fs.writeFileSync(COUNT_FILE, String(n) + '\n', { encoding: 'utf8' });
}

function gitAdd(file) {
  try {
    execSync(`git add "${file}"`, { stdio: 'ignore' });
  } catch (e) {
    // ignore
  }
}

function gitAmendInclude(file) {
  try {
    execSync(`git add "${file}"`, { stdio: 'inherit' });
    // Amend last commit to include the updated count file
    execSync('git commit --amend --no-edit', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to amend commit with updated eslint count:', e.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const doWrite = args.includes('--write-file') || args.includes('--update-file');
  const doAmend = args.includes('--amend');

  const eslintOut = runEslintJson();
  const currentErrors = countErrorsFromJson(eslintOut);

  const prev = readPreviousCount();

  if (prev === null) {
    // First time: create file and stage it so it becomes part of the commit
    writeCount(currentErrors);
    gitAdd(COUNT_FILE);
    console.log(`Initialized ${path.basename(COUNT_FILE)} = ${currentErrors}`);
    // When used in pre-commit, initializing should pass (allow commit), so exit 0
    if (doAmend) gitAmendInclude(COUNT_FILE);
    process.exit(0);
  }

  if (doWrite) {
    writeCount(currentErrors);
    console.log(`Wrote ${path.basename(COUNT_FILE)} = ${currentErrors}`);
    if (doAmend) gitAmendInclude(COUNT_FILE);
    process.exit(0);
  }

  // Normal check mode: fail if currentErrors > prev
  if (currentErrors > prev) {
    console.error('ESLint error count increased:');
    console.error(`  previous: ${prev}`);
    console.error(`  current : ${currentErrors}`);
    console.error('\nCommit aborted. Fix lint errors or reduce the error count before committing.');
    process.exit(1);
  }

  console.log(`ESLint errors: ${currentErrors} (previous allowed: ${prev})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running ESLint regression check:', err && err.message ? err.message : err);
  process.exit(2);
});
