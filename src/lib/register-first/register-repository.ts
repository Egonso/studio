import { parseUseCaseCard } from "./schema.ts";
import type {
  Register,
  RegisterUseCaseStatus,
  UseCaseCard,
  PublicUseCaseIndexEntry,
} from "./types";

// ── Scope ───────────────────────────────────────────────────────────────────

export interface RegisterScope {
  userId: string;
  registerId: string;
}

export interface RegisterUseCaseFilters {
  status?: RegisterUseCaseStatus;
  searchText?: string;
  limit?: number;
}

// ── Repository Interfaces ───────────────────────────────────────────────────

export interface RegisterRepository {
  createRegister(
    userId: string,
    name: string,
    linkedProjectId?: string | null
  ): Promise<Register>;
  getRegister(userId: string, registerId: string): Promise<Register | null>;
  listRegisters(userId: string): Promise<Register[]>;
}

export interface RegisterUseCaseRepository {
  create(scope: RegisterScope, card: UseCaseCard): Promise<UseCaseCard>;
  getById(
    scope: RegisterScope,
    useCaseId: string
  ): Promise<UseCaseCard | null>;
  list(
    scope: RegisterScope,
    filters?: RegisterUseCaseFilters
  ): Promise<UseCaseCard[]>;
  save(scope: RegisterScope, card: UseCaseCard): Promise<UseCaseCard>;
}

