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
- Allow user to select a specific time like 7:30am in the workout details modal.
- Allow user to filter the UI to:
  - Temporarily hide unplanned workouts.
  - Maybe we want to temporarily hide planned workouts also?
- Summarize how much the user is planning to do each week.
- Show relevant sports in calendar? For planning indoor bike workouts where I'll want something good to watch on TV.

- Completed workouts should show actual duration instead of planned duration.
- Workouts with no title should get a default title.
- Add TSS badge to future workouts.
  - This is the planned or expected TSS number for the workout.
  - Style should be similar to past workouts.
  - Workouts that have no TSS score yet should display "NO TSS" in the badge.
  - User should be able to click on TSS to change and save TSS (enter a number).
  - Form to enter and save TSS should save when the user presses enter.
  - Update the weekly summary TSS section to have 3 TSS numbers:
    - Completed TSS (sum of TSS of completed workouts in that week).
    - Projected TSS (completed TSS plus sum of expected TSS of planned workouts in that week).
      - This number should NOT include TSS for deselected workouts.
    - Friel target TSS.

- In the frontend, the weather and tri club schedule currently load before the workouts. If possible, we should load the workouts first. Most of the time that's what the user's most interested in. Of course, if launching all the requests in parallel does NOT slow down the workout loading significantly, then it's OK if the other stuff loads first. To the extent that there's contention on backend resources, the backend resources should prioritize making sure the workouts load quickly.

## Look/feel/CSS
- Weekly summary on the right needs a bunch of CSS tweaks.
- Add first bit of description to workout card.


## Integrations with other apps/platforms
- Export to other platforms such as Garmin Connect or Hammerhead.
- Import from TrainingPeaks UI feature should save the CSV file to local storage on the backend, so that I can easily inspect it later. Probably this means we need a directory to hold these import files and a structure and naming schemes in that directory to be able to easily tell when each file was imported and which file is the most recent.

## Testing
- Consider adding contract tests for the API boundary between the frontend and backend.
- Add end-to-end tests using something like selenium that can run in the browser or a headless browser.
  - Hopefully that Copilot can use so that these tests can be useful to copilot as well as human developers.

## Tech debt
- Copilot seems to have a bad habit of picking very old versions of tools. Look at the dependencies and update them.
- Remove temporary `# type: ignore` annotations added to silence Pylance/Pyright in files such as `backend/app.py` and `backend/config.py`. Instead, configure Pylance/Pyright to use the project's virtual environment and fix the underlying import/type issues so the ignores are no longer necessary. (Low priority tech-debt task)

## Known issues
- I've noticed that some workouts, when imported, get duplicated. That is, the data model updates to include both the workout that WAS in the plan and also the workout that was actually completed. Fix this. Possibly the matching logic that matches planned workout to completed workouts just needs to be tweaked. Currently the only workout where I've noticed this problem is a strength workout. So maybe there's something about strength workouts specifically that needs to be fixed.

### Logging in prod
Logging in prod seems to not log request IDs correctly.

Example log from prod:

100.64.0.2 - - [02/Feb/2026:04:27:59 +0000] "PUT /api/selections/64 HTTP/1.1" 200 177 "https://workout-planning-production.up.railway.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0" - request_id={X-Request-ID}o
