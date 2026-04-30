'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Check,
  ChevronDown,
  Link2,
  Loader2,
  MailPlus,
  Settings,
  Share2,
  ShieldX,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupplierInviteCreateDialog } from '@/components/register/supplier-invite-create-dialog';
import type {
  UseCaseCard,
  RegisterUseCaseStatus,
  Register,
} from '@/lib/register-first/types';
import { accessCodeService } from '@/lib/register-first/access-code-service';
import { getPublicAppOrigin } from '@/lib/app-url';
import { getFirebaseAuth } from '@/lib/firebase';
import { registerFirstFlags } from '@/lib/register-first/flags';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScopedRouteHrefs } from '@/lib/navigation/use-scoped-route-hrefs';

// ── Constants ────────────────────────────────────────────────────────────────

const REGISTER_VERSION = '1.0';

interface GovernanceHeaderProps {
  useCases: UseCaseCard[];
  register?: Register | null;
  externalInboxCount?: number;
  onQuickCapture?: () => void;
  onRegisterUpdated?: (partial: Partial<Register>) => void;
  onSupplierInvitesChanged?: () => void;
  initialSupplierInviteDialogOpen?: boolean;
  children?: React.ReactNode;
}

function getGovernanceHeaderCopy(locale: string) {
  if (locale === 'de') {
    return {
      nextStepFirstCapture: 'Erfassen Sie den ersten KI-Einsatzfall.',
      nextStepExternalInbox:
        'Prüfen Sie neue externe Einreichungen in der External Inbox.',
      nextStepOpenReviews:
        'Bearbeiten Sie offene Prüfungen und führen Sie Einsatzfälle weiter.',
      nextStepSupplierInvite:
        'Starten Sie eine kontaktgebundene Lieferantenanfrage oder teilen Sie einen Erfassungslink, um weitere Angaben einzusammeln.',
      nextStepShareLink:
        'Teilen Sie einen Erfassungs- oder Einreichungslink, um weitere Angaben einzusammeln.',
      signInAgain: 'Bitte melden Sie sich erneut an.',
      submissionLinkCreateFailed:
        'Einreichungslink konnte nicht erstellt werden.',
      submissionLinkCopied: 'Einreichungslink kopiert',
      submissionLinkCopiedDesc:
        'Ein neuer Einreichungslink wurde erstellt und in die Zwischenablage kopiert. Senden Sie ihn nur an den vorgesehenen Kontakt.',
      error: 'Fehler',
      linkCreateFailed: 'Link konnte nicht erstellt werden.',
      supplierLinkRevokeFailed:
        'Lieferanten-Link konnte nicht widerrufen werden.',
      submissionLinkRevoked: 'Einreichungslink widerrufen',
      activeLinksRevoked: (count: number) =>
        count === 1
          ? '1 aktiver Link wurde widerrufen.'
          : `${count} aktive Links wurden widerrufen.`,
      noActiveSubmissionLink: 'Es gab keinen aktiven Einreichungslink.',
      captureLinkCopied: 'Erfassungslink kopiert',
      captureLinkCopiedDesc:
        'Der Link wurde in die Zwischenablage kopiert.',
      captureLinkCopyFailed:
        'Erfassungslink konnte nicht kopiert werden.',
      organisation: 'Organisation',
      organisationalUnit: 'Organisationseinheit',
      contact: 'Kontakt',
      unnamed: 'Unbenannt',
      privateRegisterInstance: 'Private Register-Instanz',
      registerVersion: 'Registerversion',
      governanceSettings: 'Governance-Einstellungen',
      quickCapture: '+ KI-Einsatzfall erfassen',
      requestSupplier: 'Lieferant anfragen',
      actions: 'Aktionen',
      copyCaptureLink: 'Erfassungslink kopieren',
      simpleSubmissionLink: 'Einfacher Einreichungslink',
      withoutVerification: 'Ohne Verifizierung',
      revokeSubmissionLink: 'Einreichungslink widerrufen',
      useCasesTotal: 'Einsatzfälle gesamt',
      openReviews: 'Offene Prüfungen',
      externalSubmissions: 'Externe Einreichungen',
      view: 'Ansehen',
    } as const;
  }

  return {
    nextStepFirstCapture: 'Capture your first AI use case.',
    nextStepExternalInbox:
      'Review new external submissions in the External Inbox.',
    nextStepOpenReviews: 'Process open reviews and advance use cases.',
    nextStepSupplierInvite:
      'Start a contact-bound supplier request or share a capture link to collect further information.',
    nextStepShareLink:
      'Share a capture or submission link to collect further information.',
    signInAgain: 'Please sign in again.',
    submissionLinkCreateFailed: 'Submission link could not be created.',
    submissionLinkCopied: 'Submission link copied',
    submissionLinkCopiedDesc:
      'A new submission link has been created and copied to the clipboard. Only send it to the intended contact.',
    error: 'Error',
    linkCreateFailed: 'Link could not be created.',
    supplierLinkRevokeFailed: 'Supplier link could not be revoked.',
    submissionLinkRevoked: 'Submission link revoked',
    activeLinksRevoked: (count: number) =>
      `${count} active link${count === 1 ? '' : 's'} revoked.`,
    noActiveSubmissionLink: 'There was no active submission link.',
    captureLinkCopied: 'Capture link copied',
    captureLinkCopiedDesc: 'The link has been copied to the clipboard.',
    captureLinkCopyFailed: 'Capture link could not be copied.',
    organisation: 'Organisation',
    organisationalUnit: 'Organisational unit',
    contact: 'Contact',
    unnamed: 'Unnamed',
    privateRegisterInstance: 'Private register instance',
    registerVersion: 'Register version',
    governanceSettings: 'Governance settings',
    quickCapture: '+ Capture AI use case',
    requestSupplier: 'Request supplier',
    actions: 'Actions',
    copyCaptureLink: 'Copy capture link',
    simpleSubmissionLink: 'Simple submission link',
    withoutVerification: 'Without verification',
    revokeSubmissionLink: 'Revoke submission link',
    useCasesTotal: 'Use cases total',
    openReviews: 'Open reviews',
    externalSubmissions: 'External submissions',
    view: 'View',
  } as const;
}

