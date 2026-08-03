import { expect, test, type Page } from '@playwright/test';

async function setMediaState(
  page: Page,
  state: { paused: boolean; ended: boolean },
) {
  await page.locator('[data-launch-master]').evaluate((element, nextState) => {
    const video = element as HTMLVideoElement;
    Object.defineProperty(video, 'paused', {
      configurable: true,
      get: () => nextState.paused,
    });
    Object.defineProperty(video, 'ended', {
      configurable: true,
      get: () => nextState.ended,
    });
  }, state);
}

async function startFilm(page: Page) {
  await page.getByRole('button', { name: /Film abspielen/ }).click();
  await setMediaState(page, { paused: false, ended: false });
  await page
    .locator('[data-launch-master]')
    .evaluate((element) => element.dispatchEvent(new Event('play')));
}

test.describe('launch film floating player', () => {
  test('closes permanently after the film ends on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/de');
    const master = page.locator('[data-launch-master]');
    await expect(master.locator('source[type="video/webm"]')).toHaveAttribute(
      'src',
      '/videos/kiregister-launch-master-de-20260803.webm',
    );
    await expect(master.locator('source[type="video/mp4"]')).toHaveAttribute(
      'src',
      '/videos/kiregister-launch-master-de-20260803.mp4',
    );
    await expect(master.locator('track')).toHaveAttribute(
      'src',
      '/videos/kiregister-launch-de-20260803.vtt',
    );

    await startFilm(page);
    await expect(master).toHaveClass(/masterActive/);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(master).toHaveClass(/masterFloating/);

    await setMediaState(page, { paused: true, ended: true });
    await master.evaluate((element) =>
      element.dispatchEvent(new Event('ended')),
    );

    await expect(master).not.toHaveClass(/masterActive/);
    await expect(master).not.toHaveClass(/masterFloating/);
    await expect(
      page.getByRole('button', { name: /Film abspielen/ }),
    ).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(master).not.toHaveClass(/masterFloating/);
  });

  test('keeps desktop floating playback while playing and closes it on pause', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/de');
    await startFilm(page);

    const master = page.locator('[data-launch-master]');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(master).toHaveClass(/masterFloating/);

    await setMediaState(page, { paused: true, ended: false });
    await master.evaluate((element) =>
      element.dispatchEvent(new Event('pause')),
    );
    await expect(master).not.toHaveClass(/masterFloating/);
  });
});
