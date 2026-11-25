import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const url = process.env.SMOKE_URL ?? 'http://127.0.0.1:4173/xmas26/';

async function drag(page, from, to, x, y) {
  const source = await from.boundingBox();
  const target = await to.boundingBox();
  assert(source && target, 'Drag source and target must be visible');
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(250);
  await page.mouse.move(target.x + target.width * x, target.y + target.height * y, { steps: 14 });
  await page.waitForTimeout(180);
  await page.mouse.up();
}

async function touchDrag(context, page, from, to) {
  const source = await from.boundingBox();
  const target = await to.boundingBox();
  assert(source && target, 'Touch source and target must be visible');
  const client = await context.newCDPSession(page);
  const start = { x: source.x + source.width / 2, y: source.y + source.height / 2, id: 1 };
  const end = { x: target.x + target.width * 0.48, y: target.y + target.height * 0.7, id: 1 };
  try {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await page.waitForTimeout(250);
    for (let step = 1; step <= 12; step += 1) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{
          x: start.x + (end.x - start.x) * step / 12,
          y: start.y + (end.y - start.y) * step / 12,
          id: 1,
        }],
      });
    }
    await page.waitForTimeout(180);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await client.detach();
  }
}

async function checkBrowser(browserType) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: browserType.name() === 'chromium' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('h1').textContent(), 'Az én karácsonyi képeslapom');
    await page.screenshot({ path: `/private/tmp/lumen-${browserType.name()}-ipad.png`, fullPage: true });

    await page.getByRole('button', { name: /Piros gömb hozzáadása/ }).click();
    assert.equal(await page.locator('.placed-piece').count(), 1, 'Tap adds an ornament');

    await drag(
      page,
      page.getByRole('button', { name: /Arany gömb hozzáadása/ }),
      page.locator('.tree-zone'),
      0.64,
      0.54,
    );
    await page.waitForFunction(() => document.querySelectorAll('.placed-piece').length === 2);

    await drag(
      page,
      page.getByRole('button', { name: /Csillag hozzáadása/ }),
      page.locator('.tree-zone'),
      0.5,
      0.45,
    );
    const star = page.getByRole('button', { name: /Csillag a képeslapon/ });
    await star.waitFor();
    await drag(page, star, page.locator('.tree-zone'), 0.5, 0.04);
    await page.waitForFunction(() => {
      const placedStar = document.querySelector('button[aria-label^="Csillag a képeslapon"]');
      return placedStar && Number.parseFloat(placedStar.style.top) <= 6;
    });

    await drag(
      page,
      page.getByRole('button', { name: /Piros ajándék hozzáadása/ }),
      page.locator('.ground-zone'),
      0.4,
      0.5,
    );
    await page.waitForFunction(() => document.querySelectorAll('.placed-piece').length === 4);

    if (browserType.name() === 'chromium') {
      await touchDrag(
        context,
        page,
        page.getByRole('button', { name: /Kék gömb hozzáadása/ }),
        page.locator('.tree-zone'),
      );
      await page.waitForFunction(() => document.querySelectorAll('.placed-piece').length === 5);
    }

    const redBauble = page.getByRole('button', { name: /Piros gömb a képeslapon/ });
    const originalPosition = await redBauble.getAttribute('style');
    await drag(page, redBauble, page.locator('.tree-zone'), 0.52, 0.65);
    await page.waitForFunction((style) => document.querySelector('button[aria-label^="Piros gömb a képeslapon"]')?.getAttribute('style') !== style, originalPosition);
    await page.getByRole('button', { name: 'Visszavonás' }).click();
    await page.waitForFunction((style) => document.querySelector('button[aria-label^="Piros gömb a képeslapon"]')?.getAttribute('style') === style, originalPosition);

    await page.getByLabel('Írd ide a neved').fill('Ágnes');
    await page.getByRole('button', { name: 'Kész a képeslap!' }).click();
    const preview = page.getByAltText('Az elkészült karácsonyi képeslap előnézete');
    await preview.waitFor({ timeout: 20000 });
    const size = await preview.evaluate((image) => ({ width: image.naturalWidth, height: image.naturalHeight }));
    assert.equal(size.width, 1800, 'The PNG is 1800 pixels wide');
    assert(Math.abs(size.height - 1200) <= 1, 'The PNG has a 3:2 postcard shape');
    assert.equal(await page.getByRole('link', { name: 'Kép megnyitása' }).count(), 1);
    await page.screenshot({ path: `/private/tmp/lumen-${browserType.name()}-export.png`, fullPage: true });

    if (browserType.name() === 'chromium') {
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload({ waitUntil: 'networkidle' });
      await context.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      assert.equal(await page.locator('h1').textContent(), 'Az én karácsonyi képeslapom', 'The installed shell loads offline');
      await context.setOffline(false);
    }

    await page.setViewportSize({ width: 820, height: 1180 });
    await page.screenshot({ path: `/private/tmp/lumen-${browserType.name()}-ipad-portrait.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, 'Portrait iPad has no horizontal overflow');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `/private/tmp/lumen-${browserType.name()}-phone.png`, fullPage: true });
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(hasHorizontalOverflow, false, 'Phone layout has no horizontal overflow');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Új képeslap' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.placed-piece').length === 0);
    assert.equal(await page.getByLabel('Írd ide a neved').inputValue(), '', 'New card clears the name');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    console.log(`${browserType.name()}: editor, PNG, and responsive layout passed${browserType.name() === 'chromium' ? ' (including offline reload)' : ''}`);
  } finally {
    await browser.close();
  }
}

for (const browserType of [chromium, webkit]) {
  await checkBrowser(browserType);
}
