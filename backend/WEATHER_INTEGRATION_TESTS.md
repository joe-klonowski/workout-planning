# Weather API Integration Tests

This document explains how to use the automated integration tests for the Open-Meteo weather API client.

## Overview

The weather integration tests connect to the **real Open-Meteo API** to verify that:
- The API is accessible and responding correctly
- All weather client methods work with live data
- Response structures are correct
- Time-of-day weather grouping works properly
- API response times are acceptable

## Running the Tests

### Run only weather integration tests:
```bash
pytest test_weather_integration.py -m integration -v
```

### Run all integration tests (both weather and CalDAV):
```bash
pytest -m integration -v
```

### Run regular unit tests (excludes integration tests):
```bash
pytest
# or explicitly:
pytest -m "not integration"
```

## Test Coverage

The weather integration test suite includes 9 tests:

1. **test_api_is_accessible** - Verifies Open-Meteo API is reachable
2. **test_get_daily_forecast_today** - Gets and validates today's forecast
3. **test_get_forecast_range** - Gets forecast for a date range (7 days)
4. **test_get_hourly_forecast** - Retrieves hourly forecast data
5. **test_get_weather_by_time_of_day** - Groups hourly data by time periods (morning/afternoon/evening)
6. **test_weather_code_descriptions** - Verifies weather codes have valid descriptions
7. **test_multiple_days_forecast** - Validates multi-day forecast data integrity
8. **test_chicago_location** - Confirms client is configured for Chicago
9. **test_api_response_times** - Verifies API responses are reasonably fast

## Example Test Output

```
test_weather_integration.py::TestWeatherAPIIntegration::test_api_is_accessible PASSED
test_weather_integration.py::TestWeatherAPIIntegration::test_get_daily_forecast_today PASSED
test_weather_integration.py::TestWeatherAPIIntegration::test_get_forecast_range PASSED
test_weather_integration.py::TestWeatherAPIIntegration::test_get_hourly_forecast PASSED
test_weather_integration.py::TestWeatherAPIIntegration::test_get_weather_by_time_of_day PASSED
test_weather_integration.py::TestWeatherAPIIntegration::test_weather_code_descriptions PASSED
test_weather_integration.py::TestWeatherAPIIntegration::test_multiple_days_forecast PASSED
test_weather_integration.py::TestWeatherAPIIntegration::test_chicago_location PASSED
test_weather_integration.py::TestWeatherAPIIntegration::test_api_response_times PASSED

9 passed in 6.04s
```

## When to Run Integration Tests

Integration tests are **optional** and skipped by default because:
- They require network access to Open-Meteo API
- They're slower than unit tests (network overhead)
- They're less reliable in offline environments

**Use integration tests when:**
- Setting up a new development environment
- Verifying weather API functionality after a change
- Debugging weather-related issues
- CI/CD pipelines (with appropriate configuration)

**Default test run** (`pytest` or `test-all.sh`) skips integration tests for speed and reliability during normal development.

## Implementation Details

The integration tests are marked with `@pytest.mark.integration` decorator, which:
- Makes them discoverable by pytest's marker system
- Allows selective execution with `-m integration`
- Are filtered out by default in the test-all.sh script

## Setup Requirements

No special setup is required! The tests use:
- **Public Open-Meteo API** (no API key needed)
- **Default Chicago location** (hardcoded in WeatherClient)
- **Standard Python libraries** (already installed)

The tests will gracefully skip with an informative message if the API is unavailable.
