'use client';

import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCog,
  FileDown,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
} from 'lucide-react';

import { CertificateBadgeCard } from '@/components/certification/certificate-badge-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type {
  AdminCertificateDetail,
  AdminCertificationOverview,
  CertificateAuditEvent,
  CertificateStatus,
} from '@/lib/certification/types';

interface CertificationAdminPanelProps {
  overview: AdminCertificationOverview | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onRegenerate: (certificateId: string) => Promise<void>;
  onUpdate: (input: {
    certificateId: string;
    status?: CertificateStatus;
    validUntil?: string | null;
    note?: string;
  }) => Promise<void>;
  onManualIssue: (input: {
    email: string;
    holderName: string;
    company?: string | null;
    validityMonths?: number | null;
  }) => Promise<void>;
  onLoadDetail: (certificateId: string) => Promise<AdminCertificateDetail>;
  onSaveSettings: (input: {
    defaultValidityMonths?: number | null;
    documentProvider?: 'native' | 'documentero' | null;
    documentTemplateId?: string | null;
    badgeAssetUrl?: string | null;
  }) => Promise<void>;
}

type StatusFilter = 'all' | CertificateStatus;

function formatDate(value: string | null | undefined, includeTime = false) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  });
}

function statusLabel(status: CertificateStatus) {
  switch (status) {
    case 'active':
      return 'Aktiv';
    case 'expired':
      return 'Abgelaufen';
    case 'revoked':
      return 'Widerrufen';
    default:
      return status;
  }
}

