"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import {
  QuickCaptureFields,
  TOOL_PLACEHOLDER_ID,
  type QuickCaptureFieldsDraft,
} from "@/components/register/quick-capture-fields";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
import { PageStatePanel, PublicIntakeShell } from "@/components/product-shells";
import { type SharedCaptureFieldErrors } from "@/lib/register-first/shared-capture-fields";
import { registerFirstFlags } from "@/lib/register-first/flags";

const EMPTY_SUPPLIER_CAPTURE_DRAFT: QuickCaptureFieldsDraft = {
  purpose: "",
  ownerRole: "Lieferantenangabe",
  contactPersonName: "",
  toolId: TOOL_PLACEHOLDER_ID,
  toolFreeText: "",
  systems: [],
  workflowConnectionMode: null,
  workflowSummary: "",
  usageContexts: ["INTERNAL_ONLY"],
  dataCategories: [],
  decisionInfluence: null,
};

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

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveSystemLabel(toolId?: string | null, toolFreeText?: string | null): string | null {
  const normalizedFreeText = normalizeOptionalText(toolFreeText);
  if (normalizedFreeText) {
    return normalizedFreeText;
  }

  const normalizedToolId = normalizeOptionalText(toolId);
  if (!normalizedToolId || normalizedToolId === TOOL_PLACEHOLDER_ID) {
    return null;
  }

  return normalizedToolId;
}

