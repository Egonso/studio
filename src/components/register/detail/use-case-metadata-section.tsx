import { useState, useCallback, useEffect } from "react";
import { Check, Loader2, Sparkles, Search, ExternalLink, AlertCircle, FileBadge, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UseCaseAssessmentWizard } from "./use-case-assessment-wizard";
import { ToolkitUpsellButton } from "../toolkit-upsell-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import type {
  UseCaseCard,
  CaptureUsageContext,
  DataCategory,
  DecisionImpact,
  Register,
} from "@/lib/register-first/types";
import {
  createAiToolsRegistryService,
  riskLevelLabels,
  riskLevelColors,
} from "@/lib/register-first";
import { registerService } from "@/lib/register-first/register-service";

const aiRegistry = createAiToolsRegistryService();

const usageContextLabels: Record<CaptureUsageContext, string> = {
  INTERNAL_ONLY: "Nur intern",
  CUSTOMER_FACING: "Fuer Kund:innen",
  EMPLOYEE_FACING: "Fuer Mitarbeitende",
  EXTERNAL_PUBLIC: "Extern / oeffentlich",
};

const dataCategoryLabels: Record<DataCategory, string> = {
  NONE: "Keine besonderen Daten",
  INTERNAL: "Interne Daten",
  PERSONAL: "Personenbezogene Daten",
  SENSITIVE: "Sensible Daten",
};

const decisionImpactLabels: Record<DecisionImpact, string> = {
  YES: "Ja",
  NO: "Nein",
  UNSURE: "Unsicher",
};

interface UseCaseMetadataSectionProps {
  card: UseCaseCard;
  isEditing: boolean;
  onSave: (updates: Partial<UseCaseCard>) => Promise<void>;
}

