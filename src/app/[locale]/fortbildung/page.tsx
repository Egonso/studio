import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2,
  FileText,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

import { FortbildungCheckoutButton } from '@/components/fortbildung/fortbildung-checkout-button';
import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { academyProgramDefinitions } from '@/lib/academy-programs';
import { courseData } from '@/lib/course-data';
import { localizeHref } from '@/lib/i18n/localize-href';

interface Props {
  params: Promise<{ locale: string }>;
}

interface CourseModuleBreakdown {
  phase: string;
  title: string;
  promise: string;
  items: string[];
}

const HERO_IMAGE_SRC = '/images/fortbildung-main-course-map.svg';
const PASS_PREVIEW_SRC = '/images/fortbildung-use-case-pass-preview.svg';
const COURSE_SCREEN_SRC = '/images/fortbildung-course-screen.svg';
const REGISTER_SCREEN_SRC = '/images/fortbildung-register-screen.svg';
const MATERIALS_SCREEN_SRC = '/images/fortbildung-materials-screen.svg';

const MAIN_COURSE_MODULES_DE: CourseModuleBreakdown[] = [
  {
    phase: 'Modul 0',
    title: 'Einstieg, Lernpfad und sofortiger Anwendbarkeitscheck',
    promise:
      'Die Teilnehmenden verstehen, wie der Kurs aufgebaut ist, welche Materialien verwendet werden und ob der eigene Organisationskontext unter den EU AI Act fällt.',
    items: [
      'Begrüßung, Expert:innen-Kontext und Lernziel des gesamten Kurses',
      'Kursziele, Ablauf, technische Nutzung der Lernplattform und Arbeitsmaterialien',
      'Quick Win: Anwendbarkeitscheck mit Prof. Janine Wendt als erster Prüfpfad',
    ],
  },
  {
    phase: 'Modul 1',
    title: 'Technische Grundlagen von KI, Modellen und Unternehmensdaten',
    promise:
      'Der Hauptkurs schafft die technische Mindestkompetenz, um KI-Systeme in Projekten fachlich einordnen und verantwortungsvoll steuern zu können.',
    items: [
      'Neuronale Netze, Tokens, Embeddings und große Sprachmodelle wie GPT & Co.',
      'Prompt Engineering, Tool-vs.-Modell-Unterscheidung und Super-Agent-Logik',
      'RAG für unternehmensspezifische Antworten, Offline-/Open-Source-Modelle, Bias, Halluzinationen, Datenschutz und Sicherheit',
      'Materialien: Glossar, Token-Rechner, LLM-Vergleich, Prompt-Checkliste, RAG-Template, Bias- und Datenschutz-Checklisten',
    ],
  },
  {
    phase: 'Modul 2',
    title: 'Rechtsgrundlagen, Risikoklassen und EU-AI-Act-Prüflogik',
    promise:
      'Dieses Modul ist der juristische Kern des Hauptkurses: Es übersetzt den EU AI Act in eine anwendbare Prüfstruktur für reale KI-Einsatzfälle.',
    items: [
      'Regelungsbereich des AI Act, Risikopyramide, verbotene Praktiken und Hochrisiko-Pflichten',
      'Generative KI, GPAI, Transparenzpflichten, Chatbot-Kennzeichnung und Emotionserkennung',
      'Live-Entscheidungsbaum und Compliance-Roadmap bis 2026',
      'Materialien: Risikopyramide, Hochrisiko-Pflichten, GPAI-Übersicht, Entscheidungsbaum, Kennzeichnungs- und Roadmap-Unterlagen',
    ],
  },
  {
    phase: 'Modul 3',
    title: 'Ethik, Kommunikation und organisationale Verantwortung',
    promise:
      'Der Kurs verbindet Rechtswissen mit der internen Erklärung, Verteilung und Kommunikation von KI-Verantwortung gegenüber Stakeholdern.',
    items: [
      'Ethikmodelle, Prinzipien vertrauenswürdiger KI und Übertragung auf KMU-Prozesse',
      'Interne und externe Kommunikation zu KI-Nutzung, Kund:innen, Partnern und Öffentlichkeit',
      'Rollenspiel und Verantwortlichkeitslogik mit RACI-Matrix',
      'Materialien: Ethik-Selbstcheck, Transparenz-Logbuch, Bias-Audit, Kommunikations-FAQ und RACI-Matrix',
    ],
  },
  {
    phase: 'Modul 4',
    title: 'Praxisfälle, Umsetzung und Prüfungsvorbereitung',
    promise:
      'Die Teilnehmenden wenden die Logik an echten Falltypen an und bereiten sich auf die Zertifizierung vor.',
    items: [
      'Onboarding-Roadmap für Organisationen und Simulationen zu Chatbot, Retail/Service und Healthcare',
      'Zusammenspiel von DSGVO, Hochrisiko-Einordnung, CE-Bezug und Informationspflichten',
      'Prüfungsvorbereitung mit Lernkarten und den zentralen Kursentscheidungen',
      'Materialien: Roadmap-Simulation, DSGVO-Checkliste, Healthcare-Hochrisiko-Unterlage und Flashcards',
    ],
  },
  {
    phase: 'Zertifizierung',
    title: 'Prüfungsinformationen, Zertifikat und Aktualisierungspfad',
    promise:
      'Der Hauptkurs führt auf einen formalen Abschluss hin und bleibt über Zertifikat, Badge und Updates anschlussfähig.',
    items: [
      'Prüfungsinformationen und organisatorische Anforderungen',
      'Zertifikat, Badge und Update-Kommunikation',
      'Abschlussmaterialien und kompletter Variablen-/Arbeitsmatrix-Download',
    ],
  },
  {
    phase: 'Bonus im Hauptkurs',
    title: 'Implementation & Culture',
    promise:
      'Zusätzliche Umsetzungsperspektive für Menschen, Kultur und verantwortungsvolle Einführung von KI.',
    items: [
      'PERMA-orientierte Einführungsperspektive für KI-Projekte',
      'Menschenzentrierte Implementierung statt reiner Tool-Einführung',
      'Brücke zwischen Kompetenzaufbau, Akzeptanz und operativer Governance',
    ],
  },
];

