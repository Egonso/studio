"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, XCircle, CheckCircle2, Shield } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UseCasePassCard } from "@/components/register/use-case-pass-card";
import type { UseCaseCard } from "@/lib/register-first";
import {
  getByPublicHashIdFirestore,
  createStaticToolRegistryService,
} from "@/lib/register-first";

type LoadingState = "loading" | "found" | "not_found" | "error" | "private";

const toolRegistry = createStaticToolRegistryService();

export default function VerifyPassPage() {
  const params = useParams();
  const hashId = params.hashId as string;

  const [state, setState] = useState<LoadingState>("loading");
  const [card, setCard] = useState<UseCaseCard | null>(null);
  const [resolvedToolName, setResolvedToolName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hashId || hashId.length < 8) {
      setState("not_found");
      return;
    }

    const fetchCard = async () => {
      try {
        const result = await getByPublicHashIdFirestore(hashId);

        if (!result) {
          setState("not_found");
          return;
        }

        if (!result.card.isPublicVisible) {
          setState("private");
          return;
        }

        setCard(result.card);

        // Resolve tool name
        if (result.card.toolId && result.card.toolId !== "other") {
          const tool = await toolRegistry.getToolById(result.card.toolId);
          if (tool) {
            setResolvedToolName(tool.productName);
          }
        }

        setState("found");
      } catch (err) {
        console.error("Verify pass error:", err);
        setErrorMessage("Fehler bei der Ueberpruefung. Bitte versuche es spaeter erneut.");
        setState("error");
      }
    };

    void fetchCard();
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

  if (state === "private") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-amber-200 shadow-lg">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle className="text-xl text-amber-700">Nicht oeffentlich</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              Dieser Use-Case Pass ist nicht als oeffentlich sichtbar markiert.
              Der Ersteller kann die Sichtbarkeit im Register aendern.
            </p>
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

        {card && (
          <UseCasePassCard card={card} resolvedToolName={resolvedToolName} />
        )}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground/50">
        EUKI Register-First Standard v1.1
      </div>
    </div>
  );
}
