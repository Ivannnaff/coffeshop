import { expect, test } from '@playwright/test';

test('beranda termuat tanpa error', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    await expect(
        page.getByRole('heading', { level: 1, name: 'Menu Kopi & Eatery' }),
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
});
