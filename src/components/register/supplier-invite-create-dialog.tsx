'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, MailPlus, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseAuth } from '@/lib/firebase';
import type { Register } from '@/lib/register-first/types';

const MAX_BATCH_CONTACTS = 20;
const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

interface SupplierInviteCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  register: Register;
  onCreated?: () => void;
}

interface CreateInviteResponse {
  publicUrl?: string;
  inviteEmailSent?: boolean;
  error?: string;
}

interface BatchInviteResponse {
  campaignId?: string;
  recipientCount?: number;
  duplicateCount?: number;
  inviteEmailSentCount?: number;
  inviteEmailFailedCount?: number;
  error?: string;
}

interface ParsedBatchContact {
  intendedEmail: string;
  supplierOrganisationHint?: string;
}

interface ParsedBatchInput {
  contacts: ParsedBatchContact[];
  duplicateCount: number;
  invalidRows: string[];
}

function parseBatchContacts(raw: string): ParsedBatchInput {
  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const contacts: ParsedBatchContact[] = [];
  const invalidRows: string[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;

  for (const line of lines) {
    const cells = line
      .split(/[;,\t]/)
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    const emailIndex = cells.findIndex((cell) => SIMPLE_EMAIL_PATTERN.test(cell));
    if (emailIndex === -1) {
      invalidRows.push(line);
      continue;
    }

    const intendedEmail = cells[emailIndex]!.toLowerCase();
    if (seen.has(intendedEmail)) {
      duplicateCount += 1;
      continue;
    }

    seen.add(intendedEmail);

    const supplierOrganisationHint = cells
      .filter((_, index) => index !== emailIndex)
      .join(' / ');

    contacts.push({
      intendedEmail,
      supplierOrganisationHint:
        supplierOrganisationHint.length > 0 ? supplierOrganisationHint : undefined,
    });
  }

  return {
    contacts,
    duplicateCount,
    invalidRows,
  };
}

async function copyToClipboard(value: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  await navigator.clipboard.writeText(value);
  return true;
}

async function getAuthToken(): Promise<string> {
  const auth = await getFirebaseAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Bitte melden Sie sich erneut an.');
  }
  return token;
}

