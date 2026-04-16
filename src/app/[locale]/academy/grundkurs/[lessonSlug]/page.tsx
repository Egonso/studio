import { notFound } from 'next/navigation';

import { AcademyProgramPage } from '@/components/academy/academy-program-page';
import {
  getAcademyLessonDefinition,
  getAcademyProgramDefinition,
} from '@/lib/academy-programs';

export function generateStaticParams() {
  const program = getAcademyProgramDefinition('grundkurs');

  return (
    program?.lessons.map((lesson) => ({
      lessonSlug: lesson.slug,
    })) ?? []
  );
}

export default async function AcademyGeneralLessonPage({
  params,
}: {
  params: Promise<{ locale: string; lessonSlug: string }>;
}) {
  const { locale, lessonSlug } = await params;
  const program = getAcademyProgramDefinition('grundkurs');
  const lesson = getAcademyLessonDefinition('grundkurs', lessonSlug);

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
