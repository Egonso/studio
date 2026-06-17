'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Inbox, RefreshCw } from 'lucide-react';
import { useLocale } from 'next-intl';

import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/auth-context';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { AgentKitScopeOption } from '@/lib/agent-kit/scope-options';
import { localizeHref } from '@/lib/i18n/localize-href';
import { useWorkspaceScope } from '@/lib/navigation/use-workspace-scope';
import { appendWorkspaceScope } from '@/lib/navigation/workspace-scope';
import { getActiveWorkspaceId, setActiveWorkspaceId } from '@/lib/workspace-session';

type CandidateStatus = 'needs_review' | 'accepted' | 'rejected' | 'merged';

interface RegisterOption {
  registerId: string;
  name: string;
  ownerId: string;
}

interface WorkspaceListResponse {
  workspaces: AgentKitScopeOption[];
}

interface WorkspaceAgentKitKeysResponse {
  registers: RegisterOption[];
  workspace?: {
    orgId: string;
    name: string;
  } | null;
}

interface CandidateSource {
  agent: string;
  runId: string | null;
  localCandidateId: string | null;
}

interface CandidateSummary {
  candidateId: string;
  registerId: string;
  status: CandidateStatus;
  title: string;
  purpose: string;
  systemSummary: string;
  confidence: number | null;
  blockedBy: string[];
  reviewQuestionCount: number;
  evidenceCount: number;
  duplicateHintCount: number;
  createdAt: string;
  updatedAt: string;
  source: CandidateSource;
}

interface CandidateEvidenceItem {
  evidenceId: string;
  source: string;
  sourceRef: string | null;
  observedAt: string;
  claim: string;
  confidence: number | null;
  excerpt: string | null;
  sensitive: boolean;
}

interface CandidateReviewQuestion {
  questionId: string;
  reason: string;
  question: string;
  blocks: string;
}

interface CandidateDuplicateHint {
  useCaseId: string;
  purpose: string;
  score: number;
  reason: string;
}

interface CandidateManifest {
  title?: string;
  purpose?: string;
  ownerRole?: string;
  usageContexts?: string[];
  systems?: Array<{
    name?: string;
    toolId?: string | null;
    toolFreeText?: string | null;
  }>;
}

interface CandidateDetail extends CandidateSummary {
  reviewQuestions: CandidateReviewQuestion[];
  evidence: CandidateEvidenceItem[];
  duplicateHints: CandidateDuplicateHint[];
  manifest: CandidateManifest;
  createdByEmail: string | null;
}

interface CandidateListResponse {
  candidates: CandidateSummary[];
  count: number;
}

interface CandidateDetailResponse {
  candidate: CandidateDetail;
}

