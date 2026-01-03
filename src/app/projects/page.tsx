'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowRight, CornerDownRight, PlusCircle, Clock } from 'lucide-react';
import { getUserProjects, setActiveProjectId } from '@/lib/data-service';
import { Separator } from '@/components/ui/separator';
import { ProjectCreationWizard } from '@/components/wizard/project-creation-wizard';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Project {
    id: string;
    projectName: string;
    metadata: {
        createdAt?: { toDate: () => Date };
        [key: string]: any;
    };
}

export default function ProjectsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openWizard, setOpenWizard] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            const fetchProjects = async () => {
                setIsLoading(true);
                try {
                    const userProjects = await getUserProjects();

                    // Strict Onboarding Rule: No projects -> Go to Dashboard Wizard
                    if (userProjects.length === 0) {
                        router.replace('/dashboard');
                        return;
                    }

                    setProjects(userProjects as Project[]);
                } catch (error) {
                    console.error("Failed to load projects", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProjects();
        }
    }, [user, authLoading, router]);

    const handleSelectProject = (projectId: string) => {
        setActiveProjectId(projectId);
        router.push(`/dashboard?projectId=${projectId}`);
    };

    const handleJumpToLatest = () => {
        if (projects.length > 0) {
            handleSelectProject(projects[0].id);
        }
    }

    const handleProjectCreated = (projectId: string) => {
        // When created from the list view, we usually just go to the dashboard
        handleSelectProject(projectId);
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
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
            <AppHeader />
            <main className="flex-1 flex flex-col items-center p-4 md:p-8">
                <div className="w-full max-w-5xl space-y-8">

                    {/* Header Section - Minimal & Clean */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Meine Projekte</h1>
                            <p className="text-muted-foreground mt-1">Verwalten Sie Ihre KI-Projekte und Compliance-Status.</p>
                        </div>
                        {projects.length > 0 && (
                            <Button onClick={handleJumpToLatest} variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <CornerDownRight className="mr-2 h-4 w-4" /> Zum letzten Dashboard
                            </Button>
                        )}
                    </div>

                    {/* Project List - Dominant Element */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map(project => (
                            <Card key={project.id} className="group flex flex-col justify-between hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <span className="font-bold text-lg">{project.projectName.substring(0, 2).toUpperCase()}</span>
                                        </div>
                                        <Badge variant="outline" className="opacity-50 group-hover:opacity-100 transition-opacity">
                                            In Bearbeitung
                                        </Badge>
                                    </div>
                                    <CardTitle className="truncate text-xl">{project.projectName}</CardTitle>
                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                        <Clock className="mr-1 h-3 w-3" />
                                        Erstellt am: {project.metadata?.createdAt?.toDate().toLocaleDateString('de-DE') || 'N/A'}
                                    </div>
                                </CardHeader>
                                <CardFooter className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                    <Button onClick={() => handleSelectProject(project.id)} className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="secondary">
                                        Zum Dashboard <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    {/* Secondary Action: New Project Modal */}
                    <div className="flex flex-col items-center justify-center pt-12 pb-8 space-y-4">
                        <Dialog open={openWizard} onOpenChange={setOpenWizard}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-dashed border-2 hover:border-primary hover:text-primary bg-transparent h-12 px-6">
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Neues Projekt starten
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <ProjectCreationWizard
                                    variant="embedded"
                                    onComplete={handleProjectCreated}
                                />
                            </DialogContent>
                        </Dialog>
                        <p className="text-xs text-muted-foreground">Optional – Projekte können auch direkt im Dashboard angelegt werden.</p>
                    </div>
                </div>
            </main >
        </div >
    );
}
