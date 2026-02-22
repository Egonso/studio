import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  Globe,
  Save,
  Info,
  Sparkles,
  Copy,
  Code,
} from "lucide-react";
import { type TrustPortalConfig, type TrustTonePreset } from "@/lib/types";
import {
  saveProjectData,
  publishTrustPortal,
} from "@/lib/data-service";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { BadgeSnippet } from "@/components/trust-portal/badge-snippet";
import { useUserStatus } from "@/hooks/use-user-status";
import { useAuth } from "@/context/auth-context";

interface TrustPortalConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig?: TrustPortalConfig;
  projectId: string;
  onConfigSaved: (config: TrustPortalConfig) => void;
  projectTitle?: string;
  policiesExist?: boolean;
}

export function TrustPortalConfigDialog({
  open,
  onOpenChange,
  currentConfig,
  projectId,
  onConfigSaved,
  projectTitle,
}: TrustPortalConfigDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userStatus } = useUserStatus(user?.email);
  const [loading, setLoading] = useState(false);

  // Config state – visibility toggles removed (now driven by live register data)
  const [config, setConfig] = useState<TrustPortalConfig>({
    isPublished: false,
    organizationName: "",
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
    ...currentConfig,
  });

  const [publishConfirmation, setPublishConfirmation] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setConfig({
        isPublished: false,
        organizationName: projectTitle || "",
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
        ...currentConfig,
      });
      setPublishConfirmation(currentConfig?.isPublished || false);
    }
  }, [open, currentConfig, projectTitle]);

  const handleGenerateContent = (overrideTone?: TrustTonePreset) => {
    const tone = overrideTone || config.tonePreset;
    const orgName = projectTitle || "Unsere Organisation";

    let intro = "";
    let purpose = "";
    let resp = "";
    let contact = "";

    if (tone === "standard") {
      intro = `${orgName} nutzt Künstliche Intelligenz für definierte Zwecke. Die Verantwortung für Entscheidungen verbleibt stets bei Menschen. Dieses Portal schafft Transparenz über unsere Governance-Strukturen.`;
      purpose = `Wir setzen KI ein, um unsere Prozesse effizienter zu gestalten, nicht um menschliche Urteilskraft zu ersetzen. Wir verpflichten uns zu Transparenz und haben klare Aufsichtsmechanismen etabliert. Obwohl wir uns der Risiken bewusst sind, arbeiten wir kontinuierlich an deren Minimierung und der Sicherheit unserer Systeme.`;
      resp = `Für den Einsatz von KI wurden klare Rollen und Verantwortlichkeiten definiert. Alle beteiligten Personen erhalten regelmäßige Schulungen zu KI-Grundlagen und ethischen Aspekten.`;
      contact = `Wenn Sie Fragen oder Bedenken zu unserem Einsatz von KI haben, laden wir Sie ein, uns zu kontaktieren.`;
    } else if (tone === "human") {
      intro = `Bei ${orgName} steht der Mensch im Mittelpunkt. KI ist für uns ein Werkzeug, das menschliche Fähigkeiten erweitert, aber niemals ersetzt. Wir legen offen, wie wir diese Technologie verantwortungsvoll nutzen.`;
      purpose = `Unsere KI-Systeme dienen als Assistenten, die uns unterstützen, komplexe Aufgaben besser zu lösen. Wir glauben fest daran, dass Technologie ethischen Werten folgen muss. Deshalb prüfen wir jedes System sorgfältig auf seine Auswirkungen auf Menschen. Fehler sind möglich, aber unser Engagement für Verantwortung und Lernen ist unerschütterlich.`;
      resp = `Hinter jedem Algorithmus stehen Menschen, die Verantwortung tragen. Wir investieren in die Bildung unserer Teams, damit sie KI souverän und kritisch nutzen können.`;
      contact = `Ein offener Dialog ist uns wichtig. Ihre Perspektive hilft uns, besser zu werden. Bitte schreiben Sie uns.`;
    } else if (tone === "conservative") {
      intro = `${orgName} implementiert KI-basierte Systeme unter strikter Einhaltung interner Governance-Vorgaben. Dieses Portal dient der Dokumentation unserer Aufsichtsmaßnahmen.`;
      purpose = `Der Einsatz von KI erfolgt gemäß definierter Use-Cases zur Prozessoptimierung. Systementscheidungen unterliegen einer menschlichen Validierung gemäß unserem Risikomanagement-Rahmenwerk. Wir überwachen die Systemleistung kontinuierlich im Hinblick auf technische und regulatorische Anforderungen.`;
      resp = `Governance-Strukturen sind operationalisiert. Zugriffsberechtigungen und Verantwortlichkeiten sind dokumentiert. Schulungsmaßnahmen für relevantes Personal werden durchgeführt.`;
      contact = `Für formelle Anfragen bezüglich unserer KI-Governance wenden Sie sich bitte an die angegebene Kontaktadresse.`;
    }

    setConfig((prev) => ({
      ...prev,
      tonePreset: tone,
      introduction: intro,
      governanceStatement: purpose,
      responsibilityText: resp,
      contactText: contact,
      portalTitle: `AI Trust Portal - ${orgName}`,
    }));

    toast({
      title: "Inhalte generiert",
      description: `Texte für Tonfall "${tone}" wurden erstellt.`,
    });
  };

  const handleSave = async (shouldPublish: boolean = config.isPublished) => {
    setLoading(true);
    try {
      const newConfig = { ...config, isPublished: shouldPublish };
      if (shouldPublish) {
        newConfig.lastPublishedAt = new Date().toISOString();

        // Publish portal metadata – AI systems are now read live from
        // publicUseCases, so we pass an empty snapshot array and trust
        // score 0 (the public page computes its own live score).
        await publishTrustPortal(newConfig, 0, []);
        toast({
          title: "Portal veröffentlicht",
          description:
            "Die öffentliche Seite ist aktualisiert. KI-Systeme werden live aus dem Register geladen.",
        });
      } else {
        await saveProjectData({ trustPortal: newConfig });
        toast({
          title: "Gespeichert",
          description: "Konfiguration wurde gesichert.",
        });
      }

      onConfigSaved(newConfig);
      if (shouldPublish) {
        setShowPublishDialog(false);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save trust portal config:", error);
      const errorMsg = error?.code || error?.message || "Unbekannter Fehler";
      toast({
        variant: "destructive",
        title: "Fehler",
        description: `Speichern fehlgeschlagen: ${errorMsg}`,
      });
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
      <Dialog
        open={true}
        onOpenChange={(open) => !open && setShowPublishDialog(false)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Portal veröffentlichen</DialogTitle>
            <DialogDescription>
              Bestätigen Sie die Inhalte. KI-Systeme und KPIs werden live aus
              Ihrem Register geladen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900">
              <Info className="h-4 w-4 text-indigo-600" />
              <AlertTitle className="text-indigo-900 dark:text-indigo-100">
                Live-Daten
              </AlertTitle>
              <AlertDescription className="text-indigo-800 dark:text-indigo-200 text-sm">
                Im Gegensatz zu früheren Versionen zeigt das Portal jetzt
                Live-Daten aus Ihrem KI-Register an. Textinhalte (Governance-
                Erklärung, Kontaktdaten etc.) werden als Snapshot gespeichert.
              </AlertDescription>
            </Alert>
            <p className="text-xs text-muted-foreground">
              <strong>Hinweis:</strong> Sie können das Portal jederzeit
              aktualisieren, offline nehmen oder Inhalte bearbeiten.
            </p>
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="confirm"
                checked={publishConfirmation}
                onCheckedChange={(c) => setPublishConfirmation(!!c)}
              />
              <Label
                htmlFor="confirm"
                className="text-sm font-normal leading-tight cursor-pointer"
              >
                Ich habe die Inhalte geprüft und verstehe, dass diese öffentlich
                sichtbar werden.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPublishDialog(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={!publishConfirmation || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Jetzt veröffentlichen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trust/${projectId}`
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600" />
            AI Trust Portal konfigurieren
          </DialogTitle>
          <DialogDescription>
            Texte und Kontaktdaten für Ihr öffentliches Trust Portal bearbeiten.
            KI-Systeme und KPIs werden automatisch live aus Ihrem Register
            geladen.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Public Link & Embed (Visible only if published) */}
          {currentConfig?.isPublished && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-900 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Portal ist online
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-green-700"
                  onClick={() => window.open(publicUrl, "_blank")}
                >
                  Öffnen <Globe className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={publicUrl}
                  readOnly
                  className="bg-white h-8 text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => copyToClipboard(publicUrl)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="pt-4 border-t border-green-200 mt-2">
                <BadgeSnippet
                  projectId={projectId}
                  level={(userStatus?.examPassed && userStatus?.hasCertificate) ? "Basis" : "Ungeprüft"}
                />
              </div>
            </div>
          )}

          {/* Info: Live data notice */}
          <Alert className="bg-blue-50 border-blue-100">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">
              Live-Daten aus dem Register
            </AlertTitle>
            <AlertDescription className="text-blue-800 text-sm">
              KI-Systeme, KPIs und der Trust Score werden automatisch aus Ihren
              öffentlich sichtbaren Use Cases berechnet. Hier bearbeiten Sie nur
              die Texte und Kontaktdaten.
            </AlertDescription>
          </Alert>

          {/* 1. Tone & Content Generation */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">
                1. Tonalität & Inhalt generieren
              </Label>
            </div>
            <Alert className="bg-slate-50">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <AlertTitle>KI-Generator</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1">
                Wählen Sie einen Tonfall, um alle Textfelder automatisch
                vorzubefüllen. Manuelle Änderungen werden durch erneutes
                Generieren überschrieben.
              </AlertDescription>
            </Alert>

            <RadioGroup
              value={config.tonePreset}
              onValueChange={(val) =>
                handleGenerateContent(val as TrustTonePreset)
              }
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div
                className={`border rounded-md p-3 cursor-pointer hover:bg-slate-50 ${config.tonePreset === "standard"
                  ? "border-indigo-500 bg-indigo-50/50"
                  : ""
                  }`}
              >
                <RadioGroupItem
                  value="standard"
                  id="tone-standard"
                  className="sr-only"
                />
                <Label htmlFor="tone-standard" className="cursor-pointer">
                  <div className="font-semibold mb-1">Standard / Seriös</div>
                  <div className="text-xs text-muted-foreground">
                    Klar, neutral und verantwortungsbewusst.
                  </div>
                </Label>
              </div>
              <div
                className={`border rounded-md p-3 cursor-pointer hover:bg-slate-50 ${config.tonePreset === "human"
                  ? "border-indigo-500 bg-indigo-50/50"
                  : ""
                  }`}
              >
                <RadioGroupItem
                  value="human"
                  id="tone-human"
                  className="sr-only"
                />
                <Label htmlFor="tone-human" className="cursor-pointer">
                  <div className="font-semibold mb-1">Mensch-zentriert</div>
                  <div className="text-xs text-muted-foreground">
                    Betont menschliche Aufsicht und ethische Werte.
                  </div>
                </Label>
              </div>
              <div
                className={`border rounded-md p-3 cursor-pointer hover:bg-slate-50 ${config.tonePreset === "conservative"
                  ? "border-indigo-500 bg-indigo-50/50"
                  : ""
                  }`}
              >
                <RadioGroupItem
                  value="conservative"
                  id="tone-conservative"
                  className="sr-only"
                />
                <Label htmlFor="tone-conservative" className="cursor-pointer">
                  <div className="font-semibold mb-1">Konservativ</div>
                  <div className="text-xs text-muted-foreground">
                    Präzise und fokussiert auf Compliance-Strukturen.
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 2. Text Content Sections */}
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="content-sections"
          >
            <AccordionItem value="content-sections">
              <AccordionTrigger>2. Textinhalte bearbeiten</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="org-name">Name Ihrer Organisation</Label>
                  <Input
                    id="org-name"
                    placeholder="z.B. Musterfirma GmbH"
                    value={config.organizationName}
                    onChange={(e) =>
                      setConfig({ ...config, organizationName: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Wird prominent im Trust Portal angezeigt
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="portal-title">Seitentitel</Label>
                  <Input
                    id="portal-title"
                    value={config.portalTitle}
                    onChange={(e) =>
                      setConfig({ ...config, portalTitle: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="intro">Einleitung</Label>
                  <Textarea
                    id="intro"
                    className="h-20"
                    value={config.introduction}
                    onChange={(e) =>
                      setConfig({ ...config, introduction: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pledge">
                    Governance-Erklärung (&quot;The Pledge&quot;)
                  </Label>
                  <Textarea
                    id="pledge"
                    className="h-32"
                    value={config.governanceStatement}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        governanceStatement: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resp">
                    Verantwortlichkeit & Kompetenz
                  </Label>
                  <Textarea
                    id="resp"
                    className="h-24"
                    value={config.responsibilityText}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        responsibilityText: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-text">Kontakt-Einladung</Label>
                  <Textarea
                    id="contact-text"
                    className="h-20"
                    value={config.contactText}
                    onChange={(e) =>
                      setConfig({ ...config, contactText: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-email">
                    Öffentliche E-Mail Adresse
                  </Label>
                  <Input
                    id="contact-email"
                    value={config.contactEmail}
                    onChange={(e) =>
                      setConfig({ ...config, contactEmail: e.target.value })
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Red Lines Info */}
          <Accordion
            type="single"
            collapsible
            className="w-full border rounded-md px-4"
          >
            <AccordionItem value="red-lines" className="border-none">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3 text-slate-500">
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Was bleibt immer privat? (Red-Lines)
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pb-4 text-sm text-slate-600">
                  <p>
                    Folgende Details werden <strong>niemals</strong> im Portal
                    veröffentlicht:
                  </p>
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
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {config.isPublished ? (
              <>
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
                    saveProjectData({
                      trustPortal: { ...config, isPublished: true },
                    });
                    toast({
                      title: "Entwurf gespeichert",
                      description:
                        "Änderungen sind lokal gesichert. Klicken Sie 'Aktualisieren' um sie zu veröffentlichen.",
                    });
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
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Globe className="mr-2 h-4 w-4" />
                  Aktualisieren & Veröffentlichen
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    saveProjectData({ trustPortal: config });
                    toast({
                      title: "Entwurf gespeichert",
                      description: "Konfiguration wurde lokal gesichert.",
                    });
                    onOpenChange(false);
                  }}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Nur Speichern (Entwurf)
                </Button>
                <Button onClick={handlePublishClick} disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
