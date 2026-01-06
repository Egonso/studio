import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Globe, Save, Info, AlertTriangle, ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { type TrustPortalConfig } from "@/lib/types";
import { saveProjectData } from "@/lib/data-service";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

    const [publishConfirmation, setPublishConfirmation] = useState(false);
    const [showPublishDialog, setShowPublishDialog] = useState(false);

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
            setPublishConfirmation(currentConfig?.isPublished || false);
        }
    }, [open, currentConfig]);

    const handleGenerateStatement = () => {
        // Logic to generate a draft statement based on context (mocked strictly for now as per "simple draft")
        const draft = `Wir bei diesem Projekt setzen KI ein, um unsere Prozesse zu unterstützen, nicht um menschliche Verantwortung zu ersetzen. 
Wir verpflichten uns zu Transparenz und haben klare Rollen definiert, wer Entscheidungen überwacht. 
Wir sind uns bewusst, dass KI Risiken birgt, und arbeiten kontinuierlich daran, diese zu minimieren und aus Fehlern zu lernen.`;
        setConfig({ ...config, governanceStatement: draft });
    };

    const handleSave = async (shouldPublish: boolean = config.isPublished) => {
        setLoading(true);
        try {
            const newConfig = { ...config, isPublished: shouldPublish };
            if (shouldPublish) {
                newConfig.lastPublishedAt = new Date().toISOString();
            }

            await saveProjectData({ trustPortal: newConfig });

            onConfigSaved(newConfig);
            onOpenChange(false);
            setShowPublishDialog(false);
        } catch (error) {
            console.error("Failed to save trust portal config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublishClick = () => {
        if (!config.isPublished) {
            // First time publishing or re-publishing: Show confirmation dialog
            setShowPublishDialog(true);
        } else {
            // Unpublishing: Just save immediately
            handleSave(false);
        }
    };

    if (showPublishDialog) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && setShowPublishDialog(false)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Portal veröffentlichen</DialogTitle>
                        <DialogDescription>
                            Vor der Veröffentlichung prüfen Sie bitte, ob die dargestellten Inhalte Ihrer Haltung und Verantwortung entsprechen.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert className="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900">
                            <Info className="h-4 w-4 text-indigo-600" />
                            <AlertTitle className="text-indigo-900 dark:text-indigo-100">Hinweis</AlertTitle>
                            <AlertDescription className="text-indigo-800 dark:text-indigo-200 text-sm">
                                Das Portal zeigt bewusst nur ausgewählte, erklärende Informationen.
                                Interne Details, Bewertungen und sensible Inhalte bleiben geschützt.
                            </AlertDescription>
                        </Alert>

                        <div className="flex items-start space-x-2 pt-2">
                            <Checkbox
                                id="confirm"
                                checked={publishConfirmation}
                                onCheckedChange={(c) => setPublishConfirmation(!!c)}
                            />
                            <Label htmlFor="confirm" className="text-sm font-normal leading-tight cursor-pointer">
                                Ich habe die Inhalte geprüft und verstehe, dass bestimmte Informationen bewusst nicht öffentlich gemacht werden.
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Abbrechen</Button>
                        <Button
                            onClick={() => handleSave(true)}
                            disabled={!publishConfirmation || loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Jetzt veröffentlichen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                    {/* 1. Red Line Rules (Accordion) */}
                    <Alert variant="default" className="bg-slate-50 border-slate-200">
                        <AlertDescription className="text-sm text-slate-600">
                            <span className="font-semibold block mb-1">Was grundsätzlich nicht öffentlich gemacht wird</span>
                            Dieses Portal dient der Transparenz über unseren verantwortungsvollen Umgang mit KI.
                            Bestimmte Informationen bleiben jedoch immer intern, um Sicherheit, Menschen und rechtliche Integrität zu schützen.
                        </AlertDescription>
                    </Alert>

                    <Accordion type="single" collapsible className="w-full border rounded-md px-4">
                        <AccordionItem value="red-lines" className="border-none">
                            <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                                <span className="flex items-center gap-2 text-slate-600">
                                    <Info className="h-4 w-4" />
                                    Details zu geschützten Informationen (Red-Lines) ansehen
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 pb-4 px-1">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Immer intern – niemals öffentlich einsehbar:</h4>
                                        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                            <li><span className="font-medium text-slate-900">Interne Schwachstellen oder offene Risiken</span> (z. B. laufende Bewertungen, unfertige Maßnahmen)</li>
                                            <li><span className="font-medium text-slate-900">Detaillierte Entscheidungs- oder Eingriffslogiken</span> (Schwellenwerte, Trigger, Eskalationsmechanismen)</li>
                                            <li><span className="font-medium text-slate-900">Namen oder direkte Kontaktdaten einzelner Mitarbeitender</span> (es werden ausschließlich Rollen dargestellt)</li>
                                            <li><span className="font-medium text-slate-900">Technische Sicherheitsmaßnahmen oder Systemdetails</span> (z. B. Schutzmechanismen, Prompt-Logiken, Modellparameter)</li>
                                            <li><span className="font-medium text-slate-900">Rechtliche Zusicherungen oder Garantien</span> (z. B. „Fehler sind ausgeschlossen“, „wir garantieren …“)</li>
                                        </ul>
                                    </div>
                                    <div className="bg-indigo-50/50 p-3 rounded text-sm text-indigo-900 italic">
                                        Diese Grenzen dienen nicht dazu, Informationen zurückzuhalten, sondern um Transparenz verantwortungsvoll zu gestalten.
                                        Öffentlich sichtbar ist, <strong>wie</strong> wir Verantwortung übernehmen – nicht jedes interne Detail <strong>wie</strong> dies technisch umgesetzt wird.
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Governance Statement */}
                    <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="governance-statement">Governance-Erklärung ("Das Versprechen")</Label>
                            <Button variant="ghost" size="sm" onClick={handleGenerateStatement} className="h-6 text-xs text-indigo-600 hover:text-indigo-700">
                                <Wand2 className="mr-1 h-3 w-3" />
                                Entwurf generieren
                            </Button>
                        </div>
                        <Textarea
                            id="governance-statement"
                            placeholder="z.B. Wir verpflichten uns zur Entwicklung sicherer, transparenter und fairer KI-Systeme..."
                            className="h-32 font-normal"
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
                        <p className="text-xs text-muted-foreground mb-4">
                            Auch bei aktivierter Sichtbarkeit werden nur <strong>hoch-aggregierte, erklärende Informationen</strong> veröffentlicht.
                            Interne Bewertungen, Details und sensible Informationen bleiben geschützt.
                        </p>

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
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 border-t pt-4">
                    <div className="flex-1 flex items-center justify-between sm:justify-start gap-4">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Schließen</Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={config.isPublished ? "destructive" : "default"}
                            onClick={handlePublishClick}
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {config.isPublished ? "Veröffentlichung aufheben" : "Speichern & Portal Veröffentlichen"}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => handleSave(config.isPublished)}
                            disabled={loading}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Nur Speichern
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
