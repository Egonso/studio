
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlayCircle, CheckCircle } from 'lucide-react';
import { courseData } from '@/lib/course-data';
import type { Video } from '@/lib/course-data';
import { useAuth } from '@/context/auth-context';
import { getCourseProgress, saveCourseProgress } from '@/lib/data-service';
import { cn } from '@/lib/utils';

export default function CoursePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

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
                if (videoId) {
                    const video = courseData.flatMap(m => m.videos).find(v => v.id === videoId);
                    setSelectedVideo(video || null);
                } else {
                    setSelectedVideo(courseData[0].videos[0]);
                }
                setIsLoading(false);
            };
            loadProgress();
        }
    }, [user, searchParams]);

    const handleSelectVideo = (video: Video) => {
        setSelectedVideo(video);
        router.push(`/kurs?videoId=${video.id}`, { scroll: false });
    };

    const handleVideoEnd = () => {
        if (selectedVideo && !completedVideos.has(selectedVideo.id)) {
            const newCompleted = new Set(completedVideos);
            newCompleted.add(selectedVideo.id);
            setCompletedVideos(newCompleted);
            saveCourseProgress(Array.from(newCompleted));
        }
    };

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
            <div className="flex-1 grid md:grid-cols-[350px_1fr] gap-6 p-4 md:p-8">
                <aside className="flex flex-col gap-4">
                    <Card>
                        <CardContent className="p-2">
                             <ScrollArea className="h-[calc(100vh-10rem)]">
                                <Accordion type="multiple" defaultValue={[`module-${selectedVideo?.id.split('-')[1] || '0'}`]} className="w-full">
                                    {courseData.map(module => (
                                        <AccordionItem value={module.id} key={module.id}>
                                            <AccordionTrigger>{module.title}</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="flex flex-col gap-1">
                                                    {module.videos.map(video => (
                                                        <Button
                                                            key={video.id}
                                                            variant="ghost"
                                                            onClick={() => handleSelectVideo(video)}
                                                            className={cn(
                                                                "w-full justify-start text-left h-auto py-2",
                                                                selectedVideo?.id === video.id && "bg-accent text-accent-foreground"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {completedVideos.has(video.id) ? <CheckCircle className="h-4 w-4 text-primary" /> : <PlayCircle className="h-4 w-4" />}
                                                                <span className="flex-1">{video.title}</span>
                                                            </div>
                                                        </Button>
                                                    ))}
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
                            {selectedVideo ? (
                                <div className="space-y-4">
                                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                                        <video key={selectedVideo.url} controls autoPlay className="w-full h-full" onEnded={handleVideoEnd}>
                                            <source src={selectedVideo.url} type="video/mp4" />
                                            Ihr Browser unterstützt das Video-Tag nicht.
                                        </video>
                                    </div>
                                    <h1 className="text-2xl font-bold">{selectedVideo.title}</h1>
                                    <p className="text-muted-foreground">{selectedVideo.description}</p>
                                </div>
                            ) : (
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
    );
}

