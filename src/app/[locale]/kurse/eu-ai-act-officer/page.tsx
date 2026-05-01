import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  FileCheck2,
  Mail,
  ReceiptText,
  Scale,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { Button } from '@/components/ui/button';
import { localizeHref } from '@/lib/i18n/localize-href';

interface Props {
  params: Promise<{ locale: string }>;
}

const CHECKOUT_HREF =
  process.env.NEXT_PUBLIC_EUKI_COURSE_CHECKOUT_URL?.trim() ||
  'https://buy.stripe.com/dRmfZh7Je7CR9YMf7gcZa00';

const QUESTIONS_HREF =
  'mailto:mail.zoltangal@gmail.com?subject=Frage%20zur%20EU%20AI%20Act%20Officer%20Fortbildung';

const LEGACY_HOME_HREF = '/legacy-home/index.html';

const JANINE_IMAGE_SRC =
  'https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Janine%20wendt%20foto.jpeg?alt=media&token=298246c6-702b-4eae-84d0-9736fec7dbd8';

const SEAL_IMAGE_SRC =
  'https://i.postimg.cc/Dwym3LgN/EU-AI-Act-SIEGEL-2160-x-1080-px-Anhanger-25-x-25-Zoll2.webp';

const MOMO_IMAGE_SRC = '/images/faculty/momo-feichtinger.jpg';
const ZOLTAN_IMAGE_SRC = '/images/faculty/zoltan-gal.png';

const packageStats = [
  { value: '43', label: 'Lernvideos im Hauptkurs' },
  { value: '7', label: 'Lektionen für Praxis und Mandat' },
  { value: '30 Sek.', label: 'erste Erfassung im Register' },
  { value: '29+', label: 'Arbeitsmaterialien' },
] as const;

const heroProofPoints = [
  'Prüfung und Zertifikat, damit Qualifizierung gegenüber Kunden, Mandanten oder internen Verantwortlichen sichtbar wird',
  'Für Organisationen: den ersten KI-Einsatzfall mit Rollen, Zweck, Risiko und Review-Spur dokumentieren',
  'Für Kanzleien und Berater: Mandanten vom Rechtsrat oder KI-Workshop in einen teilbaren Use Case Pass führen',
] as const;

const outcomes: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    icon: FileCheck2,
    title: 'Für Organisationen',
    body:
      'Ein erster KI-Einsatzfall wird so beschrieben, dass Verantwortliche, Zweck, Risiko und nächste Prüfung nicht mehr in verstreuten Notizen hängen.',
  },
  {
    icon: BadgeCheck,
    title: 'Für Kanzleien',
    body:
      'Aus der AI-Act-Einordnung entsteht ein konkreter Mandatsschritt: Mandanten sehen, welcher Einsatzfall erfasst, geprüft und nachgeführt werden muss.',
  },
  {
    icon: ClipboardCheck,
    title: 'Für KI-Berater',
    body:
      'Nach dem Workshop bleibt ein übergebbares Arbeitsobjekt: Registerstart, Use Case Pass und klare Review-Schritte für das Kundenteam.',
  },
  {
    icon: ShieldCheck,
    title: 'Für Audit-Teams',
    body:
      'Der Kurs zeigt, wie Art.-4-Kompetenz, Schulung und Einsatzfall-Dokumentation in einer lesbaren Nachweisstruktur zusammenkommen.',
  },
] as const;

const courseCards = [
  {
    kicker: 'Hauptkurs',
    title: 'EU AI Act für KMU',
    body:
      'Für alle, die AI-Act-Kompetenz sauber aufbauen müssen: technische Grundlagen, Risikoklassen, rechtliche Pflichten, Ethik, Praxisfälle und Prüfung.',
  },
  {
    kicker: 'Bonuskurs 1',
    title: 'KI Governance Grundkurs',
    body:
      'Für Berater, Coaches und interne Projektverantwortliche: KI-Einführung wird in Rollen, Zweck, Wirkungskontext und nächste Prüfentscheidung übersetzt.',
  },
  {
    kicker: 'Bonuskurs 2',
    title: 'KI Governance für Juristen und Kanzleien',
    body:
      'Für Juristen und Kanzleien: Mandantenfragen werden in prüfbare Einsatzfälle, rechtlich anschlussfähige Dokumentation und klare Folgeaufträge geführt.',
  },
  {
    kicker: 'Praxisbonus',
    title: 'KIRegister Arbeitsraum',
    body:
      'Dauerhafter Free-Register-Zugang und ein Pro-Zeitfenster. Erste Erfassung in rund 30 Sekunden, danach Review, Evidenz und Export im Use Case Pass.',
  },
] as const;

