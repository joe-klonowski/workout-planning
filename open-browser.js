const { chromium } = require('@playwright/test');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: false // Set to true if you want headless mode
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000/');
  
  console.log('Browser opened. Page will remain open. Press Ctrl+C to close.');
  
  // Keep the browser open - it will close when you press Ctrl+C
  await page.waitForTimeout(300000); // Wait for 5 minutes
  
  await browser.close();
})();
