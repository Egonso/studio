"use client";

import { getFirebaseDb, getFirebaseAuth } from "@/lib/firebase";
import type { RegisterAccessCode } from "./types";

export interface AccessCodeOptions {
  label?: string;
  maxUses?: number;
  expiryOption: '30_DAYS' | '90_DAYS' | '365_DAYS' | 'UNLIMITED';
}

// ── Code Generation ──────────────────────────────────────────────────────────

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
  let code = "AI-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Service ──────────────────────────────────────────────────────────────────

async function resolveUserId(): Promise<string> {
  const auth = await getFirebaseAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("UNAUTHENTICATED");
  return uid;
}

export const accessCodeService = {
  async generateCode(
    registerId: string,
    options: AccessCodeOptions
  ): Promise<RegisterAccessCode> {
    const userId = await resolveUserId();
    const db = await getFirebaseDb();
    const { doc, setDoc } = await import("firebase/firestore");

    const code = generateAccessCode();
    const now = new Date().toISOString();

    let expiresAt: string | null = null;
    if (options.expiryOption !== 'UNLIMITED') {
      const expiryDate = new Date();
      switch (options.expiryOption) {
        case '30_DAYS':
          expiryDate.setDate(expiryDate.getDate() + 30);
          break;
        case '90_DAYS':
          expiryDate.setDate(expiryDate.getDate() + 90);
          break;
        case '365_DAYS':
          expiryDate.setDate(expiryDate.getDate() + 365);
          break;
      }
      expiresAt = expiryDate.toISOString();
    }

    const entry: RegisterAccessCode = {
      code,
      registerId,
      ownerId: userId,
      createdAt: now,
      expiresAt,
      label: options.label || "Team Access",
      usageCount: 0,
      maxUsageCount: options.maxUses || null,
      isActive: true,
    };

    await setDoc(doc(db, "registerAccessCodes", code), entry);
    return entry;
  },

  async listCodes(registerId: string): Promise<RegisterAccessCode[]> {
    const userId = await resolveUserId();
    const db = await getFirebaseDb();
    const { collection, query, where, getDocs } = await import(
      "firebase/firestore"
    );

    const q = query(
      collection(db, "registerAccessCodes"),
      where("registerId", "==", registerId),
      where("ownerId", "==", userId)
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as RegisterAccessCode);
  },

  async revokeCode(code: string): Promise<void> {
    const userId = await resolveUserId();
    const db = await getFirebaseDb();
    const { doc, getDoc, updateDoc } = await import("firebase/firestore");

    const ref = doc(db, "registerAccessCodes", code);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Code not found");

    const data = snap.data() as RegisterAccessCode;
    if (data.ownerId !== userId) throw new Error("Access denied");

    await updateDoc(ref, { isActive: false });
  },
};
