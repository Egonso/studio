import type { Register } from "./types";

export function getRegisterDisplayName(
  register: Pick<Register, "name" | "organisationName">
): string {
  const organisationName = register.organisationName?.trim();
  return organisationName && organisationName.length > 0
    ? organisationName
    : register.name;
}

export function isRegisterDeleted(
  register: Pick<Register, "isDeleted"> | null | undefined
): boolean {
  return register?.isDeleted === true;
}
