const fs = require('fs');
const path = require('path');

describe('CalendarGrid.css styles', () => {
  const cssPath = path.resolve(__dirname, '../styles/CalendarGrid.css');
  let css;
  beforeAll(() => {
    css = fs.readFileSync(cssPath, 'utf8');
  });

  test('has no git conflict markers', () => {
    expect(css).not.toMatch(/<{7}|={7}|>{7}/);
  });

  test('uses --calendar-day-min variable for mobile layout', () => {
    expect(css).toMatch(/var\(--calendar-day-min/);
  });
});
