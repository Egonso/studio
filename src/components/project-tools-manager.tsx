"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlusCircle, Trash2, Search, ExternalLink, ShieldCheck, ShieldAlert, Loader2, Info } from "lucide-react";
import { ProjectTool, ToolPublicInfo, FlagStatus } from "@/lib/types";
import { getProjectTools, addProjectTool, deleteProjectTool } from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";
import { ToolAutocomplete } from "./tool-autocomplete";

interface ProjectToolsManagerProps {
    projectId: string;
}

export function ProjectToolsManager({ projectId }: ProjectToolsManagerProps) {
    const [tools, setTools] = useState<ProjectTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const { toast } = useToast();

    // New Tool State
    const [newToolName, setNewToolName] = useState("");
    const [newToolVendor, setNewToolVendor] = useState("");
    const [newToolUrl, setNewToolUrl] = useState("");
    const [newToolType, setNewToolType] = useState<ProjectTool['type']>('saas');

    // Check State
    const [checkingCompliance, setCheckingCompliance] = useState<Record<string, boolean>>({});

    const loadTools = useCallback(async () => {
        try {
            const data = await getProjectTools(projectId);
            setTools(data);
        } catch (error) {
            console.error("Failed to load tools", error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void loadTools();
    }, [loadTools]);

    const handleAddTool = async () => {
        if (!newToolName.trim()) return;
        try {
            await addProjectTool(projectId, {
                name: newToolName,
                vendor: newToolVendor,
                url: newToolUrl,
                type: newToolType,
                dataCategories: { personal: false, sensitive: false, none: false, unknown: true },
                review: { status: 'pending', reviewedBy: null, reviewedAt: null, notes: null },
                publicInfo: null,
                category: null // Optional or derived from autocomplete
            });
            setNewToolName("");
            setNewToolVendor("");
            setNewToolUrl("");
            setIsAdding(false);
            void loadTools();
            toast({ title: "Tool hinzugefügt", description: "Das KI-Tool wurde dem Organisation hinzugefügt." });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Fehler", description: "Konnte Tool nicht hinzufügen." });
        }
    };

    const handleDeleteTool = async (id: string) => {
        if (!confirm("Möchten Sie dieses Tool wirklich entfernen?")) return;
        try {
            await deleteProjectTool(projectId, id);
            setTools(prev => prev.filter(t => t.id !== id));
            toast({ title: "Tool entfernt" });
        } catch (_error) {
            toast({ variant: "destructive", title: "Fehler", description: "Konnte Tool nicht entfernen." });
        }
    };

    const runComplianceCheck = async (tool: ProjectTool) => {
        if (!tool.name) return;

        setCheckingCompliance(prev => ({ ...prev, [tool.id]: true }));
        try {
            // Get Auth Token
            const { getFirebaseAuth } = await import("@/lib/firebase");
            const auth = await getFirebaseAuth();
            const token = await auth.currentUser?.getIdToken();

            if (!token) {
                throw new Error("Sie sind nicht eingeloggt.");
            }

            // Updated Endpoint
            const response = await fetch('/api/tools/public-info-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // Updated Body format
                body: JSON.stringify({
                    projectId,
                    toolIds: [tool.id],
                    force: true // Allow user to force refresh
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results[tool.id]) {
                    const result = data.results[tool.id] as ToolPublicInfo;

                    // Update Local State
                    setTools(prev => prev.map(t => t.id === tool.id ? { ...t, publicInfo: result } : t));
                    toast({ title: "Check abgeschlossen", description: "Öffentliche Informationen aktualisiert." });
                } else if (data.error) {
                    throw new Error(data.error);
                }
            } else {
                throw new Error(`API Error: ${response.status}`);
            }
        } catch (error: any) {
            console.error("Compliance Check failed", error);
            toast({ variant: "destructive", title: "Check fehlgeschlagen", description: error.message || "Konnte keine Informationen abrufen." });
        } finally {
            setCheckingCompliance(prev => ({ ...prev, [tool.id]: false }));
        }
    };

    const FlagIndicator = ({ status, label }: { status: FlagStatus, label: string }) => {
        if (status === 'not_found') return <div className="flex items-center gap-2 p-2 bg-gray-50 rounded opacity-50"><div className="h-4 w-4 rounded-full border-2 border-gray-300" /><span className="text-xs">{label}</span></div>;
        const isYes = status === 'yes';
        return (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                {isYes ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
                <span className={isYes ? "text-xs font-medium" : "text-xs text-muted-foreground"}>{label}</span>
            </div>
        );
    };

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between px-0">
                <div>
                    <CardTitle>KI-Tools & Systeme</CardTitle>
                    <CardDescription>Single Source of Truth für alle KI-Dienste in diesem Organisation.</CardDescription>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Tool hinzufügen
                    </Button>
                )}
            </CardHeader>
            <CardContent className="px-0 space-y-4">
                {isAdding && (
                    <div className="bg-secondary/20 p-4 rounded-lg flex flex-col sm:flex-row gap-4 items-end mb-4 border border-blue-200">
                        <div className="flex-1 space-y-2 w-full">
                            <Label>Name des Tools</Label>
                            <ToolAutocomplete
                                value={newToolName}
                                onChange={(val, data) => {
                                    setNewToolName(val);
                                    if (data) {
                                        setNewToolType((data.defaultType as any) || 'saas');
                                        setNewToolVendor(data.vendor);
                                        setNewToolUrl(data.homepageUrl);
                                    }
                                }}
                            />
                        </div>
                        <div className="w-full sm:w-[200px] space-y-2">
                            <Label>Typ</Label>
                            <Select value={newToolType} onValueChange={(v: any) => setNewToolType(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="saas">SaaS (Cloud)</SelectItem>
                                    <SelectItem value="model">Lokales Modell</SelectItem>
                                    <SelectItem value="internal">Eigenentwicklung</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button onClick={handleAddTool}>Speichern</Button>
                            <Button variant="ghost" onClick={() => setIsAdding(false)}>Abbrechen</Button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                ) : tools.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground bg-muted/30">
                        <p>Noch keine Tools hinterlegt.</p>
                        <Button variant="link" onClick={() => setIsAdding(true)}>Erstes Tool hinzufügen</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tools.map(tool => (
                            <div key={tool.id} className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 flex items-center justify-center rounded bg-primary/10 text-primary font-bold text-lg">
                                            {tool.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-lg">{tool.name}</h4>
                                                <Badge variant="outline" className="uppercase text-[10px]">{tool.type}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{tool.vendor || 'Unbekannter Anbieter'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={tool.review.status === 'approved_internal' ? 'default' : 'secondary'}>
                                            {tool.review.status === 'pending' ? 'Review ausstehend' : 'Geprüft'}
                                        </Badge>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTool(tool.id)}>
                                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-destructive" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Public Info Card */}
                                {!tool.publicInfo ? (
                                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md border border-dashed">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Info className="h-4 w-4" />
                                            <span>Keine öffentlichen Compliance-Daten abgerufen.</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => runComplianceCheck(tool)}
                                            disabled={checkingCompliance[tool.id]}
                                        >
                                            {checkingCompliance[tool.id] ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Search className="mr-2 h-3 w-3" />}
                                            Jetzt prüfen (Perplexity)
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="bg-background rounded-md border text-sm overflow-hidden">
                                        <div className="p-2 bg-muted/50 border-b flex justify-between items-center">
                                            <span className="font-medium text-xs flex items-center gap-2 text-muted-foreground">
                                                <Search className="h-3 w-3" />
                                                Recherche vom {new Date(tool.publicInfo.lastCheckedAt!).toLocaleDateString()}
                                            </span>
                                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => runComplianceCheck(tool)} disabled={checkingCompliance[tool.id]}>
                                                {checkingCompliance[tool.id] ? "Aktualisiere..." : "Neu prüfen"}
                                            </Button>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            {/* Disclaimer */}
                                            <Alert className="bg-blue-50/50 border-blue-100 py-2">
                                                <ShieldAlert className="h-3 w-3 text-blue-600" />
                                                <AlertTitle className="text-xs font-semibold text-blue-800 ml-2">Automatische Recherche</AlertTitle>
                                                <AlertDescription className="text-xs text-blue-700 ml-2 mt-0.5" style={{ lineHeight: '1.4' }}>
                                                    Die folgenden Informationen wurden automatisch aus öffentlich zugänglichen Quellen zusammengetragen. Es handelt sich um <strong>Anbieteraussagen</strong>, nicht um eine rechtliche Prüfung. Bitte verifizieren Sie die Angaben.
                                                </AlertDescription>
                                            </Alert>

                                            {/* Summary */}
                                            <div>
                                                <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                                                    {tool.publicInfo.summary || "Keine Zusammenfassung verfügbar."}
                                                </p>
                                            </div>

                                            {/* Flags Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                <FlagIndicator status={tool.publicInfo.flags.gdprClaim} label="DSGVO-Erwähnung" />
                                                <FlagIndicator status={tool.publicInfo.flags.aiActClaim} label="AI Act Statement" />
                                                <FlagIndicator status={tool.publicInfo.flags.trustCenterFound} label="Trust Center" />
                                                <FlagIndicator status={tool.publicInfo.flags.dpaOrSccMention} label="AVV / SCC" />
                                            </div>

                                            {/* Sources */}
                                            {tool.publicInfo.sources && tool.publicInfo.sources.length > 0 && (
                                                <div className="text-xs text-muted-foreground pt-2 border-t flex flex-wrap gap-x-4 gap-y-1">
                                                    <span className="font-semibold">Quellen:</span>
                                                    {tool.publicInfo.sources.map((src, i) => (
                                                        <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline hover:text-primary transition-colors">
                                                            {src.title || src.type} <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
