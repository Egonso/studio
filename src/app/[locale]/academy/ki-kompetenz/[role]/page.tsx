import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Art4ModuleClient } from '@/components/art4/art4-module-client';
import { ART4_MODULES, getArt4Module } from '@/lib/art4-training/definitions';

export function generateStaticParams() {
  return ART4_MODULES.map((module) => ({ role: module.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; role: string }>;
}): Promise<Metadata> {
  const { role } = await params;
  const moduleDefinition = getArt4Module(role);

  return {
    title: moduleDefinition
      ? `${moduleDefinition.title} — kostenlose Art.-4-Schulung | KI Register`
      : 'KI-Kompetenz nach Art. 4 | KI Register',
    description: moduleDefinition?.summary,
  };
}

export default async function Art4ModulePage({
  params,
}: {
  params: Promise<{ locale: string; role: string }>;
}) {
  const { locale, role } = await params;
  const moduleDefinition = getArt4Module(role);

  if (!moduleDefinition) {
    notFound();
  }

  return <Art4ModuleClient locale={locale} module={moduleDefinition} />;
}
