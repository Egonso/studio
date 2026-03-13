"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function normalizeCertificateCode(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

export default function VerifyLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedCode = normalizeCertificateCode(code);
    if (!normalizedCode) {
      setError("Bitte geben Sie einen Zertifikatscode ein.");
      return;
    }

    setError(null);
    router.push(`/verify/${encodeURIComponent(normalizedCode)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
            Öffentliche Verifikation
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Zertifikate direkt im KI-Register prüfen
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Prüfen Sie den Status eines Zertifikats über den Code auf dem Dokument,
            dem Badge oder dem QR-Code. Aktive, abgelaufene und widerrufene
            Nachweise werden hier transparent ausgewiesen.
          </p>
        </div>

        <Card className="mx-auto w-full max-w-2xl border-slate-200 shadow-xl shadow-slate-200/60">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-slate-950">Zertifikat prüfen</CardTitle>
            <CardDescription className="text-base leading-7 text-slate-600">
              Geben Sie den Zertifikatscode ein, zum Beispiel <span className="font-mono text-slate-900">KI-EU-2024-6752</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  autoComplete="off"
                  className="h-12 flex-1 font-mono text-base uppercase tracking-wide"
                  inputMode="text"
                  name="certificate-code"
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="KI-EU-2024-6752"
                  value={code}
                />
                <Button className="h-12 px-6 text-base" type="submit">
                  <Search className="mr-2 h-4 w-4" />
                  Zertifikat prüfen
                </Button>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl text-slate-950">Was wird geprüft?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-slate-600">
              Sie sehen den Status, den Zertifikatscode, die zertifizierte Person,
              das Ausstellungsdatum, die Gültigkeit und den Zertifizierungsumfang.
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <QrCode className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl text-slate-950">Badge oder QR-Code vorhanden?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-slate-600">
              Ein Klick auf den Badge oder das Scannen des QR-Codes führt direkt zur
              gleichen Verifikationsansicht mit dem zugehörigen Zertifikatscode.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
