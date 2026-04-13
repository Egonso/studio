"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  MailPlus,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getFirebaseAuth } from "@/lib/firebase";
import type {
  SupplierInviteCampaignSource,
  SupplierInviteStatus,
} from "@/lib/register-first/supplier-invite-types";

interface InviteListItem {
  inviteId: string;
  registerId: string;
  ownerId: string;
  status: SupplierInviteStatus;
  intendedEmail: string;
  intendedDomain: string;
  supplierOrganisationHint?: string | null;
  maxSubmissions: number;
  submissionCount: number;
  createdAt: string;
  createdBy: string;
  createdByEmail?: string | null;
  campaignId?: string | null;
  campaignLabel?: string | null;
  campaignContext?: string | null;
  campaignSource?: SupplierInviteCampaignSource | null;
  expiresAt: string;
  revokedAt?: string | null;
  firstUsedAt?: string | null;
  lastUsedAt?: string | null;
  inviteEmailSentAt?: string | null;
  deliveryFailed: boolean;
  otpDeliveryFailed?: boolean;
  remindersSent?: number;
  lastReminderAt?: string | null;
  reminderOptOut?: boolean;
  reminderOptOutAt?: string | null;
  maxReminders?: number;
  riskFlags: string[];
}

interface CampaignListItem {
  campaignId: string;
  registerId: string;
  ownerId: string;
  createdAt: string;
  createdBy: string;
  createdByEmail?: string | null;
  label?: string | null;
  context?: string | null;
  source: SupplierInviteCampaignSource;
  recipientCount: number;
}

interface InviteActionResponse {
  publicUrl?: string;
  inviteEmailSent?: boolean;
  error?: string;
}

interface InviteListResponse {
  invites: InviteListItem[];
  campaigns: CampaignListItem[];
}

export interface SupplierInviteSummary {
  campaignCount: number;
  inviteCount: number;
  openCount: number;
  verifiedCount: number;
  submittedCount: number;
  deliveryIssueCount: number;
  followUpDueCount: number;
  optOutCount: number;
}

const STATUS_LABELS: Record<SupplierInviteStatus, string> = {
  active: "Aktiv",
  verified: "Verifiziert",
  submitted: "Eingereicht",
  revoked: "Widerrufen",
  expired: "Abgelaufen",
};

function statusVariant(
  status: SupplierInviteStatus
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "verified":
      return "secondary";
    case "submitted":
      return "default";
    case "revoked":
      return "destructive";
    default:
      return "outline";
  }
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "–";
  return parsed.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isExpired(invite: InviteListItem): boolean {
  return (
    invite.status !== "revoked" &&
    invite.status !== "submitted" &&
    new Date(invite.expiresAt) <= new Date()
  );
}

function isOpenInvite(invite: InviteListItem): boolean {
  return !isExpired(invite) && (invite.status === "active" || invite.status === "verified");
}

