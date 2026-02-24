import type { PolicyDocument } from "./types";

// ── Scope ───────────────────────────────────────────────────────────────────

export interface PolicyScope {
    userId: string;
    registerId: string;
}

// ── Repository Interface ────────────────────────────────────────────────────

export interface PolicyRepository {
    create(scope: PolicyScope, doc: PolicyDocument): Promise<PolicyDocument>;
    getById(scope: PolicyScope, policyId: string): Promise<PolicyDocument | null>;
    list(scope: PolicyScope): Promise<PolicyDocument[]>;
    save(scope: PolicyScope, doc: PolicyDocument): Promise<PolicyDocument>;
    softDelete(scope: PolicyScope, policyId: string): Promise<void>;
}

// ── Firestore Implementation ────────────────────────────────────────────────

async function getPoliciesCollectionRef(scope: PolicyScope) {
    const { getFirebaseDb } = await import("@/lib/firebase");
    const db = await getFirebaseDb();
    const { collection } = await import("firebase/firestore");
    return collection(
        db,
        `users/${scope.userId}/registers/${scope.registerId}/policies`,
    );
}

export function createFirestorePolicyRepository(): PolicyRepository {
    return {
        async create(scope, doc) {
            const { doc: firestoreDoc, setDoc } = await import("firebase/firestore");
            const collectionRef = await getPoliciesCollectionRef(scope);
            const docRef = firestoreDoc(collectionRef, doc.policyId);
            const clean = JSON.parse(JSON.stringify(doc));
            await setDoc(docRef, clean, { merge: false });
            return doc;
        },

        async getById(scope, policyId) {
            const { doc: firestoreDoc, getDoc } = await import("firebase/firestore");
            const collectionRef = await getPoliciesCollectionRef(scope);
            const docRef = firestoreDoc(collectionRef, policyId);
            const snapshot = await getDoc(docRef);
            if (!snapshot.exists()) return null;
            return snapshot.data() as PolicyDocument;
        },

        async list(scope) {
            const { getDocs, orderBy, query } = await import("firebase/firestore");
            const collectionRef = await getPoliciesCollectionRef(scope);
            const q = query(collectionRef, orderBy("metadata.updatedAt", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((d) => d.data() as PolicyDocument);
        },

        async save(scope, doc) {
            const { doc: firestoreDoc, setDoc } = await import("firebase/firestore");
            const collectionRef = await getPoliciesCollectionRef(scope);
            const docRef = firestoreDoc(collectionRef, doc.policyId);
            const clean = JSON.parse(JSON.stringify(doc));
            await setDoc(docRef, clean, { merge: false });
            return doc;
        },

        async softDelete(scope, policyId) {
            const { doc: firestoreDoc, updateDoc } = await import("firebase/firestore");
            const collectionRef = await getPoliciesCollectionRef(scope);
            const docRef = firestoreDoc(collectionRef, policyId);
            await updateDoc(docRef, { status: "archived", "metadata.updatedAt": new Date().toISOString() });
        },
    };
}

// ── In-Memory Implementation (tests) ────────────────────────────────────────

export function createInMemoryPolicyRepository(): PolicyRepository {
    const store = new Map<string, PolicyDocument>();

    function key(scope: PolicyScope, policyId: string): string {
        return `${scope.userId}/${scope.registerId}/${policyId}`;
    }

    return {
        async create(scope, doc) {
            const clone = JSON.parse(JSON.stringify(doc)) as PolicyDocument;
            store.set(key(scope, doc.policyId), clone);
            return clone;
        },

        async getById(scope, policyId) {
            const doc = store.get(key(scope, policyId));
            return doc ? (JSON.parse(JSON.stringify(doc)) as PolicyDocument) : null;
        },

        async list(scope) {
            const prefix = `${scope.userId}/${scope.registerId}/`;
            const results: PolicyDocument[] = [];
            for (const [k, doc] of store) {
                if (k.startsWith(prefix)) {
                    results.push(JSON.parse(JSON.stringify(doc)) as PolicyDocument);
                }
            }
            return results.sort((a, b) =>
                b.metadata.updatedAt.localeCompare(a.metadata.updatedAt),
            );
        },

        async save(scope, doc) {
            const clone = JSON.parse(JSON.stringify(doc)) as PolicyDocument;
            store.set(key(scope, doc.policyId), clone);
            return clone;
        },

        async softDelete(scope, policyId) {
            const doc = store.get(key(scope, policyId));
            if (doc) {
                doc.status = "archived";
                doc.metadata.updatedAt = new Date().toISOString();
            }
        },
    };
}
