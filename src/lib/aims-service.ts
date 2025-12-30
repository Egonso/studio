```typescript
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { IsoAims } from '@/lib/types/db-types';

/**
 * Saves or updates the Organization-wide ISO AIMS data.
 * @param orgId The organization ID (usually from the project)
 * @param data The AIMS wizard data (policy, scope, risk, etc.)
 */
export async function saveIsoAims(orgId: string, data: Partial<IsoAims> & { wizardData?: any }) {
    const db = await getFirebaseDb();
    const aimsId = `${ orgId } _main`; // Deterministic Singleton ID
    const aimsRef = doc(db, 'isoAIMS', aimsId);

    // We store the generic wizard data inside 'wizardData' or flat, depends on preference.
    // The Architecture kept it generic. Let's start with flat merge but ensuring types.

    // Check existence to decide SET (merge) or UPDATE
    const snap = await getDoc(aimsRef);

    if (!snap.exists()) {
        await setDoc(aimsRef, {
            id: aimsId,
            orgId,
            status: 'setup',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...data
        });
    } else {
        await updateDoc(aimsRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }
}

/**
 * Retrieves the Organization-wide ISO AIMS data.
 */
export async function getIsoAims(orgId: string): Promise<IsoAims | null> {
    const db = await getFirebaseDb();
    const aimsId = `${ orgId } _main`;
    const docRef = doc(db, 'isoAIMS', aimsId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as IsoAims;
    }
    return null;
}
