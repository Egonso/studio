'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Trash2 } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { PageStatePanel } from '@/components/product-shells';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { RegisterBoard } from '@/components/register/register-board';
import { RegisterDeleteDialog } from '@/components/register/register-delete-dialog';
import { ExternalSubmissionsInbox } from '@/components/register/external-submissions-inbox';
import { GovernanceHeader } from '@/components/register/governance-header';
import { QuickCaptureModal } from '@/components/register/quick-capture-modal';
import { CompanyOnboardingWizard } from '@/components/register/company-onboarding-wizard';
import { invalidateEntitlementCache } from '@/lib/compliance-engine/capability/useCapability';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import { registerFirstFlags } from '@/lib/register-first/flags';
import {
  registerService,
  type DeleteRegisterResult,
  type RegisterServiceErrorCode,
} from '@/lib/register-first/register-service';
import { syncRegisterEntitlement } from '@/lib/register-first/entitlement-client';
import {
  externalSubmissionService,
  isExternalSubmissionPermissionError,
} from '@/lib/register-first/external-submission-service';
import { parseRegisterScopeFromWorkspaceValue } from '@/lib/register-first/register-scope';
import type { Register, UseCaseCard } from '@/lib/register-first/types';
import {
  EXTERNAL_INBOX_FILTER,
  getVisiblePremiumControlNav,
  ROUTE_HREFS,
} from '@/lib/navigation/route-manifest';
import { setActiveWorkspaceId } from '@/lib/workspace-session';

type OnboardingState = 'loading' | 'no_register' | 'ready';
const CREATE_REGISTER_VALUE = '__create_register__';

function mapErrorCode(error: unknown): RegisterServiceErrorCode | null {
  if (error && typeof error === 'object' && 'code' in error) {
    return String(
      (error as { code: unknown }).code,
    ) as RegisterServiceErrorCode;
  }
  return null;
}

