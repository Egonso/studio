'use server';

import {
  getAdminAuth,
  getAdminDb,
  hasFirebaseAdminCredentials,
} from '@/lib/firebase-admin';
import { repairAndSyncBillingEntitlement } from '@/lib/billing/product-entitlement-sync';
import { requireAdmin } from '@/lib/server-auth';

function canLoadAdminData(): boolean {
  return hasFirebaseAdminCredentials();
}

/**
 * Verifies if the current user is an admin.
 * Throws an error if not authorized.
 */
export async function verifyAdmin(idToken: string) {
  return requireAdmin(idToken);
}

export async function getAdminStats(idToken: string) {
  await verifyAdmin(idToken);

  if (!canLoadAdminData()) {
    return { projects: 0, feedbackTotal: 0, openBugs: 0, usersEstimate: 0 };
  }

  try {
    const db = getAdminDb();
    const projectsSnap = await db.collectionGroup('registers').count().get();
    const projectCount = projectsSnap.data().count;

    const feedbackSnap = await db.collection('feedback').count().get();
    const feedbackCount = feedbackSnap.data().count;

    // Open bugs?
    const bugsSnap = await db
      .collection('feedback')
      .where('type', '==', 'bug')
      .where('status', '==', 'open')
      .count()
      .get();
    const openBugs = bugsSnap.data().count;

    return {
      projects: projectCount,
      feedbackTotal: feedbackCount,
      openBugs: openBugs,
      usersEstimate: 0, // Placeholder until we have a better way
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return { projects: 0, feedbackTotal: 0, openBugs: 0, usersEstimate: 0 };
  }
}

export async function getFeedbackList(
  idToken: string,
  filterVal: string = 'all',
) {
  await verifyAdmin(idToken);

  if (!canLoadAdminData()) {
    return [];
  }

  try {
    const db = getAdminDb();
    let query = db.collection('feedback').orderBy('createdAt', 'desc');

    if (filterVal !== 'all') {
      query = query.where('status', '==', filterVal);
    }

    const snapshot = await query.limit(50).get();

    const feedback = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return feedback;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
}

export async function updateFeedbackStatus(
  idToken: string,
  id: string,
  newStatus: string,
) {
  await verifyAdmin(idToken);
  if (!canLoadAdminData()) {
    return { success: false };
  }
  try {
    const db = getAdminDb();
    await db.collection('feedback').doc(id).update({
      status: newStatus,
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating feedback:', error);
    return { success: false };
  }
}

export async function getPlatformUsers(idToken: string, limit: number = 20) {
  await verifyAdmin(idToken);
  if (!canLoadAdminData()) {
    return [];
  }
  try {
    // Fetch users from Firebase Auth
    const auth = getAdminAuth();
    const listUsersResult = await auth.listUsers(limit);

    return listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      creationTime: userRecord.metadata.creationTime,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function repairBillingEntitlement(
  idToken: string,
  email: string,
  userId?: string | null,
) {
  await verifyAdmin(idToken);

  if (!canLoadAdminData()) {
    throw new Error('Firebase Admin credentials are not configured.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email is required.');
  }

  return repairAndSyncBillingEntitlement({
    email: normalizedEmail,
    userId: userId ?? null,
    source: 'billing_repair',
  });
}
