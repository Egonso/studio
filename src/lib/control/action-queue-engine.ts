import type { UseCaseCard } from "@/lib/register-first/types";
import {
  buildUseCaseDetailLink,
  buildUseCaseFocusLink,
  type ControlFocusTarget,
} from "@/lib/control/deep-link";
import { CONTROL_REVIEW_DUE_WINDOW_DAYS } from "@/lib/control/maturity-calculator";

export const ACTION_QUEUE_MIN_ITEMS = 5;
export const ACTION_QUEUE_MAX_ITEMS = 10;

export interface ControlActionRecommendation {
  id: string;
  priority: number;
  problem: string;
  impact: string;
  recommendedAction: string;
  useCaseId: string;
  useCaseLabel: string;
  focus: ControlFocusTarget;
  deepLink: string | null;
  deepLinkLabel: string | null;
  viewLink: string;
}

interface ActionCandidate extends ControlActionRecommendation {
  updatedAtTimestamp: number;
}

function parseTimestamp(isoDate: string): number {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return 0;
  return timestamp;
}

function formatUseCaseLabel(useCase: UseCaseCard): string {
  const value = useCase.purpose.trim();
  if (value.length === 0) return useCase.useCaseId;
  if (value.length <= 70) return value;
  return `${value.slice(0, 67)}...`;
}

function isHighRisk(useCase: UseCaseCard): boolean {
  const category = useCase.governanceAssessment?.core?.aiActCategory?.toLowerCase() ?? "";
  return category.includes("hochrisiko") || category.includes("high risk");
}

function hasOwner(useCase: UseCaseCard): boolean {
  if (useCase.responsibility.isCurrentlyResponsible) return true;
  return Boolean(useCase.responsibility.responsibleParty?.trim());
}

function hasOversight(useCase: UseCaseCard): boolean {
  if (useCase.governanceAssessment?.core?.oversightDefined === true) return true;
  const model = useCase.governanceAssessment?.flex?.iso?.oversightModel;
  return Boolean(model && model !== "unknown");
}

function hasReviewStructure(useCase: UseCaseCard): boolean {
  if (useCase.governanceAssessment?.core?.reviewCycleDefined === true) return true;
  const cycle = useCase.governanceAssessment?.flex?.iso?.reviewCycle;
  if (cycle && cycle !== "unknown") return true;
  return Boolean(useCase.governanceAssessment?.flex?.iso?.nextReviewAt);
}

function hasPolicyMapping(useCase: UseCaseCard): boolean {
  const links = useCase.governanceAssessment?.flex?.policyLinks ?? [];
  return links.some((entry) => entry.trim().length > 0);
}

function hasAuditHistory(useCase: UseCaseCard): boolean {
  const hasReviewEvents = (useCase.reviews?.length ?? 0) > 0;
  const hasStatusHistory = (useCase.statusHistory?.length ?? 0) > 0;
  const hasProof = Boolean(useCase.proof?.verification);
  return hasReviewEvents || hasStatusHistory || hasProof;
}

function reviewWindow(useCase: UseCaseCard, now: Date): "NONE" | "DUE" | "OVERDUE" {
  const nextReviewAt = useCase.governanceAssessment?.flex?.iso?.nextReviewAt;
  if (!nextReviewAt) return "NONE";

  const nextReviewTimestamp = Date.parse(nextReviewAt);
  if (Number.isNaN(nextReviewTimestamp)) return "NONE";

  const nowTimestamp = now.getTime();
  if (nextReviewTimestamp < nowTimestamp) return "OVERDUE";

  const dueWindowTimestamp =
    nowTimestamp + CONTROL_REVIEW_DUE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (nextReviewTimestamp <= dueWindowTimestamp) return "DUE";
  return "NONE";
}

function createCandidate(
  useCase: UseCaseCard,
  ruleId: string,
  priority: number,
  focus: ControlFocusTarget,
  problem: string,
  impact: string,
  recommendedAction: string,
  options: {
    deepLink?: string | null;
    deepLinkLabel?: string | null;
  } = {}
): ActionCandidate {
  return {
    id: `${ruleId}:${useCase.useCaseId}`,
    priority,
    problem,
    impact,
    recommendedAction,
    useCaseId: useCase.useCaseId,
    useCaseLabel: formatUseCaseLabel(useCase),
    focus,
    deepLink: options.deepLink ?? buildUseCaseFocusLink(useCase.useCaseId, focus),
    deepLinkLabel: options.deepLinkLabel ?? "Empfohlene Stelle öffnen",
    viewLink: buildUseCaseDetailLink(useCase.useCaseId),
    updatedAtTimestamp: parseTimestamp(useCase.updatedAt),
  };
}

