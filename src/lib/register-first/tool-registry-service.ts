import type { ToolRegistryEntry, ToolType } from "./tool-registry-types";
import { TOOL_ID_OTHER, toToolSlug } from "./tool-registry-types";

// ── Static catalog import (client-safe, tree-shakeable) ─────────────────────
import catalogData from "@/data/tool-catalog.json";

interface CatalogJsonEntry {
  name: string;
  toolId?: string; // Optional in JSON
  vendor: string;
  homepageUrl: string | null;
  category: string;
  toolType?: string;
  defaultType: string;
}

function mapCategoryToToolType(category: string): ToolType {
  const c = category.toLowerCase();
  if (c.includes("chat")) return "LLM";
  if (c.includes("code")) return "CODE_ASSISTANT";
  if (c.includes("image") || c.includes("design")) return "IMAGE_GEN";
  if (c.includes("video")) return "VIDEO_GEN";
  if (c.includes("audio") || c.includes("voice")) return "AUDIO_GEN";
  if (c.includes("translation")) return "TRANSLATION";
  if (c.includes("search")) return "SEARCH";
  if (c.includes("automation")) return "AUTOMATION";
  if (c.includes("ocr")) return "OCR";
  if (c.includes("rpa")) return "RPA";
  if (c.includes("productivity") || c.includes("suite")) return "GENAI_SUITE";
  return "OTHER";
}

function catalogEntryToRegistryEntry(entry: CatalogJsonEntry): ToolRegistryEntry {
  // Generate ID if missing using standard slug function
  const generatedId = entry.toolId || toToolSlug(entry.name);

  return {
    toolId: generatedId,
    vendor: entry.vendor,
    productName: entry.name,
    toolType: entry.toolType ? (entry.toolType as ToolType) : mapCategoryToToolType(entry.category),
    homepage: entry.homepageUrl ?? null,
    isActive: true,
    createdAtISO: "2025-01-01T00:00:00.000Z",
  };
}

// ── Tool Registry Interface ─────────────────────────────────────────────────
export interface ToolRegistryService {
  listActiveTools(): Promise<ToolRegistryEntry[]>;
  getToolById(toolId: string): Promise<ToolRegistryEntry | null>;
}

// ── Static (JSON-based) Implementation ──────────────────────────────────────
// Uses the bundled tool-catalog.json. No Firestore call needed on client.
// Firestore tool_catalog is for admin/seed purposes.

export function createStaticToolRegistryService(): ToolRegistryService {
  const entries: ToolRegistryEntry[] = (catalogData as CatalogJsonEntry[]).map(
    catalogEntryToRegistryEntry
  );

  const byId = new Map<string, ToolRegistryEntry>();
  for (const entry of entries) {
    byId.set(entry.toolId, entry);
  }

  return {
    async listActiveTools() {
      return entries.filter((e) => e.isActive && e.toolId !== TOOL_ID_OTHER);
    },

    async getToolById(toolId: string) {
      return byId.get(toolId) ?? null;
    },
  };
}

// ── Firestore-backed Implementation ─────────────────────────────────────────
// Reads from the "tool_catalog" collection. Use when you need live data
// (e.g., admin added a new tool via UI without redeploying).

export function createFirestoreToolRegistryService(): ToolRegistryService {
  return {
    async listActiveTools() {
      const { getFirebaseDb } = await import("@/lib/firebase");
      const db = await getFirebaseDb();
      const { collection, getDocs, query, where } = await import(
        "firebase/firestore"
      );
      const ref = collection(db, "tool_catalog");
      const q = query(ref, where("isActive", "!=", false));
      const snapshot = await getDocs(q);

      const results: ToolRegistryEntry[] = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        results.push({
          toolId: data.toolId ?? doc.id,
          vendor: data.vendor ?? "",
          productName: data.name ?? data.productName ?? "",
          toolType: data.toolType ?? "OTHER",
          homepage: data.url ?? data.homepage ?? null,
          isActive: data.isActive !== false,
          createdAtISO:
            data.createdAtISO ?? data.updatedAt?.toDate?.()?.toISOString() ?? "",
        });
      }

      return results.filter((e) => e.toolId !== TOOL_ID_OTHER);
    },

    async getToolById(toolId: string) {
      const { getFirebaseDb } = await import("@/lib/firebase");
      const db = await getFirebaseDb();
      const { doc, getDoc } = await import("firebase/firestore");
      const docRef = doc(db, "tool_catalog", toolId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        return null;
      }
      const data = snapshot.data();
      return {
        toolId: data.toolId ?? snapshot.id,
        vendor: data.vendor ?? "",
        productName: data.name ?? data.productName ?? "",
        toolType: data.toolType ?? "OTHER",
        homepage: data.url ?? data.homepage ?? null,
        isActive: data.isActive !== false,
        createdAtISO:
          data.createdAtISO ?? data.updatedAt?.toDate?.()?.toISOString() ?? "",
      };
    },
  };
}

// ── In-Memory Implementation (for tests) ────────────────────────────────────

export function createInMemoryToolRegistryService(
  entries: ToolRegistryEntry[] = []
): ToolRegistryService {
  const byId = new Map<string, ToolRegistryEntry>();
  for (const entry of entries) {
    byId.set(entry.toolId, entry);
  }

  return {
    async listActiveTools() {
      return entries.filter((e) => e.isActive && e.toolId !== TOOL_ID_OTHER);
    },

    async getToolById(toolId: string) {
      return byId.get(toolId) ?? null;
    },
  };
}
