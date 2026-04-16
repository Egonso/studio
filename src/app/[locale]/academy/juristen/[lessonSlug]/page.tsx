import { notFound } from 'next/navigation';

import { AcademyProgramPage } from '@/components/academy/academy-program-page';
import {
  getAcademyLessonDefinition,
  getAcademyProgramDefinition,
} from '@/lib/academy-programs';

export function generateStaticParams() {
  const program = getAcademyProgramDefinition('juristen');

  return (
    program?.lessons.map((lesson) => ({
      lessonSlug: lesson.slug,
    })) ?? []
  );
}

export default async function AcademyLegalLessonPage({
  params,
}: {
  params: Promise<{ locale: string; lessonSlug: string }>;
}) {
  const { locale, lessonSlug } = await params;
  const program = getAcademyProgramDefinition('juristen');
  const lesson = getAcademyLessonDefinition('juristen', lessonSlug);

  if (!program || !lesson) {
    notFound();
  }

  return (
    <AcademyProgramPage
      locale={locale}
      program={program}
      selectedLessonSlug={lesson.slug}
    />
  );
}
