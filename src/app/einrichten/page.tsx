"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { registerService } from "@/lib/register-first/register-service";
import { accessCodeService } from "@/lib/register-first/access-code-service";
import { setActiveRegisterId } from "@/lib/register-first/register-settings-client";
import { ThemeAwareLogo } from "@/components/theme-aware-logo";
import { getPublicAppOrigin } from "@/lib/app-url";
import { TeamShareStep } from "@/components/onboarding/team-share-step";
import { buildLoginPath } from "@/lib/auth/login-routing";

type Step = 1 | 2 | 3;
type CopyTarget = "code" | "link" | null;

const STEP_LABELS: Record<Step, string> = {
  1: "Zugang",
  2: "Organisation",
  3: "Loslegen",
};

export default function SetupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget>(null);
  const [targetRegisterId, setTargetRegisterId] = useState<string | null>(null);

  // Step 1: Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Organisation
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("KI-Verantwortliche/r");

  // Step 3: Invite code (generated)
  const [inviteCode, setInviteCode] = useState("");
  const [captureLink, setCaptureLink] = useState("");

  // Already logged in: skip account step.
  useEffect(() => {
    if (!authLoading && user && step === 1) {
      if (!name && user.displayName) setName(user.displayName);
      if (!email && user.email) setEmail(user.email);
      setStep(2);
    }
  }, [authLoading, user, step, name, email]);

  const copyValue = async (value: string, target: Exclude<CopyTarget, null>) => {
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

  const handleStep1 = async () => {
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

      setStep(2);
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

  const handleStep2 = async () => {
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
          .some((value) => value.trim().toLocaleLowerCase("de-DE") === normalizedName)
      );

      const registerId = existing
        ? existing.registerId
        : (await registerService.createRegister(orgNameValue)).registerId;
      const contactName = name.trim() || user?.displayName?.trim() || "Unbenannt";
      const contactEmail = email.trim().toLowerCase() || user?.email?.toLowerCase() || "";

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
      setStep(3);

      // PLG Conversion: Import shared use case if provided
      const params = new URLSearchParams(window.location.search);
      const importUseCaseId = params.get('import');
      if (importUseCaseId) {
        try {
          const { getFirebaseDb } = await import('@/lib/firebase');
          const { doc, getDoc } = await import('firebase/firestore');
          const db = await getFirebaseDb();
          const publicSnap = await getDoc(doc(db, 'publicUseCases', importUseCaseId));

          if (publicSnap.exists()) {
            const publicData = publicSnap.data();
            await registerService.createUseCaseFromCapture(
              {
                toolFreeText: publicData.toolName || 'Importiertes KI-System',
                purpose: publicData.purpose || 'Importierter Use-Case aus Netzwerk',
              },
              { registerId: registerId }
            );
            toast({
              title: "Import erfolgreich",
              description: "Das ausgewählte KI-System wurde als Entwurf in Ihr neues Register kopiert."
            });
          }
        } catch (e) {
          console.error("Use-Case Import fehgeschlagen:", e);
        }
      }
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

  const handleFinish = () => {
    if (targetRegisterId) {
      setActiveRegisterId(targetRegisterId);
    }
    router.push("/my-register?onboarding=true");
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
          href="/einladen"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          Einladungscode verwenden
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-6 pt-12 pb-24">
        <div className="max-w-md w-full space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">
              {step === 3 ? "Sie sind startklar" : "KI-Register einrichten"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Schritt {step} von 3 · {STEP_LABELS[step]}
            </p>
            {/* Progress dots */}
            <div className="flex items-center gap-1 pt-1">
              {([1, 2, 3] as Step[]).map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-foreground" : "bg-muted"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Account */}
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleStep1();
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
                  "Weiter"
                )}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Bereits ein Konto?{" "}
                <Link
                  href={buildLoginPath({
                    mode: "login",
                    email,
                  })}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  Direkt anmelden
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: Organisation */}
          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleStep2();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="orgName">
                  Organisationsname
                </label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="z. B. Mustermann GmbH"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="role">
                  Ihre Rolle{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Input
                  id="role"
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
          {step === 3 && (
            <TeamShareStep
              inviteCode={inviteCode}
              captureLink={captureLink}
              copiedTarget={copiedTarget}
              onCopyValue={copyValue}
              onContinue={handleFinish}
            />
          )}
        </div>
      </main>
    </div>
  );
}
