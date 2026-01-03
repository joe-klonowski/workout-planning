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
- Show relevant sports in calendar? For planning indoor bike workouts where I'll want something good to watch on TV.
- Add support for exporting workout plan. Send the plan to Apple Calendar using CalDAV and python's caldav library. This is so that my wife can see the workout plan. She said that this Apple Calendar was her preferred way to see it.
  - There should be a button on the calendar to export to Apple calendar.
    - This button should be in the summary column at the end of the week.
    - This button should pop open a modal.
      - The modal should have confirm and cancel buttons that do what you'd expect.
      - The modal should have a date range picker that selects the date range to export.
      - By default the date range picker should select the one week that corresponds to the week that the user selected when they clicked the button in the calendar.
  - Format for sending data to calendar:
    - For each day that has one or more workouts, create an all day event.
    - The event name should be "Joe workout schedule"
    - The "notes" field in the calendar event should list workouts for that day. In the description of each workout, include:
      - Workout type (e.g. swim, bike, run).
      - Workout location, if any
      - Workout time of day (e.g. morning, afternoon, evening)
      - Workout duration (e.g. 1 hour 30 minutes)

## Look/feel/CSS
- Add summary of the week on the right with:
  - Number of hours
  - Duration for swim, bike, run, and strength training
  - Distance for swim and run
  - If/when the app has data on completed workouts, add bars that show completion percentage.
- Add first bit of description to workout card.
- When date cell fills, don't limit the height of the date cell and force user to scroll to find workouts. Instead, just make the date cell longer to fit everything.


## Integrations with other apps/platforms
- Import past workout data from Strava (probably via API?)
- Export to other platforms such as Garmin Connect or Hammerhead.
- Export to calendar apps. Likely start with my personal apple cal and or my family calendar which is a subscription/shared apple calendar.

## Devops
- Deploy app to an actual website that can be accessed from the public internet (currently localhost only).

## Testing
- Consider adding contract tests for the API boundary between the frontend and backend.
- Add end-to-end tests using something like selenium that can run in the browser or a headless browser.
  - Hopefully that Copilot can use so that these tests can be useful to copilot as well as human developers.

## Other
- Create separate documentation files for users and developers (currently this is all grouped together in README.md).
