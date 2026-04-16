'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  CheckCircle,
  Download,
  FileText,
  GraduationCap,
  PlayCircle,
  Sheet as SheetIcon,
} from 'lucide-react';

import { ExamCard } from '@/components/exam-card';
import { PageStatePanel, SignedInAreaFrame } from '@/components/product-shells';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import { academyProgramDefinitions } from '@/lib/academy-programs';
import { courseData } from '@/lib/course-data';
import type { Module, Video } from '@/lib/course-data';
import { buildAcademyProgressSnapshot } from '@/lib/course-progress';
import { getCourseProgress, saveCourseProgress } from '@/lib/data-service';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import { cn } from '@/lib/utils';

type Selection =
  | {
      type: 'video';
      data: Video;
      moduleId: string;
    }
  | {
      type: 'exam';
      data: Module;
    };

const SEAL_URL =
  'https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU-AI-Act%20SIEGEL%20(2160%20x%201080%20px)%20(Anha%CC%88nger%C2%A0%E2%80%93%202%2C5%20x%202%2C5%20Zoll).png?alt=media&token=6f22bdf6-e4a5-4b26-bd48-7b2786ef6487';

function resolveSelection(
  videoId: string | null,
  moduleId: string | null,
): Selection | null {
  if (videoId) {
    for (const courseModule of courseData) {
      const video = courseModule.videos.find((entry) => entry.id === videoId);
      if (video) {
        return {
          type: 'video',
          data: video,
          moduleId: courseModule.id,
        };
      }
    }
  }

  if (moduleId) {
    const courseModule = courseData.find(
      (entry) => entry.id === moduleId && entry.isExam,
    );
    if (courseModule) {
      return {
        type: 'exam',
        data: courseModule,
      };
    }
  }

  const firstModule = courseData[0];
  const firstVideo = firstModule?.videos[0];
  if (!firstModule || !firstVideo) {
    return null;
  }

  return {
    type: 'video',
    data: firstVideo,
    moduleId: firstModule.id,
  };
}

function ResourceIcon({ type }: { type: string }) {
  switch (type) {
    case 'pdf':
      return <FileText className="h-5 w-5" />;
    case 'xlsx':
      return <SheetIcon className="h-5 w-5" />;
    default:
      return <Download className="h-5 w-5" />;
  }
}

