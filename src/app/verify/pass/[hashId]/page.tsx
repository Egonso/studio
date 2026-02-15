"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, XCircle, CheckCircle2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RegisterStatusBadge } from "@/components/register/status-badge";
import type { PublicUseCaseIndexEntry } from "@/lib/register-first";
import { lookupPublicUseCase } from "@/lib/register-first/register-repository";

type LoadingState = "loading" | "found" | "not_found" | "error";

export default function VerifyPassPage() {
  const params = useParams();
  const hashId = params.hashId as string;

  const [state, setState] = useState<LoadingState>("loading");
  const [entry, setEntry] = useState<PublicUseCaseIndexEntry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hashId || hashId.length < 8) {
      setState("not_found");
      return;
    }

    const fetchEntry = async () => {
      try {
        const result = await lookupPublicUseCase(hashId);

        if (!result) {
          setState("not_found");
          return;
        }

        setEntry(result);
        setState("found");
      } catch (err) {
        console.error("Verify pass error:", err);
        setErrorMessage("Fehler bei der Ueberpruefung. Bitte versuche es spaeter erneut.");
        setState("error");
      }
    };

    void fetchEntry();
  }, [hashId]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verifiziere Use-Case Pass...</p>
      </div>
    );
  }

  if (state === "not_found") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-700">Nicht gefunden</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              Kein oeffentlicher Use-Case Pass mit diesem Hash gefunden.
              Pruefe ob der Link korrekt ist.
            </p>
            <Button
              variant="outline"
              onClick={() => { window.location.href = "/"; }}
            >
              Zurueck zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-700">Fehler</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              {errorMessage ?? "Unbekannter Fehler."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // state === "found"
  const dataCategoryLabels: Record<string, string> = {
    NONE: "Keine besonderen Daten",
    INTERNAL: "Interne Daten",
    PERSONAL: "Personenbezogene Daten",
    SENSITIVE: "Sensible Daten",
  };

  const dataCategoryColors: Record<string, string> = {
    PERSONAL: "border-transparent bg-amber-100 text-amber-900 hover:bg-amber-100/80",
    SENSITIVE: "border-transparent bg-red-100 text-red-900 hover:bg-red-100/80",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-2xl font-bold text-transparent">
          EUKI Use-Case Pass
        </h1>
        <p className="text-sm text-muted-foreground">Verify &amp; Trust Portal</p>
      </div>

      <div className="w-full max-w-md">
        <Card className="mb-4 border-green-200 shadow-xl">
          <CardHeader className="border-b border-slate-100 pb-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg text-green-700">Verifizierter Use-Case Pass</CardTitle>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-green-600/80">
              <Shield className="h-3 w-3" />
              <span>Oeffentlich einsehbar</span>
            </div>
          </CardHeader>
        </Card>

        {entry && (
          <Card className="w-full max-w-md border-2">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-base leading-tight">{entry.purpose}</CardTitle>
                  <p className="font-mono text-xs text-muted-foreground">
                    {entry.globalUseCaseId}
                  </p>
                </div>
                <RegisterStatusBadge status={entry.status} />
              </div>
              {entry.organisationName && (
                <p className="text-xs text-muted-foreground">
                  Organisation: <span className="font-medium text-foreground">{entry.organisationName}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">
                  v{entry.formatVersion}
                </Badge>
                {entry.dataCategory && (
                  <Badge
                    variant="outline"
                    className={dataCategoryColors[entry.dataCategory] ?? ""}
                  >
                    {dataCategoryLabels[entry.dataCategory] ?? entry.dataCategory}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="divide-y text-sm">
              <div className="flex items-baseline justify-between gap-4 py-1">
                <span className="shrink-0 text-xs font-medium text-muted-foreground">Tool</span>
                <span className="text-right text-sm">{entry.toolName}</span>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-1">
                <span className="shrink-0 text-xs font-medium text-muted-foreground">Public Hash</span>
                <span className="text-right font-mono text-sm">{entry.publicHashId}</span>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-1">
                <span className="shrink-0 text-xs font-medium text-muted-foreground">Erstellt</span>
                <span className="text-right text-sm">
                  {new Date(entry.createdAt).toLocaleDateString("de-DE")}
                </span>
              </div>
              {entry.verification && (
                <div className="flex items-baseline justify-between gap-4 py-1">
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">Verifikation</span>
                  <span className="text-right text-sm">
                    {entry.verification.isReal ? "Realer Einsatz" : "Test/Demo"}
                    {entry.verification.isCurrent ? " (aktuell)" : ""}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground/50">
        EUKI Register-First Standard v1.1
      </div>
    </div>
  );
}
