'use server';

import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Helper to get the current user's UID
const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Benutzer nicht authentifiziert.");
    return user.uid;
};

// Generic function to get a user-specific document
async function getUserDoc(collectionName: string) {
    const userId = getUserId();
    const docRef = doc(db, collectionName, userId);
    const docSnap = await getDoc(docRef);
    return { docRef, docSnap };
}

// --- Functions to replace localStorage operations ---

export async function saveToFirestore(collectionName: string, data: any) {
    const userId = getUserId();
    const docRef = doc(db, collectionName, userId);
    try {
        // Use setDoc with { merge: true } to create or update the document
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error("Error saving to firestore:", error);
        throw new Error("Could not save data.");
    }
}


export async function getFromFirestore(collectionName: string) {
    const { docSnap } = await getUserDoc(collectionName);
    return docSnap.exists() ? docSnap.data() : null;
}

export async function saveAssessmentAnswers(answers: Record<string, string>) {
    // We want to overwrite the answers completely, not merge.
    // So we update the specific field.
    const userId = getUserId();
    const docRef = doc(db, 'userData', userId);
    try {
        await updateDoc(docRef, { assessmentAnswers: answers });
    } catch (e) {
         // If the document doesn't exist, create it.
        await setDoc(docRef, { assessmentAnswers: answers });
    }
}

export async function getAssessmentAnswers() {
    const data = await getFromFirestore('userData');
    return (data as any)?.assessmentAnswers || null;
}

export async function saveCompanyContext(context: object) {
    await saveToFirestore('userData', { companyContext: context });
}

export async function getCompanyContext() {
    const data = await getFromFirestore('userData');
    return (data as any)?.companyContext || null;
}

export async function saveChecklistState(state: object) {
    await saveToFirestore('userData', { checklistState: state });
}

export async function getChecklistState() {
    const data = await getFromFirestore('userData');
    return (data as any)?.checklistState || {};
}

export async function saveCurrentTask(task: object) {
     await saveToFirestore('userData', { currentTask: task });
}

export async function getCurrentTask() {
    const data = await getFromFirestore('userData');
    return (data as any)?.currentTask || null;
}

export async function clearCurrentTask() {
    await saveToFirestore('userData', { currentTask: null });
}
