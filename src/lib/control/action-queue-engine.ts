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
    deepLinkLabel: options.deepLinkLabel ?? "Open recommended section",
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
          "High-risk system without a documented oversight model.",
          "Increased liability and approval risk.",
          "Document the oversight model and record formal accountability.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              edit: true,
              field: "oversight",
            }),
            deepLinkLabel: "Set oversight model",
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
          "High-risk system without a structured review cycle.",
          "Regular monitoring cannot be reliably evidenced.",
          "Document the review cadence or next review date.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              edit: true,
              field: "reviewCycle",
            }),
            deepLinkLabel: "Set review cycle",
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
          "Review is overdue.",
          "Documentation status may become outdated for external audits.",
          "Conduct the review now and document the status change.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: "Document review",
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
          "System without a clear owner assignment.",
          "Responsibilities are not unambiguously defined.",
          "Record the owner in the core documentation.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "owner", {
              edit: true,
            }),
            deepLinkLabel: "Add owner",
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
          "Status PROOF_READY without evidence data on file.",
          "Export and audit capability is not secured.",
          "Update proof data and document the evidence link.",
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
          "No structured review cycle documented.",
          "Review planning cannot be reliably managed.",
          "Set the review cycle or next review date.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              edit: true,
              field: "reviewCycle",
            }),
            deepLinkLabel: "Set review cycle",
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
          "High-risk system without policy mapping.",
          "Control measures are not consistently assigned.",
          "Add policy links for this system in the register.",
          {
            deepLink: null,
            deepLinkLabel: null,
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
          "No policy mapping documented.",
          "Governance rules are difficult to evidence.",
          "Link relevant policy references to the use case.",
          {
            deepLink: null,
            deepLinkLabel: null,
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
          "No audit history available for this system.",
          "Review history is not yet audit-proof.",
          "Record the first documented review or status evidence.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: "Build audit trail",
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
          "Review is due within the next 30 days.",
          "A delay will result in an overdue review status.",
          "Prepare the review schedule and assign responsibility now.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: "Prepare review",
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
          "System remains in UNREVIEWED status.",
          "Formal review has not yet been documented.",
          "Document the first review step and status change.",
          {
            deepLink: buildUseCaseFocusLink(useCase.useCaseId, "governance", {
              field: "history",
            }),
            deepLinkLabel: "Start review",
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
        problem: "Continuity check for the review status is pending.",
        impact: "Regular maintenance ensures long-term audit readability.",
        recommendedAction: "Briefly validate the review status and update if needed.",
      },
      {
        ruleId: "maintenance-audit",
        priority: 39,
        focus: "audit",
        problem: "Audit trail should be maintained regularly.",
        impact: "Ongoing documentation reduces the evidence burden during audits.",
        recommendedAction: "Check the latest review/status documentation for completeness.",
      },
      {
        ruleId: "maintenance-policy",
        priority: 38,
        focus: "policy",
        problem: "Policy alignment should be confirmed periodically.",
        impact: "Inconsistencies between policy and operations become visible early.",
        recommendedAction: "Verify the policy mapping against current usage.",
      },
      {
        ruleId: "maintenance-owner",
        priority: 37,
        focus: "owner",
        problem: "Owner responsibility should be confirmed regularly.",
        impact: "Stable accountability improves manageability.",
        recommendedAction: "Check whether the owner assignment in the use case is still current.",
      },
      {
        ruleId: "maintenance-oversight",
        priority: 36,
        focus: "governance",
        problem: "Oversight model should be reconfirmed during the lifecycle.",
        impact: "Operational changes remain traceable from a governance perspective.",
        recommendedAction: "Align the oversight model with the current operational status.",
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