// ── Component ────────────────────────────────────────────────────────────────

export function GovernanceHeader({
  useCases,
  register,
  externalInboxCount = 0,
  onQuickCapture,
  onSupplierInvitesChanged,
  initialSupplierInviteDialogOpen = false,
  children,
}: GovernanceHeaderProps) {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const scopedHrefs = useScopedRouteHrefs();
  const copy = useMemo(() => getGovernanceHeaderCopy(locale), [locale]);
  const [supplierLinkCopied, setSupplierLinkCopied] = useState(false);
  const [captureLinkCopied, setCaptureLinkCopied] = useState(false);
  const [isCreatingSupplierLink, setIsCreatingSupplierLink] = useState(false);
  const [isRevokingSupplierLink, setIsRevokingSupplierLink] = useState(false);
  const [supplierInviteDialogOpen, setSupplierInviteDialogOpen] = useState(false);
  const normalizeStoredDisplayText = (value: string | null | undefined) => {
    const normalized = value?.trim();
    if (!normalized) return null;
    if (locale !== 'de' && normalized === 'Unbenannt') return copy.unnamed;
    if (locale !== 'de' && normalized === 'Meine Organisation') {
      return 'My organisation';
    }
    return normalized;
  };
  const orgName = normalizeStoredDisplayText(register?.organisationName);
  const orgUnit = normalizeStoredDisplayText(register?.organisationUnit);
  const contactName = normalizeStoredDisplayText(
    register?.orgSettings?.contactPerson?.name,
  );

  useEffect(() => {
    if (initialSupplierInviteDialogOpen && registerFirstFlags.supplierInviteV2) {
      setSupplierInviteDialogOpen(true);
    }
  }, [initialSupplierInviteDialogOpen]);

  const counts = useMemo(() => {
    const byStatus: Record<RegisterUseCaseStatus, number> = {
      UNREVIEWED: 0,
      REVIEW_RECOMMENDED: 0,
      REVIEWED: 0,
      PROOF_READY: 0,
    };
    let publicCount = 0;

    for (const uc of useCases) {
      byStatus[uc.status] = (byStatus[uc.status] ?? 0) + 1;
      if (uc.isPublicVisible) publicCount++;
    }
    return { byStatus, publicCount, total: useCases.length };
  }, [useCases]);

  const openReviews =
    counts.byStatus.UNREVIEWED + counts.byStatus.REVIEW_RECOMMENDED;
  const nextStep =
    counts.total === 0
      ? copy.nextStepFirstCapture
      : externalInboxCount > 0
        ? copy.nextStepExternalInbox
        : openReviews > 0
          ? copy.nextStepOpenReviews
          : registerFirstFlags.supplierInviteV2
            ? copy.nextStepSupplierInvite
            : copy.nextStepShareLink;

  const handleSupplierRequest = async () => {
    if (!register?.registerId) return;
    setIsCreatingSupplierLink(true);
    try {
      const auth = await getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error(copy.signInAgain);
      }

      const response = await fetch('/api/request-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ registerId: register.registerId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data?.publicUrl !== 'string') {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : copy.submissionLinkCreateFailed,
        );
      }

      await navigator.clipboard.writeText(data.publicUrl);
      setSupplierLinkCopied(true);
      window.setTimeout(() => {
        setSupplierLinkCopied(false);
      }, 2200);
      toast({
        title: copy.submissionLinkCopied,
        description: copy.submissionLinkCopiedDesc,
      });
    } catch (error) {
      setSupplierLinkCopied(false);
      toast({
        variant: 'destructive',
        title: copy.error,
        description:
          error instanceof Error
            ? error.message
            : copy.linkCreateFailed,
      });
    } finally {
      setIsCreatingSupplierLink(false);
    }
  };

  const handleRevokeSupplierLink = async () => {
    if (!register?.registerId) return;
    setIsRevokingSupplierLink(true);
    try {
      const auth = await getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error(copy.signInAgain);
      }

      const response = await fetch(
        `/api/request-tokens?registerId=${encodeURIComponent(register.registerId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : copy.supplierLinkRevokeFailed,
        );
      }

      toast({
        title: copy.submissionLinkRevoked,
        description:
          typeof data?.revokedCount === 'number' && data.revokedCount > 0
            ? copy.activeLinksRevoked(data.revokedCount)
            : copy.noActiveSubmissionLink,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: copy.error,
        description:
          error instanceof Error
            ? error.message
            : copy.supplierLinkRevokeFailed,
      });
    } finally {
      setIsRevokingSupplierLink(false);
    }
  };

  const handleCopyCaptureLink = async () => {
    if (!register?.registerId) return;
    try {
      const codes = await accessCodeService.listCodes(register.registerId);
      const activeCode = codes.find(
        (code) =>
          code.isActive &&
          (!code.expiresAt || new Date(code.expiresAt) > new Date()),
      );
      const resolvedCode = activeCode
        ? activeCode.code
        : (
            await accessCodeService.generateCode(register.registerId, {
              label: 'Utility Link',
              expiryOption: '90_DAYS',
            })
          ).code;
      const captureLink = `${getPublicAppOrigin()}/erfassen?code=${encodeURIComponent(resolvedCode)}`;
      await navigator.clipboard.writeText(captureLink);
      setCaptureLinkCopied(true);
      window.setTimeout(() => {
        setCaptureLinkCopied(false);
      }, 2200);
      toast({
        title: copy.captureLinkCopied,
        description: copy.captureLinkCopiedDesc,
      });
    } catch {
      setCaptureLinkCopied(false);
      toast({
        variant: 'destructive',
        title: copy.error,
        description: copy.captureLinkCopyFailed,
      });
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600">
            {orgName ? (
              <>
                <span>
                  {copy.organisation}:{' '}
                  <span className="font-medium text-slate-950">{orgName}</span>
                </span>
                {orgUnit && (
                  <span>
                    {copy.organisationalUnit}:{' '}
                    <span className="font-medium text-slate-950">
                      {orgUnit}
                    </span>
                  </span>
                )}
                {contactName && (
                  <span>
                    {copy.contact}:{' '}
                    <span className="font-medium text-slate-950">
                      {contactName}
                    </span>
                  </span>
                )}
              </>
            ) : (
              <span>
                {copy.organisation}: {copy.privateRegisterInstance}
              </span>
            )}
            <span>
              {copy.registerVersion}: {REGISTER_VERSION}
            </span>
          </div>
          <p className="max-w-3xl text-[13px] leading-6 text-slate-600">
            {nextStep}
          </p>
        </div>

        <div className="w-full space-y-1 xl:w-auto">
          <div className="flex flex-wrap items-center justify-start gap-1.5 xl:justify-end">
            {register && (
              <button
                onClick={() => router.push(scopedHrefs.governanceSettings)}
                className="rounded-md border border-slate-300 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                title={copy.governanceSettings}
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
            {register && onQuickCapture && (
              <button
                onClick={onQuickCapture}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 sm:w-auto"
              >
                {copy.quickCapture}
              </button>
            )}
            {register && registerFirstFlags.supplierInviteV2 && (
              <button
                onClick={() => setSupplierInviteDialogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
              >
                <MailPlus className="h-3.5 w-3.5" />
                {copy.requestSupplier}
              </button>
            )}
            {register && (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 sm:w-auto">
                    {copy.actions}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem
                    onClick={() => void handleCopyCaptureLink()}
                    className="flex items-center gap-2"
                  >
                    {captureLinkCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                    {captureLinkCopied
                      ? copy.captureLinkCopied
                      : copy.copyCaptureLink}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void handleSupplierRequest()}
                    disabled={isCreatingSupplierLink}
                    className="flex items-center gap-2"
                  >
                    {isCreatingSupplierLink ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : supplierLinkCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    <div>
                      <div>
                        {supplierLinkCopied
                          ? copy.submissionLinkCopied
                          : copy.simpleSubmissionLink}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {copy.withoutVerification}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => void handleRevokeSupplierLink()}
                    disabled={isRevokingSupplierLink}
                    className="flex items-center gap-2 text-slate-600"
                  >
                    {isRevokingSupplierLink ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldX className="h-4 w-4" />
                    )}
                    {copy.revokeSubmissionLink}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {children && <div>{children}</div>}

      {register && registerFirstFlags.supplierInviteV2 && (
        <SupplierInviteCreateDialog
          open={supplierInviteDialogOpen}
          onOpenChange={setSupplierInviteDialogOpen}
          register={register}
          onCreated={onSupplierInvitesChanged}
        />
      )}

      <div className="grid gap-4 pt-5 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {copy.useCasesTotal}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {counts.total}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {copy.openReviews}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {openReviews}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {copy.externalSubmissions}
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold tabular-nums text-slate-900">
              {externalInboxCount}
            </p>
            <button
              type="button"
              onClick={() => router.push(scopedHrefs.externalInbox)}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {copy.view}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
