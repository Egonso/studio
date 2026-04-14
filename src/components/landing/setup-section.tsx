"use client";

import { useState, useEffect, forwardRef } from "react";
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

const ADMIN_STEP_LABELS: Record<AdminStep, string> = {
  1: "Account",
  2: "Organisation",
  3: "Get started",
};

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
        title: "Error",
        description: "Content could not be copied.",
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
        title: "Missing information",
        description: "Please fill in all fields.",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "The password must be at least 6 characters long.",
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
          title: "Please verify your email",
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
          ? "This email address is already in use. Please sign in."
          : error.code === "auth/invalid-email"
            ? "Please enter a valid email address."
            : "Account could not be created. Please try again.";
      toast({ variant: "destructive", title: "Error", description: msg });
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
        title: "Missing information",
        description: "Please enter the organisation name.",
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
          title: "Existing register used",
          description: `No duplicate was created for "${orgNameValue}".`,
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
        title: "Error",
        description:
          "Register could not be created. Please try again.",
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
        title: "Invalid code",
        description: "Please enter a valid invitation code.",
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
        title: "Error",
        description:
          "Code could not be verified. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberSignup = async () => {
    if (!validatedCode) {
      toast({
        variant: "destructive",
        title: "Code missing",
        description: "Please verify the invitation code first.",
      });
      setMemberStep("code");
      return;
    }
    if (!memberName.trim() || !memberEmail.trim() || !memberPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields.",
      });
      return;
    }
    if (memberPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "The password must be at least 6 characters long.",
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
          title: "Please verify your email",
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
          ? "This email address is already in use. Please sign in."
          : error.code === "auth/invalid-email"
            ? "Please enter a valid email address."
            : "Account could not be created. Please try again.";
      toast({ variant: "destructive", title: "Error", description: msg });
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
            Set up register
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
            Use invitation code
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
                {adminStep === 3 ? "You are ready to go" : "KI-Set up register"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Step {adminStepNumber} of {adminTotalSteps} ·{" "}
                {ADMIN_STEP_LABELS[adminStep]}
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
                    Name
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
                    Email address
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
                    Password
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
                    "Continue"
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href={buildLoginPath({
                      mode: "login",
                      email,
                    })}
                    className="hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Sign in directly
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
                    Organisation name
                  </label>
                  <Input
                    id="setup-orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="setup-role">
                    Your role{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <Input
                    id="setup-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. AI Governance Lead"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  If the organisation already exists, the existing
                  register will be used.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Continue"
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
                    Join AI Register
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Enter the invitation code from your organisation.
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
                      Invitation code
                    </label>
                    <Input
                      id="member-code"
                      value={codeInput}
                      onChange={(e) =>
                        setCodeInput(normalizeCode(e.target.value))
                      }
                      placeholder="AI-XXXXXX"
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
                      "Verify"
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
                    Confirm organisation
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Check whether the code belongs to the correct organisation.
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
                    Confirm organisation
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
                    This is not my organisation
                  </button>
                </div>
              </>
            )}

            {/* Signup */}
            {memberStep === "signup" && (
              <>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    Create account
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
                      Name
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
                      Email address
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
                      Password
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
                      "Create account & go to capture"
                    )}
                  </button>
                </form>
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href={buildLoginPath({
                      mode: "login",
                      code: validatedCode,
                      email: memberEmail,
                    })}
                    className="hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Sign in and continue directly
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