export default function CoursePage() {
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const {
    allowed,
    loading: capabilityLoading,
    requiredPlanLabel,
  } = useCapability('competencyMatrix');

  const [selectedItem, setSelectedItem] = useState<Selection | null>(null);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!user || !allowed) {
      return;
    }

    let isCancelled = false;

    async function loadProgress() {
      setIsLoading(true);

      try {
        const progress = await getCourseProgress();
        if (isCancelled) {
          return;
        }

        setCompletedVideos(new Set(progress));
        setSelectedItem(
          resolveSelection(
            searchParams.get('videoId'),
            searchParams.get('moduleId'),
          ),
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProgress();

    return () => {
      isCancelled = true;
    };
  }, [allowed, searchParams, user]);

  const progress = useMemo(
    () => buildAcademyProgressSnapshot(Array.from(completedVideos)),
    [completedVideos],
  );

  const remainingVideos = Math.max(
    0,
    progress.totalVideos - progress.completedVideos,
  );
  const showSeal =
    selectedItem?.type === 'video' &&
    ['module-0', 'module-1', 'module-2', 'module-3', 'module-4'].includes(
      selectedItem.moduleId,
    );

  if (authLoading || capabilityLoading || (allowed && isLoading)) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title="Academy"
        description="Kurse, Prüfungsinformationen und Governance-Lernmaterialien."
        nextStep="Academy-Inhalte werden vorbereitet."
      >
        <PageStatePanel
          tone="loading"
          area="paid_governance_control"
          title="Academy wird geladen"
          description="Kursmodule, Lernfortschritt und Prüfungsinformationen werden vorbereitet."
        />
      </SignedInAreaFrame>
    );
  }

  if (!user) {
    return null;
  }

  if (!allowed) {
    return (
      <SignedInAreaFrame
        area="paid_governance_control"
        title="Academy"
        description="Governance-Kurse, Lernressourcen und Prüfungsinformationen für Ihr Team."
        nextStep="Academy gehört zur bezahlten Governance-Ebene."
      >
        <PageStatePanel
          area="paid_governance_control"
          title="Academy gehört zu den Premium-Bereichen"
          description={`${requiredPlanLabel} schaltet Kurse, Lernfortschritt und Zertifizierungsoberflächen im Governance Control Center frei. Promotion-Codes werden im bestehenden Stripe-Checkout unterstützt und können auch für vollständige Einzel-Freischaltungen genutzt werden.`}
          actions={
            <>
              <Button asChild>
                <Link href={ROUTE_HREFS.control}>Overview öffnen</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={ROUTE_HREFS.governanceUpgrade}>
                  Upgrade-Optionen
                </Link>
              </Button>
            </>
          }
        />
      </SignedInAreaFrame>
    );
  }

  return (
    <SignedInAreaFrame
      area="paid_governance_control"
      title="Academy"
      description="Governance-Kurse, Lernressourcen und Prüfungsinformationen für Ihr Team."
      nextStep={
        selectedItem?.type === 'exam'
          ? 'Prüfen Sie Prüfungsinformationen und formale Anforderungen.'
          : progress.started
            ? 'Arbeiten Sie das nächste Modul ab oder wechseln Sie zur Prüfung.'
            : 'Wählen Sie links ein Modul und starten Sie den ersten Lernschritt.'
      }
    >
      <Card className="border-slate-200 bg-white shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Academy-Fortschritt</CardTitle>
            <p className="text-sm leading-6 text-slate-600">
              {progress.completed
                ? 'Alle Lernvideos sind abgeschlossen. Zertifizierung und Exporte bleiben direkt erreichbar.'
                : progress.started
                  ? `Noch ${remainingVideos} Lernvideos bis zum Abschluss.`
                  : 'Starten Sie mit dem ersten Modul. Der Lernfortschritt bleibt im Governance-Bereich sichtbar.'}
            </p>
          </div>
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Abgeschlossen</span>
              <span className="font-medium text-slate-950">
                {progress.completedVideos}/{progress.totalVideos}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-900 transition-all"
                style={{ width: `${progress.completionPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="outline">
                <Link href={ROUTE_HREFS.control}>Zu Control</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={ROUTE_HREFS.controlExports}>Audit / Exports</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-none">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Weitere Academy-Programme</CardTitle>
            <p className="text-sm leading-6 text-slate-600">
              Der bestehende Zertifizierungskurs bleibt unverändert. Zusätzlich
              liegen hier neue Tracks für allgemeine Governance-Einführung und
              juristische Praxis, jeweils mit eingebetteten Videos und
              kuratierten Materialien.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {academyProgramDefinitions.map((program) => (
              <div
                key={program.slug}
                className="border border-slate-200 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {program.strapline}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  {program.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {program.summary}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {program.lessons.length} Module · Promotion-Codes im Checkout
                  unterstützt
                </p>
                <Button asChild className="mt-4">
                  <Link href={`/${locale}/academy/${program.slug}`}>
                    Programm öffnen
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-2">
              <ScrollArea className="h-[calc(100vh-18rem)]">
                <Accordion
                  type="multiple"
                  defaultValue={[
                    selectedItem?.type === 'video'
                      ? selectedItem.moduleId
                      : selectedItem?.type === 'exam'
                        ? selectedItem.data.id
                        : 'module-0',
                  ]}
                  className="w-full"
                >
                  {courseData.map((module) => (
                    <AccordionItem value={module.id} key={module.id}>
                      <AccordionTrigger>{module.title}</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-1">
                          {module.isExam ? (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setSelectedItem({ type: 'exam', data: module });
                                router.push(
                                  `${ROUTE_HREFS.academy}?moduleId=${module.id}`,
                                  { scroll: false },
                                );
                              }}
                              className={cn(
                                'h-auto w-full justify-start py-2 text-left',
                                selectedItem?.type === 'exam' &&
                                  selectedItem.data.id === module.id &&
                                  'bg-accent text-accent-foreground',
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <GraduationCap className="h-4 w-4" />
                                <span className="flex-1">
                                  Prüfungsinformationen
                                </span>
                              </div>
                            </Button>
                          ) : (
                            module.videos.map((video) => (
                              <Button
                                key={video.id}
                                variant="ghost"
                                onClick={() => {
                                  if (video.isDirectDownload) {
                                    window.open(video.url, '_blank');
                                    return;
                                  }

                                  setSelectedItem({
                                    type: 'video',
                                    data: video,
                                    moduleId: module.id,
                                  });
                                  router.push(
                                    `${ROUTE_HREFS.academy}?videoId=${video.id}`,
                                    { scroll: false },
                                  );
                                }}
                                className={cn(
                                  'h-auto w-full justify-start py-2 text-left',
                                  selectedItem?.type === 'video' &&
                                    selectedItem.data.id === video.id &&
                                    'bg-accent text-accent-foreground',
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {video.isDirectDownload ? (
                                    <Download className="h-4 w-4" />
                                  ) : completedVideos.has(video.id) ? (
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4" />
                                  )}
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
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                    <video
                      key={selectedItem.data.url}
                      controls
                      autoPlay
                      className="h-full w-full"
                      onEnded={() => {
                        if (completedVideos.has(selectedItem.data.id)) {
                          return;
                        }

                        const newCompleted = new Set(completedVideos);
                        newCompleted.add(selectedItem.data.id);
                        setCompletedVideos(newCompleted);
                        void saveCourseProgress(Array.from(newCompleted));
                      }}
                    >
                      <source src={selectedItem.data.url} type="video/mp4" />
                      Ihr Browser unterstützt das Video-Tag nicht.
                    </video>
                    {showSeal ? (
                      <Image
                        src={SEAL_URL}
                        alt="AI Act Compass Siegel"
                        width={100}
                        height={100}
                        className="pointer-events-none absolute left-4 top-4 h-16 w-16 opacity-90 md:h-24 md:w-24"
                      />
                    ) : null}
                  </div>

                  <h1 className="text-2xl font-bold">
                    {selectedItem.data.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {selectedItem.data.description}
                  </p>

                  {selectedItem.data.resources?.length ? (
                    <>
                      <Separator className="my-6" />
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold">
                          Ressourcen zum Herunterladen
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {selectedItem.data.resources.map(
                            (resource, index) => (
                              <a
                                key={index}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <Card className="transition-colors hover:bg-accent hover:text-accent-foreground">
                                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                                    <ResourceIcon type={resource.type} />
                                    <div className="flex-1">
                                      <CardTitle className="text-sm font-medium">
                                        {resource.title}
                                      </CardTitle>
                                    </div>
                                    <Download className="h-5 w-5 text-muted-foreground" />
                                  </CardHeader>
                                </Card>
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {selectedItem?.type === 'exam' ? <ExamCard /> : null}

              {!selectedItem ? (
                <div className="p-8 text-center">
                  <h1 className="text-2xl font-bold">
                    Willkommen in der Academy
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Wählen Sie links ein Lernmodul oder die Prüfung aus.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </main>
      </div>
    </SignedInAreaFrame>
  );
}
