const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:4500/dashboard/appointments', { waitUntil: 'networkidle0', timeout: 10000 });
  
  await browser.close();
})();
