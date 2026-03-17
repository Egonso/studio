import { expect, test } from '@playwright/test';

import { getAdminAuth, getAdminDb } from '../../src/lib/firebase-admin';
import { prepareUseCaseForStorage } from '../../src/lib/register-first/use-case-builder';
import type { Register } from '../../src/lib/register-first/types';

async function deleteUserByEmail(email: string) {
  const auth = getAdminAuth();

  try {
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : null;

    if (code !== 'auth/user-not-found') {
      throw error;
    }
  }
}

test.describe.serial('free report mode', () => {
  test('keeps the report visible in the free register without premium destination CTAs', async ({
    page,
  }, testInfo) => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const email = `pw-free-report-${suffix}@kiregister.dev`;
    const password = 'Playwright#2026';
    const registerId = `pw_free_report_${suffix}`;
    const useCaseId = `pw_free_use_case_${suffix}`;
    const createdAt = new Date().toISOString();

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let userUid: string | null = null;

    await deleteUserByEmail(email);

    try {
      const user = await adminAuth.createUser({
        email,
        password,
        displayName: 'Playwright Free Report',
        emailVerified: true,
      });
      userUid = user.uid;

      await adminDb.doc(`users/${user.uid}`).set(
        {
          email,
          displayName: 'Playwright Free Report',
          updatedAt: createdAt,
        },
        { merge: true },
      );

      const register: Register = {
        registerId,
        ownerId: user.uid,
        name: 'Free Report Register',
        createdAt,
        organisationName: 'Free Report GmbH',
        plan: 'free',
        entitlement: {
          plan: 'free',
          status: 'active',
          source: 'manual',
          updatedAt: createdAt,
          billingProductKey: 'free_register',
        },
        orgSettings: {
          organisationName: 'Free Report GmbH',
          industry: 'Dienstleistungen',
          contactPerson: {
            name: 'Playwright Free Report',
            email,
          },
        },
      };

      await adminDb.doc(`users/${user.uid}/registers/${registerId}`).set(register);

      const useCase = prepareUseCaseForStorage(
        {
          purpose: 'Free report navigation check',
          usageContexts: ['INTERNAL_ONLY'],
          isCurrentlyResponsible: true,
          decisionImpact: 'NO',
          dataCategory: 'INTERNAL',
          toolId: 'chatgpt',
        },
        {
          useCaseId,
          now: new Date(createdAt),
        },
      );

      await adminDb
        .doc(`users/${user.uid}/registers/${registerId}/useCases/${useCaseId}`)
        .set(JSON.parse(JSON.stringify(useCase)));

      await page.goto('/?mode=login');

      const loginForm = page
        .locator('form')
        .filter({ has: page.getByRole('button', { name: /^Anmelden$/ }) })
        .first();

      await loginForm.getByLabel('E-Mail-Adresse').fill(email);
      await loginForm.getByLabel('Passwort').fill(password);
      await loginForm.getByRole('button', { name: /^Anmelden$/ }).click();
      await expect(page).toHaveURL(/\/my-register/);

      await page.goto('/my-register');

      await expect(page.getByRole('button', { name: 'Bericht' })).toBeVisible();
      await page.getByRole('button', { name: 'Bericht' }).click();

      await expect(page).toHaveURL('/control');
      await expect(page.getByRole('heading', { name: 'Bericht', exact: true })).toBeVisible();
      await expect(page.getByText('Free Report GmbH').first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Register öffnen' }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Governance Settings' }).first()).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Reviews öffnen' }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('link', { name: 'Audit-Exports ansehen' }),
      ).toHaveCount(0);

      await page.screenshot({
        path: testInfo.outputPath('free-report-mode.png'),
        fullPage: true,
      });
    } finally {
      if (userUid) {
        await adminDb
          .recursiveDelete(adminDb.doc(`users/${userUid}/registers/${registerId}`))
          .catch(() => {});
        await adminDb.doc(`users/${userUid}`).delete().catch(() => {});
        await adminAuth.deleteUser(userUid).catch(() => {});
      }
    }
  });
});
