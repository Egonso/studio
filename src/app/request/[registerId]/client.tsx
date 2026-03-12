"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageStatePanel, PublicIntakeShell } from "@/components/product-shells";

function formatExpiry(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "bald";
  }

  return parsed.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupplierRequestForm({
  requestToken,
  requestTokenId,
  organisationName,
  expiresAt,
}: {
  requestToken: string;
  requestTokenId: string;
  organisationName: string;
  expiresAt: string;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expiresLabel = useMemo(() => formatExpiry(expiresAt), [expiresAt]);

  const [formData, setFormData] = useState({
    supplierEmail: "",
    toolName: "",
    purpose: "",
    dataCategory: "",
    aiActCategory: "",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/supplier-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestToken,
          ...formData,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Fehler beim Uebermitteln."
        );
      }

      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Fehler beim Uebermitteln."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PublicIntakeShell
        title="Lieferantenangaben einreichen"
        description={`Dieser öffentliche Lieferantenlink gehört zu ${organisationName}. Ihre Angaben werden nur als nachvollziehbare Einreichung entgegengenommen und intern geprüft.`}
        actions={[]}
        meta={
          <p>
            Sichere Anfrage-ID: <span className="font-medium text-slate-950">{requestTokenId}</span>{" "}
            · gültig bis {expiresLabel}
          </p>
        }
        asidePoints={[
          "Die Einreichung bleibt als unveränderlicher Ursprung erhalten.",
          "Freigabe, Ablehnung oder Übernahme passieren intern im Register.",
        ]}
      >
        <PageStatePanel
          tone="success"
          icon={CheckCircle2}
          area="public_external_intake"
          title="Angaben übermittelt"
          description={`Vielen Dank. Die Angaben wurden als nachvollziehbare externe Einreichung im Register von ${organisationName} gespeichert.`}
        />
      </PublicIntakeShell>
    );
  }

  return (
    <PublicIntakeShell
      title="Lieferantenangaben einreichen"
      description={`${organisationName} bittet Sie um Basisangaben zu Ihrem KI-System, damit die Nutzung intern nachvollziehbar dokumentiert und geprüft werden kann.`}
      actions={[]}
      meta={
        <p>
          Sichere Anfrage-ID: <span className="font-medium text-slate-950">{requestTokenId}</span>{" "}
          · gültig bis {expiresLabel}
        </p>
      }
      asidePoints={[
        "Lieferantenangaben werden nicht direkt als interner Use Case gespeichert.",
        "Jede Einreichung bleibt mit Herkunft, Zeit und Link-ID nachvollziehbar.",
        "Der interne nächste Schritt ist Review, Freigabe oder Übernahme ins Register.",
      ]}
    >
      <Card className="shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Systemangaben</CardTitle>
                <CardDescription>
                  Öffentliche Einreichung für {organisationName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="rounded-md border border-red-200 bg-white p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ihre Arbeits-E-Mail</Label>
                <Input
                  required
                  type="email"
                  placeholder="name@ihrefirma.de"
                  value={formData.supplierEmail}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      supplierEmail: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Name des KI-Systems / Produkts</Label>
                <Input
                  required
                  placeholder="z.B. SuperAgent AI"
                  value={formData.toolName}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      toolName: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Verwendungszweck beim Kunden</Label>
                <Textarea
                  required
                  rows={3}
                  placeholder="Kurz beschreiben, wofür das System konkret eingesetzt wird."
                  value={formData.purpose}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      purpose: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Kategorie der verarbeiteten Daten</Label>
                  <Select
                    required
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, dataCategory: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bitte wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_PERSONAL_DATA">
                        Keine personenbezogenen Daten
                      </SelectItem>
                      <SelectItem value="PERSONAL_DATA">
                        Personenbezogene Daten
                      </SelectItem>
                      <SelectItem value="SPECIAL_PERSONAL">
                        Besondere personenbezogene Daten
                      </SelectItem>
                      <SelectItem value="INTERNAL_CONFIDENTIAL">
                        Betriebsgeheimnisse
                      </SelectItem>
                      <SelectItem value="PUBLIC_DATA">
                        Öffentlich zugängliche Daten
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Risikoklasse gemäss EU AI Act</Label>
                  <Select
                    required
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, aiActCategory: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bitte wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Minimales Risiko">
                        Minimales Risiko
                      </SelectItem>
                      <SelectItem value="Geringes Risiko">
                        Geringes Risiko
                      </SelectItem>
                      <SelectItem value="Hochrisiko">
                        Hochrisiko
                      </SelectItem>
                      <SelectItem value="Unbekannt">
                        Noch unklar / Unbekannt
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-4 border-t bg-white p-6 pb-6">
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {loading ? "Wird sicher übermittelt..." : `An ${organisationName} übermitteln`}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </PublicIntakeShell>
  );
}
