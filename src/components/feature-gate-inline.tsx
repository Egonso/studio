"use client";

/**
 * FeatureGateInline – Compact lock button for inline use in sidebars and sections.
 *
 * Replaces ad-hoc Lock-icon + toast patterns with a consistent component.
 *
 * Design:
 *   - Compact: Button with Lock-Icon + Plan-Label
 *   - Click → opens FeatureGateDialog
 *   - Neutral slate styling, no aggressive upsell
 *
 * Sprint: UX-0 Feature-Gate Refactor
 */

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureGateDialog } from "@/components/feature-gate-dialog";
import type { FeatureCapability } from "@/lib/compliance-engine/capability/featureChecker";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";

// ── Types ───────────────────────────────────────────────────────────────────

interface FeatureGateInlineProps {
    /** The feature capability to gate */
    feature: FeatureCapability;
    /** Optional custom button label (default: "Ab {planLabel}") */
    label?: string;
    /** Optional button variant */
    variant?: "default" | "outline" | "ghost";
    /** Optional size */
    size?: "default" | "sm" | "lg";
    /** Optional additional class names */
    className?: string;
    /** If true, renders children when allowed; shows lock button when not */
    children?: React.ReactNode;
    /** Called when the feature IS allowed and the button is clicked */
    onAllowedClick?: () => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export function FeatureGateInline({
    feature,
    label,
    variant = "outline",
    size = "sm",
    className,
    children,
    onAllowedClick,
}: FeatureGateInlineProps) {
    const { allowed, requiredPlanLabel, loading } = useCapability(feature);
    const [showDialog, setShowDialog] = useState(false);

    // While loading, show nothing (prevent flash)
    if (loading) return null;

    // If allowed and children are provided, render children
    if (allowed && children) {
        return <>{children}</>;
    }

    // If allowed but no children, render as a pass-through button
    if (allowed) {
        return (
            <Button
                variant={variant}
                size={size}
                className={className}
                onClick={onAllowedClick}
            >
                {label || "Aktivieren"}
            </Button>
        );
    }

    // Locked: show lock button + dialog
    const displayLabel = label || `Ab ${requiredPlanLabel}`;

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={className}
                onClick={() => setShowDialog(true)}
            >
                <Lock className="w-3 h-3 mr-1.5" />
                {displayLabel}
            </Button>
            <FeatureGateDialog
                feature={feature}
                open={showDialog}
                onOpenChange={setShowDialog}
            />
        </>
    );
}
