import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
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
import { resolveGovernanceCopyLocale } from "@/lib/i18n/governance-copy";

interface TrustPortalConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig?: TrustPortalConfig;
  projectId: string;
  onConfigSaved: (config: TrustPortalConfig) => void;
  projectTitle?: string;
  policiesExist?: boolean;
}

function getTrustPortalConfigCopy(locale?: string) {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";

  if (!isGerman) {
    return {
      fallbackOrgName: "Our organisation",
      generatedToastTitle: "Content generated",
      generatedToastDescription: (tone: string) =>
        `Text for tone "${tone}" was generated.`,
      publishedToastTitle: "Portal published",
      publishedToastDescription:
        "The public page was updated. AI systems are loaded live from the register.",
      savedToastTitle: "Saved",
      savedToastDescription: "Configuration was saved.",
      errorTitle: "Error",
      unknownError: "Unknown error",
      saveFailed: "Saving failed",
      copiedTitle: "Copied",
      copiedDescription: "Copied to clipboard.",
      publishTitle: "Publish portal",
      publishDescription:
        "Confirm the content. AI systems and KPIs are loaded live from your register.",
      liveDataTitle: "Live data",
      liveDataPublishDescription:
        "Unlike earlier versions, the portal now shows live data from your AI register. Text content such as the governance statement and contact details is stored as a snapshot.",
      publishNote:
        "Note: You can update the portal, take it offline or edit content at any time.",
      publishConfirm:
        "I have reviewed the content and understand that it will become publicly visible.",
      cancel: "Cancel",
      publishNow: "Publish now",
      dialogTitle: "Configure AI Trust Portal",
      dialogDescription:
        "Edit text and contact details for your public Trust Portal. AI systems and KPIs are loaded automatically from your register.",
      portalOnline: "Portal is online",
      open: "Open",
      liveDataRegisterTitle: "Live data from the register",
      liveDataRegisterDescription:
        "AI systems, KPIs and the Trust Score are calculated automatically from your publicly visible use cases. Here you only edit text and contact details.",
      toneTitle: "1. Generate tone and content",
      generatorTitle: "AI generator",
      generatorDescription:
        "Choose a tone to pre-fill all text fields automatically. Manual changes will be overwritten when generating again.",
      toneStandardTitle: "Standard / formal",
      toneStandardDescription: "Clear, neutral and responsible.",
      toneHumanTitle: "Human-centred",
      toneHumanDescription:
        "Emphasises human oversight and ethical values.",
      toneConservativeTitle: "Conservative",
      toneConservativeDescription:
        "Precise and focused on compliance structures.",
      editContent: "2. Edit text content",
      organisationName: "Organisation name",
      organisationPlaceholder: "e.g. Example Ltd",
      organisationHint: "Shown prominently in the Trust Portal",
      pageTitle: "Page title",
      introduction: "Introduction",
      governanceStatement: 'Governance statement ("The Pledge")',
      responsibility: "Responsibility and competence",
      contactInvitation: "Contact invitation",
      publicEmail: "Public email address",
      redLinesTitle: "What always stays private? (Red lines)",
      redLinesIntro: "The following details are never published in the portal:",
      redLines: [
        "Internal weaknesses or open risks",
        "Names of individual employees",
        "Technical system details (prompts, parameters)",
        "Legal guarantees",
      ],
      close: "Close",
      takeOffline: "Take offline",
      draftSavedTitle: "Draft saved",
      draftSavedDescription:
        "Changes are saved locally. Click 'Update' to publish them.",
      saveDraft: "Save draft",
      updateAndPublish: "Update and publish",
      saveOnlyDraft: "Save only (draft)",
      publishPortal: "Publish portal",
    } as const;
  }

  return {
    fallbackOrgName: "Unsere Organisation",
    generatedToastTitle: "Inhalte generiert",
    generatedToastDescription: (tone: string) =>
      `Texte für Tonfall "${tone}" wurden erstellt.`,
    publishedToastTitle: "Portal veröffentlicht",
    publishedToastDescription:
      "Die öffentliche Seite ist aktualisiert. KI-Systeme werden live aus dem Register geladen.",
    savedToastTitle: "Gespeichert",
    savedToastDescription: "Konfiguration wurde gesichert.",
    errorTitle: "Fehler",
    unknownError: "Unbekannter Fehler",
    saveFailed: "Speichern fehlgeschlagen",
    copiedTitle: "Kopiert",
    copiedDescription: "In die Zwischenablage kopiert.",
    publishTitle: "Portal veröffentlichen",
    publishDescription:
      "Bestätigen Sie die Inhalte. KI-Systeme und KPIs werden live aus Ihrem Register geladen.",
    liveDataTitle: "Live-Daten",
    liveDataPublishDescription:
      "Im Gegensatz zu früheren Versionen zeigt das Portal jetzt Live-Daten aus Ihrem KI-Register an. Textinhalte (Governance-Erklärung, Kontaktdaten etc.) werden als Snapshot gespeichert.",
    publishNote:
      "Hinweis: Sie können das Portal jederzeit aktualisieren, offline nehmen oder Inhalte bearbeiten.",
    publishConfirm:
      "Ich habe die Inhalte geprüft und verstehe, dass diese öffentlich sichtbar werden.",
    cancel: "Abbrechen",
    publishNow: "Jetzt veröffentlichen",
    dialogTitle: "AI Trust Portal konfigurieren",
    dialogDescription:
      "Texte und Kontaktdaten für Ihr öffentliches Trust Portal bearbeiten. KI-Systeme und KPIs werden automatisch live aus Ihrem Register geladen.",
    portalOnline: "Portal ist online",
    open: "Öffnen",
    liveDataRegisterTitle: "Live-Daten aus dem Register",
    liveDataRegisterDescription:
      "KI-Systeme, KPIs und der Trust Score werden automatisch aus Ihren öffentlich sichtbaren Use Cases berechnet. Hier bearbeiten Sie nur die Texte und Kontaktdaten.",
    toneTitle: "1. Tonalität & Inhalt generieren",
    generatorTitle: "KI-Generator",
    generatorDescription:
      "Wählen Sie einen Tonfall, um alle Textfelder automatisch vorzubefüllen. Manuelle Änderungen werden durch erneutes Generieren überschrieben.",
    toneStandardTitle: "Standard / Seriös",
    toneStandardDescription: "Klar, neutral und verantwortungsbewusst.",
    toneHumanTitle: "Mensch-zentriert",
    toneHumanDescription:
      "Betont menschliche Aufsicht und ethische Werte.",
    toneConservativeTitle: "Konservativ",
    toneConservativeDescription:
      "Präzise und fokussiert auf Compliance-Strukturen.",
    editContent: "2. Textinhalte bearbeiten",
    organisationName: "Name Ihrer Organisation",
    organisationPlaceholder: "z.B. Musterfirma GmbH",
    organisationHint: "Wird prominent im Trust Portal angezeigt",
    pageTitle: "Seitentitel",
    introduction: "Einleitung",
    governanceStatement: 'Governance-Erklärung ("The Pledge")',
    responsibility: "Verantwortlichkeit & Kompetenz",
    contactInvitation: "Kontakt-Einladung",
    publicEmail: "Öffentliche E-Mail Adresse",
    redLinesTitle: "Was bleibt immer privat? (Red-Lines)",
    redLinesIntro:
      "Folgende Details werden niemals im Portal veröffentlicht:",
    redLines: [
      "Interne Schwachstellen oder offene Risiken",
      "Namen einzelner Mitarbeitender",
      "Technische Systemdetails (Prompts, Parameter)",
      "Rechtliche Garantien",
    ],
    close: "Schließen",
    takeOffline: "Offline nehmen",
    draftSavedTitle: "Entwurf gespeichert",
    draftSavedDescription:
      "Änderungen sind lokal gesichert. Klicken Sie 'Aktualisieren' um sie zu veröffentlichen.",
    saveDraft: "Entwurf speichern",
    updateAndPublish: "Aktualisieren & Veröffentlichen",
    saveOnlyDraft: "Nur Speichern (Entwurf)",
    publishPortal: "Portal veröffentlichen",
  } as const;
}

