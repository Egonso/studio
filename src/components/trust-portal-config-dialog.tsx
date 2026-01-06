import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Globe, Save } from "lucide-react";
import { type TrustPortalConfig } from "@/lib/types";
import { saveProjectData } from "@/lib/data-service";

interface TrustPortalConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentConfig?: TrustPortalConfig;
    projectId: string;
    onConfigSaved: (config: TrustPortalConfig) => void;
}

export function TrustPortalConfigDialog({ open, onOpenChange, currentConfig, projectId, onConfigSaved }: TrustPortalConfigDialogProps) {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<TrustPortalConfig>({
        isPublished: false,
        governanceStatement: "",
        contactEmail: "",
        showRiskCategory: true,
        showHumanOversight: true,
        showPolicies: false,
        ...currentConfig
    });

    // Reset state when dialog opens with new config
    useEffect(() => {
        if (open) {
            setConfig({
                isPublished: false,
                governanceStatement: "",
                contactEmail: "",
                showRiskCategory: true,
                showHumanOversight: true,
                showPolicies: false,
                ...currentConfig
            });
        }
    }, [open, currentConfig]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const newConfig = { ...config };
            // If publishing for the first time or re-publishing, update timestamp
            if (config.isPublished) {
                newConfig.lastPublishedAt = new Date().toISOString();
            }

            // Save to Firestore (assuming 'trustPortal' field in project doc)
            await saveProjectData({ trustPortal: newConfig });

            onConfigSaved(newConfig);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save trust portal config:", error);
            // In a real app, show toast error here
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-indigo-600" />
                        AI Trust Portal konfigurieren
                    </DialogTitle>
                    <DialogDescription>
                        Definieren Sie, welche Informationen auf Ihrem AI Transparenz-Report öffentlich sichtbar sind.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Governance Statement */}
                    <div className="grid gap-2">
                        <Label htmlFor="governance-statement">Governance-Erklärung ("Das Versprechen")</Label>
                        <Textarea
                            id="governance-statement"
                            placeholder="z.B. Wir verpflichten uns zur Entwicklung sicherer, transparenter und fairer KI-Systeme..."
                            className="h-32"
                            value={config.governanceStatement}
                            onChange={(e) => setConfig({ ...config, governanceStatement: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Verfassen Sie eine klare, nicht-technische Erklärung über das Engagement Ihrer Organisation für KI-Sicherheit und Ethik.
                        </p>
                    </div>

                    {/* Contact Email */}
                    <div className="grid gap-2">
                        <Label htmlFor="contact-email">Öffentliche Kontakt-E-Mail</Label>
                        <Input
                            id="contact-email"
                            type="email"
                            placeholder="ai-ethics@firma.de"
                            value={config.contactEmail}
                            onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                        />
                    </div>

                    {/* Visibility Toggles */}
                    <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                        <h4 className="font-medium text-sm text-slate-900">Sichtbarkeitseinstellungen</h4>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Risikokategorie anzeigen</Label>
                                <p className="text-xs text-muted-foreground">Die Risikoklassifizierung nach EU AI Act anzeigen</p>
                            </div>
                            <Switch
                                checked={config.showRiskCategory}
                                onCheckedChange={(checked) => setConfig({ ...config, showRiskCategory: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Menschliche Aufsicht anzeigen</Label>
                                <p className="text-xs text-muted-foreground">Erklären, wer das KI-System überwacht</p>
                            </div>
                            <Switch
                                checked={config.showHumanOversight}
                                onCheckedChange={(checked) => setConfig({ ...config, showHumanOversight: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Richtlinien anzeigen</Label>
                                <p className="text-xs text-muted-foreground">Aktive KI-Governance-Richtlinien auflisten</p>
                            </div>
                            <Switch
                                checked={config.showPolicies}
                                onCheckedChange={(checked) => setConfig({ ...config, showPolicies: checked })}
                            />
                        </div>
                    </div>

                    {/* Publish Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t">
                        <div className="space-y-0.5">
                            <Label className="text-base font-semibold text-indigo-900">Portal veröffentlichen</Label>
                            <p className="text-xs text-muted-foreground">Diese Informationen über einen eindeutigen Link öffentlich zugänglich machen.</p>
                        </div>
                        <Switch
                            checked={config.isPublished}
                            onCheckedChange={(checked) => setConfig({ ...config, isPublished: checked })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Konfiguration speichern
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
