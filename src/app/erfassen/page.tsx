"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PageState = "loading" | "enter_code" | "invalid" | "form" | "success";

interface CodeInfo {
  label: string;
  organisationName: string | null;
}

interface CaptureFormData {
  purpose: string;
  ownerName: string;
  organisation: string;
  toolFreeText: string;
  usageContext: string;
  dataCategory: string;
}

const EMPTY_FORM: CaptureFormData = {
  purpose: "",
  ownerName: "",
  organisation: "",
  toolFreeText: "",
  usageContext: "INTERNAL_ONLY",
  dataCategory: "NONE",
};

export default function ErfassenPage() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code");

  const [pageState, setPageState] = useState<PageState>(codeParam ? "loading" : "enter_code");
  const [code, setCode] = useState(codeParam || "");
  const [codeInfo, setCodeInfo] = useState<CodeInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState<CaptureFormData>({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPurpose, setCreatedPurpose] = useState("");

  const patch = (p: Partial<CaptureFormData>) => setForm((f) => ({ ...f, ...p }));

  // Validate code from URL param on mount
  useEffect(() => {
    if (codeParam) {
      validateCode(codeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function validateCode(c: string) {
    setPageState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/capture-by-code?code=${encodeURIComponent(c)}`);
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Ungültiger Code");
        setPageState("invalid");
        return;
      }
      const data = await res.json();
      setCodeInfo({ label: data.label, organisationName: data.organisationName });
      setCode(c);
      setPageState("form");
    } catch {
      setErrorMsg("Verbindungsfehler. Bitte versuche es erneut.");
      setPageState("invalid");
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/capture-by-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          purpose: form.purpose.trim(),
          toolFreeText: form.toolFreeText.trim() || undefined,
          usageContext: form.usageContext,
          dataCategory: form.dataCategory,
          ownerName: form.ownerName.trim(),
          organisation: form.organisation.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Fehler beim Speichern");
        return;
      }

      setCreatedPurpose(form.purpose.trim());
      setPageState("success");
    } catch {
      setErrorMsg("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    form.purpose.trim().length >= 3 && form.ownerName.trim().length >= 2;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-6 flex w-full max-w-lg items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/register-logo.png" alt="Logo" width={32} height={32} className="h-8 w-8 dark:invert" />
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
              <AlertTitle>Code ungültig</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => { setPageState("enter_code"); setErrorMsg(null); }}
              className="w-full"
            >
              Anderen Code eingeben
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Capture Form */}
      {pageState === "form" && (
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>KI-Einsatzfall erfassen</CardTitle>
            <CardDescription>
              {codeInfo?.organisationName
                ? `Register: ${codeInfo.organisationName}`
                : codeInfo?.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive">
                <AlertTitle>Fehler</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label>
                Use-Case Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="z. B. Marketing Copy Generator"
                value={form.purpose}
                onChange={(e) => patch({ purpose: e.target.value })}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Verantwortlich <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Name eingeben"
                value={form.ownerName}
                onChange={(e) => patch({ ownerName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Organisation</Label>
              <Input
                placeholder="Firma / Abteilung (optional)"
                value={form.organisation}
                onChange={(e) => patch({ organisation: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tool / Software</Label>
              <Input
                placeholder="z. B. ChatGPT, Midjourney (optional)"
                value={form.toolFreeText}
                onChange={(e) => patch({ toolFreeText: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Wirkungskontext</Label>
                <Select
                  value={form.usageContext}
                  onValueChange={(v) => patch({ usageContext: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERNAL_ONLY">Nur intern</SelectItem>
                    <SelectItem value="CUSTOMER_FACING">Kund:innen</SelectItem>
                    <SelectItem value="EMPLOYEE_FACING">Mitarbeitende</SelectItem>
                    <SelectItem value="EXTERNAL_PUBLIC">Extern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Datenkategorie</Label>
                <Select
                  value={form.dataCategory}
                  onValueChange={(v) => patch({ dataCategory: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Keine</SelectItem>
                    <SelectItem value="INTERNAL">Intern</SelectItem>
                    <SelectItem value="PERSONAL">Personenbezogen</SelectItem>
                    <SelectItem value="SENSITIVE">Sensibel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || isSubmitting}
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
