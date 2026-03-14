"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Plus, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { PageStatePanel, PublicIntakeShell } from "@/components/product-shells";
import { applyDataCategoryLogic } from "@/lib/register-first/capture-selections";
import { registerFirstFlags } from "@/lib/register-first/flags";
import {
  DATA_CATEGORY_LABELS,
  DATA_CATEGORY_MAIN_OPTIONS,
  type DataCategory,
} from "@/lib/register-first/types";

const CONNECTION_MODE_OPTIONS = [
  {
    value: "MANUAL_SEQUENCE",
    label: "Manuell nacheinander",
  },
  {
    value: "SEMI_AUTOMATED",
    label: "Teilweise automatisiert",
  },
  {
    value: "FULLY_AUTOMATED",
    label: "Weitgehend automatisiert",
  },
] as const;

function formatExpiry(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "bald";
  }

  return parsed.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupplierRequestForm({
  requestToken,
  requestTokenId,
  organisationName,
  expiresAt,
}: {
  requestToken: string;
  requestTokenId: string;
  organisationName: string;
  expiresAt: string;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expiresLabel = useMemo(() => formatExpiry(expiresAt), [expiresAt]);
  const supplierMultisystemEnabled =
    registerFirstFlags.supplierMultisystemCapture;

  const [formData, setFormData] = useState({
    supplierEmail: "",
    systems: [""],
    purpose: "",
    dataCategories: [] as DataCategory[],
    aiActCategory: "",
    workflowConnectionMode: "",
    workflowSummary: "",
  });
  const filledSystems = useMemo(
    () =>
      formData.systems
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    [formData.systems]
  );
  const canDescribeRelationship =
    supplierMultisystemEnabled && filledSystems.length >= 2;
  const hasSelectedDataCategories = formData.dataCategories.length > 0;

  const updateSystem = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      systems: prev.systems.map((entry, entryIndex) =>
        entryIndex === index ? value : entry
      ),
    }));
  };

  const addSystem = () => {
    setFormData((prev) => ({
      ...prev,
      systems: [...prev.systems, ""],
    }));
  };

  const removeSystem = (index: number) => {
    setFormData((prev) => {
      const nextSystems = prev.systems.filter(
        (_entry, entryIndex) => entryIndex !== index
      );

      return {
        ...prev,
        systems: nextSystems.length > 0 ? nextSystems : [""],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!hasSelectedDataCategories) {
        throw new Error("Bitte wählen Sie mindestens eine Datenkategorie aus.");
      }

      const response = await fetch("/api/supplier-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestToken,
          supplierEmail: formData.supplierEmail,
          toolName: formData.systems[0]?.trim() ?? "",
          purpose: formData.purpose,
          dataCategory: formData.dataCategories[0],
          dataCategories: formData.dataCategories,
          aiActCategory: formData.aiActCategory,
          ...(supplierMultisystemEnabled
            ? {
                systems: filledSystems,
                workflowConnectionMode:
                  canDescribeRelationship &&
                  formData.workflowConnectionMode.trim().length > 0
                    ? formData.workflowConnectionMode
                    : undefined,
                workflowSummary:
                  canDescribeRelationship &&
                  formData.workflowSummary.trim().length > 0
                    ? formData.workflowSummary.trim()
                    : undefined,
              }
            : {}),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Fehler beim Uebermitteln."
        );
      }

      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Fehler beim Uebermitteln."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
    <PublicIntakeShell
      title="Lieferantenangaben einreichen"
      description={`Dieser öffentliche Lieferantenlink gehört zu ${organisationName}. Ihre Angaben werden nur als nachvollziehbare Einreichung entgegengenommen und intern geprüft.`}
        actions={[]}
        meta={
          <p>
            Sichere Anfrage-ID: <span className="font-medium text-slate-950">{requestTokenId}</span>{" "}
            · gültig bis {expiresLabel}
          </p>
        }
        asidePoints={[
          "Die Einreichung bleibt als unveränderlicher Ursprung erhalten.",
          "Freigabe, Ablehnung oder Übernahme passieren intern im Register.",
        ]}
      >
        <PageStatePanel
          tone="success"
          icon={CheckCircle2}
          area="public_external_intake"
          title="Angaben übermittelt"
          description={`Vielen Dank. Die Angaben wurden als nachvollziehbare externe Einreichung im Register von ${organisationName} gespeichert.`}
        />
      </PublicIntakeShell>
    );
  }

  return (
    <PublicIntakeShell
      title="Lieferantenangaben einreichen"
      description={
        supplierMultisystemEnabled
          ? `${organisationName} bittet Sie um Basisangaben zu Ihrem KI-Einsatz und beteiligten Systemen, damit die Nutzung intern nachvollziehbar dokumentiert und geprüft werden kann.`
          : `${organisationName} bittet Sie um Basisangaben zu Ihrem KI-System, damit die Nutzung intern nachvollziehbar dokumentiert und geprüft werden kann.`
      }
      actions={[]}
      meta={
        <p>
          Sichere Anfrage-ID: <span className="font-medium text-slate-950">{requestTokenId}</span>{" "}
          · gültig bis {expiresLabel}
        </p>
      }
      asidePoints={[
        "Lieferantenangaben werden nicht direkt als interner Use Case gespeichert.",
        "Jede Einreichung bleibt mit Herkunft, Zeit und Link-ID nachvollziehbar.",
        "Der interne nächste Schritt ist Review, Freigabe oder Übernahme ins Register.",
      ]}
    >
      <Card className="shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>
                  {supplierMultisystemEnabled ? "Einsatz und Systeme" : "Systemangaben"}
                </CardTitle>
                <CardDescription>
                  Öffentliche Einreichung für {organisationName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="rounded-md border border-red-200 bg-white p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ihre Arbeits-E-Mail</Label>
                <Input
                  required
                  type="email"
                  placeholder="name@ihrefirma.de"
                  value={formData.supplierEmail}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      supplierEmail: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {supplierMultisystemEnabled
                    ? "Systeme"
                    : "Name des KI-Systems / Produkts"}
                </Label>
                {supplierMultisystemEnabled ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Erfassen Sie beteiligte Tools, APIs oder verbundene Systeme
                      in der genutzten Reihenfolge.
                    </p>
                    <div className="space-y-2">
                      {formData.systems.map((system, index) => (
                        <div key={`supplier-system-${index}`} className="flex items-center gap-2">
                          <Input
                            required={index === 0}
                            placeholder={
                              index === 0
                                ? "z. B. SuperAgent AI oder Perplexity API"
                                : "Weiteres System"
                            }
                            value={system}
                            onChange={(event) =>
                              updateSystem(index, event.target.value)
                            }
                          />
                          {formData.systems.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={() => removeSystem(index)}
                              aria-label={`System ${index + 1} entfernen`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSystem}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Weiteres System
                    </Button>

                    {canDescribeRelationship ? (
                      <Accordion type="single" collapsible className="rounded-lg border px-4">
                        <AccordionItem value="workflow" className="border-none">
                          <AccordionTrigger className="py-3 text-sm hover:no-underline">
                            Zusammenhang (optional)
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pb-2">
                            <div className="space-y-2">
                              <Label>Wie laufen die Systeme überwiegend zusammen?</Label>
                              <Select
                                value={formData.workflowConnectionMode}
                                onValueChange={(value) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    workflowConnectionMode: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Optional auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {CONNECTION_MODE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Kurze Ablaufbeschreibung (optional)</Label>
                              <Textarea
                                rows={3}
                                maxLength={300}
                                placeholder="z. B. Perplexity API recherchiert Themen, Gemini API schreibt Text, Sora erstellt Bilder"
                                value={formData.workflowSummary}
                                onChange={(event) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    workflowSummary: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : null}
                  </div>
                ) : (
                  <Input
                    required
                    placeholder="z.B. SuperAgent AI"
                    value={formData.systems[0]}
                    onChange={(event) => updateSystem(0, event.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Verwendungszweck beim Kunden</Label>
                <Textarea
                  required
                  rows={3}
                  placeholder="Kurz beschreiben, wofür das System konkret eingesetzt wird."
                  value={formData.purpose}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      purpose: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Daten & Sensitivität</Label>
                  <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Mehrfachauswahl möglich. Bitte markieren Sie alle
                        relevanten Datenkategorien.
                      </p>
                      {DATA_CATEGORY_MAIN_OPTIONS.map((option) => (
                        <label
                          key={option}
                          className="flex items-start gap-2 text-sm text-slate-800"
                        >
                          <Checkbox
                            checked={formData.dataCategories.includes(option)}
                            onCheckedChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                dataCategories: applyDataCategoryLogic(
                                  prev.dataCategories,
                                  option
                                ),
                              }))
                            }
                          />
                          <span>{DATA_CATEGORY_LABELS[option]}</span>
                        </label>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        Besondere personenbezogene Daten schliessen
                        personenbezogene Daten fachlich mit ein.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Einschätzung der Risikoklasse gemäss EU AI Act</Label>
                  <Select
                    required
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, aiActCategory: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bitte wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Minimales Risiko">
                        Minimales Risiko
                      </SelectItem>
                      <SelectItem value="Geringes Risiko">
                        Geringes Risiko
                      </SelectItem>
                      <SelectItem value="Hochrisiko">
                        Hochrisiko
                      </SelectItem>
                      <SelectItem value="Unbekannt">
                        Noch unklar / Unbekannt
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-4 border-t bg-white p-6 pb-6">
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {loading ? "Wird sicher übermittelt..." : `An ${organisationName} übermitteln`}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </PublicIntakeShell>
  );
}
