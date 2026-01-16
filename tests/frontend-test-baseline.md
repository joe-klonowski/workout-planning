# Frontend Test Baseline

Date: 2026-01-15

Summary of the test run used as baseline for reducing noise and improving performance.

- Test suites: 27
- Tests: 612
- Passed: 612
- Time: 8.372 s

Console output counts (from captured test run):
- console.error occurrences: 28
- console.warn occurrences: 16
- console.log occurrences: 121

Notes:
- Console errors include React act(...) warnings and fetch/network-related errors from components under test (e.g., WeeklySummary fetch errors and ImportWorkoutModal act warnings).
- Console.logs come from intentional debug/logging in `App.js` and other modules. These should be reviewed and either removed or guarded behind a debug flag.

Next steps:
1. Fix tests that trigger React act(...) warnings in `ImportWorkoutModal.test.js` by wrapping state-updating code in `act(...)` or awaiting the right async conditions.
2. Mock failed network requests in tests (WeeklySummary) to avoid `Error fetching weekly targets:` logs.
3. Replace or guard console.log debug statements in `App.js` (and similar) during tests.

Recorded output file: `/tmp/frontend-test-output.txt`
