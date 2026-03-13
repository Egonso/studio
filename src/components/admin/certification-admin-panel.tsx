'use client';

import { startTransition, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  FileCog,
  FileDown,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

import { CertificateBadgeCard } from '@/components/certification/certificate-badge-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminCertificationOverview, CertificateStatus, PersonCertificateRecord } from '@/lib/certification/types';

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
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  return format(new Date(value), 'dd.MM.yyyy');
}

export function CertificationAdminPanel({
  overview,
  loading,
  onRefresh,
  onRegenerate,
  onUpdate,
  onManualIssue,
}: CertificationAdminPanelProps) {
  const [issuing, setIssuing] = useState(false);
  const [activePreviewCode, setActivePreviewCode] = useState<string | null>(null);
  const [manualIssue, setManualIssue] = useState({
    email: '',
    holderName: '',
    company: '',
    validityMonths: String(overview?.settings.defaultValidityMonths ?? 12),
  });
  const [drafts, setDrafts] = useState<
    Record<string, { status: CertificateStatus; validUntil: string }>
  >({});
  const [busyCertificates, setBusyCertificates] = useState<Record<string, boolean>>({});

  const certificates = overview?.certificates ?? [];
  const attempts = overview?.attempts ?? [];

  const certificateByCode = useMemo(() => {
    return new Map(certificates.map((certificate) => [certificate.certificateCode, certificate]));
  }, [certificates]);

  const activePreviewCertificate =
    activePreviewCode ? certificateByCode.get(activePreviewCode) ?? null : certificates[0] ?? null;

  const handleBusy = async (certificateId: string, task: () => Promise<void>) => {
    setBusyCertificates((current) => ({ ...current, [certificateId]: true }));
    try {
      await task();
    } finally {
      setBusyCertificates((current) => ({ ...current, [certificateId]: false }));
    }
  };

  const handleManualIssue = async () => {
    if (!manualIssue.email.trim() || !manualIssue.holderName.trim()) {
      return;
    }

    setIssuing(true);
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
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Zertifizierungsübersicht</CardTitle>
            <CardDescription>
              Fragenpool, Prüfungsversuche und Personenzertifikate werden jetzt direkt im KI-Register verwaltet.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Versuche</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{attempts.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Zertifikate</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{certificates.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Standardlaufzeit</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {overview?.settings.defaultValidityMonths ?? 12} Monate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manuelle Ausstellung</CardTitle>
            <CardDescription>
              Für Sonderfälle kann ein Personenzertifikat direkt aus dem Admin Center erzeugt werden.
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
              {issuing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Zertifikat ausstellen
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Zertifikatsregister</CardTitle>
              <CardDescription>
                Regeneration, Statuswechsel, Gültigkeit und Badge-Vorschau.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => startTransition(() => void onRefresh())}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inhaber</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gültig bis</TableHead>
                  <TableHead>Dokument</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500">
                      Noch keine Zertifikate.
                    </TableCell>
                  </TableRow>
                ) : (
                  certificates.map((certificate) => {
                    const draft = drafts[certificate.certificateId] ?? {
                      status: certificate.status,
                      validUntil: certificate.validUntil ? certificate.validUntil.slice(0, 10) : '',
                    };

                    return (
                      <TableRow key={certificate.certificateId}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-950">{certificate.holderName}</p>
                            <p className="text-xs text-slate-500">{certificate.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{certificate.certificateCode}</TableCell>
                        <TableCell>
                          <select
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                            value={draft.status}
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
                          {certificate.latestDocumentUrl ? (
                            <a
                              href={certificate.latestDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-cyan-700 hover:text-cyan-800"
                            >
                              <FileDown className="h-4 w-4" />
                              PDF
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500">Noch kein PDF</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleBusy(certificate.certificateId, () =>
                                  onRegenerate(certificate.certificateId),
                                )
                              }
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
                              variant="ghost"
                              onClick={() => setActivePreviewCode(certificate.certificateCode)}
                            >
                              Badge
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleBusy(certificate.certificateId, () =>
                                  onUpdate({
                                    certificateId: certificate.certificateId,
                                    status: draft.status,
                                    validUntil: draft.validUntil
                                      ? new Date(draft.validUntil).toISOString()
                                      : null,
                                  }),
                                )
                              }
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

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Prüfungsversuche</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Versuch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Abgeschlossen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500">
                          Noch keine Prüfungsversuche.
                        </TableCell>
                      </TableRow>
                    ) : (
                      attempts.map((attempt) => (
                        <TableRow key={attempt.attemptId}>
                          <TableCell>{attempt.email}</TableCell>
                          <TableCell>{attempt.attemptNumber}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                              attempt.status === 'passed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : attempt.status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {attempt.status === 'passed' ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <ShieldAlert className="h-3 w-3" />
                              )}
                              {attempt.status}
                            </span>
                          </TableCell>
                          <TableCell>{attempt.totalScore?.toFixed(2) ?? '—'}%</TableCell>
                          <TableCell>{formatDate(attempt.completedAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {activePreviewCertificate ? (
            <CertificateBadgeCard
              certificateCode={activePreviewCertificate.certificateCode}
              holderName={activePreviewCertificate.holderName}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Badge-Vorschau</CardTitle>
                <CardDescription>
                  Wählen Sie im Register ein Zertifikat, um den Embed-Code und die Vorschau zu sehen.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