function isReminderDue(invite: InviteListItem, now: Date): boolean {
  if (!isOpenInvite(invite)) {
    return false;
  }

  if (!invite.inviteEmailSentAt || invite.deliveryFailed || invite.reminderOptOut) {
    return false;
  }

  const sentAt = new Date(invite.inviteEmailSentAt);
  if (Number.isNaN(sentAt.getTime())) {
    return false;
  }

  const maxReminders = invite.maxReminders ?? 2;
  const remindersSent = invite.remindersSent ?? 0;
  if (remindersSent >= maxReminders) {
    return false;
  }

  const daysSinceInvite = Math.floor(
    (now.getTime() - sentAt.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (remindersSent === 0 && daysSinceInvite >= 3) {
    return true;
  }

  if (remindersSent === 1 && daysSinceInvite >= 7) {
    return true;
  }

  return false;
}

function buildCampaignLabel(
  campaign: CampaignListItem | null,
  invites: InviteListItem[]
): string {
  if (campaign?.label?.trim()) {
    return campaign.label.trim();
  }

  const anchorDate = campaign?.createdAt ?? invites[0]?.createdAt;
  const formattedDate = anchorDate ? formatDate(anchorDate) : "ohne Datum";
  return `Anfragegruppe vom ${formattedDate}`;
}

function summarizeCampaign(invites: InviteListItem[]): string {
  const submittedCount = invites.filter((invite) => invite.status === "submitted").length;
  const verifiedCount = invites.filter((invite) => invite.status === "verified").length;
  const openCount = invites.filter(
    (invite) =>
      !isExpired(invite) &&
      (invite.status === "active" || invite.status === "verified")
  ).length;
  const expiredCount = invites.filter((invite) => isExpired(invite)).length;
  const failedCount = invites.filter((invite) => invite.deliveryFailed).length;
  const optOutCount = invites.filter((invite) => invite.reminderOptOut).length;

  const parts = [
    `${invites.length} Kontakt${invites.length === 1 ? "" : "e"}`,
    `${submittedCount} eingereicht`,
  ];

  if (verifiedCount > 0) {
    parts.push(`${verifiedCount} verifiziert`);
  }
  if (openCount > 0) {
    parts.push(`${openCount} offen`);
  }
  if (expiredCount > 0) {
    parts.push(`${expiredCount} abgelaufen`);
  }
  if (failedCount > 0) {
    parts.push(`${failedCount} Zustellproblem${failedCount === 1 ? "" : "e"}`);
  }
  if (optOutCount > 0) {
    parts.push(`${optOutCount} ohne weitere Erinnerungen`);
  }

  return parts.join(" · ");
}

async function getAuthToken(): Promise<string> {
  const auth = await getFirebaseAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Bitte melden Sie sich erneut an.");
  return token;
}

async function copyToClipboard(value: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  await navigator.clipboard.writeText(value);
  return true;
}

interface SupplierInvitesListProps {
  registerId: string;
  refreshKey?: number;
  onSummaryChange?: (summary: SupplierInviteSummary) => void;
}

export function SupplierInvitesList({
  registerId,
  refreshKey = 0,
  onSummaryChange,
}: SupplierInvitesListProps) {
  const { toast } = useToast();
  const [invites, setInvites] = useState<InviteListItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    SupplierInviteStatus | "all"
  >("all");

  const loadInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `/api/supplier-invite/list?registerId=${encodeURIComponent(registerId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            "Lieferantenanfragen konnten nicht geladen werden."
        );
      }
      const data = (await response.json()) as InviteListResponse;
      setInvites(data.invites);
      setCampaigns(data.campaigns ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Lieferantenanfragen konnten nicht geladen werden."
      );
    } finally {
      setLoading(false);
    }
  }, [registerId]);

  useEffect(() => {
    void loadInvites();
  }, [loadInvites, refreshKey]);

  const callAction = async (
    inviteId: string,
    action: "revoke" | "resend" | "recreate"
  ) => {
    setActingId(inviteId);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `/api/supplier-invite/${inviteId}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Aktion fehlgeschlagen."
        );
      }
      const data = (await response.json().catch(() => ({}))) as InviteActionResponse;

      const actionLabels = {
        revoke: "widerrufen",
        resend: "erneut gesendet",
        recreate: "neu erstellt",
      };

      const copiedBackupLink =
        data.inviteEmailSent === false && data.publicUrl
          ? await copyToClipboard(data.publicUrl)
          : false;

      toast({
        title: "Aktion ausgefuehrt",
        description:
          data.inviteEmailSent === false && data.publicUrl
            ? copiedBackupLink
              ? `Lieferantenanfrage ${actionLabels[action]}. Die E-Mail konnte nicht versendet werden; der persoenliche Link wurde in die Zwischenablage kopiert.`
              : `Lieferantenanfrage ${actionLabels[action]}. Die E-Mail konnte nicht versendet werden; nutzen Sie den neuen persoenlichen Link aus der API-Antwort fuer die manuelle Weitergabe.`
            : `Lieferantenanfrage ${actionLabels[action]}.`,
      });

      await loadInvites();
    } catch (actionError) {
      toast({
        variant: "destructive",
        title: "Aktion fehlgeschlagen",
        description:
          actionError instanceof Error
            ? actionError.message
            : "Bitte versuchen Sie es erneut.",
      });
    } finally {
      setActingId(null);
    }
  };

  const filteredInvites = useMemo(
    () =>
      statusFilter === "all"
        ? invites
        : invites.filter((invite) => {
            if (statusFilter === "expired") return isExpired(invite);
            return invite.status === statusFilter;
          }),
    [invites, statusFilter]
  );

  const campaignMap = useMemo(
    () =>
      new Map(campaigns.map((campaign) => [campaign.campaignId, campaign])),
    [campaigns]
  );

  const campaignSections = useMemo(() => {
    const grouped = new Map<string, InviteListItem[]>();

    for (const invite of filteredInvites) {
      if (!invite.campaignId) {
        continue;
      }

      const existing = grouped.get(invite.campaignId) ?? [];
      existing.push(invite);
      grouped.set(invite.campaignId, existing);
    }

    return Array.from(grouped.entries())
      .map(([campaignId, campaignInvites]) => ({
        campaignId,
        campaign: campaignMap.get(campaignId) ?? null,
        invites: campaignInvites,
      }))
      .sort((left, right) => {
        const leftDate = left.campaign?.createdAt ?? left.invites[0]?.createdAt ?? "";
        const rightDate = right.campaign?.createdAt ?? right.invites[0]?.createdAt ?? "";
        return rightDate.localeCompare(leftDate);
      });
  }, [campaignMap, filteredInvites]);

  const standaloneInvites = useMemo(
    () => filteredInvites.filter((invite) => !invite.campaignId),
    [filteredInvites]
  );

  const summary = useMemo<SupplierInviteSummary>(() => {
    const now = new Date();

    return {
      campaignCount: campaigns.length,
      inviteCount: invites.length,
      openCount: invites.filter((invite) => isOpenInvite(invite)).length,
      verifiedCount: invites.filter(
        (invite) => !isExpired(invite) && invite.status === "verified"
      ).length,
      submittedCount: invites.filter((invite) => invite.status === "submitted").length,
      deliveryIssueCount: invites.filter((invite) => invite.deliveryFailed).length,
      followUpDueCount: invites.filter((invite) => isReminderDue(invite, now)).length,
      optOutCount: invites.filter((invite) => invite.reminderOptOut).length,
    };
  }, [campaigns.length, invites]);

  useEffect(() => {
    if (!onSummaryChange) {
      return;
    }

    onSummaryChange(summary);
  }, [onSummaryChange, summary]);

  const renderInviteRows = (items: InviteListItem[]) =>
    items.map((invite) => {
      const isActing = actingId === invite.inviteId;
      const expired = isExpired(invite);
      const canRevoke =
        !invite.revokedAt &&
        invite.status !== "revoked" &&
        invite.status !== "submitted";
      const canResend = invite.status === "active" || invite.status === "verified";
      const canRecreate = true;

      return (
        <TableRow
          key={invite.inviteId}
          className={expired ? "opacity-60" : undefined}
        >
          <TableCell>
            <div className="space-y-1">
              <div className="font-medium">{invite.intendedEmail}</div>
              {invite.supplierOrganisationHint ? (
                <div className="text-xs text-muted-foreground">
                  {invite.supplierOrganisationHint}
                </div>
              ) : null}
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <Badge variant={expired ? "outline" : statusVariant(invite.status)}>
                {expired ? "Abgelaufen" : STATUS_LABELS[invite.status]}
              </Badge>
              {invite.deliveryFailed ? (
                <div className="text-[11px] text-red-600">
                  Einladung nicht zugestellt
                </div>
              ) : null}
              {invite.otpDeliveryFailed ? (
                <div className="text-[11px] text-slate-500">
                  OTP-Zustellung zuletzt fehlgeschlagen
                </div>
              ) : null}
              {invite.reminderOptOut ? (
                <div className="text-[11px] text-slate-500">
                  Weitere Erinnerungen beendet
                </div>
              ) : (invite.remindersSent ?? 0) > 0 ? (
                <div className="text-[11px] text-slate-500">
                  {invite.remindersSent} Erinnerung
                  {(invite.remindersSent ?? 0) === 1 ? '' : 'en'}
                  {invite.lastReminderAt
                    ? ` · zuletzt ${formatDate(invite.lastReminderAt)}`
                    : ''}
                </div>
              ) : null}
              {invite.riskFlags.length > 0 ? (
                <div className="text-[11px] text-slate-500">
                  {invite.riskFlags.length} Auffaelligkeit
                  {invite.riskFlags.length !== 1 ? "en" : ""}
                </div>
              ) : null}
            </div>
          </TableCell>
          <TableCell>
            <div className="text-sm">{formatDate(invite.createdAt)}</div>
            {invite.createdByEmail ? (
              <div className="text-xs text-muted-foreground">
                {invite.createdByEmail}
              </div>
            ) : null}
          </TableCell>
          <TableCell>
            <div className="text-sm">{formatDate(invite.expiresAt)}</div>
          </TableCell>
          <TableCell>
            <div className="text-sm">
              {invite.submissionCount} / {invite.maxSubmissions}
            </div>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1.5">
              {canRevoke && !expired ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isActing}
                  onClick={() => void callAction(invite.inviteId, "revoke")}
                  title="Widerrufen"
                >
                  {isActing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                </Button>
              ) : null}
              {canResend && !expired ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isActing}
                  onClick={() => void callAction(invite.inviteId, "resend")}
                  title="Erneut senden"
                >
                  {isActing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MailPlus className="h-3.5 w-3.5" />
                  )}
                </Button>
              ) : null}
              {canRecreate ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isActing}
                  onClick={() => void callAction(invite.inviteId, "recreate")}
                  title="Neu erstellen"
                >
                  {isActing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                </Button>
              ) : null}
            </div>
          </TableCell>
        </TableRow>
      );
    });

  const renderInviteTable = (items: InviteListItem[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empfaenger</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Erstellt</TableHead>
          <TableHead>Ablauf</TableHead>
          <TableHead>Einreichungen</TableHead>
          <TableHead className="text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{renderInviteRows(items)}</TableBody>
    </Table>
  );

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>Lieferantenanfragen</CardTitle>
          <CardDescription>
            Uebersicht aller kontaktgebundenen Anfragen und Anfragegruppen fuer dieses Register.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as SupplierInviteStatus | "all")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="verified">Verifiziert</SelectItem>
              <SelectItem value="submitted">Eingereicht</SelectItem>
              <SelectItem value="revoked">Widerrufen</SelectItem>
              <SelectItem value="expired">Abgelaufen</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => void loadInvites()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : filteredInvites.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-muted-foreground">
            {statusFilter !== "all"
              ? "Keine Anfragen im aktuellen Filter."
              : "Noch keine Lieferantenanfragen erstellt."}
          </div>
        ) : (
          <div className="space-y-4">
            {campaignSections.map(({ campaignId, campaign, invites: campaignInvites }) => (
              <div
                key={campaignId}
                className="rounded-md border border-slate-200"
              >
                <div className="border-b border-slate-200 px-4 py-4">
                  <div className="text-sm font-medium text-slate-900">
                    {buildCampaignLabel(campaign, campaignInvites)}
                  </div>
                  <div className="mt-1 text-[13px] text-slate-600">
                    {summarizeCampaign(campaignInvites)}
                  </div>
                  {campaign?.context ? (
                    <div className="mt-1 text-[13px] text-slate-500">
                      {campaign.context}
                    </div>
                  ) : null}
                  <div className="mt-2 text-[12px] text-slate-500">
                    Erstellt am {formatDate(campaign?.createdAt ?? campaignInvites[0]?.createdAt ?? "")}
                    {campaign?.source === "csv"
                      ? " · CSV-Import"
                      : campaign?.source === "manual"
                        ? " · manuelle Liste"
                        : ""}
                  </div>
                </div>
                <div className="px-2 py-2">{renderInviteTable(campaignInvites)}</div>
              </div>
            ))}

            {standaloneInvites.length > 0 ? (
              <div className="rounded-md border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-4">
                  <div className="text-sm font-medium text-slate-900">
                    Einzelanfragen
                  </div>
                  <div className="mt-1 text-[13px] text-slate-600">
                    {standaloneInvites.length} Anfrage
                    {standaloneInvites.length === 1 ? "" : "n"}
                  </div>
                </div>
                <div className="px-2 py-2">{renderInviteTable(standaloneInvites)}</div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
