import { parseUseCaseCard } from "./schema.ts";
import type { RegisterUseCaseStatus, UseCaseCard } from "./types";

export interface RegisterUseCaseScope {
  userId: string;
  projectId: string;
}

export interface RegisterUseCaseFilters {
  status?: RegisterUseCaseStatus;
  searchText?: string;
  limit?: number;
}

export interface RegisterUseCaseRepository {
  create(scope: RegisterUseCaseScope, card: UseCaseCard): Promise<UseCaseCard>;
  getById(scope: RegisterUseCaseScope, useCaseId: string): Promise<UseCaseCard | null>;
  list(scope: RegisterUseCaseScope, filters?: RegisterUseCaseFilters): Promise<UseCaseCard[]>;
  save(scope: RegisterUseCaseScope, card: UseCaseCard): Promise<UseCaseCard>;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function applyFilters(cards: UseCaseCard[], filters: RegisterUseCaseFilters = {}): UseCaseCard[] {
  let result = [...cards];

  if (filters.status) {
    result = result.filter((card) => card.status === filters.status);
  }

  if (filters.searchText && filters.searchText.trim().length > 0) {
    const query = normalizeSearch(filters.searchText);
    result = result.filter((card) => {
      const searchable = [
        card.purpose,
        card.responsibility.responsibleParty ?? "",
        ...card.reviewHints,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }

  result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (typeof filters.limit === "number" && Number.isFinite(filters.limit) && filters.limit > 0) {
    result = result.slice(0, Math.floor(filters.limit));
  }

  return result;
}

function cloneCard(card: UseCaseCard): UseCaseCard {
  return parseUseCaseCard(JSON.parse(JSON.stringify(card)));
}

async function getRegisterUseCasesCollectionRef(scope: RegisterUseCaseScope) {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const db = await getFirebaseDb();
  const { collection } = await import("firebase/firestore");
  return collection(
    db,
    `users/${scope.userId}/projects/${scope.projectId}/registerUseCases`
  );
}

export function createFirestoreRegisterUseCaseRepository(): RegisterUseCaseRepository {
  return {
    async create(scope, card) {
      const { doc, setDoc } = await import("firebase/firestore");
      const collectionRef = await getRegisterUseCasesCollectionRef(scope);
      const docRef = doc(collectionRef, card.useCaseId);
      await setDoc(docRef, card, { merge: false });
      return parseUseCaseCard(card);
    },

    async getById(scope, useCaseId) {
      const { doc, getDoc } = await import("firebase/firestore");
      const collectionRef = await getRegisterUseCasesCollectionRef(scope);
      const docRef = doc(collectionRef, useCaseId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        return null;
      }
      return parseUseCaseCard(snapshot.data());
    },

    async list(scope, filters = {}) {
      const { getDocs, orderBy, query } = await import("firebase/firestore");
      const collectionRef = await getRegisterUseCasesCollectionRef(scope);
      const q = query(collectionRef, orderBy("updatedAt", "desc"));
      const snapshot = await getDocs(q);
      const cards = snapshot.docs.map((entry) => parseUseCaseCard(entry.data()));
      return applyFilters(cards, filters);
    },

    async save(scope, card) {
      const { doc, setDoc } = await import("firebase/firestore");
      const collectionRef = await getRegisterUseCasesCollectionRef(scope);
      const docRef = doc(collectionRef, card.useCaseId);
      await setDoc(docRef, card, { merge: false });
      return parseUseCaseCard(card);
    },
  };
}

// ── Public Hash Lookup (Collection Group Query, cross-scope) ────────────────

export interface PublicUseCaseLookupResult {
  card: UseCaseCard;
  userId: string;
  projectId: string;
}

/**
 * Looks up a use case by its publicHashId across ALL users/projects.
 * Uses a Firestore Collection Group Query on "registerUseCases".
 * Requires a composite index: registerUseCases (collection group), publicHashId ASC.
 */
export async function getByPublicHashIdFirestore(
  publicHashId: string
): Promise<PublicUseCaseLookupResult | null> {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const db = await getFirebaseDb();
  const { collectionGroup, getDocs, query, where, limit } = await import(
    "firebase/firestore"
  );

  const ref = collectionGroup(db, "registerUseCases");
  const q = query(ref, where("publicHashId", "==", publicHashId), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const card = parseUseCaseCard(doc.data());

  // Extract userId and projectId from the document path:
  // users/{userId}/projects/{projectId}/registerUseCases/{docId}
  const pathSegments = doc.ref.path.split("/");
  const userId = pathSegments[1];
  const projectId = pathSegments[3];

  return { card, userId, projectId };
}

export function createInMemoryRegisterUseCaseRepository(): RegisterUseCaseRepository {
  const byScope = new Map<string, Map<string, UseCaseCard>>();

  function getScopeStore(scope: RegisterUseCaseScope): Map<string, UseCaseCard> {
    const key = `${scope.userId}/${scope.projectId}`;
    if (!byScope.has(key)) {
      byScope.set(key, new Map());
    }
    return byScope.get(key)!;
  }

  return {
    async create(scope, card) {
      const store = getScopeStore(scope);
      const normalized = parseUseCaseCard(card);
      store.set(normalized.useCaseId, cloneCard(normalized));
      return cloneCard(normalized);
    },

    async getById(scope, useCaseId) {
      const store = getScopeStore(scope);
      const card = store.get(useCaseId);
      return card ? cloneCard(card) : null;
    },

    async list(scope, filters = {}) {
      const store = getScopeStore(scope);
      const cards = Array.from(store.values()).map((card) => cloneCard(card));
      return applyFilters(cards, filters);
    },

    async save(scope, card) {
      const store = getScopeStore(scope);
      const normalized = parseUseCaseCard(card);
      store.set(normalized.useCaseId, cloneCard(normalized));
      return cloneCard(normalized);
    },
  };
}

/**
 * In-memory version of getByPublicHashId for testing.
 * Pass the same byScope map used by createInMemoryRegisterUseCaseRepository.
 */
export function createInMemoryPublicHashLookup(
  repository: RegisterUseCaseRepository
): (publicHashId: string) => Promise<PublicUseCaseLookupResult | null> {
  // We need access to all cards. Since the in-memory repo stores them internally,
  // we create a lookup that scans all known scopes via the repository's list method.
  // For tests: callers must provide scope + call list to populate, then use this.
  const knownScopes: RegisterUseCaseScope[] = [];

  return async (publicHashId: string) => {
    for (const scope of knownScopes) {
      const cards = await repository.list(scope);
      for (const card of cards) {
        if (card.publicHashId === publicHashId) {
          return { card, userId: scope.userId, projectId: scope.projectId };
        }
      }
    }
    return null;
  };
}
