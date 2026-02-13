"use client";

import { Badge } from "@/components/ui/badge";
import {
  registerUseCaseStatusLabels,
  type RegisterUseCaseStatus,
} from "@/lib/register-first";

interface RegisterStatusBadgeProps {
  status: RegisterUseCaseStatus;
}

const statusClassNames: Record<RegisterUseCaseStatus, string> = {
  UNREVIEWED: "",
  REVIEW_RECOMMENDED: "",
  REVIEWED: "",
  PROOF_READY: "border-transparent bg-sky-600 text-white hover:bg-sky-600/80",
};

const statusVariants: Record<RegisterUseCaseStatus, "default" | "secondary" | "outline"> = {
  UNREVIEWED: "outline",
  REVIEW_RECOMMENDED: "secondary",
  REVIEWED: "default",
  PROOF_READY: "outline",
};

export function RegisterStatusBadge({ status }: RegisterStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]} className={statusClassNames[status]}>
      {registerUseCaseStatusLabels[status]}
    </Badge>
  );
}
