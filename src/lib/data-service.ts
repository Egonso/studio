
'use client';

import { auth, db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp, writeBatch, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// --- Constants ---
const MONTHLY_TOKEN_LIMIT = 1000000;

// Helper to get the current user's ID
const getUserId = (): string | null => {
    return auth.currentUser?.uid || null;
};

// --- New Project-Based Data Structure ---

const getProjectsCollectionRef = (userId: string) => {
    return collection(db, `users/${userId}/projects`);
}

export const getProjectDocRef = (userId: string, projectId: string) => {
    return doc(db, `users/${userId}/projects`, projectId);
}


// --- Project Management Functions ---

export async function createProject(projectName: string, metadata: { sector: string; systemType: string; riskIndicators: string[] }) {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const projectsCollectionRef = getProjectsCollectionRef(userId);
    const docRef = await addDoc(projectsCollectionRef, {
        projectName,
        metadata: {
            ...metadata,
            createdAt: serverTimestamp(),
        },
        assessmentAnswers: {},
        companyContext: {},
        checklistState: {},
        designCanvas: {
            projectContext: '',
            advice: null,
            antiPatternDescription: '',
            antiPatternAnalysis: null,
        },
        exportedInsights: [],
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: projectsCollectionRef.path,
            operation: 'create',
            requestResourceData: { projectName, metadata }
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });

    return docRef.id;
}

export async function getUserProjects() {
    const userId = getUserId();
    if (!userId) return [];

    const projectsCollectionRef = getProjectsCollectionRef(userId);
    const q = query(projectsCollectionRef, orderBy('metadata.createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as { id: string, projectName: string, metadata: any }));
}


// --- Active Project State (using sessionStorage) ---

export function setActiveProjectId(projectId: string) {
    if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('activeProjectId', projectId);
    }
}

export function getActiveProjectId(): string | null {
    if (typeof window !== 'undefined') {
        return window.sessionStorage.getItem('activeProjectId');
    }
    return null;
}

export function clearActiveProjectId() {
    if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('activeProjectId');
    }
}


// --- Project-Specific Data Functions ---

const getProjectData = async <T extends keyof ProjectData>(field: T): Promise<ProjectData[T] | null> => {
    const userId = getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) return null;

    const projectDocRef = getProjectDocRef(userId, projectId);
    const docSnap = await getDoc(projectDocRef);

    if (docSnap.exists()) {
        const projectData = docSnap.data() as ProjectData;
        return projectData[field] || null;
    }
    return null;
}

