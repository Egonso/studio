import assert from 'node:assert/strict';

import { chromium, webkit } from 'playwright';

const base = process.env.QA_BASE_URL ?? 'http://127.0.0.1:9002';
const outputDirectory = 'launch-video/output';
const engines = [
  ['chromium', chromium],
  ['webkit', webkit],
];
const locales = [
  {
    code: 'de',
    heading: /Was KIRegister aus einem echten Einsatzfall macht/,
    play: 'Film ansehen',
  },
  {
    code: 'en',
    heading: /What KIRegister turns a real AI use case into/,
    play: 'Watch the film',
  },
];
const report = [];

for (const [engineName, engine] of engines) {
  const browser = await engine.launch({ headless: true });

  for (const locale of locales) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    await page.goto(`${base}/${locale.code}`, { waitUntil: 'domcontentloaded' });

    const section = page.locator('section[aria-labelledby="launch-film-title"]');
    await section.scrollIntoViewIfNeeded();
    await section.waitFor({ state: 'visible' });
    await section.getByRole('heading', { name: locale.heading }).waitFor();
    await page.waitForTimeout(1600);

    const loop = section.locator('video').first();
    await page.waitForFunction(
      (element) => element.readyState >= 1,
      await loop.elementHandle(),
    );
    await page.waitForFunction(
      (element) => !element.paused,
      await loop.elementHandle(),
      { timeout: 5000 },
    );
    const loopInfo = await loop.evaluate((element) => ({
      duration: element.duration,
      height: element.videoHeight,
      paused: element.paused,
      src: element.currentSrc,
      width: element.videoWidth,
    }));
    assert.ok(loopInfo.duration >= 11.9 && loopInfo.duration <= 12.1);
    assert.equal(loopInfo.width, 1920);
    assert.equal(loopInfo.height, 1080);
    assert.ok(loopInfo.src.includes(`kiregister-hero-loop-${locale.code}`));

    const mediaPaths = [
      `/videos/kiregister-hero-loop-${locale.code}.webm`,
      `/videos/kiregister-hero-loop-${locale.code}.mp4`,
      `/videos/kiregister-launch-master-${locale.code}.webm`,
      `/videos/kiregister-launch-master-${locale.code}.mp4`,
      `/videos/kiregister-launch-poster-${locale.code}.webp`,
      `/videos/kiregister-launch-${locale.code}.vtt`,
    ];
    for (const path of mediaPaths) {
      const response = await page.request.get(`${base}${path}`);
      assert.equal(response.status(), 200, path);
    }

    await section.screenshot({
      path: `${outputDirectory}/landing-film-${locale.code}-${engineName}.png`,
    });
    await section.getByRole('button', { name: locale.play }).click();

    const dialog = page.locator('dialog[open]');
    await dialog.waitFor({ state: 'visible' });
    const film = dialog.locator('video');
    await page.waitForFunction(
      (element) => element.readyState >= 1,
      await film.elementHandle(),
    );
    const filmInfo = await film.evaluate((element) => ({
      duration: element.duration,
      height: element.videoHeight,
      src: element.currentSrc,
      tracks: element.textTracks.length,
      width: element.videoWidth,
    }));
    assert.ok(filmInfo.duration >= 86 && filmInfo.duration <= 86.2);
    assert.equal(filmInfo.width, 1920);
    assert.equal(filmInfo.height, 1080);
    assert.equal(filmInfo.tracks, 1);
    assert.ok(filmInfo.src.includes(`kiregister-launch-master-${locale.code}`));

    await dialog.screenshot({
      path: `${outputDirectory}/landing-film-dialog-${locale.code}-${engineName}.png`,
    });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));

    report.push({
      engine: engineName,
      film: filmInfo,
      locale: locale.code,
      loop: loopInfo,
      media: '6/6',
    });
    await context.close();
  }

  const mobileContext = await browser.newContext({
    deviceScaleFactor: 2,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${base}/de`, { waitUntil: 'domcontentloaded' });
  const mobileSection = mobilePage.locator(
    'section[aria-labelledby="launch-film-title"]',
  );
  await mobileSection.scrollIntoViewIfNeeded();
  await mobileSection
    .getByRole('heading', {
      name: /Was KIRegister aus einem echten Einsatzfall macht/,
    })
    .waitFor();
  await mobilePage.waitForTimeout(1600);
  await mobileSection.screenshot({
    path: `${outputDirectory}/landing-film-mobile-${engineName}.png`,
  });
  await mobileSection.getByRole('button', { name: 'Film ansehen' }).click();
  const mobileDialog = mobilePage.locator('dialog[open]');
  await mobileDialog.waitFor({ state: 'visible' });
  const dialogBounds = await mobileDialog.boundingBox();
  assert.ok(dialogBounds);
  assert.ok(dialogBounds.x >= 0);
  assert.ok(dialogBounds.width <= 390);
  await mobileDialog.screenshot({
    path: `${outputDirectory}/landing-film-dialog-mobile-${engineName}.png`,
  });
  await mobilePage.keyboard.press('Escape');
  await mobileContext.close();

  await browser.close();
}

const reducedMotionBrowser = await chromium.launch({ headless: true });
const reducedMotionContext = await reducedMotionBrowser.newContext({
  reducedMotion: 'reduce',
  viewport: { width: 1280, height: 900 },
});
const reducedMotionPage = await reducedMotionContext.newPage();
await reducedMotionPage.goto(`${base}/de`, { waitUntil: 'domcontentloaded' });
const reducedMotionLoop = reducedMotionPage
  .locator('section[aria-labelledby="launch-film-title"] video')
  .first();
await reducedMotionPage
  .locator('section[aria-labelledby="launch-film-title"]')
  .scrollIntoViewIfNeeded();
assert.equal(
  await reducedMotionLoop.evaluate((element) => getComputedStyle(element).display),
  'none',
);
await reducedMotionContext.close();
await reducedMotionBrowser.close();

console.log(
  JSON.stringify(
    { status: 'ok', reducedMotion: 'static fallback', report },
    null,
    2,
  ),
);
