"use client";

import { useState } from "react";
import { Loader2, Building, User, Shield, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { registerService } from "@/lib/register-first/register-service";
import type { OrgSettings } from "@/lib/register-first/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface CompanyOnboardingWizardProps {
  onComplete: (registerId: string) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

interface WizardDraft {
  // Step 1: Organisation
  firmenname: string;
  branche: string;
  organisationseinheit: string;
  // Step 2: Contact
  ansprechpartnerName: string;
  ansprechpartnerEmail: string;
  // Step 3: Governance Basics
  hasAiPolicy: boolean;
  aiPolicyUrl: string;
  hasIncidentProcess: boolean;
  hasRolesAssigned: boolean;
  // Step 4: First Use Case (optional)
  firstUseCasePurpose: string;
  firstUseCaseTool: string;
}

const EMPTY_DRAFT: WizardDraft = {
  firmenname: "",
  branche: "",
  organisationseinheit: "",
  ansprechpartnerName: "",
  ansprechpartnerEmail: "",
  hasAiPolicy: false,
  aiPolicyUrl: "",
  hasIncidentProcess: false,
  hasRolesAssigned: false,
  firstUseCasePurpose: "",
  firstUseCaseTool: "",
};

const BRANCHEN = [
  "Technologie",
  "Finanzen & Versicherungen",
  "Gesundheitswesen",
  "Bildung",
  "Einzelhandel & E-Commerce",
  "Produktion & Industrie",
  "Beratung & Dienstleistung",
  "Öffentlicher Dienst",
  "Medien & Kommunikation",
  "Sonstiges",
];

const STEPS = [
  { icon: Building, label: "Organisation" },
  { icon: User, label: "Kontakt" },
  { icon: Shield, label: "Governance" },
  { icon: Zap, label: "Erster Einsatzfall" },
] as const;

// ── Component ────────────────────────────────────────────────────────────────

export function CompanyOnboardingWizard({ onComplete }: CompanyOnboardingWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<WizardDraft>({ ...EMPTY_DRAFT });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (p: Partial<WizardDraft>) => setDraft((d) => ({ ...d, ...p }));

  const canProceed: Record<WizardStep, boolean> = {
    1: draft.firmenname.trim().length >= 2 && draft.branche.length > 0,
    2: draft.ansprechpartnerName.trim().length >= 2 && draft.ansprechpartnerEmail.trim().includes("@"),
    3: true, // Governance basics are optional
    4: true, // First use case is optional
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const settings: OrgSettings = {
        organisationName: draft.firmenname.trim(),
        industry: draft.branche,
        contactPerson: {
          name: draft.ansprechpartnerName.trim(),
          email: draft.ansprechpartnerEmail.trim().toLowerCase(),
        },
        aiPolicy: draft.hasAiPolicy && draft.aiPolicyUrl.trim()
          ? { url: draft.aiPolicyUrl.trim() }
          : null,
        incidentProcess: null,
        rolesFramework: draft.hasRolesAssigned
          ? { booleanDefined: true }
          : null,
      };

      // Create register
      const reg = await registerService.createRegister(settings.organisationName);
      await registerService.updateRegisterProfile(reg.registerId, {
        organisationName: settings.organisationName,
        organisationUnit: draft.organisationseinheit.trim() || null,
        orgSettings: settings,
      });

      // Optionally create first use case
      if (draft.firstUseCasePurpose.trim()) {
        await registerService.createUseCaseFromCapture(
          {
            purpose: draft.firstUseCasePurpose.trim(),
            toolFreeText: draft.firstUseCaseTool.trim() || undefined,
            usageContexts: [],
            decisionImpact: 'UNSURE',
          },
          { registerId: reg.registerId }
        );
      }

      onComplete(reg.registerId);
    } catch {
      setError("Register konnte nicht erstellt werden. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, 4) as WizardStep);
  const back = () => setStep((s) => Math.max(s - 1, 1) as WizardStep);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>AI Governance Register einrichten</CardTitle>
        <CardDescription>
          Schritt {step} von 4 — {STEPS[step - 1].label}
        </CardDescription>
        {/* Step indicator */}
        <div className="flex gap-1 pt-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i + 1 === step;
            const isDone = i + 1 < step;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-1 w-full rounded-full transition-colors ${isDone ? "bg-primary" : isActive ? "bg-primary" : "bg-muted"
                    }`}
                />
                <div className={`flex items-center gap-1 text-[10px] ${isActive ? "text-primary font-medium" : isDone ? "text-primary/60" : "text-muted-foreground"
                  }`}>
                  {isDone ? <Check className="h-2.5 w-2.5" /> : <Icon className="h-2.5 w-2.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Step 1: Organisation ─────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="cw-firmenname">
                Firmenname <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cw-firmenname"
                placeholder="z. B. Müller GmbH"
                value={draft.firmenname}
                onChange={(e) => patch({ firmenname: e.target.value })}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>
                Branche <span className="text-destructive">*</span>
              </Label>
              <Select value={draft.branche} onValueChange={(v) => patch({ branche: v })}>
                <SelectTrigger><SelectValue placeholder="Branche auswählen" /></SelectTrigger>
                <SelectContent>
                  {BRANCHEN.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cw-unit">Organisationseinheit (optional)</Label>
              <Input
                id="cw-unit"
                placeholder="z. B. IT-Abteilung"
                value={draft.organisationseinheit}
                onChange={(e) => patch({ organisationseinheit: e.target.value })}
              />
            </div>

            <Button onClick={next} disabled={!canProceed[1]} className="w-full mt-4">
              Weiter
            </Button>
          </>
        )}

        {/* ── Step 2: Ansprechpartner ──────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="cw-contact-name">
                Ansprechpartner (Name) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cw-contact-name"
                placeholder="Vor- und Nachname"
                value={draft.ansprechpartnerName}
                onChange={(e) => patch({ ansprechpartnerName: e.target.value })}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cw-contact-email">
                E-Mail <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cw-contact-email"
                type="email"
                placeholder="name@firma.de"
                value={draft.ansprechpartnerEmail}
                onChange={(e) => patch({ ansprechpartnerEmail: e.target.value })}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={back} className="flex-1">Zurück</Button>
              <Button onClick={next} disabled={!canProceed[2]} className="flex-1">Weiter</Button>
            </div>
          </>
        )}

        {/* ── Step 3: Governance Basics ────────────────────────────────── */}
        {step === 3 && (
          <>
            <p className="text-sm text-muted-foreground">
              Optional: Geben Sie an, welche Governance-Grundlagen bereits bestehen. Dies fließt in Ihren Maturity-Score ein.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md border bg-muted/10">
                <Checkbox
                  id="cw-policy"
                  checked={draft.hasAiPolicy}
                  onCheckedChange={(c) => patch({ hasAiPolicy: c === true })}
                />
                <div className="space-y-1">
                  <Label htmlFor="cw-policy" className="text-sm font-medium cursor-pointer">
                    KI-Richtlinie (AI Policy) vorhanden
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Ein Dokument, das den Umgang mit KI in Ihrer Organisation regelt.
                  </p>
                </div>
              </div>

              {draft.hasAiPolicy && (
                <div className="space-y-1.5 pl-8">
                  <Label htmlFor="cw-policy-url">Dokumenten-URL (optional)</Label>
                  <Input
                    id="cw-policy-url"
                    placeholder="https://..."
                    value={draft.aiPolicyUrl}
                    onChange={(e) => patch({ aiPolicyUrl: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-md border bg-muted/10">
                <Checkbox
                  id="cw-incident"
                  checked={draft.hasIncidentProcess}
                  onCheckedChange={(c) => patch({ hasIncidentProcess: c === true })}
                />
                <div className="space-y-1">
                  <Label htmlFor="cw-incident" className="text-sm font-medium cursor-pointer">
                    Incident-Prozess definiert
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Es gibt einen Meldeprozess für KI-bezogene Vorfälle.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md border bg-muted/10">
                <Checkbox
                  id="cw-roles"
                  checked={draft.hasRolesAssigned}
                  onCheckedChange={(c) => patch({ hasRolesAssigned: c === true })}
                />
                <div className="space-y-1">
                  <Label htmlFor="cw-roles" className="text-sm font-medium cursor-pointer">
                    KI-Rollen formal zugewiesen
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Es gibt definierte Verantwortlichkeiten (z. B. AI Officer, DPO).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={back} className="flex-1">Zurück</Button>
              <Button onClick={next} className="flex-1">Weiter</Button>
            </div>
          </>
        )}

        {/* ── Step 4: First Use Case (optional) ───────────────────────── */}
        {step === 4 && (
          <>
            <p className="text-sm text-muted-foreground">
              Optional: Erfassen Sie direkt Ihren ersten KI-Einsatzfall. Sie können diesen Schritt auch überspringen.
            </p>

            <div className="space-y-2">
              <Label htmlFor="cw-uc-purpose">Wozu wird das KI-System eingesetzt?</Label>
              <Input
                id="cw-uc-purpose"
                placeholder="z. B. Automatisierte E-Mail-Zusammenfassung"
                value={draft.firstUseCasePurpose}
                onChange={(e) => patch({ firstUseCasePurpose: e.target.value })}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cw-uc-tool">Welches Tool / System?</Label>
              <Input
                id="cw-uc-tool"
                placeholder="z. B. ChatGPT, Microsoft Copilot"
                value={draft.firstUseCaseTool}
                onChange={(e) => patch({ firstUseCaseTool: e.target.value })}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={back} className="flex-1">Zurück</Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {draft.firstUseCasePurpose.trim() ? "Register erstellen" : "Ohne Einsatzfall erstellen"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
