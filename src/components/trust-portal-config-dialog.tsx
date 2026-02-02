import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Globe, Save, Info, Sparkles, AlertTriangle, Copy, Code } from "lucide-react";
import { type TrustPortalConfig, type TrustTonePreset } from "@/lib/types";
import { saveProjectData, publishTrustPortal, getPortfolioProjects } from "@/lib/data-service";
import { calculateTrustScore } from "@/lib/trust-score";
import { type AIProject } from "@/lib/types-portfolio";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface TrustPortalConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentConfig?: TrustPortalConfig;
    projectId: string;
    onConfigSaved: (config: TrustPortalConfig) => void;

    // Additional data for generation context (optional but helpful if passed down)
    // We'll trust the component to infer or use placeholders for now if not passed
    projectTitle?: string;
    policiesExist?: boolean;
}

export function TrustPortalConfigDialog({ open, onOpenChange, currentConfig, projectId, onConfigSaved, projectTitle, policiesExist = false }: TrustPortalConfigDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [portfolioProjects, setPortfolioProjects] = useState<AIProject[]>([]);

    // Extended State Configuration
    const [config, setConfig] = useState<TrustPortalConfig>({
        isPublished: false,
        tonePreset: "standard",
        portalTitle: "AI Trust & Accountability Portal",
        introduction: "",
        governanceStatement: "",
        responsibilityText: "",
        contactText: "",
        contactEmail: "",
        showRiskCategory: true,
        showHumanOversight: true,
        showPolicies: false,
        ...currentConfig
    });

    const [publishConfirmation, setPublishConfirmation] = useState(false);
    const [showPublishDialog, setShowPublishDialog] = useState(false);

    // Reset state and fetch data when dialog opens
    useEffect(() => {
        if (open) {
            setConfig({
                isPublished: false,
                tonePreset: "standard",
                portalTitle: "AI Trust & Accountability Portal",
                introduction: "",
                governanceStatement: "",
                responsibilityText: "",
                contactText: "",
                contactEmail: "",
                showRiskCategory: true,
                showHumanOversight: true,
                showPolicies: false,
                ...currentConfig
            });
            setPublishConfirmation(currentConfig?.isPublished || false);

            // Fetch Portfolio Projects for AI Systems Snapshot
            getPortfolioProjects().then(projects => {
                setPortfolioProjects(projects);
            }).catch(err => console.error("Failed to load portfolio projects:", err));
        }
    }, [open, currentConfig]);

    const handleGenerateContent = (overrideTone?: TrustTonePreset) => {
        const tone = overrideTone || config.tonePreset;
        const orgName = projectTitle || "Unsere Organisation";

        let intro = "";
        let purpose = ""; // governance statement aka pledge
        let resp = "";
        let contact = "";

        if (tone === 'standard') {
            intro = `${orgName} nutzt Künstliche Intelligenz für definierte Zwecke. Die Verantwortung für Entscheidungen verbleibt stets bei Menschen. Dieses Portal schafft Transparenz über unsere Governance-Strukturen.`;
            purpose = `Wir setzen KI ein, um unsere Prozesse effizienter zu gestalten, nicht um menschliche Urteilskraft zu ersetzen. Wir verpflichten uns zu Transparenz und haben klare Aufsichtsmechanismen etabliert. Obwohl wir uns der Risiken bewusst sind, arbeiten wir kontinuierlich an deren Minimierung und der Sicherheit unserer Systeme.`;
            resp = `Für den Einsatz von KI wurden klare Rollen und Verantwortlichkeiten definiert. Alle beteiligten Personen erhalten regelmäßige Schulungen zu KI-Grundlagen und ethischen Aspekten.`;
            contact = `Wenn Sie Fragen oder Bedenken zu unserem Einsatz von KI haben, laden wir Sie ein, uns zu kontaktieren.`;
        } else if (tone === 'human') {
            intro = `Bei ${orgName} steht der Mensch im Mittelpunkt. KI ist für uns ein Werkzeug, das menschliche Fähigkeiten erweitert, aber niemals ersetzt. Wir legen offen, wie wir diese Technologie verantwortungsvoll nutzen.`;
            purpose = `Unsere KI-Systeme dienen als Assistenten, die uns unterstützen, komplexe Aufgaben besser zu lösen. Wir glauben fest daran, dass Technologie ethischen Werten folgen muss. Deshalb prüfen wir jedes System sorgfältig auf seine Auswirkungen auf Menschen. Fehler sind möglich, aber unser Engagement für Verantwortung und Lernen ist unerschütterlich.`;
            resp = `Hinter jedem Algorithmus stehen Menschen, die Verantwortung tragen. Wir investieren in die Bildung unserer Teams, damit sie KI souverän und kritisch nutzen können.`;
            contact = `Ein offener Dialog ist uns wichtig. Ihre Perspektive hilft uns, besser zu werden. Bitte schreiben Sie uns.`;
        } else if (tone === 'conservative') {
            intro = `${orgName} implementiert KI-basierte Systeme unter strikter Einhaltung interner Governance-Vorgaben. Dieses Portal dient der Dokumentation unserer Aufsichtsmaßnahmen.`;
            purpose = `Der Einsatz von KI erfolgt gemäß definierter Use-Cases zur Prozessoptimierung. Systementscheidungen unterliegen einer menschlichen Validierung gemäß unserem Risikomanagement-Rahmenwerk. Wir überwachen die Systemleistung kontinuierlich im Hinblick auf technische und regulatorische Anforderungen.`;
            resp = `Governance-Strukturen sind operationalisiert. Zugriffsberechtigungen und Verantwortlichkeiten sind dokumentiert. Schulungsmaßnahmen für relevantes Personal werden durchgeführt.`;
            contact = `Für formelle Anfragen bezüglich unserer KI-Governance wenden Sie sich bitte an die angegebene Kontaktadresse.`;
        }

        setConfig(prev => ({
            ...prev,
            tonePreset: tone,
            introduction: intro,
            governanceStatement: purpose,
            responsibilityText: resp,
            contactText: contact,
            portalTitle: `AI Trust Portal - ${orgName}` // Auto-set title too
        }));

        toast({ title: "Inhalte generiert", description: `Texte für Tonfall "${tone}" wurden erstellt.` });
    };

    const handleSave = async (shouldPublish: boolean = config.isPublished) => {
        setLoading(true);
        try {
            const newConfig = { ...config, isPublished: shouldPublish };
            if (shouldPublish) {
                newConfig.lastPublishedAt = new Date().toISOString();

                // IMPORTANT: Calculate Trust Score & Get Systems Snapshot here
                // Use real portfolio data mapped to the simplified public structure
                const aiSystemsSnapshot = portfolioProjects.map(p => ({
                    name: p.title,
                    purpose: p.description,
                    riskCategory: p.aiActRiskClass,
                    humanOversight: p.businessOwner || "Projektverantwortliche"
                }));

                const trustScore = calculateTrustScore(newConfig, aiSystemsSnapshot.length > 0, policiesExist);

                await publishTrustPortal(newConfig, trustScore, aiSystemsSnapshot);
                toast({ title: "Portal veröffentlicht", description: "Die öffentliche Seite ist nun aktualisiert." });
            } else {
                // Just save config locally
                await saveProjectData({ trustPortal: newConfig });
                toast({ title: "Gespeichert", description: "Konfiguration wurde gesichert." });
            }

            onConfigSaved(newConfig);
            if (shouldPublish) {
                setShowPublishDialog(false);
                // Don't close main dialog immediately to allow viewing links? 
                // Actually close it is better UX usually, or switch to "Success" view.
                onOpenChange(false);
            } else {
                onOpenChange(false);
            }
        } catch (error) {
            console.error("Failed to save trust portal config:", error);
            toast({ variant: "destructive", title: "Fehler", description: "Speichern fehlgeschlagen." });
        } finally {
            setLoading(false);
        }
    };

    const handlePublishClick = () => {
        if (!config.isPublished) {
            setShowPublishDialog(true);
        } else {
            handleSave(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Kopiert", description: "In die Zwischenablage kopiert." });
    };

    // --- Publish Confirmation Dialog ---
    if (showPublishDialog) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && setShowPublishDialog(false)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Portal veröffentlichen</DialogTitle>
                        <DialogDescription>
                            Bestätigen Sie die Inhalte. Dies erstellt einen öffentlichen Snapshot Ihrer aktuellen Daten.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Alert className="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900">
                            <Info className="h-4 w-4 text-indigo-600" />
                            <AlertTitle className="text-indigo-900 dark:text-indigo-100">Snapshot-Logik</AlertTitle>
                            <AlertDescription className="text-indigo-800 dark:text-indigo-200 text-sm">
                                Es wird eine statische Kopie (Snapshot) der ausgewählten Informationen erstellt.
                                Änderungen an Ihren interne Daten (z.B. neue Risiken) werden erst sichtbar,
                                wenn Sie erneut "Veröffentlichen" klicken.
                            </AlertDescription>
                        </Alert>
                        <p className="text-xs text-muted-foreground">
                            <strong>Hinweis:</strong> Sie können das Portal jederzeit aktualisieren, offline nehmen oder Inhalte bearbeiten.
                        </p>
                        <div className="flex items-start space-x-2 pt-2">
                            <Checkbox id="confirm" checked={publishConfirmation} onCheckedChange={(c) => setPublishConfirmation(!!c)} />
                            <Label htmlFor="confirm" className="text-sm font-normal leading-tight cursor-pointer">
                                Ich habe die Inhalte geprüft und verstehe, dass diese öffentlich sichtbar werden.
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Abbrechen</Button>
                        <Button onClick={() => handleSave(true)} disabled={!publishConfirmation || loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Jetzt veröffentlichen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/trust/${projectId}` : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-indigo-600" />
                        AI Trust Portal konfigurieren
                    </DialogTitle>
                    <DialogDescription>
                        Erstellen Sie automatisch eine vertrauenswürdige, öffentliche Seite für Ihre KI-Governance.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* 0. Public Link & Embed (Visible only if published) */}
                    {currentConfig?.isPublished && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-green-900 flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Portal ist online
                                </span>
                                <Button variant="link" size="sm" className="h-auto p-0 text-green-700" onClick={() => window.open(publicUrl, '_blank')}>
                                    Öffnen <Globe className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Input value={publicUrl} readOnly className="bg-white h-8 text-xs font-mono" />
                                <Button variant="outline" size="sm" className="h-8" onClick={() => copyToClipboard(publicUrl)}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                            <div className="pt-2 border-t border-green-100">
                                <p className="text-xs text-green-800 font-medium mb-1 flex items-center gap-1">
                                    <Code className="h-3 w-3" /> Embed Code (Website Integration)
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        value={`<iframe src="${publicUrl}" width="100%" height="800" frameborder="0"></iframe>`}
                                        readOnly
                                        className="bg-white h-8 text-xs font-mono text-muted-foreground"
                                    />
                                    <Button variant="outline" size="sm" className="h-8" onClick={() => copyToClipboard(`<iframe src="${publicUrl}" width="100%" height="800" frameborder="0"></iframe>`)}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 1. Tone & Content Generation */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-base font-semibold">1. Tonalität & Inhalt generieren</Label>
                        </div>
                        <Alert className="bg-slate-50">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <AlertTitle>KI-Generator</AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground mt-1">
                                Wählen Sie einen Tonfall, um alle Textfelder automatisch basierend auf Ihren Projektdaten vorzubefüllen.
                                Manuelle Änderungen werden durch erneutes Generieren überschrieben.
                            </AlertDescription>
                        </Alert>

                        <RadioGroup
                            value={config.tonePreset}
                            onValueChange={(val) => handleGenerateContent(val as TrustTonePreset)}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                        >
                            <div className={`border rounded-md p-3 cursor-pointer hover:bg-slate-50 ${config.tonePreset === 'standard' ? 'border-indigo-500 bg-indigo-50/50' : ''}`}>
                                <RadioGroupItem value="standard" id="tone-standard" className="sr-only" />
                                <Label htmlFor="tone-standard" className="cursor-pointer">
                                    <div className="font-semibold mb-1">Standard / Seriös</div>
                                    <div className="text-xs text-muted-foreground">Klar, neutral und verantwortungsbewusst. Für die meisten Unternehmen geeignet.</div>
                                </Label>
                            </div>
                            <div className={`border rounded-md p-3 cursor-pointer hover:bg-slate-50 ${config.tonePreset === 'human' ? 'border-indigo-500 bg-indigo-50/50' : ''}`}>
                                <RadioGroupItem value="human" id="tone-human" className="sr-only" />
                                <Label htmlFor="tone-human" className="cursor-pointer">
                                    <div className="font-semibold mb-1">Mensch-zentriert</div>
                                    <div className="text-xs text-muted-foreground">Betont menschliche Aufsicht und ethische Werte. Warm und reflektiert.</div>
                                </Label>
                            </div>
                            <div className={`border rounded-md p-3 cursor-pointer hover:bg-slate-50 ${config.tonePreset === 'conservative' ? 'border-indigo-500 bg-indigo-50/50' : ''}`}>
                                <RadioGroupItem value="conservative" id="tone-conservative" className="sr-only" />
                                <Label htmlFor="tone-conservative" className="cursor-pointer">
                                    <div className="font-semibold mb-1">Konservativ</div>
                                    <div className="text-xs text-muted-foreground">Präzise, zurückhaltend und fokussiert auf Compliance-Strukturen.</div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* 2. Text Content Sections */}
                    <Accordion type="single" collapsible className="w-full" defaultValue="content-sections">
                        <AccordionItem value="content-sections">
                            <AccordionTrigger>2. Textinhalte bearbeiten</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="portal-title">Seitentitel</Label>
                                    <Input id="portal-title" value={config.portalTitle} onChange={e => setConfig({ ...config, portalTitle: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="intro">Einleitung</Label>
                                    <Textarea id="intro" className="h-20" value={config.introduction} onChange={e => setConfig({ ...config, introduction: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="pledge">Governance-Erklärung ("The Pledge")</Label>
                                    <Textarea id="pledge" className="h-32" value={config.governanceStatement} onChange={e => setConfig({ ...config, governanceStatement: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="resp">Verantwortlichkeit & Kompetenz</Label>
                                    <Textarea id="resp" className="h-24" value={config.responsibilityText} onChange={e => setConfig({ ...config, responsibilityText: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact-text">Kontakt-Einladung</Label>
                                    <Textarea id="contact-text" className="h-20" value={config.contactText} onChange={e => setConfig({ ...config, contactText: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact-email">Öffentliche E-Mail Adresse</Label>
                                    <Input id="contact-email" value={config.contactEmail} onChange={e => setConfig({ ...config, contactEmail: e.target.value })} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* 3. Visibility Settings */}
                    <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                        <h4 className="font-medium text-sm text-slate-900">3. Sichtbarkeit & Daten</h4>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Menschliche Aufsicht anzeigen</Label>
                                <p className="text-xs text-muted-foreground">Erklären, wer das KI-System überwacht</p>
                            </div>
                            <Switch checked={config.showHumanOversight} onCheckedChange={(c) => setConfig({ ...config, showHumanOversight: c })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Risikokategorie anzeigen</Label>
                                <p className="text-xs text-muted-foreground">EU AI Act Risikoklasse anzeigen</p>
                            </div>
                            <Switch checked={config.showRiskCategory} onCheckedChange={(c) => setConfig({ ...config, showRiskCategory: c })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Richtlinien & Kompetenz anzeigen</Label>
                                <p className="text-xs text-muted-foreground">Bestätigen, dass Richtlinien existieren und geschult wurden</p>
                            </div>
                            <Switch checked={config.showPolicies} onCheckedChange={(c) => setConfig({ ...config, showPolicies: c })} />
                        </div>
                    </div>

                    {/* 4. Red Lines Info */}
                    <Accordion type="single" collapsible className="w-full border rounded-md px-4">
                        <AccordionItem value="red-lines" className="border-none">
                            <AccordionTrigger className="text-sm font-medium hover:no-underline py-3 text-slate-500">
                                <span className="flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Was bleibt immer privat? (Red-Lines)
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pb-4 text-sm text-slate-600">
                                    <p>Folgende Details werden <strong>niemals</strong> im Portal veröffentlicht:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Interne Schwachstellen oder offene Risiken</li>
                                        <li>Namen einzelner Mitarbeitender</li>
                                        <li>Technische Systemdetails (Prompts, Parameter)</li>
                                        <li>Rechtliche Garantien</li>
                                    </ul>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 border-t pt-4">
                    <div className="flex-1 flex items-center justify-between sm:justify-start gap-4">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Schließen</Button>
                    </div>
                    <div className="flex items-center gap-2">
                        {config.isPublished ? (
                            <>
                                {/* When already published: show Update, Unpublish, Save Draft */}
                                <Button
                                    variant="outline"
                                    onClick={() => handleSave(false)}
                                    disabled={loading}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    Offline nehmen
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        // Save locally without republishing
                                        saveProjectData({ trustPortal: { ...config, isPublished: true } });
                                        toast({ title: "Entwurf gespeichert", description: "Änderungen sind lokal gesichert. Klicken Sie 'Aktualisieren' um sie zu veröffentlichen." });
                                        onOpenChange(false);
                                    }}
                                    disabled={loading}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Entwurf speichern
                                </Button>
                                <Button
                                    onClick={() => handleSave(true)}
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Globe className="mr-2 h-4 w-4" />
                                    Aktualisieren & Veröffentlichen
                                </Button>
                            </>
                        ) : (
                            <>
                                {/* When not published: show Publish and Save Draft */}
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        saveProjectData({ trustPortal: config });
                                        toast({ title: "Entwurf gespeichert", description: "Konfiguration wurde lokal gesichert." });
                                        onOpenChange(false);
                                    }}
                                    disabled={loading}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Nur Speichern (Entwurf)
                                </Button>
                                <Button onClick={handlePublishClick} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Globe className="mr-2 h-4 w-4" />
                                    Portal veröffentlichen
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
