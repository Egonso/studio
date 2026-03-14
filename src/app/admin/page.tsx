'use client';

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, MessageSquare, ListTodo, Users, Copy, RefreshCw, Mail } from "lucide-react";
import {
    getAdminStats,
    getCertificationCertificateDetail,
    getCertificationAdminData,
    getFeedbackList,
    getPlatformUsers,
    issueManualCertification,
    repairBillingEntitlement,
    regenerateCertificationDocument,
    saveCertificationSettings,
    updateCertificationCertificate,
    updateFeedbackStatus,
} from "@/app/actions/admin";
import { CertificationAdminPanel } from "@/components/admin/certification-admin-panel";
import { isAdminEmail } from "@/lib/admin-config";
import type { AdminCertificationOverview } from "@/lib/certification/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useScopedRouteHrefs } from "@/lib/navigation/use-scoped-route-hrefs";

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const scopedHrefs = useScopedRouteHrefs();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Data State
    const [stats, setStats] = useState({ projects: 0, feedbackTotal: 0, openBugs: 0, usersEstimate: 0 });
    const [feedback, setFeedback] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [certificationOverview, setCertificationOverview] = useState<AdminCertificationOverview | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [billingRepairState, setBillingRepairState] = useState<{
        email: string;
        userId: string;
        loading: boolean;
        error: string | null;
        result: {
            entitlement: { plan?: string | null; status?: string | null } | null;
            appliedUserIds: string[];
            appliedRegisterIds: string[];
            needsUserSignup: boolean;
        } | null;
    }>({
        email: '',
        userId: '',
        loading: false,
        error: null,
        result: null,
    });
    const feedbackFilter = "all";

    const getAdminIdToken = useCallback(async () => {
        const token = await user?.getIdToken();
        if (!token) {
            throw new Error("Admin authentication token missing.");
        }
        return token;
    }, [user]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoadingData(true);
        try {
            const idToken = await getAdminIdToken();
            const [statsData, feedbackData, usersData, certificationData] = await Promise.all([
                getAdminStats(idToken),
                getFeedbackList(idToken, feedbackFilter),
                getPlatformUsers(idToken, 50),
                getCertificationAdminData(idToken),
            ]);

            setStats(statsData);
            setFeedback(feedbackData);
            setUsersList(usersData);
            setCertificationOverview(certificationData);
        } catch (error) {
            console.error("Failed to load admin data", error);
        } finally {
            setIsLoadingData(false);
        }
    }, [feedbackFilter, getAdminIdToken, user]);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (isAdminEmail(user.email)) {
            setIsAuthorized(true);
            void fetchData();
        }
        // If not authorized, we just stay in loading state false, authorized false
        // and render the access denied message below
    }, [user, loading, router, fetchData]);

    const handleResolveFeedback = async (id: string) => {
        const idToken = await getAdminIdToken();
        await updateFeedbackStatus(idToken, id, 'resolved');
        // Optimistic update
        setFeedback(prev => prev.map(item => item.id === id ? { ...item, status: 'resolved' } : item));
        // Refresh stats
        const newStats = await getAdminStats(idToken);
        setStats(newStats);
    };

    const handleRegenerateCertificate = async (certificateId: string) => {
        const idToken = await getAdminIdToken();
        await regenerateCertificationDocument(idToken, certificateId);
        await fetchData();
    };

    const handleUpdateCertificate = async (input: {
        certificateId: string;
        status?: 'active' | 'expired' | 'revoked';
        validUntil?: string | null;
        note?: string;
    }) => {
        const idToken = await getAdminIdToken();
        await updateCertificationCertificate(idToken, input);
        await fetchData();
    };

    const handleIssueManualCertificate = async (input: {
        email: string;
        holderName: string;
        company?: string | null;
        validityMonths?: number | null;
    }) => {
        const idToken = await getAdminIdToken();
        await issueManualCertification(idToken, input);
        await fetchData();
    };

    const handleLoadCertificateDetail = async (certificateId: string) => {
        const idToken = await getAdminIdToken();
        return getCertificationCertificateDetail(idToken, certificateId);
    };

    const handleSaveCertificationSettings = async (input: {
        defaultValidityMonths?: number | null;
        documentProvider?: 'native' | 'documentero' | null;
        documentTemplateId?: string | null;
        badgeAssetUrl?: string | null;
    }) => {
        const idToken = await getAdminIdToken();
        await saveCertificationSettings(idToken, input);
        await fetchData();
    };

    const handleRepairBilling = async () => {
        const normalizedEmail = billingRepairState.email.trim().toLowerCase();
        if (!normalizedEmail) {
            setBillingRepairState((current) => ({
                ...current,
                error: 'Bitte eine E-Mail-Adresse eingeben.',
                result: null,
            }));
            return;
        }

        setBillingRepairState((current) => ({
            ...current,
            loading: true,
            error: null,
            result: null,
        }));

        try {
            const idToken = await getAdminIdToken();
            const result = await repairBillingEntitlement(
                idToken,
                normalizedEmail,
                billingRepairState.userId.trim() || null,
            );
            setBillingRepairState((current) => ({
                ...current,
                loading: false,
                result,
            }));
            await fetchData();
        } catch (error) {
            console.error('Billing repair failed', error);
            setBillingRepairState((current) => ({
                ...current,
                loading: false,
                error: 'Die Billing-Synchronisierung konnte nicht ausgeführt werden.',
            }));
        }
    };

    const featureRequestSummary = useMemo(() => {
        const featureEntries = feedback.filter((item) => item.type === 'feature');
        const groups = new Map<string, {
            label: string;
            count: number;
            open: number;
            resolved: number;
            lastSeen: string | null;
        }>();

        for (const item of featureEntries) {
            const label = typeof item.message === 'string' && item.message.trim().length > 0
                ? item.message.trim()
                : 'Ohne Beschreibung';
            const key = label.toLowerCase();
            const existing = groups.get(key) ?? {
                label,
                count: 0,
                open: 0,
                resolved: 0,
                lastSeen: null,
            };

            existing.count += 1;
            existing.open += item.status === 'resolved' ? 0 : 1;
            existing.resolved += item.status === 'resolved' ? 1 : 0;
            existing.lastSeen =
                typeof item.createdAt === 'string'
                    ? existing.lastSeen && existing.lastSeen > item.createdAt
                        ? existing.lastSeen
                        : item.createdAt
                    : existing.lastSeen;

            groups.set(key, existing);
        }

        return Array.from(groups.values()).sort((left, right) => {
            if (right.count !== left.count) {
                return right.count - left.count;
            }
            return (right.lastSeen ?? '').localeCompare(left.lastSeen ?? '');
        });
    }, [feedback]);


    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">Verifiziere Admin-Rechte...</p>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h1 className="text-xl font-bold">Zugriff verweigert</h1>
                <p className="text-muted-foreground text-center max-w-md">
                    Dein Account <span className="font-mono font-bold text-foreground bg-muted px-1 rounded">{user?.email}</span> hat keine Admin-Rechte.
                </p>
                <Button
                    variant="outline"
                    onClick={() => router.push(scopedHrefs.register)}
                >
                    Zurück zum Register
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppHeader />
            <main className="flex-1 container mx-auto py-8 space-y-8">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold tracking-tight">Admin Center</h1>
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoadingData}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                    <p className="text-muted-foreground">
                        Verwaltung von Zertifizierung, Feedback, Features und Nutzern für das KI-Register.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Offene Bugs</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.openBugs}</div>
                            <p className="text-xs text-muted-foreground">kritische Fehler</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nutzer Registriert</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{usersList.length}</div>
                            <p className="text-xs text-muted-foreground">in Firebase Auth ({stats.usersEstimate > 0 ? stats.usersEstimate : 'Live'})</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Feedback Gesamt</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.feedbackTotal}</div>
                            <p className="text-xs text-muted-foreground">Einträge in Datenbank</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Organisationen</CardTitle>
                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.projects}</div>
                            <p className="text-xs text-muted-foreground">Aktive Organisationen</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="certification" className="space-y-4">
                    <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
                        <TabsTrigger value="certification">Zertifizierung</TabsTrigger>
                        <TabsTrigger value="feedback">Feedback Inbox</TabsTrigger>
                        <TabsTrigger value="users">User Management</TabsTrigger>
                        <TabsTrigger value="features">Feature-Radar</TabsTrigger>
                    </TabsList>

                    <TabsContent value="certification" className="space-y-4">
                        <CertificationAdminPanel
                            overview={certificationOverview}
                            loading={isLoadingData}
                            onRefresh={fetchData}
                            onRegenerate={handleRegenerateCertificate}
                            onUpdate={handleUpdateCertificate}
                            onManualIssue={handleIssueManualCertificate}
                            onLoadDetail={handleLoadCertificateDetail}
                            onSaveSettings={handleSaveCertificationSettings}
                        />
                    </TabsContent>

                    <TabsContent value="feedback" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Eingegangenes Feedback</CardTitle>
                                <CardDescription>Nachrichten aus dem Chatbot-Support-Tab.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Typ</TableHead>
                                            <TableHead>Nachricht</TableHead>
                                            <TableHead>Benutzer</TableHead>
                                            <TableHead className="w-[100px]">Status</TableHead>
                                            <TableHead className="w-[150px]">Datum</TableHead>
                                            <TableHead className="text-right">Aktion</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {feedback.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    Kein Feedback gefunden.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            feedback.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <Badge variant={item.type === 'bug' ? 'destructive' : item.type === 'feature' ? 'default' : 'secondary'} className="capitalize">
                                                            {item.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[300px] truncate" title={item.message}>
                                                        {item.message}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-mono">
                                                        {item.userEmail || item.userId || 'Anonym'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={item.status === 'resolved' ? 'bg-green-100 text-green-700' : ''}>
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {item.createdAt ? format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm', { locale: de }) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item.status !== 'resolved' && (
                                                            <Button size="sm" variant="ghost" onClick={() => handleResolveFeedback(item.id)}>
                                                                <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                                                                Resolve
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Billing Repair</CardTitle>
                                <CardDescription>
                                    Repariert Legacy-Käufe, synchronisiert Entitlements und zieht Workspace-Freischaltungen nach.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                                    <Input
                                        placeholder="E-Mail-Adresse"
                                        value={billingRepairState.email}
                                        onChange={(event) =>
                                            setBillingRepairState((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="User ID (optional)"
                                        value={billingRepairState.userId}
                                        onChange={(event) =>
                                            setBillingRepairState((current) => ({
                                                ...current,
                                                userId: event.target.value,
                                            }))
                                        }
                                    />
                                    <Button onClick={handleRepairBilling} disabled={billingRepairState.loading}>
                                        {billingRepairState.loading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                        )}
                                        Synchronisieren
                                    </Button>
                                </div>
                                {billingRepairState.error ? (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {billingRepairState.error}
                                    </div>
                                ) : null}
                                {billingRepairState.result ? (
                                    <div className="grid gap-3 md:grid-cols-4">
                                        <div className="rounded-xl border bg-slate-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Plan</p>
                                            <p className="mt-2 text-lg font-semibold">{billingRepairState.result.entitlement?.plan || 'Kein Treffer'}</p>
                                        </div>
                                        <div className="rounded-xl border bg-slate-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Status</p>
                                            <p className="mt-2 text-lg font-semibold">{billingRepairState.result.entitlement?.status || '—'}</p>
                                        </div>
                                        <div className="rounded-xl border bg-slate-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">User aktualisiert</p>
                                            <p className="mt-2 text-lg font-semibold">{billingRepairState.result.appliedUserIds.length}</p>
                                        </div>
                                        <div className="rounded-xl border bg-slate-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Register aktualisiert</p>
                                            <p className="mt-2 text-lg font-semibold">{billingRepairState.result.appliedRegisterIds.length}</p>
                                        </div>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Benutzerverwaltung</CardTitle>
                                <CardDescription>Die neuesten 50 registrierten Nutzer.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>UID</TableHead>
                                            <TableHead>Registriert am</TableHead>
                                            <TableHead>Letzter Login</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    Keine Benutzer geladen.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            usersList.map((u) => (
                                                <TableRow key={u.uid}>
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                                        {u.email}
                                                    </TableCell>
                                                    <TableCell>{u.displayName || '-'}</TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                                        {u.uid.substring(0, 8)}...
                                                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => navigator.clipboard.writeText(u.uid)}>
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {u.creationTime ? format(new Date(u.creationTime), 'dd.MM.yyyy') : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {u.lastSignInTime ? format(new Date(u.lastSignInTime), 'dd.MM.yyyy HH:mm') : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="features" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Feature-Radar</CardTitle>
                                <CardDescription>Aggregierte Produktwünsche aus dem Feedback-System.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {featureRequestSummary.length === 0 ? (
                                    <div className="rounded-md border p-8 text-center text-muted-foreground bg-muted/20">
                                        <ListTodo className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                        <p>Aktuell liegen keine Feature-Anfragen vor.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {featureRequestSummary.slice(0, 12).map((entry) => (
                                            <div key={entry.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium text-slate-950">{entry.label}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Zuletzt eingegangen:{' '}
                                                            {entry.lastSeen ? format(new Date(entry.lastSeen), 'dd.MM.yyyy HH:mm', { locale: de }) : '—'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant="outline">{entry.count} gesamt</Badge>
                                                        <Badge variant="secondary">{entry.open} offen</Badge>
                                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                                            {entry.resolved} erledigt
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
