# Calendar Component Refactoring Plan

## Current State Analysis

The [Calendar.js](app/src/components/Calendar.js) component (~784 lines) has grown into a "God class" with multiple responsibilities:

### Current Responsibilities
- Calendar grid rendering (week and month views)
- Workout management and display logic
- Drag-and-drop coordination
- Weather data integration (partially delegated to DayTimeSlot)
- Tri-club event handling
- Modal state management (3 modals)
- Date navigation
- View mode switching
- Workout grouping/sorting logic
- Helper functions (formatting, time conversion, etc.)

## Refactoring Goals

1. **Improve maintainability** - Break down into focused, single-responsibility components
2. **Enhance testability** - Smaller components with clear interfaces
3. **Reduce complexity** - Separate concerns and logic layers
4. **Preserve functionality** - Ensure all existing features work exactly as before
5. **Maintain test coverage** - Update tests to cover refactored components (≥90% target)

## Proposed Component Structure

```
Calendar (parent coordinator)
├── CalendarHeader (navigation & controls)
│   ├── DateNavigation
│   ├── ViewModeToggle
│   └── ActionButtons (Import/Add Workout)
├── CalendarGrid (layout & rendering)
│   ├── WeekView
│   │   └── CalendarDay (x7)
│   │       ├── DayHeader (date number, weather summary)
│   │       └── DayTimeSlot (x3-4) [existing component]
│   └── MonthView
│       └── CalendarDay (x28-42)
│           ├── DayHeader
│           └── WorkoutsList
├── WorkoutBadge (extracted from Calendar)
├── Modals (existing components)
│   ├── WorkoutDetailModal
│   ├── AddWorkoutModal
│   └── ImportWorkoutModal
└── WeeklySummary (existing component)
```

## Refactoring Steps

### Phase 1: Extract Utility Functions and Hooks
**Duration:** 1-2 hours

#### Step 1: Create `app/src/hooks/useCalendarDragDrop.js`
- Extract all drag-and-drop state and handlers
- `useDragDrop()` hook returning: `{ draggedWorkout, dragState, handlers }`
- **Test:** Create hook tests, verify drag operations work

#### Step 2: Create `app/src/hooks/useCalendarNavigation.js`
- Extract date navigation logic
- `useCalendarNavigation(initialDate)` hook
- Returns: `{ currentDate, goToPreviousWeek, goToNextWeek, goToPreviousMonth, goToNextMonth, goToToday }`
- **Test:** Navigation state transitions

#### Step 3: Create `app/src/utils/workoutFormatters.js`
- Extract formatting utilities: `formatDuration`, `formatTime12Hour`, `getTimeSlot`
- Extract grouping: `groupWorkoutsByTimeOfDay`, `getWorkoutsForDay`
- **Test:** Unit tests for all formatters

#### Step 4: Create `app/src/utils/triClubUtils.js`
- Extract: `getTriClubEventsByTimeSlot`
- **Test:** Tri-club event grouping logic

### Phase 2: Extract WorkoutBadge Component
**Duration:** 1-2 hours

#### Step 5: Create `app/src/components/WorkoutBadge.js`
- Extract `renderWorkoutBadge` function as component
- Props: `workout, onDragStart, onDragEnd, onWorkoutClick, onSelectionToggle, draggedWorkoutId`
- Includes location display logic
- **Test:** Create `WorkoutBadge.test.js` with full coverage

#### Step 6: Update `Calendar.js` to use `<WorkoutBadge>` component
- Replace inline rendering with component
- **Test:** Verify existing Calendar tests still pass

### Phase 3: Extract CalendarHeader Component
**Duration:** 1-2 hours

#### Step 7: Create `app/src/components/CalendarHeader.js`
- Extract entire header section (navigation, view toggle, action buttons)
- Props: `{ monthYear, viewMode, onViewModeChange, onNavPrevious, onNavNext, onGoToToday, onOpenImport, onOpenAddWorkout }`
- **Test:** Create `CalendarHeader.test.js`

#### Step 8: Create sub-components (optional optimization)
- `DateNavigation.js` - Previous/Next/Today buttons
- `ViewModeToggle.js` - Week/Month toggle
- `ActionButtons.js` - Import/Add buttons
- **Test:** Individual component tests

### Phase 4: Extract CalendarDay Component
**Duration:** 2-3 hours (most complex phase)

#### Step 9: Create `app/src/components/CalendarDay.js`
- Represents a single day cell (works for both week and month views)
- Props: `{ dayObj, workouts, triClubSchedule, viewMode, isToday, showTimeSlots, dragState, onDragOver, onDragLeave, onDrop, onWorkoutClick, onWorkoutSelectionToggle, onWorkoutDragStart, onWorkoutDragEnd }`
- Conditionally renders time slots (week view) or simple list (month view)
- **Test:** Create `CalendarDay.test.js` with both view modes