export default function MyRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { plan } = useCapability('reviewWorkflow');
  const initialFilter = searchParams.get('filter') as string | undefined;
  const onboardingParam = searchParams.get('onboarding');
  const workspaceScope = searchParams.get('workspace') ?? 'personal';
  const checkoutSessionId = searchParams.get('checkout_session_id');
  const scopeContext = useMemo(
    () => parseRegisterScopeFromWorkspaceValue(workspaceScope),
    [workspaceScope],
  );

  const [onboardingState, setOnboardingState] =
    useState<OnboardingState>('loading');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [useCases, setUseCases] = useState<UseCaseCard[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [activeRegister, setActiveRegister] = useState<Register | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [externalInboxCounts, setExternalInboxCounts] = useState({
    total: 0,
    open: 0,
  });

  const [hasChecked, setHasChecked] = useState(false);
  const [syncedEntitlementKey, setSyncedEntitlementKey] = useState<
    string | null
  >(null);
  const controlNavItems = getVisiblePremiumControlNav(plan);
  const hasGovernanceMenu = controlNavItems.length > 0;

  useEffect(() => {
    setActiveWorkspaceId(
      scopeContext.kind === 'workspace' ? scopeContext.workspaceId ?? null : null,
    );
  }, [scopeContext]);

  useEffect(() => {
    setHasChecked(false);
    setOnboardingState('loading');
    setUseCases([]);
    setRegisters([]);
    setActiveRegister(null);
  }, [workspaceScope]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (hasChecked) return;

    setHasChecked(true);
    registerService
      .listRegisters(scopeContext)
      .then(async (regs) => {
        if (regs.length > 0) {
          const selectedRegister =
            (await registerService
              .setActiveRegister(regs[0].registerId, scopeContext)
              .catch(() => regs[0])) ?? regs[0];
          setRegisters(regs);
          setActiveRegister(
            regs.find(
              (register) => register.registerId === selectedRegister.registerId,
            ) ?? selectedRegister,
          );
          setOnboardingState('ready');
          if (onboardingParam === 'true') {
            setCaptureOpen(true);
          }
          return;
        }

        registerService
          .createRegister('Meine Organisation', null, { scopeContext })
          .then((reg) => {
            return registerService
              .updateRegisterProfile(reg.registerId, {
                organisationName: 'Meine Organisation',
                orgSettings: {
                  organisationName: 'Meine Organisation',
                  industry: '',
                  contactPerson: { name: '', email: '' },
                },
              }, scopeContext)
              .then(() => {
                setRegisters([reg]);
                setActiveRegister(reg);
                setOnboardingState('ready');
                setCaptureOpen(true);
              });
          })
          .catch((err) => {
            console.error(err);
            setOnboardingState('no_register');
          });
      })
      .catch((err) => {
        const code = mapErrorCode(err);
        if (code === 'UNAUTHENTICATED') {
          router.push('/login');
        } else {
          setOnboardingState('no_register');
        }
      });
  }, [authLoading, user, hasChecked, router, onboardingParam, scopeContext]);

  useEffect(() => {
    if (!user || !activeRegister?.registerId) {
      return;
    }

    const syncKey = `${activeRegister.registerId}:${checkoutSessionId ?? ''}`;
    if (syncedEntitlementKey === syncKey) {
      return;
    }

    setSyncedEntitlementKey(syncKey);
    void syncRegisterEntitlement({
      registerId: activeRegister.registerId,
      sessionId: checkoutSessionId,
    })
      .then((result) => {
        if (result?.applied) {
          invalidateEntitlementCache();
        }
      })
      .catch((error) => {
        console.error('Register entitlement sync failed:', error);
      });
  }, [
    activeRegister?.registerId,
    checkoutSessionId,
    syncedEntitlementKey,
    user,
  ]);

  useEffect(() => {
    if (!user || !activeRegister?.registerId) {
      setExternalInboxCounts({ total: 0, open: 0 });
      return;
    }

    let cancelled = false;
    void externalSubmissionService
      .list(activeRegister.registerId, {}, scopeContext)
      .then((items) => {
        if (cancelled) return;
        setExternalInboxCounts({
          total: items.length,
          open: items.filter((item) => item.status === 'submitted').length,
        });
      })
      .catch((error) => {
        if (!isExternalSubmissionPermissionError(error)) {
          console.error('External inbox count load failed:', error);
        }
        if (!cancelled) {
          setExternalInboxCounts({ total: 0, open: 0 });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeRegister?.registerId, refreshKey, scopeContext, user]);

  const handleWizardComplete = async (registerId: string) => {
    const regs = await registerService.listRegisters(scopeContext);
    const selectedRegister =
      await registerService.setActiveRegister(registerId, scopeContext);
    setRegisters(regs);
    const newReg =
      regs.find((r) => r.registerId === selectedRegister.registerId) ??
      selectedRegister;
    setActiveRegister(newReg);
    setRefreshKey((key) => key + 1);
    setOnboardingState('ready');
    setShowWizard(false);
  };

  const handleSwitchRegister = async (registerId: string) => {
    const selectedRegister =
      await registerService.setActiveRegister(registerId, scopeContext);
    const reg =
      registers.find(
        (entry) => entry.registerId === selectedRegister.registerId,
      ) ?? selectedRegister;
    setActiveRegister(reg);
    setRefreshKey((k) => k + 1);
  };

  const handleCaptured = (useCaseId?: string) => {
    setRefreshKey((k) => k + 1);
    if (useCaseId) {
      router.push(`/my-register/${useCaseId}`);
    }
  };

  const handleUseCasesLoaded = (cards: UseCaseCard[]) => {
    setUseCases(cards);
  };

  const handleRegisterDeleted = async (result: DeleteRegisterResult) => {
    const regs = await registerService.listRegisters(scopeContext);
    const nextActiveRegister =
      regs.find(
        (register) => register.registerId === result.fallbackRegisterId,
      ) ??
      regs[0] ??
      null;

    setRegisters(regs);
    setActiveRegister(nextActiveRegister);
    setRefreshKey((key) => key + 1);
  };

  const handleDocumentLensChange = (lens: 'documents' | 'supplier_requests') => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (lens === 'supplier_requests') {
      nextSearchParams.set('filter', EXTERNAL_INBOX_FILTER);
    } else if (nextSearchParams.get('filter') === EXTERNAL_INBOX_FILTER) {
      nextSearchParams.delete('filter');
    }

    const nextQuery = nextSearchParams.toString();
    router.replace(
      nextQuery.length > 0 ? `/my-register?${nextQuery}` : '/my-register',
    );
  };

  if (authLoading || onboardingState === 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <PageStatePanel
              tone="loading"
              area="signed_in_free_register"
              title="Register wird geladen"
              description="Use Cases, External Inbox und Registerkontext werden vorbereitet."
            />
          </div>
        </main>
      </div>
    );
  }

  if (onboardingState === 'no_register' || showWizard) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <PageStatePanel
              area="signed_in_free_register"
              title="Starten Sie mit Ihrem ersten Register"
              description="Ein Register ist Ihr Arbeitsbereich zum Dokumentieren, Prüfen und Einsammeln externer Angaben. Danach sind Register, Use Cases, External Inbox und Settings direkt verfügbar."
            />
            <div className="flex justify-center">
              <CompanyOnboardingWizard
                onComplete={(registerId) =>
                  void handleWizardComplete(registerId)
                }
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const showingExternalInbox = initialFilter === EXTERNAL_INBOX_FILTER;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <GovernanceHeader
            useCases={useCases}
            register={activeRegister}
            externalInboxCount={externalInboxCounts.total}
            onQuickCapture={() => setCaptureOpen(true)}
          >
            {activeRegister && (
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={activeRegister?.registerId ?? ''}
                  onValueChange={(registerId) => {
                    if (registerId === CREATE_REGISTER_VALUE) {
                      setShowWizard(true);
                      return;
                    }

                    void handleSwitchRegister(registerId);
                  }}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Register auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {registers.map((r) => (
                      <SelectItem key={r.registerId} value={r.registerId}>
                        {r.organisationName || r.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={CREATE_REGISTER_VALUE}>
                      Neues Register anlegen
                    </SelectItem>
                  </SelectContent>
                </Select>
                {hasGovernanceMenu ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 gap-1.5 border-slate-300 px-3 text-[13px] text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                      >
                        Bericht
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {controlNavItems.map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          onClick={() => router.push(item.href)}
                        >
                          {item.id === 'overview'
                            ? 'Bericht öffnen'
                            : item.label}
                        </DropdownMenuItem>
                      ))}
                      {registerFirstFlags.registerDeletion && activeRegister && (
                        <>
                          <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Register löschen
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="outline"
                    className="h-10 border-slate-300 px-3 text-[13px] text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    onClick={() => router.push(ROUTE_HREFS.control)}
                  >
                    Bericht
                  </Button>
                )}
              </div>
            )}
          </GovernanceHeader>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => handleDocumentLensChange('documents')}
                className={`rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  showingExternalInbox
                    ? 'text-slate-600 hover:text-slate-950'
                    : 'bg-slate-100 text-slate-950'
                }`}
              >
                Alle Dokumente
              </button>
              <button
                type="button"
                onClick={() => handleDocumentLensChange('supplier_requests')}
                className={`rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  showingExternalInbox
                    ? 'bg-slate-100 text-slate-950'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Lieferantenanfragen
                <span className="ml-1.5 text-slate-500">
                  {externalInboxCounts.total}
                </span>
              </button>
            </div>
          </div>
          {showingExternalInbox ? (
            <ExternalSubmissionsInbox
              register={activeRegister}
              refreshKey={refreshKey}
              onCountsChange={setExternalInboxCounts}
              title="Lieferantenanfragen"
              description="Externe Einreichungen aus Lieferantenlinks, Erfassungslinks und Imports."
            />
          ) : (
            <RegisterBoard
              mode="standalone"
              registerId={activeRegister?.registerId}
              refreshKey={refreshKey}
              onUseCasesLoaded={handleUseCasesLoaded}
              initialFilter={initialFilter}
            />
          )}
          <RegisterDeleteDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            register={activeRegister}
            onDeleted={handleRegisterDeleted}
          />
          <QuickCaptureModal
            open={captureOpen}
            onOpenChange={setCaptureOpen}
            onCaptured={handleCaptured}
          />
        </div>
      </main>
    </div>
  );
}
