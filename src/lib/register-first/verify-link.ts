export interface VerifyLinkInput {
  verifyUrl: string;
  scope: string;
}

export interface VerifyLinkValidationErrors {
  verifyUrl?: string;
  scope?: string;
}

export interface VerifyLinkValidationResult {
  isValid: boolean;
  normalized: VerifyLinkInput;
  errors: VerifyLinkValidationErrors;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function validateVerifyLinkInput(
  input: VerifyLinkInput
): VerifyLinkValidationResult {
  const normalized = {
    verifyUrl: input.verifyUrl.trim(),
    scope: input.scope.trim(),
  };
  const errors: VerifyLinkValidationErrors = {};

  if (normalized.verifyUrl.length === 0) {
    errors.verifyUrl = "Verify URL ist erforderlich.";
  } else if (!isHttpUrl(normalized.verifyUrl)) {
    errors.verifyUrl = "Verify URL muss eine gueltige http(s)-Adresse sein.";
  }

  if (normalized.scope.length === 0) {
    errors.scope = "Scope ist erforderlich.";
  } else if (normalized.scope.length > 200) {
    errors.scope = "Scope darf maximal 200 Zeichen enthalten.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    normalized,
    errors,
  };
}
