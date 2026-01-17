# ESLint Summary — repo: workout-planning ✅

**Date:** 2026-01-17

## TL;DR
- Total ESLint problems found in `app/src`: **503** (after running `eslint --fix`, 1 fix applied).
- Most problems are in **tests**, dominated by Testing Library rules (`testing-library/*`).

---

## Key findings 🔎
- **Top rule groups (by count):**
  - `testing-library/no-node-access` — **339**
  - `testing-library/no-container` — **93**
  - `testing-library/no-wait-for-multiple-assertions` — **26**
  - `no-unused-vars` — **15**
  - `testing-library/no-unnecessary-act` — **11**
  - `jest/no-conditional-expect` — **9**
  - `testing-library/no-wait-for-side-effects` — **7**
  - `testing-library/render-result-naming-convention` — **2**
  - `import/first` — **1**
  - `testing-library/prefer-screen-queries` — **1**

- **Top files (most messages):**
  1. `app/src/components/Calendar.test.js` — **210**
  2. `app/src/components/WeeklySummary.test.js` — **65**
  3. `app/src/components/WorkoutBadge.test.js` — **47**
  4. `app/src/components/CalendarDay.test.js` — **36**
  5. `app/src/components/DayTimeSlot.test.js` — **30**
  6. `app/src/components/WorkoutDetailModal.test.js` — **21**
  7. `app/src/components/CalendarHeader.test.js` — **21**
  8. `app/src/components/ImportWorkoutModal.test.js` — **18**
  9. `app/src/components/CalendarGrid.test.js` — **16**
 10. `app/src/components/WeatherWidget.test.js` — **15**

---

## Short analysis & context 💡
- The bulk of violations are **Testing Library** recommendations (avoid `container` / direct DOM access, don't wrap queries in `act`, prefer `screen` queries, and avoid complex `waitFor` callbacks).
- A smaller set are standard JS issues (`no-unused-vars`, `import/first`) and a few `jest` rules.
- Per repository guidance (`future-work.md`/`AGENTS.md`), tests should be quiet and deterministic — fixing these rules will both clean lint and reduce test flakiness/noise.

---

## How to reproduce / commands used 🔧
Run from repository root:

```bash
cd app
# produce unix-format report
npx eslint "src/**/*.{js,jsx}" -f unix || true
# (I parsed the unix output to build counts.)
```

The counts in this report were computed by parsing the unix formatter output (`eslint-unix.txt`) and tallying rule IDs and file paths.

---

## Recommended next steps (short) ✅
1. Add `lint` and `lint:fix` scripts to `app/package.json` and run `npm run lint:fix` to auto-fix trivial issues.
2. Prioritize fixes for the **Testing Library** rules (replace `container`/`querySelector` with `screen`/`within`, split `waitFor` assertions, remove unnecessary `act`).
3. Fix `no-unused-vars` and small `jest` rules as follow-up PRs.
4. Add lint to CI and a pre-commit hook (husky + lint-staged) to prevent regressions.
5. Document any intentional rule exceptions in `docs/lint-rules.md`.

---

If you want, I can open a PR that adds `lint`/`lint:fix` scripts and runs `--fix`, then follow up by fixing the top Testing Library issues file-by-file.

