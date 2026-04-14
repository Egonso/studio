export type CaptureByCodeErrorContext = "validate" | "submit";

export interface CaptureByCodeErrorCopy {
  title: string;
  description: string;
}

const DEBUG_SUFFIX_PATTERN = /\s*\[[A-Z]+-\d+-[^\]]+\]\s*$/i;

function isLocalDevelopmentBrowser(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function stripCaptureByCodeDebugSuffix(
  message?: string | null
): string | null {
  const normalized = message?.trim();
  if (!normalized) return null;
  return normalized.replace(DEBUG_SUFFIX_PATTERN, "").trim();
}

export function getCaptureByCodeErrorCopy(
  status: number,
  message?: string | null,
  context: CaptureByCodeErrorContext = "validate"
): CaptureByCodeErrorCopy {
  const cleanMessage = stripCaptureByCodeDebugSuffix(message);

  if (context === "validate") {
    if (status === 400 || status === 404) {
      return {
        title: "Invalid code",
        description:
          cleanMessage ||
          "This access code is invalid. Please check your input.",
      };
    }

    if (status === 410 && cleanMessage?.toLowerCase().includes("expired")) {
      return {
        title: "Code expired",
        description:
          cleanMessage ||
          "This access code has expired. Please request a new code.",
      };
    }

    if (status === 410 && cleanMessage?.toLowerCase().includes("abgelaufen")) {
      return {
        title: "Code expired",
        description:
          cleanMessage ||
          "This access code has expired. Please request a new code.",
      };
    }

    if (status === 410) {
      return {
        title: "Code inactive",
        description:
          cleanMessage ||
          "This access code is currently inactive. Please request a new code.",
      };
    }

    if (status === 429) {
      return {
        title: "Too many requests",
        description:
          cleanMessage ||
          "This code has been checked too often. Please try again in a few minutes.",
      };
    }

    if (status === 503 || status >= 500) {
      return {
        title: "Service temporarily unavailable",
        description: isLocalDevelopmentBrowser()
          ? "Public capture is not connected to the server service locally. Please check the local server connection and try again."
          : "The access code could not be verified right now. Please try again in a few minutes.",
      };
    }

    return {
      title: "Code could not be verified",
      description: cleanMessage || "Please try again.",
    };
  }

  if (status === 400) {
    return {
      title: "Check your input",
      description:
        cleanMessage ||
        "Please check your input and try again.",
    };
  }

  if (status === 404) {
    return {
      title: "Invalid code",
      description:
        cleanMessage ||
        "This access code is invalid. Please check your input.",
    };
  }

  if (status === 410 && cleanMessage?.toLowerCase().includes("expired")) {
    return {
      title: "Code expired",
      description:
        cleanMessage ||
        "This access code has expired. Please request a new code.",
    };
  }

  if (status === 410 && cleanMessage?.toLowerCase().includes("abgelaufen")) {
    return {
      title: "Code expired",
      description:
        cleanMessage ||
        "This access code has expired. Please request a new code.",
    };
  }

  if (status === 410) {
    return {
      title: "Code inactive",
      description:
        cleanMessage ||
        "This access code is currently inactive. Please request a new code.",
    };
  }

  if (status === 429) {
    return {
      title: "Too many requests",
      description:
        cleanMessage ||
        "The use case could not be saved right now. Please try again in a few minutes.",
    };
  }

  if (status === 503 || status >= 500) {
    return {
      title: "Service temporarily unavailable",
      description: isLocalDevelopmentBrowser()
        ? "Public capture is not connected to the server service locally. Please check the local server connection and try again."
        : "The use case could not be saved right now. Please try again in a few minutes.",
    };
  }

  return {
    title: "Save failed",
    description:
      cleanMessage ||
      "The use case could not be saved. Please try again.",
  };
}