const saveProjectData = async (data: Partial<ProjectData>): Promise<void> => {
    const userId = getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) throw new Error("User or project not identified");

    const projectDocRef = getProjectDocRef(userId, projectId);
    setDoc(projectDocRef, data, { merge: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: projectDocRef.path,
            operation: 'update',
            requestResourceData: data
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

interface ProjectData {
    assessmentAnswers: Record<string, string>;
    companyContext: object;
    checklistState: object;
    designCanvas: object;
    courseProgress: { completedVideoIds: string[] };
    exportedInsights: string[];
}

// These functions now operate on the active project
export async function saveAssessmentAnswers(answers: Record<string, string>) {
    // When new assessment is saved, clear old context and checklist state for this project
    await saveProjectData({ 
        assessmentAnswers: answers,
        companyContext: {},
        checklistState: {},
        exportedInsights: [],
        designCanvas: {
            projectContext: '',
            advice: null,
            antiPatternDescription: '',
            antiPatternAnalysis: null,
        }
    });
}

export async function getAssessmentAnswers(): Promise<Record<string, string> | null> {
    return getProjectData('assessmentAnswers');
}

export async function saveCompanyContext(context: object) {
    await saveProjectData({ companyContext: context });
}

export async function getCompanyContext(): Promise<object | null> {
    return getProjectData('companyContext');
}

export async function saveChecklistState(state: object) {
    await saveProjectData({ checklistState: state });
}

export async function getChecklistState() {
    const state = await getProjectData('checklistState');
    return state || {};
}

export async function saveDesignCanvasData(data: object) {
    const existingData = await getDesignCanvasData() || {};
    await saveProjectData({ designCanvas: {...existingData, ...data }});
}

export async function getDesignCanvasData() {
    return getProjectData('designCanvas');
}

export async function getExportedInsights(): Promise<string[]> {
    const insights = await getProjectData('exportedInsights');
    return insights || [];
}

export async function saveExportedInsight(insight: string) {
    const currentInsights = await getExportedInsights();
    await saveProjectData({ exportedInsights: [...currentInsights, insight] });
}


// --- Course Progress (remains user-specific, not project-specific) ---
const getUserDocRef = (userId: string, docId: 'courseProgress' | 'currentTask' | 'tokenUsage') => {
    return doc(db, `users/${userId}/appData`, docId);
};

export async function saveCourseProgress(completedVideoIds: string[]) {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");
    const docRef = getUserDocRef(userId, 'courseProgress');
    setDoc(docRef, { completedVideoIds }, { merge: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: { completedVideoIds }
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

export async function getCourseProgress(): Promise<string[]> {
    const userId = getUserId();
    if (!userId) return [];
    const docRef = getUserDocRef(userId, 'courseProgress');
    const docSnap = await getDoc(docRef);
    const data = docSnap.exists() ? docSnap.data() : null;
    return data?.completedVideoIds || [];
}

// --- Token Usage Tracking & Limiting ---

export async function isUserOverTokenLimit(): Promise<boolean> {
    const userId = getUserId();
    if (!userId) {
        return true;
    }
    const docRef = getUserDocRef(userId, 'tokenUsage');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return false;
    }

    const data = docSnap.data();
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    if (data.month !== currentMonth) {
        return false;
    }

    return (data.total || 0) >= MONTHLY_TOKEN_LIMIT;
}

export async function updateTokenUsage(tokensUsed: number) {
    const userId = getUserId();
    if (!userId) return;

    const docRef = getUserDocRef(userId, 'tokenUsage');
    const docSnap = await getDoc(docRef);

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let newTotal = tokensUsed;

    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.month === currentMonth) {
            newTotal += data.total || 0;
        }
    }

    setDoc(docRef, {
        total: newTotal,
        month: currentMonth,
        lastUpdated: serverTimestamp(),
    }, { merge: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: { total: newTotal, month: currentMonth }
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}


// --- Current Task (remains user-specific for simplicity) ---
export async function saveCurrentTask(task: object) {
    const userId = getUserId();
    if (!userId) return;
    const docRef = getUserDocRef(userId, 'currentTask');
    setDoc(docRef, task).catch(async (serverError) => {
         const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'create',
            requestResourceData: task
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

export async function getCurrentTask() {
    const userId = getUserId();
    if (!userId) return null;
    const docSnap = await getDoc(getUserDocRef(userId, 'currentTask'));
    return docSnap.exists() ? docSnap.data() : null;
}

export async function clearCurrentTask() {
    const userId = getUserId();
    if (!userId) return;
    const docRef = getUserDocRef(userId, 'currentTask');
    deleteDoc(docRef).catch(async (serverError) => {
         const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}


// --- Shared Policy Functions ---
export async function createSharedPolicy(policyData: any): Promise<{ policyId: string | null }> {
    const authorId = getUserId();
    const projectId = getActiveProjectId();

    if (!authorId || !projectId) {
        console.error("User or project not authenticated for sharing policy.");
        return { policyId: null };
    }
    
    const collectionRef = collection(db, "sharedPolicies");
    const dataToSave = {
        ...policyData,
        authorId,
        projectId,
        createdAt: serverTimestamp(),
    };

    try {
        const docRef = await addDoc(collectionRef, dataToSave);
        return { policyId: docRef.id };
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave
        });
        errorEmitter.emit('permission-error', permissionError);
        return { policyId: null };
    }
}

export async function getSharedPolicy(policyId: string) {
    if (!policyId) return null;

    try {
        const docRef = doc(db, 'sharedPolicies', policyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.warn(`No shared policy found with id: ${policyId}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching shared policy with id ${policyId}:`, error);
        return null;
    }
}
