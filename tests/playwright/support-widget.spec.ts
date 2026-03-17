import { expect, test } from '@playwright/test';

import { getAdminAuth, getAdminDb } from '../../src/lib/firebase-admin';
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

test.describe.serial('support widget visibility', () => {
  test('stays available as one combined entry on the public product surfaces', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Assistant öffnen' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Assistant öffnen' }).click();
    await expect(page.getByText('KI Register Assistant')).toBeVisible();
    await page.getByRole('tab', { name: 'Support' }).click();
    await expect(
      page.getByText('Feedback, Ideen und Support'),
    ).toBeVisible();

    await page.goto('/erfassen');
    await expect(
      page.getByRole('button', { name: 'Assistant öffnen' }),
    ).toHaveCount(0);
  });

  test('stays available inside the signed-in register without adding another menu entry', async ({
    page,
  }) => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const email = `pw-support-widget-${suffix}@kiregister.dev`;
    const password = 'Playwright#2026';
    const registerId = `pw_support_widget_${suffix}`;
    const createdAt = new Date().toISOString();

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let userUid: string | null = null;

    await deleteUserByEmail(email);

    try {
      const user = await adminAuth.createUser({
        email,
        password,
        displayName: 'Playwright Support Widget',
        emailVerified: true,
      });
      userUid = user.uid;

      await adminDb.doc(`users/${user.uid}`).set(
        {
          email,
          displayName: 'Playwright Support Widget',
          updatedAt: createdAt,
        },
        { merge: true },
      );

      const register: Register = {
        registerId,
        ownerId: user.uid,
        name: 'Support Widget Register',
        createdAt,
        organisationName: 'Support Widget GmbH',
        plan: 'free',
        entitlement: {
          plan: 'free',
          status: 'active',
          source: 'manual',
          updatedAt: createdAt,
          billingProductKey: 'free_register',
        },
      };

      await adminDb.doc(`users/${user.uid}/registers/${registerId}`).set(register);

      await page.goto('/?mode=login');
      const loginForm = page
        .locator('form')
        .filter({ has: page.getByRole('button', { name: /^Anmelden$/ }) })
        .first();

      await loginForm.getByLabel('E-Mail-Adresse').fill(email);
      await loginForm.getByLabel('Passwort').fill(password);
      await loginForm.getByRole('button', { name: /^Anmelden$/ }).click();
      await expect(page).toHaveURL(/\/my-register/);

      await expect(
        page.getByRole('button', { name: 'Assistant öffnen' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Assistant öffnen' }).click();
      await page.getByRole('tab', { name: 'Support' }).click();
      await expect(page.getByRole('button', { name: 'Feature' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Bug' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Hilfe' })).toBeVisible();
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
