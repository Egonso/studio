import type { MetadataRoute } from 'next';
import { industries } from '@/data/industries';
import { locales } from '@/i18n/routing';
import { getPublicDocuments } from '@/lib/public-documents';
import { getPublicSiteOrigin } from '@/lib/public-site';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getPublicSiteOrigin();
  const staticRoutes = locales.flatMap((locale) => [
    `/${locale}`,
    `/${locale}/industries`,
    `/${locale}/law`,
    `/${locale}/verify`,
  ]);

  const collectionRoutes = [
    '/de/standards',
    '/de/updates',
    '/de/artefacts',
    '/de/kurse/eu-ai-act-officer',
  ];

  const industryRoutes = locales.flatMap((locale) =>
    industries.map((industry) => `/${locale}/industries/${industry.slug}`),
  );

  const documentRoutes = getPublicDocuments('de').map((doc) => {
    const segment =
      doc.content_type === 'standard'
        ? 'standards'
        : doc.content_type === 'update'
          ? 'updates'
          : 'artefacts';

    return {
      url: `${origin}/de/${segment}/${doc.slug}`,
      lastModified: new Date(doc.last_substantive_update),
    };
  });

  const urls = [...staticRoutes, ...collectionRoutes, ...industryRoutes].map((routePath) => ({
    url: `${origin}${routePath}`,
    lastModified: new Date('2026-04-15'),
  }));

  return [...urls, ...documentRoutes];
}
