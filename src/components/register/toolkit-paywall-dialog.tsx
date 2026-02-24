"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ToolkitPaywallDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PRO_FEATURES = [
    "Einsatzfälle bearbeiten",
    "ISO Lifecycle & Portfolio",
    "EUKI Assessment Wizard",
    "Review-Workflows & Prüfhistorie",
    "Governance-Report Export",
    "Smart Policy Engine",
];

export function ToolkitPaywallDialog({
    open,
    onOpenChange,
}: ToolkitPaywallDialogProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        onOpenChange(false);
        router.push("/settings");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Lock className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">Pro-Plan erforderlich</DialogTitle>
                            <DialogDescription className="text-sm">
                                Diese Funktion ist im Governance Toolkit enthalten.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="border rounded-lg p-4 bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-600 mb-3 uppercase tracking-wide">
                        Enthaltene Funktionen
                    </p>
                    <ul className="space-y-2">
                        {PRO_FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleUpgrade}
                    >
                        Upgrade-Optionen anzeigen
                    </Button>
                    <button
                        className="text-xs text-muted-foreground hover:text-slate-600 text-center"
                        onClick={() => onOpenChange(false)}
                    >
                        Später
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
