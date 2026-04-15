"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ExternalLink, Info, Loader2, Search, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  getExternalSubmissionActor,
  getExternalSubmissionTitle,
  isKmuRegisterMode,
} from "@/lib/register-first/external-submissions";
import {
  externalSubmissionService,
  isExternalSubmissionPermissionError,
} from "@/lib/register-first/external-submission-service";
import { buildScopedUseCaseDetailHref } from "@/lib/navigation/workspace-scope";
import { useWorkspaceScope } from "@/lib/navigation/use-workspace-scope";
import type {
  ExternalSubmission,
  ExternalSubmissionSourceType,
  ExternalSubmissionStatus,
  Register,
} from "@/lib/register-first/types";

const STATUS_LABELS: Record<ExternalSubmissionStatus, string> = {
  submitted: "Received",
  approved: "Approved",
  rejected: "Rejected",
  merged: "Merged",
};

const SOURCE_LABELS: Record<ExternalSubmissionSourceType, string> = {
  supplier_request: "Supplier link",
  access_code: "Capture link",
  manual_import: "Import",
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "unknown";
  }

  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusVariant(status: ExternalSubmissionStatus) {
  switch (status) {
    case "approved":
      return "secondary";
    case "merged":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

interface ExternalSubmissionsInboxProps {
  register: Register | null;
  refreshKey?: number;
  onCountsChange?: (counts: { total: number; open: number }) => void;
  title?: string;
  description?: string;
}

export function ExternalSubmissionsInbox({
  register,
  refreshKey = 0,
  onCountsChange,
  title = "External Inbox",
  description = "Traceable external submissions from supplier links, capture links, and imports.",
}: ExternalSubmissionsInboxProps) {
  const router = useRouter();
  const workspaceScope = useWorkspaceScope();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ExternalSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ExternalSubmissionStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<ExternalSubmissionSourceType | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadSubmissions = useCallback(async () => {
    if (!register?.registerId) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await externalSubmissionService.list(register.registerId, {
        status: statusFilter,
        sourceType: sourceFilter,
        searchText: searchQuery,
      });
      setSubmissions(items);
    } catch (loadError) {
      if (!isExternalSubmissionPermissionError(loadError)) {
        console.error("External submissions load failed:", loadError);
      }
      setError(
        isExternalSubmissionPermissionError(loadError)
          ? "The External Inbox is not yet readable in the currently connected Firebase project. Please check the deployed Firestore rules."
          : "External submissions could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [register?.registerId, searchQuery, sourceFilter, statusFilter]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions, refreshKey]);

  useEffect(() => {
    if (!onCountsChange) return;
    onCountsChange({
      total: submissions.length,
      open: submissions.filter((submission) => submission.status === "submitted").length,
    });
  }, [onCountsChange, submissions]);

  const kmuMode = isKmuRegisterMode(register);
  const hasFilters = statusFilter !== "all" || sourceFilter !== "all" || Boolean(searchQuery);
  const emptyCopy = hasFilters
    ? "No submissions match the current filter."
    : "No external submissions yet.";

  const handleReview = async (
    submission: ExternalSubmission,
    action: "approve" | "reject" | "merge"
  ) => {
    if (!register?.registerId) return;
    setActingId(submission.submissionId);
    try {
      const updated = await externalSubmissionService.review({
        registerId: register.registerId,
        register,
        submissionId: submission.submissionId,
        action,
      });
      setSubmissions((current) =>
        current.map((entry) =>
          entry.submissionId === updated.submissionId ? updated : entry
        )
      );
      toast({
        title:
          action === "reject"
            ? "Submission rejected"
            : action === "merge"
              ? "Submission merged"
              : "Submission approved",
        description:
          updated.linkedUseCaseId && action !== "reject"
            ? `Linked use case: ${updated.linkedUseCaseId}`
            : undefined,
      });
    } catch (reviewError) {
      console.error("External submission review failed:", reviewError);
      toast({
        variant: "destructive",
        title: "Action failed",
        description: "The submission could not be updated.",
      });
    } finally {
      setActingId(null);
    }
  };

  const rows = useMemo(() => submissions, [submissions]);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {kmuMode ? (
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <Info className="h-3.5 w-3.5 text-slate-500" />
              SME mode active: Approvals from supplier links directly create a
              use case.
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setSearchQuery(searchInput.trim());
                }
              }}
              placeholder="Search by system, API, purpose, person, or token"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as ExternalSubmissionStatus | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="submitted">Received</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sourceFilter}
            onValueChange={(value) =>
              setSourceFilter(value as ExternalSubmissionSourceType | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="supplier_request">Supplier link</SelectItem>
              <SelectItem value="access_code">Capture link</SelectItem>
              <SelectItem value="manual_import">Import</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setSearchQuery(searchInput.trim())}
            >
              Filtern
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
                setStatusFilter("all");
                setSourceFilter("all");
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-muted-foreground">
            {emptyCopy}
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {rows.map((submission) => {
                const isActing = actingId === submission.submissionId;
                const title = getExternalSubmissionTitle(submission);
                const actor = getExternalSubmissionActor(submission);

                return (
                  <div
                    key={submission.submissionId}
                    className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                          {SOURCE_LABELS[submission.sourceType]}
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {typeof submission.rawPayloadSnapshot.purpose === "string"
                            ? submission.rawPayloadSnapshot.purpose
                            : "No description"}
                        </div>
                      </div>
                      <Badge variant={statusVariant(submission.status)}>
                        {STATUS_LABELS[submission.status]}
                      </Badge>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-700">
                      <div>
                        <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                          Eingereicht von
                        </div>
                        <div>{actor}</div>
                        {submission.submittedByEmail ? (
                          <div className="text-xs text-muted-foreground">
                            {submission.submittedByEmail}
                          </div>
                        ) : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                            Referenz
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {submission.requestTokenId
                              ? `Token ${submission.requestTokenId}`
                              : submission.accessCodeId
                                ? `Code ${submission.accessCodeId}`
                                : submission.submissionId}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                            Zeitpunkt
                          </div>
                          <div>{formatDate(submission.submittedAt)}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                          Use Case
                        </div>
                        {submission.linkedUseCaseId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-0 text-primary"
                            onClick={() =>
                              router.push(
                                buildScopedUseCaseDetailHref(
                                  submission.linkedUseCaseId!,
                                  workspaceScope,
                                ),
                              )
                            }
                          >
                            {submission.linkedUseCaseId}
                            <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Noch keiner</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {submission.status === "submitted" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActing}
                            className="w-full sm:w-auto"
                            onClick={() => void handleReview(submission, "reject")}
                          >
                            {isActing ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Ablehnen
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isActing}
                            className="w-full sm:w-auto"
                            onClick={() => void handleReview(submission, "approve")}
                          >
                            {isActing ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {kmuMode && submission.sourceType === "supplier_request"
                              ? "Freigeben + Use Case"
                              : "Freigeben"}
                          </Button>
                          {submission.sourceType === "supplier_request" ? (
                            <Button
                              size="sm"
                              disabled={isActing}
                              className="w-full sm:w-auto"
                              onClick={() => void handleReview(submission, "merge")}
                            >
                              {isActing ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Uebernehmen
                            </Button>
                          ) : null}
                        </>
                      ) : submission.status === "approved" &&
                        submission.sourceType === "supplier_request" &&
                        !submission.linkedUseCaseId ? (
                        <Button
                          size="sm"
                          disabled={isActing}
                          className="w-full sm:w-auto"
                          onClick={() => void handleReview(submission, "merge")}
                        >
                          {isActing ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Use Case anlegen
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Submission</TableHead>
                    <TableHead>Submitted by</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Use Case</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((submission) => {
                    const isActing = actingId === submission.submissionId;
                    const title = getExternalSubmissionTitle(submission);
                    const actor = getExternalSubmissionActor(submission);

                    return (
                      <TableRow key={submission.submissionId}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {SOURCE_LABELS[submission.sourceType]}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {submission.requestTokenId
                                ? `Token ${submission.requestTokenId}`
                                : submission.accessCodeId
                                  ? `Code ${submission.accessCodeId}`
                                  : submission.submissionId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-slate-900">{title}</div>
                            <div className="text-xs text-muted-foreground">
                              {typeof submission.rawPayloadSnapshot.purpose === "string"
                                ? submission.rawPayloadSnapshot.purpose
                                : "No description"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{actor}</div>
                            {submission.submittedByEmail ? (
                              <div className="text-xs text-muted-foreground">
                                {submission.submittedByEmail}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(submission.status)}>
                            {STATUS_LABELS[submission.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {submission.linkedUseCaseId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto px-0 text-primary"
                              onClick={() =>
                                router.push(
                                  buildScopedUseCaseDetailHref(
                                    submission.linkedUseCaseId!,
                                    workspaceScope,
                                  ),
                                )
                              }
                            >
                              {submission.linkedUseCaseId}
                              <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">Noch keiner</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {submission.status === "submitted" ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isActing}
                                  onClick={() => void handleReview(submission, "reject")}
                                >
                                  {isActing ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                  )}
                                  Ablehnen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={isActing}
                                  onClick={() => void handleReview(submission, "approve")}
                                >
                                  {isActing ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                  )}
                                  {kmuMode && submission.sourceType === "supplier_request"
                                    ? "Freigeben + Use Case"
                                    : "Freigeben"}
                                </Button>
                                {submission.sourceType === "supplier_request" ? (
                                  <Button
                                    size="sm"
                                    disabled={isActing}
                                    onClick={() => void handleReview(submission, "merge")}
                                  >
                                    {isActing ? (
                                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    Uebernehmen
                                  </Button>
                                ) : null}
                              </>
                            ) : submission.status === "approved" &&
                              submission.sourceType === "supplier_request" &&
                              !submission.linkedUseCaseId ? (
                              <Button
                                size="sm"
                                disabled={isActing}
                                onClick={() => void handleReview(submission, "merge")}
                              >
                                {isActing ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                Use Case anlegen
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
