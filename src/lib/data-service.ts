
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
        console.error("User not authenticated. Cannot save data.");
        return;
    }
    const docRef = getAppDataDocRef(userId, docId);
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
    // When a new assessment is saved, clear old checklist and context data
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

export async function getCompanyContext() {
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
