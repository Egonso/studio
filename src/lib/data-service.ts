
'use client';

import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { AIProject, AIProjectAssessment, AIProjectDecisionLog } from './types-portfolio';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// --- Constants ---
const MONTHLY_TOKEN_LIMIT = 1000000;

// --- Lazy Firebase Loaders ---
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

async function getAuth(): Promise<Auth> {
    if (authInstance) return authInstance;
    const { getFirebaseAuth } = await import('./firebase');
    authInstance = await getFirebaseAuth();
    return authInstance;
}

async function getDb(): Promise<Firestore> {
    if (dbInstance) return dbInstance;
    const { getFirebaseDb } = await import('./firebase');
    dbInstance = await getFirebaseDb();
    return dbInstance;
}

// Helper to get the current user's ID
async function getUserId(): Promise<string | null> {
    const auth = await getAuth();
    return auth.currentUser?.uid || null;
}

// --- New Project-Based Data Structure ---

async function getProjectsCollectionRef(userId: string) {
    const db = await getDb();
    const { collection } = await import('firebase/firestore');
    return collection(db, `users/${userId}/projects`);
}

export async function getProjectDocRef(userId: string, projectId: string) {
    const db = await getDb();
    const { doc } = await import('firebase/firestore');
    return doc(db, `users/${userId}/projects`, projectId);
}


// --- Project Management Functions ---

export async function createProject(projectName: string, metadata: { sector: string; systemType: string; riskIndicators: string[] }) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");

    const { addDoc, serverTimestamp } = await import('firebase/firestore');
    const projectsCollectionRef = await getProjectsCollectionRef(userId);
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
            stakeholders: [{ id: '1', name: '', type: 'external', concerns: '' }],
            advice: null,
            antiPatternDescription: '',
            antiPatternAnalysis: null,
            valueMapping: {},
            valueTensions: [],
            requirements: [],
            valueInfluenceAnalysis: null,
        },
        aimsData: {},
        aimsProgress: {},
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
    const userId = await getUserId();
    if (!userId) return [];

    const { query, orderBy, getDocs } = await import('firebase/firestore');
    const projectsCollectionRef = await getProjectsCollectionRef(userId);
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

async function getProjectData<T extends keyof ProjectData>(field: T): Promise<ProjectData[T] | null> {
    const userId = await getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) return null;

    const { getDoc } = await import('firebase/firestore');
    const projectDocRef = await getProjectDocRef(userId, projectId);
    const docSnap = await getDoc(projectDocRef);

    if (docSnap.exists()) {
        const projectData = docSnap.data() as ProjectData;
        return projectData[field] || null;
    }
    return null;
}

export async function getFullProject(): Promise<ProjectData | null> {
    const userId = await getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) return null;

    const { getDoc } = await import('firebase/firestore');
    const projectDocRef = await getProjectDocRef(userId, projectId);
    const docSnap = await getDoc(projectDocRef);

    if (docSnap.exists()) {
        return docSnap.data() as ProjectData;
    }
    return null;
}


