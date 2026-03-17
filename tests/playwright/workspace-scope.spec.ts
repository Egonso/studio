import { expect, test } from '@playwright/test';

import { getAdminAuth, getAdminDb } from '../../src/lib/firebase-admin';
import { prepareUseCaseForStorage } from '../../src/lib/register-first/use-case-builder';
import type { Register } from '../../src/lib/register-first/types';
import {
  ensureWorkspaceRecord,
  syncUserWorkspaceAccess,
  upsertWorkspaceMemberRecord,
} from '../../src/lib/workspace-admin';

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

test.describe.serial('workspace scope flows', () => {
  test('loads shared workspace register data and preserves scope across fallback navigation', async ({
    page,
  }, testInfo) => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const ownerEmail = `pw-workspace-owner-${suffix}@kiregister.dev`;
    const password = 'Playwright#2026';
    const workspaceName = `Playwright Workspace ${suffix}`;
    const orgId = `pw_workspace_${suffix}`;
    const registerId = `pw_register_${suffix}`;
    const useCaseId = `pw_use_case_${suffix}`;
    const createdAt = new Date().toISOString();

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let ownerUid: string | null = null;

    await deleteUserByEmail(ownerEmail);

    try {
      const owner = await adminAuth.createUser({
        email: ownerEmail,
        password,
        displayName: 'Playwright Workspace Owner',
        emailVerified: true,
      });
      ownerUid = owner.uid;

      await ensureWorkspaceRecord({
        orgId,
        name: workspaceName,
        ownerUserId: owner.uid,
        plan: 'enterprise',
      });

      await upsertWorkspaceMemberRecord({
        orgId,
        orgName: workspaceName,
        userId: owner.uid,
        email: ownerEmail,
        role: 'OWNER',
        displayName: 'Playwright Workspace Owner',
        source: 'manual',
        ownerUserId: owner.uid,
      });

      await syncUserWorkspaceAccess({
        userId: owner.uid,
        email: ownerEmail,
        orgId,
        orgName: workspaceName,
        role: 'ADMIN',
      });

      await adminDb.doc(`users/${owner.uid}`).set(
        {
          email: ownerEmail,
          displayName: 'Playwright Workspace Owner',
          updatedAt: createdAt,
        },
        { merge: true },
      );

      const register: Register = {
        registerId,
        ownerId: owner.uid,
        name: 'Workspace Shared Register',
        createdAt,
        workspaceId: orgId,
        organisationName: 'Workspace QA GmbH',
        plan: 'free',
        entitlement: {
          plan: 'free',
          status: 'active',
          source: 'manual',
          updatedAt: createdAt,
          billingProductKey: 'free_register',
        },
      };

      await adminDb.doc(`users/${owner.uid}/registers/${registerId}`).set(register);

      const useCase = prepareUseCaseForStorage(
        {
          purpose: 'Shared Workspace Risk Review',
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
        .doc(`users/${owner.uid}/registers/${registerId}/useCases/${useCaseId}`)
        .set(JSON.parse(JSON.stringify(useCase)));

      await page.goto('/?mode=login');

      await page.getByRole('tab', { name: 'Anmelden' }).click();
      const loginForm = page
        .locator('form')
        .filter({ has: page.getByRole('button', { name: /^Anmelden$/ }) })
        .first();

      await loginForm.getByLabel('E-Mail-Adresse').fill(ownerEmail);
      await loginForm.getByLabel('Passwort').fill(password);
      await loginForm.getByRole('button', { name: /^Anmelden$/ }).click();
      await expect(page).toHaveURL(/\/my-register/);

      await page.goto(`/my-register?workspace=${orgId}`);

      await expect(page.getByText('Workspace QA GmbH').first()).toBeVisible();
      await expect(page.getByText('Shared Workspace Risk Review')).toBeVisible();
      await expect(page.getByRole('button', { name: workspaceName })).toBeVisible();

      await page.goto('/my-register');

      await expect(page.getByText('Workspace QA GmbH').first()).toBeVisible();
      await expect(page.getByText('Shared Workspace Risk Review')).toBeVisible();
      await expect(page.getByRole('button', { name: workspaceName })).toBeVisible();

      await page.getByRole('row', { name: /Shared Workspace Risk Review/ }).click();
      await expect(page).toHaveURL(
        new RegExp(`/my-register/${useCaseId}\\?workspace=${orgId}$`),
      );
      await expect(
        page.getByRole('heading', { name: 'Shared Workspace Risk Review' }),
      ).toBeVisible();

      await page.goto(`/my-register/${useCaseId}`);

      await expect(
        page.getByRole('heading', { name: 'Shared Workspace Risk Review' }),
      ).toBeVisible();

      await page.goto('/settings/governance');

      await expect(
        page.getByRole('heading', {
          level: 1,
          name: 'Settings',
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', {
          level: 2,
          name: 'Governance-Einstellungen',
        }),
      ).toBeVisible();
      await page.getByRole('link', { name: /KI-Register/ }).first().click();
      await expect(page).toHaveURL(
        new RegExp(`/my-register\\?workspace=${orgId}$`),
      );

      await page.screenshot({
        path: testInfo.outputPath('workspace-scope-register.png'),
        fullPage: true,
      });
    } finally {
      if (ownerUid) {
        await adminDb
          .recursiveDelete(adminDb.doc(`users/${ownerUid}/registers/${registerId}`))
          .catch(() => {});
        await adminDb.doc(`users/${ownerUid}`).delete().catch(() => {});
        await adminAuth.deleteUser(ownerUid).catch(() => {});
      }

      await adminDb.recursiveDelete(adminDb.doc(`workspaces/${orgId}`)).catch(() => {});
    }
  });
});
