'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Link2,
  Loader2,
  Plus,
  Search,
  Settings2,
  X,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type {
  AffiliateCommission,
  AffiliateGlobalSettings,
  AffiliateRecord,
} from '@/lib/affiliate/types';
import { AFFILIATE_DEFAULTS } from '@/lib/affiliate/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AffiliateAdminPanelProps {
  affiliates: AffiliateRecord[];
  globalSettings: AffiliateGlobalSettings | null;
  usersList: { email: string; displayName?: string | null }[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSaveGlobalSettings: (settings: {
    defaultCommissionBoostRate: number;
    defaultCommissionOngoingRate: number;
    defaultBoostPeriodMonths: number;
    defaultAttributionWindowMonths: number;
  }) => Promise<void>;
  onCreate: (input: { email: string; slug: string }) => Promise<{ success: true } | { success: false; error: string }>;
  onUpdate: (input: {
    email: string;
    slug?: string;
    active?: boolean;
    commissionBoostRate?: number | null;
    commissionOngoingRate?: number | null;
    boostPeriodMonths?: number | null;
    attributionWindowMonths?: number | null;
  }) => Promise<void>;
  onLoadCommissions: (email: string) => Promise<AffiliateCommission[]>;
  onForceResetAll: () => Promise<{ resetCount: number }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEur(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AffiliateAdminPanel({
  affiliates,
  globalSettings,
  usersList,
  loading,
  onRefresh,
  onSaveGlobalSettings,
  onCreate,
  onUpdate,
  onLoadCommissions,
  onForceResetAll,
}: AffiliateAdminPanelProps) {
  // Search
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    boostRate: globalSettings?.defaultCommissionBoostRate ?? AFFILIATE_DEFAULTS.defaultCommissionBoostRate,
    ongoingRate: globalSettings?.defaultCommissionOngoingRate ?? AFFILIATE_DEFAULTS.defaultCommissionOngoingRate,
    boostMonths: globalSettings?.defaultBoostPeriodMonths ?? AFFILIATE_DEFAULTS.defaultBoostPeriodMonths,
    attributionMonths: globalSettings?.defaultAttributionWindowMonths ?? AFFILIATE_DEFAULTS.defaultAttributionWindowMonths,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createUserSearch, setCreateUserSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Detail panel
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState('');
  const [editBoostRate, setEditBoostRate] = useState<string>('');
  const [editOngoingRate, setEditOngoingRate] = useState<string>('');
  const [editBoostMonths, setEditBoostMonths] = useState<string>('');
  const [editAttrMonths, setEditAttrMonths] = useState<string>('');
  const [useDefaultBoost, setUseDefaultBoost] = useState(true);
  const [useDefaultOngoing, setUseDefaultOngoing] = useState(true);
  const [useDefaultBoostMonths, setUseDefaultBoostMonths] = useState(true);
  const [useDefaultAttrMonths, setUseDefaultAttrMonths] = useState(true);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailCommissions, setDetailCommissions] = useState<AffiliateCommission[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState(false);

  // Sync settings form when globalSettings loads
  const effectiveSettings = globalSettings ?? {
    ...AFFILIATE_DEFAULTS,
    updatedAt: '',
    updatedBy: '',
  };

  // Filtered affiliates
  const filtered = useMemo(() => {
    if (!deferredSearch) return affiliates;
    const q = deferredSearch.toLowerCase();
    return affiliates.filter(
      (a) =>
        a.email.includes(q) ||
        a.slug.includes(q),
    );
  }, [affiliates, deferredSearch]);

  // Filtered users for create dialog
  const filteredUsers = useMemo(() => {
    const existingEmails = new Set(affiliates.map((a) => a.email));
    const q = createUserSearch.toLowerCase();
    return usersList
      .filter((u) => !existingEmails.has(u.email.toLowerCase()))
      .filter((u) => {
        if (!q) return true;
        return (
          u.email.toLowerCase().includes(q) ||
          (u.displayName ?? '').toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [usersList, affiliates, createUserSearch]);

  const selectedAffiliate = useMemo(
    () => affiliates.find((a) => a.email === selectedEmail) ?? null,
    [affiliates, selectedEmail],
  );

  // Open detail
  const openDetail = useCallback(
    async (affiliate: AffiliateRecord) => {
      setSelectedEmail(affiliate.email);
      setEditSlug(affiliate.slug);
      setEditBoostRate(String(affiliate.commissionBoostRate ?? ''));
      setEditOngoingRate(String(affiliate.commissionOngoingRate ?? ''));
      setEditBoostMonths(String(affiliate.boostPeriodMonths ?? ''));
      setEditAttrMonths(String(affiliate.attributionWindowMonths ?? ''));
      setUseDefaultBoost(affiliate.commissionBoostRate === null);
      setUseDefaultOngoing(affiliate.commissionOngoingRate === null);
      setUseDefaultBoostMonths(affiliate.boostPeriodMonths === null);
      setUseDefaultAttrMonths(affiliate.attributionWindowMonths === null);

      setCommissionsLoading(true);
      try {
        const comms = await onLoadCommissions(affiliate.email);
        setDetailCommissions(comms);
      } catch {
        setDetailCommissions([]);
      } finally {
        setCommissionsLoading(false);
      }
    },
    [onLoadCommissions],
  );

  // Save settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await onSaveGlobalSettings({
        defaultCommissionBoostRate: settingsForm.boostRate,
        defaultCommissionOngoingRate: settingsForm.ongoingRate,
        defaultBoostPeriodMonths: settingsForm.boostMonths,
        defaultAttributionWindowMonths: settingsForm.attributionMonths,
      });
      await onRefresh();
    } finally {
      setSavingSettings(false);
    }
  };

  // Create affiliate
  const handleCreate = async () => {
    if (!createEmail || !createSlug) return;
    setCreating(true);
    setCreateError(null);
    try {
      const result = await onCreate({ email: createEmail, slug: slugify(createSlug) });
      if (!result.success) {
        setCreateError(result.error);
        return;
      }
      setCreateOpen(false);
      setCreateEmail('');
      setCreateSlug('');
      setCreateUserSearch('');
      await onRefresh();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Fehler beim Erstellen.');
    } finally {
      setCreating(false);
    }
  };

  // Save detail
  const handleSaveDetail = async () => {
    if (!selectedEmail) return;
    setDetailSaving(true);
    try {
      await onUpdate({
        email: selectedEmail,
        slug: editSlug || undefined,
        commissionBoostRate: useDefaultBoost ? null : Number(editBoostRate) || null,
        commissionOngoingRate: useDefaultOngoing ? null : Number(editOngoingRate) || null,
        boostPeriodMonths: useDefaultBoostMonths ? null : Number(editBoostMonths) || null,
        attributionWindowMonths: useDefaultAttrMonths ? null : Number(editAttrMonths) || null,
      });
      await onRefresh();
    } finally {
      setDetailSaving(false);
    }
  };

  // Toggle active
  const handleToggleActive = async (affiliate: AffiliateRecord) => {
    await onUpdate({ email: affiliate.email, active: !affiliate.active });
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Global Settings                                                    */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            <CardTitle>Globale Affiliate-Einstellungen</CardTitle>
          </div>
          <CardDescription>
            Standard-Provisionsraten und -Zeiträume. Individuell überschriebene Werte gelten vor diesen Defaults.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Boost-Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settingsForm.boostRate}
                onChange={(e) =>
                  setSettingsForm((s) => ({ ...s, boostRate: Number(e.target.value) }))
                }
              />
              <p className="text-xs text-muted-foreground">Netto-Anteil während Boost</p>
            </div>
            <div className="space-y-1.5">
              <Label>Ongoing-Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settingsForm.ongoingRate}
                onChange={(e) =>
                  setSettingsForm((s) => ({ ...s, ongoingRate: Number(e.target.value) }))
                }
              />
              <p className="text-xs text-muted-foreground">Netto-Anteil nach Boost</p>
            </div>
            <div className="space-y-1.5">
              <Label>Boost-Dauer (Monate)</Label>
              <Input
                type="number"
                min={1}
                max={36}
                value={settingsForm.boostMonths}
                onChange={(e) =>
                  setSettingsForm((s) => ({ ...s, boostMonths: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Attribution-Window (Monate)</Label>
              <Input
                type="number"
                min={1}
                max={36}
                value={settingsForm.attributionMonths}
                onChange={(e) =>
                  setSettingsForm((s) => ({ ...s, attributionMonths: Number(e.target.value) }))
                }
              />
              <p className="text-xs text-muted-foreground">Cookie-Lebensdauer</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Defaults speichern
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Alle auf Defaults zurücksetzen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Alle Overrides zurücksetzen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dies entfernt alle individuellen Provisions-Einstellungen bei allen Affiliates.
                    Danach gelten für alle die globalen Defaults. Dieser Vorgang kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const result = await onForceResetAll();
                      await onRefresh();
                      alert(`${result.resetCount} Affiliate(s) zurückgesetzt.`);
                    }}
                  >
                    Ja, alle zurücksetzen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Affiliate List                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              <CardTitle>Affiliates ({affiliates.length})</CardTitle>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Affiliate anlegen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Affiliate anlegen</DialogTitle>
                  <DialogDescription>
                    Wähle einen bestehenden Nutzer und vergib einen einzigartigen Slug für den Affiliate-Link.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Nutzer suchen</Label>
                    <Input
                      placeholder="Email oder Name..."
                      value={createUserSearch}
                      onChange={(e) => setCreateUserSearch(e.target.value)}
                    />
                    {filteredUsers.length > 0 && createUserSearch && (
                      <div className="max-h-40 overflow-y-auto rounded-md border bg-background">
                        {filteredUsers.map((u) => (
                          <button
                            key={u.email}
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setCreateEmail(u.email);
                              setCreateSlug(slugify(u.displayName ?? u.email.split('@')[0]));
                              setCreateUserSearch('');
                            }}
                          >
                            <span className="font-medium">{u.displayName ?? '—'}</span>
                            <span className="text-muted-foreground">{u.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {createEmail && (
                    <>
                      <div className="space-y-1.5">
                        <Label>Ausgewählt</Label>
                        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                          <span className="font-medium">{createEmail}</span>
                          <button
                            type="button"
                            className="ml-auto text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setCreateEmail('');
                              setCreateSlug('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Affiliate-Slug</Label>
                        <Input
                          value={createSlug}
                          onChange={(e) => setCreateSlug(e.target.value)}
                          placeholder="z.B. firmenname"
                        />
                        <p className="text-xs text-muted-foreground">
                          Link: kiregister.com/ref/{slugify(createSlug) || '...'}
                        </p>
                      </div>
                    </>
                  )}
                  {createError && (
                    <p className="text-sm text-red-600">{createError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreate}
                    disabled={!createEmail || !createSlug || creating}
                  >
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Anlegen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Alle eingerichteten Affiliates mit ihren Stats und Einstellungen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Email oder Slug suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              {affiliates.length === 0
                ? 'Noch keine Affiliates angelegt.'
                : 'Keine Ergebnisse für diese Suche.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Signups</TableHead>
                  <TableHead className="text-right">Käufe</TableHead>
                  <TableHead className="text-right">Einnahmen</TableHead>
                  <TableHead>Connect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((aff) => (
                  <TableRow
                    key={aff.email}
                    className="cursor-pointer"
                    onClick={() => openDetail(aff)}
                  >
                    <TableCell className="font-medium">{aff.email}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        /ref/{aff.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={aff.active ? 'default' : 'secondary'}>
                        {aff.active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{aff.totalClicks}</TableCell>
                    <TableCell className="text-right">{aff.totalSignups}</TableCell>
                    <TableCell className="text-right">{aff.totalPurchases}</TableCell>
                    <TableCell className="text-right">{formatEur(aff.totalEarnings)}</TableCell>
                    <TableCell>
                      {aff.stripeConnectOnboardingComplete ? (
                        <Badge variant="default" className="bg-green-600">Verbunden</Badge>
                      ) : aff.stripeConnectAccountId ? (
                        <Badge variant="secondary">Ausstehend</Badge>
                      ) : (
                        <Badge variant="outline">Nicht verbunden</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Detail Panel                                                       */}
      {/* ----------------------------------------------------------------- */}
      {selectedAffiliate && (
        <Card className="border-slate-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Affiliate: {selectedAffiliate.email}
                </CardTitle>
                <CardDescription>
                  Erstellt am {new Date(selectedAffiliate.createdAt).toLocaleDateString('de-DE')} von {selectedAffiliate.createdBy}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="active-toggle" className="text-sm">Aktiv</Label>
                  <Switch
                    id="active-toggle"
                    checked={selectedAffiliate.active}
                    onCheckedChange={() => handleToggleActive(selectedAffiliate)}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Slug */}
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <div className="flex gap-2">
                <Input
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="max-w-xs"
                />
                <CopyButton text={`https://kiregister.com/ref/${editSlug}`} />
              </div>
              <p className="text-xs text-muted-foreground">
                Link: https://kiregister.com/ref/{editSlug}
              </p>
            </div>

            {/* Commission overrides */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <OverrideField
                label="Boost-Rate (%)"
                value={editBoostRate}
                onChange={setEditBoostRate}
                useDefault={useDefaultBoost}
                onToggleDefault={setUseDefaultBoost}
                defaultValue={effectiveSettings.defaultCommissionBoostRate}
              />
              <OverrideField
                label="Ongoing-Rate (%)"
                value={editOngoingRate}
                onChange={setEditOngoingRate}
                useDefault={useDefaultOngoing}
                onToggleDefault={setUseDefaultOngoing}
                defaultValue={effectiveSettings.defaultCommissionOngoingRate}
              />
              <OverrideField
                label="Boost-Dauer (Monate)"
                value={editBoostMonths}
                onChange={setEditBoostMonths}
                useDefault={useDefaultBoostMonths}
                onToggleDefault={setUseDefaultBoostMonths}
                defaultValue={effectiveSettings.defaultBoostPeriodMonths}
              />
              <OverrideField
                label="Attribution (Monate)"
                value={editAttrMonths}
                onChange={setEditAttrMonths}
                useDefault={useDefaultAttrMonths}
                onToggleDefault={setUseDefaultAttrMonths}
                defaultValue={effectiveSettings.defaultAttributionWindowMonths}
              />
            </div>

            <Button onClick={handleSaveDetail} disabled={detailSaving}>
              {detailSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Änderungen speichern
            </Button>

            {/* Stripe Connect Status */}
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium">Stripe Connect</h4>
              {selectedAffiliate.stripeConnectOnboardingComplete ? (
                <p className="mt-1 text-sm text-green-700">
                  <Check className="mr-1 inline h-4 w-4" />
                  Konto verbunden (ID: {selectedAffiliate.stripeConnectAccountId})
                </p>
              ) : selectedAffiliate.stripeConnectAccountId ? (
                <p className="mt-1 text-sm text-amber-600">
                  Onboarding ausstehend (ID: {selectedAffiliate.stripeConnectAccountId})
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Kein Stripe-Konto verbunden. Der Affiliate muss über seine Settings die Verbindung herstellen.
                </p>
              )}
            </div>

            {/* Commission history */}
            <div>
              <h4 className="mb-2 text-sm font-medium">Letzte Provisionen</h4>
              {commissionsLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : detailCommissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Provisionen.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Referred</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Provision</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailCommissions.slice(0, 20).map((c) => (
                      <TableRow key={c.commissionId}>
                        <TableCell className="text-xs">
                          {new Date(c.createdAt).toLocaleDateString('de-DE')}
                        </TableCell>
                        <TableCell className="text-xs">{maskEmail(c.referredEmail)}</TableCell>
                        <TableCell className="text-right text-xs">{formatEur(c.grossAmount)}</TableCell>
                        <TableCell className="text-right text-xs">
                          {c.commissionRate}%{c.isBoostPeriod ? ' (Boost)' : ''}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium">
                          {formatEur(c.commissionAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.payoutStatus === 'transferred'
                                ? 'default'
                                : c.payoutStatus === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {c.payoutStatus === 'transferred'
                              ? 'Ausgezahlt'
                              : c.payoutStatus === 'failed'
                                ? 'Fehlgeschlagen'
                                : c.payoutStatus === 'no_connect_account'
                                  ? 'Kein Konto'
                                  : 'Ausstehend'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OverrideField({
  label,
  value,
  onChange,
  useDefault,
  onToggleDefault,
  defaultValue,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  useDefault: boolean;
  onToggleDefault: (v: boolean) => void;
  defaultValue: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        value={useDefault ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        disabled={useDefault}
        placeholder={useDefault ? `Default: ${defaultValue}` : ''}
      />
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={useDefault}
          onChange={(e) => onToggleDefault(e.target.checked)}
          className="rounded"
        />
        Default verwenden
      </label>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
      {copied ? 'Kopiert' : 'Kopieren'}
    </Button>
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}
