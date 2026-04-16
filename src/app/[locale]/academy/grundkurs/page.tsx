import { notFound } from 'next/navigation';

import { AcademyProgramPage } from '@/components/academy/academy-program-page';
import { getAcademyProgramDefinition } from '@/lib/academy-programs';

export default async function AcademyGeneralProgramPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const program = getAcademyProgramDefinition('grundkurs');

  if (!program) {
    notFound();
  }

  return <AcademyProgramPage locale={locale} program={program} />;
}
