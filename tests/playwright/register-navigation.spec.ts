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

test.describe.serial('register navigation persistence', () => {
  test('keeps the selected register when returning from detail and pass views', async ({
    page,
  }) => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const userEmail = `pw-register-nav-${suffix}@kiregister.dev`;
    const password = 'Playwright#2026';
    const firstRegisterId = `pw_register_alpha_${suffix}`;
    const secondRegisterId = `pw_register_beta_${suffix}`;
    const firstOrgName = `Alpha Test ${suffix}`;
    const secondOrgName = `BewusstseinBilden ${suffix}`;
    const firstUseCaseId = `pw_uc_alpha_${suffix}`;
    const secondUseCaseId = `pw_uc_beta_${suffix}`;
    const firstUseCasePurpose = `Alpha Use Case ${suffix}`;
    const secondUseCasePurpose = `Bewusstsein Use Case ${suffix}`;
    const createdAt = new Date().toISOString();

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let userUid: string | null = null;

    await deleteUserByEmail(userEmail);

    try {
      const createdUser = await adminAuth.createUser({
        email: userEmail,
        password,
        displayName: 'Playwright Register Navigation',
        emailVerified: true,
      });
      userUid = createdUser.uid;

      await adminDb.doc(`users/${userUid}`).set(
        {
          email: userEmail,
          displayName: 'Playwright Register Navigation',
          updatedAt: createdAt,
        },
        { merge: true },
      );

      const firstRegister: Register = {
        registerId: firstRegisterId,
        ownerId: userUid,
        name: 'Alpha Register',
        createdAt,
        organisationName: firstOrgName,
        plan: 'free',
        entitlement: {
          plan: 'free',
          status: 'active',
          source: 'manual',
          updatedAt: createdAt,
          billingProductKey: 'free_register',
        },
      };

      const secondRegister: Register = {
        registerId: secondRegisterId,
        ownerId: userUid,
        name: 'BewusstseinBilden Register',
        createdAt,
        organisationName: secondOrgName,
        plan: 'free',
        entitlement: {
          plan: 'free',
          status: 'active',
          source: 'manual',
          updatedAt: createdAt,
          billingProductKey: 'free_register',
        },
      };

      await adminDb.doc(`users/${userUid}/registers/${firstRegisterId}`).set(firstRegister);
      await adminDb.doc(`users/${userUid}/registers/${secondRegisterId}`).set(secondRegister);
      await adminDb.doc(`users/${userUid}/appData/registerSettings`).set({
        defaultRegisterId: firstRegisterId,
      });

      const firstUseCase = prepareUseCaseForStorage(
        {
          purpose: firstUseCasePurpose,
          usageContexts: ['INTERNAL_ONLY'],
          isCurrentlyResponsible: true,
          decisionImpact: 'NO',
          dataCategory: 'INTERNAL',
          toolId: 'chatgpt',
        },
        {
          useCaseId: firstUseCaseId,
          now: new Date(createdAt),
        },
      );

      const secondUseCase = prepareUseCaseForStorage(
        {
          purpose: secondUseCasePurpose,
          usageContexts: ['INTERNAL_ONLY'],
          isCurrentlyResponsible: true,
          decisionImpact: 'NO',
          dataCategory: 'INTERNAL',
          toolId: 'chatgpt',
        },
        {
          useCaseId: secondUseCaseId,
          now: new Date(createdAt),
        },
      );

      await adminDb
        .doc(`users/${userUid}/registers/${firstRegisterId}/useCases/${firstUseCaseId}`)
        .set(JSON.parse(JSON.stringify(firstUseCase)));
      await adminDb
        .doc(`users/${userUid}/registers/${secondRegisterId}/useCases/${secondUseCaseId}`)
        .set(JSON.parse(JSON.stringify(secondUseCase)));

      await page.goto('/?mode=login');
      await page.getByRole('tab', { name: 'Anmelden' }).click();
      const loginForm = page
        .locator('form')
        .filter({ has: page.getByRole('button', { name: /^Anmelden$/ }) })
        .first();

      await loginForm.getByLabel('E-Mail-Adresse').fill(userEmail);
      await loginForm.getByLabel('Passwort').fill(password);
      await loginForm.getByRole('button', { name: /^Anmelden$/ }).click();
      await expect(page).toHaveURL(/\/my-register/);

      await expect(page.getByText(`Organisation: ${firstOrgName}`)).toBeVisible();

      const registerSwitcher = page.getByRole('combobox').first();
      await registerSwitcher.click();
      await page.getByRole('option', { name: secondOrgName }).click();

      await expect(page.getByText(`Organisation: ${secondOrgName}`)).toBeVisible();
      await expect(page.getByText(secondUseCasePurpose)).toBeVisible();

      await page.getByRole('row', { name: new RegExp(secondUseCasePurpose) }).click();
      await expect(
        page.getByRole('heading', { name: secondUseCasePurpose }),
      ).toBeVisible();

      await page.getByRole('button', { name: 'Zurück' }).click();

      await expect(page).toHaveURL(/\/my-register$/);
      await expect(page.getByText(`Organisation: ${secondOrgName}`)).toBeVisible();
      await expect(page.getByText(secondUseCasePurpose)).toBeVisible();

      await page.getByRole('row', { name: new RegExp(secondUseCasePurpose) }).click();
      await expect(
        page.getByRole('heading', { name: secondUseCasePurpose }),
      ).toBeVisible();

      await page.getByRole('button', { name: 'Use-Case-Pass öffnen' }).click();
      await expect(page).toHaveURL(new RegExp(`/pass/${secondUseCaseId}$`));
      await expect(
        page.getByRole('heading', { name: 'Use-Case Pass' }),
      ).toBeVisible();

      await page.getByRole('button', { name: 'Zurück zum Register' }).click();

      await expect(page).toHaveURL(/\/my-register$/);
      await expect(page.getByText(`Organisation: ${secondOrgName}`)).toBeVisible();
      await expect(page.getByText(secondUseCasePurpose)).toBeVisible();
    } finally {
      if (userUid) {
        await adminDb.recursiveDelete(adminDb.doc(`users/${userUid}`)).catch(() => {});
        await adminAuth.deleteUser(userUid).catch(() => {});
      }
    }
  });
});
