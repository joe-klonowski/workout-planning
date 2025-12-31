# workout-planning

App and tools for planning workouts. This is a React-based webapp for importing, viewing, managing, and exporting workout plans from TrainingPeaks.

## Project Overview

This project is a small web application designed to help athletes manage their workout plans. It provides a workflow for importing structured workout plans from TrainingPeaks (via CSV export), visualizing them in a calendar view, selectively choosing which workouts to perform, and exporting the final plan to fitness devices/platforms.

Currently, the app isn't finished, we're working through iteratively adding features.

## Core Workflow

1. **Import**: Download workout plans as CSV files from TrainingPeaks
2. **View**: Display planned workouts in a calendar view in the webapp
3. **Select**: Choose which workouts to do and which to skip
4. **Filter**: View only selected workouts (hide skipped ones)
5. **Extend**: Add custom workouts (e.g., recurring group rides)
6. **Summarize**: Review weekly summaries of planned workouts
7. **Export**: Send the final plan to Garmin Connect and/or Hammerhead

## Data Format

### Input: TrainingPeaks CSV
See `inputs/workouts.csv` for an example. Key fields:
- `Title`: Name of the workout
- `WorkoutType`: Category (Swim, Run, Strength, Cycling, etc.)
- `WorkoutDescription`: Detailed instructions and notes from coach
- `PlannedDuration`: Expected workout length (in hours)
- `PlannedDistanceInMeters`: Target distance (optional, varies by sport)
- `WorkoutDay`: Planned date (YYYY-MM-DD format)
- `CoachComments`: Additional notes from the coach
- Additional fields: TSS, IF, and various power/heart rate zones (metadata)

## Technology Stack

- **Frontend**: React (created with create-react-app)
- **Styling**: CSS (initial), may migrate to CSS-in-JS or Tailwind
- **State Management**: React hooks (useState/useContext initially), may add Redux if needed
- **Storage**: Browser localStorage (MVP), backend/database (possible later addition)
- **Build/Dev**: npm, create-react-app scripts

## Project Structure

```
workout-planning/
├── README.md                    # This file
├── app/                         # React web application
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   └── src/
│       ├── App.js               # Main app component
│       ├── App.css              # App styles
│       ├── index.js             # React entry point
│       ├── index.css            # Global styles
│       ├── App.test.js
│       ├── reportWebVitals.js
│       └── setupTests.js
└── inputs/
    └── workouts.csv             # Example TrainingPeaks export
```

## Development Guidelines

- Component-based architecture: Create reusable components for calendar, workout card, filters, etc.
- Keep state management simple initially; refactor if complexity grows
- Write tests for critical features (CSV parsing, filtering, calculations)

