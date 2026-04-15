'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { doc, onSnapshot } from 'firebase/firestore';
import type { WorkspaceRole } from '@/lib/enterprise/workspace';
import type { RegisterEntitlement } from '@/lib/register-first/types';

export interface WorkspaceMembership {
  orgId: string;
  orgName: string;
  role: WorkspaceRole;
}

export interface UserProfile {
  isOfficer?: boolean;
  licenseKey?: string;
  verifiedAt?: string;
  certifiedBy?: string;
  workspaces?: WorkspaceMembership[];
  workspaceOrgIds?: string[];
  workspaceRolesByOrg?: Record<string, WorkspaceMembership['role']>;
  workspaceEntitlement?: RegisterEntitlement | null;
  [key: string]: any;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const accessSyncRequestedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      accessSyncRequestedRef.current = false;
      return;
    }

    let unsubscribe: (() => void) | undefined;

    async function initProfileListener() {
      try {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const db = await getFirebaseDb();
        const userRef = doc(db, 'users', user!.uid);

        unsubscribe = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const nextProfile = docSnap.data() as UserProfile;
              setProfile(nextProfile);

              const hasLegacyWorkspaceMemberships =
                Array.isArray(nextProfile.workspaces) &&
                nextProfile.workspaces.length > 0;
              const hasSyncedWorkspaceAccess =
                Array.isArray(nextProfile.workspaceOrgIds) &&
                nextProfile.workspaceOrgIds.length > 0;

              if (
                hasLegacyWorkspaceMemberships &&
                !hasSyncedWorkspaceAccess &&
                !accessSyncRequestedRef.current
              ) {
                accessSyncRequestedRef.current = true;
                // Workspace access backfill should only happen in explicit
                // billing/onboarding flows. Triggering it from the generic
                // profile hook creates noisy background 500s on normal pages.
              }
            } else {
              setProfile({});
            }
            setLoading(false);
          },
          (error) => {
            const errorCode =
              error && typeof error === 'object' && 'code' in error
                ? String((error as { code: unknown }).code)
                : null;
            if (errorCode?.includes('permission-denied')) {
              setProfile(null);
              setLoading(false);
              return;
            }
            console.error('Error listening to user profile:', error);
            setLoading(false);
          },
        );
      } catch (error) {
        console.error('Failed to init profile listener:', error);
        setLoading(false);
      }
    }

    initProfileListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return { profile, loading };
}
