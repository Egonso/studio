import { expect, test, type Page } from '@playwright/test';

import { LEGACY_EXAM_DEFINITION } from '../../src/lib/certification/legacy-question-bank';

async function completeExam(page: Page) {
  for (const [sectionIndex, section] of LEGACY_EXAM_DEFINITION.sections.entries()) {
    for (const question of section.questions) {
      await expect(page.getByText(question.text).first()).toBeVisible();
      const answers = page.getByRole('radio');
      await expect(answers).toHaveCount(question.options.length);
      await answers.nth(question.correctAnswer).click();
      await page.getByRole('button', { name: 'Nächste Frage' }).click();
    }

    await expect(page.getByText('Abschnittsergebnis 100.00%')).toBeVisible();
    await page.getByRole('button', {
      name:
        sectionIndex === LEGACY_EXAM_DEFINITION.sections.length - 1
          ? 'Prüfung auswerten'
          : 'Zum nächsten Abschnitt',
    }).click();
  }
}

function extractCertificateCode(value: string | null): string {
  const match = value?.match(/KI-REG-\d{4}-\d+/);
  if (!match) {
    throw new Error(`Certificate code could not be parsed from: ${value ?? '<empty>'}`);
  }

  return match[0];
}

test.describe.serial('certification flows', () => {
  test('smokes core routes', async ({ request }) => {
    for (const path of ['/', '/academy', '/exam', '/verify', '/verify/UNKNOWN-CODE']) {
      const response = await request.get(path);
      expect(response.ok()).toBeTruthy();
    }
  });

  test('issues a certificate through the integrated exam and exposes verify + badge', async ({
    page,
    request,
  }, testInfo) => {
    await page.goto('/exam?dev-auth=1&email=playwright-cert%40kiregister.dev');

    await expect(page.getByText('Interne Kompetenzprüfung').first()).toBeVisible();
    await page.getByLabel('Unternehmen für das Zertifikat').fill('Playwright QA GmbH');
    await page.getByRole('button', { name: 'Prüfung jetzt starten' }).click();

    await completeExam(page);

    await expect(page.getByRole('heading', { name: 'Prüfung bestanden' })).toBeVisible();
    const codeText = await page.getByText(/^Code KI-REG-/).first().textContent();
    const certificateCode = extractCertificateCode(codeText);

    await expect(page.getByText('HTML/CSS-Badge')).toBeVisible();
    await expect(page.locator('pre')).toContainText(`https://kiregister.com/verify/${certificateCode}`);
    await page.screenshot({
      path: testInfo.outputPath('certification-result.png'),
      fullPage: true,
    });

    const badgeResponse = await request.get(
      `/api/certification/badge?code=${encodeURIComponent(certificateCode)}`,
    );
    expect(badgeResponse.ok()).toBeTruthy();
    const badgePayload = (await badgeResponse.json()) as { html: string };
    expect(badgePayload.html).toContain(`https://kiregister.com/verify/${certificateCode}`);

    await page.goto(`/verify/${certificateCode}`);
    await expect(page.getByText('Gültiges Zertifikat').first()).toBeVisible();
    await expect(page.getByText('Playwright QA GmbH')).toBeVisible();
    await expect(page.getByText(certificateCode)).toBeVisible();
  });

  test('shows a not-found verification state for invalid codes', async ({ page }) => {
    await page.goto('/verify/KI-REG-1999-0000');
    await expect(page.getByText('Verifizierung fehlgeschlagen').first()).toBeVisible();
    await expect(page.getByText('Zertifikat nicht gefunden oder ungültig.')).toBeVisible();
    await page.getByRole('button', { name: 'Neuen Zertifikatscode eingeben' }).click();
    await expect(page).toHaveURL('/verify');
    await expect(page.getByRole('heading', { name: 'Zertifikate direkt im KI-Register prüfen' })).toBeVisible();
  });

  test('supports dev-only admin certificate issue, regeneration and revocation', async ({
    page,
    request,
  }) => {
    const adminHeaders = {
      'x-dev-admin-email': 'playwright-admin@kiregister.dev',
      'x-dev-admin-name': 'Playwright Admin',
    };

    const issueResponse = await request.post('/api/certification/admin/dev/issue', {
      headers: adminHeaders,
      data: {
        email: 'admin-flow@kiregister.dev',
        holderName: 'Admin Flow',
        company: 'Admin QA GmbH',
        validityMonths: 2,
      },
    });
    expect(issueResponse.ok()).toBeTruthy();
    const issued = (await issueResponse.json()) as {
      certificateId: string;
      certificateCode: string;
      latestDocumentUrl: string | null;
    };

    expect(issued.certificateCode).toMatch(/^KI-REG-\d{4}-\d+$/);
    expect(issued.latestDocumentUrl).toContain('data:application/pdf;base64,');

    const regenerateResponse = await request.post('/api/certification/admin/dev/regenerate', {
      headers: adminHeaders,
      data: {
        certificateId: issued.certificateId,
      },
    });
    expect(regenerateResponse.ok()).toBeTruthy();
    const regenerated = (await regenerateResponse.json()) as {
      latestDocumentUrl: string | null;
    };
    expect(regenerated.latestDocumentUrl).toContain('data:application/pdf;base64,');

    const updateResponse = await request.post('/api/certification/admin/dev/update', {
      headers: adminHeaders,
      data: {
        certificateId: issued.certificateId,
        status: 'revoked',
        note: 'Playwright revocation check',
      },
    });
    expect(updateResponse.ok()).toBeTruthy();

    const badgeResponse = await request.get(
      `/api/certification/badge?code=${encodeURIComponent(issued.certificateCode)}`,
    );
    expect(badgeResponse.status()).toBe(404);

    await page.goto(`/verify/${issued.certificateCode}`);
    await expect(page.getByText('Widerrufenes Zertifikat').first()).toBeVisible();
    await expect(page.getByText('Admin QA GmbH')).toBeVisible();
  });
});
