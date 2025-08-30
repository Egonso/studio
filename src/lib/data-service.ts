
'use client';

import { auth, db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp, writeBatch, updateDoc } from 'firebase/firestore';

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

export async function createProject(projectName: string) {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const projectsCollectionRef = getProjectsCollectionRef(userId);
    const newProjectRef = await addDoc(projectsCollectionRef, {
        projectName,
        createdAt: serverTimestamp(),
        // Initialize empty data to prevent errors on first load
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
    });

    return newProjectRef.id;
}

export async function getUserProjects() {
    const userId = getUserId();
    if (!userId) return [];

    const projectsCollectionRef = getProjectsCollectionRef(userId);
    const q = query(projectsCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as { id: string, projectName: string, createdAt: any }));
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
    await setDoc(projectDocRef, data, { merge: true });
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
        exportedInsights: []
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
const getUserDocRef = (userId: string, docId: 'courseProgress' | 'currentTask') => {
    return doc(db, `users/${userId}/appData`, docId);
};

export async function saveCourseProgress(completedVideoIds: string[]) {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");
    const docRef = getUserDocRef(userId, 'courseProgress');
    await setDoc(docRef, { completedVideoIds }, { merge: true });
}

export async function getCourseProgress(): Promise<string[]> {
    const userId = getUserId();
    if (!userId) return [];
    const docRef = getUserDocRef(userId, 'courseProgress');
    const docSnap = await getDoc(docRef);
    const data = docSnap.exists() ? docSnap.data() : null;
    return data?.completedVideoIds || [];
}


// --- Current Task (remains user-specific for simplicity) ---
export async function saveCurrentTask(task: object) {
    const userId = getUserId();
    if (!userId) return;
    await setDoc(getUserDocRef(userId, 'currentTask'), task);
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
    await deleteDoc(getUserDocRef(userId, 'currentTask'));
}


// --- Onboarding Logic ---
export async function checkOnboardingStatus(projectId?: string): Promise<string> {
    const activeProjectId = projectId || getActiveProjectId();

    if (!activeProjectId) {
        return '/projects';
    }

    const answers = await getAssessmentAnswers();
    if (!answers || Object.keys(answers).length === 0) {
        return '/assessment';
    }

    if (answers.q1 === 'no') {
        return `/dashboard?projectId=${activeProjectId}`;
    }

    const context = await getCompanyContext();
    if (!context || Object.keys(context).length === 0 || !(context as any).companyDescription) {
        return '/assessment/context';
    }

    return `/dashboard?projectId=${activeProjectId}`;
}
