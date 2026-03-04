"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicTrustPortal } from "@/lib/data-service";
import type { PublicTrustPortal } from "@/lib/types";
import {
  Loader2,
  Shield,
  Globe,
  Award,
  Info,
  Scale,
  ShieldCheck,
  Mail,
  Building2,
} from "lucide-react";
import {
  fetchPublicUseCasesByOwner,
  aggregatePortalData,
  computeLiveTrustScore,
  type PortalAggregation,
} from "@/lib/register-first/trust-portal-aggregator";
import { EukiBadge } from "@/components/trust-portal/euki-badge";
import { PortalKpiSection } from "@/components/trust-portal/portal-kpi-section";
import { PortalSystemsTable } from "@/components/trust-portal/portal-systems-table";

export default function PublicTrustPortalPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [portalData, setPortalData] = useState<PublicTrustPortal | null>(null);
  const [liveAggregation, setLiveAggregation] =
    useState<PortalAggregation | null>(null);
  const [liveTrustScore, setLiveTrustScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      try {
        // 1. Load portal metadata (snapshot)
        const portal = await getPublicTrustPortal(projectId);
        if (!portal) {
          setError(
            "Portal nicht gefunden oder es wurde noch nicht veröffentlicht."
          );
          setLoading(false);
          return;
        }
        const data = portal as PublicTrustPortal;
        setPortalData(data);

        // 2. Attempt live aggregation from publicUseCases
        try {
          if (data.ownerId) {
            const entries = await fetchPublicUseCasesByOwner(data.ownerId);
            if (entries.length > 0) {
              const aggregation = aggregatePortalData(entries);
              setLiveAggregation(aggregation);

              const score = computeLiveTrustScore(
                aggregation.kpis,
                !!data.organizationName
              );
              setLiveTrustScore(score);
            }
          }
        } catch (liveErr) {
          // Live data is best-effort; fall back to snapshot
          console.warn(
            "[TrustPortal] Live aggregation failed, using snapshot:",
            liveErr
          );
        }
      } catch (_err) {
        setError("Laden fehlgeschlagen.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-slate-700">
            Inhalt nicht verfügbar
          </h1>
          <p className="text-slate-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const {
    organizationName,
    title,
    introduction,
    governanceStatement,
    responsibilityText,
    contactText,
    contactEmail,
    trustScore: snapshotTrustScore,
    publishedAt,
  } = portalData;

  // Use live score if available, otherwise fall back to snapshot
  const displayTrustScore = liveTrustScore ?? snapshotTrustScore;

  const getGovernanceLevel = (score: number) => {
    if (score >= 80) return 3;
    if (score >= 40) return 2;
    return 1;
  };

  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header / Branding */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">
              AI Trust & Accountability
            </span>
          </div>

          <div className="flex items-center gap-3">
            <EukiBadge
              governanceLevel={displayTrustScore !== null ? getGovernanceLevel(displayTrustScore) : null}
              standardVersion="EUKI-GOV-1.0"
              compact
            />
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              <ShieldCheck className="h-3 w-3" />
              Verifiziert
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16 space-y-16">
        {/* 1. Hero / Intro */}
        <section className="space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-2">
            <Globe className="h-3.5 w-3.5" />
            Transparenz-Bericht
          </div>
          {organizationName && (
            <div className="text-lg font-semibold text-indigo-600 mb-1">
              {organizationName}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-3xl">
            {introduction}
          </p>
          {formattedDate && (
            <p className="text-sm text-slate-400">
              Zuletzt aktualisiert: {formattedDate}
            </p>
          )}
        </section>

        {/* 2. Live KPI Section (from publicUseCases) */}
        {liveAggregation && (
          <PortalKpiSection kpis={liveAggregation.kpis} />
        )}

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-12">
            {/* The Pledge */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <Scale className="h-32 w-32" />
              </div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Unser Ansatz (Governance)
              </h2>
              <div className="prose prose-lg text-slate-700 leading-relaxed whitespace-pre-line">
                {governanceStatement}
              </div>
            </section>

            {/* Live AI Systems (from publicUseCases) */}
            <section>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900 border-b pb-4">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Eingesetzte KI-Systeme
              </h2>
              {liveAggregation ? (
                <PortalSystemsTable systems={liveAggregation.systems} />
              ) : (
                <div className="space-y-6">
                  {portalData.aiSystems?.map((system, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 mb-1">
                            {system.name}
                          </h3>
                          <p className="text-slate-600">{system.purpose}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!portalData.aiSystems ||
                    portalData.aiSystems.length === 0) && (
                      <p className="text-slate-500 italic p-4 bg-slate-50 rounded-lg">
                        Keine spezifischen Systeme öffentlich gelistet.
                      </p>
                    )}
                </div>
              )}
            </section>

            {/* Responsibility */}
            {responsibilityText && (
              <section>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-900 border-b pb-4">
                  <Award className="h-5 w-5 text-indigo-600" />
                  Kompetenz & Verantwortung
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-line">
                  {responsibilityText}
                </p>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Trust Score Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <div className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">
                  Trust Readiness
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-black tracking-tight">
                    {displayTrustScore}%
                  </span>
                </div>
                <p className="text-sm text-slate-400 leading-snug mb-6">
                  {liveAggregation
                    ? "Live-Score basierend auf dokumentierten Use Cases, Review-Abdeckung und Nachweisfähigkeit."
                    : "Basierend auf dokumentierter Verantwortung, Transparenz und Aufsichtsmechanismen."}
                </p>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 transition-all duration-1000"
                    style={{ width: `${displayTrustScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* EUKI Badge (full) */}
            <EukiBadge
              governanceLevel={displayTrustScore !== null ? getGovernanceLevel(displayTrustScore) : null}
              standardVersion="EUKI-GOV-1.0"
            />

            {/* Disclaimer */}
            <div className="bg-slate-100 p-5 rounded-xl border border-slate-200 text-sm text-slate-600 leading-relaxed">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                <Info className="h-4 w-4" />
                Wichtiger Hinweis
              </h4>
              <p>
                Dieser Transparenz-Bericht reflektiert den dokumentierten
                Governance-Ansatz der Organisation. Er stellt keine rechtliche
                Garantie für Fehlerfreiheit oder vollständige Konformität dar.
              </p>
            </div>

            {/* Contact */}
            {contactText && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                <Mail className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-2">
                  Fragen zur KI?
                </h3>
                <p className="text-sm text-slate-600 mb-4">{contactText}</p>
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                  >
                    E-Mail senden
                  </a>
                )}
              </div>
            )}

            <div className="text-center pt-8 space-y-2">
              <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                <span className="font-medium">
                  Verifiziert durch AI Governance Control
                </span>
              </div>
              <div className="text-xs text-slate-400">
                <a
                  href="https://kiregister.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 transition-colors"
                >
                  Mehr Infos unter kiregister.com
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
