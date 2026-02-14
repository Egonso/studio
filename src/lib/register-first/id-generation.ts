// Uses Web Crypto API (works in both browser and Node.js 18+)

// ── Public Hash ID ──────────────────────────────────────────────────────────
// 12-character, URL-safe, crypto-random identifier for verify links.
// Alphabet: a-z, 0-9 (no ambiguous chars like 0/O, 1/l).
// Collision probability at 10k entries: ~10^-14 (negligible).

const HASH_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const HASH_LENGTH = 12;

export function generatePublicHashId(): string {
  const bytes = new Uint8Array(HASH_LENGTH);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < HASH_LENGTH; i++) {
    result += HASH_ALPHABET[bytes[i] % HASH_ALPHABET.length];
  }
  return result;
}

// ── Global Use Case ID ──────────────────────────────────────────────────────
// Format: EUKI-UC-XXXXXX where X is a zero-padded 6-digit number.
// Uses timestamp (seconds since epoch, last 4 digits) + random (2 digits)
// to generate a unique-enough ID without a global Firestore counter.
//
// NOT globally sequential, but globally unique within practical limits.
// If true sequential ordering becomes a requirement, migrate to a
// Firestore counters collection with transactions.

export function generateGlobalUseCaseId(now: Date = new Date()): string {
  const epochSeconds = Math.floor(now.getTime() / 1000);
  const timePart = epochSeconds % 10000; // last 4 digits of epoch seconds
  const randomPart = Math.floor(Math.random() * 100); // 0-99
  const numericId = timePart * 100 + randomPart;
  return `EUKI-UC-${String(numericId).padStart(6, "0")}`;
}

// ── Validation helpers ──────────────────────────────────────────────────────

const GLOBAL_ID_PATTERN = /^EUKI-UC-\d{6}$/;

export function isValidGlobalUseCaseId(id: string): boolean {
  return GLOBAL_ID_PATTERN.test(id);
}

export function isValidPublicHashId(hash: string): boolean {
  return hash.length >= 8 && hash.length <= 24 && /^[a-z0-9]+$/.test(hash);
}
