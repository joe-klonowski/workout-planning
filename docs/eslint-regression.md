# ESLint regression pre-commit check

This adds a conservative, short-term pre-commit hook that prevents commits when the **number of ESLint errors** (severity-level errors only) has increased compared to the previous commit.

Why this approach?
- There are many existing ESLint errors in the repo, so blocking all commits until zero errors is not realistic right now.
- We store the last-known error count in `.eslint_error_count` (tracked in the repo) and **disallow** commits that increase the error count.

How it works
- `scripts/check-eslint-regression.js` computes the current ESLint *error* count for `app/src/**/*.{js,jsx}`.
- If `.eslint_error_count` is missing, the script creates it and stages it (so the initial commit will include it).
- On pre-commit the check script runs and aborts the commit if the current error count is greater than the stored count.
- A `post-commit` hook updates `.eslint_error_count` and amends the commit if the count changed (so the stored value always reflects the committed tree).

Developer commands
- Check current count without modifying any files:

  node ./scripts/check-eslint-regression.js

- Write the count file (useful for initialization or manual update):

  node ./scripts/check-eslint-regression.js --write-file

- Write the count file and amend the last commit with it:

  node ./scripts/check-eslint-regression.js --write-file --amend

Installing & testing locally
1. Ensure Husky is set up (project already contains `prepare` script):
   npm run prepare

2. Initialize the `.eslint_error_count` (optional — the pre-commit hook will do it automatically the first time, but you can do it manually):
   node ./scripts/check-eslint-regression.js --write-file && git add .eslint_error_count && git commit -m "chore: initialize eslint error count"

Notes & caveats
- The script runs `npm --prefix app run lint` with `--format json` and parses ESLint JSON output. It counts messages with `severity === 2` (errors) and `fatal` messages.
- The `post-commit` hook amends the last commit if the count file changed. This keeps the history tidy (no extra commits just to update the count).
- This is meant as a short-to-medium term guardrail. The longer-term plan should be to gradually reduce the actual number of ESLint errors and enforce stricter checks.
