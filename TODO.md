## Functionality
- Identify and visually distinguish between workouts from Friel vs tri club vs other.
- Allow user to schedule workouts for a time of day (e.g. "morning" or "7am").
  - Probably this will require creating separate fields for:
    - When the coach originally planned the workout (DateOnly datatype).
    - When the athlete is planning to do the workout (can be something general like "Tuesday" or "Tuesday morning" or something more specific like "Tuesday 7am")
- Allow user to move workouts to a different day and different time of day.
- Allow user to pick and choose which workouts they're going to plan to do or not do.
  - Temporarily hide workouts the user isn't planning to do.
  - Summarize how much the user is planning to do each week.
- Add support for mobile
- Export to other platforms such as Garmin Connect or Hammerhead.

## Infra/architecture
- May want to add a DB migration manager like SQLAlchemy
- Deploy app to an actual website that can be accessed from the public internet (currently localhost only).

## Testing
- Add end-to-end tests using something like selenium that can run in the browser or a headless browser.
  - Hopefully that Copilot can use so that these tests can be useful to copilot as well as human developers.
- Add a script that can run ALL THE TESTS in a single command, including:
  - Backend tests (pytest)
    - Including handling the venv setup
  - Frontend tests (npm test)
  - Selenium if that's added by this stage

## Copilot/Agentic coding related
- Add instructions specifying my preferences for how AI coding agents should do work on this repo.
  - Ask it to do some version of TDD: when you see a bug, write a test that reproduces it first, then fix the bug, then verify by running the test.
  - Ask it to remove items from TODO.md as it completes them.
  - Include a list of files that agents should always read and load into context before doing anything else.

## Other
- Create separate documentation files for users and developers (currently this is all grouped together in README.md).
