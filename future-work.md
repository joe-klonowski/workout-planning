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

### Startup error in logs
There's an error in the logs that seems to happen on app startup, or possibly when the app starts receiving calls from the frontend. Error message is pasted below. Diagnose and fix it.

--- Logging error ---
Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 464, in format
    return self._format(record)
           ^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 460, in _format
    return self._fmt % values
           ~~~~~~~~~~^~~~~~~~
KeyError: 'request_id'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 1160, in emit
    msg = self.format(record)
          ^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 999, in format
    return fmt.format(record)
           ^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 706, in format
    s = self.formatMessage(record)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 675, in formatMessage
    return self._style.format(record)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 466, in format
    raise ValueError('Formatting field not found in record: %s' % e)
ValueError: Formatting field not found in record: 'request_id'
Call stack:
  File "/usr/lib/python3.12/threading.py", line 1030, in _bootstrap
    self._bootstrap_inner()
  File "/usr/lib/python3.12/threading.py", line 1073, in _bootstrap_inner
    self.run()
  File "/usr/lib/python3.12/threading.py", line 1010, in run
    self._target(*self._args, **self._kwargs)
  File "/usr/lib/python3.12/socketserver.py", line 692, in process_request_thread
    self.finish_request(request, client_address)
  File "/usr/lib/python3.12/socketserver.py", line 362, in finish_request
    self.RequestHandlerClass(request, client_address, self)
  File "/usr/lib/python3.12/socketserver.py", line 761, in __init__
    self.handle()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 398, in handle
    super().handle()
  File "/usr/lib/python3.12/http/server.py", line 436, in handle
    self.handle_one_request()
  File "/usr/lib/python3.12/http/server.py", line 424, in handle_one_request
    method()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 370, in run_wsgi
    execute(self.server.app)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 336, in execute
    write(b"")
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 271, in write
    self.send_response(code, msg)
  File "/usr/lib/python3.12/http/server.py", line 501, in send_response
    self.log_request(code)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 467, in log_request
    self.log("info", '"%s" %s %s', msg, code, size)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 478, in log
    _log(
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/_internal.py", line 97, in _log
    getattr(_logger, type)(message.rstrip(), *args, **kwargs)
Message: '127.0.0.1 - - [01/Feb/2026 16:28:27] "%s" %s %s'
Arguments: ('OPTIONS /api/auth/verify HTTP/1.1', '200', '-')
--- Logging error ---
Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 464, in format
    return self._format(record)
           ^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 460, in _format
    return self._fmt % values
           ~~~~~~~~~~^~~~~~~~
KeyError: 'request_id'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 1160, in emit
    msg = self.format(record)
          ^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 999, in format
    return fmt.format(record)
           ^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 706, in format
    s = self.formatMessage(record)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 675, in formatMessage
    return self._style.format(record)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 466, in format
    raise ValueError('Formatting field not found in record: %s' % e)
ValueError: Formatting field not found in record: 'request_id'
Call stack:
  File "/usr/lib/python3.12/threading.py", line 1030, in _bootstrap
    self._bootstrap_inner()
  File "/usr/lib/python3.12/threading.py", line 1073, in _bootstrap_inner
    self.run()
  File "/usr/lib/python3.12/threading.py", line 1010, in run
    self._target(*self._args, **self._kwargs)
  File "/usr/lib/python3.12/socketserver.py", line 692, in process_request_thread
    self.finish_request(request, client_address)
  File "/usr/lib/python3.12/socketserver.py", line 362, in finish_request
    self.RequestHandlerClass(request, client_address, self)
  File "/usr/lib/python3.12/socketserver.py", line 761, in __init__
    self.handle()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 398, in handle
    super().handle()
  File "/usr/lib/python3.12/http/server.py", line 436, in handle
    self.handle_one_request()
  File "/usr/lib/python3.12/http/server.py", line 424, in handle_one_request
    method()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 370, in run_wsgi
    execute(self.server.app)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 334, in execute
    write(data)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 271, in write
    self.send_response(code, msg)
  File "/usr/lib/python3.12/http/server.py", line 501, in send_response
    self.log_request(code)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 467, in log_request
    self.log("info", '"%s" %s %s', msg, code, size)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 478, in log
    _log(
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/_internal.py", line 97, in _log
    getattr(_logger, type)(message.rstrip(), *args, **kwargs)
Message: '127.0.0.1 - - [01/Feb/2026 16:28:27] "%s" %s %s'
Arguments: ('GET /api/auth/verify HTTP/1.1', '200', '-')
--- Logging error ---
Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 464, in format
    return self._format(record)
           ^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 460, in _format
    return self._fmt % values
           ~~~~~~~~~~^~~~~~~~
KeyError: 'request_id'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 1160, in emit
    msg = self.format(record)
          ^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 999, in format
    return fmt.format(record)
           ^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 706, in format
    s = self.formatMessage(record)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 675, in formatMessage
    return self._style.format(record)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 466, in format
    raise ValueError('Formatting field not found in record: %s' % e)
ValueError: Formatting field not found in record: 'request_id'
Call stack:
  File "/usr/lib/python3.12/threading.py", line 1030, in _bootstrap
    self._bootstrap_inner()
  File "/usr/lib/python3.12/threading.py", line 1073, in _bootstrap_inner
    self.run()
  File "/usr/lib/python3.12/threading.py", line 1010, in run
    self._target(*self._args, **self._kwargs)
  File "/usr/lib/python3.12/socketserver.py", line 692, in process_request_thread
    self.finish_request(request, client_address)
  File "/usr/lib/python3.12/socketserver.py", line 362, in finish_request
    self.RequestHandlerClass(request, client_address, self)
  File "/usr/lib/python3.12/socketserver.py", line 761, in __init__
    self.handle()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 398, in handle
    super().handle()
  File "/usr/lib/python3.12/http/server.py", line 436, in handle
    self.handle_one_request()
  File "/usr/lib/python3.12/http/server.py", line 424, in handle_one_request
    method()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 370, in run_wsgi
    execute(self.server.app)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 334, in execute
    write(data)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 271, in write
    self.send_response(code, msg)
  File "/usr/lib/python3.12/http/server.py", line 501, in send_response
    self.log_request(code)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 467, in log_request
    self.log("info", '"%s" %s %s', msg, code, size)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 478, in log
    _log(
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/_internal.py", line 97, in _log
    getattr(_logger, type)(message.rstrip(), *args, **kwargs)
Message: '127.0.0.1 - - [01/Feb/2026 16:28:27] "%s" %s %s'
Arguments: ('GET /api/auth/verify HTTP/1.1', '200', '-')
--- Logging error ---
Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 464, in format
    return self._format(record)
           ^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 460, in _format
    return self._fmt % values
           ~~~~~~~~~~^~~~~~~~
KeyError: 'request_id'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 1160, in emit
    msg = self.format(record)
          ^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 999, in format
    return fmt.format(record)
           ^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 706, in format
    s = self.formatMessage(record)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 675, in formatMessage
    return self._style.format(record)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 466, in format
    raise ValueError('Formatting field not found in record: %s' % e)
ValueError: Formatting field not found in record: 'request_id'
Call stack:
  File "/usr/lib/python3.12/threading.py", line 1030, in _bootstrap
    self._bootstrap_inner()
  File "/usr/lib/python3.12/threading.py", line 1073, in _bootstrap_inner
    self.run()
  File "/usr/lib/python3.12/threading.py", line 1010, in run
    self._target(*self._args, **self._kwargs)
  File "/usr/lib/python3.12/socketserver.py", line 692, in process_request_thread
    self.finish_request(request, client_address)
  File "/usr/lib/python3.12/socketserver.py", line 362, in finish_request
    self.RequestHandlerClass(request, client_address, self)
  File "/usr/lib/python3.12/socketserver.py", line 761, in __init__
    self.handle()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 398, in handle
    super().handle()
  File "/usr/lib/python3.12/http/server.py", line 436, in handle
    self.handle_one_request()
  File "/usr/lib/python3.12/http/server.py", line 424, in handle_one_request
    method()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 370, in run_wsgi
    execute(self.server.app)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 336, in execute
    write(b"")
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 271, in write
    self.send_response(code, msg)
  File "/usr/lib/python3.12/http/server.py", line 501, in send_response
    self.log_request(code)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 467, in log_request
    self.log("info", '"%s" %s %s', msg, code, size)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 478, in log
    _log(
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/_internal.py", line 97, in _log
    getattr(_logger, type)(message.rstrip(), *args, **kwargs)
Message: '127.0.0.1 - - [01/Feb/2026 16:28:27] "%s" %s %s'
Arguments: ('OPTIONS /api/workouts HTTP/1.1', '200', '-')
--- Logging error ---
Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 464, in format
    return self._format(record)
           ^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 460, in _format
    return self._fmt % values
           ~~~~~~~~~~^~~~~~~~
KeyError: 'request_id'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 1160, in emit
    msg = self.format(record)
          ^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 999, in format
    return fmt.format(record)
           ^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 706, in format
    s = self.formatMessage(record)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 675, in formatMessage
    return self._style.format(record)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 466, in format
    raise ValueError('Formatting field not found in record: %s' % e)
ValueError: Formatting field not found in record: 'request_id'
Call stack:
  File "/usr/lib/python3.12/threading.py", line 1030, in _bootstrap
    self._bootstrap_inner()
  File "/usr/lib/python3.12/threading.py", line 1073, in _bootstrap_inner
    self.run()
  File "/usr/lib/python3.12/threading.py", line 1010, in run
    self._target(*self._args, **self._kwargs)
  File "/usr/lib/python3.12/socketserver.py", line 692, in process_request_thread
    self.finish_request(request, client_address)
  File "/usr/lib/python3.12/socketserver.py", line 362, in finish_request
    self.RequestHandlerClass(request, client_address, self)
  File "/usr/lib/python3.12/socketserver.py", line 761, in __init__
    self.handle()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 398, in handle
    super().handle()
  File "/usr/lib/python3.12/http/server.py", line 436, in handle
    self.handle_one_request()
  File "/usr/lib/python3.12/http/server.py", line 424, in handle_one_request
    method()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 370, in run_wsgi
    execute(self.server.app)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 334, in execute
    write(data)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 271, in write
    self.send_response(code, msg)
  File "/usr/lib/python3.12/http/server.py", line 501, in send_response
    self.log_request(code)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 467, in log_request
    self.log("info", '"%s" %s %s', msg, code, size)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 478, in log
    _log(
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/_internal.py", line 97, in _log
    getattr(_logger, type)(message.rstrip(), *args, **kwargs)
Message: '127.0.0.1 - - [01/Feb/2026 16:28:27] "%s" %s %s'
Arguments: ('GET /api/weekly-targets HTTP/1.1', '200', '-')
--- Logging error ---
Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 464, in format
    return self._format(record)
           ^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 460, in _format
    return self._fmt % values
           ~~~~~~~~~~^~~~~~~~
KeyError: 'request_id'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 1160, in emit
    msg = self.format(record)
          ^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 999, in format
    return fmt.format(record)
           ^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 706, in format
    s = self.formatMessage(record)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 675, in formatMessage
    return self._style.format(record)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 466, in format
    raise ValueError('Formatting field not found in record: %s' % e)
ValueError: Formatting field not found in record: 'request_id'
Call stack:
  File "/usr/lib/python3.12/threading.py", line 1030, in _bootstrap
    self._bootstrap_inner()
  File "/usr/lib/python3.12/threading.py", line 1073, in _bootstrap_inner
    self.run()
  File "/usr/lib/python3.12/threading.py", line 1010, in run
    self._target(*self._args, **self._kwargs)
  File "/usr/lib/python3.12/socketserver.py", line 692, in process_request_thread
    self.finish_request(request, client_address)
  File "/usr/lib/python3.12/socketserver.py", line 362, in finish_request
    self.RequestHandlerClass(request, client_address, self)
  File "/usr/lib/python3.12/socketserver.py", line 761, in __init__
    self.handle()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 398, in handle
    super().handle()
  File "/usr/lib/python3.12/http/server.py", line 436, in handle
    self.handle_one_request()
  File "/usr/lib/python3.12/http/server.py", line 424, in handle_one_request
    method()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 370, in run_wsgi
    execute(self.server.app)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 336, in execute
    write(b"")
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 271, in write
    self.send_response(code, msg)
  File "/usr/lib/python3.12/http/server.py", line 501, in send_response
    self.log_request(code)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 467, in log_request
    self.log("info", '"%s" %s %s', msg, code, size)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 478, in log
    _log(
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/_internal.py", line 97, in _log
    getattr(_logger, type)(message.rstrip(), *args, **kwargs)
Message: '127.0.0.1 - - [01/Feb/2026 16:28:27] "%s" %s %s'
Arguments: ('OPTIONS /api/tri-club-schedule HTTP/1.1', '200', '-')
--- Logging error ---
Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 464, in format
    return self._format(record)
           ^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 460, in _format
    return self._fmt % values
           ~~~~~~~~~~^~~~~~~~
KeyError: 'request_id'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 1160, in emit
    msg = self.format(record)
          ^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 999, in format
    return fmt.format(record)
           ^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 706, in format
    s = self.formatMessage(record)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 675, in formatMessage
    return self._style.format(record)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 466, in format
    raise ValueError('Formatting field not found in record: %s' % e)
ValueError: Formatting field not found in record: 'request_id'
Call stack:
  File "/usr/lib/python3.12/threading.py", line 1030, in _bootstrap
    self._bootstrap_inner()
  File "/usr/lib/python3.12/threading.py", line 1073, in _bootstrap_inner
    self.run()
  File "/usr/lib/python3.12/threading.py", line 1010, in run
    self._target(*self._args, **self._kwargs)
  File "/usr/lib/python3.12/socketserver.py", line 692, in process_request_thread
    self.finish_request(request, client_address)
  File "/usr/lib/python3.12/socketserver.py", line 362, in finish_request
    self.RequestHandlerClass(request, client_address, self)
  File "/usr/lib/python3.12/socketserver.py", line 761, in __init__
    self.handle()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 398, in handle
    super().handle()
  File "/usr/lib/python3.12/http/server.py", line 436, in handle
    self.handle_one_request()
  File "/usr/lib/python3.12/http/server.py", line 424, in handle_one_request
    method()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 370, in run_wsgi
    execute(self.server.app)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 334, in execute
    write(data)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 271, in write
    self.send_response(code, msg)
  File "/usr/lib/python3.12/http/server.py", line 501, in send_response
    self.log_request(code)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 467, in log_request
    self.log("info", '"%s" %s %s', msg, code, size)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 478, in log
    _log(
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/_internal.py", line 97, in _log
    getattr(_logger, type)(message.rstrip(), *args, **kwargs)
Message: '127.0.0.1 - - [01/Feb/2026 16:28:27] "%s" %s %s'
Arguments: ('GET /api/weekly-targets HTTP/1.1', '200', '-')
--- Logging error ---
Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 464, in format
    return self._format(record)
           ^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 460, in _format
    return self._fmt % values
           ~~~~~~~~~~^~~~~~~~
KeyError: 'request_id'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 1160, in emit
    msg = self.format(record)
          ^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 999, in format
    return fmt.format(record)
           ^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 706, in format
    s = self.formatMessage(record)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 675, in formatMessage
    return self._style.format(record)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 466, in format
    raise ValueError('Formatting field not found in record: %s' % e)
ValueError: Formatting field not found in record: 'request_id'
Call stack:
  File "/usr/lib/python3.12/threading.py", line 1030, in _bootstrap
    self._bootstrap_inner()
  File "/usr/lib/python3.12/threading.py", line 1073, in _bootstrap_inner
    self.run()
  File "/usr/lib/python3.12/threading.py", line 1010, in run
    self._target(*self._args, **self._kwargs)
  File "/usr/lib/python3.12/socketserver.py", line 692, in process_request_thread
    self.finish_request(request, client_address)
  File "/usr/lib/python3.12/socketserver.py", line 362, in finish_request
    self.RequestHandlerClass(request, client_address, self)
  File "/usr/lib/python3.12/socketserver.py", line 761, in __init__
    self.handle()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 398, in handle
    super().handle()
  File "/usr/lib/python3.12/http/server.py", line 436, in handle
    self.handle_one_request()
  File "/usr/lib/python3.12/http/server.py", line 424, in handle_one_request
    method()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 370, in run_wsgi
    execute(self.server.app)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 334, in execute
    write(data)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 271, in write
    self.send_response(code, msg)
  File "/usr/lib/python3.12/http/server.py", line 501, in send_response
    self.log_request(code)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 467, in log_request
    self.log("info", '"%s" %s %s', msg, code, size)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 478, in log
    _log(
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/_internal.py", line 97, in _log
    getattr(_logger, type)(message.rstrip(), *args, **kwargs)
Message: '127.0.0.1 - - [01/Feb/2026 16:28:27] "%s" %s %s'
Arguments: ('GET /api/tri-club-schedule HTTP/1.1', '200', '-')
/home/joeklonowski/workout-planning/backend/models.py:89: SAWarning: Multiple rows returned with uselist=False for lazily-loaded attribute 'Workout.selection'
  'selection': self.selection.to_dict() if self.selection else None
--- Logging error ---
Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 464, in format
    return self._format(record)
           ^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 460, in _format
    return self._fmt % values
           ~~~~~~~~~~^~~~~~~~
KeyError: 'request_id'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 1160, in emit
    msg = self.format(record)
          ^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 999, in format
    return fmt.format(record)
           ^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 706, in format
    s = self.formatMessage(record)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 675, in formatMessage
    return self._style.format(record)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/logging/__init__.py", line 466, in format
    raise ValueError('Formatting field not found in record: %s' % e)
ValueError: Formatting field not found in record: 'request_id'
Call stack:
  File "/usr/lib/python3.12/threading.py", line 1030, in _bootstrap
    self._bootstrap_inner()
  File "/usr/lib/python3.12/threading.py", line 1073, in _bootstrap_inner
    self.run()
  File "/usr/lib/python3.12/threading.py", line 1010, in run
    self._target(*self._args, **self._kwargs)
  File "/usr/lib/python3.12/socketserver.py", line 692, in process_request_thread
    self.finish_request(request, client_address)
  File "/usr/lib/python3.12/socketserver.py", line 362, in finish_request
    self.RequestHandlerClass(request, client_address, self)
  File "/usr/lib/python3.12/socketserver.py", line 761, in __init__
    self.handle()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 398, in handle
    super().handle()
  File "/usr/lib/python3.12/http/server.py", line 436, in handle
    self.handle_one_request()
  File "/usr/lib/python3.12/http/server.py", line 424, in handle_one_request
    method()
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 370, in run_wsgi
    execute(self.server.app)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 334, in execute
    write(data)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 271, in write
    self.send_response(code, msg)
  File "/usr/lib/python3.12/http/server.py", line 501, in send_response
    self.log_request(code)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 467, in log_request
    self.log("info", '"%s" %s %s', msg, code, size)
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/serving.py", line 478, in log
    _log(
  File "/home/joeklonowski/workout-planning/backend/venv/lib/python3.12/site-packages/werkzeug/_internal.py", line 97, in _log
    getattr(_logger, type)(message.rstrip(), *args, **kwargs)
Message: '127.0.0.1 - - [01/Feb/2026 16:28:27] "%s" %s %s'
Arguments: ('GET /api/workouts HTTP/1.1', '200', '-')
