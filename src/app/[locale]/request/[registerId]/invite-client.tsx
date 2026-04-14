"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Loader2, Mail, ShieldCheck } from "lucide-react";

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
import type { SupplierInviteStatus } from "@/lib/register-first/supplier-invite-types";

// ── Types ───────────────────────────────────────────────────────────────────

type FlowStep = "verify" | "form" | "success";

interface SupplierInviteFlowProps {
  requestToken: string;
  inviteId: string;
  organisationName: string;
  supplierOrganisationHint: string | null;
  intendedEmail: string;
  expiresAt: string;
  inviteStatus: SupplierInviteStatus;
}

interface SubmitSuccessState {
  submissionId: string;
  submittedAt: string;
  systemNames: string[];
  nextStepTitle: string;
  nextStepDescription: string;
  setupUrl: string | null;
  confirmationEmailSent: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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
  if (Number.isNaN(parsed.getTime())) return "bald";
  return parsed.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "unbekannt";
  return parsed.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveSystemLabel(toolId?: string | null, toolFreeText?: string | null): string | null {
  const normalizedFreeText = normalizeOptionalText(toolFreeText);
  if (normalizedFreeText) return normalizedFreeText;
  const normalizedToolId = normalizeOptionalText(toolId);
  if (!normalizedToolId || normalizedToolId === TOOL_PLACEHOLDER_ID) return null;
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

// ── Component ───────────────────────────────────────────────────────────────

export default function SupplierInviteFlow({
  requestToken,
  inviteId,
  organisationName,
  supplierOrganisationHint,
  intendedEmail,
  expiresAt,
  inviteStatus,
}: SupplierInviteFlowProps) {
  // If invite is already verified (e.g. page refresh with valid session), go to form
  const initialStep: FlowStep =
    inviteStatus === "verified" ? "form" : "verify";

  const [step, setStep] = useState<FlowStep>(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureErrors, setCaptureErrors] = useState<SharedCaptureFieldErrors>({});
  const [riskAccordionValue, setRiskAccordionValue] = useState<string | undefined>(undefined);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [successState, setSuccessState] = useState<SubmitSuccessState | null>(null);
  const expiresLabel = useMemo(() => formatExpiry(expiresAt), [expiresAt]);
  const maskedEmail = useMemo(() => maskEmail(intendedEmail), [intendedEmail]);
  const supplierMultisystemEnabled = registerFirstFlags.supplierMultisystemCapture;

  const [formData, setFormData] = useState({
    supplierOrganisation: supplierOrganisationHint ?? "",
    aiActCategory: "",
    capture: { ...EMPTY_SUPPLIER_CAPTURE_DRAFT },
  });

  const patchCapture = (patch: Partial<QuickCaptureFieldsDraft>) => {
    setFormData((prev) => ({
      ...prev,
      capture: { ...prev.capture, ...patch },
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
    if (!captureErrors.purpose) return;
    if (formData.capture.purpose.trim().length >= 3) {
      setCaptureErrors((current) => {
        const next = { ...current };
        delete next.purpose;
        return next;
      });
    }
  }, [captureErrors.purpose, formData.capture.purpose]);

  // ── Step 1: Request OTP ───────────────────────────────────────────────

  const handleRequestOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/supplier-invite/${encodeURIComponent(inviteId)}/verify/start`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Code konnte nicht gesendet werden."
        );
      }
      setChallengeId(data.challengeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Senden des Codes.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1b: Verify OTP ───────────────────────────────────────────────

  const handleVerifyOtp = async () => {
    if (!challengeId || otpValue.trim().length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/supplier-invite/${encodeURIComponent(inviteId)}/verify/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId, otp: otpValue.trim() }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Verifikation fehlgeschlagen."
        );
      }
      setStep("form");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verifikation fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Submit Form ───────────────────────────────────────────────

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
        throw new Error("Bitte vervollstaendigen Sie den Verwendungszweck.");
      }

      const response = await fetch("/api/supplier-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestToken,
          supplierEmail: intendedEmail,
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
            ? { aiActCategory: formData.aiActCategory }
            : {}),
          ...(supplierMultisystemEnabled
            ? {
                systems: resolvedSystems,
                workflowConnectionMode:
                  canDescribeRelationship && formData.capture.workflowConnectionMode
                    ? formData.capture.workflowConnectionMode
                    : undefined,
                workflowSummary:
                  canDescribeRelationship && formData.capture.workflowSummary.trim().length > 0
                    ? formData.capture.workflowSummary.trim()
                    : undefined,
              }
            : {}),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Fehler beim Uebermitteln."
        );
      }
      setSuccessState({
        submissionId:
          typeof data?.submissionId === "string" ? data.submissionId : "unbekannt",
        submittedAt:
          typeof data?.submittedAt === "string"
            ? data.submittedAt
            : new Date().toISOString(),
        systemNames:
          Array.isArray(data?.systemNames) &&
          data.systemNames.every((value: unknown) => typeof value === "string")
            ? data.systemNames
            : resolvedSystems,
        nextStepTitle:
          typeof data?.nextStepTitle === "string"
            ? data.nextStepTitle
            : "Interne Sichtung im Register",
        nextStepDescription:
          typeof data?.nextStepDescription === "string"
            ? data.nextStepDescription
            : "Die Angaben werden intern geprueft und dem Register zugeordnet.",
        setupUrl:
          typeof data?.setupUrl === "string" && data.setupUrl.trim().length > 0
            ? data.setupUrl
            : null,
        confirmationEmailSent: data?.confirmationEmailSent === true,
      });
      setStep("success");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Fehler beim Uebermitteln."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetupClick = async () => {
    if (!successState?.setupUrl) {
      return;
    }

    try {
      await fetch("/api/supplier-conversion/signal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteId,
          action: "cta_clicked",
          source: "success_page",
        }),
        keepalive: true,
      });
    } catch {
      // Secondary signal only — navigation should still continue.
    } finally {
      window.location.assign(successState.setupUrl);
    }
  };

  // ── Render: Success ───────────────────────────────────────────────────

  if (step === "success") {
    const submittedAtLabel = formatDate(
      successState?.submittedAt ?? new Date().toISOString()
    );
    const systemSummary = successState?.systemNames?.length
      ? successState.systemNames.join(", ")
      : resolvedSystems.join(", ");
    const purposeSummary = formData.capture.purpose.trim();
    const aiActSummary =
      formData.aiActCategory.trim().length > 0
        ? formData.aiActCategory.trim()
        : "Keine Lieferanten-Einschaetzung angegeben";

    return (
      <PublicIntakeShell
        title="Lieferantenanfrage beantwortet"
        description={`Ihre Angaben wurden an ${organisationName} uebermittelt und werden intern geprueft.`}
        actions={[]}
        meta={
          <p>
            Einreichungs-ID:{" "}
            <span className="font-medium text-slate-950">
              {successState?.submissionId ?? "unbekannt"}
            </span>{" "}
            · uebermittelt am {submittedAtLabel}
          </p>
        }
        asidePoints={[
          "Die Einreichung bleibt als unveraenderlicher Ursprung erhalten.",
          "Freigabe, Ablehnung oder Uebernahme passieren intern im Register.",
          "Sie erhalten damit einen dokumentierten Eingangsbeleg fuer diese Anfrage.",
        ]}
      >
        <div className="space-y-4">
          <PageStatePanel
            tone="success"
            icon={CheckCircle2}
            area="public_external_intake"
            title="Angaben uebermittelt"
            description={
              successState?.confirmationEmailSent
                ? `Vielen Dank. Die Angaben wurden als verifizierte Einreichung im Register von ${organisationName} gespeichert. Eine Bestaetigung wurde an ${maskedEmail} gesendet.`
                : `Vielen Dank. Die Angaben wurden als verifizierte Einreichung im Register von ${organisationName} gespeichert.`
            }
          />

          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <FileText className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <CardTitle>Einreichungsbeleg</CardTitle>
                  <CardDescription>
                    Zusammenfassung der verifizierten Lieferantenangaben fuer diese Anfrage.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Verifiziert als
                  </p>
                  <p className="text-sm text-slate-900">{maskedEmail}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Ihre Organisation
                  </p>
                  <p className="text-sm text-slate-900">
                    {formData.supplierOrganisation.trim() || supplierOrganisationHint || "Nicht angegeben"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Systeme
                  </p>
                  <p className="text-sm text-slate-900">{systemSummary}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    KI-Act-Einschaetzung
                  </p>
                  <p className="text-sm text-slate-900">{aiActSummary}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  Verwendungszweck
                </p>
                <p className="text-sm leading-7 text-slate-900">{purposeSummary}</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  Interner naechster Schritt
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {successState?.nextStepTitle ?? "Interne Sichtung im Register"}
                </p>
                <p className="mt-1 text-sm leading-7 text-slate-600">
                  {successState?.nextStepDescription ??
                    "Die Angaben werden intern geprueft und dem Register zugeordnet."}
                </p>
              </div>
            </CardContent>
          </Card>

          {successState?.setupUrl ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Eigene Nachweise vorbereiten</CardTitle>
                <CardDescription>
                  Falls Sie selbst regelmaessig solche Anfragen beantworten oder an Lieferanten stellen, koennen Sie ein eigenes Register einrichten.
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t bg-white p-6">
                <Button type="button" variant="outline" onClick={() => void handleSetupClick()}>
                  Eigenes Register einrichten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ) : null}
        </div>
      </PublicIntakeShell>
    );
  }

  // ── Render: Verify Step ───────────────────────────────────────────────

  if (step === "verify") {
    return (
      <PublicIntakeShell
        title="Lieferantenanfrage beantworten"
        description={`${organisationName} bittet Sie um Angaben zu Ihrem KI-Einsatz. Bitte bestaetigen Sie zuerst Ihre Identitaet.`}
        actions={[]}
        meta={
          <p>Gueltig bis {expiresLabel}</p>
        }
        asidePoints={[
          "Ihre E-Mail-Adresse wird mit einem Einmalcode verifiziert.",
          "Erst nach erfolgreicher Verifikation koennen Sie das Formular ausfuellen.",
          "Falls Sie nicht der vorgesehene Kontakt sind, wenden Sie sich bitte an den Absender.",
        ]}
      >
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Identitaet bestaetigen</CardTitle>
                <CardDescription>
                  {supplierOrganisationHint
                    ? `Kontaktgebundene Anfrage fuer ${supplierOrganisationHint}`
                    : `Kontaktgebundene Anfrage von ${organisationName}`}
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

            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-700">
                  Ein Bestaetigungscode wird an die hinterlegte Adresse gesendet:
                </p>
                <p className="text-sm font-medium text-slate-950">{maskedEmail}</p>
              </div>

              {!challengeId ? (
                <Button
                  onClick={() => void handleRequestOtp()}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Bestaetigungscode anfordern
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="otp-input">6-stelliger Code</Label>
                    <Input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="123456"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      autoComplete="one-time-code"
                    />
                  </div>
                  <Button
                    onClick={() => void handleVerifyOtp()}
                    disabled={loading || otpValue.trim().length !== 6}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Code pruefen
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setChallengeId(null);
                      setOtpValue("");
                      setError(null);
                    }}
                    className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Neuen Code anfordern
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </PublicIntakeShell>
    );
  }

  // ── Render: Form Step (after verification) ────────────────────────────

  return (
    <PublicIntakeShell
      title="Lieferantenanfrage beantworten"
      description={`${organisationName} bittet Sie um Basisangaben zu Ihrem KI-Einsatz und beteiligten Systemen, damit die Nutzung intern nachvollziehbar dokumentiert und geprueft werden kann.`}
      actions={[]}
      meta={
        <p>
          Verifiziert als{" "}
          <span className="font-medium text-slate-950">{maskedEmail}</span> ·
          gueltig bis {expiresLabel}
        </p>
      }
      asidePoints={[
        "Ihre Angaben werden nicht direkt als interner Use Case gespeichert.",
        "Jede Einreichung bleibt mit Herkunft, Zeit und Verifikation nachvollziehbar.",
        "Der interne naechste Schritt ist Review, Freigabe oder Uebernahme ins Register.",
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
                  Verifizierte Einreichung fuer {organisationName}
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
                  Ihre E-Mail-Adresse wurde verifiziert und ist mit dieser Einreichung verbunden.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ihre Arbeits-E-Mail</Label>
                  <Input
                    value={maskedEmail}
                    disabled
                    className="bg-slate-100 text-slate-600"
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
                purposeHelperText="Kurz und konkret beschreiben, wofuer der Einsatz beim Kunden gedacht ist."
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
                  Risikoklassen-Einschaetzung (optional)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 px-4 pb-4">
                  <div className="space-y-2">
                    <Label>Einschaetzung gemaess EU AI Act</Label>
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
                        <SelectValue placeholder="Optional auswaehlen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Noch keine Einschaetzung</SelectItem>
                        <SelectItem value="Minimales Risiko">Minimales Risiko</SelectItem>
                        <SelectItem value="Geringes Risiko">Geringes Risiko</SelectItem>
                        <SelectItem value="Hochrisiko">Hochrisiko</SelectItem>
                        <SelectItem value="Unbekannt">Noch unklar / Unbekannt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Diese Angabe wird als Lieferanten-Einschaetzung uebernommen und
                    intern separat geprueft.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          <CardFooter className="mt-4 border-t bg-white p-6 pb-6">
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {loading ? "Wird sicher uebermittelt..." : `An ${organisationName} uebermitteln`}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </PublicIntakeShell>
  );
}