const suitableFor = [
  'Organisationen, die AI-Literacy mit einem konkreten Einsatzfall verbinden wollen',
  'Kanzleien, die Mandanten vom Rechtsrat in dokumentierte Umsetzung führen',
  'KI-Berater und Coaches, die nach Workshops ein belastbares Ergebnis übergeben wollen',
  'Audit-, Compliance- und Datenschutzrollen, die eine lesbare Nachweisspur brauchen',
] as const;

const processSteps = [
  'Fortbildung buchen und Zugang persönlich zugeordnet bekommen',
  'Hauptkurs durcharbeiten, Materialien nutzen und Prüfung abschließen',
  'Den passenden Bonuskurs für Organisation, Kanzlei oder Beratungskontext nutzen',
  'Ersten Einsatzfall im KIRegister als Use Case Pass und Nachweisstruktur vorbereiten',
] as const;

const limits = [
  'Kein unbegrenzter Mehrpersonen-, Konzern- oder Agenturzugang',
  'Keine individuelle Rechtsberatung und kein Ersatz für eine Einzelfallprüfung',
  'Kein Demo-Call-Verkaufstrichter: Fragen gehen direkt per E-Mail',
] as const;

const faqItems = [
  {
    question: 'Was kaufe ich genau?',
    answer:
      'Ein Fortbildungspaket für eine Person: Hauptkurs, Prüfung, Zertifikat, zwei vertiefende Praxiskurse, Kursmaterialien, zwölf Monate Academy-Zugang und KIRegister als Arbeitsraum für den ersten Projektkontext.',
  },
  {
    question: 'Ist KIRegister im Paket enthalten?',
    answer:
      'Ja. Der dauerhafte Free-Register-Zugang ist enthalten. Zusätzlich ist ein Pro-Zeitfenster vorgesehen, damit ein erster Organisations-, Beratungs- oder Mandantenkontext als Use Case Pass vorbereitet werden kann.',
  },
  {
    question: 'Was bedeutet „in 30 Sekunden erfassen“?',
    answer:
      'Die schnelle Erfassung senkt die Hürde am Anfang: Zweck, Wirkungskontext und Verantwortung werden kurz festgehalten. Die fachliche Prüfung, Evidenz und Freigabe folgen anschließend im Kurs- und Registerprozess.',
  },
  {
    question: 'Gibt es eine Geld-zurück-Garantie?',
    answer:
      'Ja. Für das Paket gilt eine 30-Tage-Garantie. Wenn es nicht der richtige Arbeitskanal ist, soll es nicht künstlich festgehalten werden.',
  },
  {
    question: 'Ist das Rechtsberatung?',
    answer:
      'Nein. Die Fortbildung ersetzt keine individuelle Rechtsberatung. Sie hilft dabei, AI-Act-Wissen in eine strukturierte Dokumentations- und Nachweisarbeit zu übersetzen.',
  },
  {
    question: 'Kann ich vor der Buchung etwas fragen?',
    answer:
      'Ja. Schreiben Sie direkt an mail.zoltangal@gmail.com. Sinnvoll sind vor allem Fragen zu Zielgruppe, Paketgrenze, Zugang und dem ersten Projekt- oder Mandantenkontext.',
  },
] as const;

