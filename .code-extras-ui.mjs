import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:8000';
const out = process.env.COMMANDCODE_SCRATCHPAD;
const browser = await chromium.launch();

const desktop = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: 'id-ID' });
const page = await desktop.newPage();
const errors = [];
page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
const shot = async (p, name) => {
    await p.screenshot({ path: `${out}/${name}.png` });
    console.log('shot', name);
};

await page.goto(`${base}/`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Tambah Americano ke keranjang/ }).first().click();
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await shot(page, '130-cart-panel-extras');

await page.getByRole('button', { name: /Extra Shot/ }).first().click();
await page.waitForTimeout(1200);
await shot(page, '131-cart-panel-extra-active');

const lineText = await page.locator('aside').first().innerText();
console.log('desktop panel updated:', lineText.includes('19.000'));

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'id-ID' });
const m = await mobile.newPage();
await m.goto(`${base}/`, { waitUntil: 'networkidle' });
await m.getByRole('button', { name: /Tambah Americano ke keranjang/ }).first().click();
await m.waitForTimeout(1200);
await m.getByRole('button', { name: /Buka keranjang/ }).click();
await m.waitForTimeout(500);
await shot(m, '132-cart-sheet-extras');
await m.getByRole('button', { name: /Extra Shot/ }).first().click();
await m.waitForTimeout(1200);
await shot(m, '133-cart-sheet-extra-active');

console.log('errors:', JSON.stringify(errors));
await browser.close();
