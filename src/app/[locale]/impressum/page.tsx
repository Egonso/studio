import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ImpressumRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/legal-notice`);
}
