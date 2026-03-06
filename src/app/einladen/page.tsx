"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { ThemeAwareLogo } from "@/components/theme-aware-logo";
import { getCaptureByCodeErrorCopy } from "@/lib/capture-by-code/error-copy";

type MemberStep = "code" | "confirm" | "signup";

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<MemberStep>("code");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Code
  const [codeInput, setCodeInput] = useState("");
  const [validatedCode, setValidatedCode] = useState("");
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgLabel, setOrgLabel] = useState<string | null>(null);

  // Signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const codeFromQuery = searchParams.get("code");

  // Pre-fill code from query param
  useEffect(() => {
    if (codeFromQuery) {
      setCodeInput(normalizeCode(codeFromQuery));
    }
  }, [codeFromQuery]);

  const validateCode = async (providedCode?: string) => {
    const code = normalizeCode(providedCode ?? codeInput);
    if (!code || code.length < 3) {
      toast({
        variant: "destructive",
        title: "Code ungültig",
        description: "Bitte geben Sie einen gültigen Einladungscode ein.",
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/capture-by-code?code=${encodeURIComponent(code)}`);
      const payload = await response
        .json()
        .catch(() => ({ error: "Code konnte nicht überprüft werden." })) as {
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
        return false;
      }

      setCodeInput(code);
      setValidatedCode(code);
      setOrgName(payload.organisationName ?? null);
      setOrgLabel(payload.label ?? null);
      setStep("confirm");
      return true;
    } catch {
      toast({
        variant: "destructive",
        title: "Fehler",
        description:
          "Code konnte nicht überprüft werden. Bitte versuchen Sie es erneut.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateCode = async () => {
    await validateCode();
  };

  const handleSignup = async () => {
    if (!validatedCode) {
      toast({
        variant: "destructive",
        title: "Code fehlt",
        description: "Bitte prüfen Sie zuerst den Einladungscode.",
      });
      setStep("code");
      return;
    }
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

      router.push(`/erfassen?code=${encodeURIComponent(validatedCode)}`);
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
          `/login?mode=login&email=${encodeURIComponent(email.toLowerCase())}&code=${encodeURIComponent(validatedCode)}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <ThemeAwareLogo
            alt="KI-Register"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span className="text-sm font-medium">KI-Register</span>
        </Link>
        <Link
          href={`/login?mode=login${codeFromQuery ? `&code=${encodeURIComponent(normalizeCode(codeFromQuery))}` : ""}`}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          Anmelden
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-6 pt-12 pb-24">
        <div className="max-w-md w-full space-y-8">
          {/* Code Entry */}
          {step === "code" && (
            <>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight">
                  KI-Register beitreten
                </h1>
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
                  <label className="text-sm font-medium" htmlFor="code">
                    Einladungscode
                  </label>
                  <Input
                    id="code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(normalizeCode(e.target.value))}
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
              <p className="text-center text-xs text-muted-foreground">
                Keinen Code?{" "}
                <Link
                  href="/einrichten"
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  Eigenes Register einrichten
                </Link>
              </p>
            </>
          )}

          {/* Confirmation */}
          {step === "confirm" && (
            <>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight">
                  Organisation bestätigen
                </h1>
                <p className="text-sm text-muted-foreground">
                  Prüfen Sie, ob der Code zur richtigen Organisation gehört.
                </p>
              </div>
              <div className="rounded-md border p-4 space-y-1">
                {orgName ? (
                  <p className="text-sm font-medium">{orgName}</p>
                ) : orgLabel ? (
                  <p className="text-sm font-medium">{orgLabel}</p>
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
                  onClick={() => setStep("signup")}
                  className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Organisation bestätigen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("code");
                    setValidatedCode("");
                    setOrgName(null);
                    setOrgLabel(null);
                  }}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline py-1"
                >
                  Das ist nicht meine Organisation
                </button>
              </div>
            </>
          )}

          {/* Signup */}
          {step === "signup" && (
            <>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight">
                  Zugang anlegen
                </h1>
                {(orgName || orgLabel) && (
                  <p className="text-sm text-muted-foreground">
                    für {orgName || orgLabel}
                  </p>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSignup();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="name">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ihr Name"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    E-Mail-Adresse
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ihre@organisation.de"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">
                    Passwort
                  </label>
                  <Input
                    id="password"
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
                    "Konto anlegen & zur Erfassung"
                  )}
                </button>
              </form>
              <p className="text-center text-xs text-muted-foreground">
                Bereits ein Konto?{" "}
                <Link
                  href={`/login?mode=login&code=${encodeURIComponent(validatedCode)}${email ? `&email=${encodeURIComponent(email)}` : ""}`}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  Anmelden und direkt fortfahren
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
