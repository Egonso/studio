"use client";

import { useEffect, useState } from "react";
import { APP_LOCALE } from '@/lib/locale';
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
    PERSONAL: "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100/80",
    SENSITIVE: "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100/80",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          EUKI Use-Case Pass
        </h1>
        <p className="text-sm text-muted-foreground">Verify &amp; Trust Portal</p>
      </div>

      <div className="w-full max-w-md">
        <Card className="mb-4 border-gray-200 shadow-xl">
          <CardHeader className="border-b border-slate-100 pb-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 ring-8 ring-gray-50/50">
              <CheckCircle2 className="h-6 w-6 text-gray-600" />
            </div>
            <CardTitle className="text-lg text-gray-700">Verifizierter Use-Case Pass</CardTitle>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-gray-600/80">
              <Shield className="h-3 w-3" />
              <span>Oeffentlich einsehbar</span>
            </div>
          </CardHeader>
        </Card>

        {/* Governance Trust Signal */}
        {entry && (
          <Card className="mb-4 border bg-white/80">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-primary" />
                Governance-Nachweis
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`rounded-lg p-2.5 text-center ${entry.status === 'PROOF_READY' ? 'bg-gray-50 text-gray-700' :
                    entry.status === 'REVIEWED' ? 'bg-gray-100 text-gray-700' :
                      entry.status === 'REVIEW_RECOMMENDED' ? 'bg-slate-100 text-slate-700' :
                        'bg-gray-50 text-gray-600'
                  }`}>
                  <div className="font-semibold text-sm">
                    {entry.status === 'PROOF_READY' ? '✓ Nachweisfähig' :
                      entry.status === 'REVIEWED' ? '✓ Geprüft' :
                        entry.status === 'REVIEW_RECOMMENDED' ? 'Prüfung empfohlen' :
                          '○ Offen'}
                  </div>
                  <div className="mt-0.5 opacity-70">Governance-Status</div>
                </div>
                <div className={`rounded-lg p-2.5 text-center ${entry.dataCategory === 'SENSITIVE' ? 'bg-slate-100 text-slate-700' :
                    entry.dataCategory === 'PERSONAL' ? 'bg-slate-100 text-slate-700' :
                      'bg-gray-50 text-gray-700'
                  }`}>
                  <div className="font-semibold text-sm">
                    {dataCategoryLabels[entry.dataCategory ?? ''] ?? 'Standard'}
                  </div>
                  <div className="mt-0.5 opacity-70">Datenkategorie</div>
                </div>
              </div>
              {entry.verification?.isReal && entry.verification?.isCurrent && (
                <div className="flex items-center gap-1.5 rounded-md bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Verifizierter realer Einsatz (aktuell)
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                  {new Date(entry.createdAt).toLocaleDateString(APP_LOCALE)}
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
