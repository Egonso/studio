"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageStatePanel, PublicIntakeShell } from "@/components/product-shells";
import { useAuth } from "@/context/auth-context";
import { getCaptureByCodeErrorCopy } from "@/lib/capture-by-code/error-copy";
import {
  resolveOwnedCaptureCodeFallback,
  submitOwnedCaptureCodeFallback,
  type OwnerCaptureFallbackInfo,
} from "@/lib/capture-by-code/client-fallback";
import {
  QuickCaptureFields,
  TOOL_PLACEHOLDER_ID,
  type QuickCaptureFieldsDraft,
} from "@/components/register/quick-capture-fields";
import {
  SHARED_CAPTURE_FIELD_IDS,
  validateSharedCaptureFields,
  type SharedCaptureFieldErrors,
  type SharedCaptureFieldName,
} from "@/lib/register-first/shared-capture-fields";

type PageState = "loading" | "enter_code" | "invalid" | "form" | "success";

interface CodeInfo {
  label: string;
  organisationName: string | null;
}

type CaptureFormData = QuickCaptureFieldsDraft;

const EMPTY_FORM: CaptureFormData = {
  purpose: "",
  ownerRole: "",
  contactPersonName: "",
  toolId: TOOL_PLACEHOLDER_ID,
  toolFreeText: "",
  usageContexts: [],
  dataCategories: [],
  decisionInfluence: null,
};

