export type CaptureByCodeErrorContext = "validate" | "submit";

export interface CaptureByCodeErrorCopy {
  title: string;
  description: string;
}

const DEBUG_SUFFIX_PATTERN = /\s*\[[A-Z]+-\d+-[^\]]+\]\s*$/i;

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
        title: "Code ungültig",
        description:
          cleanMessage ||
          "Dieser Zugangscode ist ungültig. Bitte prüfen Sie die Eingabe.",
      };
    }

    if (status === 410 && cleanMessage?.toLowerCase().includes("abgelaufen")) {
      return {
        title: "Code abgelaufen",
        description:
          cleanMessage ||
          "Dieser Zugangscode ist abgelaufen. Bitte fordern Sie einen neuen Code an.",
      };
    }

    if (status === 410) {
      return {
        title: "Code nicht aktiv",
        description:
          cleanMessage ||
          "Dieser Zugangscode ist derzeit nicht aktiv. Bitte fordern Sie einen neuen Code an.",
      };
    }

    if (status === 429) {
      return {
        title: "Zu viele Anfragen",
        description:
          cleanMessage ||
          "Der Code wurde zu oft geprüft. Bitte versuchen Sie es in wenigen Minuten erneut.",
      };
    }

    if (status === 503 || status >= 500) {
      return {
        title: "Dienst vorübergehend nicht verfügbar",
        description:
          "Der Zugangscode konnte gerade nicht geprüft werden. Bitte versuchen Sie es in wenigen Minuten erneut.",
      };
    }

    return {
      title: "Code konnte nicht geprüft werden",
      description: cleanMessage || "Bitte versuchen Sie es erneut.",
    };
  }

  if (status === 400) {
    return {
      title: "Angaben prüfen",
      description:
        cleanMessage ||
        "Bitte prüfen Sie Ihre Eingaben und versuchen Sie es erneut.",
    };
  }

  if (status === 404) {
    return {
      title: "Code ungültig",
      description:
        cleanMessage ||
        "Dieser Zugangscode ist ungültig. Bitte prüfen Sie die Eingabe.",
    };
  }

  if (status === 410 && cleanMessage?.toLowerCase().includes("abgelaufen")) {
    return {
      title: "Code abgelaufen",
      description:
        cleanMessage ||
        "Dieser Zugangscode ist abgelaufen. Bitte fordern Sie einen neuen Code an.",
    };
  }

  if (status === 410) {
    return {
      title: "Code nicht aktiv",
      description:
        cleanMessage ||
        "Dieser Zugangscode ist derzeit nicht aktiv. Bitte fordern Sie einen neuen Code an.",
    };
  }

  if (status === 429) {
    return {
      title: "Zu viele Anfragen",
      description:
        cleanMessage ||
        "Der Einsatzfall konnte gerade nicht gespeichert werden. Bitte versuchen Sie es in wenigen Minuten erneut.",
    };
  }

  if (status === 503 || status >= 500) {
    return {
      title: "Dienst vorübergehend nicht verfügbar",
      description:
        "Der Einsatzfall konnte gerade nicht gespeichert werden. Bitte versuchen Sie es in wenigen Minuten erneut.",
    };
  }

  return {
    title: "Speichern fehlgeschlagen",
    description:
      cleanMessage ||
      "Der Einsatzfall konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
  };
}
