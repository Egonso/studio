"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ToolAutocomplete } from "@/components/tool-autocomplete";
import {
  CAPTURE_STEP_3_LABEL,
  type AffectedParty,
  type CaptureUsageContext,
  type DataCategory,
  registerFirstService,
  type RegisterFirstServiceErrorCode,
  submitCaptureDraft,
  createEmptyCaptureDraft,
  shouldShowAffectedParties,
  type CaptureFormDraft,
  type CaptureFieldErrors,
  type UseCaseCard,
} from "@/lib/register-first";

interface CaptureFormProps {
  projectId?: string;
  /** When provided, the caller controls the service call (standalone mode). */
  onSubmit?: (payload: unknown) => Promise<UseCaseCard>;
}

type ResponsibilityChoice = "YES" | "NO";
type DecisionChoice = "YES" | "NO" | "UNSURE";

const usageContextOptions: Array<{ value: CaptureUsageContext; label: string }> = [
  { value: "INTERNAL_ONLY", label: "Nur intern" },
  { value: "CUSTOMER_FACING", label: "Für Kund:innen" },
  { value: "EMPLOYEE_FACING", label: "Für Mitarbeitende" },
  { value: "EXTERNAL_PUBLIC", label: "Extern / öffentlich" },
];

const affectedPartyOptions: Array<{ value: AffectedParty; label: string }> = [
  { value: "INDIVIDUALS", label: "Einzelpersonen" },
  { value: "GROUPS_OR_TEAMS", label: "Gruppen oder Teams" },
  { value: "EXTERNAL_PEOPLE", label: "Externe Personen" },
  { value: "INTERNAL_PROCESSES", label: "Nur interne Prozesse" },
];

const dataCategoryOptions: Array<{ value: DataCategory; label: string; hint: string }> = [
  { value: "NONE", label: "Keine besonderen Daten", hint: "Oeffentlich oder generisch" },
  { value: "INTERNAL", label: "Interne Daten", hint: "z. B. Unternehmenswissen" },
  { value: "PERSONAL", label: "Personenbezogene Daten", hint: "Name, E-Mail, etc." },
  { value: "SENSITIVE", label: "Sensible Daten", hint: "Gesundheit, Finanzen, etc." },
];

function mapServiceErrorCode(error: unknown): RegisterFirstServiceErrorCode | "REGISTER_NOT_FOUND" | null {
  if (error && typeof error === "object" && "code" in error) {
    const value = String((error as { code: unknown }).code);
    if (
      value === "UNAUTHENTICATED" ||
      value === "PROJECT_CONTEXT_MISSING" ||
      value === "USE_CASE_NOT_FOUND" ||
      value === "INVALID_STATUS_TRANSITION" ||
      value === "AUTOMATION_FORBIDDEN" ||
      value === "VALIDATION_FAILED" ||
      value === "PERSISTENCE_FAILED" ||
      value === "REGISTER_NOT_FOUND"
    ) {
      return value;
    }
  }
  return null;
}