export function UseCaseMetadataSection({
  card,
  isEditing,
  onSave,
}: UseCaseMetadataSectionProps) {
  const router = useRouter();
  const [editDraft, setEditDraft] = useState({
    purpose: card.purpose,
    responsibleParty: card.responsibility.responsibleParty ?? "",
    organisation: card.organisation ?? "",

    // Sprint 18: ISO Fields
    iso_reviewCycle: card.governanceAssessment?.flex?.iso?.reviewCycle ?? "unknown",
    iso_oversightModel: card.governanceAssessment?.flex?.iso?.oversightModel ?? "unknown",
    iso_documentationLevel: card.governanceAssessment?.flex?.iso?.documentationLevel ?? "unknown",
    iso_lifecycleStatus: card.governanceAssessment?.flex?.iso?.lifecycleStatus ?? "unknown",

    // Sprint 18: Portfolio Fields
    portfolio_valueScore: card.governanceAssessment?.flex?.portfolio?.valueScore ?? null,
    portfolio_valueRationale: card.governanceAssessment?.flex?.portfolio?.valueRationale ?? "",
    portfolio_riskScore: card.governanceAssessment?.flex?.portfolio?.riskScore ?? null,
    portfolio_riskRationale: card.governanceAssessment?.flex?.portfolio?.riskRationale ?? "",
    portfolio_strategyTag: card.governanceAssessment?.flex?.portfolio?.strategyTag ?? null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
  const [register, setRegister] = useState<Register | null>(null);
  const { toast } = useToast();

  const toolEntry = card.toolId ? aiRegistry.getById(card.toolId) : null;
  const toolDisplayName =
    card.toolId === "other"
      ? card.toolFreeText ?? "Anderes Tool"
      : toolEntry?.productName ?? card.toolId ?? "Kein Tool";

  useEffect(() => {
    // Fetch active register specifically for orgSettings (ISO Macro Flags)
    async function loadRegister() {
      try {
        const regs = await registerService.listRegisters();
        if (regs && regs.length > 0) {
          // Determine active the simplest way: the first one
          setRegister(regs[0]);
        }
      } catch (e) {
        console.error("Failed to load register for orgSettings", e);
      }
    }
    loadRegister();
  }, []);

  const handleInvite = () => {
    const orgName = register?.organisationName || "unserer Organisation";
    const toolNameStr = toolDisplayName;
    const subject = encodeURIComponent(`Einladung: Review / Freigabe für KI-System "${toolNameStr}"`);
    const link = `https://fortbildung.eukigesetz.com/my-register/${card.useCaseId}`;
    const body = encodeURIComponent(`Hallo,\n\nbitte überprüfe als Verantwortliche:r den Use-Case "${toolNameStr}" in unserem EUKI AI Governance Register für ${orgName}.\n\nKlicke hier, um dem Register beizutreten und den Use-Case zu verwalten:\n${link}\n\nViele Grüße`);

    const emailMatch = card.responsibility.responsibleParty?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    const to = emailMatch ? emailMatch[0] : "";

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        purpose: editDraft.purpose,
        responsibility: {
          ...card.responsibility,
          responsibleParty: editDraft.responsibleParty || null,
        },
        organisation: editDraft.organisation || null,
        governanceAssessment: {
          ...card.governanceAssessment,
          core: card.governanceAssessment?.core || {},
          flex: {
            ...card.governanceAssessment?.flex,
            iso: {
              ...card.governanceAssessment?.flex?.iso,
              reviewCycle: editDraft.iso_reviewCycle as any,
              oversightModel: editDraft.iso_oversightModel as any,
              documentationLevel: editDraft.iso_documentationLevel as any,
              lifecycleStatus: editDraft.iso_lifecycleStatus as any,
            },
            portfolio: {
              ...card.governanceAssessment?.flex?.portfolio,
              valueScore: editDraft.portfolio_valueScore,
              valueRationale: editDraft.portfolio_valueRationale || null,
              riskScore: editDraft.portfolio_riskScore,
              riskRationale: editDraft.portfolio_riskRationale || null,
              strategyTag: editDraft.portfolio_strategyTag as any,
            }
          }
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const runComplianceCheck = async () => {
    setIsCheckingCompliance(true);
    try {
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const auth = await getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) throw new Error("Nicht eingeloggt");

      const { getActiveRegisterId } = await import("@/lib/register-first/register-settings-client");
      const activeRegId = getActiveRegisterId();

      const response = await fetch('/api/tools/public-info-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toolName: toolDisplayName,
          toolVendor: toolEntry?.vendor || "Unknown / Generic",
          force: true
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Check failed');

      if (!data.result) throw new Error("Keine Ergebnisse vom Server empfangen.");

      await onSave({ publicInfo: data.result });

      toast({
        title: "Smart Hint bereit",
        description: `Compliance-Daten für ${toolDisplayName} gespeichert.`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: e.message || "Failed to fetch smart hint."
      });
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  const orgSettings = register?.orgSettings;
  const macroFlags = {
    aiPolicyExists: !!orgSettings?.aiPolicy?.url,
    incidentProcessExists: !!orgSettings?.incidentProcess?.url,
    raciExists: !!orgSettings?.rolesFramework?.docUrl || orgSettings?.rolesFramework?.booleanDefined === true,
    reviewStandardDefined: !!orgSettings?.reviewStandard
  };

  const hasMacroGaps = !macroFlags.aiPolicyExists || !macroFlags.incidentProcessExists || !macroFlags.raciExists;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <CardTitle className="text-base">Use Case Konfiguration</CardTitle>
        {!isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/20" onClick={() => router.push(`/pass/${card.useCaseId}`)}>
              <FileBadge className="w-4 h-4 mr-2" />
              Use-Case Pass
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsWizardOpen(true)}>
              EUKI Assessment {card.governanceAssessment?.core ? "wiederholen" : "starten"}
            </Button>
          </div>
        )}
      </CardHeader>

      <Tabs defaultValue="überblick" className="w-full">
        <div className="px-6 pt-4">
          <TabsList className="w-full h-12 bg-secondary/20 p-1">
            <TabsTrigger value="überblick" className="w-full text-sm">Überblick & Core</TabsTrigger>
            <TabsTrigger value="iso" className="w-full text-sm">
              ISO Lifecycle
              {(!card.governanceAssessment?.flex?.iso || card.governanceAssessment.flex.iso.reviewCycle === 'unknown') && (
                <div className="ml-2 w-2 h-2 rounded-full bg-red-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="w-full text-sm">
              Portfolio
              {(card.governanceAssessment?.flex?.portfolio?.valueScore === null || card.governanceAssessment?.flex?.portfolio?.riskScore === null) && (
                <div className="ml-2 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-6">

          {/* TAB: UEBERBLICK & CORE */}
          <TabsContent value="überblick" className="space-y-6 m-0 border-0 p-0 focus-visible:ring-0">
            {/* Smart Hint (Perplexity) */}
            {!isEditing && (
              <div className="rounded-md border border-blue-100 p-3 bg-blue-50/50 space-y-2 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-500" /> Smart Hint (Perplexity)
                  </h4>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600 hover:text-blue-800" onClick={runComplianceCheck} disabled={isCheckingCompliance}>
                    {isCheckingCompliance ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Search className="w-3 h-3 mr-1" />}
                    {card.publicInfo ? "Aktualisieren" : "Prüfen"}
                  </Button>
                </div>
                {card.publicInfo ? (
                  <div className="text-sm">
                    <div className="flex gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className={card.publicInfo.flags.gdprClaim === 'yes' ? 'bg-green-50 text-green-700 border-green-200' : 'text-muted-foreground border-slate-200'}>
                        DSGVO {card.publicInfo.flags.gdprClaim === 'yes' ? '✅' : '❓'}
                      </Badge>
                      <Badge variant="outline" className={card.publicInfo.flags.aiActClaim === 'yes' ? 'bg-green-50 text-green-700 border-green-200' : 'text-muted-foreground border-slate-200'}>
                        AI Act {card.publicInfo.flags.aiActClaim === 'yes' ? '✅' : '❓'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{card.publicInfo.summary}</p>
                    {card.publicInfo.sources && card.publicInfo.sources.length > 0 && (
                      <div className="flex gap-3 mt-2">
                        {card.publicInfo.sources.slice(0, 2).map((s, i) => (
                          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Quelle {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Lassen Sie die KI nach öffentlich verfügbaren Compliance-Informationen (z.B. AI Act Statements, Privacy Policies) für dieses Tool suchen.</p>
                )}
              </div>
            )}

            {/* Purpose */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-medium text-muted-foreground">Zweck</Label>
              {isEditing ? (
                <Textarea
                  value={editDraft.purpose}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, purpose: e.target.value }))
                  }
                  rows={3}
                />
              ) : (
                <p className="text-sm">{card.purpose}</p>
              )}
            </div>

            {/* Tool */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">KI-Tool</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{toolDisplayName}</span>
                {toolEntry && (
                  <>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-normal ${riskLevelColors[toolEntry.riskLevel]}`}
                    >
                      {riskLevelLabels[toolEntry.riskLevel]}
                    </Badge>
                    {toolEntry.gdprCompliant && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-[10px] font-normal text-blue-700"
                      >
                        DSGVO
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Usage Contexts */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Verwendungskontext</Label>
              <div className="flex flex-wrap gap-1.5">
                {card.usageContexts.map((ctx) => (
                  <Badge key={ctx} variant="outline" className="text-[10px] font-normal">
                    {usageContextLabels[ctx]}
                  </Badge>
                ))}
                {card.usageContexts.length === 0 && (
                  <span className="text-xs text-muted-foreground">Nicht angegeben</span>
                )}
              </div>
            </div>

            {/* Decision Impact */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Beeinflusst Entscheidungen
              </Label>
              <span className="text-sm">{decisionImpactLabels[card.decisionImpact]}</span>
            </div>

            {/* Data Category */}
            {card.dataCategory && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Datenkategorie
                </Label>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {dataCategoryLabels[card.dataCategory] ?? card.dataCategory}
                </Badge>
              </div>
            )}
          </TabsContent>

          {/* TAB: ISO LIFECYCLE */}
          <TabsContent value="iso" className="space-y-6 m-0 border-0 p-0 focus-visible:ring-0">
            <div className="space-y-4">
              {hasMacroGaps && (
                <Alert className="bg-muted border-border/50 text-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-semibold">Organisationsebene unvollständig</AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground mt-1 flex flex-col gap-2">
                    <p>Macro-Governance Bestimmungen (AI Policy, Incident Process, RACI) sollten zentral in den Einstellungen der Organisation gepflegt werden. Sie wirken sich automatisch auf alle Use Cases aus.</p>
                    <Button variant="outline" size="sm" className="w-fit" onClick={() => router.push('/settings/governance')}>
                      Zu Organisationseinstellungen
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!isEditing && (!card.governanceAssessment?.flex?.iso || card.governanceAssessment.flex.iso.reviewCycle === 'unknown') && (
                <div className="rounded-md border p-6 flex flex-col items-center justify-center text-center bg-secondary/20">
                  <p className="text-sm font-medium mb-1">ISO Lifecycle noch nicht bewertet</p>
                  <p className="text-xs text-muted-foreground mb-4">Pflegen Sie die Verantwortlichkeiten und Überprüfungszyklen für dieses spezielle System ein.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                {/* Responsibility (Canonical Sync) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Verantwortlich <span className="text-red-500">*</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editDraft.responsibleParty}
                      onChange={(e) =>
                        setEditDraft((prev) => ({ ...prev, responsibleParty: e.target.value }))
                      }
                      placeholder="z. B. Max Mustermann"
                    />
                  ) : (
                    <div className="flex items-center justify-between pb-2 border-b">
                      <p className="text-sm text-muted-foreground truncate mr-2">
                        {card.responsibility.isCurrentlyResponsible
                          ? "Erfasser:in (selbst)"
                          : card.responsibility.responsibleParty || "Nicht zugewiesen"}
                      </p>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:bg-primary/10" onClick={handleInvite}>
                        <Mail className="w-3 h-3 mr-1" />
                        Einladen
                      </Button>
                    </div>
                  )}
                </div>

                {/* Organisation (Canonical Sync) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Organisationseinheit
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editDraft.organisation}
                      onChange={(e) =>
                        setEditDraft((prev) => ({ ...prev, organisation: e.target.value }))
                      }
                      placeholder="z. B. Marketing"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground pb-2 border-b">
                      {card.organisation || "Nicht angegeben"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Review Zyklus <span className="text-red-500">*</span></Label>
                  {isEditing ? (
                    <Select value={editDraft.iso_reviewCycle} onValueChange={(val) => setEditDraft(p => ({ ...p, iso_reviewCycle: val as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unbekannt</SelectItem>
                        <SelectItem value="monthly">Monatlich</SelectItem>
                        <SelectItem value="quarterly">Quartalsweise</SelectItem>
                        <SelectItem value="semiannual">Halbjährlich</SelectItem>
                        <SelectItem value="annual">Jährlich</SelectItem>
                        <SelectItem value="ad_hoc">Ad-hoc</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground pb-2 border-b">{editDraft.iso_reviewCycle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Aufsichtsmodell <span className="text-red-500">*</span></Label>
                  {isEditing ? (
                    <Select value={editDraft.iso_oversightModel} onValueChange={(val) => setEditDraft(p => ({ ...p, iso_oversightModel: val as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unbekannt</SelectItem>
                        <SelectItem value="HITL">Human-in-the-Loop (HITL)</SelectItem>
                        <SelectItem value="HOTL">Human-on-the-Loop (HOTL)</SelectItem>
                        <SelectItem value="HUMAN_REVIEW">Manuelles Review</SelectItem>
                        <SelectItem value="NO_HUMAN">Vollautomatisiert</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground pb-2 border-b">{editDraft.iso_oversightModel}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dokumentations-Level <span className="text-red-500">*</span></Label>
                  {isEditing ? (
                    <Select value={editDraft.iso_documentationLevel} onValueChange={(val) => setEditDraft(p => ({ ...p, iso_documentationLevel: val as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unbekannt</SelectItem>
                        <SelectItem value="minimal">Minimal (Nur Record)</SelectItem>
                        <SelectItem value="standard">Standard (SOPs, Risk Check)</SelectItem>
                        <SelectItem value="extended">Erweitert (ISO 42001 konform)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground pb-2 border-b">{editDraft.iso_documentationLevel}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Lifecycle Status</Label>
                  {isEditing ? (
                    <Select value={editDraft.iso_lifecycleStatus} onValueChange={(val) => setEditDraft(p => ({ ...p, iso_lifecycleStatus: val as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unbekannt</SelectItem>
                        <SelectItem value="pilot">Pilot-Phase</SelectItem>
                        <SelectItem value="active">Produktivbetrieb</SelectItem>
                        <SelectItem value="retired">Beendet</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground pb-2 border-b">{editDraft.iso_lifecycleStatus}</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB: PORTFOLIO */}
          <TabsContent value="portfolio" className="space-y-6 m-0 border-0 p-0 focus-visible:ring-0">
            <div className="space-y-4">
              {!isEditing && (editDraft.portfolio_valueScore === null || editDraft.portfolio_riskScore === null) && (
                <div className="rounded-md border p-6 flex flex-col items-center justify-center text-center bg-secondary/20">
                  <p className="text-sm font-medium mb-1">Portfolio-Score fehlt</p>
                  <p className="text-xs text-muted-foreground mb-4">Möchten Sie diesen Use Case in Ihrer Portfolio-Analyse berücksichtigen?</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                {/* Value Score */}
                <div className="p-4 rounded-md border bg-slate-50/50 space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label className="text-sm font-medium">Business Value Score</Label>
                    <p className="text-[11px] text-muted-foreground">Wie viel Nutzen bringt diese KI-Anwendung für das Unternehmen (0 = Keinen, 5 = Essenziell)?</p>
                  </div>

                  {isEditing ? (
                    <Select
                      value={editDraft.portfolio_valueScore !== null ? editDraft.portfolio_valueScore.toString() : ""}
                      onValueChange={(val) => setEditDraft(p => ({ ...p, portfolio_valueScore: parseInt(val, 10) as any }))}
                    >
                      <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 - Kein Nutzen</SelectItem>
                        <SelectItem value="1">1 - Sehr gering</SelectItem>
                        <SelectItem value="2">2 - Gering</SelectItem>
                        <SelectItem value="3">3 - Moderat</SelectItem>
                        <SelectItem value="4">4 - Hoch</SelectItem>
                        <SelectItem value="5">5 - Essenziell</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm font-medium">{editDraft.portfolio_valueScore !== null ? editDraft.portfolio_valueScore : "Nicht bewertet"} / 5</div>
                  )}

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs text-muted-foreground">Rationale (Begründung)</Label>
                    {isEditing ? (
                      <Textarea
                        value={editDraft.portfolio_valueRationale || ""}
                        placeholder="Kurze Begründung (max 300 Zeichen)..."
                        maxLength={300}
                        className="h-20 bg-white"
                        onChange={(e) => setEditDraft(p => ({ ...p, portfolio_valueRationale: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{editDraft.portfolio_valueRationale || "-"}</p>
                    )}
                  </div>
                </div>

                {/* Risk Score */}
                <div className="p-4 rounded-md border bg-red-50/10 space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label className="text-sm font-medium">Compliance Risk Score</Label>
                    <p className="text-[11px] text-muted-foreground">Wie hoch ist das Risiko bezüglich Daten, KI-Gesetz, Ausfällen (0 = Minimales Risiko, 5 = Kritisches Risiko)?</p>
                  </div>

                  {isEditing ? (
                    <Select
                      value={editDraft.portfolio_riskScore !== null ? editDraft.portfolio_riskScore.toString() : ""}
                      onValueChange={(val) => setEditDraft(p => ({ ...p, portfolio_riskScore: parseInt(val, 10) as any }))}
                    >
                      <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 - Kein Risiko</SelectItem>
                        <SelectItem value="1">1 - Sehr gering</SelectItem>
                        <SelectItem value="2">2 - Gering</SelectItem>
                        <SelectItem value="3">3 - Moderat</SelectItem>
                        <SelectItem value="4">4 - Hoch</SelectItem>
                        <SelectItem value="5">5 - Kritisch</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm font-medium">{editDraft.portfolio_riskScore !== null ? editDraft.portfolio_riskScore : "Nicht bewertet"} / 5</div>
                  )}

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs text-muted-foreground">Rationale (Begründung)</Label>
                    {isEditing ? (
                      <Textarea
                        value={editDraft.portfolio_riskRationale || ""}
                        placeholder="Gibt es bestimmte Risikofaktoren? (max 300 Zeichen)..."
                        maxLength={300}
                        className="h-20 bg-white"
                        onChange={(e) => setEditDraft(p => ({ ...p, portfolio_riskRationale: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{editDraft.portfolio_riskRationale || "-"}</p>
                    )}
                  </div>
                </div>

                {/* Strategy */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Konzern-Strategie Tag</Label>
                  {isEditing ? (
                    <Select value={editDraft.portfolio_strategyTag || ""} onValueChange={(val) => setEditDraft(p => ({ ...p, portfolio_strategyTag: val as any }))}>
                      <SelectTrigger className="w-full md:w-[300px]"><SelectValue placeholder="Unbekannt / Kein Tag" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pilot">Pilot-Projekt</SelectItem>
                        <SelectItem value="scale">Skalieren (High Value)</SelectItem>
                        <SelectItem value="monitor">Beobachten</SelectItem>
                        <SelectItem value="stop">Stoppen / Degardieren</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">{editDraft.portfolio_strategyTag || "Kein Tag zugewiesen"}</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

        </CardContent>

        {/* Timestamps */}
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-muted-foreground">
                Erstellt
              </Label>
              <p className="text-xs">{formatDate(card.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-muted-foreground">
                Aktualisiert
              </Label>
              <p className="text-xs">{formatDate(card.updatedAt)}</p>
            </div>
          </div>

          {/* Save button */}
          {isEditing && (
            <div className="flex justify-end pt-4 mt-2">
              <Button onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Änderungen Speichern
              </Button>
            </div>
          )}
        </CardContent>
      </Tabs>

      <UseCaseAssessmentWizard
        card={card}
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={async () => {
          // Trigger a silent save with empty updates just to reload data
          await onSave({});
        }}
      />
    </Card>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "unbekannt";
  return date.toLocaleString("de-DE");
}
