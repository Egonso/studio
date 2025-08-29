
'use client';

import { auth, db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// Helper to get the current user's ID
const getUserId = (): string | null => {
    return auth.currentUser?.uid || null;
};

// --- Firestore Document References ---

const getAppDataDocRef = (userId: string, docId: 'assessmentAnswers' | 'companyContext' | 'checklistState' | 'currentTask' | 'courseProgress') => {
    return doc(db, `users/${userId}/appData`, docId);
};


// --- Generic Data Functions ---

const saveData = async <T extends object>(docId: 'assessmentAnswers' | 'companyContext' | 'checklistState' | 'courseProgress', data: T): Promise<void> => {
    const userId = getUserId();
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const docRef = getAppDataDocRef(userId, docId);
    await setDoc(docRef, data, { merge: true });
};

const getData = async <T>(docId: 'assessmentAnswers' | 'companyContext' | 'checklistState' | 'courseProgress'): Promise<T | null> => {
    const userId = getUserId();
    if (!userId) {
        return null;
    }
    const docRef = getAppDataDocRef(userId, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as T : null;
};


// --- Specific Data Functions ---

export async function saveAssessmentAnswers(answers: Record<string, string>) {
    await saveData('assessmentAnswers', { answers });
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
    const data = await getData<object>('companyContext');
    return data ? data : null;
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
    const taskDocRef = getAppDataDocRef(userId, 'currentTask');
    await setDoc(taskDocRef, task);
}

export async function getCurrentTask() {
    const userId = getUserId();
    if (!userId) return null;
    const taskDocRef = getAppDataDocRef(userId, 'currentTask');
    const docSnap = await getDoc(taskDocRef);
    return docSnap.exists() ? docSnap.data() : null;
}

export async function clearCurrentTask() {
    const userId = getUserId();
    if (!userId) return;
    const taskDocRef = getAppDataDocRef(userId, 'currentTask');
    await deleteDoc(taskDocRef);
}

export async function saveCourseProgress(completedVideoIds: string[]) {
    await saveData('courseProgress', { completedVideoIds });
}

export async function getCourseProgress(): Promise<string[]> {
    const data = await getData<{ completedVideoIds: string[] }>('courseProgress');
    return data?.completedVideoIds || [];
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