function isLocalCaptureDevelopment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export default function ErfassenPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const codeParam = searchParams.get("code");

  const [pageState, setPageState] = useState<PageState>(codeParam ? "loading" : "enter_code");
  const [code, setCode] = useState(codeParam || "");
  const [codeInfo, setCodeInfo] = useState<CodeInfo | null>(null);
  const [ownerFallbackInfo, setOwnerFallbackInfo] = useState<OwnerCaptureFallbackInfo | null>(null);
  const [errorTitle, setErrorTitle] = useState("Fehler");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SharedCaptureFieldErrors>({});
  const [form, setForm] = useState<CaptureFormData>({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPurpose, setCreatedPurpose] = useState("");
  const validatedCodeRef = useRef<string | null>(null);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const patch = (p: Partial<CaptureFormData>) => setForm((f) => ({ ...f, ...p }));

  useEffect(() => {
    if (!hasFieldErrors) return;
    setFieldErrors(validateSharedCaptureFields(form).errors);
  }, [form, hasFieldErrors]);

  // Validate code from URL param on mount
  useEffect(() => {
    if (!codeParam || validatedCodeRef.current === codeParam) {
      return;
    }

    validatedCodeRef.current = codeParam;
    void validateCode(codeParam);
  }, [codeParam]);

  async function validateCode(c: string) {
    setPageState("loading");
    setErrorTitle("Fehler");
    setErrorMsg(null);
    setOwnerFallbackInfo(null);
    try {
      const res = await fetch(`/api/capture-by-code?code=${encodeURIComponent(c)}`);
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Code konnte nicht geprüft werden." })) as {
            error?: string;
          };
        if (res.status === 503) {
          if (isLocalCaptureDevelopment()) {
            console.warn(
              "Public capture is unavailable locally because the server has no Firebase Admin credentials. Configure ADC or a service account for no-login capture routes."
            );
          }
          const fallbackInfo = await resolveOwnedCaptureCodeFallback(c);
          if (fallbackInfo) {
            setCodeInfo({
              label: fallbackInfo.label ?? "Direkter Registerzugang",
              organisationName: fallbackInfo.organisationName,
            });
            setOwnerFallbackInfo(fallbackInfo);
            setCode(c);
            setPageState("form");
            return;
          }
        }
        const copy = getCaptureByCodeErrorCopy(res.status, data.error, "validate");
        setErrorTitle(copy.title);
        setErrorMsg(copy.description);
        setPageState("invalid");
        return;
      }
      const data = await res.json();
      setCodeInfo({ label: data.label, organisationName: data.organisationName });
      setCode(c);
      setPageState("form");
    } catch {
      const fallbackInfo = await resolveOwnedCaptureCodeFallback(c);
      if (fallbackInfo) {
        setCodeInfo({
          label: fallbackInfo.label ?? "Direkter Registerzugang",
          organisationName: fallbackInfo.organisationName,
        });
        setOwnerFallbackInfo(fallbackInfo);
        setCode(c);
        setPageState("form");
        return;
      }
      setErrorTitle("Verbindungsfehler");
      setErrorMsg("Verbindungsfehler. Bitte versuche es erneut.");
      setPageState("invalid");
    }
  }

  async function handleSubmit() {
    setErrorTitle("Fehler");
    setErrorMsg(null);
    const validation = validateSharedCaptureFields(form);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      focusCaptureField(validation.firstInvalidField);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      if (ownerFallbackInfo) {
        const card = await submitOwnedCaptureCodeFallback({
          code,
          registerId: ownerFallbackInfo.registerId,
          accessCodeLabel: ownerFallbackInfo.label,
          purpose: validation.normalized.purpose,
          toolId: validation.normalized.toolId,
          toolFreeText: validation.normalized.toolFreeText,
          usageContexts: validation.normalized.usageContexts,
          dataCategories: validation.normalized.dataCategories,
          decisionInfluence: validation.normalized.decisionInfluence,
          ownerRole: validation.normalized.ownerRole,
          contactPersonName: validation.normalized.contactPersonName,
        });
        setCreatedPurpose(card.purpose);
        setPageState("success");
        return;
      }

      const res = await fetch("/api/capture-by-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          purpose: validation.normalized.purpose,
          toolId: validation.normalized.toolId,
          toolFreeText: validation.normalized.toolFreeText,
          usageContexts: validation.normalized.usageContexts,
          dataCategories: validation.normalized.dataCategories,
          decisionInfluence: validation.normalized.decisionInfluence,
          ownerRole: validation.normalized.ownerRole,
          contactPersonName: validation.normalized.contactPersonName,
        }),
      });

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Fehler beim Speichern." })) as {
            error?: string;
          };
        if (res.status === 503 && isLocalCaptureDevelopment()) {
          console.warn(
            "Public capture submission is unavailable locally because the server has no Firebase Admin credentials. Configure ADC or a service account for no-login capture routes."
          );
        }
        const copy = getCaptureByCodeErrorCopy(res.status, data.error, "submit");
        setErrorTitle(copy.title);
        setErrorMsg(copy.description);
        return;
      }

      setCreatedPurpose(validation.normalized.purpose);
      setPageState("success");
    } catch {
      setErrorTitle("Verbindungsfehler");
      setErrorMsg("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const focusCaptureField = (fieldName: SharedCaptureFieldName | null) => {
    if (!fieldName) return;
    const fieldId = SHARED_CAPTURE_FIELD_IDS[fieldName];
    window.requestAnimationFrame(() => {
      const element = document.getElementById(fieldId);
      if (!element) return;
      element.scrollIntoView({ block: "center", behavior: "smooth" });
      if (element instanceof HTMLElement) {
        element.focus();
      }
    });
  };

  return (
    <PublicIntakeShell
      title="KI-Einsatzfall ohne Login erfassen"
      description="Nutzen Sie einen Zugangscode, um Angaben direkt in das richtige Register einzureichen. Das Formular ist vom internen Arbeitsbereich getrennt und dient nur der strukturierten Erfassung."
      meta={
        codeInfo ? (
          <p>
            Zielregister:{" "}
            <span className="font-medium text-slate-950">
              {codeInfo.organisationName ?? codeInfo.label}
            </span>
          </p>
        ) : null
      }
      asidePoints={[
        "Angaben werden als nachvollziehbarer Eingang gespeichert und intern geprüft.",
        "Öffentliche Formulare zeigen keine internen Register- oder Governance-Ansichten.",
        "Nach dem Absenden ist der nächste Schritt intern: dokumentieren, reviewen oder nachfassen.",
      ]}
    >
      {pageState === "loading" && (
        <PageStatePanel
          tone="loading"
          area="public_external_intake"
          title="Code wird geprüft"
          description="Wir prüfen, ob dieser Zugangscode aktiv ist und zu einem gültigen Register gehört."
        />
      )}

      {pageState === "enter_code" && (
        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle>Zugangscode eingeben</CardTitle>
            <CardDescription>
              Geben Sie den Code ein, den Sie von der verantwortlichen Organisation erhalten haben.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive">
                <AlertTitle>Fehler</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="access-code">Zugangscode</Label>
              <Input
                id="access-code"
                placeholder="z. B. AI-K7M2X9"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>
            <Button
              onClick={() => validateCode(code)}
              disabled={code.trim().length < 4}
              className="w-full"
            >
              Weiter zur Erfassung
            </Button>
          </CardContent>
        </Card>
      )}

      {pageState === "invalid" && (
        <PageStatePanel
          tone="error"
          area="public_external_intake"
          title={errorTitle}
          description={errorMsg ?? "Dieser Zugangscode konnte nicht verwendet werden."}
          actions={
            <Button
              variant="outline"
              onClick={() => {
                setPageState("enter_code");
                setErrorTitle("Fehler");
                setErrorMsg(null);
              }}
            >
              Anderen Code eingeben
            </Button>
          }
        />
      )}

      {pageState === "form" && (
        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle>Angaben einreichen</CardTitle>
            <CardDescription>
              {codeInfo?.organisationName
                ? `Diese Einreichung geht an ${codeInfo.organisationName}.`
                : codeInfo?.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ownerFallbackInfo && user && (
              <Alert>
                <AlertTitle>Direkter Registerzugang erkannt</AlertTitle>
                <AlertDescription>
                  Sie sind als Registerinhaber:in angemeldet. Dieser Link wird direkt Ihrem Register zugeordnet, auch wenn die öffentliche Codeprüfung gerade nicht verfügbar ist.
                </AlertDescription>
              </Alert>
            )}
            {errorMsg && (
              <Alert variant="destructive">
                <AlertTitle>{errorTitle}</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <QuickCaptureFields
              draft={form}
              onChange={patch}
              autoFocusPurpose
              errors={fieldErrors}
            />
            {hasFieldErrors && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-foreground"
              >
                Bitte ergänzen Sie die markierten Pflichtfelder, bevor Sie fortfahren.
              </div>
            )}

            <Button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Einreichung absenden
            </Button>
          </CardContent>
        </Card>
      )}

      {pageState === "success" && (
        <PageStatePanel
          tone="success"
          icon={CheckCircle2}
          area="public_external_intake"
          title="Einreichung gespeichert"
          description={`„${createdPurpose}“ wurde als nachvollziehbare externe Einreichung aufgenommen.`}
          actions={
            <>
              <Button
                onClick={() => {
                  setForm({ ...EMPTY_FORM });
                  setPageState("form");
                  setErrorMsg(null);
                }}
              >
                Weiteren Einsatzfall erfassen
              </Button>
              <Button asChild variant="outline">
                <Link href="/?mode=signup&intent=create_register">
                  Eigenes Register anlegen
                </Link>
              </Button>
            </>
          }
        />
      )}
    </PublicIntakeShell>
  );
}
