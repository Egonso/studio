'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  children?: React.ReactNode;
}

// ── Component ────────────────────────────────────────────────────────────────

export function GovernanceHeader({
  useCases,
  register,
  externalInboxCount = 0,
  onQuickCapture,
  onSupplierInvitesChanged,
  children,
}: GovernanceHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const scopedHrefs = useScopedRouteHrefs();
  const [supplierLinkCopied, setSupplierLinkCopied] = useState(false);
  const [captureLinkCopied, setCaptureLinkCopied] = useState(false);
  const [isCreatingSupplierLink, setIsCreatingSupplierLink] = useState(false);
  const [isRevokingSupplierLink, setIsRevokingSupplierLink] = useState(false);
  const [supplierInviteDialogOpen, setSupplierInviteDialogOpen] = useState(false);
  const orgName = register?.organisationName;
  const orgUnit = register?.organisationUnit;
  const orgSettings = register?.orgSettings;

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
      ? 'Capture your first AI use case.'
      : externalInboxCount > 0
        ? 'Review new external submissions in the External Inbox.'
        : openReviews > 0
          ? 'Process open reviews and advance use cases.'
          : registerFirstFlags.supplierInviteV2
            ? 'Start a contact-bound supplier request or share a capture link to collect further information.'
            : 'Share a capture or submission link to collect further information.';

  const handleSupplierRequest = async () => {
    if (!register?.registerId) return;
    setIsCreatingSupplierLink(true);
    try {
      const auth = await getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Please sign in again.');
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
            : 'Submission link could not be created.',
        );
      }

      await navigator.clipboard.writeText(data.publicUrl);
      setSupplierLinkCopied(true);
      window.setTimeout(() => {
        setSupplierLinkCopied(false);
      }, 2200);
      toast({
        title: 'Submission link copied',
        description:
          'A new submission link has been created and copied to the clipboard. Only send it to the intended contact.',
      });
    } catch (error) {
      setSupplierLinkCopied(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Link could not be created.',
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
        throw new Error('Please sign in again.');
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
            : 'Supplier link could not be revoked.',
        );
      }

      toast({
        title: 'Submission link revoked',
        description:
          typeof data?.revokedCount === 'number' && data.revokedCount > 0
            ? `${data.revokedCount} active link(s) revoked.`
            : 'There was no active submission link.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Supplier link could not be revoked.',
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
        title: 'Capture link copied',
        description: 'The link has been copied to the clipboard.',
      });
    } catch {
      setCaptureLinkCopied(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Capture link could not be copied.',
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
                  Organisation:{' '}
                  <span className="font-medium text-slate-950">{orgName}</span>
                </span>
                {orgUnit && (
                  <span>
                    Organisational unit:{' '}
                    <span className="font-medium text-slate-950">
                      {orgUnit}
                    </span>
                  </span>
                )}
                {orgSettings?.contactPerson?.name && (
                  <span>
                    Contact:{' '}
                    <span className="font-medium text-slate-950">
                      {orgSettings.contactPerson.name}
                    </span>
                  </span>
                )}
              </>
            ) : (
              <span>Organisation: Private register instance</span>
            )}
            <span>Register version: {REGISTER_VERSION}</span>
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
                title="Governance settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
            {register && onQuickCapture && (
              <button
                onClick={onQuickCapture}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 sm:w-auto"
              >
                + Capture AI use case
              </button>
            )}
            {register && registerFirstFlags.supplierInviteV2 && (
              <button
                onClick={() => setSupplierInviteDialogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
              >
                <MailPlus className="h-3.5 w-3.5" />
                Request supplier
              </button>
            )}
            {register && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 sm:w-auto">
                    Actions
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
                    {captureLinkCopied ? 'Capture link copied' : 'Copy capture link'}
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
                      <div>{supplierLinkCopied ? 'Submission link copied' : 'Simple submission link'}</div>
                      <div className="text-[11px] text-muted-foreground">Without verification</div>
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
                    Revoke submission link
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
            Use cases total
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {counts.total}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Open reviews
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {openReviews}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            External submissions
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
              View
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
