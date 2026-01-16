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
- Show relevant sports in calendar? For planning indoor bike workouts where I'll want something good to watch on TV.
- Show "feels like" (called "apparent temperature" in Open Meteo API) temperatures instead of actual temperatures.
- Add TSS (training stress score) for completed workouts.
  - Workout cards for completed workouts should display the training stress score (or TSS) in a small badge in the lower right of the workout card.
  - Workout detail modal for completed workouts should display TSS.

## Look/feel/CSS
- Weekly summary on the right needs a bunch of CSS tweaks.
- Add first bit of description to workout card.
- When date cell fills, don't limit the height of the date cell and force user to scroll to find workouts. Instead, just make the date cell longer to fit everything.
- When the app first loads, it makes a bunch of calls to the weather API and then eventually updates all the weather-related components in the frontend one by one as the API returns the necessary data. This is fine and good, except that those components seem to have different size in "waiting for weather data" mode and "have weather data and displaying it" mode. That means that the layout is constantly jumping around as weather widgets update, which is visually distracting and might cause misclicks if the user tries to click on a component while it's moving because of this behavior. Fix this so that the weather widgets are the same size regardless of whether they're waiting for weather data or have weather data.


## Integrations with other apps/platforms
- Export to other platforms such as Garmin Connect or Hammerhead.
- Import from TrainingPeaks UI feature should save the CSV file to local storage on the backend, so that I can easily inspect it later. Probably this means we need a directory to hold these import files and a structure and naming schemes in that directory to be able to easily tell when each file was imported and which file is the most recent.

## Testing
- Consider adding contract tests for the API boundary between the frontend and backend.
- Add end-to-end tests using something like selenium that can run in the browser or a headless browser.
  - Hopefully that Copilot can use so that these tests can be useful to copilot as well as human developers.

## Tech debt
- Copilot seems to have a bad habit of picking very old versions of tools. Look at the dependencies and update them.

## Known issues
- Sometimes dragging workouts around to new time slots causes an error popup in the UI. It seems that refreshing the page fixes the problem and puts the workout where it was dragged to. I can reproduce this very consistently in prod but can't repro in the dev environment.
  - Expected behavior: workouts drag and drop to new time slots without problems.
  - Actual behavior: when you drag a workout to a new time slot, it frequently does not move to the new time slot, it stays at the previous one. Sometimes it takes a very long time to move to the new time slot after dragging. If you refresh the page before the workout card moves, you see an error message in the UI.

## Hooks
- Make precommit hook run only when relevant code or tests change. Don't run precommit hook if, for example, only documentation files changed. For now the precommit hook only checks frontend stuff, so don't run it if only backend code changed.

## Other
- Create separate documentation files for users and developers (currently this is all grouped together in README.md).