const facultyCards: ReadonlyArray<{
  name: string;
  role: string;
  body: string;
  icon: LucideIcon;
  tags: readonly string[];
  imageSrc?: string;
}> = [
  {
    name: 'Prof. Dr. Janine Wendt',
    role: 'Recht, Ethik und Prüfung',
    body:
      'Als führende Expertin ordnet sie AI Act, Risikoklassen und Verantwortlichkeiten so ein, dass Teilnehmende nicht bei Paragraphen stehen bleiben, sondern die richtigen Fragen an reale KI-Nutzung stellen.',
    icon: Scale,
    tags: ['Recht', 'Ethik', 'Prüfung'],
    imageSrc: JANINE_IMAGE_SRC,
  },
  {
    name: 'Momo Feichtinger',
    role: 'Universitätslehrgangsleiter Künstliche Intelligenz, Uni Seeburg',
    body:
      'Leitet an der Privatuniversität Schloss Seeburg den Universitätslehrgang Künstliche Intelligenz im Kontext von Angewandter KI & Business Innovation. Zeigt, wie KI-Strategie, Anwendungspraxis und Use-Case-Pässe in Unternehmen anschlussfähig werden.',
    icon: BookOpen,
    tags: ['Angewandte KI', 'Business Innovation', 'Use Case Pass'],
    imageSrc: MOMO_IMAGE_SRC,
  },
  {
    name: 'Dipl.-Psych. M.A. phil. Zoltán Gal',
    role: 'Beratung, Mandat und Umsetzung',
    body:
      'Übersetzt Governance in Angebotslogik, Kanzlei- und Beratungskontexte sowie die konkrete Arbeit mit KIRegister als dokumentierbarem Ergebnis.',
    icon: BriefcaseBusiness,
    tags: ['Beratung', 'Mandat', 'Umsetzung'],
    imageSrc: ZOLTAN_IMAGE_SRC,
  },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const canonicalPath = localizeHref(locale, '/kurse/eu-ai-act-officer');

  return {
    title: 'EU AI Act Officer Fortbildung | KI Register',
    description:
      'EU AI Act Officer Fortbildung mit Prüfung, Zertifikat, Praxisspuren für Organisationen, Kanzleien und Beratung sowie KIRegister Praxisbonus.',
    alternates: {
      canonical: canonicalPath,
    },
  };
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {children}
    </p>
  );
}

function PurchaseButton({
  children = 'Fortbildung buchen',
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      asChild
      variant="default"
      size="lg"
      className={[
        'border-slate-950 bg-slate-950 text-white hover:border-slate-800 hover:bg-slate-800 focus-visible:ring-slate-950',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <a href={CHECKOUT_HREF}>
        {children}
        <ArrowRight className="h-4 w-4" />
      </a>
    </Button>
  );
}

function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-6 text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <Check className="mt-1 h-4 w-4 shrink-0 text-slate-900" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-3xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 text-base leading-7 text-slate-600">{body}</p>
      ) : null}
    </div>
  );
}

