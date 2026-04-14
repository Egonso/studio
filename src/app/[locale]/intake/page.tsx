"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { registerFirstFlags } from "@/lib/register-first/flags";

type PageState = "loading" | "enter_code" | "invalid" | "form" | "success";

interface CodeInfo {
  label: string;
  organisationName: string | null;
}

interface OwnerCaptureFallbackInfo {
  code: string;
  registerId: string;
  label: string | null;
  organisationName: string | null;
}

type CaptureFormData = QuickCaptureFieldsDraft;

const EMPTY_FORM: CaptureFormData = {
  purpose: "",
  ownerRole: "",
  contactPersonName: "",
  toolId: TOOL_PLACEHOLDER_ID,
  toolFreeText: "",
  systems: [],
  workflowConnectionMode: null,
  workflowSummary: "",
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

async function resolveOwnerCaptureFallback(
  code: string,
): Promise<OwnerCaptureFallbackInfo | null> {
  const { resolveOwnedCaptureCodeFallback } = await import(
    "@/lib/capture-by-code/client-fallback"
  );
  return resolveOwnedCaptureCodeFallback(code);
}

async function submitOwnerCaptureFallback(input: {
  code: string;
  registerId: string;
  accessCodeLabel?: string | null;
  purpose: string;
  toolId?: string;
  toolFreeText?: string;
  workflow?: import("@/lib/register-first/types").UseCaseWorkflow;
  usageContexts: import("@/lib/register-first/types").CaptureUsageContext[];
  dataCategories?: import("@/lib/register-first/types").DataCategory[];
  decisionInfluence?: import("@/lib/register-first/types").DecisionInfluence;
  ownerRole: string;
  contactPersonName?: string;
}) {
  const { submitOwnedCaptureCodeFallback } = await import(
    "@/lib/capture-by-code/client-fallback"
  );
  return submitOwnedCaptureCodeFallback(input);
}

export default function IntakePage() {
  const t = useTranslations();
  const multisystemEnabled = registerFirstFlags.multisystemCapture;
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const codeParam = searchParams.get("code");

  const [pageState, setPageState] = useState<PageState>(codeParam ? "loading" : "enter_code");
  const [code, setCode] = useState(codeParam || "");
  const [codeInfo, setCodeInfo] = useState<CodeInfo | null>(null);
  const [ownerFallbackInfo, setOwnerFallbackInfo] = useState<OwnerCaptureFallbackInfo | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>("");
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
    setFieldErrors(
      validateSharedCaptureFields(form, {
        multisystemEnabled,
      }).errors
    );
  }, [form, hasFieldErrors, multisystemEnabled]);

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
    setErrorTitle(t('common.error'));
    setErrorMsg(null);
    setOwnerFallbackInfo(null);
    try {
      const res = await fetch(`/api/capture-by-code?code=${encodeURIComponent(c)}`);
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "The code could not be verified." })) as {
            error?: string;
          };
        if (res.status === 503) {
          if (isLocalCaptureDevelopment()) {
            console.warn(
              "Public capture is unavailable locally because the server has no Firebase Admin credentials. Configure ADC or a service account for no-login capture routes."
            );
          }
          const fallbackInfo = await resolveOwnerCaptureFallback(c);
          if (fallbackInfo) {
            setCodeInfo({
              label: fallbackInfo.label ?? "Direct register access",
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
      const fallbackInfo = await resolveOwnerCaptureFallback(c);
      if (fallbackInfo) {
        setCodeInfo({
          label: fallbackInfo.label ?? "Direct register access",
          organisationName: fallbackInfo.organisationName,
        });
        setOwnerFallbackInfo(fallbackInfo);
        setCode(c);
        setPageState("form");
        return;
      }
      setErrorTitle(t('common.error'));
      setErrorMsg(t('intake.errors.connectionError'));
      setPageState("invalid");
    }
  }

  async function handleSubmit() {
    setErrorTitle(t('common.error'));
    setErrorMsg(null);
    const validation = validateSharedCaptureFields(form, {
      multisystemEnabled,
    });
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      focusCaptureField(validation.firstInvalidField);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      if (ownerFallbackInfo) {
        const card = await submitOwnerCaptureFallback({
          code,
          registerId: ownerFallbackInfo.registerId,
          accessCodeLabel: ownerFallbackInfo.label,
          purpose: validation.normalized.purpose,
          toolId: validation.normalized.toolId,
          toolFreeText: validation.normalized.toolFreeText,
          workflow: validation.normalized.workflow,
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
          systems: form.systems,
          workflowConnectionMode: form.workflowConnectionMode,
          workflowSummary: form.workflowSummary,
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
          .catch(() => ({ error: "Error while saving." })) as {
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
      setErrorTitle(t('common.error'));
      setErrorMsg(t('intake.errors.connectionError'));
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
      title={t('intake.title')}
      description={t('intake.descriptionFull')}
      meta={
        codeInfo ? (
          <p>
            {t('intake.targetRegister')}:{" "}
            <span className="font-medium text-slate-950">
              {codeInfo.organisationName ?? codeInfo.label}
            </span>
          </p>
        ) : null
      }
      asidePoints={[
        t('intake.asidePoints.0'),
        t('intake.asidePoints.1'),
        t('intake.asidePoints.2'),
      ]}
    >
      {pageState === "loading" && (
        <PageStatePanel
          tone="loading"
          area="public_external_intake"
          title={t('intake.verifyingCode')}
          description={t('intake.verifyingCodeDesc')}
        />
      )}

      {pageState === "enter_code" && (
        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle>{t('intake.enterCode')}</CardTitle>
            <CardDescription>
              {t('intake.enterCodeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive">
                <AlertTitle>{t('common.error')}</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="access-code">{t('intake.accessCode')}</Label>
              <Input
                id="access-code"
                placeholder={t('intake.accessCodePlaceholder')}
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
              {t('intake.continueToIntake')}
            </Button>
          </CardContent>
        </Card>
      )}

      {pageState === "invalid" && (
        <PageStatePanel
          tone="error"
          area="public_external_intake"
          title={errorTitle}
          description={errorMsg ?? t('intake.errors.invalidCode')}
          actions={
            <Button
              variant="outline"
              onClick={() => {
                setPageState("enter_code");
                setErrorTitle(t('common.error'));
                setErrorMsg(null);
              }}
            >
              {t('intake.errors.enterDifferentCode')}
            </Button>
          }
        />
      )}

      {pageState === "form" && (
        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle>{t('intake.submitDetails')}</CardTitle>
            <CardDescription>
              {codeInfo?.organisationName
                ? t('intake.sendingTo', { orgName: codeInfo.organisationName })
                : codeInfo?.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ownerFallbackInfo && user && (
              <Alert>
                <AlertTitle>{t('intake.directAccess')}</AlertTitle>
                <AlertDescription>
                  {t('intake.directAccessDescription')}
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
                {t('intake.errors.fillRequired')}
              </div>
            )}

            <Button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? t('intake.submitting') : t('intake.submit')}
            </Button>
          </CardContent>
        </Card>
      )}

      {pageState === "success" && (
        <PageStatePanel
          tone="success"
          icon={CheckCircle2}
          area="public_external_intake"
          title={t('intake.submissionSaved')}
          description={t('intake.submissionSavedDescription', { purpose: createdPurpose })}
          actions={
            <>
              <Button
                onClick={() => {
                  setForm({ ...EMPTY_FORM });
                  setPageState("form");
                  setErrorMsg(null);
                }}
              >
                {t('intake.submitAnother')}
              </Button>
              <Button asChild variant="outline">
                <Link href="/?mode=signup&intent=create_register">
                  {t('intake.createRegister')}
                </Link>
              </Button>
            </>
          }
        />
      )}
    </PublicIntakeShell>
  );
}