function compareCandidates(a: ActionCandidate, b: ActionCandidate): number {
  if (a.priority !== b.priority) return b.priority - a.priority;
  if (a.updatedAtTimestamp !== b.updatedAtTimestamp) {
    return a.updatedAtTimestamp - b.updatedAtTimestamp;
  }
  return a.useCaseId.localeCompare(b.useCaseId);
}

export function buildControlActionQueue(
  useCases: UseCaseCard[],
  now: Date = new Date(),
  options: { minItems?: number; maxItems?: number } = {}
): ControlActionRecommendation[] {
  if (useCases.length === 0) return [];

  const minItems = Math.max(1, options.minItems ?? ACTION_QUEUE_MIN_ITEMS);
  const maxItems = Math.max(minItems, options.maxItems ?? ACTION_QUEUE_MAX_ITEMS);

  const candidates: ActionCandidate[] = [];

  for (const useCase of useCases) {
    const highRisk = isHighRisk(useCase);
    const ownerPresent = hasOwner(useCase);
    const oversightPresent = hasOversight(useCase);
    const reviewStructured = hasReviewStructure(useCase);
    const policyMapped = hasPolicyMapping(useCase);
    const auditPresent = hasAuditHistory(useCase);
    const reviewState = reviewWindow(useCase, now);

    if (highRisk && !oversightPresent) {
      candidates.push(
        createCandidate(
          useCase,
          "high-risk-no-oversight",
          100,
          "governance",
          "Hochrisiko-System ohne dokumentiertes Aufsichtsmodell.",
          "Erhoehtes Haftungs- und Freigaberisiko.",
          "Aufsichtsmodell dokumentieren und formale Verantwortlichkeit festhalten.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              edit: true,
              field: "oversight",
            }),
            deepLinkLabel: "Aufsichtsmodell festlegen",
          }
        )
      );
    }

    if (highRisk && !reviewStructured) {
      candidates.push(
        createCandidate(
          useCase,
          "high-risk-no-review-structure",
          95,
          "governance",
          "Hochrisiko-System ohne strukturierten Review-Zyklus.",
          "Regelmaessige Ueberwachung ist nicht belastbar nachweisbar.",
          "Review-Rhythmus oder naechstes Review-Datum dokumentieren.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              edit: true,
              field: "reviewCycle",
            }),
            deepLinkLabel: "Review-Zyklus setzen",
          }
        )
      );
    }

    if (reviewState === "OVERDUE") {
      candidates.push(
        createCandidate(
          useCase,
          "review-overdue",
          92,
          "governance",
          "Review ist ueberfaellig.",
          "Dokumentationsstand kann fuer externe Pruefungen veralten.",
          "Review jetzt durchfuehren und Statusaenderung dokumentieren.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: "Review dokumentieren",
          }
        )
      );
    }

    if (!ownerPresent) {
      candidates.push(
        createCandidate(
          useCase,
          "owner-missing",
          88,
          "owner",
          "System ohne klare Owner-Zuordnung.",
          "Verantwortlichkeiten sind organisatorisch nicht eindeutig.",
          "Owner in der Stammdokumentation hinterlegen.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "owner", {
              edit: true,
            }),
            deepLinkLabel: "Owner ergänzen",
          }
        )
      );
    }

    if (useCase.status === "PROOF_READY" && !useCase.proof) {
      candidates.push(
        createCandidate(
          useCase,
          "proof-ready-no-proof",
          86,
          "audit",
          "Status PROOF_READY ohne hinterlegte Nachweisdaten.",
          "Export- und Audit-Faehigkeit ist dadurch nicht gesichert.",
          "Proof-Daten aktualisieren und Nachweislink dokumentieren.",
          {
            deepLink: null,
            deepLinkLabel: null,
          }
        )
      );
    }

    if (!reviewStructured) {
      candidates.push(
        createCandidate(
          useCase,
          "review-structure-missing",
          80,
          "governance",
          "Kein strukturierter Review-Zyklus dokumentiert.",
          "Review-Planung ist nicht verlaesslich steuerbar.",
          "Review-Zyklus oder naechstes Review-Datum setzen.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              edit: true,
              field: "reviewCycle",
            }),
            deepLinkLabel: "Review-Zyklus setzen",
          }
        )
      );
    }

    if (highRisk && !policyMapped) {
      candidates.push(
        createCandidate(
          useCase,
          "high-risk-no-policy",
          78,
          "policy",
          "Hochrisiko-System ohne Policy-Zuordnung.",
          "Kontrollmassnahmen sind nicht konsistent zugeordnet.",
          "Policy-Links fuer dieses System im Register hinterlegen.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "policy", {
              edit: true,
            }),
            deepLinkLabel: "Verknüpfung setzen",
          }
        )
      );
    }

    if (!policyMapped) {
      candidates.push(
        createCandidate(
          useCase,
          "policy-mapping-missing",
          74,
          "policy",
          "Keine Policy-Zuordnung dokumentiert.",
          "Governance-Regeln sind schwer nachweisbar.",
          "Relevante Policy-Referenzen mit dem Einsatzfall verknuepfen.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "policy", {
              edit: true,
            }),
            deepLinkLabel: "Verknüpfung setzen",
          }
        )
      );
    }

    if (!auditPresent) {
      candidates.push(
        createCandidate(
          useCase,
          "audit-history-missing",
          68,
          "governance",
          "Keine Audit-Historie fuer dieses System vorhanden.",
          "Pruefhistorie ist noch nicht revisionssicher nachvollziehbar.",
          "Ersten dokumentierten Review- oder Statusnachweis erfassen.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: "Prüfhistorie aufbauen",
          }
        )
      );
    }

    if (reviewState === "DUE") {
      candidates.push(
        createCandidate(
          useCase,
          "review-due",
          62,
          "governance",
          "Review wird in den naechsten 30 Tagen faellig.",
          "Bei Verzoegerung entsteht ein ueberfaelliger Pruefzustand.",
          "Review-Termin und Zustaendigkeit jetzt vorbereiten.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: "Review vorbereiten",
          }
        )
      );
    }

    if (useCase.status === "UNREVIEWED") {
      candidates.push(
        createCandidate(
          useCase,
          "status-unreviewed",
          58,
          "governance",
          "System befindet sich weiterhin im Status UNREVIEWED.",
          "Formale Pruefung ist noch nicht dokumentiert.",
          "Ersten Review-Schritt und Statusaenderung dokumentieren.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: "Review starten",
          }
        )
      );
    }
  }

  const deduplicated = Array.from(
    new Map(candidates.map((candidate) => [candidate.id, candidate])).values()
  ).sort(compareCandidates);

  const selected: ActionCandidate[] = deduplicated.slice(0, maxItems);

  if (selected.length < minItems) {
    const sortedByAge = [...useCases].sort(
      (a, b) => parseTimestamp(a.updatedAt) - parseTimestamp(b.updatedAt)
    );
    const fallbackTemplates: Array<{
      ruleId: string;
      priority: number;
      focus: ControlFocusTarget;
      problem: string;
      impact: string;
      recommendedAction: string;
    }> = [
      {
        ruleId: "maintenance-review",
        priority: 40,
        focus: "governance",
        problem: "Kontinuitaets-Check fuer den Review-Status ausstehend.",
        impact: "Regelmaessige Pflege sichert langfristige Audit-Lesbarkeit.",
        recommendedAction: "Review-Status kurz validieren und bei Bedarf aktualisieren.",
      },
      {
        ruleId: "maintenance-audit",
        priority: 39,
        focus: "audit",
        problem: "Auditspur sollte regelmaessig nachgepflegt werden.",
        impact: "Laufende Dokumentation reduziert Nachweisaufwand bei Pruefungen.",
        recommendedAction: "Letzte Review-/Statusdokumentation auf Vollstaendigkeit pruefen.",
      },
      {
        ruleId: "maintenance-policy",
        priority: 38,
        focus: "policy",
        problem: "Policy-Abgleich sollte zyklisch bestaetigt werden.",
        impact: "Inkonsistenzen zwischen Policy und Betrieb werden frueh sichtbar.",
        recommendedAction: "Policy-Zuordnung gegen aktuelle Nutzung verifizieren.",
      },
      {
        ruleId: "maintenance-owner",
        priority: 37,
        focus: "owner",
        problem: "Owner-Verantwortung regelmaessig bestaetigen.",
        impact: "Stabile Verantwortlichkeit verbessert Steuerbarkeit.",
        recommendedAction: "Owner-Angabe im Einsatzfall auf Aktualitaet pruefen.",
      },
      {
        ruleId: "maintenance-oversight",
        priority: 36,
        focus: "governance",
        problem: "Aufsichtsmodell im Lebenszyklus erneut bestaetigen.",
        impact: "Aenderungen im Betrieb bleiben governance-seitig nachvollziehbar.",
        recommendedAction: "Aufsichtsmodell auf aktuellen Einsatzstand abgleichen.",
      },
    ];

    for (const useCase of sortedByAge) {
      if (selected.length >= minItems) break;

      for (const template of fallbackTemplates) {
        if (selected.length >= minItems) break;
        const maintenanceId = `${template.ruleId}:${useCase.useCaseId}`;
        if (selected.some((entry) => entry.id === maintenanceId)) continue;

        selected.push(
          createCandidate(
            useCase,
            template.ruleId,
            template.priority,
            template.focus,
            template.problem,
            template.impact,
            template.recommendedAction
          )
        );
      }
    }
  }

  return selected
    .sort(compareCandidates)
    .slice(0, maxItems)
    .map(({ updatedAtTimestamp: _unused, ...recommendation }) => recommendation);
}
