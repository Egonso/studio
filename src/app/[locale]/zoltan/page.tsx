import type { Metadata } from 'next';

import { ZoltanPortraitExperience } from '@/components/zoltan/zoltan-portrait-experience';

export const metadata: Metadata = {
  title: 'Alexander Zoltan Gál | Menschlichkeit unter extremen Bedingungen',
  description:
    'Eine persönliche Seite über Psychoonkologie, Bewusstseinsarbeit, KI-Verantwortung und die Frage, wie Menschlichkeit unter Druck erhalten bleibt.',
  openGraph: {
    title: 'Alexander Zoltan Gál | Menschlichkeit unter extremen Bedingungen',
    description:
      'Eine lebendige Karte von Beratung, Fortbildung, Forschung und KI-Verantwortung.',
    images: [
      {
        url: '/images/faculty/zoltan-gal.png',
        width: 480,
        height: 535,
        alt: 'Porträt von Alexander Zoltan Gál',
      },
    ],
  },
};

export default function ZoltanPage() {
  return <ZoltanPortraitExperience />;
}