function getCandidateReviewCopy(locale: string) {
  if (locale === 'de') {
    return {
      unknown: 'unbekannt',
      title: 'Agent Review Inbox',
      description:
        'Review-Kandidaten aus lokalen Agentenläufen, getrennt von echten Registereinträgen.',
      nextStep:
        'Prüfen Sie Kandidaten, Evidenz und offene Fragen, bevor ein Einsatzfall formal dokumentiert wird.',
      loadingTitle: 'Agent Review Inbox',
      loadingDescription: 'Review-Kandidaten werden vorbereitet.',
      loadingNextStep: 'Wir laden Workspace- und Registerdaten.',
      loadingPanelTitle: 'Review-Inbox wird geladen',
      loadingPanelDescription:
        'Workspace, Register und Kandidaten werden abgefragt.',
      backToAgentKit: 'Zurück zu Agent Kit',
      reload: 'Neu laden',
      activeScope: 'Aktiver Bereich',
      scopePlaceholder: 'Bereich wählen',
      register: 'Register',
      registerPlaceholder: 'Register wählen',
      noRegisters:
        'Für diesen Bereich ist noch kein Register verfügbar.',
      candidates: 'Review-Kandidaten',
      candidatesDesc:
        'Kandidaten sind Agentenvorschläge. Sie sind noch keine echten Use Cases.',
      noCandidates:
        'Für dieses Register liegen keine Review-Kandidaten vor.',
      candidate: 'Kandidat',
      status: 'Status',
      review: 'Review',
      evidence: 'Evidenz',
      updatedAt: 'Aktualisiert',
      action: 'Aktion',
      show: 'Anzeigen',
      detailTitle: 'Kandidat prüfen',
      detailEmpty:
        'Wählen Sie einen Kandidaten aus der Liste.',
      purpose: 'Zweck',
      systems: 'Systeme',
      confidence: 'Confidence',
      blocker: 'Blocker',
      source: 'Quelle',
      reviewQuestions: 'Offene Review-Fragen',
      noReviewQuestions:
        'Keine offenen Review-Fragen übermittelt.',
      evidenceItems: 'Evidenz',
      noEvidence:
        'Keine Evidenz übermittelt.',
      duplicateHints: 'Mögliche Dubletten',
      noDuplicateHints:
        'Keine Dublettenhinweise übermittelt.',
      manifest: 'Manifest-Auszug',
      createdBy: 'Erstellt durch',
      sensitive: 'sensibel',
      statusNeedsReview: 'Review offen',
      statusAccepted: 'akzeptiert',
      statusRejected: 'abgelehnt',
      statusMerged: 'übernommen',
      loadFallback: 'Review-Kandidaten konnten nicht geladen werden.',
      detailFallback: 'Kandidat konnte nicht geladen werden.',
    };
  }

  return {
    unknown: 'unknown',
    title: 'Agent review inbox',
    description:
      'Review candidates from local agent runs, separated from real register entries.',
    nextStep:
      'Review candidates, evidence and open questions before a use case is formally documented.',
    loadingTitle: 'Agent review inbox',
    loadingDescription: 'Preparing review candidates.',
    loadingNextStep: 'We are loading workspace and register data.',
    loadingPanelTitle: 'Loading review inbox',
    loadingPanelDescription:
      'Workspace, register and candidates are being requested.',
    backToAgentKit: 'Back to Agent Kit',
    reload: 'Reload',
    activeScope: 'Active scope',
    scopePlaceholder: 'Choose scope',
    register: 'Register',
    registerPlaceholder: 'Choose register',
    noRegisters:
      'No register is available for this scope yet.',
    candidates: 'Review candidates',
    candidatesDesc:
      'Candidates are agent proposals. They are not real use cases yet.',
    noCandidates:
      'There are no review candidates for this register.',
    candidate: 'Candidate',
    status: 'Status',
    review: 'Review',
    evidence: 'Evidence',
    updatedAt: 'Updated',
    action: 'Action',
    show: 'Show',
    detailTitle: 'Review candidate',
    detailEmpty:
      'Select a candidate from the list.',
    purpose: 'Purpose',
    systems: 'Systems',
    confidence: 'Confidence',
    blocker: 'Blockers',
    source: 'Source',
    reviewQuestions: 'Open review questions',
    noReviewQuestions:
      'No open review questions were submitted.',
    evidenceItems: 'Evidence',
    noEvidence:
      'No evidence was submitted.',
    duplicateHints: 'Possible duplicates',
    noDuplicateHints:
      'No duplicate hints were submitted.',
    manifest: 'Manifest excerpt',
    createdBy: 'Created by',
    sensitive: 'sensitive',
    statusNeedsReview: 'review open',
    statusAccepted: 'accepted',
    statusRejected: 'rejected',
    statusMerged: 'merged',
    loadFallback: 'Review candidates could not be loaded.',
    detailFallback: 'Candidate could not be loaded.',
  };
}

