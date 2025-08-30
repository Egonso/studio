
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, ArrowRight } from 'lucide-react';
import { createProject, getUserProjects, setActiveProjectId } from '@/lib/data-service';
import { Timestamp } from 'firebase/firestore';

interface Project {
    id: string;
    projectName: string;
    createdAt: Timestamp;
}

export default function ProjectsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            const fetchProjects = async () => {
                setIsLoading(true);
                const userProjects = await getUserProjects();
                setProjects(userProjects as Project[]);
                setIsLoading(false);
            };
            fetchProjects();
        }
    }, [user, authLoading, router]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        setIsCreating(true);
        try {
            const newProjectId = await createProject(newProjectName);
            setActiveProjectId(newProjectId);
            router.push('/assessment');
        } catch (error) {
            console.error("Failed to create project:", error);
            // Optionally, show a toast notification
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectProject = (projectId: string) => {
        setActiveProjectId(projectId);
        router.push(`/dashboard?projectId=${projectId}`);
    };
    
    if (authLoading || isLoading) {
        return (
            <div className="flex h-screen w-full flex-col">
                <AppHeader />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 flex flex-col items-center p-4 md:p-8">
                <div className="w-full max-w-4xl">
                    <h1 className="text-3xl font-bold mb-6">Meine Projekte</h1>

                    {/* --- Create New Project Card --- */}
                    <Card className="mb-8 shadow-lg">
                        <CardHeader>
                            <CardTitle>Neues Projekt starten</CardTitle>
                            <CardDescription>
                                Beginnen Sie eine neue Compliance-Bewertung für ein anderes Produkt oder eine andere Abteilung.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Input
                                    placeholder="z.B. 'Marketing-Chatbot' oder 'HR-Analyse-Tool'"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="flex-grow"
                                    disabled={isCreating}
                                />
                                <Button onClick={handleCreateProject} disabled={isCreating || !newProjectName.trim()}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Erstelle...
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Projekt erstellen
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* --- Existing Projects List --- */}
                    <h2 className="text-2xl font-bold mb-4">Bestehende Projekte</h2>
                    {projects.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {projects.map(project => (
                                <Card key={project.id} className="flex flex-col justify-between hover:shadow-xl transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="truncate">{project.projectName}</CardTitle>
                                        <CardDescription>
                                            Erstellt am: {project.createdAt?.toDate().toLocaleDateString('de-DE') || 'N/A'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter>
                                        <Button onClick={() => handleSelectProject(project.id)} className="w-full">
                                            Zum Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-6 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">Sie haben noch keine Projekte erstellt.</p>
                            <p className="text-muted-foreground">Starten Sie Ihr erstes Projekt oben.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

