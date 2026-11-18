import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:8000';
const browser = await chromium.launch();
const context = await browser.newContext();
const request = context.request;

await request.get(`${base}/`);
const menu = await (await request.get(`${base}/api/public/menu`)).json();
const americano = menu.data.find((category) => category.name === 'Coffee').products.find((p) => p.name === 'Americano');
const extraGroup = americano.addon_groups.find((group) => group.name === 'Extra');
const extraShot = extraGroup.addons.find((a) => a.name === 'Extra Shot');
const oreo = extraGroup.addons.find((a) => a.name === 'Oreo');

const cart = async () => (await (await request.get(`${base}/api/public/cart`)).json()).data;

await request.post(`${base}/api/public/cart/items`, {
    data: { product_id: americano.id, qty: 1 },
    headers: { Accept: 'application/json' },
});

let data = await cart();
const item = data.items[0];
console.log('item', item.id, 'addons', item.addons, 'total', item.line_total);
console.log('options', item.addon_options.map((g) => `${g.name}: ${g.addons.map((a) => a.name).join(', ')}`));

const patch = async (payload) => {
    const response = await request.patch(`${base}/api/public/cart/items/${item.id}`, {
        data: payload,
        headers: { Accept: 'application/json' },
    });

    return response.status();
};

console.log('add extra shot', await patch({ addon_ids: [extraShot.id] }));
data = await cart();
console.log('after extra:', data.items[0].addons.map((a) => a.name), 'line', data.items[0].line_total, 'subtotal', data.subtotal);

console.log('add oreo + qty 2', await patch({ addon_ids: [extraShot.id, oreo.id], qty: 2 }));
data = await cart();
console.log('after extra2:', data.items[0].addons.map((a) => a.name), 'qty', data.items[0].qty, 'line', data.items[0].line_total, 'subtotal', data.subtotal);

console.log('remove all extras', await patch({ addon_ids: [] }));
data = await cart();
console.log('after clear:', data.items[0].addons.map((a) => a.name), 'line', data.items[0].line_total, 'subtotal', data.subtotal);

await browser.close();
