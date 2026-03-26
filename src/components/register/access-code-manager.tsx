"use client";

import { useEffect, useState } from "react";
import { ClipboardCopy, Loader2, Plus, XCircle, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { accessCodeService, type AccessCodeOptions } from "@/lib/register-first/access-code-service";
import type { RegisterAccessCode } from "@/lib/register-first/types";
import { getPublicAppOrigin } from "@/lib/app-url";

interface AccessCodeManagerProps {
  registerId: string;
}

export function AccessCodeManager({ registerId }: AccessCodeManagerProps) {
  const [codes, setCodes] = useState<RegisterAccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [expiryOption, setExpiryOption] = useState<AccessCodeOptions['expiryOption']>('90_DAYS');
  const { toast } = useToast();

  useEffect(() => {
    loadCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerId]);

  async function loadCodes() {
    setIsLoading(true);
    try {
      const result = await accessCodeService.listCodes(registerId);
      setCodes(result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch {
      // silently fail on first load
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const code = await accessCodeService.generateCode(
        registerId,
        {
          label: newLabel.trim() || undefined,
          expiryOption
        }
      );
      setCodes((prev) => [code, ...prev]);
      setNewLabel("");
      toast({ title: "Code erstellt", description: `Code: ${code.code}` });
    } catch {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Code konnte nicht erstellt werden.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRevoke(code: string) {
    try {
      await accessCodeService.revokeCode(code);
      setCodes((prev) =>
        prev.map((c) => (c.code === code ? { ...c, isActive: false } : c))
      );
      toast({ title: "Code deaktiviert" });
    } catch {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Code konnte nicht deaktiviert werden.",
      });
    }
  }

  function copyLink(code: string) {
    const url = `${getPublicAppOrigin()}/erfassen?code=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode((current) => (current === code ? null : current)), 2200);
      toast({ title: "Link kopiert", description: url });
    });
  }

  const activeCodes = codes.filter((c) => c.isActive);
  const inactiveCodes = codes.filter((c) => !c.isActive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Zugangscodes</CardTitle>
        <CardDescription>
          Mitarbeitende können mit einem Code KI-Einsatzfälle erfassen — ohne Login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generate new code */}
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="code-label" className="text-xs">
                Bezeichnung (optional)
              </Label>
              <Input
                id="code-label"
                placeholder="z. B. Marketing-Team"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs">Ablaufdatum</Label>
            <RadioGroup
              value={expiryOption}
              onValueChange={(v: any) => setExpiryOption(v)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30_DAYS" id="exp-30" />
                <Label htmlFor="exp-30" className="text-sm font-normal cursor-pointer">30 Tage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="90_DAYS" id="exp-90" />
                <Label htmlFor="exp-90" className="text-sm font-normal cursor-pointer">90 Tage (Empfohlen)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="365_DAYS" id="exp-365" />
                <Label htmlFor="exp-365" className="text-sm font-normal cursor-pointer">1 Jahr</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="UNLIMITED" id="exp-unlimited" />
                <Label htmlFor="exp-unlimited" className="text-sm font-normal cursor-pointer">Unbegrenzt</Label>
              </div>
            </RadioGroup>

            {expiryOption === 'UNLIMITED' && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Nicht empfohlen: Codes ohne Ablaufdatum stellen ein Sicherheitsrisiko dar.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => void handleGenerate()}
              disabled={isGenerating}
              className="h-9"
            >
              {isGenerating ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-3.5 w-3.5" />
              )}
              Code erstellen
            </Button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Active codes */}
        {!isLoading && activeCodes.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-2">
            Noch keine Codes erstellt.
          </p>
        )}

        {activeCodes.map((c) => (
          <div
            key={c.code}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono font-semibold">
                  {c.code}
                </code>
                <Badge variant="outline" className="text-[10px]">
                  {c.usageCount} Nutzungen
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${
                  copiedCode === c.code ? "text-gray-600 hover:text-gray-700" : ""
                }`}
                onClick={() => copyLink(c.code)}
                title="Einladungslink kopieren"
              >
                {copiedCode === c.code ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <ClipboardCopy className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => void handleRevoke(c.code)}
                title="Code deaktivieren"
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {/* Inactive codes (collapsed) */}
        {inactiveCodes.length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              {inactiveCodes.length} deaktivierte Codes
            </summary>
            <div className="mt-2 space-y-1">
              {inactiveCodes.map((c) => (
                <div key={c.code} className="flex items-center gap-2 opacity-50">
                  <code className="font-mono text-xs">{c.code}</code>
                  <span>— {c.label}</span>
                  <span>({c.usageCount} Nutzungen)</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
