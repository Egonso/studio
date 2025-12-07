
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlayCircle, CheckCircle, GraduationCap, Download, FileText, Sheet as SheetIcon } from 'lucide-react';
import { courseData } from '@/lib/course-data';
import type { Video, Module } from '@/lib/course-data';
import { useAuth } from '@/context/auth-context';
import { getCourseProgress, saveCourseProgress } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { ExamCard } from '@/components/exam-card';
import { Separator } from '@/components/ui/separator';

type Selection = {
    type: 'video';
    data: Video;
    moduleId: string;
} | {
    type: 'exam';
    data: Module;
};

export default function CoursePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [selectedItem, setSelectedItem] = useState<Selection | null>(null);
    const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    const sealUrl = "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU-AI-Act%20SIEGEL%20(2160%20x%201080%20px)%20(Anha%CC%88nger%C2%A0%E2%80%93%202%2C5%20x%202%2C5%20Zoll).png?alt=media&token=6f22bdf6-e4a5-4b26-bd48-7b2786ef6487";

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            const loadProgress = async () => {
                const progress = await getCourseProgress();
                setCompletedVideos(new Set(progress));
                
                const videoId = searchParams.get('videoId');
                const moduleId = searchParams.get('moduleId');

                if (videoId) {
                    for (const module of courseData) {
                        const video = module.videos.find(v => v.id === videoId);
                        if (video) {
                            setSelectedItem({ type: 'video', data: video, moduleId: module.id });
                            break;
                        }
                    }
                } else if (moduleId) {
                    const module = courseData.find(m => m.id === moduleId && m.isExam);
                    if (module) {
                        setSelectedItem({ type: 'exam', data: module });
                    }
                } else if (courseData.length > 0 && courseData[0].videos.length > 0) {
                    // Default to first video
                    setSelectedItem({ type: 'video', data: courseData[0].videos[0], moduleId: courseData[0].id });
                }
                setIsLoading(false);
            };
            loadProgress();
        }
    }, [user, searchParams]);

    const handleSelectVideo = (video: Video, moduleId: string) => {
        if (video.isDirectDownload) {
            window.open(video.url, '_blank');
            return;
        }
        setSelectedItem({ type: 'video', data: video, moduleId: moduleId });
        router.push(`/kurs?videoId=${video.id}`, { scroll: false });
    };
    
    const handleSelectExam = (module: Module) => {
        setSelectedItem({ type: 'exam', data: module });
        router.push(`/kurs?moduleId=${module.id}`, { scroll: false });
    }

    const handleVideoEnd = () => {
        if (selectedItem?.type === 'video' && !completedVideos.has(selectedItem.data.id)) {
            const newCompleted = new Set(completedVideos);
            newCompleted.add(selectedItem.data.id);
            setCompletedVideos(newCompleted);
            saveCourseProgress(Array.from(newCompleted));
        }
    };
    
     const getDefaultOpenModule = () => {
        if (selectedItem?.type === 'video') {
            return selectedItem.moduleId;
        }
        if (selectedItem?.type === 'exam') {
            return selectedItem.data.id;
        }
        return 'module-0';
    }
    
    const ResourceIcon = ({ type }: { type: string }) => {
        switch (type) {
            case 'pdf':
                return <FileText className="h-5 w-5" />;
            case 'xlsx':
                return <SheetIcon className="h-5 w-5" />;
            default:
                return <Download className="h-5 w-5" />;
        }
    }

    const showSeal = selectedItem?.type === 'video' && ['module-0', 'module-1', 'module-2', 'module-3', 'module-4'].includes(selectedItem.moduleId);


    if (authLoading || isLoading || !user) {
        return (
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <p>Lade Kursinhalte...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <div className="p-4 md:p-8">
                <div className="grid md:grid-cols-[350px_1fr] gap-6 max-w-6xl mx-auto">
                    <aside className="flex flex-col gap-4">
                        <Card>
                            <CardContent className="p-2">
                                <ScrollArea className="h-[calc(100vh-18rem)]">
                                    <Accordion type="multiple" defaultValue={[getDefaultOpenModule()]} className="w-full">
                                        {courseData.map(module => (
                                            <AccordionItem value={module.id} key={module.id}>
                                                <AccordionTrigger>{module.title}</AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="flex flex-col gap-1">
                                                        {module.isExam ? (
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => handleSelectExam(module)}
                                                                className={cn(
                                                                    "w-full justify-start text-left h-auto py-2",
                                                                    selectedItem?.type === 'exam' && selectedItem.data.id === module.id && "bg-accent text-accent-foreground"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <GraduationCap className="h-4 w-4" />
                                                                    <span className="flex-1">Prüfungsinformationen</span>
                                                                </div>
                                                            </Button>
                                                        ) : (
                                                            module.videos.map(video => (
                                                                <Button
                                                                    key={video.id}
                                                                    variant="ghost"
                                                                    onClick={() => handleSelectVideo(video, module.id)}
                                                                    className={cn(
                                                                        "w-full justify-start text-left h-auto py-2",
                                                                        selectedItem?.type === 'video' && selectedItem.data.id === video.id && "bg-accent text-accent-foreground"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        {video.isDirectDownload 
                                                                            ? <Download className="h-4 w-4" />
                                                                            : (completedVideos.has(video.id) ? <CheckCircle className="h-4 w-4 text-primary" /> : <PlayCircle className="h-4 w-4" />)
                                                                        }
                                                                        <span className="flex-1">{video.title}</span>
                                                                    </div>
                                                                </Button>
                                                            ))
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </aside>
                    <main>
                        <Card>
                            <CardContent className="p-4 md:p-6">
                                {selectedItem?.type === 'video' && (
                                    <div className="space-y-4">
                                        <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
                                            <video key={selectedItem.data.url} controls autoPlay className="w-full h-full" onEnded={handleVideoEnd}>
                                                <source src={selectedItem.data.url} type="video/mp4" />
                                                Ihr Browser unterstützt das Video-Tag nicht.
                                            </video>
                                            {showSeal && (
                                                <Image
                                                    src={sealUrl}
                                                    alt="AI Act Compass Siegel"
                                                    width={100}
                                                    height={100}
                                                    className="absolute top-4 left-4 h-16 w-16 md:h-24 md:w-24 pointer-events-none opacity-90"
                                                />
                                            )}
                                        </div>
                                        <h1 className="text-2xl font-bold">{selectedItem.data.title}</h1>
                                        <p className="text-muted-foreground">{selectedItem.data.description}</p>

                                        {selectedItem.data.resources && selectedItem.data.resources.length > 0 && (
                                            <>
                                                <Separator className="my-6" />
                                                <div className="space-y-4">
                                                    <h2 className="text-lg font-semibold">Ressourcen zum Herunterladen</h2>
                                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                        {selectedItem.data.resources.map((resource, index) => (
                                                            <a
                                                                key={index}
                                                                href={resource.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block"
                                                            >
                                                                <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
                                                                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                                                                        <ResourceIcon type={resource.type} />
                                                                        <div className="flex-1">
                                                                            <CardTitle className="text-sm font-medium">{resource.title}</CardTitle>
                                                                        </div>
                                                                        <Download className="h-5 w-5 text-muted-foreground" />
                                                                    </CardHeader>
                                                                </Card>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                    </div>
                                )}
                                {selectedItem?.type === 'exam' && <ExamCard />}
                                {!selectedItem && (
                                    <div className="text-center p-8">
                                        <h1 className="text-2xl font-bold">Willkommen zur Kursplattform!</h1>
                                        <p className="text-muted-foreground mt-2">Wählen Sie links ein Video aus, um zu beginnen.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div>
        </div>
    );
}

    

