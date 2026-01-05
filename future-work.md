## High-level plan
I'm the only user of this app (for now, probably forever). I get workouts from a few different places. Most of the workouts come from another app called TrainingPeaks. TrainingPeaks has two types of workouts: from Joe Friel, who's a coach, and from my local triathlon club and its coach. Those workouts get combined into a csv file like workouts.csv and imported into this app.

Friel's advice is to:

- Adjust his workout plan based on my schedule (e.g. shift workouts over by a day or two).
- Adjust his workout plan because we've agreed some weeks I'll want to train for fewer hours than his plan recommends. So likely I'll want to plan NOT to do some of his workouts for this reason.
- Adjust his workout plan to substitute workouts with friends or groups that I train with. That's where the local triathlon club comes in. I also have an unstructured group ride that I do weekly that'll probably sub in for some of the bike workouts -- that's not in any of this data, yet, but I'll add it later.

So some of the future feature work here is to enable that plan.

## Specific app features to add
- Allow user to set order of workouts within a drop zone. If the user is dropping a workout into a zone that already has one or more workouts, they should be able to drop it into the top, bottom, or somewhere in between depending on where they release it.
- Import more workouts from new TrainingPeaks CSVs and "merge" them with existing plan.
  - Will require some way to deduplicate workouts in the new CSV with workouts in the existing plan. This will be tricky for workouts where the athlete/user has changed the planned date of the workout.
- Identify and visually distinguish between workouts from Friel vs tri club vs other.
- Add ability to filter workouts in the view depending on source (Friel vs tri club vs other).
- Allow user to select a specific time like 7:30am in the workout details modal.
- Allow user to filter the UI to:
  - Temporarily hide unplanned workouts.
  - Maybe we want to temporarily hide planned workouts also?
- Summarize how much the user is planning to do each week.
- Add support for mobile.
- Show weather forecast in calendar.
  - I'm in Chicago and I'm the only one who's going to use this. So we should use weather in Chicago. Specifically at or near this lat/long location: 41.795604164195446, -87.57838836383468
  - Each time group slot in the calendar (e.g. Monday morning) should display a small icon for weather (e.g. rain icon, sun icon, wind icon, storm icon), and temperature in Fahrenheit, probability of rain or snow, and a wind speed and direction. Keep all this nice and small.
- Show relevant sports in calendar? For planning indoor bike workouts where I'll want something good to watch on TV.

## Look/feel/CSS
- Weekly summary on the right needs a bunch of CSS tweaks.
- Add first bit of description to workout card.
- When date cell fills, don't limit the height of the date cell and force user to scroll to find workouts. Instead, just make the date cell longer to fit everything.


## Integrations with other apps/platforms
- Import past workout data from Strava, TrainingPeaks, or Garmin (probably via API?)
- Export to other platforms such as Garmin Connect or Hammerhead.

## Devops
- Deploy app to an actual website that can be accessed from the public internet (currently localhost only).
  - Planning on using Railway

## Testing
- Consider adding contract tests for the API boundary between the frontend and backend.
- Add end-to-end tests using something like selenium that can run in the browser or a headless browser.
  - Hopefully that Copilot can use so that these tests can be useful to copilot as well as human developers.

## Tech debt
- Copilot seems to have a bad habit of picking very old versions of tools. Look at the dependencies and update them.
- Calendar.js class is getting pretty God-like. Refactor it into smaller parts. Likely the best first cut is to create a separate component/UI element to represent a single day.
- Some workouts use different endpoints for different operations depending on whether they're created custom or not. This seems bad. For example see handleWorkoutDateChange function in App.js. Refactor so that all workouts are stored in the same table in the DB and use the same CRUD API enpoints regardless of whether they're custom workouts or whether they were in the input data set (from a coach).
  - All workouts should go in the workout table in the DB.
  - Remove custom workout table in the DB and associated CRUD endpoints.
  - No change in user-facing functionality.
    - Operations like "change time slot of workout" should use the same endpoint and the same logic regardless of whether the workout was in the original input data set or whether it was created by the user/UI.

## Other
- Create separate documentation files for users and developers (currently this is all grouped together in README.md).
