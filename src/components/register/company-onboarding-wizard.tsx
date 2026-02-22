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
import type { OrgSettings } from "@/lib/register-first/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface CompanyOnboardingWizardProps {
  onComplete: (registerId: string) => void;
}

type WizardStep = 1 | 2;

interface WizardDraft {
  firmenname: string;
  branche: string;
  ansprechpartnerName: string;
  ansprechpartnerEmail: string;
}

const EMPTY_DRAFT: WizardDraft = {
  firmenname: "",
  branche: "",
  ansprechpartnerName: "",
  ansprechpartnerEmail: "",
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

// ── Component ────────────────────────────────────────────────────────────────

export function CompanyOnboardingWizard({ onComplete }: CompanyOnboardingWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<WizardDraft>({ ...EMPTY_DRAFT });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (p: Partial<WizardDraft>) => setDraft((d) => ({ ...d, ...p }));

  const canProceedStep1 =
    draft.firmenname.trim().length >= 2 &&
    draft.branche.length > 0;

  const canProceedStep2 =
    draft.ansprechpartnerName.trim().length >= 2 &&
    draft.ansprechpartnerEmail.trim().includes("@");

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
        }
      };

      const reg = await registerService.createRegister(settings.organisationName);
      await registerService.updateRegisterProfile(reg.registerId, {
        organisationName: settings.organisationName,
        orgSettings: settings,
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
          Schritt {step} von 2 — {step === 1 ? "Unternehmen" : "Ansprechpartner"}
        </CardDescription>
        <div className="flex gap-1 pt-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"
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

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full mt-4"
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

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Zurück
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={!canProceedStep2 || isSubmitting}
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