export function CaptureForm({ projectId, onSubmit: externalSubmit }: CaptureFormProps) {
  const [draft, setDraft] = useState<CaptureFormDraft>(createEmptyCaptureDraft());
  const [errors, setErrors] = useState<CaptureFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdUseCaseId, setCreatedUseCaseId] = useState<string | null>(null);

  const showAffectedStep = useMemo(
    () => shouldShowAffectedParties(draft.decisionImpact),
    [draft.decisionImpact]
  );

  const toggleMultiSelect = <T extends string>(
    currentValues: T[],
    target: T,
    checked: boolean
  ): T[] => {
    if (checked) {
      return currentValues.includes(target)
        ? currentValues
        : [...currentValues, target];
    }
    return currentValues.filter((value) => value !== target);
  };

  const setResponsibilityChoice = (value: ResponsibilityChoice) => {
    const isResponsible = value === "YES";
    setDraft((prev) => ({
      ...prev,
      isCurrentlyResponsible: isResponsible,
      responsibleParty: isResponsible ? "" : prev.responsibleParty,
    }));
  };

  const setDecisionChoice = (value: DecisionChoice) => {
    setDraft((prev) => ({
      ...prev,
      decisionImpact: value,
      affectedParties: value === "NO" ? [] : prev.affectedParties,
    }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setErrors({});
    setIsSubmitting(true);

    try {
      const serviceFn = externalSubmit
        ? async (payload: unknown) => externalSubmit(payload)
        : async (payload: unknown) =>
            registerFirstService.createUseCaseFromCapture(payload, {
              projectId,
            });

      const result = await submitCaptureDraft(draft, serviceFn);

      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      setCreatedUseCaseId(result.value.useCaseId);
      setDraft(createEmptyCaptureDraft());
    } catch (error) {
      const code = mapServiceErrorCode(error);
      if (code === "REGISTER_NOT_FOUND") {
        setSubmitError(
          "Kein Register gefunden. Bitte erstelle zuerst ein Register."
        );
      } else if (code === "PROJECT_CONTEXT_MISSING") {
        setSubmitError(
          "Kein Projektkontext gefunden. Bitte öffne zuerst ein Projekt im Dashboard."
        );
      } else if (code === "UNAUTHENTICATED") {
        setSubmitError("Du bist nicht angemeldet. Bitte melde dich erneut an.");
      } else {
        setSubmitError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>KI-Einsatz kurz festhalten</CardTitle>
        <CardDescription>
          Dauert weniger als 30 Sekunden. Keine Bewertung, keine Verpflichtung.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTitle>Governance bleibt manuell</AlertTitle>
          <AlertDescription>
            Es gibt keine automatische Review-Pflicht, keine automatische Eskalation und
            keine automatische Policy-Generierung.
          </AlertDescription>
        </Alert>

        {createdUseCaseId && (
          <Alert>
            <AlertTitle>Gespeichert.</AlertTitle>
            <AlertDescription>
              Der Einsatzfall ist jetzt im Register.
              <br />
              Du kannst ihn später prüfen oder einfach so stehen lassen.
              <br />
              <span className="text-xs text-muted-foreground">
                ID: {createdUseCaseId}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <section className="space-y-2">
            <Label htmlFor="purpose">Wobei unterstützt dich die KI gerade?</Label>
            <Textarea
              id="purpose"
              placeholder="z. B. Texte für Marketing erstellen, Bewerbungen vorsortieren, Supportanfragen beantworten"
              value={draft.purpose}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, purpose: event.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Kurz beschreiben, was du damit machst - nicht wie es technisch funktioniert.
            </p>
            {errors.purpose && <p className="text-xs text-destructive">{errors.purpose}</p>}
          </section>

          <section className="space-y-2">
            <Label>Wo wird das Ergebnis verwendet?</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {usageContextOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <Checkbox
                    checked={draft.usageContexts.includes(option.value)}
                    onCheckedChange={(checked) =>
                      setDraft((prev) => ({
                        ...prev,
                        usageContexts: toggleMultiSelect(
                          prev.usageContexts,
                          option.value,
                          checked === true
                        ),
                      }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Es geht darum, wer das Ergebnis sieht oder nutzt.
            </p>
            {errors.usageContexts && (
              <p className="text-xs text-destructive">{errors.usageContexts}</p>
            )}
          </section>

          <section className="space-y-2">
            <Label>{CAPTURE_STEP_3_LABEL}</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                <input
                  type="radio"
                  name="responsibility"
                  checked={draft.isCurrentlyResponsible === true}
                  onChange={() => setResponsibilityChoice("YES")}
                />
                Ja, ich
              </label>
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                <input
                  type="radio"
                  name="responsibility"
                  checked={draft.isCurrentlyResponsible === false}
                  onChange={() => setResponsibilityChoice("NO")}
                />
                Nein
              </label>
            </div>
            {errors.isCurrentlyResponsible && (
              <p className="text-xs text-destructive">{errors.isCurrentlyResponsible}</p>
            )}

            {draft.isCurrentlyResponsible === false && (
              <div className="space-y-2">
                <Label htmlFor="responsibleParty">Wer ist es stattdessen?</Label>
                <Input
                  id="responsibleParty"
                  placeholder="z. B. Teamleitung Marketing"
                  value={draft.responsibleParty}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      responsibleParty: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Eine grobe Angabe reicht. Das kann später angepasst werden.
                </p>
                {errors.responsibleParty && (
                  <p className="text-xs text-destructive">{errors.responsibleParty}</p>
                )}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <Label>Beeinflusst das Ergebnis Entscheidungen oder Bewertungen?</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["YES", "NO", "UNSURE"] as DecisionChoice[]).map((choice) => (
                <label
                  key={choice}
                  className="flex items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <input
                    type="radio"
                    name="decisionImpact"
                    checked={draft.decisionImpact === choice}
                    onChange={() => setDecisionChoice(choice)}
                  />
                  {choice === "YES" ? "Ja" : choice === "NO" ? "Nein" : "Ich bin unsicher"}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Unsicher ist völlig okay - das klären wir später.
            </p>
            {errors.decisionImpact && (
              <p className="text-xs text-destructive">{errors.decisionImpact}</p>
            )}
          </section>

          {showAffectedStep && (
            <section className="space-y-2">
              <Label>Wen betrifft das hauptsächlich?</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {affectedPartyOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 rounded-md border p-3 text-sm"
                  >
                    <Checkbox
                      checked={draft.affectedParties.includes(option.value)}
                      onCheckedChange={(checked) =>
                        setDraft((prev) => ({
                          ...prev,
                          affectedParties: toggleMultiSelect(
                            prev.affectedParties,
                            option.value,
                            checked === true
                          ),
                        }))
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <Label>Welches KI-Tool verwendest du? (optional)</Label>
            <ToolAutocomplete
              value={
                draft.toolId === "other"
                  ? "Anderes Tool"
                  : draft.toolId
                    ? draft.toolId
                    : ""
              }
              onChange={(displayName, toolData) => {
                if (toolData?.toolId) {
                  setDraft((prev) => ({
                    ...prev,
                    toolId: toolData.toolId,
                    toolFreeText: toolData.toolId === "other" ? prev.toolFreeText : "",
                  }));
                } else {
                  setDraft((prev) => ({
                    ...prev,
                    toolId: displayName.length > 0 ? "other" : "",
                    toolFreeText: displayName,
                  }));
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Waehle ein Tool aus dem Katalog oder gib einen eigenen Namen ein.
            </p>
            {draft.toolId === "other" && (
              <div className="space-y-1">
                <Label htmlFor="toolFreeText">Tool-Name (Freitext)</Label>
                <Input
                  id="toolFreeText"
                  placeholder="z. B. Eigenentwicklung RAG-Pipeline"
                  value={draft.toolFreeText}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, toolFreeText: event.target.value }))
                  }
                />
                {errors.toolFreeText && (
                  <p className="text-xs text-destructive">{errors.toolFreeText}</p>
                )}
              </div>
            )}
            {errors.toolId && <p className="text-xs text-destructive">{errors.toolId}</p>}
          </section>

          <section className="space-y-2">
            <Label>Welche Art von Daten verarbeitet das Tool? (optional)</Label>
            <Select
              value={draft.dataCategory ?? ""}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  dataCategory: value === "" ? null : (value as DataCategory),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Datenkategorie waehlen" />
              </SelectTrigger>
              <SelectContent>
                {dataCategoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    <span className="ml-1 text-xs text-muted-foreground">
                      - {option.hint}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Dies ist optional und hilft bei der spaeteren Bewertung.
            </p>
            {errors.dataCategory && (
              <p className="text-xs text-destructive">{errors.dataCategory}</p>
            )}
          </section>

          <div className="space-y-2">
            <div className="flex items-center justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Einsatzfall speichern
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Du kannst das jederzeit ergänzen oder ändern.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
