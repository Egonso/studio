"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    Cpu,
    Search,
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    Loader2,
    Info,
    ExternalLink,
    Building,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { registerService } from "@/lib/register-first/register-service";
import type { UseCaseCard, ToolPublicInfo } from "@/lib/register-first/types";
import { getAuth } from "firebase/auth";

interface RegisterToolsManagerProps {
    registerId?: string; // Optional, auto-resolves if missing (via service)
    projectId?: string; // Kept for legacy compatibility if needed
}

export function RegisterToolsManager({ registerId: propRegisterId }: RegisterToolsManagerProps) {
    const { toast } = useToast();
    const [useCases, setUseCases] = useState<UseCaseCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [checkingCompliance, setCheckingCompliance] = useState<Record<string, boolean>>({});
    const [registerId, setRegisterId] = useState<string | null>(propRegisterId || null);

    // Initialize and resolve registerId on mount
    useEffect(() => {
        const initializeRegisterId = async () => {
            if (!propRegisterId && !registerId) {
                try {
                    const { getActiveRegisterId } = await import("@/lib/register-first/register-settings-client");
                    const activeId = getActiveRegisterId();
                    if (activeId) {
                        setRegisterId(activeId);
                    } else {
                        // Try to get first register if no active one
                        const firstRegister = await registerService.getFirstRegister();
                        if (firstRegister) {
                            setRegisterId(firstRegister.registerId);
                        }
                    }
                } catch (error) {
                    console.error("Failed to resolve registerId:", error);
                }
            }
        };
        initializeRegisterId();
    }, [propRegisterId]);

    // Load data when registerId is available
    useEffect(() => {
        if (registerId || propRegisterId) {
            loadData();
        }
    }, [registerId, propRegisterId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Use resolved registerId or propRegisterId
            const targetRegisterId = propRegisterId || registerId;

            // Service auto-resolves registerId if not provided
            const cards = await registerService.listUseCases(targetRegisterId || undefined);
            setUseCases(cards);

        } catch (error: any) {
            console.error("Failed to load register use cases:", error);

            // Show user-friendly error if no register found
            if (error?.code === "REGISTER_NOT_FOUND") {
                toast({
                    variant: "destructive",
                    title: "Kein Register gefunden",
                    description: "Bitte erstellen Sie zuerst ein Register oder erfassen Sie eine KI-Anwendung.",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const runComplianceCheck = async (card: UseCaseCard) => {
        if (checkingCompliance[card.useCaseId]) return;

        setCheckingCompliance(prev => ({ ...prev, [card.useCaseId]: true }));
        try {
            // Get Auth Token
            const { getFirebaseAuth } = await import("@/lib/firebase");
            const auth = await getFirebaseAuth();
            const token = await auth.currentUser?.getIdToken();

            if (!token) {
                throw new Error("Sie sind nicht eingeloggt.");
            }

            // Updated Endpoint for Register Use Cases
            // Note: registerId might be null if auto-resolved. 
            // API should separate logic or require it. 
            // Best practice: Pass what we have. API can resolve via User if needed?
            // Current API plan says: Accept registerId + useCaseId.

            const response = await fetch('/api/tools/public-info-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    registerId: registerId,
                    useCaseId: card.useCaseId,
                    force: true
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Check failed');
            }

            toast({
                title: "Check abgeschlossen",
                description: `Compliance-Daten für ${card.toolFreeText || card.purpose} aktualisiert.`,
            });

            // Reload data to show results
            loadData();

        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Fehler beim Check",
                description: error.message || "Konnte Compliance-Daten nicht abrufen.",
            });
        } finally {
            setCheckingCompliance(prev => ({ ...prev, [card.useCaseId]: false }));
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>;
    }

    if (useCases.length === 0) {
        return (
            <div className="text-center p-12 bg-muted/20 rounded-xl border border-dashed">
                <Cpu className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Keine KI-Systeme im Register</h3>
                <p className="text-muted-foreground mt-2 mb-6">Erfassen Sie Ihre erste KI-Anwendung, um den Compliance-Prozess zu starten.</p>
                {/* Note: The 'Quick Capture' button is in the header usually. */}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Image
                        src="/register-logo.png"
                        alt="Register Logo"
                        width={32}
                        height={32}
                        className="h-8 w-auto"
                    />
                    <div>
                        <h3 className="text-xl font-bold">KI-Register</h3>
                        <p className="text-muted-foreground">Zentrale Übersicht aller erfassten KI-Anwendungen und deren Status.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {useCases.map((card) => {
                    const info = card.publicInfo;

                    // Determine Status Color
                    let statusColor = "bg-slate-100 text-slate-700 border-slate-200";
                    if (card.status === "REVIEW_RECOMMENDED") statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                    if (card.status === "PROOF_READY") statusColor = "bg-green-50 text-green-700 border-green-200";

                    // Determine Name & Vendor
                    const title = card.toolFreeText || card.toolId || card.purpose;
                    const vendor = card.toolId !== 'other' && card.toolId ? card.toolId : "Unbekannt / Intern";

                    return (
                        <Card key={card.useCaseId} className="hover:shadow-md transition-all">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Icon & Basic Info */}
                                    <div className="flex items-start gap-4 min-w-[250px]">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-xl font-bold text-primary">
                                                {(title)[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{title}</h4>
                                            <p className="text-sm text-muted-foreground mb-2">{vendor}</p>
                                            <Badge variant="outline" className={statusColor}>
                                                {card.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Compliance Check Section */}
                                    <div className="flex-1 border-l pl-0 md:pl-6 border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-medium text-sm flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-primary" />
                                                Compliance-Check (Perplexity)
                                            </h5>
                                            {info?.lastCheckedAt && (
                                                <span className="text-xs text-muted-foreground">
                                                    Stand: {new Date(info.lastCheckedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        {info ? (
                                            <div className="space-y-3">
                                                <div className="flex gap-2 text-sm">
                                                    <Badge variant="outline" className={info.flags.gdprClaim === 'yes' ? 'bg-green-50 text-green-700 border-green-200' : 'text-muted-foreground'}>
                                                        DSGVO {info.flags.gdprClaim === 'yes' ? '✅' : '❓'}
                                                    </Badge>
                                                    <Badge variant="outline" className={info.flags.aiActClaim === 'yes' ? 'bg-green-50 text-green-700 border-green-200' : 'text-muted-foreground'}>
                                                        AI Act {info.flags.aiActClaim === 'yes' ? '✅' : '❓'}
                                                    </Badge>
                                                    <Badge variant="outline" className={info.flags.privacyPolicyFound === 'yes' ? 'bg-green-50 text-green-700 border-green-200' : 'text-muted-foreground'}>
                                                        Privacy Policy {info.flags.privacyPolicyFound === 'yes' ? '✅' : '❌'}
                                                    </Badge>
                                                </div>

                                                <p className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                                                    {info.summary}
                                                </p>

                                                {info.sources && info.sources.length > 0 && (
                                                    <div className="flex gap-2 mt-2">
                                                        {info.sources.slice(0, 3).map((s, i) => (
                                                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                                <ExternalLink className="w-3 h-3" /> Source {i + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                                                    <Info className="w-4 h-4" />
                                                    <span>Keine öffentlichen Compliance-Daten abgerufen.</span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => runComplianceCheck(card)}
                                                    disabled={checkingCompliance[card.useCaseId]}
                                                >
                                                    {checkingCompliance[card.useCaseId] ? (
                                                        <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Prüfe...</>
                                                    ) : (
                                                        <><Search className="w-3 h-3 mr-2" /> Jetzt prüfen (Perplexity)</>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Column */}
                                    <div className="flex flex-col gap-2 justify-center border-l pl-0 md:pl-6 border-slate-100 dark:border-slate-800">
                                        {/* Future Review Actions can go here */}
                                        {info && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => runComplianceCheck(card)}
                                                disabled={checkingCompliance[card.useCaseId]}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <Search className="w-3 h-3 mr-2" /> Update
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