export interface PublicIndexRepository {
  publishToIndex(entry: PublicUseCaseIndexEntry): Promise<void>;
  unpublishFromIndex(publicHashId: string): Promise<void>;
  getPublicEntry(
    publicHashId: string
  ): Promise<PublicUseCaseIndexEntry | null>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function applyFilters(
  cards: UseCaseCard[],
  filters: RegisterUseCaseFilters = {}
): UseCaseCard[] {
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

  if (
    typeof filters.limit === "number" &&
    Number.isFinite(filters.limit) &&
    filters.limit > 0
  ) {
    result = result.slice(0, Math.floor(filters.limit));
  }

  return result;
}

function cloneCard(card: UseCaseCard): UseCaseCard {
  return parseUseCaseCard(JSON.parse(JSON.stringify(card)));
}

// ── Firestore: Register CRUD ────────────────────────────────────────────────

export function createFirestoreRegisterRepository(): RegisterRepository {
  return {
    async createRegister(userId, name, linkedProjectId = null) {
      const { getFirebaseDb } = await import("@/lib/firebase");
      const db = await getFirebaseDb();
      const { collection, doc, setDoc } = await import("firebase/firestore");

      const registersRef = collection(db, `users/${userId}/registers`);
      const newDoc = doc(registersRef);
      const register: Register = {
        registerId: newDoc.id,
        name,
        createdAt: new Date().toISOString(),
        linkedProjectId: linkedProjectId ?? null,
      };
      await setDoc(newDoc, register);
      return register;
    },

    async getRegister(userId, registerId) {
      const { getFirebaseDb } = await import("@/lib/firebase");
      const db = await getFirebaseDb();
      const { doc, getDoc } = await import("firebase/firestore");

      const docRef = doc(db, `users/${userId}/registers/${registerId}`);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return snapshot.data() as Register;
    },

    async listRegisters(userId) {
      const { getFirebaseDb } = await import("@/lib/firebase");
      const db = await getFirebaseDb();
      const { collection, getDocs, orderBy, query } = await import(
        "firebase/firestore"
      );

      const registersRef = collection(db, `users/${userId}/registers`);
      const q = query(registersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as Register);
    },
  };
}

// ── Firestore: UseCase CRUD ─────────────────────────────────────────────────

async function getUseCasesCollectionRef(scope: RegisterScope) {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const db = await getFirebaseDb();
  const { collection } = await import("firebase/firestore");
  return collection(
    db,
    `users/${scope.userId}/registers/${scope.registerId}/useCases`
  );
}

export function createFirestoreRegisterUseCaseRepo(): RegisterUseCaseRepository {
  return {
    async create(scope, card) {
      const { doc, setDoc } = await import("firebase/firestore");
      const collectionRef = await getUseCasesCollectionRef(scope);
      const docRef = doc(collectionRef, card.useCaseId);
      await setDoc(docRef, card, { merge: false });
      return parseUseCaseCard(card);
    },

    async getById(scope, useCaseId) {
      const { doc, getDoc } = await import("firebase/firestore");
      const collectionRef = await getUseCasesCollectionRef(scope);
      const docRef = doc(collectionRef, useCaseId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return parseUseCaseCard(snapshot.data());
    },

    async list(scope, filters = {}) {
      const { getDocs, orderBy, query } = await import("firebase/firestore");
      const collectionRef = await getUseCasesCollectionRef(scope);
      const q = query(collectionRef, orderBy("updatedAt", "desc"));
      const snapshot = await getDocs(q);
      const cards = snapshot.docs.map((entry) =>
        parseUseCaseCard(entry.data())
      );
      return applyFilters(cards, filters);
    },

    async save(scope, card) {
      const { doc, setDoc } = await import("firebase/firestore");
      const collectionRef = await getUseCasesCollectionRef(scope);
      const docRef = doc(collectionRef, card.useCaseId);
      await setDoc(docRef, card, { merge: false });
      return parseUseCaseCard(card);
    },
  };
}

// ── Firestore: Public Index ─────────────────────────────────────────────────

export function createFirestorePublicIndexRepo(): PublicIndexRepository {
  return {
    async publishToIndex(entry) {
      const { getFirebaseDb } = await import("@/lib/firebase");
      const db = await getFirebaseDb();
      const { doc, setDoc } = await import("firebase/firestore");

      const docRef = doc(db, `publicUseCases/${entry.publicHashId}`);
      await setDoc(docRef, entry, { merge: false });
    },

    async unpublishFromIndex(publicHashId) {
      const { getFirebaseDb } = await import("@/lib/firebase");
      const db = await getFirebaseDb();
      const { doc, deleteDoc } = await import("firebase/firestore");

      const docRef = doc(db, `publicUseCases/${publicHashId}`);
      await deleteDoc(docRef);
    },

    async getPublicEntry(publicHashId) {
      const { getFirebaseDb } = await import("@/lib/firebase");
      const db = await getFirebaseDb();
      const { doc, getDoc } = await import("firebase/firestore");

      const docRef = doc(db, `publicUseCases/${publicHashId}`);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return snapshot.data() as PublicUseCaseIndexEntry;
    },
  };
}

// ── Verify Lookup (Public Index + Legacy Fallback) ──────────────────────────

export async function lookupPublicUseCase(
  publicHashId: string,
  publicIndexRepo?: PublicIndexRepository
): Promise<PublicUseCaseIndexEntry | null> {
  // 1. Try the public index (fast, single doc read)
  const repo = publicIndexRepo ?? createFirestorePublicIndexRepo();
  const entry = await repo.getPublicEntry(publicHashId);
  if (entry) return entry;

  // 2. Legacy fallback: Collection Group Query on registerUseCases
  const { getByPublicHashIdFirestore } = await import("./repository.ts");
  const legacyResult = await getByPublicHashIdFirestore(publicHashId);
  if (!legacyResult) return null;

  // Convert legacy result to PublicUseCaseIndexEntry shape
  const card = legacyResult.card;
  return {
    publicHashId: card.publicHashId ?? publicHashId,
    globalUseCaseId: card.globalUseCaseId ?? "",
    formatVersion: card.formatVersion ?? "v1.0",
    purpose: card.purpose,
    toolName: card.toolFreeText ?? card.toolId ?? "",
    dataCategory: card.dataCategory ?? "INTERNAL",
    status: card.status,
    createdAt: card.createdAt,
    ownerId: legacyResult.userId,
    verification: card.proof?.verification ?? null,
  };
}

// ── In-Memory Implementations (for tests) ───────────────────────────────────

export function createInMemoryRegisterRepository(): RegisterRepository {
  const registers = new Map<string, Register>();

  return {
    async createRegister(userId, name, linkedProjectId = null) {
      const registerId = `reg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const register: Register = {
        registerId,
        name,
        createdAt: new Date().toISOString(),
        linkedProjectId: linkedProjectId ?? null,
      };
      registers.set(`${userId}/${registerId}`, register);
      return register;
    },

    async getRegister(userId, registerId) {
      return registers.get(`${userId}/${registerId}`) ?? null;
    },

    async listRegisters(userId) {
      const result: Register[] = [];
      for (const [key, reg] of registers) {
        if (key.startsWith(`${userId}/`)) {
          result.push(reg);
        }
      }
      return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}

export function createInMemoryRegisterUseCaseRepo(): RegisterUseCaseRepository {
  const byScope = new Map<string, Map<string, UseCaseCard>>();

  function getScopeStore(scope: RegisterScope): Map<string, UseCaseCard> {
    const key = `${scope.userId}/${scope.registerId}`;
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

export function createInMemoryPublicIndexRepo(): PublicIndexRepository {
  const index = new Map<string, PublicUseCaseIndexEntry>();

  return {
    async publishToIndex(entry) {
      index.set(entry.publicHashId, { ...entry });
    },

    async unpublishFromIndex(publicHashId) {
      index.delete(publicHashId);
    },

    async getPublicEntry(publicHashId) {
      const entry = index.get(publicHashId);
      return entry ? { ...entry } : null;
    },
  };
}
