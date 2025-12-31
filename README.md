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

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
```bash
cd app
npm install
```

### Running the App
```bash
cd app
npm start
```

This starts the development server at `http://localhost:3000`. The app will automatically reload when you make changes.

### Running Tests
```bash
cd app
npm test
```

This launches the test runner in interactive watch mode. Press `q` to quit or use these commands:
- `a` - Run all tests
- `p` - Filter tests by filename pattern
- `t` - Filter tests by test name
- `q` - Quit

#### Run Tests Once (CI Mode)
```bash
cd app
npm test -- --watchAll=false
```

#### Run Specific Test Files
```bash
cd app
npm test -- --testPathPattern="csvParser.test.js" --watchAll=false
npm test -- --testPathPattern="Calendar.test.js" --watchAll=false
npm test -- --testPathPattern="WorkoutCard.test.js" --watchAll=false
```

#### Run All Tests
```bash
cd app
npm test -- --testPathPattern="(csvParser|Calendar|WorkoutCard).test.js" --watchAll=false
```

### Building for Production
```bash
cd app
npm run build
```

This creates an optimized production build in the `app/build` folder.

## Data Format

### Input: TrainingPeaks CSV
See `inputs/workouts.csv` for an example. Key fields:
- `Title`: Name of the workout
- `WorkoutType`: Category (Swim, Run, Strength, Cycling, etc.)
- `WorkoutDescription`: Detailed instructions and notes from coach
- `PlannedDuration`: Expected workout length (in hours)
- `PlannedDistanceInMeters`: Target distance in meters (optional, varies by sport)
- `WorkoutDay`: Planned date (YYYY-MM-DD format)
- `CoachComments`: Additional notes from the coach
- Additional fields: TSS, IF, and various power/heart rate zones (metadata)

### Distance Display Format
The app displays distances in user-friendly units based on the workout type:
- **Swim workouts**: Displayed in **yards**
- **Run workouts**: Displayed in **miles**
- **Cycling workouts**: Displayed in **miles**

Internal data is stored in meters (as provided by TrainingPeaks), but converted for display.

### Workout Date Handling and Timezones
**Important**: Workout dates represent calendar days without timezone information. A workout scheduled for "January 15" should be completed on January 15 in the athlete's local timezone, regardless of where the coach is located.

**Implementation**: Workout dates use the `DateOnly` class (`src/utils/DateOnly.js`) which stores year, month, and day as separate integers with no timezone attachment.

**Why DateOnly?**
- JavaScript's `Date` object always includes timezone information, which can cause dates to shift when parsed or displayed across different timezones
- DateOnly represents the coaching intent literally: "Do this workout on January 15" means January 15, regardless of what time zone the athlete is in.
- No timezone conversions, no ambiguity, no DST issues

## Technology Stack

- **Frontend**: React (created with create-react-app)
- **Styling**: CSS (initial), may migrate to CSS-in-JS or Tailwind
- **State Management**: React hooks (useState/useContext initially), may add Redux if needed
- **Storage**: Browser localStorage (MVP), backend/database (possible later addition)
- **Build/Dev**: npm, create-react-app scripts
- **Date Handling**: Custom `DateOnly` class for timezone-independent dates

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
│       ├── setupTests.js
│       ├── components/          # React components
│       ├── utils/
│       │   ├── DateOnly.js      # Timezone-independent date class
│       │   └── csvParser.js     # CSV parsing utilities
│       └── styles/              # Component styles
└── inputs/
    └── workouts.csv             # Example TrainingPeaks export
```

## Development Guidelines

- Component-based architecture: Create reusable components for calendar, workout card, filters, etc.
- Keep state management simple initially; refactor if complexity grows
- Write tests for critical features (CSV parsing, filtering, calculations)
- Use `DateOnly` for all workout date fields to ensure timezone independence

