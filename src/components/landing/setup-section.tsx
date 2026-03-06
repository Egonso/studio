"use client";

import { useState, useEffect, forwardRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { registerService } from "@/lib/register-first/register-service";
import { accessCodeService } from "@/lib/register-first/access-code-service";
import { setActiveRegisterId } from "@/lib/register-first/register-settings-client";
import type { User } from "firebase/auth";
import { getPublicAppOrigin } from "@/lib/app-url";
import { getCaptureByCodeErrorCopy } from "@/lib/capture-by-code/error-copy";

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
  1: "Zugang",
  2: "Organisation",
  3: "Team",
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
  const [role, setRole] = useState("KI-Verantwortliche/r");

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
    if (user && adminStep === 1) {
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
        title: "Fehler",
        description: "Inhalt konnte nicht kopiert werden.",
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
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Felder aus.",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Passwort zu kurz",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const auth = await getFirebaseAuth();
      const { createUserWithEmailAndPassword, updateProfile } = await import(
        "firebase/auth"
      );

      const credential = await createUserWithEmailAndPassword(
        auth,
        email.toLowerCase(),
        password
      );
      await updateProfile(credential.user, { displayName: name.trim() });

      setAdminStep(2);
    } catch (error: any) {
      const msg =
        error.code === "auth/email-already-in-use"
          ? "Diese E-Mail-Adresse wird bereits verwendet. Bitte melden Sie sich an."
          : error.code === "auth/invalid-email"
            ? "Bitte geben Sie eine gültige E-Mail-Adresse ein."
            : "Konto konnte nicht erstellt werden. Bitte versuchen Sie es erneut.";
      toast({ variant: "destructive", title: "Fehler", description: msg });
      if (error.code === "auth/email-already-in-use") {
        router.push(
          `/login?mode=login&email=${encodeURIComponent(email.toLowerCase())}`
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
        title: "Fehlende Angabe",
        description: "Bitte geben Sie den Organisationsnamen ein.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const existingRegisters = await registerService.listRegisters();
      const normalizedName = orgNameValue.toLocaleLowerCase("de-DE");
      const existing = existingRegisters.find((register) =>
        [register.organisationName, register.name]
          .filter((value): value is string => Boolean(value))
          .some(
            (value) => value.trim().toLocaleLowerCase("de-DE") === normalizedName
          )
      );

      const registerId = existing
        ? existing.registerId
        : (await registerService.createRegister(orgNameValue)).registerId;
      const contactName = name.trim() || user?.displayName?.trim() || "Unbenannt";
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
          title: "Bestehendes Register verwendet",
          description: `Für "${orgNameValue}" wurde kein Duplikat angelegt.`,
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
        title: "Fehler",
        description:
          "Register konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
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
        title: "Code ungültig",
        description: "Bitte geben Sie einen gültigen Einladungscode ein.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/capture-by-code?code=${encodeURIComponent(code)}`
      );
      const payload = (await response.json().catch(() => ({
        error: "Code konnte nicht überprüft werden.",
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
        title: "Fehler",
        description:
          "Code konnte nicht überprüft werden. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberSignup = async () => {
    if (!validatedCode) {
      toast({
        variant: "destructive",
        title: "Code fehlt",
        description: "Bitte prüfen Sie zuerst den Einladungscode.",
      });
      setMemberStep("code");
      return;
    }
    if (!memberName.trim() || !memberEmail.trim() || !memberPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Felder aus.",
      });
      return;
    }
    if (memberPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Passwort zu kurz",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const auth = await getFirebaseAuth();
      const { createUserWithEmailAndPassword, updateProfile } = await import(
        "firebase/auth"
      );

      const credential = await createUserWithEmailAndPassword(
        auth,
        memberEmail.toLowerCase(),
        memberPassword
      );
      await updateProfile(credential.user, {
        displayName: memberName.trim(),
      });

      router.push(
        `/erfassen?code=${encodeURIComponent(validatedCode)}`
      );
    } catch (error: any) {
      const msg =
        error.code === "auth/email-already-in-use"
          ? "Diese E-Mail-Adresse wird bereits verwendet. Bitte melden Sie sich an."
          : error.code === "auth/invalid-email"
            ? "Bitte geben Sie eine gültige E-Mail-Adresse ein."
            : "Konto konnte nicht erstellt werden. Bitte versuchen Sie es erneut.";
      toast({ variant: "destructive", title: "Fehler", description: msg });
      if (error.code === "auth/email-already-in-use") {
        router.push(
          `/login?mode=login&email=${encodeURIComponent(memberEmail.toLowerCase())}&code=${encodeURIComponent(validatedCode)}`
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
            Register einrichten
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
            Einladungscode verwenden
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
                KI-Register einrichten
              </h2>
              <p className="text-sm text-muted-foreground">
                Schritt {adminStepNumber} von {adminTotalSteps} ·{" "}
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
                    placeholder="Ihr Name"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="setup-email">
                    E-Mail-Adresse
                  </label>
                  <Input
                    id="setup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ihre@organisation.de"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="setup-password"
                  >
                    Passwort
                  </label>
                  <Input
                    id="setup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mindestens 6 Zeichen"
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
                    "Weiter"
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Bereits ein Konto?{" "}
                  <Link
                    href={`/login?mode=login${email ? `&email=${encodeURIComponent(email)}` : ""}`}
                    className="hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Anmelden
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
                    Organisationsname
                  </label>
                  <Input
                    id="setup-orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="z. B. Mustermann GmbH"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="setup-role">
                    Ihre Rolle{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <Input
                    id="setup-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="z. B. KI-Verantwortliche/r"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Falls die Organisation bereits existiert, wird das vorhandene
                  Register verwendet.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Weiter"
                  )}
                </button>
              </form>
            )}

            {/* Step 3: Team invite */}
            {adminStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Ihr Einladungscode
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-md border bg-muted/50 px-4 py-2.5 font-mono text-sm tracking-wider">
                      {inviteCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyValue(inviteCode, "code")}
                      className="rounded-md border p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Code kopieren"
                    >
                      {copiedTarget === "code" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Teilen Sie diesen Code mit Kolleg:innen, die KI-Einsatzfälle
                    in Ihrem Register erfassen sollen.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Erfassungslink teilen
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-md border bg-muted/50 px-4 py-2.5 font-mono text-xs break-all">
                      {captureLink}
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyValue(captureLink, "link")}
                      className="rounded-md border p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Link kopieren"
                    >
                      {copiedTarget === "link" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Der Link führt direkt in die Erfassungsmaske mit
                    vorausgefülltem Code.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Danach öffnen Sie das Register und dokumentieren innerhalb der
                  ersten Minute den ersten Einsatzfall.
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAdminFinish}
                    className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Register öffnen und Einsatzfall erfassen
                  </button>
                  <button
                    type="button"
                    onClick={handleAdminFinish}
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline py-1"
                  >
                    Später fortfahren
                  </button>
                </div>
              </div>
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
                    KI-Register beitreten
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Geben Sie den Einladungscode Ihrer Organisation ein.
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
                      Einladungscode
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
                      "Prüfen"
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
                    Organisation bestätigen
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Prüfen Sie, ob der Code zur richtigen Organisation gehört.
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
                    Organisation bestätigen
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
                    Das ist nicht meine Organisation
                  </button>
                </div>
              </>
            )}

            {/* Signup */}
            {memberStep === "signup" && (
              <>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    Zugang anlegen
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
                      placeholder="Ihr Name"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="member-email"
                    >
                      E-Mail-Adresse
                    </label>
                    <Input
                      id="member-email"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="ihre@organisation.de"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="member-password"
                    >
                      Passwort
                    </label>
                    <Input
                      id="member-password"
                      type="password"
                      value={memberPassword}
                      onChange={(e) => setMemberPassword(e.target.value)}
                      placeholder="Mindestens 6 Zeichen"
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
                      "Konto anlegen & zur Erfassung"
                    )}
                  </button>
                </form>
                <p className="text-center text-xs text-muted-foreground">
                  Bereits ein Konto?{" "}
                  <Link
                    href={`/login?mode=login&code=${encodeURIComponent(validatedCode)}${memberEmail ? `&email=${encodeURIComponent(memberEmail)}` : ""}`}
                    className="hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Anmelden und direkt fortfahren
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
