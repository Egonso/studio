"use client";

/**
 * FeatureGateDialog – Sachlicher, neutraler Upgrade-Hinweis für gesperrte Features.
 *
 * Replaces the old ToolkitPaywallDialog which showed prices and aggressive CTAs.
 *
 * Design (Monetarisierungsstrategie §4):
 *   - Sachlich. Neutral. Keine Preise. Kein Gradient.
 *   - Shows: Which feature, which plan required, what's included
 *   - CTA: "Mehr erfahren" → /settings
 *   - Lock-Icon, clean lines, muted tones
 *
 * Sprint: UX-0 Feature-Gate Refactor
 */

import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { FeatureCapability } from "@/lib/compliance-engine/capability/featureChecker";
import {
    getRequiredPlan,
    getPlanLabel,
    getFeatureLabel,
    getFeatureDescription,
    getPlanHighlights,
} from "@/lib/compliance-engine/capability/featureChecker";

// ── Types ───────────────────────────────────────────────────────────────────

interface FeatureGateDialogProps {
    /** The feature capability that triggered the dialog */
    feature: FeatureCapability;
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to close the dialog */
    onOpenChange: (open: boolean) => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export function FeatureGateDialog({
    feature,
    open,
    onOpenChange,
}: FeatureGateDialogProps) {
    const router = useRouter();

    const requiredPlan = getRequiredPlan(feature);
    const planLabel = getPlanLabel(requiredPlan);
    const featureLabel = getFeatureLabel(feature);
    const featureDescription = getFeatureDescription(feature);
    const planHighlights = getPlanHighlights(requiredPlan, 5);

    const handleLearnMore = () => {
        onOpenChange(false);
        router.push("/settings");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Lock className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-base">
                                {featureLabel}
                            </DialogTitle>
                            <DialogDescription className="text-sm mt-0.5">
                                Erweiterte Governance-Funktion
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-1">
                    {/* Feature description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {featureDescription}
                    </p>

                    {/* Plan highlights */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Funktionsumfang
                        </h4>
                        <ul className="space-y-2">
                            {planHighlights.map((highlight) => (
                                <li
                                    key={highlight}
                                    className="text-sm text-slate-700 flex items-center gap-2"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                    {highlight}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto"
                    >
                        Schließen
                    </Button>
                    <Button
                        onClick={handleLearnMore}
                        className="w-full sm:w-auto"
                    >
                        Mehr erfahren
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