const MAIN_COURSE_MODULES_EN: CourseModuleBreakdown[] = [
  {
    phase: 'Module 0',
    title: 'Onboarding, learning path and applicability check',
    promise:
      'Participants understand the course structure, the working materials and whether their organisation is affected by the EU AI Act.',
    items: [
      'Welcome, expert context and the goal of the full course',
      'Learning path, platform use, materials and technical setup',
      'Quick win: applicability check with Prof. Janine Wendt as the first assessment path',
    ],
  },
  {
    phase: 'Module 1',
    title: 'Technical foundations of AI, models and organisational data',
    promise:
      'The main course builds the technical baseline needed to classify AI systems in real projects.',
    items: [
      'Neural networks, tokens, embeddings and large language models such as GPT',
      'Prompt engineering, tools versus models and super-agent logic',
      'RAG, offline and open-source models, bias, hallucinations, privacy and security',
      'Materials: glossary, token calculator, LLM comparison, prompt checklist, RAG template, bias and privacy checklists',
    ],
  },
  {
    phase: 'Module 2',
    title: 'Legal foundations, risk classes and EU AI Act assessment logic',
    promise:
      'This is the legal core of the main course: it turns the EU AI Act into a practical assessment structure for real use cases.',
    items: [
      'Scope of the AI Act, risk pyramid, prohibited practices and high-risk obligations',
      'Generative AI, GPAI, transparency duties, chatbot labelling and emotion recognition',
      'Decision tree and compliance roadmap up to 2026',
      'Materials: risk pyramid, high-risk obligations, GPAI overview, decision tree, labelling and roadmap documents',
    ],
  },
  {
    phase: 'Module 3',
    title: 'Ethics, communication and organisational responsibility',
    promise:
      'The course connects legal knowledge with the internal explanation, allocation and communication of AI responsibility.',
    items: [
      'Ethical models, trustworthy AI principles and transfer to SME processes',
      'Internal and external communication for customers, partners and public stakeholders',
      'Role play and accountability logic through a RACI matrix',
      'Materials: ethics self-check, transparency logbook, bias audit, communication FAQ and RACI matrix',
    ],
  },
  {
    phase: 'Module 4',
    title: 'Practical cases, implementation and exam preparation',
    promise:
      'Participants apply the logic to realistic cases and prepare for certification.',
    items: [
      'Onboarding roadmap and simulations for chatbot, retail/service and healthcare contexts',
      'GDPR interaction, high-risk assessment, CE context and information duties',
      'Exam preparation with flashcards and the key course decisions',
      'Materials: roadmap simulation, GDPR checklist, healthcare high-risk document and flashcards',
    ],
  },
  {
    phase: 'Certification',
    title: 'Exam information, certificate and update path',
    promise:
      'The main course leads to a formal completion path and remains connected through certificate, badge and updates.',
    items: [
      'Exam information and formal requirements',
      'Certificate, badge and update communication',
      'Final materials and complete variable matrix download',
    ],
  },
  {
    phase: 'Main-course bonus',
    title: 'Implementation & Culture',
    promise:
      'Additional implementation perspective for people, culture and responsible AI adoption.',
    items: [
      'PERMA-oriented implementation view for AI projects',
      'Human-centred adoption for practical implementation',
      'Bridge between competency building, acceptance and operational governance',
    ],
  },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'de') {
    return {
      title: 'EU AI Act Hauptkurs – KI Register Fortbildung',
      description:
        'Der EU-AI-Act-Hauptkurs mit KI-Register-Bonuskursen, einem Jahr Zugang und einem dokumentierten ersten Projektkontext für 495€.',
    };
  }

  return {
    title: 'EU AI Act Main Course – AI Registry Training',
    description:
      'The EU AI Act main course with AI Registry bonus courses, one year of access and one documented first project context for 495€.',
    };
}