function statusPillClass(
  status: CertificateStatus | 'passed' | 'failed' | 'started' | 'submitted',
) {
  switch (status) {
    case 'active':
    case 'passed':
      return 'bg-emerald-100 text-emerald-700';
    case 'expired':
      return 'bg-amber-100 text-amber-700';
    case 'revoked':
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function auditTypeLabel(event: CertificateAuditEvent['type']) {
  switch (event) {
    case 'issued':
      return 'Ausgestellt';
    case 'manual_issue':
      return 'Manuell ausgestellt';
    case 'regenerated':
      return 'PDF neu generiert';
    case 'status_changed':
      return 'Status geändert';
    case 'validity_changed':
      return 'Gültigkeit geändert';
    default:
      return event;
  }
}

export function CertificationAdminPanel({
  overview,
  loading,
  onRefresh,
  onRegenerate,
  onUpdate,
  onManualIssue,
  onLoadDetail,
  onSaveSettings,
}: CertificationAdminPanelProps) {
  const [issuing, setIssuing] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminCertificateDetail | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [manualIssue, setManualIssue] = useState({
    email: '',
    holderName: '',
    company: '',
    validityMonths: String(overview?.settings.defaultValidityMonths ?? 12),
  });
  const [settingsDraft, setSettingsDraft] = useState<{
    defaultValidityMonths: string;
    documentProvider: 'native' | 'documentero';
    documentTemplateId: string;
    badgeAssetUrl: string;
  }>({
    defaultValidityMonths: String(overview?.settings.defaultValidityMonths ?? 12),
    documentProvider: overview?.settings.documentProvider ?? 'native',
    documentTemplateId: overview?.settings.documentTemplateId ?? '',
    badgeAssetUrl: overview?.settings.badgeAssetUrl ?? '',
  });
  const [drafts, setDrafts] = useState<
    Record<string, { status: CertificateStatus; validUntil: string }>
  >({});
  const [busyCertificates, setBusyCertificates] = useState<Record<string, boolean>>({});
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const certificates = useMemo(() => overview?.certificates ?? [], [overview?.certificates]);
  const attempts = useMemo(() => overview?.attempts ?? [], [overview?.attempts]);

  useEffect(() => {
    if (!overview) {
      return;
    }

    setSettingsDraft({
      defaultValidityMonths: String(overview.settings.defaultValidityMonths ?? 12),
      documentProvider: overview.settings.documentProvider ?? 'native',
      documentTemplateId: overview.settings.documentTemplateId ?? '',
      badgeAssetUrl: overview.settings.badgeAssetUrl ?? '',
    });
    setManualIssue((current) => ({
      ...current,
      validityMonths: current.validityMonths || String(overview.settings.defaultValidityMonths ?? 12),
    }));
  }, [overview]);

  const filteredCertificates = useMemo(() => {
    return certificates.filter((certificate) => {
      if (statusFilter !== 'all' && certificate.status !== statusFilter) {
        return false;
      }

      if (!deferredQuery) {
        return true;
      }

      const haystack = [
        certificate.holderName,
        certificate.email,
        certificate.company,
        certificate.certificateCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(deferredQuery);
    });
  }, [certificates, deferredQuery, statusFilter]);

  const filteredAttempts = useMemo(() => {
    if (!deferredQuery) {
      return attempts;
    }

    return attempts.filter((attempt) =>
      [attempt.email, attempt.examVersion, attempt.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(deferredQuery),
    );
  }, [attempts, deferredQuery]);

  const certificateCounts = useMemo(
    () => ({
      active: certificates.filter((certificate) => certificate.status === 'active').length,
      expired: certificates.filter((certificate) => certificate.status === 'expired').length,
      revoked: certificates.filter((certificate) => certificate.status === 'revoked').length,
    }),
    [certificates],
  );

  const passedAttempts = useMemo(
    () => attempts.filter((attempt) => attempt.status === 'passed').length,
    [attempts],
  );

  const selectedCertificate =
    selectedDetail?.certificate ??
    certificates.find((certificate) => certificate.certificateId === selectedCertificateId) ??
    null;

  const loadCertificateDetail = useCallback(async (certificateId: string) => {
    setSelectedCertificateId(certificateId);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await onLoadDetail(certificateId);
      setSelectedDetail(detail);
    } catch (error) {
      console.error('Failed to load certificate detail', error);
      setDetailError('Die Zertifikatsdetails konnten nicht geladen werden.');
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [onLoadDetail]);

  useEffect(() => {
    if (selectedCertificateId) {
      const stillPresent = certificates.some(
        (certificate) => certificate.certificateId === selectedCertificateId,
      );
      if (!stillPresent) {
        setSelectedCertificateId(null);
        setSelectedDetail(null);
      }
      return;
    }

    if (certificates.length > 0) {
      void loadCertificateDetail(certificates[0].certificateId);
    }
  }, [certificates, loadCertificateDetail, selectedCertificateId]);

  async function copyValue(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setBanner({
      tone: 'success',
      message: `${label} wurde in die Zwischenablage kopiert.`,
    });
  }

  async function handleBusy(certificateId: string, task: () => Promise<void>) {
    setBusyCertificates((current) => ({ ...current, [certificateId]: true }));
    setBanner(null);
    try {
      await task();
    } catch (error) {
      console.error('Certificate action failed', error);
      setBanner({
        tone: 'error',
        message: 'Die Aktion konnte nicht abgeschlossen werden.',
      });
    } finally {
      setBusyCertificates((current) => ({ ...current, [certificateId]: false }));
    }
  }

  async function handleManualIssue() {
    if (!manualIssue.email.trim() || !manualIssue.holderName.trim()) {
      setBanner({
        tone: 'error',
        message: 'Für die Ausstellung werden mindestens E-Mail und Name benötigt.',
      });
      return;
    }

    setIssuing(true);
    setBanner(null);
    try {
      await onManualIssue({
        email: manualIssue.email.trim(),
        holderName: manualIssue.holderName.trim(),
        company: manualIssue.company.trim() || null,
        validityMonths: Number.parseInt(manualIssue.validityMonths, 10),
      });
      setManualIssue({
        email: '',
        holderName: '',
        company: '',
        validityMonths: String(overview?.settings.defaultValidityMonths ?? 12),
      });
      setBanner({
        tone: 'success',
        message: 'Das Zertifikat wurde ausgestellt und im Register aktualisiert.',
      });
    } catch (error) {
      console.error('Manual issue failed', error);
      setBanner({
        tone: 'error',
        message: 'Die manuelle Ausstellung ist fehlgeschlagen.',
      });
    } finally {
      setIssuing(false);
    }
  }

  async function handleSaveSettings() {
    setSettingsSaving(true);
    setBanner(null);
    try {
      await onSaveSettings({
        defaultValidityMonths: Number.parseInt(settingsDraft.defaultValidityMonths, 10),
        documentProvider: settingsDraft.documentProvider,
        documentTemplateId: settingsDraft.documentTemplateId.trim(),
        badgeAssetUrl: settingsDraft.badgeAssetUrl.trim(),
      });
      setBanner({
        tone: 'success',
        message: 'Die Zertifizierungs-Settings wurden gespeichert.',
      });
    } catch (error) {
      console.error('Saving certification settings failed', error);
      setBanner({
        tone: 'error',
        message: 'Die Zertifizierungs-Settings konnten nicht gespeichert werden.',
      });
    } finally {
      setSettingsSaving(false);
    }
  }

  async function refreshAndReloadSelected(certificateId?: string | null) {
    await onRefresh();
    if (certificateId) {
      await loadCertificateDetail(certificateId);
    }
  }

  return (
    <div className="space-y-6">
      {banner ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            banner.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {banner.message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Zertifizierungsübersicht</CardTitle>
            <CardDescription>
              Prüfung, Zertifikate und öffentliche Nachweise werden direkt im KI-Register betrieben.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Zertifikate gesamt</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{certificates.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Prüfungsversuche</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{attempts.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Aktiv</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">{certificateCounts.active}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-700">Abgelaufen</p>
              <p className="mt-2 text-2xl font-semibold text-amber-900">{certificateCounts.expired}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-red-700">Widerrufen</p>
              <p className="mt-2 text-2xl font-semibold text-red-900">{certificateCounts.revoked}</p>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-700">Bestanden</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-900">{passedAttempts}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manuelle Ausstellung</CardTitle>
            <CardDescription>
              Für Sonderfälle kann ein Zertifikat direkt erstellt und sofort verifiziert werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="E-Mail"
              value={manualIssue.email}
              onChange={(event) =>
                setManualIssue((current) => ({ ...current, email: event.target.value }))
              }
            />
            <Input
              placeholder="Name"
              value={manualIssue.holderName}
              onChange={(event) =>
                setManualIssue((current) => ({ ...current, holderName: event.target.value }))
              }
            />
            <Input
              placeholder="Unternehmen (optional)"
              value={manualIssue.company}
              onChange={(event) =>
                setManualIssue((current) => ({ ...current, company: event.target.value }))
              }
            />
            <Input
              type="number"
              min={1}
              placeholder="Gültigkeit in Monaten"
              value={manualIssue.validityMonths}
              onChange={(event) =>
                setManualIssue((current) => ({
                  ...current,
                  validityMonths: event.target.value,
                }))
              }
            />
            <Button onClick={handleManualIssue} disabled={issuing}>
              {issuing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Zertifikat ausstellen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zertifizierungs-Settings</CardTitle>
            <CardDescription>
              Standardlaufzeit, PDF-Provider, Dokumentvorlage und Badge-Asset steuern die operative Ausgabe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={settingsDraft.documentProvider}
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  documentProvider: event.target.value as 'native' | 'documentero',
                }))
              }
            >
              <option value="native">Native PDF im KI-Register</option>
              <option value="documentero">Documentero Template (serverseitig freigeben)</option>
            </select>
            <Input
              type="number"
              min={1}
              value={settingsDraft.defaultValidityMonths}
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  defaultValidityMonths: event.target.value,
                }))
              }
              placeholder="Standardlaufzeit in Monaten"
            />
            <Input
              value={settingsDraft.documentTemplateId}
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  documentTemplateId: event.target.value,
                }))
              }
              placeholder="Documentero Template ID (optional)"
            />
            <Input
              value={settingsDraft.badgeAssetUrl}
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  badgeAssetUrl: event.target.value,
                }))
              }
              placeholder="Badge Asset URL (optional)"
            />
            <Button onClick={handleSaveSettings} disabled={settingsSaving}>
              {settingsSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Settings2 className="mr-2 h-4 w-4" />
              )}
              Einstellungen speichern
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Zertifikatsregister</CardTitle>
                <CardDescription>
                  Suche, Statuspflege, PDF-Regeneration und direkte Auswahl für Detailprüfung.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Suche nach Name, E-Mail oder Code"
                  />
                </div>
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                >
                  <option value="all">Alle Stati</option>
                  <option value="active">Aktiv</option>
                  <option value="expired">Abgelaufen</option>
                  <option value="revoked">Widerrufen</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startTransition(() => void refreshAndReloadSelected(selectedCertificateId))}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inhaber</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gültig bis</TableHead>
                    <TableHead>Öffentlich</TableHead>
                    <TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                        Keine Zertifikate für die aktuelle Suche.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCertificates.map((certificate) => {
                      const draft = drafts[certificate.certificateId] ?? {
                        status: certificate.status,
                        validUntil: certificate.validUntil ? certificate.validUntil.slice(0, 10) : '',
                      };
                      const selected = certificate.certificateId === selectedCertificateId;

                      return (
                        <TableRow
                          key={certificate.certificateId}
                          className={selected ? 'bg-slate-100/80' : undefined}
                          onClick={() => void loadCertificateDetail(certificate.certificateId)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-950">{certificate.holderName}</p>
                              <p className="text-xs text-slate-500">{certificate.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {certificate.certificateCode}
                          </TableCell>
                          <TableCell>
                            <select
                              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                              value={draft.status}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [certificate.certificateId]: {
                                    ...draft,
                                    status: event.target.value as CertificateStatus,
                                  },
                                }))
                              }
                            >
                              <option value="active">Aktiv</option>
                              <option value="expired">Abgelaufen</option>
                              <option value="revoked">Widerrufen</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={draft.validUntil}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [certificate.certificateId]: {
                                    ...draft,
                                    validUntil: event.target.value,
                                  },
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation();
                                window.open(certificate.publicUrl, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Verify
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleBusy(certificate.certificateId, async () => {
                                    await onRegenerate(certificate.certificateId);
                                    await refreshAndReloadSelected(certificate.certificateId);
                                    setBanner({
                                      tone: 'success',
                                      message: 'Das Zertifikatsdokument wurde neu generiert.',
                                    });
                                  });
                                }}
                                disabled={busyCertificates[certificate.certificateId]}
                              >
                                {busyCertificates[certificate.certificateId] ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <FileCog className="mr-2 h-4 w-4" />
                                )}
                                Regenerieren
                              </Button>
                              <Button
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleBusy(certificate.certificateId, async () => {
                                    await onUpdate({
                                      certificateId: certificate.certificateId,
                                      status: draft.status,
                                      validUntil: draft.validUntil
                                        ? new Date(draft.validUntil).toISOString()
                                        : null,
                                    });
                                    await refreshAndReloadSelected(certificate.certificateId);
                                    setBanner({
                                      tone: 'success',
                                      message: 'Das Zertifikat wurde aktualisiert.',
                                    });
                                  });
                                }}
                                disabled={busyCertificates[certificate.certificateId]}
                              >
                                Speichern
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Prüfungsversuche</CardTitle>
              <CardDescription>
                Verlauf der internen Kompetenzprüfung mit Score und Abschlusszeit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Versuch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Abgeschlossen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500">
                        Keine Prüfungsversuche für die aktuelle Suche.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttempts.map((attempt) => (
                      <TableRow key={attempt.attemptId}>
                        <TableCell>{attempt.email}</TableCell>
                        <TableCell>{attempt.attemptNumber}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${statusPillClass(attempt.status)}`}
                          >
                            {attempt.status === 'passed' ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : attempt.status === 'failed' ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <ShieldAlert className="h-3 w-3" />
                            )}
                            {attempt.status}
                          </span>
                        </TableCell>
                        <TableCell>{attempt.totalScore?.toFixed(2) ?? '—'}%</TableCell>
                        <TableCell>{formatDate(attempt.completedAt, true)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zertifikatsdetail</CardTitle>
              <CardDescription>
                Detailansicht mit öffentlicher Verifikation, Audit-Trail und Dokumentversionen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {detailLoading ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Detaildaten werden geladen.
                </div>
              ) : detailError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  {detailError}
                </div>
              ) : selectedCertificate ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Ausgewählt</p>
                      <h3 className="text-xl font-semibold text-slate-950">
                        {selectedCertificate.holderName}
                      </h3>
                      <p className="font-mono text-xs text-slate-500">
                        {selectedCertificate.certificateCode}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${statusPillClass(selectedCertificate.status)}`}
                    >
                      {statusLabel(selectedCertificate.status)}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">E-Mail</p>
                      <p className="mt-2 text-sm text-slate-900">{selectedCertificate.email}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Unternehmen</p>
                      <p className="mt-2 text-sm text-slate-900">
                        {selectedCertificate.company || '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Ausgestellt</p>
                      <p className="mt-2 text-sm text-slate-900">
                        {formatDate(selectedCertificate.issuedAt)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Gültig bis</p>
                      <p className="mt-2 text-sm text-slate-900">
                        {formatDate(selectedCertificate.validUntil)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        void handleBusy(selectedCertificate.certificateId, async () => {
                          await onRegenerate(selectedCertificate.certificateId);
                          await refreshAndReloadSelected(selectedCertificate.certificateId);
                          setBanner({
                            tone: 'success',
                            message: 'Das Zertifikats-PDF wurde neu generiert.',
                          });
                        })
                      }
                      disabled={busyCertificates[selectedCertificate.certificateId]}
                    >
                      {busyCertificates[selectedCertificate.certificateId] ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileCog className="mr-2 h-4 w-4" />
                      )}
                      PDF neu generieren
                    </Button>
                    <Button asChild>
                      <a
                        href={selectedCertificate.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Verifikation öffnen
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void copyValue(selectedCertificate.publicUrl, 'Verify-Link')}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Verify-Link kopieren
                    </Button>
                    {selectedCertificate.latestDocumentUrl ? (
                      <Button variant="outline" asChild>
                        <a
                          href={selectedCertificate.latestDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Letztes PDF öffnen
                        </a>
                      </Button>
                    ) : null}
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                      Module
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCertificate.modules.map((module) => (
                        <span
                          key={module}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                        >
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  Wählen Sie links ein Zertifikat aus, um die Detailansicht zu öffnen.
                </div>
              )}
            </CardContent>
          </Card>

          {selectedCertificate ? (
            <CertificateBadgeCard
              certificateCode={selectedCertificate.certificateCode}
              holderName={selectedCertificate.holderName}
              badgeAssetUrl={settingsDraft.badgeAssetUrl.trim() || undefined}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dokumenthistorie</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDetail?.documents && selectedDetail.documents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDetail.documents.map((document) => (
                    <div
                      key={document.documentId}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {formatDate(document.generatedAt, true)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {document.provider} · {document.generatedBy}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={document.url} target="_blank" rel="noreferrer">
                            Öffnen
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Noch keine Dokumentversionen vorhanden.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit-Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCertificate?.auditTrail && selectedCertificate.auditTrail.length > 0 ? (
                <div className="space-y-3">
                  {selectedCertificate.auditTrail.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">
                          {auditTypeLabel(event.type)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(event.createdAt, true)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{event.note}</p>
                      <p className="mt-1 text-xs text-slate-500">{event.actorEmail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Noch keine Audit-Ereignisse vorhanden.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
