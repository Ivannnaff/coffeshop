import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:8000';
const out = process.env.COMMANDCODE_SCRATCHPAD;
const browser = await chromium.launch();
const errors = [];

const ctx = await browser.newContext({ viewport: { width: 900, height: 800 }, locale: 'id-ID' });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
});

await page.goto(`${base}/`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.getElementById('menu')?.scrollIntoView());
await page.waitForTimeout(500);

const trigger = page.locator('button[aria-haspopup="listbox"]');
await trigger.click();
await page.waitForTimeout(300);

const listbox = page.getByRole('listbox', { name: 'Urutkan menu' });
const visible = await listbox.isVisible();
const box = await listbox.boundingBox();
const viewport = page.viewportSize();
const inside = box ? box.x >= 0 && box.x + box.width <= (viewport?.width ?? 0) : false;
await page.screenshot({ path: `${out}/sort-open.png` });

await page.getByRole('option', { name: 'Harga terendah' }).click();
await page.waitForTimeout(400);
const labelAfterClick = await trigger.innerText();
const firstPrice = await page.locator('#menu article').first().innerText();

await trigger.focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
const labelAfterKeyboard = await trigger.innerText();

await trigger.click();
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const closedByEscape = (await listbox.count()) === 0;

await trigger.click();
await page.mouse.click(400, 120);
await page.waitForTimeout(200);
const closedByOutside = (await listbox.count()) === 0;

console.log(
    JSON.stringify(
        {
            visible,
            inside,
            box,
            labelAfterClick,
            firstPrice,
            focused,
            labelAfterKeyboard,
            closedByEscape,
            closedByOutside,
            errors,
        },
        null,
        2,
    ),
);
await browser.close();
