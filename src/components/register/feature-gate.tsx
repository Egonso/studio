'use client';

import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import type { FeatureCapability } from '@/lib/compliance-engine/capability/featureChecker';
import { ToolkitPaywallDialog } from '@/components/register/toolkit-paywall-dialog';
import { useState } from 'react';

interface FeatureGateProps {
    /** The feature capability to check */
    feature: FeatureCapability;
    /** The content to render when the feature is allowed */
    children: ReactNode;
    /** Optional: custom message for the lock overlay (default: "Verfügbar im {plan}") */
    lockMessage?: string;
    /** 
     * Render mode when locked:
     * - 'overlay': Shows children blurred with a lock overlay (default)
     * - 'replace': Replaces children entirely with a lock message
     * - 'hide': Hides children completely (no upsell hint)
     */
    mode?: 'overlay' | 'replace' | 'hide';
    /** Optional: additional CSS class for the container */
    className?: string;
}

/**
 * FeatureGate - Wraps UI sections that require a certain plan.
 * 
 * Design principles (from Monetarisierungsstrategie §4):
 * - No aggressive upsell banners
 * - No red warnings for locked features
 * - Clean lock-icon with neutral "Verfügbar im Pro-Plan" text
 * - Click opens the ToolkitPaywallDialog
 * 
 * Usage:
 *   <FeatureGate feature="editUseCase">
 *     <EditForm ... />
 *   </FeatureGate>
 */
export function FeatureGate({
    feature,
    children,
    lockMessage,
    mode = 'overlay',
    className = '',
}: FeatureGateProps) {
    const { allowed, requiredPlanLabel, loading } = useCapability(feature);
    const [showPaywall, setShowPaywall] = useState(false);

    // While loading, show children normally (no flash of locked state)
    if (loading || allowed) {
        return <>{children}</>;
    }

    const displayMessage = lockMessage || `Verfügbar im ${requiredPlanLabel}`;

    if (mode === 'hide') {
        return null;
    }

    if (mode === 'replace') {
        return (
            <>
                <div
                    className={`rounded-lg border border-dashed border-muted-foreground/25 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/40 transition-colors ${className}`}
                    onClick={() => setShowPaywall(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setShowPaywall(true)}
                >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{displayMessage}</p>
                </div>
                <ToolkitPaywallDialog open={showPaywall} onOpenChange={setShowPaywall} />
            </>
        );
    }

    // mode === 'overlay' (default)
    return (
        <>
            <div className={`relative ${className}`}>
                {/* Blurred content */}
                <div className="pointer-events-none select-none blur-[2px] opacity-50" aria-hidden="true">
                    {children}
                </div>

                {/* Lock overlay */}
                <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={() => setShowPaywall(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setShowPaywall(true)}
                >
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm border">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{displayMessage}</span>
                    </div>
                </div>
            </div>
            <ToolkitPaywallDialog open={showPaywall} onOpenChange={setShowPaywall} />
        </>
    );
}
