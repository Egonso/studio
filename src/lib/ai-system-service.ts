import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    updateDoc,
    orderBy
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { AiSystem } from '@/lib/types/db-types';

/**
 * Creates or links an AI System based on title and department deduplication.
 */
export async function createOrLinkAiSystem(
    orgId: string,
    workspaceId: string,
    title: string,
    department: string = "General"
): Promise<{ systemId: string, isNew: boolean, system: AiSystem }> {

    const normalizedTitle = title.trim().toLowerCase();
    const normalizedDept = department.trim().toLowerCase();
    const dedupeKey = `${normalizedTitle}_${normalizedDept}`;

    const db = await getFirebaseDb();
    const systemsRef = collection(db, 'aiSystems');

    // 1. Check for existing system (Dedupe)
    // Note: Requires Index on (orgId ASC, dedupeKey ASC)
    const q = query(
        systemsRef,
        where('orgId', '==', orgId),
        where('dedupeKey', '==', dedupeKey)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        // Found existing -> Return it
        const docSnap = snapshot.docs[0];
        const existingSystem = { id: docSnap.id, ...docSnap.data() } as AiSystem;
        return { systemId: docSnap.id, isNew: false, system: existingSystem };
    }

    // 2. Create NEW System
    const newSystemData: Omit<AiSystem, 'id'> = { // Omit ID handled by Firestore
        orgId,
        primaryWorkspaceId: workspaceId,
        title: title.trim(),
        department: department.trim(),
        dedupeKey,
        lifecycleStatus: 'idea',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    // @ts-ignore - serverTimestamp type mismatch usually handled by ignoring or using partial
    const docRef = await addDoc(systemsRef, newSystemData);

    return {
        systemId: docRef.id,
        isNew: true,
        system: { id: docRef.id, ...newSystemData } as AiSystem
    };
}

/**
 * Gets all AI Systems for a specific Workspace (Project)
 */
export async function getAiSystemsForWorkspace(workspaceId: string): Promise<AiSystem[]> {
    const db = await getFirebaseDb();
    const systemsRef = collection(db, 'aiSystems');
    // Note: Requires Index on (primaryWorkspaceId ASC, updatedAt DESC)
    const q = query(
        systemsRef,
        where('primaryWorkspaceId', '==', workspaceId),
        orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AiSystem));
}

/**
 * Gets a single AI System by ID
 */
export async function getAiSystem(systemId: string): Promise<AiSystem | null> {
    const db = await getFirebaseDb();
    const docRef = doc(db, 'aiSystems', systemId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as AiSystem;
    }
    return null;
}

/**
 * Updates an AI System
 */
export async function updateAiSystem(systemId: string, data: Partial<AiSystem>) {
    const db = await getFirebaseDb();
    const docRef = doc(db, 'aiSystems', systemId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
}
