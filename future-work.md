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
- I've noticed that some workouts, when imported, get duplicated. That is, the data model updates to include both the workout that WAS in the plan and also the workout that was actually completed. Fix this. Possibly the matching logic that matches planned workout to completed workouts just needs to be tweaked. Currently the only workout where I've noticed this problem is a strength workout. So maybe there's something about strength workouts specifically that needs to be fixed.

### Calendar export

The calendar export feature doesn't work super well in production. It seems like, when it exports a week of workouts, it frequently only exports like 5 or 6 days and the rest don't get exported.

It seems to work fine locally.

Here's the related logs from production when this error occurred:

```
2026-02-01 21:36:25,553 - config - INFO - Reading CalDAV credentials - URL: set, Username: set, Password: set, Calendar Name: Joe workouts
2026-02-01 21:36:25,553 - app - INFO - Retrieved CalDAV credentials - URL: https://caldav.icloud.com/, Username: joeklonowski@gmail.com, Password: ***, Calendar Name: Joe workouts
/app/backend/app.py:770: SAWarning: Multiple rows returned with uselist=False for lazily-loaded attribute 'Workout.selection' 
  if workout.selection and not workout.selection.is_selected:
2026-02-01 21:36:26,201 - caldav_client - INFO - Successfully connected to CalDAV server at https://caldav.icloud.com/
2026-02-01 21:36:27,333 - caldav_client - INFO - Selected calendar: Joe workouts
 SUMMARY:Joe workout schedule
 DESCRIPTION:- Afternoon run, 45 minutes\n- Morning strength (indoor), 45 minutes
+DTSTAMP:20260201T213631Z
 END:VEVENT
2026-02-01 21:36:31,982 - caldav_client - INFO - Deleted 5 workout events in range 2026-02-02 to 2026-02-08
 END:VCALENDAR
2026-02-01 21:36:31,982 - app - INFO - Deleted 5 existing workout events in range 2026-02-02 to 2026-02-08
 
2026-02-01 21:36:31,982 - caldav_client - ERROR - Failed to create event for 2026-02-02: 'NoneType' object has no attribute 'capitalize'
2026-02-01 21:36:31,982 - caldav_client - ERROR - Failed to create event for 2026-02-06: 'NoneType' object has no attribute 'capitalize'
2026-02-01 21:36:31,982 - caldav - WARNING - Ical data was modified to avoid compatibility issues
(Your calendar server breaks the icalendar standard)
This is probably harmless, particularly if not editing events or tasks
(error count: 1 - this error is ratelimited)
--- 
+++ 
@@ -7,6 +7,7 @@
 DTEND;VALUE=DATE:20260209
 DESCRIPTION:- Morning bike, 1 hour
2026-02-01 21:36:32,546 - caldav_client - INFO - Created workout event for 2026-02-08
2026-02-01 21:36:32,547 - caldav - WARNING - Ical data was modified to avoid compatibility issues
+DTSTAMP:20260201T213632Z
(Your calendar server breaks the icalendar standard)
 END:VEVENT
 END:VCALENDAR
This is probably harmless, particularly if not editing events or tasks
 
(error count: 2 - this error is ratelimited)
--- 
+++ 
@@ -7,6 +7,7 @@
 DTEND;VALUE=DATE:20260204
 SUMMARY:Joe workout schedule
2026-02-01 21:36:33,175 - caldav_client - INFO - Created workout event for 2026-02-03
2026-02-01 21:36:33,901 - caldav_client - INFO - Created workout event for 2026-02-04
2026-02-01 21:36:33,901 - caldav - WARNING - Ical data was modified to avoid compatibility issues
(Your calendar server breaks the icalendar standard)
This is probably harmless, particularly if not editing events or tasks
(error count: 4 - this error is ratelimited)
--- 
+++ 
@@ -7,6 +7,7 @@
 DTEND;VALUE=DATE:20260206
 SUMMARY:Joe workout schedule
 DESCRIPTION:- Morning strength, 45 minutes\n- Morning swim, 51 minutes\n- Evening run, 53 minutes
+DTSTAMP:20260201T213633Z
 END:VEVENT
 END:VCALENDAR
 
2026-02-01 21:36:34,548 - caldav_client - INFO - Created workout event for 2026-02-05
2026-02-01 21:36:35,238 - caldav_client - INFO - Created workout event for 2026-02-07
2026-02-01 21:36:35,238 - caldav_client - INFO - Exported 5 workout events to calendar
2026-02-01 21:36:35,238 - caldav_client - INFO - Disconnected from CalDAV server
100.64.0.3 - - [01/Feb/2026:21:36:35 +0000] "POST /api/export/calendar HTTP/1.1" 200 778 "https://workout-planning-production.up.railway.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0"
```
