"use client";

import { CheckCircle2, ShieldCheck, FileText, BarChart3, Presentation } from "lucide-react";
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

export function ToolkitPaywallDialog({
    open,
    onOpenChange,
}: ToolkitPaywallDialogProps) {
    // In a real application, this would redirect to a Stripe checkout session
    // or a dedicated `/toolkit` landing page.
    const handleCheckout = () => {
        window.location.href = "https://eukigesetz.com/toolkit"; // Adjust based on final route
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-0">
                <div className="flex flex-col md:flex-row h-full">

                    {/* Left Column: Value Prop */}
                    <div className="bg-primary/5 p-8 md:w-5/12 border-r flex flex-col justify-center">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">EUKI Governance Toolkit</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            Schließen Sie Compliance-Lücken sofort. Vom initialen Assessment zur proaktiven Steuerung.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-primary mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium">Policy Generator</p>
                                    <p className="text-muted-foreground text-xs">Fertige Richtlinien für den KI-Einsatz</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Presentation className="w-5 h-5 text-primary mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium">Mitarbeiter-Schulungen</p>
                                    <p className="text-muted-foreground text-xs">Zertifizierte Trainings-Module</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium">Risk Control Matrix</p>
                                    <p className="text-muted-foreground text-xs">Vorlagen für Incident & Oversight Prozesse</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pricing & CTA */}
                    <div className="p-8 md:w-7/12 flex flex-col justify-center bg-white">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl">Aktivieren Sie das Toolkit</DialogTitle>
                            <DialogDescription className="text-sm">
                                Sie haben aktuell Lücken in Ihrem Governance-Konzept. Schalten Sie das Toolkit frei, um sofortige Lösungen zu erhalten.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-secondary/30 border rounded-xl p-5 mb-8">
                            <div className="flex items-end gap-2 mb-1">
                                <span className="text-3xl font-bold">290 €</span>
                                <span className="text-muted-foreground text-sm mb-1">/ Monat</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Jederzeit kündbar. Inklusive unbegrenzter Use Cases und 5 Nutzer-Lizenzen.
                            </p>
                        </div>

                        <Button
                            size="lg"
                            className="w-full text-base font-semibold shadow-md"
                            onClick={handleCheckout}
                        >
                            Jetzt aktivieren & Lücken schließen
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            Vertrauen durch nachweisbare AI Governance.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
