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
import { Loader2, CheckCircle2, AlertCircle, MessageSquare, ListTodo, Users, ArrowUpRight } from "lucide-react";

// Admin Whitelist
const ADMIN_EMAILS = [
    'zoltangal@web.de',
    'mo.feich@gmail.com'
];

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (user.email && ADMIN_EMAILS.includes(user.email)) {
            setIsAuthorized(true);
        } else {
            // Not authorized
            router.push('/dashboard');
        }
    }, [user, loading, router]);


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
                    <h1 className="text-3xl font-bold tracking-tight">Admin Center</h1>
                    <p className="text-muted-foreground">
                        Verwaltung von Feedback, Features und Nutzern für EuKIGesetz Studio.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Offenes Feedback</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-muted-foreground">+2 seit gestern</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nutzer Gesamt</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">342</div>
                            <p className="text-xs text-muted-foreground">+18% diesen Monat</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Feature Requests</CardTitle>
                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">8</div>
                            <p className="text-xs text-muted-foreground">Top: "PDF Export"</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Status</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">Optimal</div>
                            <p className="text-xs text-muted-foreground">Alle Systeme online</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="feedback" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="feedback">Feedback Inbox</TabsTrigger>
                        <TabsTrigger value="roadmap">Roadmap & Features</TabsTrigger>
                        <TabsTrigger value="users">User Management</TabsTrigger>
                    </TabsList>

                    <TabsContent value="feedback" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Eingegangenes Feedback</CardTitle>
                                <CardDescription>Nachrichten aus dem Chatbot-Support-Tab.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border p-4 text-center text-muted-foreground bg-muted/20">
                                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p>Mock Data: Feedback-System ist noch nicht mit Datenbank verbunden.</p>
                                    <p className="text-xs mt-2">Hier würden Einträge von Nutzern erscheinen (Feature Wünsche, Bugs).</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="roadmap" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Feature Planung</h2>
                            <Button size="sm"><ArrowUpRight className="mr-2 h-4 w-4" /> Neues Feature</Button>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            {/* Mock Roadmap Columns */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Geplant</h3>
                                    <Badge variant="outline">3</Badge>
                                </div>
                                <RoadmapCard title="PDF Export für Reports" category="Feature" votes={12} />
                                <RoadmapCard title="Mehrsprachigkeit (EN/FR)" category="Feature" votes={8} />
                                <RoadmapCard title="Team-Accounts" category="Enterprise" votes={5} />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-500">In Arbeit</h3>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">2</Badge>
                                </div>
                                <RoadmapCard title="Deep-Linking Zitate" category="Improvement" votes={15} active />
                                <RoadmapCard title="Admin Center V1" category="Internal" votes={99} active />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm uppercase tracking-wider text-green-600">Live</h3>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700">5</Badge>
                                </div>
                                <RoadmapCard title="Gesetz-Viewer Mobile" category="UI/UX" votes={24} done />
                                <RoadmapCard title="Chatbot RAG Integration" category="AI" votes={31} done />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Benutzerverwaltung</CardTitle>
                                <CardDescription>Übersicht aller registrierten Nutzer.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border p-4 text-center text-muted-foreground bg-muted/20">
                                    <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p>User-Liste wird geladen...</p>
                                    <p className="text-xs mt-2">(Erfordert Admin-SDK Integration)</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

function RoadmapCard({ title, category, votes, active, done }: { title: string, category: string, votes: number, active?: boolean, done?: boolean }) {
    return (
        <Card className={`hover:shadow-md transition-shadow cursor-pointer ${done ? 'opacity-70 bg-muted/50' : ''} ${active ? 'border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900' : ''}`}>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <Badge variant={done ? "secondary" : "outline"} className="text-[10px]">{category}</Badge>
                    {done && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
                <h4 className={`font-medium text-sm leading-snug ${done ? 'line-through text-muted-foreground' : ''}`}>{title}</h4>
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <ArrowUpRight className="h-3 w-3" /> {votes} Votes
                </div>
            </CardContent>
        </Card>
    )
}
