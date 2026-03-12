"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const patch = (p: Partial<CaptureFormData>) => setForm((f) => ({ ...f, ...p }));

  useEffect(() => {
    if (!hasFieldErrors) return;
    setFieldErrors(validateSharedCaptureFields(form).errors);
  }, [form, hasFieldErrors]);

  // Validate code from URL param on mount
  useEffect(() => {
    if (codeParam) {
      validateCode(codeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-6 flex w-full max-w-[480px] items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/register-logo.png" alt="Logo" width={32} height={32} className="h-8 w-8" />
          <span className="text-lg font-semibold">KI-Einsatzfall erfassen</span>
        </div>
        <Link
          href="/my-register"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Zum Register
        </Link>
      </div>

      {/* Loading */}
      {pageState === "loading" && (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      )}

      {/* Enter code manually */}
      {pageState === "enter_code" && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Zugangscode eingeben</CardTitle>
            <CardDescription>
              Gib den Code ein, den du von deinem Admin erhalten hast.
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
              <Label htmlFor="access-code">Code</Label>
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
              Code prüfen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invalid code */}
      {pageState === "invalid" && (
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6">
            <Alert variant="destructive">
              <AlertTitle>{errorTitle}</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => {
                setPageState("enter_code");
                setErrorTitle("Fehler");
                setErrorMsg(null);
              }}
              className="w-full"
            >
              Anderen Code eingeben
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Capture Form */}
      {pageState === "form" && (
        <Card className="w-full max-w-[480px]">
          <CardHeader>
            <CardTitle>KI-Einsatzfall erfassen</CardTitle>
            <CardDescription>
              {codeInfo?.organisationName
                ? `Register: ${codeInfo.organisationName}`
                : codeInfo?.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ownerFallbackInfo && user && (
              <Alert>
                <AlertTitle>Direkter Registerzugang erkannt</AlertTitle>
                <AlertDescription>
                  Sie sind bereits als Registerinhaber:in angemeldet. Dieser Link wird
                  direkt gegen Ihr Register verwendet, auch wenn die öffentliche
                  Code-Prüfung gerade nicht verfügbar ist.
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
                className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground"
              >
                Bitte ergänze die markierten Pflichtfelder, bevor du fortfährst.
              </div>
            )}

            <Button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Einsatzfall erfassen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {pageState === "success" && (
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="text-lg font-semibold">Erfolgreich erfasst</h2>
            <p className="text-sm text-muted-foreground">
              „{createdPurpose}" wurde im Register dokumentiert.
            </p>
            <Button
              onClick={() => {
                setForm({ ...EMPTY_FORM });
                setPageState("form");
                setErrorMsg(null);
              }}
              className="w-full"
            >
              Weiteren Einsatzfall erfassen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
