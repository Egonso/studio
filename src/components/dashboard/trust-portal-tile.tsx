"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, Shield, Loader2 } from "lucide-react";
import { TrustPortalConfigDialog } from "@/components/trust-portal-config-dialog";
import type { TrustPortalConfig } from "@/lib/types";
import {
  fetchPublicUseCasesByOwner,
  computePortalKpis,
  computeLiveTrustScore,
} from "@/lib/register-first/trust-portal-aggregator";
import { EukiBadge } from "@/components/trust-portal/euki-badge";

interface TrustPortalTileProps {
  projectId: string;
  projectName?: string;
  config: TrustPortalConfig | undefined;
  onConfigUpdate: (newConfig: TrustPortalConfig) => void;
  /** The current user's UID – needed for live aggregation */
  ownerId?: string;
}

export function TrustPortalTile({
  projectId,
  projectName,
  config,
  onConfigUpdate,
  ownerId,
}: TrustPortalTileProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [liveTrustScore, setLiveTrustScore] = useState<number | null>(null);
  const [liveSystemCount, setLiveSystemCount] = useState<number>(0);
  const [scoreLoading, setScoreLoading] = useState(false);

  // Compute live trust score from publicUseCases
  useEffect(() => {
    if (!ownerId) return;

    const loadLiveScore = async () => {
      setScoreLoading(true);
      try {
        const entries = await fetchPublicUseCasesByOwner(ownerId);
        if (entries.length > 0) {
          const kpis = computePortalKpis(entries);
          const score = computeLiveTrustScore(
            kpis,
            !!(config?.organizationName)
          );
          setLiveTrustScore(score);
          setLiveSystemCount(kpis.totalSystems);
        } else {
          setLiveTrustScore(0);
          setLiveSystemCount(0);
        }
      } catch (err) {
        console.warn("[TrustPortalTile] Live score failed:", err);
        setLiveTrustScore(null);
      } finally {
        setScoreLoading(false);
      }
    };
    loadLiveScore();
  }, [ownerId, config?.organizationName]);

  const displayScore = liveTrustScore ?? 0;

  return (
    <section className="mb-8">
      <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-950/20 dark:to-background border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Shield className="w-32 h-32 text-gray-600" />
        </div>

        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  Trust Portal
                </span>
                {config?.isPublished && (
                  <span className="bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Online
                  </span>
                )}
                <EukiBadge
                  governanceLevel={null}
                  standardVersion="EUKI-GOV-1.0"
                  compact
                />
              </div>
              <CardTitle className="text-2xl text-gray-950 dark:text-gray-100 flex items-center gap-2">
                <Shield className="w-6 h-6 text-gray-600" />
                AI Trust & Accountability Portal
              </CardTitle>
              <CardDescription className="text-gray-900/70 dark:text-gray-300/70 max-w-2xl">
                Live-Transparenz basierend auf Ihrem KI-Register.{" "}
                {liveSystemCount > 0 && (
                  <span className="font-medium">
                    {liveSystemCount} öffentliche Use Case
                    {liveSystemCount !== 1 ? "s" : ""}.
                  </span>
                )}
              </CardDescription>
            </div>

            <div className="text-right hidden sm:block z-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Trust Readiness
              </span>
              <div className="flex items-end justify-end gap-1">
                {scoreLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <span className="text-4xl font-extrabold text-gray-600 dark:text-gray-400">
                    {displayScore}%
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[150px] leading-tight text-right ml-auto">
                Live-Score aus Review-Abdeckung, Nachweisfähigkeit und
                Dokumentation.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button
              size="lg"
              className="bg-gray-600 hover:bg-gray-700 text-white shadow-md shadow-gray-200 dark:shadow-none"
              onClick={() => setDialogOpen(true)}
            >
              <Globe className="mr-2 h-4 w-4" />
              {config?.isPublished ? "Portal verwalten" : "Portal vorbereiten"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/50"
              disabled={!config?.isPublished}
              onClick={() => window.open(`/trust/${projectId}`, "_blank")}
              title={
                config?.isPublished
                  ? "Öffentliches Portal ansehen"
                  : "Erst veröffentlichen um anzusehen"
              }
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Zum öffentlichen Portal
            </Button>
          </div>
        </CardContent>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full dark:bg-gray-900/30">
          <div
            className="h-full bg-gray-500 transition-all duration-1000 ease-out"
            style={{ width: `${displayScore}%` }}
          />
        </div>
      </Card>

      <TrustPortalConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentConfig={config}
        projectId={projectId}
        projectTitle={projectName}
        onConfigSaved={(newConfig) => {
          onConfigUpdate(newConfig);
        }}
      />
    </section>
  );
}
