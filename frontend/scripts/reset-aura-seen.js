#!/usr/bin/env node
/**
 * reset-aura-seen.js
 *
 * Clears the "Aura seen today" AsyncStorage flags so the floating agent
 * will auto-expand and speak again on next page load.
 *
 * Usage:
 *   node scripts/reset-aura-seen.js
 *   npm run reset:aura
 *
 * What it resets:
 *   @ora:aura-seen:home       — Home screen Aura agent
 *   @ora:aura-seen:community  — Community screen Aura agent
 *
 * On Expo Web, AsyncStorage maps directly to window.localStorage, so this
 * script uses Playwright to open the running dev server and clear the keys.
 *
 * The dev server must be running at http://localhost:8081 (or set PORT env var).
 */

const { chromium } = require('playwright');

const BASE_URL = `http://localhost:${process.env.PORT || 8081}`;
const AURA_KEY_PREFIX = '@ora:aura-seen';

async function main() {
  console.log(`\n🔄  Connecting to ${BASE_URL}...\n`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error('❌  Could not launch Chromium. Is playwright installed?');
    console.error('   Run: npx playwright install chromium\n');
    printManualInstructions();
    process.exit(1);
  }

  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10_000 });
  } catch (err) {
    console.error(`❌  Could not reach ${BASE_URL}. Is the dev server running?`);
    console.error('   Run: npm start\n');
    await browser.close();
    printManualInstructions();
    process.exit(1);
  }

  // Clear all @ora:aura-seen:* keys from localStorage
  const cleared = await page.evaluate((prefix) => {
    const removed = [];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        localStorage.removeItem(key);
        removed.push(key);
      }
    }
    return removed;
  }, AURA_KEY_PREFIX);

  await browser.close();

  if (cleared.length === 0) {
    console.log('ℹ️   No Aura seen keys found — nothing to clear.');
    console.log('    (The agent may not have been triggered yet today.)\n');
  } else {
    console.log('✅  Cleared the following keys:\n');
    cleared.forEach((k) => console.log(`    • ${k}`));
    console.log('\n    Reload the app — Aura will greet you again.\n');
  }
}

function printManualInstructions() {
  console.log('─────────────────────────────────────────────');
  console.log('Manual reset — paste into your browser console at localhost:8081:\n');
  console.log(
    `Object.keys(localStorage).filter(k=>k.startsWith('${AURA_KEY_PREFIX}')).forEach(k=>{localStorage.removeItem(k);console.log('removed',k)});`
  );
  console.log('─────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
