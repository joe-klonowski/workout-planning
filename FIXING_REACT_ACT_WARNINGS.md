# Fixing React Testing Library act() Warnings

## Problem Summary

React Testing Library was showing warnings like:
```
Warning: An update to ComponentName inside a test was not wrapped in act(...).
```

These warnings appeared when components performed async state updates (like fetching data) that weren't properly awaited in tests.

## Root Causes Found

### 1. Wrapping render() in act()
**WRONG:**
```javascript
await act(async () => {
  render(<Component />);
});
```

**Explanation:** React Testing Library's `render()` is already wrapped in `act()` internally. Wrapping it again is unnecessary and an anti-pattern.

**RIGHT:**
```javascript
render(<Component />);
// Then wait for async operations to complete
await waitFor(() => {
  expect(screen.getByText(/expected content/)).toBeInTheDocument();
});
```

### 2. Not Waiting for Async Operations
When a component has async effects (like useEffect with async functions), tests must wait for those operations to complete.

**WRONG:**
```javascript
render(<Component />);
// Test ends before async operations finish
expect(someElement).toBeInTheDocument();
```

**RIGHT:**
```javascript
render(<Component />);
// Wait for the async operation's result to appear
await waitFor(() => {
  expect(screen.getByText(/data loaded/)).toBeInTheDocument();
});
```

### 3. Missing API Mocks
When `jest.clearAllMocks()` runs in `beforeEach`, all mock implementations are cleared. If a test renders a component that makes API calls but doesn't mock the API, the API returns `undefined`, causing errors that trigger state updates in error handlers.

**WRONG:**
```javascript
describe('Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clears ALL mocks including their implementations
  });

  test('should render', () => {
    // apiCall is now undefined!
    render(<ComponentThatFetchesData timeSlot="morning" />);
  });
});
```

**RIGHT - Option 1:** Mock the API in each test
```javascript
test('should render', async () => {
  apiCall.mockResolvedValue({
    ok: true,
    json: async () => ({ data: 'value' })
  });
  
  render(<ComponentThatFetchesData timeSlot="morning" />);
  
  await waitFor(() => {
    expect(screen.getByText(/value/)).toBeInTheDocument();
  });
});
```

**RIGHT - Option 2:** Use unscheduled/non-fetching props
```javascript
test('should render', () => {
  // Use timeSlot that doesn't trigger data fetching
  render(<ComponentThatFetchesData timeSlot="unscheduled" />);
  expect(screen.getByText(/Unscheduled/)).toBeInTheDocument();
});
```

**RIGHT - Option 3:** Mock in nested describe block's beforeEach
```javascript
describe('Layout Tests', () => {
  beforeEach(() => {
    // Provide default mock for all tests in this group
    apiCall.mockResolvedValue({
      ok: true,
      json: async () => ({ /* default data */ })
    });
  });

  test('should render properly', async () => {
    render(<Component />);
    await waitFor(() => {
      expect(screen.getByText(/loaded/)).toBeInTheDocument();
    });
  });
});
```

## Fixes Applied to DayTimeSlot.test.js

### 1. Removed act() wrappers around render()
Changed all instances of:
```javascript
await act(async () => {
  render(<DayTimeSlot ... />);
});
```

To:
```javascript
render(<DayTimeSlot ... />);
await waitFor(() => {
  expect(screen.getByText(/expected weather or content/)).toBeInTheDocument();
});
```

### 2. Added waitFor() to wait for weather data
For tests rendering components with scheduled time slots (morning/afternoon/evening), added:
```javascript
await waitFor(() => {
  expect(screen.getByText(/°F/)).toBeInTheDocument(); // Wait for weather temp
});
```

### 3. Added API mocks to Layout Bug Regression Tests
Added a `beforeEach` in the nested describe block to provide default mocks:
```javascript
describe('Layout Bug Regression Tests', () => {
  beforeEach(() => {
    apiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        date: getDaysFromNow(5),
        morning: { temperature: 65, ... },
        afternoon: { temperature: 72, ... },
        evening: { temperature: 68, ... }
      })
    });
  });
  // ... tests ...
});
```

### 4. Made synchronous tests async
Changed tests from:
```javascript
test('should do something', () => {
  render(<Component timeSlot="evening" />);
  expect(something).toBeInTheDocument();
});
```

To:
```javascript
test('should do something', async () => {
  render(<Component timeSlot="evening" />);
  await waitFor(() => {
    expect(screen.getByText(/68°F/)).toBeInTheDocument();
  });
  expect(something).toBeInTheDocument();
});
```

## How to Fix Other Test Files

### Step 1: Identify Tests with act() Warnings
Run tests and look for:
```
An update to [ComponentName] inside a test was not wrapped in act(...)
```

Note which test files and which state updates (setLoading, setError, setData, etc.) are mentioned.

### Step 2: Check for Unnecessary act() Wrappers
Search for: `await act(async () => {` followed by `render(`

Remove the act wrapper:
```javascript
// BEFORE
await act(async () => {
  render(<Component />);
});

// AFTER
render(<Component />);
```

### Step 3: Add waitFor() for Async Operations
For each render that triggers async operations (API calls, setTimeout, etc.), wait for the result:

```javascript
render(<Component />);

// Wait for async operation result
await waitFor(() => {
  expect(screen.getByText(/expected result/)).toBeInTheDocument();
});
```

**What to wait for:**
- Data that appears after loading (temperature, user data, etc.)
- Loading indicators disappearing
- Error messages appearing
- Any DOM change that indicates the async operation completed

### Step 4: Fix Missing API Mocks
Look for tests that:
1. Render components that fetch data
2. Don't mock the API  
3. Use scheduled time slots or trigger data fetching

Add appropriate mocks or change test props to avoid triggering fetches.

### Step 5: Make Tests Async
If a test now has `await waitFor()`, make sure the test function is `async`:

```javascript
// BEFORE
test('should render', () => {

// AFTER  
test('should render', async () => {
```

## Tests Still Needing Fixes

Based on the last test run, there are still act() warnings in other test files. Run:
```bash
cd app && npm test -- --coverage --watchAll=false 2>&1 | grep -B 20 "act(...)" | grep "PASS\|FAIL"
```

This will show which test files still have warnings.

## Key Principles

1. **Never wrap render() in act()** - it's already wrapped internally
2. **Always wait for async operations** - use waitFor() to wait for UI changes
3. **Wait for meaningful changes** - wait for data to appear, not arbitrary timeouts
4. **Avoid setTimeout(resolve, 0)** - this is a code smell and makes tests flaky
5. **Mock all async dependencies** - especially after jest.clearAllMocks()
6. **Wait for what the user would see** - if data appears in the UI, wait for it

## Resources

- [React Testing Library - Async Methods](https://testing-library.com/docs/dom-testing-library/api-async/)
- [React Testing Library - Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Fix the "not wrapped in act(...)" warning](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)
