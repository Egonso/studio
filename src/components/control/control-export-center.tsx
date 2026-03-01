"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrgExportArtifact } from "@/lib/control/exports/org-export-center";
import { useCapability } from "@/lib/compliance-engine/capability/useCapability";
import { FeatureGateDialog } from "@/components/feature-gate-dialog";
import { ArrowUpCircle } from "lucide-react";

interface ControlExportCenterProps {
  artifacts: OrgExportArtifact[];
  generatedAt: Date;
}

function downloadArtifact(artifact: OrgExportArtifact) {
  const blob = new Blob([artifact.content], { type: artifact.mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = artifact.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

export function ControlExportCenter({ artifacts, generatedAt }: ControlExportCenterProps) {
  const [activeType, setActiveType] = useState<OrgExportArtifact["type"] | null>(null);
  const { allowed: canExport } = useCapability("auditExport");
  const [showUpsellDialog, setShowUpsellDialog] = useState(false);

  const sortedArtifacts = useMemo(
    () =>
      [...artifacts].sort((left, right) => {
        const rank = {
          iso_42001_dossier: 0,
          governance_report: 1,
          trust_portal_bundle: 2,
          policy_bundle: 3,
        } as const;
        return rank[left.type] - rank[right.type];
      }),
    [artifacts]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Organisations-Export-Center</CardTitle>
          <CardDescription>
            Organisationsweite Governance-Artefakte. Stand: {generatedAt.toLocaleString("de-DE")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Use-Case Pass (PDF/JSON) bleibt im Register und wird nicht mit Organisations-Exporten vermischt.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exporttypen</CardTitle>
          <CardDescription>
            Vier organisationsweite Exportarten fuer Audit, Reporting und Nachweis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedArtifacts.map((artifact) => {
            const isLoading = activeType === artifact.type;
            return (
              <div key={artifact.type} className="rounded-md border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{artifact.label}</p>
                    <p className="text-xs text-muted-foreground">{artifact.description}</p>
                    <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        aria-hidden
                        className={`h-2 w-2 rounded-full ${artifact.ready ? "bg-green-600" : "bg-slate-500"
                          }`}
                      />
                      {artifact.ready ? "Export bereit" : "Vorpruefung erforderlich"}
                    </p>
                    {artifact.blockers.length > 0 && (
                      <div className="rounded-md border bg-slate-50 p-2 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">Offene Punkte:</p>
                        <ul className="mt-1 space-y-1">
                          {artifact.blockers.map((blocker) => (
                            <li key={`${artifact.type}-${blocker}`}>- {blocker}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {canExport ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveType(artifact.type);
                        try {
                          downloadArtifact(artifact);
                        } finally {
                          setActiveType(null);
                        }
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Erzeuge...
                        </>
                      ) : (
                        <>
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          {artifact.ready ? "Exportieren" : "Vorpruefung exportieren"}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => setShowUpsellDialog(true)}
                    >
                      <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />
                      Export-Optionen erweitern
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {!canExport && (
        <FeatureGateDialog
          feature="auditExport"
          open={showUpsellDialog}
          onOpenChange={setShowUpsellDialog}
        />
      )}
    </div>
  );
}