async function saveProjectData(data: Partial<ProjectData>): Promise<void> {
    const userId = await getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) throw new Error("User or project not identified");

    const { setDoc } = await import('firebase/firestore');
    const projectDocRef = await getProjectDocRef(userId, projectId);
    setDoc(projectDocRef, data, { merge: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: projectDocRef.path,
            operation: 'update',
            requestResourceData: data
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

export interface AimsProgress {
    step1_complete?: boolean;
    step2_complete?: boolean;
    step3_complete?: boolean;
    step4_complete?: boolean;
    step5_complete?: boolean;
    step6_complete?: boolean;
    updatedAt?: any;
}


interface ProjectData {
    assessmentAnswers: Record<string, string>;
    companyContext: object;
    checklistState: object;
    designCanvas: object;
    aimsData: object;
    aimsProgress: AimsProgress;
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
            stakeholders: [{ id: '1', name: '', type: 'external', concerns: '' }],
            advice: null,
            antiPatternDescription: '',
            antiPatternAnalysis: null,
            valueMapping: {},
            valueTensions: [],
            requirements: [],
            valueInfluenceAnalysis: null,
        },
        aimsData: {},
        aimsProgress: {},
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
    await saveProjectData({ designCanvas: { ...existingData, ...data } });
}

export async function getDesignCanvasData() {
    return getProjectData('designCanvas');
}

export async function saveAimsData(data: object, progress: AimsProgress) {
    const { serverTimestamp } = await import('firebase/firestore');
    await saveProjectData({
        aimsData: data,
        aimsProgress: {
            ...progress,
            updatedAt: serverTimestamp()
        }
    });
}

export async function getAimsData() {
    return getProjectData('aimsData');
}

export async function getAimsProgress() {
    return getProjectData('aimsProgress');
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
async function getUserDocRef(userId: string, docId: 'courseProgress' | 'currentTask' | 'tokenUsage') {
    const db = await getDb();
    const { doc } = await import('firebase/firestore');
    return doc(db, `users/${userId}/appData`, docId);
}

export async function saveCourseProgress(completedVideoIds: string[]) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    const { setDoc } = await import('firebase/firestore');
    const docRef = await getUserDocRef(userId, 'courseProgress');
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
    const userId = await getUserId();
    if (!userId) return [];
    const { getDoc } = await import('firebase/firestore');
    const docRef = await getUserDocRef(userId, 'courseProgress');
    const docSnap = await getDoc(docRef);
    const data = docSnap.exists() ? docSnap.data() : null;
    return data?.completedVideoIds || [];
}

// --- Token Usage Tracking & Limiting ---

export async function isUserOverTokenLimit(): Promise<boolean> {
    const userId = await getUserId();
    if (!userId) {
        return true;
    }
    const { getDoc } = await import('firebase/firestore');
    const docRef = await getUserDocRef(userId, 'tokenUsage');
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
    const userId = await getUserId();
    if (!userId) return;

    const { getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const docRef = await getUserDocRef(userId, 'tokenUsage');
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
// --- Current Task (moved to sessionStorage for performance) ---
export async function saveCurrentTask(task: object) {
    if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('currentTask', JSON.stringify(task));
    }
}

export async function getCurrentTask() {
    if (typeof window !== 'undefined') {
        const taskStr = window.sessionStorage.getItem('currentTask');
        return taskStr ? JSON.parse(taskStr) : null;
    }
    return null;
}

export async function clearCurrentTask() {
    if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('currentTask');
    }
}


// --- Shared Policy Functions ---
export async function createSharedPolicy(policyData: any): Promise<{ policyId: string | null }> {
    const authorId = await getUserId();
    const projectId = getActiveProjectId();

    if (!authorId || !projectId) {
        console.error("User or project not authenticated for sharing policy.");
        return { policyId: null };
    }

    const db = await getDb();
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
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
        const db = await getDb();
        const { doc, getDoc } = await import('firebase/firestore');
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

// --- Portfolio (Pillar 3) Functions ---

async function getPortfolioCollectionRef(userId: string, projectId: string) {
    const db = await getDb();
    const { collection } = await import('firebase/firestore');
    return collection(db, `users/${userId}/projects/${projectId}/portfolio`);
}

async function getPortfolioDecisionsCollectionRef(userId: string, projectId: string, portfolioId: string) {
    const db = await getDb();
    const { collection } = await import('firebase/firestore');
    return collection(db, `users/${userId}/projects/${projectId}/portfolio/${portfolioId}/decisions`);
}

export async function createPortfolioProject(projectData: Omit<AIProject, 'id' | 'createdAt'>): Promise<string> {
    const userId = await getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) throw new Error("User or project not identified");

    const { addDoc, serverTimestamp } = await import('firebase/firestore');
    const collectionRef = await getPortfolioCollectionRef(userId, projectId);
    const docRef = await addDoc(collectionRef, {
        ...projectData,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getPortfolioProjects(): Promise<(AIProject & { assessment?: AIProjectAssessment })[]> {
    const userId = await getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) return [];

    const { query, orderBy, getDocs } = await import('firebase/firestore');
    const collectionRef = await getPortfolioCollectionRef(userId, projectId);
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIProject & { assessment?: AIProjectAssessment }));
}

export async function updatePortfolioProjectAssessment(portfolioProjectId: string, assessment: Omit<AIProjectAssessment, 'projectId' | 'updatedAt'>) {
    const userId = await getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) throw new Error("User or project not identified");

    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const docRef = doc(db, `users/${userId}/projects/${projectId}/portfolio`, portfolioProjectId);
    await setDoc(docRef, { assessment: { ...assessment, updatedAt: serverTimestamp() } }, { merge: true });
}

export async function addPortfolioDecision(portfolioProjectId: string, decision: Omit<AIProjectDecisionLog, 'id' | 'projectId' | 'date'>) {
    const userId = await getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) throw new Error("User or project not identified");

    const { addDoc, serverTimestamp } = await import('firebase/firestore');
    const collectionRef = await getPortfolioDecisionsCollectionRef(userId, projectId, portfolioProjectId);
    await addDoc(collectionRef, {
        ...decision,
        projectId: portfolioProjectId,
        date: serverTimestamp(),
    });
}

export async function getPortfolioDecisions(portfolioProjectId: string): Promise<AIProjectDecisionLog[]> {
    const userId = await getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) return [];

    const { query, orderBy, getDocs } = await import('firebase/firestore');
    const collectionRef = await getPortfolioDecisionsCollectionRef(userId, projectId, portfolioProjectId);
    const q = query(collectionRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIProjectDecisionLog));
}
// --- Task Guide Persistence ---

async function getTaskGuidesCollectionRef(userId: string, projectId: string) {
    const db = await getDb();
    const { collection } = await import('firebase/firestore');
    return collection(db, `users/${userId}/projects/${projectId}/taskGuides`);
}

export async function saveTaskGuide(taskId: string, guide: any) {
    const userId = await getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) throw new Error("User or project not identified");

    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const docRef = doc(db, `users/${userId}/projects/${projectId}/taskGuides`, taskId);

    await setDoc(docRef, {
        guide,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

export async function getTaskGuide(taskId: string) {
    const userId = await getUserId();
    const projectId = getActiveProjectId();
    if (!userId || !projectId) return null;

    const db = await getDb();
    const { doc, getDoc } = await import('firebase/firestore');
    const docRef = doc(db, `users/${userId}/projects/${projectId}/taskGuides`, taskId);
    const docSnap = await getDoc(docRef);

    return docSnap.exists() ? docSnap.data().guide : null;
}
