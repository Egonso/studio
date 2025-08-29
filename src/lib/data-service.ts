
'use server';

import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Helper to get the current user's UID
const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Benutzer nicht authentifiziert.");
    return user.uid;
};

// Generic function to get a user-specific document
async function getUserDoc(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return { docRef, docSnap };
}

// --- Functions to save and retrieve data using setDoc for robustness ---

async function saveData(data: object) {
    const userId = getUserId();
    const docRef = doc(db, 'userData', userId);
    try {
        // Use setDoc with { merge: true } to create or update the document.
        // This is safer than updateDoc for new users.
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        throw new Error("Daten konnten nicht gespeichert werden.");
    }
}

async function getData() {
    const userId = getUserId();
    const { docSnap } = await getUserDoc('userData', userId);
    return docSnap.exists() ? docSnap.data() : null;
}


// --- Specific data functions ---

export async function saveAssessmentAnswers(answers: Record<string, string>) {
    await saveData({ assessmentAnswers: answers });
}

export async function getAssessmentAnswers() {
    const data = await getData();
    return (data as any)?.assessmentAnswers || null;
}

export async function saveCompanyContext(context: object) {
    await saveData({ companyContext: context });
}

export async function getCompanyContext() {
    const data = await getData();
    return (data as any)?.companyContext || null;
}

export async function saveChecklistState(state: object) {
    await saveData({ checklistState: state });
}

export async function getChecklistState() {
    const data = await getData();
    return (data as any)?.checklistState || {};
}

export async function saveCurrentTask(task: object) {
     await saveData({ currentTask: task });
}

export async function getCurrentTask() {
    const data = await getData();
    return (data as any)?.currentTask || null;
}

export async function clearCurrentTask() {
    await saveData({ currentTask: null });
}
