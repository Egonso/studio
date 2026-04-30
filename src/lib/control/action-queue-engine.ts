import type { UseCaseCard } from "@/lib/register-first/types";
import {
  isHighRiskClass,
  parseStoredAiActCategory,
} from "@/lib/register-first/risk-taxonomy";
import {
  buildUseCaseDetailLink,
  buildUseCaseFocusLink,
  type ControlFocusTarget,
} from "@/lib/control/deep-link";
import { CONTROL_REVIEW_DUE_WINDOW_DAYS } from "@/lib/control/maturity-calculator";
import { resolveGovernanceCopyLocale } from "@/lib/i18n/governance-copy";

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

type QueueRuleCopy = {
  problem: string;
  impact: string;
  recommendedAction: string;
  deepLinkLabel?: string | null;
};

function getActionQueueRuleCopy(locale?: string): Record<string, QueueRuleCopy> {
  if (resolveGovernanceCopyLocale(locale) === "en") {
    return {
      "high-risk-no-oversight": {
        problem: "High-risk system without a documented oversight model.",
        impact: "Liability and approval risk is increased.",
        recommendedAction:
          "Document the oversight model and record formal responsibility.",
        deepLinkLabel: "Set oversight model",
      },
      "high-risk-no-review-structure": {
        problem: "High-risk system without a structured review cycle.",
        impact: "Regular monitoring cannot be evidenced reliably.",
        recommendedAction:
          "Document the review rhythm or the next review date.",
        deepLinkLabel: "Set review cycle",
      },
      "review-overdue": {
        problem: "Review is overdue.",
        impact: "The documentation state can become stale for external audits.",
        recommendedAction:
          "Perform the review now and document the status change.",
        deepLinkLabel: "Document review",
      },
      "owner-missing": {
        problem: "System without clear owner assignment.",
        impact: "Responsibilities are not clearly defined.",
        recommendedAction: "Add the owner in the core documentation.",
        deepLinkLabel: "Add owner",
      },
      "proof-ready-no-proof": {
        problem: "Status PROOF_READY without stored evidence data.",
        impact: "Export and audit readiness are not secured.",
        recommendedAction:
          "Update the evidence data and document the evidence link.",
        deepLinkLabel: null,
      },
      "review-structure-missing": {
        problem: "No structured review cycle documented.",
        impact: "Review planning cannot be controlled reliably.",
        recommendedAction: "Set the review cycle or the next review date.",
        deepLinkLabel: "Set review cycle",
      },
      "high-risk-no-policy": {
        problem: "High-risk system without policy mapping.",
        impact: "Control measures are not assigned consistently.",
        recommendedAction:
          "Add policy links for this system in the register.",
        deepLinkLabel: null,
      },
      "policy-mapping-missing": {
        problem: "No policy mapping documented.",
        impact: "Governance requirements are harder to evidence.",
        recommendedAction: "Link relevant policy references to the use case.",
        deepLinkLabel: null,
      },
      "audit-history-missing": {
        problem: "No audit history is available for this system.",
        impact: "The review history is not yet audit-ready.",
        recommendedAction:
          "Document the first review or a status evidence item.",
        deepLinkLabel: "Build audit trail",
      },
      "review-due": {
        problem: "Review is due within the next 30 days.",
        impact: "A delay will lead to overdue review status.",
        recommendedAction:
          "Prepare the review appointment now and assign responsibility.",
        deepLinkLabel: "Prepare review",
      },
      "status-unreviewed": {
        problem: "System remains in status UNREVIEWED.",
        impact: "A formal review has not yet been documented.",
        recommendedAction:
          "Document the first review step and the status change.",
        deepLinkLabel: "Start review",
      },
      "maintenance-review": {
        problem: "Continuity check for review status is pending.",
        impact: "Regular maintenance preserves long-term audit readability.",
        recommendedAction:
          "Briefly check the review status and update it if needed.",
      },
      "maintenance-audit": {
        problem: "The audit trail should be maintained regularly.",
        impact: "Ongoing documentation reduces evidence effort in audits.",
        recommendedAction:
          "Review the latest review and status documentation for completeness.",
      },
      "maintenance-policy": {
        problem: "Policy alignment should be confirmed regularly.",
        impact: "Divergences between policy and operation become visible early.",
        recommendedAction:
          "Check the policy mapping against the current usage.",
      },
      "maintenance-owner": {
        problem: "Owner responsibility should be confirmed regularly.",
        impact: "Stable accountability improves control.",
        recommendedAction:
          "Check whether the owner assignment for the use case is still current.",
      },
      "maintenance-oversight": {
        problem: "The oversight model should be reconfirmed during the lifecycle.",
        impact: "Operational changes remain traceable from a governance perspective.",
        recommendedAction:
          "Compare the oversight model with the current operating status.",
      },
      default: {
        problem: "",
        impact: "",
        recommendedAction: "",
        deepLinkLabel: "Open recommended area",
      },
    };
  }

  return {
    "high-risk-no-oversight": {
      problem: "Hochrisiko-System ohne dokumentiertes Aufsichtsmodell.",
      impact: "Erhöhtes Haftungs- und Freigaberisiko.",
      recommendedAction:
        "Dokumentieren Sie das Aufsichtsmodell und halten Sie die formale Verantwortung fest.",
      deepLinkLabel: "Aufsichtsmodell festlegen",
    },
    "high-risk-no-review-structure": {
      problem: "Hochrisiko-System ohne strukturierten Review-Zyklus.",
      impact: "Regelmäßige Überwachung lässt sich nicht verlässlich nachweisen.",
      recommendedAction:
        "Dokumentieren Sie den Review-Rhythmus oder das nächste Review-Datum.",
      deepLinkLabel: "Review-Zyklus festlegen",
    },
    "review-overdue": {
      problem: "Review ist überfällig.",
      impact: "Der Dokumentationsstand kann für externe Audits veralten.",
      recommendedAction:
        "Führen Sie das Review jetzt durch und dokumentieren Sie die Statusänderung.",
      deepLinkLabel: "Review dokumentieren",
    },
    "owner-missing": {
      problem: "System ohne klare Owner-Zuordnung.",
      impact: "Verantwortlichkeiten sind nicht eindeutig festgelegt.",
      recommendedAction: "Ergänzen Sie den Owner in der Kerndokumentation.",
      deepLinkLabel: "Owner ergänzen",
    },
    "proof-ready-no-proof": {
      problem: "Status PROOF_READY ohne hinterlegte Nachweisdaten.",
      impact: "Export- und Auditfähigkeit sind nicht abgesichert.",
      recommendedAction:
        "Aktualisieren Sie die Nachweisdaten und dokumentieren Sie den Evidenz-Link.",
      deepLinkLabel: null,
    },
    "review-structure-missing": {
      problem: "Kein strukturierter Review-Zyklus dokumentiert.",
      impact: "Die Review-Planung lässt sich nicht verlässlich steuern.",
      recommendedAction:
        "Legen Sie den Review-Zyklus oder das nächste Review-Datum fest.",
      deepLinkLabel: "Review-Zyklus festlegen",
    },
    "high-risk-no-policy": {
      problem: "Hochrisiko-System ohne Policy-Mapping.",
      impact: "Kontrollmaßnahmen sind nicht konsistent zugeordnet.",
      recommendedAction:
        "Ergänzen Sie die Policy-Verknüpfungen für dieses System im Register.",
      deepLinkLabel: null,
    },
    "policy-mapping-missing": {
      problem: "Kein Policy-Mapping dokumentiert.",
      impact: "Governance-Vorgaben lassen sich nur schwer nachweisen.",
      recommendedAction:
        "Verknüpfen Sie relevante Policy-Referenzen mit dem Einsatzfall.",
      deepLinkLabel: null,
    },
    "audit-history-missing": {
      problem: "Für dieses System ist keine Audit-Historie verfügbar.",
      impact: "Die Review-Historie ist noch nicht auditfest.",
      recommendedAction:
        "Dokumentieren Sie das erste Review oder einen Statusnachweis.",
      deepLinkLabel: "Audit-Trail aufbauen",
    },
    "review-due": {
      problem: "Review ist innerhalb der nächsten 30 Tage fällig.",
      impact: "Eine Verzögerung führt zu einem überfälligen Review-Status.",
      recommendedAction:
        "Bereiten Sie den Review-Termin jetzt vor und weisen Sie die Verantwortung zu.",
      deepLinkLabel: "Review vorbereiten",
    },
    "status-unreviewed": {
      problem: "System verbleibt im Status UNREVIEWED.",
      impact: "Ein formales Review ist noch nicht dokumentiert.",
      recommendedAction:
        "Dokumentieren Sie den ersten Review-Schritt und die Statusänderung.",
      deepLinkLabel: "Review starten",
    },
    "maintenance-review": {
      problem: "Kontinuitätsprüfung für den Review-Status steht aus.",
      impact: "Regelmäßige Pflege sichert die langfristige Audit-Lesbarkeit.",
      recommendedAction:
        "Prüfen Sie den Review-Status kurz und aktualisieren Sie ihn bei Bedarf.",
    },
    "maintenance-audit": {
      problem: "Der Audit-Trail sollte regelmäßig gepflegt werden.",
      impact: "Laufende Dokumentation senkt den Nachweisaufwand in Audits.",
      recommendedAction:
        "Prüfen Sie die jüngste Review- und Statusdokumentation auf Vollständigkeit.",
    },
    "maintenance-policy": {
      problem: "Die Policy-Ausrichtung sollte regelmäßig bestätigt werden.",
      impact: "Abweichungen zwischen Richtlinie und Betrieb werden früh sichtbar.",
      recommendedAction: "Prüfen Sie das Policy-Mapping gegen die aktuelle Nutzung.",
    },
    "maintenance-owner": {
      problem: "Die Owner-Verantwortung sollte regelmäßig bestätigt werden.",
      impact: "Stabile Verantwortlichkeit verbessert die Steuerbarkeit.",
      recommendedAction:
        "Prüfen Sie, ob die Owner-Zuordnung im Einsatzfall noch aktuell ist.",
    },
    "maintenance-oversight": {
      problem: "Das Aufsichtsmodell sollte im Lebenszyklus erneut bestätigt werden.",
      impact: "Betriebliche Änderungen bleiben aus Governance-Sicht nachvollziehbar.",
      recommendedAction:
        "Gleichen Sie das Aufsichtsmodell mit dem aktuellen Betriebsstatus ab.",
    },
    default: {
      problem: "",
      impact: "",
      recommendedAction: "",
      deepLinkLabel: "Empfohlenen Bereich öffnen",
    },
  };
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
  return isHighRiskClass(
    parseStoredAiActCategory(useCase.governanceAssessment?.core?.aiActCategory)
  );
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
    defaultDeepLinkLabel?: string | null;
  } = {}
): ActionCandidate {
  const hasDeepLink = Object.prototype.hasOwnProperty.call(options, "deepLink");
  const hasDeepLinkLabel = Object.prototype.hasOwnProperty.call(
    options,
    "deepLinkLabel"
  );

  return {
    id: `${ruleId}:${useCase.useCaseId}`,
    priority,
    problem,
    impact,
    recommendedAction,
    useCaseId: useCase.useCaseId,
    useCaseLabel: formatUseCaseLabel(useCase),
    focus,
    deepLink: hasDeepLink
      ? options.deepLink ?? null
      : buildUseCaseFocusLink(useCase.useCaseId, focus),
    deepLinkLabel: hasDeepLinkLabel
      ? options.deepLinkLabel ?? null
      : options.defaultDeepLinkLabel ?? "Empfohlenen Bereich öffnen",
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
  options: { minItems?: number; maxItems?: number; locale?: string } = {}
): ControlActionRecommendation[] {
  if (useCases.length === 0) return [];

  const ruleCopy = getActionQueueRuleCopy(options.locale);
  const defaultDeepLinkLabel = ruleCopy.default.deepLinkLabel;
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
      const rule = ruleCopy["high-risk-no-oversight"];
      candidates.push(
        createCandidate(
          useCase,
          "high-risk-no-oversight",
          100,
          "governance",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              edit: true,
              field: "oversight",
            }),
            deepLinkLabel: rule.deepLinkLabel,
          }
        )
      );
    }

    if (highRisk && !reviewStructured) {
      const rule = ruleCopy["high-risk-no-review-structure"];
      candidates.push(
        createCandidate(
          useCase,
          "high-risk-no-review-structure",
          95,
          "governance",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              edit: true,
              field: "reviewCycle",
            }),
            deepLinkLabel: rule.deepLinkLabel,
          }
        )
      );
    }

    if (reviewState === "OVERDUE") {
      const rule = ruleCopy["review-overdue"];
      candidates.push(
        createCandidate(
          useCase,
          "review-overdue",
          92,
          "governance",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: rule.deepLinkLabel,
          }
        )
      );
    }

    if (!ownerPresent) {
      const rule = ruleCopy["owner-missing"];
      candidates.push(
        createCandidate(
          useCase,
          "owner-missing",
          88,
          "owner",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "owner", {
              edit: true,
            }),
            deepLinkLabel: rule.deepLinkLabel,
          }
        )
      );
    }

    if (useCase.status === "PROOF_READY" && !useCase.proof) {
      const rule = ruleCopy["proof-ready-no-proof"];
      candidates.push(
        createCandidate(
          useCase,
          "proof-ready-no-proof",
          86,
          "audit",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: null,
            deepLinkLabel: rule.deepLinkLabel,
          }
        )
      );
    }

    if (!reviewStructured) {
      const rule = ruleCopy["review-structure-missing"];
      candidates.push(
        createCandidate(
          useCase,
          "review-structure-missing",
          80,
          "governance",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              edit: true,
              field: "reviewCycle",
            }),
            deepLinkLabel: rule.deepLinkLabel,
          }
        )
      );
    }

    if (highRisk && !policyMapped) {
      const rule = ruleCopy["high-risk-no-policy"];
      candidates.push(
        createCandidate(
          useCase,
          "high-risk-no-policy",
          78,
          "policy",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: null,
            deepLinkLabel: rule.deepLinkLabel,
          }
        )
      );
    }

    if (!policyMapped) {
      const rule = ruleCopy["policy-mapping-missing"];
      candidates.push(
        createCandidate(
          useCase,
          "policy-mapping-missing",
          74,
          "policy",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: null,
            deepLinkLabel: rule.deepLinkLabel,
          }
        )
      );
    }

    if (!auditPresent) {
      const rule = ruleCopy["audit-history-missing"];
      candidates.push(
        createCandidate(
          useCase,
          "audit-history-missing",
          68,
          "governance",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: rule.deepLinkLabel,
          }
        )
      );
    }

    if (reviewState === "DUE") {
      const rule = ruleCopy["review-due"];
      candidates.push(
        createCandidate(
          useCase,
          "review-due",
          62,
          "governance",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: rule.deepLinkLabel,
          }
        )
      );
    }

    if (useCase.status === "UNREVIEWED") {
      const rule = ruleCopy["status-unreviewed"];
      candidates.push(
        createCandidate(
          useCase,
          "status-unreviewed",
          58,
          "governance",
          rule.problem,
          rule.impact,
          rule.recommendedAction,
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: rule.deepLinkLabel,
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
        ...ruleCopy["maintenance-review"],
      },
      {
        ruleId: "maintenance-audit",
        priority: 39,
        focus: "audit",
        ...ruleCopy["maintenance-audit"],
      },
      {
        ruleId: "maintenance-policy",
        priority: 38,
        focus: "policy",
        ...ruleCopy["maintenance-policy"],
      },
      {
        ruleId: "maintenance-owner",
        priority: 37,
        focus: "owner",
        ...ruleCopy["maintenance-owner"],
      },
      {
        ruleId: "maintenance-oversight",
        priority: 36,
        focus: "governance",
        ...ruleCopy["maintenance-oversight"],
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
            template.recommendedAction,
            { defaultDeepLinkLabel }
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