function buildGeneratedTrustContent(
  locale: string | undefined,
  tone: TrustTonePreset,
  orgName: string
) {
  const isGerman = resolveGovernanceCopyLocale(locale) === "de";

  if (!isGerman) {
    if (tone === "human") {
      return {
        intro: `At ${orgName}, people remain at the centre. AI is a tool that extends human capability, but never replaces it. We explain how we use this technology responsibly.`,
        purpose: `Our AI systems act as assistants that help us solve complex tasks more effectively. We believe technology must follow ethical values. That is why we review each system carefully for its impact on people. Errors are possible, but our commitment to responsibility and learning remains firm.`,
        responsibility: `Behind every algorithm are people who carry responsibility. We invest in our teams so they can use AI confidently and critically.`,
        contact: `Open dialogue matters to us. Your perspective helps us improve. Please contact us.`,
      };
    }

    if (tone === "conservative") {
      return {
        intro: `${orgName} implements AI-based systems under strict internal governance requirements. This portal documents our oversight measures.`,
        purpose: `AI is used for defined use cases to optimise processes. System outputs remain subject to human validation in line with our risk management framework. We continuously monitor system performance against technical and regulatory requirements.`,
        responsibility: `Governance structures are operationalised. Access permissions and responsibilities are documented. Training measures for relevant personnel are conducted.`,
        contact: `For formal enquiries about our AI governance, please use the contact address provided.`,
      };
    }

    return {
      intro: `${orgName} uses artificial intelligence for defined purposes. Responsibility for decisions always remains with people. This portal creates transparency around our governance structures.`,
      purpose: `We use AI to make processes more efficient, not to replace human judgement. We commit to transparency and have established clear oversight mechanisms. While we are aware of the risks, we continuously work to minimise them and keep our systems safe.`,
      responsibility: `Clear roles and responsibilities have been defined for the use of AI. Everyone involved receives regular training on AI fundamentals and ethical aspects.`,
      contact: `If you have questions or concerns about our use of AI, we invite you to contact us.`,
    };
  }

  if (tone === "human") {
    return {
      intro: `Bei ${orgName} steht der Mensch im Mittelpunkt. KI ist für uns ein Werkzeug, das menschliche Fähigkeiten erweitert, aber niemals ersetzt. Wir legen offen, wie wir diese Technologie verantwortungsvoll nutzen.`,
      purpose: `Unsere KI-Systeme dienen als Assistenten, die uns unterstützen, komplexe Aufgaben besser zu lösen. Wir glauben fest daran, dass Technologie ethischen Werten folgen muss. Deshalb prüfen wir jedes System sorgfältig auf seine Auswirkungen auf Menschen. Fehler sind möglich, aber unser Engagement für Verantwortung und Lernen ist unerschütterlich.`,
      responsibility: `Hinter jedem Algorithmus stehen Menschen, die Verantwortung tragen. Wir investieren in die Bildung unserer Teams, damit sie KI souverän und kritisch nutzen können.`,
      contact: `Ein offener Dialog ist uns wichtig. Ihre Perspektive hilft uns, besser zu werden. Bitte schreiben Sie uns.`,
    };
  }

  if (tone === "conservative") {
    return {
      intro: `${orgName} implementiert KI-basierte Systeme unter strikter Einhaltung interner Governance-Vorgaben. Dieses Portal dient der Dokumentation unserer Aufsichtsmaßnahmen.`,
      purpose: `Der Einsatz von KI erfolgt gemäß definierter Use-Cases zur Prozessoptimierung. Systementscheidungen unterliegen einer menschlichen Validierung gemäß unserem Risikomanagement-Rahmenwerk. Wir überwachen die Systemleistung kontinuierlich im Hinblick auf technische und regulatorische Anforderungen.`,
      responsibility: `Governance-Strukturen sind operationalisiert. Zugriffsberechtigungen und Verantwortlichkeiten sind dokumentiert. Schulungsmaßnahmen für relevantes Personal werden durchgeführt.`,
      contact: `Für formelle Anfragen bezüglich unserer KI-Governance wenden Sie sich bitte an die angegebene Kontaktadresse.`,
    };
  }

  return {
    intro: `${orgName} nutzt Künstliche Intelligenz für definierte Zwecke. Die Verantwortung für Entscheidungen verbleibt stets bei Menschen. Dieses Portal schafft Transparenz über unsere Governance-Strukturen.`,
    purpose: `Wir setzen KI ein, um unsere Prozesse effizienter zu gestalten, nicht um menschliche Urteilskraft zu ersetzen. Wir verpflichten uns zu Transparenz und haben klare Aufsichtsmechanismen etabliert. Obwohl wir uns der Risiken bewusst sind, arbeiten wir kontinuierlich an deren Minimierung und der Sicherheit unserer Systeme.`,
    responsibility: `Für den Einsatz von KI wurden klare Rollen und Verantwortlichkeiten definiert. Alle beteiligten Personen erhalten regelmäßige Schulungen zu KI-Grundlagen und ethischen Aspekten.`,
    contact: `Wenn Sie Fragen oder Bedenken zu unserem Einsatz von KI haben, laden wir Sie ein, uns zu kontaktieren.`,
  };
}

