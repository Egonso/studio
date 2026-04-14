"use client";

import { useState, useEffect, forwardRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { TeamShareStep } from "@/components/onboarding/team-share-step";
import { authenticateWithEmailPassword } from "@/lib/auth/auth-entry-controller";
import { registerService } from "@/lib/register-first/register-service";
import { accessCodeService } from "@/lib/register-first/access-code-service";
import { setActiveRegisterId } from "@/lib/register-first/register-settings-client";
import type { User } from "firebase/auth";
import { getPublicAppOrigin } from "@/lib/app-url";
import { getCaptureByCodeErrorCopy } from "@/lib/capture-by-code/error-copy";
import { buildLoginPath } from "@/lib/auth/login-routing";
import { APP_LOCALE } from "@/lib/locale";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type EntryMode = "admin" | "member";
type AdminStep = 1 | 2 | 3;
type MemberStep = "code" | "confirm" | "signup";
type CopyTarget = "code" | "link" | null;

interface SetupSectionProps {
  entryMode: EntryMode;
  onEntryModeChange: (mode: EntryMode) => void;
  user: User | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const SetupSection = forwardRef<HTMLElement, SetupSectionProps>(
  function SetupSection({ entryMode, onEntryModeChange, user }, ref) {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();

  /* ---------- shared ---------- */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------- admin flow ---------- */
  const [adminStep, setAdminStep] = useState<AdminStep>(1);
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget>(null);
  const [targetRegisterId, setTargetRegisterId] = useState<string | null>(null);

  // Step 1: Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Organisation
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("AI Governance Lead");

  // Step 3: Invite code
  const [inviteCode, setInviteCode] = useState("");
  const [captureLink, setCaptureLink] = useState("");

  /* ---------- member flow ---------- */
  const [memberStep, setMemberStep] = useState<MemberStep>("code");
  const [codeInput, setCodeInput] = useState("");
  const [validatedCode, setValidatedCode] = useState("");
  const [memberOrgName, setMemberOrgName] = useState<string | null>(null);
  const [memberOrgLabel, setMemberOrgLabel] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("");

  /* ---------- skip step 1 if already logged in ---------- */
  useEffect(() => {
    if (user && user.emailVerified && adminStep === 1) {
      if (!name && user.displayName) setName(user.displayName);
      if (!email && user.email) setEmail(user.email);
      setAdminStep(2);
    }
  }, [user, adminStep, name, email]);

  /* ---------- copy helper ---------- */
  const copyValue = async (
    value: string,
    target: Exclude<CopyTarget, null>
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedTarget(target);
      setTimeout(() => setCopiedTarget(null), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("landing.copyFailed"),
      });
    }
  };

  /* ================================================================ */
  /*  Admin handlers (from einrichten/page.tsx)                        */
  /* ================================================================ */

  const handleAdminStep1 = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.errors.fillAllFields"),
      });
      return;
    }
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.errors.passwordTooShort"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authenticateWithEmailPassword({
        action: "signup",
        context: {
          mode: "signup",
          intent: "create_register",
        },
        displayName: name.trim(),
        email,
        password,
      });

      if (result.requiresEmailVerification) {
        toast({
          title: t("auth.emailVerificationRequired"),
          description:
            "Your account has been created. We have sent you a verification link. After confirmation you can proceed to step 2.",
        });
        setPassword("");
        return;
      }

      setAdminStep(2);
    } catch (error: any) {
      const msg =
        error.code === "auth/email-already-in-use"
          ? t("auth.errors.emailAlreadyInUse")
          : error.code === "auth/invalid-email"
            ? t("auth.errors.invalidEmail")
            : t("auth.errors.accountCreateFailed");
      toast({ variant: "destructive", title: t("common.error"), description: msg });
      if (error.code === "auth/email-already-in-use") {
        router.push(
          buildLoginPath({
            mode: "login",
            email: email.toLowerCase(),
          })
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminStep2 = async () => {
    const orgNameValue = orgName.trim();
    const roleValue = role.trim();
    if (!orgNameValue) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.errors.enterOrgName"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const existingRegisters = await registerService.listRegisters();
      const normalizedName = orgNameValue.toLocaleLowerCase(APP_LOCALE);
      const existing = existingRegisters.find((register) =>
        [register.organisationName, register.name]
          .filter((value): value is string => Boolean(value))
          .some(
            (value) => value.trim().toLocaleLowerCase(APP_LOCALE) === normalizedName
          )
      );

      const registerId = existing
        ? existing.registerId
        : (await registerService.createRegister(orgNameValue)).registerId;
      const contactName = name.trim() || user?.displayName?.trim() || "Unnamed";
      const contactEmail =
        email.trim().toLowerCase() || user?.email?.toLowerCase() || "";

      await registerService.updateRegisterProfile(registerId, {
        organisationName: orgNameValue,
        orgSettings: {
          organisationName: orgNameValue,
          industry: "",
          contactPerson: { name: contactName, email: contactEmail },
          rolesFramework: roleValue ? { booleanDefined: true } : null,
          ...(roleValue
            ? {
                raci: {
                  aiOwner: {
                    name: contactName,
                    ...(contactEmail ? { email: contactEmail } : {}),
                    department: roleValue,
                  },
                },
              }
            : {}),
        },
      });

      setActiveRegisterId(registerId);
      setTargetRegisterId(registerId);
      if (existing) {
        toast({
          title: t("landing.existingRegisterUsed"),
          description: t("landing.existingRegisterUsedDesc", { orgName: orgNameValue }),
        });
      }

      // Generate invitation code
      const codeEntry = await accessCodeService.generateCode(registerId, {
        label: "Onboarding",
        expiryOption: "90_DAYS",
      });

      setInviteCode(codeEntry.code);
      setCaptureLink(
        `${getPublicAppOrigin()}/erfassen?code=${encodeURIComponent(codeEntry.code)}`
      );
      setAdminStep(3);
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("landing.registerCreateFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminFinish = () => {
    if (targetRegisterId) {
      setActiveRegisterId(targetRegisterId);
    }
    router.push("/my-register?onboarding=true");
  };

  /* ================================================================ */
  /*  Member handlers (from einladen/page.tsx)                         */
  /* ================================================================ */

  const handleValidateCode = async () => {
    const code = normalizeCode(codeInput);
    if (!code || code.length < 3) {
      toast({
        variant: "destructive",
        title: t("landing.invalidCode"),
        description: t("landing.invalidCodeDesc"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/capture-by-code?code=${encodeURIComponent(code)}`
      );
      const payload = (await response.json().catch(() => ({
        error: "Code could not be verified.",
      }))) as {
        error?: string;
        organisationName?: string | null;
        label?: string | null;
      };

      if (!response.ok) {
        const copy = getCaptureByCodeErrorCopy(
          response.status,
          payload.error,
          "validate"
        );
        toast({
          variant: "destructive",
          title: copy.title,
          description: copy.description,
        });
        return;
      }

      setCodeInput(code);
      setValidatedCode(code);
      setMemberOrgName(payload.organisationName ?? null);
      setMemberOrgLabel(payload.label ?? null);
      setMemberStep("confirm");
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.errors.codeVerificationFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberSignup = async () => {
    if (!validatedCode) {
      toast({
        variant: "destructive",
        title: t("landing.codeMissing"),
        description: t("landing.codeMissingDesc"),
      });
      setMemberStep("code");
      return;
    }
    if (!memberName.trim() || !memberEmail.trim() || !memberPassword.trim()) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.errors.fillAllFields"),
      });
      return;
    }
    if (memberPassword.length < 6) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.errors.passwordTooShort"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authenticateWithEmailPassword({
        action: "signup",
        context: {
          mode: "signup",
          intent: "join_register",
          code: validatedCode,
        },
        displayName: memberName.trim(),
        email: memberEmail,
        password: memberPassword,
      });

      if (result.requiresEmailVerification) {
        toast({
          title: t("auth.emailVerificationRequired"),
          description:
            "Your account has been created. We have sent you a verification link. After confirmation you can join the register.",
        });
        setMemberPassword("");
        return;
      }

      router.push(
        `/erfassen?code=${encodeURIComponent(validatedCode)}`
      );
    } catch (error: any) {
      const msg =
        error.code === "auth/email-already-in-use"
          ? t("auth.errors.emailAlreadyInUse")
          : error.code === "auth/invalid-email"
            ? t("auth.errors.invalidEmail")
            : t("auth.errors.accountCreateFailed");
      toast({ variant: "destructive", title: t("common.error"), description: msg });
      if (error.code === "auth/email-already-in-use") {
        router.push(
          buildLoginPath({
            mode: "login",
            email: memberEmail.toLowerCase(),
            code: validatedCode,
          })
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const adminStepNumber = adminStep;
  const adminTotalSteps = 3;

  return (
    <section ref={ref} id="einrichten" className="w-full">
      <div className="max-w-md mx-auto w-full space-y-8">
        {/* Mode toggle */}
        <div className="flex items-center gap-4 border-b">
          <button
            type="button"
            onClick={() => onEntryModeChange("admin")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              entryMode === "admin"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("landing.setupRegister")}
          </button>
          <button
            type="button"
            onClick={() => onEntryModeChange("member")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              entryMode === "member"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("landing.useInvitationCode")}
          </button>
        </div>

        {/* ============================================================ */}
        {/*  ADMIN FLOW                                                   */}
        {/* ============================================================ */}
        {entryMode === "admin" && (
          <>
            {/* Title + progress */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">
                {adminStep === 3 ? t("landing.youAreReadyToGo") : t("landing.kiSetUpRegister")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("common.stepOf", { current: adminStepNumber, total: adminTotalSteps })} ·{" "}
                {t(`landing.adminStep${adminStep}`)}
              </p>
              <div className="flex items-center gap-1 pt-1">
                {([1, 2, 3] as AdminStep[]).map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      s <= adminStep ? "bg-foreground" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step 1: Account */}
            {adminStep === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleAdminStep1();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="setup-name">
                    {t("landing.yourName")}
                  </label>
                  <Input
                    id="setup-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="setup-email">
                    {t("common.emailLabel")}
                  </label>
                  <Input
                    id="setup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@organisation.com"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="setup-password"
                  >
                    {t("common.passwordLabel")}
                  </label>
                  <Input
                    id="setup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    t("common.continue")
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  {t("landing.alreadyHaveAccount")}{" "}
                  <Link
                    href={buildLoginPath({
                      mode: "login",
                      email,
                    })}
                    className="hover:text-foreground underline-offset-2 hover:underline"
                  >
                    {t("landing.signInDirectly")}
                  </Link>
                </p>
              </form>
            )}

            {/* Step 2: Organisation */}
            {adminStep === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleAdminStep2();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="setup-orgName"
                  >
                    {t("landing.orgNameLabel")}
                  </label>
                  <Input
                    id="setup-orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder={t("landing.orgNamePlaceholder")}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="setup-role">
                    {t("landing.roleLabel")}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({t("common.optional")})
                    </span>
                  </label>
                  <Input
                    id="setup-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder={t("landing.rolePlaceholder")}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("landing.orgExistsNote")}
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    t("common.continue")
                  )}
                </button>
              </form>
            )}

            {/* Step 3: Team invite */}
            {adminStep === 3 && (
              <TeamShareStep
                inviteCode={inviteCode}
                captureLink={captureLink}
                copiedTarget={copiedTarget}
                onCopyValue={copyValue}
                onContinue={handleAdminFinish}
              />
            )}
          </>
        )}

        {/* ============================================================ */}
        {/*  MEMBER FLOW                                                  */}
        {/* ============================================================ */}
        {entryMode === "member" && (
          <>
            {/* Code Entry */}
            {memberStep === "code" && (
              <>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    {t("landing.joinAiRegister")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("landing.enterCodeDesc")}
                  </p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleValidateCode();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="member-code"
                    >
                      {t("landing.inviteCodeLabel")}
                    </label>
                    <Input
                      id="member-code"
                      value={codeInput}
                      onChange={(e) =>
                        setCodeInput(normalizeCode(e.target.value))
                      }
                      placeholder={t("landing.inviteCodePlaceholder")}
                      className="font-mono tracking-wider"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      t("common.verify")
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Confirmation */}
            {memberStep === "confirm" && (
              <>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    {t("landing.confirmOrgTitle")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("landing.confirmOrgDesc")}
                  </p>
                </div>
                <div className="rounded-md border p-4 space-y-1">
                  {memberOrgName ? (
                    <p className="text-sm font-medium">{memberOrgName}</p>
                  ) : memberOrgLabel ? (
                    <p className="text-sm font-medium">{memberOrgLabel}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Organisation</p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono">
                    Code: {validatedCode}
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setMemberStep("signup")}
                    className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {t("landing.confirmOrgTitle")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMemberStep("code");
                      setValidatedCode("");
                      setMemberOrgName(null);
                      setMemberOrgLabel(null);
                    }}
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline py-1"
                  >
                    {t("landing.notMyOrg")}
                  </button>
                </div>
              </>
            )}

            {/* Signup */}
            {memberStep === "signup" && (
              <>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    {t("landing.createAccountTitle")}
                  </h2>
                  {(memberOrgName || memberOrgLabel) && (
                    <p className="text-sm text-muted-foreground">
                      für {memberOrgName || memberOrgLabel}
                    </p>
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleMemberSignup();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="member-name"
                    >
                      {t("landing.yourName")}
                    </label>
                    <Input
                      id="member-name"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Your name"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="member-email"
                    >
                      {t("common.emailLabel")}
                    </label>
                    <Input
                      id="member-email"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="your@organisation.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="member-password"
                    >
                      {t("common.passwordLabel")}
                    </label>
                    <Input
                      id="member-password"
                      type="password"
                      value={memberPassword}
                      onChange={(e) => setMemberPassword(e.target.value)}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      t("landing.createAccountAndCapture")
                    )}
                  </button>
                </form>
                <p className="text-center text-xs text-muted-foreground">
                  {t("landing.alreadyHaveAccount")}{" "}
                  <Link
                    href={buildLoginPath({
                      mode: "login",
                      code: validatedCode,
                      email: memberEmail,
                    })}
                    className="hover:text-foreground underline-offset-2 hover:underline"
                  >
                    {t("landing.signInAndContinue")}
                  </Link>
                </p>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
});
