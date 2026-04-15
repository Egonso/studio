import { redirect } from 'next/navigation';
import { industries } from '@/data/industries';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  return industries.map((industry) => ({
    locale: 'de',
    slug: industry.deSlug,
  }));
}

export default async function BranchenAliasPage({ params }: Props) {
  const { locale, slug } = await params;

  // Find the industry by its German slug
  const industry = industries.find((i) => i.deSlug === slug);

  if (!industry) {
    // Fall back to industries index
    redirect(`/${locale}/industries`);
  }

  // Redirect to canonical English slug route
  redirect(`/${locale}/industries/${industry.slug}`);
}
