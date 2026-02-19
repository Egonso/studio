"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { registerService } from "@/lib/register-first/register-service";
import type { CompanyProfile } from "@/lib/register-first/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface CompanyOnboardingWizardProps {
  onComplete: (registerId: string) => void;
}

type WizardStep = 1 | 2 | 3;

interface WizardDraft {
  firmenname: string;
  branche: string;
  mitarbeiterAnzahl: string;
  ansprechpartnerName: string;
  ansprechpartnerEmail: string;
  abteilung: string;
  bestehendeKiNutzung: boolean;
  euAiActRelevant: "ja" | "nein" | "unsicher";
  datenschutzbeauftragter: string;
}

const EMPTY_DRAFT: WizardDraft = {
  firmenname: "",
  branche: "",
  mitarbeiterAnzahl: "",
  ansprechpartnerName: "",
  ansprechpartnerEmail: "",
  abteilung: "",
  bestehendeKiNutzung: false,
  euAiActRelevant: "unsicher",
  datenschutzbeauftragter: "",
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

const MITARBEITER_RANGES = [
  { value: "1-10", label: "1 – 10" },
  { value: "11-50", label: "11 – 50" },
  { value: "51-250", label: "51 – 250" },
  { value: "251-1000", label: "251 – 1.000" },
  { value: "1000+", label: "Über 1.000" },
];

// ── Component ────────────────────────────────────────────────────────────────

export function CompanyOnboardingWizard({ onComplete }: CompanyOnboardingWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<WizardDraft>({ ...EMPTY_DRAFT });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (p: Partial<WizardDraft>) => setDraft((d) => ({ ...d, ...p }));

  const canProceedStep1 =
    draft.firmenname.trim().length >= 2 &&
    draft.branche.length > 0 &&
    draft.mitarbeiterAnzahl.length > 0;

  const canProceedStep2 =
    draft.ansprechpartnerName.trim().length >= 2 &&
    draft.ansprechpartnerEmail.trim().includes("@") &&
    draft.abteilung.trim().length >= 2;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const profile: CompanyProfile = {
        firmenname: draft.firmenname.trim(),
        branche: draft.branche,
        mitarbeiterAnzahl: draft.mitarbeiterAnzahl,
        ansprechpartner: {
          name: draft.ansprechpartnerName.trim(),
          email: draft.ansprechpartnerEmail.trim().toLowerCase(),
        },
        abteilung: draft.abteilung.trim(),
        bestehendeKiNutzung: draft.bestehendeKiNutzung,
        euAiActRelevant: draft.euAiActRelevant,
        datenschutzbeauftragter: draft.datenschutzbeauftragter.trim() || null,
      };

      const reg = await registerService.createRegister(profile.firmenname);
      await registerService.updateRegisterProfile(reg.registerId, {
        organisationName: profile.firmenname,
        companyProfile: profile,
      });

      onComplete(reg.registerId);
    } catch {
      setError("Register konnte nicht erstellt werden. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>AI Governance Register einrichten</CardTitle>
        <CardDescription>
          Schritt {step} von 3 — {step === 1 ? "Unternehmen" : step === 2 ? "Ansprechpartner" : "KI-Kontext"}
        </CardDescription>
        <div className="flex gap-1 pt-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Step 1: Unternehmen ──────────────────────────────────────── */}
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
              <Select
                value={draft.branche}
                onValueChange={(v) => patch({ branche: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Branche auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHEN.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Mitarbeiterzahl <span className="text-destructive">*</span>
              </Label>
              <Select
                value={draft.mitarbeiterAnzahl}
                onValueChange={(v) => patch({ mitarbeiterAnzahl: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Größe auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {MITARBEITER_RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full"
            >
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

            <div className="space-y-2">
              <Label htmlFor="cw-abteilung">
                Abteilung / Bereich <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cw-abteilung"
                placeholder="z. B. IT, Compliance, Geschäftsführung"
                value={draft.abteilung}
                onChange={(e) => patch({ abteilung: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Zurück
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex-1"
              >
                Weiter
              </Button>
            </div>
          </>
        )}

        {/* ── Step 3: KI-Kontext ───────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div className="space-y-2">
              <Label>Bestehende KI-Nutzung in Ihrem Unternehmen?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={draft.bestehendeKiNutzung ? "default" : "outline"}
                  size="sm"
                  onClick={() => patch({ bestehendeKiNutzung: true })}
                >
                  Ja
                </Button>
                <Button
                  type="button"
                  variant={!draft.bestehendeKiNutzung ? "default" : "outline"}
                  size="sm"
                  onClick={() => patch({ bestehendeKiNutzung: false })}
                >
                  Nein
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ist der EU AI Act für Sie relevant?</Label>
              <div className="flex gap-2">
                {(["ja", "nein", "unsicher"] as const).map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant={draft.euAiActRelevant === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => patch({ euAiActRelevant: val })}
                  >
                    {val === "ja" ? "Ja" : val === "nein" ? "Nein" : "Unsicher"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cw-dsb">Datenschutzbeauftragter (optional)</Label>
              <Input
                id="cw-dsb"
                placeholder="Name (optional)"
                value={draft.datenschutzbeauftragter}
                onChange={(e) => patch({ datenschutzbeauftragter: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Zurück
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register erstellen
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