export default async function FortbildungPage({ params }: Props) {
  const { locale } = await params;
  const isGerman = locale === 'de';
  const localizedPlatformHref = localizeHref(locale, '/plattform');
  const mainCourseVideoCount = courseData.reduce(
    (count, module) =>
      count +
      module.videos.filter((video) => video.isDirectDownload !== true).length,
    0,
  );
  const mainCourseResourceCount = courseData.reduce(
    (count, module) =>
      count +
      module.videos.reduce(
        (resourceCount, video) => resourceCount + (video.resources?.length ?? 0),
        0,
      ),
    0,
  );
  const academyLessonCount = academyProgramDefinitions.reduce(
    (count, program) => count + program.lessons.length,
    0,
  );

  const copy = isGerman
    ? {
        brand: 'KI Register',
        navBack: 'Zur Plattformlogik',
        kicker: 'Neulaunch-Fortbildungspaket',
        title:
          'Der Hauptkurs für EU-AI-Act-Kompetenz. Die KI-Register-Bonuskurse gibt es im Neulaunch kostenfrei dazu.',
        lead:
          'Im Mittelpunkt steht der vollständige EU-AI-Act-Hauptkurs für KMU: Technik, Recht, Risikoklassen, Ethik, Kommunikation, Praxisfälle und Prüfungsvorbereitung. Zusätzlich erhalten Sie aktuell zwei KI-Register-Unterkurse als kostenfreie Neulaunch-Boni, damit das Gelernte direkt in einen dokumentierten ersten KI-Einsatzfall überführt wird.',
        priceLabel: 'Neulaunch-Paket',
        price: '495€',
        priceNote:
          'Hauptkurs · 2 Bonuskurse · 1 Jahr Zugang · 1 Person · 1 Projekt',
        primaryCta: 'Jetzt buchen',
        pendingCta: 'Stripe Checkout wird geöffnet',
        secondaryNote:
          'Direkter Stripe Checkout mit Rechnung, Zahlungsabwicklung, Tax-ID-Feld und Projektkontext.',
        productTruthLabel: 'Was Sie eigentlich kaufen',
        productTruthTitle:
          'Kompetenzaufbau mit erstem prüfbaren Nachweis.',
        productTruthBody:
          'Der Hauptkurs baut die fachliche Grundlage auf. Das KI Register übersetzt diese Grundlage anschließend in ein reales Arbeitsobjekt: einen Use Case Pass für den ersten abgegrenzten KI-Einsatzfall.',
        screenshotsLabel: 'Einblick',
        screenshotsTitle: 'So sieht die Arbeit im Paket aus',
        screenshotsIntro:
          'Die Vorschauen zeigen die drei Ebenen des Angebots: Hauptkurs lernen, ein Projekt im Register dokumentieren und die Nachweise aus Kursmaterialien heraus sauber vorbereiten.',
        screenshots: [
          {
            src: COURSE_SCREEN_SRC,
            title: 'Hauptkurs-Oberfläche',
            body: 'Der Fokus bleibt auf dem EU-AI-Act-Hauptkurs: strukturierte Module, Lernfortschritt, Videolektionen und direkt zugeordnete Arbeitsmaterialien.',
          },
          {
            src: REGISTER_SCREEN_SRC,
            title: 'Projekt im KI Register',
            body: 'Der erste KI-Einsatzfall wird als konkretes Arbeitsobjekt sichtbar: Zweck, Risiko, Owner, Prüfpfad und Exportstatus stehen zusammen.',
          },
          {
            src: MATERIALS_SCREEN_SRC,
            title: 'Materialien und Export',
            body: 'Checklisten, Entscheidungsbaum, RACI-Matrix und Use Case Pass werden im Projektkontext nutzbar gemacht.',
          },
        ],
        article4Title: 'Art. 4 / AI Literacy',
        article4Body:
          'Der Kurs zahlt auf den dokumentierten Kompetenzaufbau nach Art. 4 EU AI Act ein. Entscheidend ist die Anwendung von Begriffen, Risiken, Rollen und Prüfpfaden am eigenen Projekt.',
        projectTitle: 'Was bedeutet 1 Projekt?',
        projectBody:
          'Ein Projekt ist ein abgegrenzter KI-Einsatzfall oder ein klarer Mandanten-/Organisationskontext, der im KI Register als erstes Nachweisobjekt erfasst wird. Der Umfang ist auf eine Person und diesen Kontext begrenzt.',
        mainCourseTitle: 'Hauptkurs im Detail',
        primaryProductLabel: 'Hauptprodukt',
        mainCourseIntro:
          'Der Hauptkurs ist das eigentliche Produkt. Die Module sind so aufgebaut, dass aus Grundverständnis schrittweise eine prüffähige Entscheidungskompetenz entsteht.',
        materialsTitle: 'Was im Hauptkurs konkret enthalten ist',
        materialItems: [
          'Glossar, Checklisten und Entscheidungsbäume',
          'Excel-Matrizen, Token-Rechner und RAG-Template',
          'Risk Pyramid, GPAI-Übersicht und Compliance-Roadmap',
          'Bias-Audit, RACI-Matrix und Kommunikationsunterlagen',
        ],
        bonusTitle: 'Neulaunch-Boni: zwei KI-Register-Unterkurse kostenfrei dazu',
        bonusIntro:
          'Der Kernpreis gilt dem Hauptkurs. Die Unterkurse sind aktuell die Neulaunch-Zugabe und führen das Gelernte in Registerarbeit, Use Case Pass und juristisch lesbare Nachweisstruktur.',
        bonusSummaries: [
          'Dieser Track verbindet KI-Einführung, Registerlogik, Use-Case-Pass und operative Nachweisführung. Er richtet sich an Personen, die KI-Nutzung erklären, strukturiert dokumentieren und im Unternehmen verankern wollen.',
          'Dieser Track übersetzt KI-Governance in Kanzleipraxis, Haftung, Mandatsaufbau und Nachweisführung. Er zeigt, wie das KI Register im juristischen Alltag als Arbeitswerkzeug und Mandatserweiterung eingesetzt werden kann.',
        ],
        outcomeTitle: 'Ergebnis des Pakets',
        outcomeItems: [
          'Fachliche Grundlage zum EU AI Act aus dem Hauptkurs',
          'Ein dokumentierter erster KI-Einsatzfall im KI Register',
          'Ein exportierbarer Use Case Pass als Nachweisobjekt',
          'Eine nachvollziehbare Kompetenzspur für die verantwortliche Person',
        ],
        scopeTitle: 'Geltungsbereich',
        scopeItems: [
          'Eine namentlich zugeordnete Person',
          'Ein abgegrenzter Projekt- oder Mandantenkontext',
          'Zwölf Monate Zugriff auf Kurs- und Projektmaterialien',
          'Aktuell zwei Bonuskurse kostenfrei im Neulaunch enthalten',
        ],
        processTitle: 'Ablauf',
        processItems: [
          'Direkt über Stripe buchen und Projektkontext im Checkout benennen',
          'Nach dem Checkout Konto anlegen oder einloggen',
          'Hauptkurs starten und passende Bonuskurse nutzen',
          'Use Case Pass und Nachweisstruktur exportieren',
        ],
        footer:
          'Das KI Register stellt eine strukturierte Fortbildungs- und Dokumentationsumgebung für KI-Governance bereit. Individuelle Rechtsberatung bleibt separaten Mandaten vorbehalten.',
        moduleBreakdown: MAIN_COURSE_MODULES_DE,
        bonusLabels: ['Bonus-Unterkurs 1', 'Bonus-Unterkurs 2'],
        bonusTitles: [
          'KI Governance Grundkurs',
          'KI Governance für juristische Lesbarkeit',
        ],
        metrics: [
          `${mainCourseVideoCount} Lernvideos im Hauptkurs`,
          `${mainCourseResourceCount}+ Arbeitsmaterialien`,
          `${academyLessonCount} Bonusmodule kostenfrei dazu`,
        ],
      }
    : {
        brand: 'AI Registry',
        navBack: 'Back to platform logic',
        kicker: 'Launch training package',
        title:
          'The main course for EU AI Act competence. The AI Registry companion courses are currently included for free.',
        lead:
          'The centrepiece is the full EU AI Act main course for SMEs: technology, law, risk classes, ethics, communication, practical cases and exam preparation. Two AI Registry companion courses are currently included as launch bonuses so the learning becomes one documented first AI use case.',
        priceLabel: 'Launch package',
        price: '495€',
        priceNote:
          'Main course · 2 bonus courses · 1 year access · 1 person · 1 project',
        primaryCta: 'Book now',
        pendingCta: 'Opening Stripe Checkout',
        secondaryNote:
          'Direct Stripe Checkout with invoice, payment processing, tax ID field and project context.',
        productTruthLabel: 'What you actually buy',
        productTruthTitle:
          'Competence building with the first auditable evidence object.',
        productTruthBody:
          'The main course builds the knowledge foundation. AI Registry then turns that foundation into one real working object: a Use Case Pass for the first defined AI use case.',
        screenshotsLabel: 'Preview',
        screenshotsTitle: 'What working inside the package looks like',
        screenshotsIntro:
          'The previews show the three levels of the offer: learning the main course, documenting one project in the registry and preparing evidence from the course materials.',
        screenshots: [
          {
            src: COURSE_SCREEN_SRC,
            title: 'Main course interface',
            body: 'The focus stays on the EU AI Act main course: structured modules, progress, video lessons and directly assigned working materials.',
          },
          {
            src: REGISTER_SCREEN_SRC,
            title: 'Project in AI Registry',
            body: 'The first AI use case becomes a concrete working object: purpose, risk, owner, assessment path and export status stay together.',
          },
          {
            src: MATERIALS_SCREEN_SRC,
            title: 'Materials and export',
            body: 'Checklists, decision tree, RACI matrix and Use Case Pass are connected to the project context.',
          },
        ],
        article4Title: 'Article 4 / AI Literacy',
        article4Body:
          'The course supports documented competence building under Article 4 of the EU AI Act. The focus is applying concepts, risks, roles and assessment paths to one concrete project.',
        projectTitle: 'What does 1 project mean?',
        projectBody:
          'One project is a defined AI use case or a clear client/organisation context captured in AI Registry as the first evidence object. The scope is limited to one person and this context.',
        mainCourseTitle: 'Main course in detail',
        primaryProductLabel: 'Primary product',
        mainCourseIntro:
          'The main course is the actual product. The modules are structured so baseline knowledge becomes usable assessment competence.',
        materialsTitle: 'What the main course contains',
        materialItems: [
          'Glossary, checklists and decision trees',
          'Excel matrices, token calculator and RAG template',
          'Risk pyramid, GPAI overview and compliance roadmap',
          'Bias audit, RACI matrix and communication materials',
        ],
        bonusTitle: 'Launch bonuses: two AI Registry companion courses included',
        bonusIntro:
          'The core price applies to the main course. These companion courses are currently included as launch bonuses and lead the learning into registry work, Use Case Pass and legally readable evidence.',
        bonusSummaries: [
          'This track connects AI introduction, registry logic, Use Case Pass and operational evidence. It is built for people who want to explain, document and embed AI use in the organisation.',
          'This track translates AI governance into legal practice, liability, mandate development and evidence work. It shows how AI Registry can be used as a legal workflow tool and mandate extension.',
        ],
        outcomeTitle: 'Package outcome',
        outcomeItems: [
          'EU AI Act foundation from the main course',
          'One documented first AI use case in AI Registry',
          'One exportable Use Case Pass as evidence object',
          'A traceable competence path for the responsible person',
        ],
        scopeTitle: 'Scope',
        scopeItems: [
          'One named person',
          'One defined project or client context',
          'Twelve months of access to course and project materials',
          'Two companion courses currently included as launch bonuses',
        ],
        processTitle: 'Process',
        processItems: [
          'Book directly through Stripe and name the project context in Checkout',
          'Create an account or sign in after Checkout',
          'Start the main course and use the matching bonus courses',
          'Export the Use Case Pass and evidence structure',
        ],
        footer:
          'AI Registry provides a structured training and documentation environment for AI governance. Individual legal advice remains reserved for separate mandates.',
        moduleBreakdown: MAIN_COURSE_MODULES_EN,
        bonusLabels: ['Bonus course 1', 'Bonus course 2'],
        bonusTitles: [
          'AI Governance Foundation',
          'AI Governance for legal readability',
        ],
        metrics: [
          `${mainCourseVideoCount} learning videos in the main course`,
          `${mainCourseResourceCount}+ working materials`,
          `${academyLessonCount} bonus modules included`,
        ],
      };

  const bonusPrograms = academyProgramDefinitions.map((program, index) => ({
    ...program,
    displayLabel: copy.bonusLabels[index] ?? `Bonus ${index + 1}`,
    displayTitle: copy.bonusTitles[index] ?? program.title,
    displaySummary: copy.bonusSummaries[index] ?? program.summary,
  }));

  return (
    <MarketingShell>
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950">
            <ThemeAwareLogo
              alt={copy.brand}
              width={34}
              height={34}
              className="h-8 w-auto"
            />
            <span>{copy.brand}</span>
          </div>
          <Link
            href={localizedPlatformHref}
            className="text-sm text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
          >
            {copy.navBack}
          </Link>
        </header>

        <section className="grid gap-8 border-b border-slate-200 pb-10 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.kicker}
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              {copy.lead}
            </p>
            <div className="overflow-hidden border border-slate-200 bg-slate-50">
              <Image
                src={HERO_IMAGE_SRC}
                alt=""
                width={1280}
                height={820}
                className="h-auto w-full"
                priority
                unoptimized
              />
            </div>
          </div>

          <aside className="border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.priceLabel}
            </p>
            <p className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">
              {copy.price}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {copy.priceNote}
            </p>
            <FortbildungCheckoutButton
              locale={locale}
              label={copy.primaryCta}
              pendingLabel={copy.pendingCta}
              testId="fortbildung-checkout-primary"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-none border border-slate-950 bg-slate-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            />
            <p className="mt-4 text-xs leading-6 text-slate-600">
              {copy.secondaryNote}
            </p>
            <div className="mt-5 border-t border-slate-200 pt-5">
              <h2 className="text-sm font-semibold text-slate-950">
                {copy.projectTitle}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {copy.projectBody}
              </p>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 border-b border-slate-200 py-8 md:grid-cols-3">
          {copy.metrics.map((metric) => (
            <div key={metric} className="border border-slate-200 px-4 py-4">
              <p className="text-sm font-medium leading-6 text-slate-950">
                {metric}
              </p>
            </div>
          ))}
        </section>

        <section className="space-y-6 border-b border-slate-200 py-10">
          <div className="max-w-4xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.screenshotsLabel}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {copy.screenshotsTitle}
            </h2>
            <p className="text-sm leading-7 text-slate-700 sm:text-base">
              {copy.screenshotsIntro}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {copy.screenshots.map((screenshot) => (
              <figure
                key={screenshot.title}
                className="overflow-hidden border border-slate-200 bg-white"
              >
                <div className="border-b border-slate-200 bg-slate-50 p-3">
                  <Image
                    src={screenshot.src}
                    alt=""
                    width={1180}
                    height={760}
                    className="h-auto w-full border border-slate-200 bg-white"
                    loading="eager"
                    unoptimized
                  />
                </div>
                <figcaption className="px-4 py-4">
                  <h3 className="text-base font-semibold text-slate-950">
                    {screenshot.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {screenshot.body}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="grid gap-8 border-b border-slate-200 py-10 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.productTruthLabel}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              {copy.productTruthTitle}
            </h2>
            <p className="text-sm leading-7 text-slate-700">
              {copy.productTruthBody}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="border border-slate-200 px-5 py-5">
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-1 h-5 w-5 shrink-0 text-slate-800" />
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    {copy.article4Title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {copy.article4Body}
                  </p>
                </div>
              </div>
            </article>
            <article className="border border-slate-200 px-5 py-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-slate-800" />
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Use Case Pass
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {copy.outcomeItems.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm leading-7 text-slate-700"
                      >
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-800" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="grid gap-8 border-b border-slate-200 py-10 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {copy.primaryProductLabel}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                {copy.mainCourseTitle}
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
                {copy.mainCourseIntro}
              </p>
            </div>

            <div className="space-y-3">
              {copy.moduleBreakdown.map((module, index) => (
                <details
                  key={module.phase}
                  className="border border-slate-200 bg-white px-4 py-4"
                  open={index < 2}
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {module.phase}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold leading-7 text-slate-950">
                          {module.title}
                        </h3>
                      </div>
                      <span className="text-sm font-medium text-slate-500">
                        Details
                      </span>
                    </div>
                  </summary>
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-sm leading-7 text-slate-700">
                      {module.promise}
                    </p>
                    <ul className="mt-4 grid gap-3 md:grid-cols-2">
                      {module.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-sm leading-7 text-slate-700"
                        >
                          <span className="mt-3 h-1.5 w-1.5 shrink-0 bg-slate-950" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="border border-slate-200 bg-slate-50 px-5 py-5">
              <h3 className="text-base font-semibold text-slate-950">
                {copy.materialsTitle}
              </h3>
              <ul className="mt-4 space-y-3">
                {copy.materialItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-7 text-slate-700"
                  >
                    <FileText className="mt-1 h-4 w-4 shrink-0 text-slate-800" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden border border-slate-200 bg-slate-50">
              <Image
                src={PASS_PREVIEW_SRC}
                alt=""
                width={1040}
                height={760}
                className="h-auto w-full"
                loading="eager"
                unoptimized
              />
            </div>
          </aside>
        </section>

        <section className="space-y-6 border-b border-slate-200 py-10">
          <div className="max-w-4xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Neulaunch
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {copy.bonusTitle}
            </h2>
            <p className="text-sm leading-7 text-slate-700 sm:text-base">
              {copy.bonusIntro}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {bonusPrograms.map((program) => (
              <article key={program.slug} className="border border-slate-200 px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {program.displayLabel}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {program.displayTitle}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {program.displaySummary}
                </p>
                <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
                  {program.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Bonusmodul {index + 1} · {lesson.duration}
                      </p>
                      <h4 className="text-base font-semibold text-slate-950">
                        {lesson.title}
                      </h4>
                      <p className="text-sm leading-7 text-slate-700">
                        {lesson.summary}
                      </p>
                      <p className="text-xs leading-6 text-slate-500">
                        Materialien: {lesson.resources.map((resource) => resource.label).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 border-b border-slate-200 py-10 lg:grid-cols-2">
          {[
            { title: copy.scopeTitle, items: copy.scopeItems },
            { title: copy.processTitle, items: copy.processItems },
          ].map((section) => (
            <div key={section.title} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-950">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-800" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-5 py-8 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            {copy.footer}
          </p>
          <FortbildungCheckoutButton
            locale={locale}
            label={copy.primaryCta}
            pendingLabel={copy.pendingCta}
            testId="fortbildung-checkout-footer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-none border border-slate-950 px-5 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-50"
          />
        </section>
      </main>
    </MarketingShell>
  );
}