#### Step 10: Update `DayTimeSlot.js`
- Ensure it works seamlessly with new `CalendarDay` parent
- Verify weather integration still works
- **Test:** Update existing `DayTimeSlot.test.js` if needed

### Phase 5: Extract CalendarGrid Component
**Duration:** 1-2 hours

#### Step 11: Create `app/src/components/CalendarGrid.js`
- Extract grid rendering logic and day-of-week headers
- Props: `{ days, workoutsByDate, viewMode, triClubSchedule, showTimeSlots, dragState, ...handlers }`
- Maps over days array and renders `<CalendarDay>` components
- **Test:** Create `CalendarGrid.test.js`

### Phase 6: Refactor Main Calendar Component
**Duration:** 1-2 hours

#### Step 12: Refactor `Calendar.js`
- Remove all extracted code
- Use custom hooks for drag-drop and navigation
- Orchestrate child components (header, grid, modals, summary)
- Main responsibilities: state management, data fetching, callback coordination
- Target: Reduce from ~784 lines to ~200-300 lines
- **Test:** Verify all existing Calendar tests still pass

#### Step 13: Update `Calendar.test.js`
- Refactor tests to work with new component structure
- Add integration tests to verify component coordination
- Ensure coverage remains ≥90%

### Phase 7: Integration Testing
**Duration:** 1-2 hours

#### Step 14: Run full test suite
```bash
cd app
npm test -- --coverage
```
- Verify all 209+ tests pass
- Check coverage metrics (aim for ≥90%)

#### Step 15: Manual testing
- Start app with `./start.sh`
- Test drag-and-drop functionality
- Test view mode switching
- Test navigation (week/month, prev/next, today)
- Test modals (detail, add, import)
- Verify weather widgets display correctly
- Check weekly summary
- Test on different viewport sizes

#### Step 16: Update `future-work.md`
- Remove completed refactoring item

## File Structure After Refactoring

```
app/src/
├── components/
│   ├── Calendar.js (~250 lines)
│   ├── Calendar.test.js
│   ├── CalendarDay.js (new, ~150 lines)
│   ├── CalendarDay.test.js (new)
│   ├── CalendarGrid.js (new, ~100 lines)
│   ├── CalendarGrid.test.js (new)
│   ├── CalendarHeader.js (new, ~100 lines)
│   ├── CalendarHeader.test.js (new)
│   ├── DayTimeSlot.js (existing, minimal changes)
│   ├── DayTimeSlot.test.js (existing, update if needed)
│   ├── WorkoutBadge.js (new, ~120 lines)
│   ├── WorkoutBadge.test.js (new)
│   └── ... (other existing components)
├── hooks/
│   ├── useCalendarDragDrop.js (new)
│   ├── useCalendarDragDrop.test.js (new)
│   ├── useCalendarNavigation.js (new)
│   └── useCalendarNavigation.test.js (new)
├── utils/
│   ├── workoutFormatters.js (new)
│   ├── workoutFormatters.test.js (new)
│   ├── triClubUtils.js (new)
│   ├── triClubUtils.test.js (new)
│   └── ... (other existing utils)
```

## Risk Mitigation

1. **Incremental approach** - Each phase can be completed and tested independently
2. **Test-driven** - Write/update tests before and after each refactor
3. **Feature preservation** - No functional changes, only structural
4. **Rollback safety** - Use git branches for each phase
5. **Manual verification** - Test drag-and-drop and interactions after each phase

## Success Criteria

- ✅ All existing tests pass (209+ tests)
- ✅ Test coverage remains ≥90%
- ✅ Calendar.js reduced from ~784 to ~200-300 lines
- ✅ All functionality works identically to before
- ✅ No visual regressions
- ✅ Drag-and-drop works smoothly
- ✅ Weather widgets display correctly
- ✅ Navigation and view switching work
- ✅ New components have comprehensive tests

## Estimated Total Duration

**8-12 hours** of focused development work, spread across phases

## Development Process

Following the project guidelines in AGENTS.md:
- Write tests for each new component/utility as it's created
- Run tests after each phase to verify nothing breaks
- Aim for ≥90% test coverage throughout
- When fixing issues, add regression tests first

## Notes

- This refactoring addresses the tech debt item: "Calendar.js class is getting pretty God-like. Refactor it into smaller parts."
- The refactoring maintains backward compatibility - all existing features and behaviors are preserved
- The modular structure will make future enhancements easier (e.g., adding workout ordering within time slots)
- Each new component can be developed and tested in isolation before integration
