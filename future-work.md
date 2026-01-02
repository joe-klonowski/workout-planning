## App features
- Import more workouts from new TrainingPeaks CSVs and "merge" them with existing plan.
  - Will require some way to deduplicate workouts in the new CSV with workouts in the existing plan. This will be tricky for workouts where the athlete/user has changed the planned date of the workout.
- Identify and visually distinguish between workouts from Friel vs tri club vs other.
- Add ability to filter workouts in the view depending on source (Friel vs tri club vs other).
- Allow user to schedule workouts for a time of day (e.g. "morning" or "7am").
  - Probably this will require creating separate fields for:
    - When the coach originally planned the workout (DateOnly datatype).
    - When the athlete is planning to do the workout (can be something general like "Tuesday" or "Tuesday morning" or something more specific like "Tuesday 7am")
- Allow user to move workouts to a different day and different time of day.
- Allow user to pick and choose which workouts they're going to plan to do or not do.
  - Temporarily hide workouts the user isn't planning to do.
  - Summarize how much the user is planning to do each week.
- Add support for mobile

## Integrations with other apps/platforms
- Import past workout data from Strava (probably via API?)
- Export to other platforms such as Garmin Connect or Hammerhead.
- Export to calendar apps. Likely start with my personal apple cal and or my family calendar which is a subscription/shared apple calendar.

## Architecture/design
- I (Joe, the owner of this code base) suspect that a coding agent has created a table in the DB that may be unneeded. Find out more about the current DB schema and consider changes as appropriate.

## Devops
- Deploy app to an actual website that can be accessed from the public internet (currently localhost only).

## Testing
- Consider adding contract tests for the API boundary between the frontend and backend.
- Add end-to-end tests using something like selenium that can run in the browser or a headless browser.
  - Hopefully that Copilot can use so that these tests can be useful to copilot as well as human developers.
- Add a script that can run ALL THE TESTS in a single command, including:
  - Backend tests (pytest)
    - Including handling the venv setup
  - Frontend tests (npm test)
  - Selenium if that's added by this stage

## Other
- Create separate documentation files for users and developers (currently this is all grouped together in README.md).
