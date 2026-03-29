"use client";

import { useCallback, useEffect, useState } from "react";
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
import type { SupplierInviteStatus } from "@/lib/register-first/supplier-invite-types";

// Invite record without secretHash (stripped by API)
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
  expiresAt: string;
  revokedAt?: string | null;
  firstUsedAt?: string | null;
  lastUsedAt?: string | null;
  deliveryFailed: boolean;
  riskFlags: string[];
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

async function getAuthToken(): Promise<string> {
  const auth = await getFirebaseAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Bitte melden Sie sich erneut an.");
  return token;
}

interface SupplierInvitesListProps {
  registerId: string;
  refreshKey?: number;
}

export function SupplierInvitesList({
  registerId,
  refreshKey = 0,
}: SupplierInvitesListProps) {
  const { toast } = useToast();
  const [invites, setInvites] = useState<InviteListItem[]>([]);
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
      const data = (await response.json()) as { invites: InviteListItem[] };
      setInvites(data.invites);
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

      const actionLabels = {
        revoke: "widerrufen",
        resend: "erneut gesendet",
        recreate: "neu erstellt",
      };

      toast({
        title: "Aktion ausgefuehrt",
        description: `Lieferantenanfrage ${actionLabels[action]}.`,
      });

      // Reload to reflect changes
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

  const filteredInvites =
    statusFilter === "all"
      ? invites
      : invites.filter((invite) => {
          if (statusFilter === "expired") return isExpired(invite);
          return invite.status === statusFilter;
        });

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>Lieferantenanfragen</CardTitle>
          <CardDescription>
            Uebersicht aller kontaktgebundenen Anfragen fuer dieses Register.
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
            <TableBody>
              {filteredInvites.map((invite) => {
                const isActing = actingId === invite.inviteId;
                const expired = isExpired(invite);
                const canRevoke =
                  !invite.revokedAt &&
                  invite.status !== "revoked" &&
                  invite.status !== "submitted";
                const canResend =
                  invite.status === "active" ||
                  invite.status === "verified";
                const canRecreate = true; // Always allow creating new invite for same email

                return (
                  <TableRow
                    key={invite.inviteId}
                    className={expired ? "opacity-60" : undefined}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {invite.intendedEmail}
                        </div>
                        {invite.supplierOrganisationHint ? (
                          <div className="text-xs text-muted-foreground">
                            {invite.supplierOrganisationHint}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={
                            expired ? "outline" : statusVariant(invite.status)
                          }
                        >
                          {expired ? "Abgelaufen" : STATUS_LABELS[invite.status]}
                        </Badge>
                        {invite.deliveryFailed ? (
                          <div className="text-[11px] text-red-600">
                            Zustellung fehlgeschlagen
                          </div>
                        ) : null}
                        {invite.riskFlags.length > 0 ? (
                          <div className="text-[11px] text-amber-600">
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
                            onClick={() =>
                              void callAction(invite.inviteId, "revoke")
                            }
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
                            onClick={() =>
                              void callAction(invite.inviteId, "resend")
                            }
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
                            onClick={() =>
                              void callAction(invite.inviteId, "recreate")
                            }
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
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
