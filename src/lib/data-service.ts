
'use client';

import { auth, db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// Helper to get the current user's ID
const getUserId = (): string | null => {
    return auth.currentUser?.uid || null;
};

// --- Firestore Document References ---

const getUserDocRef = (userId: string) => doc(db, 'users', userId);
const getTaskDocRef = (userId: string) => doc(db, `users/${userId}/appData`, 'currentTask');
const getAppDataDocRef = (userId: string, docId: 'assessmentAnswers' | 'companyContext' | 'checklistState') => {
    return doc(db, `users/${userId}/appData`, docId);
};


// --- Generic Data Functions ---

const saveData = async <T extends object>(docId: 'assessmentAnswers' | 'companyContext' | 'checklistState', data: T): Promise<void> => {
    const userId = getUserId();
    if (!userId) {
        // This case should ideally be handled by UI guards (e.g., redirecting to login)
        console.error("User not authenticated. Cannot save data.");
        // We throw an error to make it clear that the operation failed.
        throw new Error("User not authenticated");
    }
    const docRef = getAppDataDocRef(userId, docId);
    // Using merge: true to avoid overwriting the whole document if we only want to update parts of it
    await setDoc(docRef, data, { merge: true });
};

const getData = async <T>(docId: 'assessmentAnswers' | 'companyContext' | 'checklistState'): Promise<T | null> => {
    const userId = getUserId();
    if (!userId) {
        console.error("User not authenticated. Cannot get data.");
        return null;
    }
    const docRef = getAppDataDocRef(userId, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as T : null;
};


// --- Specific Data Functions ---

export async function saveAssessmentAnswers(answers: Record<string, string>) {
    await saveData('assessmentAnswers', { answers });
    // When a new assessment is saved, clear old checklist and context data to ensure a fresh start
    const userId = getUserId();
    if (!userId) return;
    await setDoc(getAppDataDocRef(userId, 'checklistState'), {}, { merge: false }); // Overwrite
    await setDoc(getAppDataDocRef(userId, 'companyContext'), {}, { merge: false }); // Overwrite
}

export async function getAssessmentAnswers(): Promise<Record<string, string> | null> {
    const data = await getData<{ answers: Record<string, string> }>('assessmentAnswers');
    return data ? data.answers : null;
}

export async function saveCompanyContext(context: object) {
    await saveData('companyContext', context);
}

export async function getCompanyContext(): Promise<object | null> {
    return await getData<object>('companyContext');
}

export async function saveChecklistState(state: object) {
    await saveData('checklistState', state);
}

export async function getChecklistState() {
    const state = await getData<any>('checklistState');
    return state || {};
}

export async function saveCurrentTask(task: object) {
    const userId = getUserId();
    if (!userId) return;
    await setDoc(getTaskDocRef(userId), task);
}

export async function getCurrentTask() {
    const userId = getUserId();
    if (!userId) return null;
    const docSnap = await getDoc(getTaskDocRef(userId));
    return docSnap.exists() ? docSnap.data() : null;
}

export async function clearCurrentTask() {
    const userId = getUserId();
    if (!userId) return;
    await deleteDoc(getTaskDocRef(userId));
}

/**
 * Checks if the user has completed all onboarding steps.
 * Returns the path to redirect to if a step is incomplete.
 * @returns {Promise<string>} '/dashboard' if complete, otherwise the path to the incomplete step.
 */
export async function checkOnboardingStatus(): Promise<string> {
    const answers = await getAssessmentAnswers();
    if (!answers || Object.keys(answers).length === 0) {
        return '/assessment';
    }

    // A user who selects "no AI" in the first question is compliant and has no further steps.
    if (answers.q1 === 'no') {
        return '/dashboard';
    }

    const context = await getCompanyContext();
    if (!context || Object.keys(context).length === 0 || !(context as any).companyDescription) {
        return '/assessment/context';
    }

    return '/dashboard';
}