function IconBox({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <article className="border border-slate-200 bg-white p-5">
      <Icon className="h-5 w-5 text-slate-900" />
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}

function FacultyCard({
  faculty,
}: {
  faculty: (typeof facultyCards)[number];
}) {
  const Icon = faculty.icon;

  return (
    <article className="flex h-full flex-col border border-slate-200 p-5">
      <div className="flex aspect-[4/3] items-center justify-center border border-slate-200 bg-slate-50">
        {faculty.imageSrc ? (
          <Image
            src={faculty.imageSrc}
            alt={faculty.name}
            width={320}
            height={320}
            unoptimized
            loading="eager"
            className="h-full w-full object-cover grayscale"
          />
        ) : (
          <Icon className="h-10 w-10 text-slate-900" />
        )}
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {faculty.role}
      </p>
      <h3 className="mt-3 text-xl font-semibold text-slate-950">
        {faculty.name}
      </h3>
      <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">
        {faculty.body}
      </p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
        {faculty.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}

export default async function EuAiActOfficerCoursePage({ params }: Props) {
  const { locale } = await params;
  const homeHref = localizeHref(locale, '/');
  const platformHref = localizeHref(locale, '/plattform');
  const academyHref = localizeHref(locale, '/academy');

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
          <Link href={homeHref} className="flex items-center gap-3">
            <ThemeAwareLogo
              alt="KI Register"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="text-sm font-semibold text-slate-950">
              KI Register
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-500 md:flex">
            <a href="#paket" className="hover:text-slate-950">
              Paket
            </a>
            <a href="#ergebnis" className="hover:text-slate-950">
              Ergebnis
            </a>
            <a href="#fragen" className="hover:text-slate-950">
              Fragen
            </a>
            <a
              href={LEGACY_HOME_HREF}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-950"
            >
              Bisherige Seite
            </a>
            <Link href={platformHref} className="hover:text-slate-950">
              Plattformlogik
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <Eyebrow>EU AI Act Officer Zertifizierung</Eyebrow>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] text-slate-950 md:text-6xl">
              Werden Sie EU AI Act Officer und machen Sie Ihren ersten
              KI-Einsatzfall prüfbar.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              Für Organisationen, Kanzleien, Audit-Teams und KI-Berater, die
              AI-Act-Kompetenz in eine dokumentierte Einsatzfallstruktur bringen
              müssen. Sie arbeiten mit Kurs, Prüfung, Materialien und
              KIRegister an einem realen Projektkontext: Rollen, Zweck, Risiko,
              Review und Evidenz.
            </p>
            <div className="mt-8 max-w-2xl">
              <CheckList items={heroProofPoints} />
            </div>
          </div>

          <aside className="border border-slate-200 bg-slate-50 p-5 lg:mt-10">
            <Eyebrow>Paketpreis</Eyebrow>
            <div className="mt-4 flex items-end gap-3">
              <p className="text-5xl font-semibold tracking-normal text-slate-950">
                495€
              </p>
              <p className="pb-1 text-sm text-slate-500">
                statt 620€ regulär
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Für 1 Person, 1 Projektkontext und 12 Monate Zugang zur Academy.
            </p>
            <div className="mt-6">
              <PurchaseButton className="h-12 w-full rounded-md text-sm font-semibold">
                Jetzt für 495€ buchen
              </PurchaseButton>
            </div>
            <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-600">
              <p className="flex gap-3">
                <TimerReset className="mt-1 h-4 w-4 shrink-0 text-slate-900" />
                <span>30 Tage Geld-zurück-Garantie.</span>
              </p>
              <p className="flex gap-3">
                <ReceiptText className="mt-1 h-4 w-4 shrink-0 text-slate-900" />
                <span>Zugang, Rechnung und Projektstart folgen nach der Buchung.</span>
              </p>
              <p className="flex gap-3">
                <Mail className="mt-1 h-4 w-4 shrink-0 text-slate-900" />
                <a className="underline-offset-4 hover:underline" href={QUESTIONS_HREF}>
                  Fragen vorab per E-Mail stellen
                </a>
              </p>
            </div>
          </aside>
        </div>

        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 border-t border-slate-200 px-5 md:grid-cols-4">
          {packageStats.map((stat) => (
            <div
              key={stat.label}
              className="border-b border-slate-200 py-5 pr-4 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <p className="text-2xl font-semibold text-slate-950">
                {stat.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="ergebnis" className="border-b border-slate-200">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Ergebnis"
              title="Aus dem Kurs wird ein prüfbarer Einsatzfall."
              body="Im Audit, im Mandat und in der Geschäftsführung zählt selten die Folie. Es zählt, ob ein KI-Einsatzfall nachvollziehbar beschrieben ist: wer ihn nutzt, wozu er dient, welche Risiken gesehen wurden und welche Evidenz vorliegt."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {outcomes.map((outcome) => (
                <IconBox key={outcome.title} {...outcome} />
              ))}
            </div>
          </div>

          <div className="border border-slate-200 bg-slate-50 p-5">
            <Image
              src="/images/use-case-pass-example.png"
              alt="Beispiel eines KIRegister Use Case Pass"
              width={1024}
              height={768}
              className="h-auto w-full border border-slate-200 bg-white object-contain"
              priority
            />
            <div className="mt-5 flex items-start gap-4">
              <Image
                src={SEAL_IMAGE_SRC}
                alt="EU AI Act Zertifizierungssiegel"
                width={160}
                height={80}
                unoptimized
                className="h-auto w-24 shrink-0 object-contain grayscale"
              />
              <p className="text-sm leading-6 text-slate-600">
                Zertifikat und Siegel helfen beim Kompetenznachweis. Der
                praktische Nutzen liegt im Artefakt: ein erster KI-Einsatzfall,
                der intern besprochen, an Mandanten übergeben oder für
                Prüfungsfragen vorbereitet werden kann.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="paket" className="border-b border-slate-200">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
          <SectionHeader
            eyebrow="Kurse im Paket"
            title="Ein Hauptkurs. Zwei Anwendungsspuren. Ein Registerstart."
            body="Das Paket ist für Rollen gebaut, die nach dem Lernen handeln müssen: KI-Verantwortliche in Organisationen, Kanzleien mit Mandantenfragen, KI-Berater mit Workshops und Audit-Teams mit Nachweisanforderungen."
          />

          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {courseCards.map((course) => (
              <article key={course.title} className="border border-slate-200 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {course.kicker}
                </p>
                <h3 className="mt-4 text-lg font-semibold leading-6 text-slate-950">
                  {course.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {course.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
          <div>
            <SectionHeader
              eyebrow="Expertise"
              title="Drei Perspektiven, ein Arbeitsziel: dokumentierbare KI-Governance."
              body="Der Kurs verbindet rechtliche Einordnung, technische Verständlichkeit und operative Registerarbeit. Das ist gerade für Kanzleien, Beratungen und Organisationen wichtig, weil AI-Act-Arbeit selten an einer einzigen Fachgrenze endet."
            />
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {facultyCards.map((faculty) => (
              <FacultyCard key={faculty.name} faculty={faculty} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:py-20">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Geeignet für
            </h2>
            <div className="mt-5">
              <CheckList items={suitableFor} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Ablauf
            </h2>
            <div className="mt-5">
              <CheckList items={processSteps} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Paketgrenze
            </h2>
            <div className="mt-5">
              <CheckList items={limits} />
            </div>
          </div>
        </div>
      </section>

      <section id="fragen" className="border-b border-slate-200">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
          <SectionHeader
            eyebrow="Fragen"
            title="Die wichtigsten Kaufentscheidungen, ohne Demo-Umweg."
          />
          <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">
            {faqItems.map((item) => (
              <article key={item.question} className="py-6">
                <h3 className="text-base font-semibold text-slate-950">
                  {item.question}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1fr_360px] md:items-center">
          <div>
            <Eyebrow>Startpunkt</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950">
              Wenn aus EU-AI-Act-Wissen ein belastbarer Nachweis werden soll.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              495€ Einführungspreis, regulär 620€. Für eine Person, einen
              abgegrenzten Projekt- oder Mandantenkontext und einen konkreten
              Start in die Registerarbeit.
            </p>
          </div>
          <div className="space-y-3">
            <PurchaseButton className="h-12 w-full rounded-md text-sm font-semibold">
              Fortbildung buchen
            </PurchaseButton>
            <Button asChild variant="outline" size="lg" className="h-12 w-full">
              <a href={QUESTIONS_HREF}>
                Vorab eine Frage stellen
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-5 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 text-xs leading-5 text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            Das KIRegister ersetzt keine individuelle Rechtsberatung. Es stellt
            eine strukturierte Fortbildungs- und Dokumentationsumgebung für
            KI-Governance bereit.
          </p>
          <div className="flex gap-5">
            <Link href={academyHref} className="hover:text-slate-950">
              Academy
            </Link>
            <a
              href={LEGACY_HOME_HREF}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-950"
            >
              Bisherige Seite
            </a>
            <a href={QUESTIONS_HREF} className="hover:text-slate-950">
              mail.zoltangal@gmail.com
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
