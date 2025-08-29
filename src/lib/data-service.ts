
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
    const { docRef, docSnap } = await getUserDoc(collectionName);
    if (docSnap.exists()) {
        await updateDoc(docRef, data);
    } else {
        await setDoc(docRef, data);
    }
}

export async function getFromFirestore(collectionName: string) {
    const { docSnap } = await getUserDoc(collectionName);
    return docSnap.exists() ? docSnap.data() : null;
}

export async function saveAssessmentAnswers(answers: Record<string, string>) {
    await saveToFirestore('assessmentAnswers', { answers });
}

export async function getAssessmentAnswers() {
    const data = await getFromFirestore('assessmentAnswers');
    return data?.answers || null;
}

export async function saveCompanyContext(context: object) {
    await saveToFirestore('companyContext', context);
}

export async function getCompanyContext() {
    return await getFromFirestore('companyContext');
}

export async function saveChecklistState(state: object) {
    await saveToFirestore('checklistState', { state });
}

export async function getChecklistState() {
    const data = await getFromFirestore('checklistState');
    return data?.state || {};
}

export async function saveCurrentTask(task: object) {
    await saveToFirestore('currentTask', { task });
}

export async function getCurrentTask() {
    const data = await getFromFirestore('currentTask');
    return data?.task || null;
}

export async function clearCurrentTask() {
    await saveToFirestore('currentTask', {