function resolveDraftSystemNames(
  draft: QuickCaptureFieldsDraft,
  multisystemEnabled: boolean
): string[] {
  if (multisystemEnabled) {
    return draft.systems
      .map((system) => resolveSystemLabel(system.toolId, system.toolFreeText))
      .filter((value): value is string => Boolean(value));
  }

  const primarySystem = resolveSystemLabel(draft.toolId, draft.toolFreeText);
  return primarySystem ? [primarySystem] : [];
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
  const [captureErrors, setCaptureErrors] = useState<SharedCaptureFieldErrors>({});
  const [riskAccordionValue, setRiskAccordionValue] = useState<string | undefined>(undefined);
  const expiresLabel = useMemo(() => formatExpiry(expiresAt), [expiresAt]);
  const supplierMultisystemEnabled =
    registerFirstFlags.supplierMultisystemCapture;

  const [formData, setFormData] = useState({
    supplierEmail: "",
    supplierOrganisation: "",
    aiActCategory: "",
    capture: { ...EMPTY_SUPPLIER_CAPTURE_DRAFT },
  });

  const patchCapture = (patch: Partial<QuickCaptureFieldsDraft>) => {
    setFormData((prev) => ({
      ...prev,
      capture: {
        ...prev.capture,
        ...patch,
      },
    }));
  };

  const resolvedSystems = useMemo(
    () => resolveDraftSystemNames(formData.capture, supplierMultisystemEnabled),
    [formData.capture, supplierMultisystemEnabled]
  );
  const canDescribeRelationship =
    supplierMultisystemEnabled && resolvedSystems.length >= 2;

  useEffect(() => {
    if (formData.aiActCategory.trim().length > 0) {
      setRiskAccordionValue("risk");
    }
  }, [formData.aiActCategory]);

  useEffect(() => {
    if (!captureErrors.purpose) {
      return;
    }

    if (formData.capture.purpose.trim().length >= 3) {
      setCaptureErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors.purpose;
        return nextErrors;
      });
    }
  }, [captureErrors.purpose, formData.capture.purpose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const nextCaptureErrors: SharedCaptureFieldErrors = {};
    if (formData.capture.purpose.trim().length < 3) {
      nextCaptureErrors.purpose =
        "Bitte beschreiben Sie den Verwendungszweck mit mindestens 3 Zeichen.";
    }
    setCaptureErrors(nextCaptureErrors);

    try {
      if (resolvedSystems.length === 0) {
        throw new Error("Bitte erfassen Sie mindestens ein beteiligtes System.");
      }

      if (Object.keys(nextCaptureErrors).length > 0) {
        throw new Error("Bitte vervollständigen Sie den Verwendungszweck.");
      }

      const response = await fetch("/api/supplier-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestToken,
          supplierEmail: formData.supplierEmail,
          supplierOrganisation: formData.supplierOrganisation,
          toolName: resolvedSystems[0] ?? "",
          purpose: formData.capture.purpose.trim(),
          ...(formData.capture.dataCategories.length > 0
            ? {
                dataCategory: formData.capture.dataCategories[0],
                dataCategories: formData.capture.dataCategories,
              }
            : {}),
          ...(formData.aiActCategory.trim().length > 0
            ? {
                aiActCategory: formData.aiActCategory,
              }
            : {}),
          ...(supplierMultisystemEnabled
            ? {
                systems: resolvedSystems,
                workflowConnectionMode:
                  canDescribeRelationship &&
                  formData.capture.workflowConnectionMode
                    ? formData.capture.workflowConnectionMode
                    : undefined,
                workflowSummary:
                  canDescribeRelationship &&
                  formData.capture.workflowSummary.trim().length > 0
                    ? formData.capture.workflowSummary.trim()
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
            Sichere Anfrage-ID:{" "}
            <span className="font-medium text-slate-950">{requestTokenId}</span> ·
            gültig bis {expiresLabel}
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
          description={`Vielen Dank. Die Angaben von ${formData.supplierOrganisation} wurden als nachvollziehbare externe Einreichung im Register von ${organisationName} gespeichert.`}
        />
      </PublicIntakeShell>
    );
  }

  return (
    <PublicIntakeShell
      title="Lieferantenangaben einreichen"
      description={`${organisationName} bittet Sie um Basisangaben zu Ihrem KI-Einsatz und beteiligten Systemen, damit die Nutzung intern nachvollziehbar dokumentiert und geprüft werden kann.`}
      actions={[]}
      meta={
        <p>
          Sichere Anfrage-ID:{" "}
          <span className="font-medium text-slate-950">{requestTokenId}</span> ·
          gültig bis {expiresLabel}
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
                <CardTitle>Einsatz und Systeme</CardTitle>
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

            <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-slate-900">
                  Absender und Einreichung
                </h3>
                <p className="text-xs text-muted-foreground">
                  Diese Angaben bleiben mit der Einreichung verbunden und werden
                  intern als Herkunftsinformation genutzt.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier-email">Ihre Arbeits-E-Mail</Label>
                  <Input
                    id="supplier-email"
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
                  <Label htmlFor="supplier-organisation">Ihre Organisation</Label>
                  <Input
                    id="supplier-organisation"
                    required
                    placeholder="z. B. Lieferant GmbH"
                    value={formData.supplierOrganisation}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierOrganisation: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-slate-900">
                  Einsatzbeschreibung
                </h3>
                <p className="text-xs text-muted-foreground">
                  Erfassen Sie die beteiligten Systeme in der genutzten Reihenfolge.
                  Optional können Sie zusätzliche Angaben zu Daten und
                  Risikoeinschätzung ergänzen.
                </p>
              </div>

              <QuickCaptureFields
                draft={formData.capture}
                onChange={patchCapture}
                errors={captureErrors}
                multisystemEnabled={supplierMultisystemEnabled}
                showOwnerRole={false}
                showContactPerson={false}
                showUsageSection={false}
                autoFillPurposeFromSystem={false}
                purposeLabel="Verwendungszweck beim Kunden"
                purposePlaceholder="z. B. Marketingtexte vorbereiten oder Support-Anfragen strukturieren"
                purposeHelperText="Kurz und konkret beschreiben, wofür der Einsatz beim Kunden gedacht ist."
                systemLabel={supplierMultisystemEnabled ? "Systeme" : "System"}
                systemHelperText="Erfassen Sie beteiligte Tools, APIs oder verbundene Systeme in der genutzten Reihenfolge."
                showSystemOptionalLabel={false}
              />
            </section>

            <Accordion
              type="single"
              collapsible
              value={riskAccordionValue}
              onValueChange={(value) => setRiskAccordionValue(value || undefined)}
              className="rounded-lg border"
            >
              <AccordionItem value="risk" className="border-none">
                <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
                  Risikoklassen-Einschätzung (optional)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 px-4 pb-4">
                  <div className="space-y-2">
                    <Label>Einschätzung gemäss EU AI Act</Label>
                    <Select
                      value={formData.aiActCategory || "__none__"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          aiActCategory: value === "__none__" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Noch keine Einschätzung</SelectItem>
                        <SelectItem value="Minimales Risiko">
                          Minimales Risiko
                        </SelectItem>
                        <SelectItem value="Geringes Risiko">
                          Geringes Risiko
                        </SelectItem>
                        <SelectItem value="Hochrisiko">Hochrisiko</SelectItem>
                        <SelectItem value="Unbekannt">
                          Noch unklar / Unbekannt
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Diese Angabe wird als Lieferanten-Einschätzung übernommen und
                    intern separat geprüft.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