function formatDate(value: string | null | undefined, locale: string, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatConfidence(value: number | null | undefined, fallback: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return `${Math.round(value * 100)}%`;
}

function getCandidateStatusLabel(
  status: CandidateStatus,
  copy: ReturnType<typeof getCandidateReviewCopy>,
): string {
  if (status === 'accepted') {
    return copy.statusAccepted;
  }

  if (status === 'rejected') {
    return copy.statusRejected;
  }

  if (status === 'merged') {
    return copy.statusMerged;
  }

  return copy.statusNeedsReview;
}

function getManifestSystems(manifest: CandidateManifest): string {
  const systems = manifest.systems
    ?.map((system) => system.name ?? system.toolFreeText ?? system.toolId ?? null)
    .filter((value): value is string => Boolean(value));

  return systems && systems.length > 0 ? systems.join(', ') : '—';
}

export default function AgentCandidateReviewPage() {
  const locale = useLocale();
  const copy = getCandidateReviewCopy(locale);
  const router = useRouter();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const workspaceScope = useWorkspaceScope();

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceOptions, setWorkspaceOptions] = useState<AgentKitScopeOption[]>([]);
  const [registers, setRegisters] = useState<RegisterOption[]>([]);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null);
  const [resolvedWorkspaceName, setResolvedWorkspaceName] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<CandidateDetail | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentKitHref = localizeHref(
    locale,
    appendWorkspaceScope('/settings/agent-kit', workspaceScope),
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push(localizeHref(locale, '/login'));
    }
  }, [loading, locale, router, user]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setWorkspaceId((current) => {
      if (current) {
        return current;
      }

      return (
        workspaceScope ??
        getActiveWorkspaceId() ??
        profile.workspaces?.[0]?.orgId ??
        profile.workspaceOrgIds?.[0] ??
        user?.uid ??
        null
      );
    });
  }, [profile, user?.uid, workspaceScope]);

  const authFetch = useCallback(
    async (input: string, init?: RequestInit) => {
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('UNAUTHENTICATED');
      }

      const response = await fetch(input, {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? `Request failed with ${response.status}`);
      }

      return response;
    },
    [user],
  );

  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const response = await authFetch('/api/workspaces');
      const payload = (await response.json()) as WorkspaceListResponse;
      setWorkspaceOptions(payload.workspaces);
      setWorkspaceId((current) => {
        const preferred = workspaceScope ?? getActiveWorkspaceId();
        if (
          preferred &&
          payload.workspaces.some((workspace) => workspace.orgId === preferred)
        ) {
          return preferred;
        }

        if (
          current &&
          payload.workspaces.some((workspace) => workspace.orgId === current)
        ) {
          return current;
        }

        return payload.workspaces[0]?.orgId ?? current ?? user.uid;
      });
    } catch (loadError) {
      console.error('Failed to load candidate review workspaces', loadError);
      setError(
        loadError instanceof Error ? loadError.message : copy.loadFallback,
      );
    }
  }, [authFetch, copy.loadFallback, user, workspaceScope]);

  const loadWorkspaceData = useCallback(async () => {
    if (!workspaceId) {
      setRegisters([]);
      setCandidates([]);
      setCandidateDetail(null);
      return;
    }

    setIsLoadingData(true);
    setError(null);
    try {
      const response = await authFetch(`/api/workspaces/${workspaceId}/agent-kit/keys`);
      const payload = (await response.json()) as WorkspaceAgentKitKeysResponse;
      setRegisters(payload.registers);
      setResolvedWorkspaceName(payload.workspace?.name ?? payload.workspace?.orgId ?? null);
      setSelectedRegisterId((current) =>
        current && payload.registers.some((register) => register.registerId === current)
          ? current
          : (payload.registers[0]?.registerId ?? null),
      );
    } catch (loadError) {
      console.error('Failed to load candidate review registers', loadError);
      setError(
        loadError instanceof Error ? loadError.message : copy.loadFallback,
      );
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch, copy.loadFallback, workspaceId]);

  const loadCandidates = useCallback(async () => {
    if (!workspaceId || !selectedRegisterId) {
      setCandidates([]);
      setSelectedCandidateId(null);
      setCandidateDetail(null);
      return;
    }

    setIsLoadingData(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        registerId: selectedRegisterId,
        limit: '50',
      });
      const response = await authFetch(
        `/api/workspaces/${workspaceId}/agent-kit/candidates?${params.toString()}`,
      );
      const payload = (await response.json()) as CandidateListResponse;
      setCandidates(payload.candidates);
      setSelectedCandidateId((current) =>
        current && payload.candidates.some((candidate) => candidate.candidateId === current)
          ? current
          : (payload.candidates[0]?.candidateId ?? null),
      );
    } catch (loadError) {
      console.error('Failed to load candidate review inbox', loadError);
      setError(
        loadError instanceof Error ? loadError.message : copy.loadFallback,
      );
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch, copy.loadFallback, selectedRegisterId, workspaceId]);

  const loadCandidateDetail = useCallback(async () => {
    if (!workspaceId || !selectedRegisterId || !selectedCandidateId) {
      setCandidateDetail(null);
      return;
    }

    setIsLoadingDetail(true);
    try {
      const params = new URLSearchParams({
        registerId: selectedRegisterId,
      });
      const response = await authFetch(
        `/api/workspaces/${workspaceId}/agent-kit/candidates/${selectedCandidateId}?${params.toString()}`,
      );
      const payload = (await response.json()) as CandidateDetailResponse;
      setCandidateDetail(payload.candidate);
    } catch (loadError) {
      console.error('Failed to load candidate detail', loadError);
      setError(
        loadError instanceof Error ? loadError.message : copy.detailFallback,
      );
    } finally {
      setIsLoadingDetail(false);
    }
  }, [
    authFetch,
    copy.detailFallback,
    selectedCandidateId,
    selectedRegisterId,
    workspaceId,
  ]);

  useEffect(() => {
    if (!loading && !profileLoading && user) {
      void loadWorkspaces();
    }
  }, [loadWorkspaces, loading, profileLoading, user]);

  useEffect(() => {
    if (!loading && !profileLoading && user && workspaceId) {
      void loadWorkspaceData();
    }
  }, [loadWorkspaceData, loading, profileLoading, user, workspaceId]);

  useEffect(() => {
    if (!loading && !profileLoading && user && workspaceId) {
      void loadCandidates();
    }
  }, [
    loadCandidates,
    loading,
    profileLoading,
    selectedRegisterId,
    user,
    workspaceId,
  ]);

  useEffect(() => {
    void loadCandidateDetail();
  }, [loadCandidateDetail]);

  useEffect(() => {
    const persistedWorkspaceId =
      workspaceId && workspaceId !== user?.uid ? workspaceId : null;
    setActiveWorkspaceId(persistedWorkspaceId);
  }, [user?.uid, workspaceId]);

  const selectedWorkspace = useMemo(
    () => workspaceOptions.find((workspace) => workspace.orgId === workspaceId) ?? null,
    [workspaceId, workspaceOptions],
  );
  const selectedCandidate = useMemo(
    () =>
      candidates.find((candidate) => candidate.candidateId === selectedCandidateId) ??
      null,
    [candidates, selectedCandidateId],
  );
  const selectedRegister = useMemo(
    () =>
      registers.find((register) => register.registerId === selectedRegisterId) ??
      null,
    [registers, selectedRegisterId],
  );

  const handleWorkspaceChange = (nextWorkspaceId: string) => {
    setWorkspaceId(nextWorkspaceId);
    setSelectedRegisterId(null);
    setSelectedCandidateId(null);
    setCandidateDetail(null);
  };

  const handleRegisterChange = (nextRegisterId: string) => {
    setSelectedRegisterId(nextRegisterId);
    setSelectedCandidateId(null);
    setCandidateDetail(null);
  };

  if (loading || profileLoading) {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title={copy.loadingTitle}
        description={copy.loadingDescription}
        nextStep={copy.loadingNextStep}
        width="6xl"
      >
        <PageStatePanel
          tone="loading"
          area="signed_in_free_register"
          title={copy.loadingPanelTitle}
          description={copy.loadingPanelDescription}
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SignedInAreaFrame
      area="signed_in_free_register"
      title={copy.title}
      description={copy.description}
      nextStep={copy.nextStep}
      width="6xl"
      actions={
        <Button asChild variant="outline">
          <Link href={agentKitHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {copy.backToAgentKit}
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {error ? (
          <PageStatePanel
            tone="error"
            title={copy.loadFallback}
            description={error}
            actions={
              <Button
                variant="outline"
                onClick={() => void loadCandidates()}
                disabled={isLoadingData}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {copy.reload}
              </Button>
            }
          />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{copy.activeScope}</CardDescription>
              <CardTitle className="text-xl">
                {selectedWorkspace?.orgName ?? resolvedWorkspaceName ?? copy.unknown}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={workspaceId ?? undefined}
                onValueChange={handleWorkspaceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={copy.scopePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {workspaceOptions.map((workspace) => (
                    <SelectItem key={workspace.orgId} value={workspace.orgId}>
                      {workspace.orgName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{copy.register}</CardDescription>
              <CardTitle className="text-xl">
                {selectedRegister?.name ?? copy.unknown}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedRegisterId ?? undefined}
                onValueChange={handleRegisterChange}
                disabled={registers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={copy.registerPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {registers.map((register) => (
                    <SelectItem key={register.registerId} value={register.registerId}>
                      {register.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {registers.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {copy.noRegisters}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{copy.candidates}</CardDescription>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Inbox className="h-5 w-5" />
                {candidates.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {copy.candidatesDesc}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{copy.candidates}</CardTitle>
              <CardDescription>{copy.candidatesDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.candidate}</TableHead>
                    <TableHead>{copy.status}</TableHead>
                    <TableHead>{copy.review}</TableHead>
                    <TableHead>{copy.evidence}</TableHead>
                    <TableHead>{copy.updatedAt}</TableHead>
                    <TableHead>{copy.action}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground">
                        {copy.noCandidates}
                      </TableCell>
                    </TableRow>
                  ) : (
                    candidates.map((candidate) => (
                      <TableRow key={candidate.candidateId}>
                        <TableCell>
                          <div className="font-medium">{candidate.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {candidate.systemSummary}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-800">
                            {getCandidateStatusLabel(candidate.status, copy)}
                          </Badge>
                        </TableCell>
                        <TableCell>{candidate.reviewQuestionCount}</TableCell>
                        <TableCell>{candidate.evidenceCount}</TableCell>
                        <TableCell>
                          {formatDate(candidate.updatedAt, locale, copy.unknown)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={
                              candidate.candidateId === selectedCandidateId
                                ? 'secondary'
                                : 'ghost'
                            }
                            size="sm"
                            onClick={() => setSelectedCandidateId(candidate.candidateId)}
                          >
                            {copy.show}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {copy.detailTitle}
              </CardTitle>
              <CardDescription>
                {selectedCandidate?.title ?? copy.detailEmpty}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDetail ? (
                <PageStatePanel
                  tone="loading"
                  title={copy.loadingPanelTitle}
                  description={copy.loadingPanelDescription}
                />
              ) : candidateDetail ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-800">
                        {getCandidateStatusLabel(candidateDetail.status, copy)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(candidateDetail.createdAt, locale, copy.unknown)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">
                      {candidateDetail.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {candidateDetail.purpose}
                    </p>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {copy.systems}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900">
                        {getManifestSystems(candidateDetail.manifest)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {copy.confidence}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900">
                        {formatConfidence(candidateDetail.confidence, copy.unknown)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {copy.blocker}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900">
                        {candidateDetail.blockedBy.length > 0
                          ? candidateDetail.blockedBy.join(', ')
                          : copy.unknown}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {copy.source}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900">
                        {candidateDetail.source.agent}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {copy.createdBy}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900">
                        {candidateDetail.createdByEmail ?? copy.unknown}
                      </dd>
                    </div>
                  </dl>

                  <section>
                    <h3 className="text-sm font-semibold text-slate-950">
                      {copy.reviewQuestions}
                    </h3>
                    {candidateDetail.reviewQuestions.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {copy.noReviewQuestions}
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {candidateDetail.reviewQuestions.map((question) => (
                          <div
                            key={question.questionId}
                            className="rounded-md border border-slate-200 p-3"
                          >
                            <p className="text-sm font-medium text-slate-950">
                              {question.question}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {question.reason} · {question.blocks}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-slate-950">
                      {copy.evidenceItems}
                    </h3>
                    {candidateDetail.evidence.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {copy.noEvidence}
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {candidateDetail.evidence.map((item) => (
                          <div
                            key={item.evidenceId}
                            className="rounded-md border border-slate-200 p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-950">
                                {item.claim}
                              </p>
                              {item.sensitive ? (
                                <span className="text-xs text-muted-foreground">
                                  {copy.sensitive}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.source}
                              {item.sourceRef ? ` · ${item.sourceRef}` : ''}
                              {item.confidence !== null
                                ? ` · ${formatConfidence(item.confidence, copy.unknown)}`
                                : ''}
                            </p>
                            {item.excerpt ? (
                              <p className="mt-2 text-sm leading-6 text-slate-700">
                                {item.excerpt}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-slate-950">
                      {copy.duplicateHints}
                    </h3>
                    {candidateDetail.duplicateHints.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {copy.noDuplicateHints}
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {candidateDetail.duplicateHints.map((hint) => (
                          <div
                            key={hint.useCaseId}
                            className="rounded-md border border-slate-200 p-3"
                          >
                            <p className="text-sm font-medium text-slate-950">
                              {hint.purpose}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {hint.useCaseId} · {formatConfidence(hint.score, copy.unknown)} · {hint.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-slate-950">
                      {copy.manifest}
                    </h3>
                    <dl className="mt-3 grid gap-3 text-sm">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {copy.purpose}
                        </dt>
                        <dd className="mt-1 text-slate-900">
                          {candidateDetail.manifest.purpose ?? copy.unknown}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Owner
                        </dt>
                        <dd className="mt-1 text-slate-900">
                          {candidateDetail.manifest.ownerRole ?? copy.unknown}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Usage Contexts
                        </dt>
                        <dd className="mt-1 text-slate-900">
                          {candidateDetail.manifest.usageContexts?.join(', ') ??
                            copy.unknown}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {copy.detailEmpty}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SignedInAreaFrame>
  );
}