export function SupplierInviteCreateDialog({
  open,
  onOpenChange,
  register,
  onCreated,
}: SupplierInviteCreateDialogProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [intendedEmail, setIntendedEmail] = useState('');
  const [supplierOrganisationHint, setSupplierOrganisationHint] = useState('');
  const [campaignLabel, setCampaignLabel] = useState('');
  const [campaignContext, setCampaignContext] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [batchSource, setBatchSource] = useState<'manual' | 'csv'>('manual');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode('single');
      setIntendedEmail('');
      setSupplierOrganisationHint('');
      setCampaignLabel('');
      setCampaignContext('');
      setBatchInput('');
      setBatchSource('manual');
      setSubmitting(false);
    }
  }, [open]);

  const organisationName =
    register.organisationName ?? register.name ?? 'Ihre Organisation';

  const parsedBatch = useMemo(
    () => parseBatchContacts(batchInput),
    [batchInput],
  );

  const tooManyBatchContacts =
    parsedBatch.contacts.length > MAX_BATCH_CONTACTS;

  const handleSingleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/supplier-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registerId: register.registerId,
          intendedEmail: intendedEmail.trim(),
          supplierOrganisationHint: supplierOrganisationHint.trim() || undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as CreateInviteResponse;
      if (!response.ok) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : 'Lieferantenanfrage konnte nicht erstellt werden.',
        );
      }

      if (data.inviteEmailSent === false && data.publicUrl) {
        const copied = await copyToClipboard(data.publicUrl);
        toast({
          title: 'Anfrage erstellt',
          description:
            copied
              ? 'Die E-Mail konnte nicht versendet werden. Der persoenliche Link wurde in die Zwischenablage kopiert.'
              : 'Die E-Mail konnte nicht versendet werden. Nutzen Sie den erzeugten persoenlichen Link aus der API-Antwort fuer die manuelle Weitergabe.',
        });
      } else {
        toast({
          title: 'Lieferantenanfrage versendet',
          description:
            'Die kontaktgebundene Anfrage wurde per E-Mail zugestellt und kann danach verifiziert beantwortet werden.',
        });
      }

      onCreated?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description:
          error instanceof Error
            ? error.message
            : 'Lieferantenanfrage konnte nicht erstellt werden.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/supplier-invite/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registerId: register.registerId,
          campaignLabel: campaignLabel.trim() || undefined,
          campaignContext: campaignContext.trim() || undefined,
          source: batchSource,
          contacts: parsedBatch.contacts,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as BatchInviteResponse;
      if (!response.ok) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : 'Sammelanfrage konnte nicht erstellt werden.',
        );
      }

      const recipientCount = data.recipientCount ?? parsedBatch.contacts.length;
      const duplicateCount = data.duplicateCount ?? parsedBatch.duplicateCount;
      const inviteEmailFailedCount = data.inviteEmailFailedCount ?? 0;

      toast({
        title: 'Sammelanfrage erstellt',
        description:
          inviteEmailFailedCount > 0
            ? `${recipientCount} Kontakte wurden angelegt. ${inviteEmailFailedCount} E-Mail${inviteEmailFailedCount === 1 ? '' : 's'} konnten nicht automatisch zugestellt werden.`
            : duplicateCount > 0
              ? `${recipientCount} Kontakte wurden angelegt. ${duplicateCount} Dopplung${duplicateCount === 1 ? '' : 'en'} wurden zusammengefuehrt.`
              : `${recipientCount} Kontakte wurden als Anfragegruppe angelegt und per E-Mail informiert.`,
      });

      onCreated?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description:
          error instanceof Error
            ? error.message
            : 'Sammelanfrage konnte nicht erstellt werden.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setBatchInput(text);
      setBatchSource('csv');
      toast({
        title: 'CSV geladen',
        description:
          'Die Datei wurde eingelesen. Bitte pruefen Sie die Vorschau vor dem Absenden.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'CSV-Datei konnte nicht gelesen werden.',
      });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Lieferanten anfragen</DialogTitle>
          <DialogDescription>
            {organisationName} fordert Angaben direkt bei benannten Kontakten an.
            Verifizierte Anfragen laufen ueber E-Mail-Code, der einfache
            Einreichungslink ohne Verifikation bleibt als separater Utility-Pfad
            verfuegbar.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as 'single' | 'batch')}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="single">Einzelkontakt</TabsTrigger>
            <TabsTrigger value="batch">Mehrere Kontakte</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-invite-email">Empfaenger-E-Mail</Label>
              <Input
                id="supplier-invite-email"
                type="email"
                autoComplete="email"
                placeholder="name@lieferant.de"
                value={intendedEmail}
                onChange={(event) => setIntendedEmail(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier-invite-org">Lieferantenorganisation</Label>
              <Input
                id="supplier-invite-org"
                placeholder="Optional, z. B. Muster GmbH"
                value={supplierOrganisationHint}
                onChange={(event) => setSupplierOrganisationHint(event.target.value)}
              />
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] leading-6 text-slate-600">
              Eine noch offene Anfrage an dieselbe E-Mail-Adresse wird ersetzt.
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="supplier-campaign-label">Bezeichnung</Label>
                <Input
                  id="supplier-campaign-label"
                  placeholder="Optional, z. B. Lieferantenrunde Q2"
                  value={campaignLabel}
                  onChange={(event) => setCampaignLabel(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplier-campaign-file">CSV importieren</Label>
                <Input
                  id="supplier-campaign-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => void handleCsvUpload(event)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier-campaign-context">Kontext</Label>
              <Textarea
                id="supplier-campaign-context"
                placeholder="Optional, z. B. Jahrespruefung, Projekt oder Audit-Kontext"
                value={campaignContext}
                onChange={(event) => setCampaignContext(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier-campaign-contacts">
                Kontakte
              </Label>
              <Textarea
                id="supplier-campaign-contacts"
                className="min-h-[180px]"
                placeholder={[
                  'Ein Kontakt pro Zeile oder CSV-Zeile.',
                  'Beispiele:',
                  'name@lieferant.de',
                  'name@lieferant.de, Lieferant GmbH',
                  'Lieferant GmbH; name@lieferant.de',
                ].join('\n')}
                value={batchInput}
                onChange={(event) => {
                  setBatchSource('manual');
                  setBatchInput(event.target.value);
                }}
              />
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] leading-6 text-slate-600">
              <div>
                {parsedBatch.contacts.length} gueltige Kontakte
                {parsedBatch.duplicateCount > 0
                  ? ` · ${parsedBatch.duplicateCount} Dopplung${parsedBatch.duplicateCount === 1 ? '' : 'en'}`
                  : ''}
                {parsedBatch.invalidRows.length > 0
                  ? ` · ${parsedBatch.invalidRows.length} ungueltige Zeile${parsedBatch.invalidRows.length === 1 ? '' : 'n'}`
                  : ''}
              </div>
              <div>Maximal {MAX_BATCH_CONTACTS} Kontakte pro Anfragegruppe.</div>
              {tooManyBatchContacts && (
                <div className="text-red-700">
                  Bitte reduzieren Sie die Anfragegruppe auf maximal {MAX_BATCH_CONTACTS} Kontakte.
                </div>
              )}
            </div>

            {parsedBatch.contacts.length > 0 && (
              <div className="rounded-md border border-slate-200 px-4 py-3">
                <div className="text-sm font-medium text-slate-900">
                  Vorschau
                </div>
                <div className="mt-2 space-y-1 text-[13px] text-slate-600">
                  {parsedBatch.contacts.slice(0, 5).map((contact) => (
                    <div key={contact.intendedEmail}>
                      {contact.intendedEmail}
                      {contact.supplierOrganisationHint
                        ? ` · ${contact.supplierOrganisationHint}`
                        : ''}
                    </div>
                  ))}
                  {parsedBatch.contacts.length > 5 && (
                    <div>
                      + {parsedBatch.contacts.length - 5} weitere Kontakte
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Abbrechen
          </Button>
          <Button
            onClick={() =>
              void (mode === 'single' ? handleSingleSubmit() : handleBatchSubmit())
            }
            disabled={
              submitting ||
              (mode === 'single'
                ? intendedEmail.trim().length === 0
                : parsedBatch.contacts.length === 0 || tooManyBatchContacts)
            }
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : mode === 'single' ? (
              <MailPlus className="mr-2 h-4 w-4" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {mode === 'single' ? 'Anfrage senden' : 'Anfragegruppe anlegen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
