import { db } from "@/lib/firebase-admin";

import { parseSupplierRequestTokenRecord } from "./schema";
import {
  parseSupplierRequestToken,
  verifySupplierRequestToken,
} from "./request-tokens";
import type { Register, SupplierRequestTokenRecord } from "./types";

export type SupplierRequestTokenAccessFailureReason =
  | "invalid"
  | "revoked"
  | "expired"
  | "register_not_found";

export interface SupplierRequestTokenAccessResult {
  token: SupplierRequestTokenRecord;
  register: Register;
}

export async function resolveSupplierRequestTokenAccess(
  rawToken: string
): Promise<
  | { ok: true; value: SupplierRequestTokenAccessResult }
  | { ok: false; reason: SupplierRequestTokenAccessFailureReason }
> {
  const parsed = parseSupplierRequestToken(rawToken);
  if (!parsed) {
    return { ok: false, reason: "invalid" };
  }

  const tokenSnapshot = await db
    .collection("registerRequestTokens")
    .doc(parsed.tokenId)
    .get();
  if (!tokenSnapshot.exists) {
    return { ok: false, reason: "invalid" };
  }

  const token = parseSupplierRequestTokenRecord(tokenSnapshot.data());
  const validation = verifySupplierRequestToken(rawToken, token);
  if (!validation.valid) {
    return {
      ok: false,
      reason:
        validation.reason === "expired"
          ? "expired"
          : validation.reason === "revoked"
            ? "revoked"
            : "invalid",
    };
  }

  const registerSnapshot = await db
    .doc(`users/${token.ownerId}/registers/${token.registerId}`)
    .get();
  if (!registerSnapshot.exists || registerSnapshot.data()?.isDeleted === true) {
    return { ok: false, reason: "register_not_found" };
  }

  return {
    ok: true,
    value: {
      token,
      register: registerSnapshot.data() as Register,
    },
  };
}

export async function markSupplierRequestTokenUsed(tokenId: string): Promise<void> {
  await db.collection("registerRequestTokens").doc(tokenId).update({
    lastUsedAt: new Date().toISOString(),
  });
}