export function TrustPortalConfigDialog({
  open,
  onOpenChange,
  currentConfig,
  projectId,
  onConfigSaved,
  projectTitle,
}: TrustPortalConfigDialogProps) {
  const locale = useLocale();
  const copy = getTrustPortalConfigCopy(locale);
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
    const orgName = projectTitle || copy.fallbackOrgName;
    const generated = buildGeneratedTrustContent(locale, tone, orgName);

    setConfig((prev) => ({
      ...prev,
      tonePreset: tone,
      introduction: generated.intro,
      governanceStatement: generated.purpose,
      responsibilityText: generated.responsibility,
      contactText: generated.contact,
      portalTitle: `AI Trust Portal - ${orgName}`,
    }));

    toast({
      title: copy.generatedToastTitle,
      description: copy.generatedToastDescription(tone),
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
          title: copy.publishedToastTitle,
          description: copy.publishedToastDescription,
        });
      } else {
        await saveProjectData({ trustPortal: newConfig });
        toast({
          title: copy.savedToastTitle,
          description: copy.savedToastDescription,
        });
      }

      onConfigSaved(newConfig);
      if (shouldPublish) {
        setShowPublishDialog(false);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save trust portal config:", error);
      const errorMsg = error?.code || error?.message || copy.unknownError;
      toast({
        variant: "destructive",
        title: copy.errorTitle,
        description: `${copy.saveFailed}: ${errorMsg}`,
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
    toast({ title: copy.copiedTitle, description: copy.copiedDescription });
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
            <DialogTitle>{copy.publishTitle}</DialogTitle>
            <DialogDescription>
              {copy.publishDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="bg-gray-50 border-gray-100 dark:bg-gray-950/20 dark:border-gray-900">
              <Info className="h-4 w-4 text-gray-600" />
              <AlertTitle className="text-gray-900 dark:text-gray-100">
                {copy.liveDataTitle}
              </AlertTitle>
              <AlertDescription className="text-gray-800 dark:text-gray-200 text-sm">
                {copy.liveDataPublishDescription}
              </AlertDescription>
            </Alert>
            <p className="text-xs text-muted-foreground">
              {copy.publishNote}
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
                {copy.publishConfirm}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPublishDialog(false)}
            >
              {copy.cancel}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={!publishConfirmation || loading}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {copy.publishNow}
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
            <Globe className="h-5 w-5 text-gray-600" />
            {copy.dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {copy.dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Public Link & Embed (Visible only if published) */}
          {currentConfig?.isPublished && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {copy.portalOnline}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-gray-700"
                  onClick={() => window.open(publicUrl, "_blank")}
                >
                  {copy.open} <Globe className="ml-1 h-3 w-3" />
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
              <div className="pt-4 border-t border-gray-200 mt-2">
                <BadgeSnippet
                  projectId={projectId}
                  level={(userStatus?.examPassed && userStatus?.hasCertificate) ? "Basis" : "Ungeprüft"}
                  locale={locale}
                />
              </div>
            </div>
          )}

          {/* Info: Live data notice */}
          <Alert className="bg-gray-50 border-gray-100">
            <Info className="h-4 w-4 text-gray-600" />
            <AlertTitle className="text-gray-900">
              {copy.liveDataRegisterTitle}
            </AlertTitle>
            <AlertDescription className="text-gray-800 text-sm">
              {copy.liveDataRegisterDescription}
            </AlertDescription>
          </Alert>

          {/* 1. Tone & Content Generation */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">
                {copy.toneTitle}
              </Label>
            </div>
            <Alert className="bg-slate-50">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <AlertTitle>{copy.generatorTitle}</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1">
                {copy.generatorDescription}
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
                  ? "border-gray-500 bg-gray-50/50"
                  : ""
                  }`}
              >
                <RadioGroupItem
                  value="standard"
                  id="tone-standard"
                  className="sr-only"
                />
                <Label htmlFor="tone-standard" className="cursor-pointer">
                  <div className="font-semibold mb-1">{copy.toneStandardTitle}</div>
                  <div className="text-xs text-muted-foreground">
                    {copy.toneStandardDescription}
                  </div>
                </Label>
              </div>
              <div
                className={`border rounded-md p-3 cursor-pointer hover:bg-slate-50 ${config.tonePreset === "human"
                  ? "border-gray-500 bg-gray-50/50"
                  : ""
                  }`}
              >
                <RadioGroupItem
                  value="human"
                  id="tone-human"
                  className="sr-only"
                />
                <Label htmlFor="tone-human" className="cursor-pointer">
                  <div className="font-semibold mb-1">{copy.toneHumanTitle}</div>
                  <div className="text-xs text-muted-foreground">
                    {copy.toneHumanDescription}
                  </div>
                </Label>
              </div>
              <div
                className={`border rounded-md p-3 cursor-pointer hover:bg-slate-50 ${config.tonePreset === "conservative"
                  ? "border-gray-500 bg-gray-50/50"
                  : ""
                  }`}
              >
                <RadioGroupItem
                  value="conservative"
                  id="tone-conservative"
                  className="sr-only"
                />
                <Label htmlFor="tone-conservative" className="cursor-pointer">
                  <div className="font-semibold mb-1">{copy.toneConservativeTitle}</div>
                  <div className="text-xs text-muted-foreground">
                    {copy.toneConservativeDescription}
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
              <AccordionTrigger>{copy.editContent}</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="org-name">{copy.organisationName}</Label>
                  <Input
                    id="org-name"
                    placeholder={copy.organisationPlaceholder}
                    value={config.organizationName}
                    onChange={(e) =>
                      setConfig({ ...config, organizationName: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {copy.organisationHint}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="portal-title">{copy.pageTitle}</Label>
                  <Input
                    id="portal-title"
                    value={config.portalTitle}
                    onChange={(e) =>
                      setConfig({ ...config, portalTitle: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="intro">{copy.introduction}</Label>
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
                    {copy.governanceStatement}
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
                    {copy.responsibility}
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
                  <Label htmlFor="contact-text">{copy.contactInvitation}</Label>
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
                    {copy.publicEmail}
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
                  {copy.redLinesTitle}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pb-4 text-sm text-slate-600">
                  <p>
                    {copy.redLinesIntro}
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {copy.redLines.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 border-t pt-4">
          <div className="flex-1 flex items-center justify-between sm:justify-start gap-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {copy.close}
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
                  {copy.takeOffline}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    saveProjectData({
                      trustPortal: { ...config, isPublished: true },
                    });
                    toast({
                      title: copy.draftSavedTitle,
                      description: copy.draftSavedDescription,
                    });
                    onOpenChange(false);
                  }}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {copy.saveDraft}
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={loading}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Globe className="mr-2 h-4 w-4" />
                  {copy.updateAndPublish}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    saveProjectData({ trustPortal: config });
                    toast({
                      title: copy.draftSavedTitle,
                      description: copy.savedToastDescription,
                    });
                    onOpenChange(false);
                  }}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {copy.saveOnlyDraft}
                </Button>
                <Button onClick={handlePublishClick} disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Globe className="mr-2 h-4 w-4" />
                  {copy.publishPortal}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
