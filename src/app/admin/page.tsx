'use client';

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, MessageSquare, ListTodo, Users, ArrowUpRight, Copy, RefreshCw, Mail } from "lucide-react";
import { getAdminStats, getFeedbackList, getPlatformUsers, updateFeedbackStatus } from "@/app/actions/admin";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Data State
    const [stats, setStats] = useState({ projects: 0, feedbackTotal: 0, openBugs: 0, usersEstimate: 0 });
    const [feedback, setFeedback] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [feedbackFilter, setFeedbackFilter] = useState('all');
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (user.email && ADMIN_EMAILS.includes(user.email)) {
            setIsAuthorized(true);
            fetchData();
        } else {
            // Not authorized
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    const fetchData = async () => {
        setIsLoadingData(true);
        try {
            const [statsData, feedbackData, usersData] = await Promise.all([
                getAdminStats(),
                getFeedbackList(feedbackFilter),
                getPlatformUsers(50)
            ]);

            setStats(statsData);
            setFeedback(feedbackData);
            setUsersList(usersData);
        } catch (error) {
            console.error("Failed to load admin data", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleResolveFeedback = async (id: string) => {
        await updateFeedbackStatus(id, 'resolved');
        // Optimistic update
        setFeedback(prev => prev.map(item => item.id === id ? { ...item, status: 'resolved' } : item));
        // Refresh stats
        const newStats = await getAdminStats();
        setStats(newStats);
    };

    if (loading || !isAuthorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">Verifiziere Admin-Rechte...</p>
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
                        Verwaltung von Feedback, Features und Nutzern für EuKIGesetz Studio.
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
                            <CardTitle className="text-sm font-medium">Projekte</CardTitle>
                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.projects}</div>
                            <p className="text-xs text-muted-foreground">Aktive Projekte</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="feedback" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="feedback">Feedback Inbox</TabsTrigger>
                        <TabsTrigger value="users">User Management</TabsTrigger>
                        <TabsTrigger value="features">Roadmap (Feature Requests)</TabsTrigger>
                    </TabsList>

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
                                <CardTitle>Feature Requests & Roadmap</CardTitle>
                                <CardDescription>Aggregierte Wünsche aus dem Feedback-System (Typ: Feature).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border p-8 text-center text-muted-foreground bg-muted/20">
                                    <ListTodo className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p>Hier können später Feature-Requests priorisiert und in eine Roadmap überführt werden.</p>
                                    <p className="text-xs mt-2">Aktuell: Siehe "Feedback Inbox" für rohe Feature-Anfragen.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
