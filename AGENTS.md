This file contains instructions for agentic coding systems that are editing code in this repository or answering questions about the project.

## General instructions
- Remove tasks from future-work.md as you complete them. But only do this after the feature is complete and tests are passing. Don't remove the task before you finish the code to implement the task.
- Always read the following files and load them into context before answering questions or writing code:
  - AGENTS.md
  - README.md
  - future-work.md
  - If working with the backend:
    - backend/README.md
    - backend/models.py (database schema - critical for understanding data structure)
    - backend/config.py (backend configuration)
    - backend/requirements.txt (Python dependencies)
    - If modifying database schema:
      - backend/alembic/README.md
  - If working with the frontend:
    - app/README.md
    - app/package.json (frontend dependencies and scripts)

## Development process
- When you write new code, always write new tests that go with it. Then run the new tests to make sure they pass.
- Aim for at least 90% test coverage.
- When fixing a bug, always update or add tests to reproduce the bug and verify that those tests fail before making code changes to fix the bug. Then rerun the tests to verify that the bug is fixed.

## Testing
- When testing frontend code, always use  `--watchAll=false` so that tests finish without waiting for additional console input.

### Running tests
- Use the project-provided top-level scripts to run tests so they run in a consistent environment and with the correct non-interactive flags.
  - Run backend tests: `./test-backend.sh`
  - Run frontend tests: `./test-frontend.sh`
  - Run both (recommended for CI and agents): `./test-all.sh`
- IMPORTANT: Agents must *only* use these scripts when running tests. Do not call `pytest`, `npm test`, or other test runners directly — use the scripts so the environment setup and flags are consistent across machines and CI.

### Testing etiquette: avoid noisy tests
- **Do not add tests that introduce console errors, warnings, or other noisy output when the test suite passes.** Tests should be quiet and deterministic in normal (passing) runs.
- **Mock external APIs used by components.** Components calling network endpoints (e.g., weekly targets, weather endpoints, tri-club schedule, selections) must have corresponding mocks in tests. Unhandled fetch calls commonly produce "Unknown endpoint" errors and console noise.
- **Wrap asynchronous state updates in `act(...)`.** When tests invoke callbacks that trigger component state changes, wrap the invocation in `act(async () => { ... })` to prevent React "not wrapped in act(...)" warnings.
- **Avoid asserting side effects that print to console unless explicitly mocking `console`**; if a test needs to assert logging behavior, mock `console.error`/`console.warn` and restore them afterward.
- **Examples of warnings to avoid:**
  - "Unknown endpoint" (unmocked fetch)
  - "An update to <Component> inside a test was not wrapped in act(...)" (missing act wrappers)
  - Any unexpected `console.error` / `console.warn` during a successful test run
- If you encounter noisy warnings during a test run, fix the test by adding proper mocks or `act(...)` wrappers rather than suppressing the warning globally.

## Markdown files
- Avoid numbering section headers in Markdown, because it makes it more difficult to add or remove sections (you have to change all the numbers of the other sections).
