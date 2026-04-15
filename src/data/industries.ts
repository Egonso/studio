export interface IndustryFaq {
  q: string;
  a: string;
}

export interface IndustryUseCase {
  name: string;
  risk: 'minimal' | 'limited' | 'high' | 'prohibited';
}

export interface IndustryLocaleContent {
  name: string;
  tagline: string;
  heroDescription: string;
  euActRiskLevel: string;
  euActRiskDetail: string;
  whyAffected: string[];
  typicalUseCases: IndustryUseCase[];
  obligations: string[];
  faq: IndustryFaq[];
  metaTitle: string;
  metaDescription: string;
  objectLabel?: string;
  stanceLabel?: string;
  author?: string;
  reviewedBy?: string;
  effectiveDate?: string;
  lastSubstantiveUpdate?: string;
  sourceUrls?: string[];
  cta?: {
    label: string;
    href: string;
    description?: string;
  };
  relatedLinks?: Array<{
    label: string;
    href: string;
    description?: string;
  }>;
}

export interface Industry {
  slug: string;
  deSlug: string;
  icon: string;
  de: IndustryLocaleContent;
  en: IndustryLocaleContent;
}

const SUPPLIER_REQUEST_DEEP_LINK_DE =
  '/login?mode=signup&intent=create_register&returnTo=%2Fde%2Fmy-register%3Ffilter%3Dexternal_inbox%26open%3Dsupplier_invite';
const SUPPLIER_REQUEST_DEEP_LINK_EN =
  '/login?mode=signup&intent=create_register&returnTo=%2Fen%2Fmy-register%3Ffilter%3Dexternal_inbox%26open%3Dsupplier_invite';

export const industries: Industry[] = [
  {
    slug: 'automotive-suppliers',
    deSlug: 'automotive-zulieferer',
    icon: '🚗',
    de: {
      name: 'Automobil-Zulieferer',
      tagline: 'KI-Governance für Lieferkette, Freigabe und Nachweise',
      heroDescription:
        'Für Automobil-Zulieferer wird KI-Governance konkret, sobald ein OEM, Tier-1-Kunde oder Auditor einen belastbaren Nachweis zu einem einzelnen KI-Einsatzfall verlangt.',
      euActRiskLevel: 'Minimales / Begrenztes Risiko mit Hochrisiko-Spitzen',
      euActRiskDetail:
        'Hoher Nachweisdruck durch Lieferkette, Safety-Kontext und spätere Standardisierung; Hochrisiko vor allem bei sicherheitsnahen oder entscheidungsrelevanten Anwendungen.',
      whyAffected: [
        'Viele KI-Einsatzfälle in der Zulieferkette sind operativ zunächst unkritisch, werden aber beschaffungs- und auditseitig schnell erklärungsbedürftig.',
        'Sobald KI in qualitätsrelevanten, sicherheitsnahen oder freigaberelevanten Prozessen eingesetzt wird, steigen Review- und Nachweiserwartungen deutlich.',
        'Lieferkettenkommunikation scheitert oft nicht an fehlender Absicht, sondern an fehlender gemeinsamer Struktur für einen konkreten Einsatzfall.',
        'Automotive ist deshalb ein plausibler Beachhead für den Use-Case Pass: Beschaffungslogik, Qualitätskultur und Nachweisdisziplin treffen hier früh zusammen.',
      ],
      typicalUseCases: [
        { name: 'Computer Vision in Qualitätskontrolle', risk: 'minimal' },
        { name: 'Generative KI für Angebots- und Dokumententexte', risk: 'minimal' },
        { name: 'Lieferantenbewertung mit KI-gestützten Signalen', risk: 'limited' },
        { name: 'Produktionsassistenz mit sicherheitsnahen Handlungsempfehlungen', risk: 'limited' },
        { name: 'Freigabeunterstützung in sicherheitskritischen Prozessen', risk: 'high' },
        { name: 'Predictive Maintenance für interne Anlagen', risk: 'minimal' },
        { name: 'KI-gestützte Arbeitssicherheitsauswertung mit Personaldaten', risk: 'limited' },
      ],
      obligations: [
        'Jeden realen KI-Einsatzfall separat erfassen statt nur Tool-Listen zu pflegen.',
        'Verantwortliche Rolle pro Einsatzfall benennen und dokumentieren.',
        'Bei sicherheitsnahen oder freigaberelevanten Anwendungen Review und Nachweis vertiefen.',
        'Supplier Requests auf derselben Struktur beantworten wie den internen Use-Case Pass.',
        'AI Literacy, Richtlinien und Registerarbeit als eine Evidenzkette behandeln.',
      ],
      faq: [
        {
          q: 'Sind Automobil-Zulieferer automatisch im Hochrisiko-Bereich?',
          a: 'Nein. Viele Anwendungen bleiben minimal oder begrenzt riskant. Der Nachweisdruck ist trotzdem hoch, weil Lieferkette, Qualität und Sicherheit eine saubere Falllogik verlangen.',
        },
        {
          q: 'Warum reicht eine allgemeine KI-Richtlinie nicht aus?',
          a: 'Weil Kunden und Auditoren meist wissen wollen, welcher konkrete KI-Einsatzfall betroffen ist, welche Wirkung er hat und wer ihn verantwortet. Dafür braucht es einsatzfallbezogene Evidenz.',
        },
        {
          q: 'Wann wird ein Use-Case Pass in der Lieferkette besonders wertvoll?',
          a: 'Sobald Rückfragen zu einem einzelnen KI-Einsatzfall auftauchen, etwa in Beschaffung, Due Diligence, Qualitätsfreigabe oder Partnerprüfung.',
        },
        {
          q: 'Ist das eher ein Tool- oder ein Format-Thema?',
          a: 'Strategisch ist es vor allem ein Format-Thema. Das Register ist die operative Heimat, aber der eigentliche Hebel ist ein wiederholbares Nachweisformat pro Einsatzfall.',
        },
      ],
      metaTitle: 'KI-Governance für Automobil-Zulieferer – KI Register',
      metaDescription:
        'Automotive-first Hub für KI-Einsatzfälle, Supplier Requests und den Use-Case Pass als Nachweisformat in der Lieferkette.',
      objectLabel: 'Branchen-Dokument',
      stanceLabel: 'Automotive-Playbook',
      author: 'KIRegister',
      reviewedBy: 'KIRegister Redaktion',
      effectiveDate: '2026-04-15',
      lastSubstantiveUpdate: '2026-04-15',
      sourceUrls: [
        'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
        'https://digital-strategy.ec.europa.eu/en/policies/ai-act-standardisation',
        'https://digital-strategy.ec.europa.eu/en/policies/ai-talent-skills-and-literacy',
      ],
      cta: {
        label: 'Lieferantenanfrage starten',
        href: SUPPLIER_REQUEST_DEEP_LINK_DE,
        description:
          'Der Button führt direkt in die Lieferantenanfrage-Funktion des Registers statt in eine lose E-Mail.',
      },
      relatedLinks: [
        {
          label: 'Der Use-Case Pass als Standardnachweis',
          href: '/de/standards/use-case-pass',
          description: 'Grundlagendokument für die einsatzfallbasierte Nachweislogik.',
        },
        {
          label: 'OEM Supplier Request Kit',
          href: '/de/artefacts/oem-supplier-request-kit',
          description: 'Beschaffungsnahes Artefakt für strukturierte Rückfragen entlang der Lieferkette.',
        },
      ],
    },
    en: {
      name: 'Automotive Suppliers',
      tagline: 'AI governance for supply chain, approvals, and evidence',
      heroDescription:
        'For automotive suppliers, AI governance becomes concrete when an OEM, tier-one customer, or auditor requests a reliable record for one specific AI use case.',
      euActRiskLevel: 'Minimal / Limited Risk with high-risk peaks',
      euActRiskDetail:
        'Strong evidence pressure through supply chain, safety context, and later standardisation; high-risk mainly for safety-adjacent or decision-relevant applications.',
      whyAffected: [
        'Many supplier-side AI use cases are operationally harmless at first, but become procurement and audit topics very quickly.',
        'As soon as AI touches quality-relevant, safety-adjacent, or approval-relevant processes, review and evidence expectations rise materially.',
        'Supply-chain communication often fails because there is no shared structure for one concrete AI use case.',
        'Automotive is therefore a plausible beachhead for the use-case pass: procurement logic, quality culture, and evidence discipline meet early.',
      ],
      typicalUseCases: [
        { name: 'Computer vision in quality control', risk: 'minimal' },
        { name: 'Generative AI for offers and technical documentation', risk: 'minimal' },
        { name: 'Supplier evaluation with AI-supported signals', risk: 'limited' },
        { name: 'Production assistance with safety-adjacent recommendations', risk: 'limited' },
        { name: 'Approval support in safety-critical processes', risk: 'high' },
        { name: 'Predictive maintenance for internal equipment', risk: 'minimal' },
        { name: 'AI-supported workplace safety evaluation using employee data', risk: 'limited' },
      ],
      obligations: [
        'Capture each real AI use case separately instead of maintaining tool lists only.',
        'Assign and document a responsible role per use case.',
        'Deepen review and evidence for safety-adjacent or approval-relevant applications.',
        'Answer supplier requests on the same structure as the internal use-case pass.',
        'Treat AI literacy, policies, and register work as one evidence chain.',
      ],
      faq: [
        {
          q: 'Are automotive suppliers automatically in the high-risk category?',
          a: 'No. Many applications remain minimal or limited risk. The evidence pressure is still high because supply chain, quality, and safety require a clean case logic.',
        },
        {
          q: 'Why is a general AI policy not enough?',
          a: 'Because customers and auditors usually want to know which specific AI use case is affected, what it changes, and who is responsible. That requires case-based evidence.',
        },
        {
          q: 'When does a use-case pass become especially valuable in the supply chain?',
          a: 'As soon as questions arise about one concrete AI use case in procurement, due diligence, quality approval, or partner review.',
        },
        {
          q: 'Is this mainly a tool problem or a format problem?',
          a: 'Strategically it is mainly a format problem. The register is the operational home, but the real lever is a repeatable evidence format per use case.',
        },
      ],
      metaTitle: 'AI governance for automotive suppliers — AI Registry',
      metaDescription:
        'Automotive-first hub for AI use cases, supplier requests, and the use-case pass as an evidence format in the supply chain.',
      objectLabel: 'Industry Document',
      stanceLabel: 'Automotive Playbook',
      author: 'AI Registry',
      reviewedBy: 'AI Registry Editorial',
      effectiveDate: '2026-04-15',
      lastSubstantiveUpdate: '2026-04-15',
      sourceUrls: [
        'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
        'https://digital-strategy.ec.europa.eu/en/policies/ai-act-standardisation',
        'https://digital-strategy.ec.europa.eu/en/policies/ai-talent-skills-and-literacy',
      ],
      cta: {
        label: 'Start supplier request',
        href: SUPPLIER_REQUEST_DEEP_LINK_EN,
        description:
          'This button opens the supplier-request function in the register instead of sending people into an email thread.',
      },
      relatedLinks: [
        {
          label: 'The use-case pass as an evidence standard',
          href: '/de/standards/use-case-pass',
          description: 'Foundational document for case-based evidence logic.',
        },
        {
          label: 'OEM supplier request kit',
          href: '/de/artefacts/oem-supplier-request-kit',
          description: 'Procurement-facing artefact for structured requests across the supply chain.',
        },
      ],
    },
  },
  {
    slug: 'healthcare',
    deSlug: 'gesundheit',
    icon: '🏥',
    de: {
      name: 'Gesundheit & Life Sciences',
      tagline: 'EU AI Act-Pflichten für KI im Gesundheitswesen',
      heroDescription:
        'KI-Systeme in Kliniken, Laboren und Praxen fallen überwiegend unter Hochrisiko. Jede Organisation mit KI-Einsatz braucht ein Register – kostenlos, sofort einsatzbereit.',
      euActRiskLevel: 'Hochrisiko',
      euActRiskDetail: 'Anhang III, Kategorie 5(a) – KI in wesentlichen privaten Diensten inkl. Gesundheitsversorgung',
      whyAffected: [
        'KI-gestützte Diagnostik (Radiologie, Pathologie) trifft direkte Entscheidungen über Patientenbehandlung.',
        'Patientenrisiko-Scores und Frühwarnsysteme beeinflussen klinische Prozesse.',
        'Automatisierte Medikamentenempfehlungen fallen unter Hochrisiko nach EU AI Act Anhang III.',
        'Gesundheitsdaten sind besondere Kategorien nach DSGVO Art. 9 – kombiniert mit KI entsteht erhöhte Rechenschaftspflicht.',
      ],
      typicalUseCases: [
        { name: 'KI-gestützte Bilddiagnose (Röntgen, MRT, CT)', risk: 'high' },
        { name: 'Patientenverschlechterungsvorhersage / Frühwarnsystem', risk: 'high' },
        { name: 'Klinisches Entscheidungsunterstützungssystem', risk: 'high' },
        { name: 'Automatische Kodierung von Diagnosen (ICD)', risk: 'limited' },
        { name: 'Terminplanung und Kapazitätsoptimierung', risk: 'minimal' },
        { name: 'Chatbot für Patientenanfragen', risk: 'limited' },
        { name: 'Medikamenteninteraktionsprüfer', risk: 'high' },
      ],
      obligations: [
        'Risikobewertung für jedes Hochrisiko-System dokumentieren',
        'Menschliche Aufsicht (Human-in-the-loop) für klinische Entscheidungen definieren',
        'Datenkategorien klassifizieren: HEALTH_DATA / SPECIAL_PERSONAL',
        'Prüfzyklus festlegen – mindestens jährlich, empfohlen vierteljährlich',
        'Verantwortliche Person pro KI-System benennen',
      ],
      faq: [
        {
          q: 'Gilt der EU AI Act für kleine Arztpraxen?',
          a: 'Ja. Sobald ein KI-System professionell eingesetzt wird, gilt die Betreiberpflicht (Art. 26 EU AI Act). Für kleine Praxen ist der Dokumentationsaufwand überschaubar – das KI Register macht genau das einfach und kostenlos.',
        },
        {
          q: 'Was passiert, wenn wir kein Register führen?',
          a: 'Bei Hochrisiko-Systemen drohen ab August 2026 Bußgelder bis 3 % des weltweiten Jahresumsatzes. Bereits jetzt empfehlen Aufsichtsbehörden proaktive Dokumentation.',
        },
        {
          q: 'Müssen wir alle KI-Tools registrieren oder nur die kritischen?',
          a: 'Grundsätzlich sollte jeder KI-Einsatz erfasst werden. Hochrisiko-Systeme haben gesetzliche Pflichten – aber auch minimale und begrenzte Risiken müssen für interne Governance dokumentiert sein.',
        },
        {
          q: 'Kostet das KI Register etwas?',
          a: 'Nein. Die gesamte Dokumentation – unbegrenzte Einsatzfälle, Risikobewertung, Aufsichtsmodelle – ist dauerhaft kostenlos.',
        },
      ],
      metaTitle: 'EU AI Act Compliance im Gesundheitswesen – KI Register',
      metaDescription:
        'KI im Gesundheitswesen dokumentieren, Risiken bewerten, Compliance nachweisen. Kostenlos, sofort einsatzbereit. EU AI Act Anhang III – Hochrisiko.',
    },
    en: {
      name: 'Healthcare & Life Sciences',
      tagline: 'EU AI Act obligations for AI in healthcare',
      heroDescription:
        'AI systems in hospitals, laboratories, and clinics are predominantly high-risk under the EU AI Act. Every organisation using AI needs a register — free, ready to use immediately.',
      euActRiskLevel: 'High-Risk',
      euActRiskDetail: 'Annex III, Category 5(a) — AI in essential private services including healthcare',
      whyAffected: [
        'AI-assisted diagnostics (radiology, pathology) directly influence patient treatment decisions.',
        'Patient deterioration prediction and early warning systems affect clinical workflows.',
        'Automated medication recommendations fall under high-risk per EU AI Act Annex III.',
        'Health data is a special category under GDPR Art. 9 — combined with AI, accountability obligations increase significantly.',
      ],
      typicalUseCases: [
        { name: 'AI-assisted image diagnostics (X-ray, MRI, CT)', risk: 'high' },
        { name: 'Patient deterioration prediction / early warning system', risk: 'high' },
        { name: 'Clinical decision support system', risk: 'high' },
        { name: 'Automated diagnosis coding (ICD)', risk: 'limited' },
        { name: 'Appointment scheduling and capacity optimisation', risk: 'minimal' },
        { name: 'Patient enquiry chatbot', risk: 'limited' },
        { name: 'Drug interaction checker', risk: 'high' },
      ],
      obligations: [
        'Document risk assessment for every high-risk system',
        'Define human-in-the-loop oversight for clinical decisions',
        'Classify data categories: HEALTH_DATA / SPECIAL_PERSONAL',
        'Set review cycle — minimum annual, recommended quarterly',
        'Designate a responsible person per AI system',
      ],
      faq: [
        {
          q: 'Does the EU AI Act apply to small medical practices?',
          a: 'Yes. As soon as an AI system is used professionally, deployer obligations apply (Art. 26 EU AI Act). For small practices the documentation effort is manageable — AI Registry makes it simple and free.',
        },
        {
          q: 'What happens if we do not maintain a register?',
          a: 'For high-risk systems, fines of up to 3% of global annual turnover apply from August 2026. Supervisory authorities already recommend proactive documentation.',
        },
        {
          q: 'Do we need to register all AI tools or only the critical ones?',
          a: 'In principle, every AI use should be documented. High-risk systems have statutory obligations — but minimal and limited risk uses must also be documented for internal governance.',
        },
        {
          q: 'Is AI Registry free?',
          a: 'Yes. The entire documentation layer — unlimited use cases, risk assessment, oversight models — is permanently free.',
        },
      ],
      metaTitle: 'EU AI Act Compliance in Healthcare — AI Registry',
      metaDescription:
        'Document AI in healthcare, assess risk, prove compliance. Free, immediately ready. EU AI Act Annex III — High-Risk.',
    },
  },
  {
    slug: 'hr-recruitment',
    deSlug: 'personal-recruiting',
    icon: '👥',
    de: {
      name: 'Personal & Recruiting',
      tagline: 'EU AI Act-Pflichten für KI in HR und Personalwesen',
      heroDescription:
        'KI in Bewerbungsprozessen und Personalentscheidungen ist Hochrisiko. Der EU AI Act verlangt Dokumentation, Transparenz und menschliche Aufsicht – kostenlos mit dem KI Register.',
      euActRiskLevel: 'Hochrisiko',
      euActRiskDetail: 'Anhang III, Kategorie 4 – KI in der Beschäftigung und im Personalmanagement',
      whyAffected: [
        'Lebenslauf-Screening und Kandidatenranking durch KI beeinflusst direkt Einstellungsentscheidungen.',
        'Bewerber haben nach DSGVO Art. 22 das Recht, nicht ausschließlich automatisierten Entscheidungen unterworfen zu sein.',
        'KI-gestützte Leistungsbewertung und Beförderungsentscheidungen fallen unter Anhang III Kategorie 4.',
        'In DACH-Ländern bestehen zusätzliche Mitbestimmungsrechte (Betriebsrat/Personalvertretung) bei KI-Einführung.',
      ],
      typicalUseCases: [
        { name: 'Lebenslauf-Screening und Kandidatenvorauswahl', risk: 'high' },
        { name: 'Videoanalyse im Bewerbungsgespräch', risk: 'high' },
        { name: 'Leistungsbewertungs-KI', risk: 'high' },
        { name: 'Chatbot für Bewerberkommunikation', risk: 'limited' },
        { name: 'Workforce Planning und Personalbedarf', risk: 'limited' },
        { name: 'Mitarbeitermonitoring (Produktivität)', risk: 'high' },
        { name: 'Onboarding-Automatisierung', risk: 'minimal' },
      ],
      obligations: [
        'Dokumentation ob KI ASSISTANCE, VORBEREITUNG oder AUTOMATISIERT entscheidet',
        'Menschliche Prüfung für alle Einstellungs- und Kündigungsentscheidungen nachweisen',
        'Datenkategorien: PERSONAL_DATA mindestens, SPECIAL_PERSONAL wenn Bilder/Stimme/abgeleitete Merkmale',
        'Betroffene über KI-Einsatz im Recruiting informieren (Transparenzpflicht)',
        'Betriebsrat/Personalvertretung über KI-Einführung informieren (DACH)',
      ],
      faq: [
        {
          q: 'Dürfen wir KI im Bewerbungsprozess überhaupt einsetzen?',
          a: 'Ja, aber mit klarer Dokumentation und menschlicher Letztentscheidung. Rein automatisierte Entscheidungen über Einstellungen sind nach DSGVO Art. 22 ohne explizite Einwilligung unzulässig.',
        },
        {
          q: 'Was muss in der Dokumentation stehen?',
          a: 'Zweck des Systems, welche Daten verarbeitet werden, wer entscheidet (Mensch oder KI), wie Betroffene informiert werden, und wer in der Organisation verantwortlich ist.',
        },
        {
          q: 'Gilt das auch für externe HR-Software wie Workday oder SAP SuccessFactors?',
          a: 'Ja. Als Betreiber sind Sie für den Einsatz dieser Tools in Ihrer Organisation verantwortlich – unabhängig davon, wer sie entwickelt hat.',
        },
        {
          q: 'Ist das KI Register kostenlos?',
          a: 'Ja. Alle Dokumentationsfunktionen sind dauerhaft kostenlos – ohne Limit für Einsatzfälle oder Mitarbeitende.',
        },
      ],
      metaTitle: 'EU AI Act für HR & Recruiting – KI Register kostenlos',
      metaDescription:
        'KI im Personalwesen dokumentieren und Compliance nachweisen. Hochrisiko nach Anhang III. Kostenlos und sofort einsatzbereit.',
    },
    en: {
      name: 'HR & Recruitment',
      tagline: 'EU AI Act obligations for AI in HR and employment',
      heroDescription:
        'AI in recruitment and employment decisions is high-risk. The EU AI Act requires documentation, transparency and human oversight — free with AI Registry.',
      euActRiskLevel: 'High-Risk',
      euActRiskDetail: 'Annex III, Category 4 — AI in employment and workers management',
      whyAffected: [
        'CV screening and candidate ranking by AI directly influences hiring decisions.',
        'Applicants have the right not to be subject to solely automated decisions under GDPR Art. 22.',
        'AI-assisted performance evaluation and promotion decisions fall under Annex III Category 4.',
        'In DACH countries, additional co-determination rights (works council) apply when introducing AI.',
      ],
      typicalUseCases: [
        { name: 'CV screening and candidate shortlisting', risk: 'high' },
        { name: 'Video interview analysis AI', risk: 'high' },
        { name: 'Performance evaluation AI', risk: 'high' },
        { name: 'Applicant communication chatbot', risk: 'limited' },
        { name: 'Workforce planning and staffing needs', risk: 'limited' },
        { name: 'Employee monitoring (productivity)', risk: 'high' },
        { name: 'Onboarding automation', risk: 'minimal' },
      ],
      obligations: [
        'Document whether AI provides ASSISTANCE, PREPARATION or makes AUTOMATED decisions',
        'Demonstrate human review for all hiring and termination decisions',
        'Data categories: PERSONAL_DATA minimum; SPECIAL_PERSONAL if images, voice or inferred characteristics',
        'Inform applicants about AI use in recruitment (transparency obligation)',
        'Notify works council / staff representatives about AI introduction (DACH)',
      ],
      faq: [
        {
          q: 'Are we allowed to use AI in recruitment at all?',
          a: 'Yes, but with clear documentation and human final decision-making. Fully automated decisions on hiring are not permitted under GDPR Art. 22 without explicit consent.',
        },
        {
          q: 'What must the documentation contain?',
          a: 'Purpose of the system, which data is processed, who decides (human or AI), how affected persons are informed, and who is responsible in the organisation.',
        },
        {
          q: 'Does this apply to external HR software like Workday or SAP SuccessFactors?',
          a: 'Yes. As a deployer you are responsible for using these tools in your organisation — regardless of who developed them.',
        },
        {
          q: 'Is AI Registry free?',
          a: 'Yes. All documentation features are permanently free — no limit on use cases or employees.',
        },
      ],
      metaTitle: 'EU AI Act for HR & Recruitment — AI Registry free',
      metaDescription:
        'Document AI in HR and prove compliance. High-risk under Annex III. Free and immediately ready to use.',
    },
  },
  {
    slug: 'finance',
    deSlug: 'finanzwesen',
    icon: '🏦',
    de: {
      name: 'Finanzwesen & Banking',
      tagline: 'EU AI Act-Pflichten für KI in Banken und Versicherungen',
      heroDescription:
        'Kreditscoring, Betrugserkennung und AML-Systeme fallen unter Hochrisiko. Transparenzpflichten gelten für Chatbots und Beratungs-KI. Dokumentation ist jetzt Pflicht.',
      euActRiskLevel: 'Hochrisiko / Begrenztes Risiko',
      euActRiskDetail: 'Anhang III, Kategorie 5(b) – KI in wesentlichen Privatdienstleistungen: Kreditvergabe',
      whyAffected: [
        'Kredit-Scoring-Systeme entscheiden über finanzielle Teilhabe und fallen unter Hochrisiko.',
        'Betroffene haben nach DSGVO Art. 22 das Recht auf menschliche Überprüfung automatisierter Kreditentscheidungen.',
        'Chatbots und Robo-Advisor unterliegen Transparenzpflichten (Begrenztes Risiko).',
        'DORA (Digital Operational Resilience Act) erfasst KI-Systeme in der IKT-Risikoverwaltung.',
      ],
      typicalUseCases: [
        { name: 'Kredit-Scoring und Kreditentscheidungs-KI', risk: 'high' },
        { name: 'Betrugserkennung (Transaktionsanalyse)', risk: 'high' },
        { name: 'Geldwäschebekämpfung (AML)', risk: 'high' },
        { name: 'Robo-Advisor / Anlageempfehlungen', risk: 'limited' },
        { name: 'Kundendienst-Chatbot', risk: 'limited' },
        { name: 'KYC-Identitätsprüfung', risk: 'high' },
        { name: 'Algorithmus-gestützter Handel', risk: 'limited' },
      ],
      obligations: [
        'Kredit-KI: Risikobewertung und Transparenzdokumentation',
        'Betroffene über automatisierte Entscheidungen informieren (DSGVO Art. 22)',
        'Chatbots als KI kennzeichnen (Transparenzpflicht)',
        'Datenkategorien: FINANCIAL_DATA, PERSONAL_DATA',
        'Human-in-the-loop für Kreditentscheidungen dokumentieren',
      ],
      faq: [
        {
          q: 'Gilt das nur für eigens entwickelte KI oder auch für eingekaufte Lösungen?',
          a: 'Auch für eingekaufte Systeme. Als Betreiber (Deployer) tragen Sie die Verantwortung für den Einsatz in Ihrer Organisation.',
        },
        {
          q: 'Wann gilt Kredit-KI als Hochrisiko?',
          a: 'Wenn die KI die Kreditwürdigkeit bewertet oder über die Vergabe entscheidet – unabhängig ob Retail, SME oder Corporate Lending.',
        },
        {
          q: 'Müssen Kunden informiert werden, dass KI im Einsatz ist?',
          a: 'Ja. Bei automatisierten Kreditentscheidungen und bei Chatbots besteht Informationspflicht gegenüber Betroffenen.',
        },
        {
          q: 'Kostet das KI Register etwas?',
          a: 'Nein. Alle Dokumentationsfunktionen sind dauerhaft kostenlos – unbegrenzte Einsatzfälle, keine versteckten Gebühren.',
        },
      ],
      metaTitle: 'EU AI Act Compliance für Banken & Finanzdienstleister – KI Register',
      metaDescription:
        'KI im Finanzwesen dokumentieren: Kredit-Scoring, Betrugserkennung, AML. Hochrisiko nach Anhang III. Kostenlos registrieren.',
    },
    en: {
      name: 'Finance & Banking',
      tagline: 'EU AI Act obligations for AI in banks and insurers',
      heroDescription:
        'Credit scoring, fraud detection and AML systems are high-risk. Transparency obligations apply to chatbots and advisory AI. Documentation is now mandatory.',
      euActRiskLevel: 'High-Risk / Limited Risk',
      euActRiskDetail: 'Annex III, Category 5(b) — AI in essential private services: credit lending',
      whyAffected: [
        'Credit scoring systems decide on financial participation and fall under high-risk.',
        'Individuals have the right to human review of automated credit decisions under GDPR Art. 22.',
        'Chatbots and robo-advisors are subject to transparency obligations (Limited Risk).',
        'DORA (Digital Operational Resilience Act) covers AI systems in ICT risk management.',
      ],
      typicalUseCases: [
        { name: 'Credit scoring and lending decision AI', risk: 'high' },
        { name: 'Fraud detection (transaction analysis)', risk: 'high' },
        { name: 'Anti-money laundering (AML)', risk: 'high' },
        { name: 'Robo-advisor / investment recommendations', risk: 'limited' },
        { name: 'Customer service chatbot', risk: 'limited' },
        { name: 'KYC identity verification', risk: 'high' },
        { name: 'Algorithmic trading signals', risk: 'limited' },
      ],
      obligations: [
        'Credit AI: risk assessment and transparency documentation',
        'Inform individuals about automated decisions (GDPR Art. 22)',
        'Label chatbots as AI (transparency obligation)',
        'Data categories: FINANCIAL_DATA, PERSONAL_DATA',
        'Document human-in-the-loop for credit decisions',
      ],
      faq: [
        {
          q: 'Does this apply to bought-in AI solutions or only self-developed ones?',
          a: 'Also to bought-in systems. As a deployer you bear responsibility for using them in your organisation.',
        },
        {
          q: 'When is credit AI considered high-risk?',
          a: 'When the AI assesses creditworthiness or decides on lending — regardless of whether retail, SME or corporate.',
        },
        {
          q: 'Must customers be informed that AI is in use?',
          a: 'Yes. For automated credit decisions and chatbots there is an obligation to inform affected persons.',
        },
        {
          q: 'Is AI Registry free?',
          a: 'Yes. All documentation features are permanently free — unlimited use cases, no hidden fees.',
        },
      ],
      metaTitle: 'EU AI Act Compliance for Banks & Finance — AI Registry',
      metaDescription:
        'Document AI in finance: credit scoring, fraud detection, AML. High-risk under Annex III. Register for free.',
    },
  },
  {
    slug: 'education',
    deSlug: 'bildung',
    icon: '🎓',
    de: {
      name: 'Bildung & Ausbildung',
      tagline: 'EU AI Act-Pflichten für KI in Schulen und Hochschulen',
      heroDescription:
        'KI zur Bewertung von Lernenden oder zur Steuerung von Bildungswegen gilt als Hochrisiko. Bildungseinrichtungen brauchen jetzt ein Register – kostenlos und sofort nutzbar.',
      euActRiskLevel: 'Hochrisiko',
      euActRiskDetail: 'Anhang III, Kategorie 3 – KI in Bildung und Berufsausbildung',
      whyAffected: [
        'Automatisierte Bewertung von Prüfungen und Lernleistungen fällt unter Hochrisiko.',
        'KI-gestützte Zulassungsentscheidungen für Bildungseinrichtungen unterliegen strengen Anforderungen.',
        'Personalisierte Lernpfade die Bildungskarrieren beeinflussen sind dokumentationspflichtig.',
        'Schülerdaten betreffen häufig Minderjährige – besonderer Schutz nach DSGVO.',
      ],
      typicalUseCases: [
        { name: 'Automatisierte Aufsatzkorrektur und Benotung', risk: 'high' },
        { name: 'Studierendenleistungsvorhersage / Frühintervention', risk: 'high' },
        { name: 'KI-gestützte Zulassung und Bewerbungsranking', risk: 'high' },
        { name: 'Plagiatserkennung', risk: 'limited' },
        { name: 'Personalisiertes Lernpfadmanagement', risk: 'high' },
        { name: 'Anwesenheits- und Engagementmonitoring', risk: 'limited' },
        { name: 'Lernassistenz-Chatbot', risk: 'minimal' },
      ],
      obligations: [
        'Risikobewertung für alle Systeme die Noten oder Zulassungen beeinflussen',
        'Transparenz gegenüber Lernenden und ggf. Erziehungsberechtigten über KI-Einsatz',
        'Menschliche Überprüfung für prüfungsrelevante KI-Entscheidungen',
        'Datenschutzfolgenabschätzung bei Verarbeitung von Minderjährigendaten',
        'Dokumentation der Aufsicht durch Lehrende',
      ],
      faq: [
        {
          q: 'Gilt das auch für Hochschulen und private Bildungsanbieter?',
          a: 'Ja. Anhang III Kategorie 3 gilt für alle Bildungseinrichtungen unabhängig von Trägerschaft oder Rechtsform.',
        },
        {
          q: 'Wie ist es mit KI-Tools die Lehrende selbst nutzen (z.B. ChatGPT zur Unterrichtsvorbereitung)?',
          a: 'KI die rein intern von Lehrenden genutzt wird und keine Lernenden-Entscheidungen trifft, ist typischerweise minimales Risiko – aber trotzdem dokumentationswürdig.',
        },
        {
          q: 'Muss ich Schüler informieren wenn KI bewertet?',
          a: 'Ja. Transparenzpflicht gegenüber Betroffenen ist grundlegend – bei Minderjährigen auch gegenüber Erziehungsberechtigten.',
        },
        {
          q: 'Ist das KI Register kostenlos?',
          a: 'Ja. Die gesamte Dokumentation ist dauerhaft kostenlos. Keine Kreditkarte erforderlich.',
        },
      ],
      metaTitle: 'EU AI Act für Bildungseinrichtungen – KI Register kostenlos',
      metaDescription:
        'KI in Schulen und Hochschulen dokumentieren. Hochrisiko nach Anhang III Kategorie 3. Kostenlos und DSGVO-konform.',
    },
    en: {
      name: 'Education & Training',
      tagline: 'EU AI Act obligations for AI in schools and universities',
      heroDescription:
        'AI that assesses learners or steers educational pathways is high-risk. Educational institutions need a register now — free and immediately usable.',
      euActRiskLevel: 'High-Risk',
      euActRiskDetail: 'Annex III, Category 3 — AI in education and vocational training',
      whyAffected: [
        'Automated assessment of exams and learning performance falls under high-risk.',
        'AI-assisted admission decisions for educational institutions are subject to strict requirements.',
        'Personalised learning paths that influence educational careers require documentation.',
        'Student data often concerns minors — special protection under GDPR.',
      ],
      typicalUseCases: [
        { name: 'Automated essay grading and assessment', risk: 'high' },
        { name: 'Student performance prediction / early intervention', risk: 'high' },
        { name: 'AI-assisted admissions and application ranking', risk: 'high' },
        { name: 'Plagiarism detection', risk: 'limited' },
        { name: 'Personalised learning path management', risk: 'high' },
        { name: 'Attendance and engagement monitoring', risk: 'limited' },
        { name: 'Learning assistant chatbot', risk: 'minimal' },
      ],
      obligations: [
        'Risk assessment for all systems that influence grades or admissions',
        'Transparency towards learners (and guardians for minors) about AI use',
        'Human review for exam-relevant AI decisions',
        'Data protection impact assessment when processing data of minors',
        'Documentation of teacher oversight',
      ],
      faq: [
        {
          q: 'Does this apply to universities and private education providers?',
          a: 'Yes. Annex III Category 3 applies to all educational institutions regardless of ownership or legal form.',
        },
        {
          q: 'What about AI tools teachers use themselves (e.g. ChatGPT for lesson preparation)?',
          a: 'AI used purely internally by teachers that makes no learner decisions is typically minimal risk — but still worth documenting.',
        },
        {
          q: 'Do I need to tell students when AI is grading?',
          a: 'Yes. Transparency obligations towards those affected are fundamental — for minors also towards guardians.',
        },
        {
          q: 'Is AI Registry free?',
          a: 'Yes. All documentation is permanently free. No credit card required.',
        },
      ],
      metaTitle: 'EU AI Act for Educational Institutions — AI Registry free',
      metaDescription:
        'Document AI in schools and universities. High-risk under Annex III Category 3. Free and GDPR-compliant.',
    },
  },
  {
    slug: 'public-sector',
    deSlug: 'oeffentlicher-sektor',
    icon: '🏛️',
    de: {
      name: 'Öffentlicher Sektor',
      tagline: 'EU AI Act-Pflichten für Behörden und öffentliche Einrichtungen',
      heroDescription:
        'Behörden unterliegen den strengsten Anforderungen des EU AI Act. Einige KI-Systeme sind verboten, andere Hochrisiko. Dokumentation ist gesetzliche Pflicht.',
      euActRiskLevel: 'Hochrisiko / Verboten',
      euActRiskDetail: 'Anhang III, Kategorien 6, 7, 8 – Strafverfolgung, Migration, Justiz; Verbot: Social Scoring',
      whyAffected: [
        'Social Scoring durch öffentliche Stellen ist nach EU AI Act ausdrücklich verboten.',
        'KI in Strafverfolgung, Grenzschutz und Sozialleistungen gilt als Hochrisiko.',
        'Grundrechte-Folgenabschätzung (FRIA) ist für Hochrisiko im öffentlichen Sektor verpflichtend.',
        'Bürger müssen informiert werden, wenn KI Entscheidungen über sie trifft.',
      ],
      typicalUseCases: [
        { name: 'Sachbearbeitungs-KI für Sozialleistungen', risk: 'high' },
        { name: 'Risikoanalyse in der Strafverfolgung', risk: 'high' },
        { name: 'Dokumentenprüfung (Visum, Asyl)', risk: 'high' },
        { name: 'Verkehrssteuerung und Smart-City-KI', risk: 'limited' },
        { name: 'Bürgerservice-Chatbot', risk: 'limited' },
        { name: 'Beschaffungsauswertungs-KI', risk: 'high' },
        { name: 'Predictive Policing', risk: 'prohibited' },
      ],
      obligations: [
        'Grundrechte-Folgenabschätzung (FRIA) vor Inbetriebnahme von Hochrisiko-Systemen',
        'Transparenz: Bürger müssen über KI-Einsatz in ihre betreffenden Entscheidungen informiert werden',
        'Verbotene Systeme identifizieren und außer Betrieb nehmen',
        'Demokratische Rechenschaftspflicht und Aufsicht dokumentieren',
        'Menschliche Letztentscheidung für alle bürgerrelevanten Entscheidungen',
      ],
      faq: [
        {
          q: 'Welche KI-Systeme sind im öffentlichen Sektor verboten?',
          a: 'Social Scoring durch öffentliche Stellen, Predictive Policing (Risikoeinschätzung von Personen), biometrische Massenüberwachung im öffentlichen Raum (mit engen Ausnahmen).',
        },
        {
          q: 'Was ist eine Grundrechte-Folgenabschätzung (FRIA)?',
          a: 'Eine strukturierte Analyse der Auswirkungen eines KI-Systems auf Grundrechte der Betroffenen – verpflichtend für Hochrisiko-KI im öffentlichen Sektor vor der Inbetriebnahme.',
        },
        {
          q: 'Gilt das auch für kommunale Verwaltungen und kleinere Behörden?',
          a: 'Ja. Größe und Rechtsform sind irrelevant – sobald ein KI-System professionell eingesetzt wird, gelten die Betreiberpflichten.',
        },
        {
          q: 'Ist das KI Register kostenlos?',
          a: 'Ja. Die gesamte Dokumentation ist dauerhaft kostenlos – auch für öffentliche Einrichtungen.',
        },
      ],
      metaTitle: 'EU AI Act für Behörden und öffentliche Verwaltung – KI Register',
      metaDescription:
        'KI in Behörden dokumentieren, FRIA durchführen, Compliance nachweisen. Öffentlicher Sektor – Hochrisiko und verbotene KI. Kostenlos.',
    },
    en: {
      name: 'Public Sector',
      tagline: 'EU AI Act obligations for authorities and public bodies',
      heroDescription:
        'Public bodies face the strictest EU AI Act requirements. Some AI systems are prohibited, others high-risk. Documentation is a statutory obligation.',
      euActRiskLevel: 'High-Risk / Prohibited',
      euActRiskDetail: 'Annex III, Categories 6, 7, 8 — law enforcement, migration, justice; Prohibition: social scoring',
      whyAffected: [
        'Social scoring by public authorities is expressly prohibited under the EU AI Act.',
        'AI in law enforcement, border control and social benefits is high-risk.',
        'Fundamental Rights Impact Assessment (FRIA) is mandatory for high-risk AI in the public sector.',
        'Citizens must be informed when AI makes decisions affecting them.',
      ],
      typicalUseCases: [
        { name: 'Benefits eligibility determination AI', risk: 'high' },
        { name: 'Risk assessment in law enforcement', risk: 'high' },
        { name: 'Document review (visa, asylum)', risk: 'high' },
        { name: 'Traffic management and smart city AI', risk: 'limited' },
        { name: 'Citizen service chatbot', risk: 'limited' },
        { name: 'Public procurement evaluation AI', risk: 'high' },
        { name: 'Predictive policing', risk: 'prohibited' },
      ],
      obligations: [
        'Fundamental Rights Impact Assessment (FRIA) before deploying high-risk systems',
        'Transparency: citizens must be informed about AI use in decisions affecting them',
        'Identify and decommission prohibited systems',
        'Document democratic accountability and oversight',
        'Human final decision for all citizen-affecting decisions',
      ],
      faq: [
        {
          q: 'Which AI systems are prohibited in the public sector?',
          a: 'Social scoring by public bodies, predictive policing (risk assessment of individuals), mass biometric surveillance in public spaces (with narrow exceptions).',
        },
        {
          q: 'What is a Fundamental Rights Impact Assessment (FRIA)?',
          a: 'A structured analysis of the impact of an AI system on the fundamental rights of those affected — mandatory for high-risk AI in the public sector before deployment.',
        },
        {
          q: 'Does this apply to municipal administrations and smaller authorities?',
          a: 'Yes. Size and legal form are irrelevant — as soon as an AI system is used professionally, deployer obligations apply.',
        },
        {
          q: 'Is AI Registry free?',
          a: 'Yes. All documentation is permanently free — including for public institutions.',
        },
      ],
      metaTitle: 'EU AI Act for Public Authorities — AI Registry',
      metaDescription:
        'Document AI in public sector, conduct FRIA, prove compliance. High-risk and prohibited AI. Free.',
    },
  },
  {
    slug: 'legal',
    deSlug: 'recht-beratung',
    icon: '⚖️',
    de: {
      name: 'Recht & Beratung',
      tagline: 'EU AI Act-Pflichten für Kanzleien und Beratungsunternehmen',
      heroDescription:
        'Kanzleien und Beratungsunternehmen nutzen KI für Vertragsanalyse, Recherche und Mandantenkommunikation. Auch wenn das Risiko meist gering ist – Dokumentation ist Best Practice und zunehmend Mandantenpflicht.',
      euActRiskLevel: 'Begrenztes Risiko / Minimales Risiko',
      euActRiskDetail: 'Anhang III, Kategorie 8 – Hochrisiko nur bei KI in der Rechtspflege und demokratischen Prozessen',
      whyAffected: [
        'Mandantenkommunikations-Chatbots müssen als KI gekennzeichnet werden (Transparenzpflicht).',
        'KI zur Unterstützung von Richtern oder Gerichten bei Entscheidungen gilt als Hochrisiko.',
        'Mandanten fragen zunehmend nach KI-Governance-Nachweisen ihrer Dienstleister.',
        'Anwaltliche Sorgfaltspflicht umfasst Prüfung der eingesetzten KI-Systeme.',
      ],
      typicalUseCases: [
        { name: 'Vertragsanalyse und -prüfung durch KI', risk: 'minimal' },
        { name: 'Rechtliche Recherche-Assistenten', risk: 'minimal' },
        { name: 'Dokumentenautomatisierung', risk: 'minimal' },
        { name: 'Mandantenkommunikations-Chatbot', risk: 'limited' },
        { name: 'Compliance-Monitoring-Tool', risk: 'minimal' },
        { name: 'KI-Unterstützung für Richter/Gerichte', risk: 'high' },
        { name: 'Abrechnungs- und Matter-Management-KI', risk: 'minimal' },
      ],
      obligations: [
        'Chatbots als KI kennzeichnen (Transparenzpflicht für begrenzte Risiken)',
        'Datenkategorien dokumentieren – Mandantendaten können PERSONAL_DATA oder SPECIAL_PERSONAL sein',
        'Anwaltliche Verschwiegenheit und KI-Einsatz in Einklang bringen',
        'Für Hochrisiko (Justiz): vollständige Risikobewertung und menschliche Aufsicht',
      ],
      faq: [
        {
          q: 'Müssen wir ChatGPT in der Kanzlei dokumentieren?',
          a: 'Ja. Als Betreiber sind Sie verantwortlich für den Einsatz. Typischerweise minimales Risiko, aber Dokumentation schafft Transparenz gegenüber Mandanten und erfüllt anwaltliche Sorgfaltspflichten.',
        },
        {
          q: 'Wie verhalte ich mich bei Mandantendaten in KI-Systemen?',
          a: 'Dokumentieren Sie welche Datenkategorien verarbeitet werden und ob eine Auftragsverarbeitung mit dem KI-Anbieter besteht. Das Register hilft dabei strukturiert.',
        },
        {
          q: 'Fragen Mandanten bereits nach KI-Governance?',
          a: 'Zunehmend – besonders Mandanten aus regulierten Industrien (Finanzwesen, Healthcare) haben eigene Compliance-Anforderungen an ihre Dienstleister.',
        },
        {
          q: 'Kostet das KI Register etwas?',
          a: 'Nein. Alle Dokumentationsfunktionen sind dauerhaft kostenlos.',
        },
      ],
      metaTitle: 'EU AI Act für Kanzleien und Beratungsunternehmen – KI Register',
      metaDescription:
        'KI in Kanzleien und Beratung dokumentieren. Transparenzpflichten, Sorgfaltspflichten, Mandantenvertrauen. Kostenlos.',
    },
    en: {
      name: 'Legal & Consulting',
      tagline: 'EU AI Act obligations for law firms and consultancies',
      heroDescription:
        'Law firms and consultancies use AI for contract analysis, research and client communication. Even where risk is low — documentation is best practice and increasingly a client requirement.',
      euActRiskLevel: 'Limited Risk / Minimal Risk',
      euActRiskDetail: 'Annex III, Category 8 — High-risk only for AI in administration of justice and democratic processes',
      whyAffected: [
        'Client communication chatbots must be labelled as AI (transparency obligation).',
        'AI assisting judges or courts in decisions is high-risk.',
        'Clients increasingly request AI governance evidence from their service providers.',
        'Professional duty of care includes reviewing AI systems in use.',
      ],
      typicalUseCases: [
        { name: 'Contract analysis and review AI', risk: 'minimal' },
        { name: 'Legal research assistants', risk: 'minimal' },
        { name: 'Document automation', risk: 'minimal' },
        { name: 'Client communication chatbot', risk: 'limited' },
        { name: 'Compliance monitoring tool', risk: 'minimal' },
        { name: 'AI assistance for judges / courts', risk: 'high' },
        { name: 'Billing and matter management AI', risk: 'minimal' },
      ],
      obligations: [
        'Label chatbots as AI (transparency obligation for limited risk)',
        'Document data categories — client data may be PERSONAL_DATA or SPECIAL_PERSONAL',
        'Align professional confidentiality with AI use',
        'For high-risk (justice): full risk assessment and human oversight',
      ],
      faq: [
        {
          q: 'Do we need to document ChatGPT use in the firm?',
          a: 'Yes. As a deployer you are responsible for its use. Typically minimal risk, but documentation creates transparency towards clients and fulfils professional duty of care.',
        },
        {
          q: 'What about client data in AI systems?',
          a: 'Document which data categories are processed and whether a data processing agreement exists with the AI provider. The register helps you structure this.',
        },
        {
          q: 'Are clients already asking about AI governance?',
          a: 'Increasingly — especially clients from regulated industries (finance, healthcare) have their own compliance requirements for their service providers.',
        },
        {
          q: 'Is AI Registry free?',
          a: 'Yes. All documentation features are permanently free.',
        },
      ],
      metaTitle: 'EU AI Act for Law Firms and Consultancies — AI Registry',
      metaDescription:
        'Document AI in legal and consulting. Transparency obligations, duty of care, client trust. Free.',
    },
  },
  {
    slug: 'manufacturing',
    deSlug: 'produktion',
    icon: '🏭',
    de: {
      name: 'Produktion & Industrie',
      tagline: 'EU AI Act-Pflichten für KI in Fertigung und Industrie',
      heroDescription:
        'Produktions-KI ist meist minimales oder begrenztes Risiko – außer bei sicherheitskritischen Anwendungen. Trotzdem: Dokumentation ist jetzt Best Practice und bald Lieferkettenanforderung.',
      euActRiskLevel: 'Minimales / Begrenztes Risiko',
      euActRiskDetail: 'Anhang III, Kategorie 2 – Hochrisiko bei KI in kritischer Infrastruktur',
      whyAffected: [
        'KI in sicherheitskritischen Maschinenkomponenten (Maschinenrichtlinie) kann Hochrisiko auslösen.',
        'KI in Energieversorgung, Wasserversorgung oder Transportinfrastruktur gilt als Hochrisiko.',
        'Große Auftraggeber verlangen zunehmend KI-Governance-Nachweise in der Lieferkette.',
        'Verarbeitung von Mitarbeiterdaten (Arbeitssicherheits-KI) unterliegt Betreiberpflichten.',
      ],
      typicalUseCases: [
        { name: 'Predictive Maintenance (Anlagenausfallvorhersage)', risk: 'minimal' },
        { name: 'Qualitätskontrolle durch Computer Vision', risk: 'minimal' },
        { name: 'Lieferketten-Nachfrageprognose', risk: 'minimal' },
        { name: 'KI-Steuerung in kritischer Infrastruktur', risk: 'high' },
        { name: 'Arbeitssicherheits-Monitoring', risk: 'limited' },
        { name: 'Energieoptimierung', risk: 'minimal' },
        { name: 'Roboter-Prozesssteuerung (sicherheitskritisch)', risk: 'high' },
      ],
      obligations: [
        'Sicherheitskritische KI: vollständige Risikobewertung und Dokumentation',
        'Mitarbeiterdaten in Sicherheits-KI: Beteiligungsrechte beachten',
        'Lieferkette: KI-Governance für eigene Zulieferer prüfen und dokumentieren',
        'Minimale-Risiko-Systeme: Basisregistrierung für interne Governance',
      ],
      faq: [
        {
          q: 'Ist Predictive Maintenance nach EU AI Act reguliert?',
          a: 'Typischerweise minimales Risiko ohne strenge Regulierung. Trotzdem empfiehlt sich Dokumentation für interne Governance und Lieferketten-Anforderungen.',
        },
        {
          q: 'Wann wird Produktions-KI zu Hochrisiko?',
          a: 'Wenn die KI sicherheitsrelevante Komponenten in Maschinen steuert (Maschinenrichtlinie) oder kritische Infrastruktur wie Energienetze, Wasserversorgung oder Transport betreibt.',
        },
        {
          q: 'Müssen wir die KI-Governance unserer Zulieferer prüfen?',
          a: 'Zunehmend ja – besonders wenn Sie Auftraggeber regulierter Industrien sind. Das KI Register enthält eine Lieferkettenbewertungsfunktion.',
        },
        {
          q: 'Kostet das KI Register etwas?',
          a: 'Nein. Alle Dokumentationsfunktionen sind dauerhaft kostenlos.',
        },
      ],
      metaTitle: 'EU AI Act für Produktion und Industrie – KI Register kostenlos',
      metaDescription:
        'KI in der Fertigung dokumentieren: Predictive Maintenance, Qualitätskontrolle, kritische Infrastruktur. Kostenlos.',
    },
    en: {
      name: 'Manufacturing & Industry',
      tagline: 'EU AI Act obligations for AI in manufacturing',
      heroDescription:
        'Manufacturing AI is mostly minimal or limited risk — except in safety-critical applications. Still: documentation is now best practice and soon a supply chain requirement.',
      euActRiskLevel: 'Minimal / Limited Risk',
      euActRiskDetail: 'Annex III, Category 2 — High-risk for AI in critical infrastructure',
      whyAffected: [
        'AI in safety-critical machine components (Machinery Directive) can trigger high-risk classification.',
        'AI in energy, water supply or transport infrastructure is high-risk.',
        'Large clients increasingly require AI governance evidence in the supply chain.',
        'Processing employee data (workplace safety AI) is subject to deployer obligations.',
      ],
      typicalUseCases: [
        { name: 'Predictive maintenance (equipment failure prediction)', risk: 'minimal' },
        { name: 'Quality control via computer vision', risk: 'minimal' },
        { name: 'Supply chain demand forecasting', risk: 'minimal' },
        { name: 'AI control in critical infrastructure', risk: 'high' },
        { name: 'Workplace safety monitoring', risk: 'limited' },
        { name: 'Energy optimisation', risk: 'minimal' },
        { name: 'Robot process control (safety-critical)', risk: 'high' },
      ],
      obligations: [
        'Safety-critical AI: full risk assessment and documentation',
        'Employee data in safety AI: observe co-determination rights',
        'Supply chain: review and document AI governance for own suppliers',
        'Minimal-risk systems: basic registration for internal governance',
      ],
      faq: [
        {
          q: 'Is predictive maintenance regulated under the EU AI Act?',
          a: 'Typically minimal risk with no strict regulation. Documentation is still recommended for internal governance and supply chain requirements.',
        },
        {
          q: 'When does manufacturing AI become high-risk?',
          a: 'When AI controls safety-relevant components in machines (Machinery Directive) or operates critical infrastructure such as energy grids, water supply or transport.',
        },
        {
          q: 'Do we need to check our suppliers\' AI governance?',
          a: 'Increasingly yes — especially if you are a client of regulated industries. AI Registry includes a supply chain assessment feature.',
        },
        {
          q: 'Is AI Registry free?',
          a: 'Yes. All documentation features are permanently free.',
        },
      ],
      metaTitle: 'EU AI Act for Manufacturing & Industry — AI Registry free',
      metaDescription:
        'Document AI in manufacturing: predictive maintenance, quality control, critical infrastructure. Free.',
    },
  },
  {
    slug: 'social-nonprofit',
    deSlug: 'soziales',
    icon: '🤝',
    de: {
      name: 'Soziales & NGOs',
      tagline: 'EU AI Act-Pflichten für KI in sozialen Einrichtungen und NGOs',
      heroDescription:
        'Soziale Organisationen nutzen KI für Bedarfsermittlung, Fallmanagement und Kommunikation. Gerade hier ist Transparenz und Schutz vulnerabler Gruppen besonders wichtig.',
      euActRiskLevel: 'Hochrisiko / Begrenztes Risiko',
      euActRiskDetail: 'Anhang III, Kategorie 5 – Hochrisiko bei KI in wesentlichen Sozialleistungen',
      whyAffected: [
        'KI in der Vergabe oder Bewertung sozialer Hilfsleistungen gilt als Hochrisiko.',
        'Vulnerable Gruppen (Kinder, ältere Menschen, Menschen mit Behinderungen) genießen besonderen Schutz nach EU AI Act.',
        'DSGVO besondere Kategorien (Gesundheitsdaten, Sozialdaten) sind häufig betroffen.',
        'NGOs und gemeinnützige Träger sind als Betreiber genauso verantwortlich wie kommerzielle Organisationen.',
      ],
      typicalUseCases: [
        { name: 'KI-gestütztes Fallmanagement und Bedarfsermittlung', risk: 'high' },
        { name: 'Chatbot für Beratung und Erstinformation', risk: 'limited' },
        { name: 'Spendermanagement und Fundraising-KI', risk: 'minimal' },
        { name: 'Risikoscreening für vulnerable Personen', risk: 'high' },
        { name: 'Übersetzungs- und Sprachmittlungs-KI', risk: 'minimal' },
        { name: 'Automatisierte Berichterstattung für Fördermittelgeber', risk: 'minimal' },
        { name: 'Kindeswohlgefährdungseinschätzung durch KI', risk: 'high' },
      ],
      obligations: [
        'Besonderer Schutz vulnerabler Gruppen – Risikobewertung mit erhöhter Sorgfalt',
        'Transparenz gegenüber Betroffenen über KI-gestützte Einschätzungen',
        'Menschliche Letztentscheidung bei allen fallrelevanten Einschätzungen',
        'Datenschutzfolgenabschätzung bei Verarbeitung sensibler Sozialdaten',
        'Dokumentation der Aufsicht durch Fachkräfte',
      ],
      faq: [
        {
          q: 'Gilt der EU AI Act auch für gemeinnützige Organisationen?',
          a: 'Ja. Die Betreiberpflichten nach EU AI Act unterscheiden nicht nach Rechtsform oder Gewinnabsicht. Soziale Einrichtungen und NGOs sind vollständig erfasst.',
        },
        {
          q: 'Was bedeutet "vulnerable Gruppen" im Kontext des EU AI Act?',
          a: 'Personen, die aufgrund von Alter, Behinderung, sozialer Lage oder anderen Faktoren besonders von KI-Entscheidungen betroffen sein können. EU AI Act Art. 9 verlangt explizit erhöhte Sorgfalt.',
        },
        {
          q: 'Können wir KI-Tools wie ChatGPT für Beratungsgespräche nutzen?',
          a: 'Ja, aber: Betroffene müssen informiert werden, keine sensiblen Falldaten ohne Einwilligung eingeben, und das System muss im Register dokumentiert sein.',
        },
        {
          q: 'Ist das KI Register kostenlos?',
          a: 'Ja. Dauerhaft kostenlos – gerade für Organisationen mit begrenzten Mitteln haben wir die gesamte Dokumentation kostenfrei gemacht.',
        },
      ],
      metaTitle: 'EU AI Act für soziale Einrichtungen und NGOs – KI Register kostenlos',
      metaDescription:
        'KI in sozialen Organisationen dokumentieren. Schutz vulnerabler Gruppen, Transparenzpflichten, DSGVO. Dauerhaft kostenlos.',
    },
    en: {
      name: 'Social Sector & NGOs',
      tagline: 'EU AI Act obligations for AI in social organisations and NGOs',
      heroDescription:
        'Social organisations use AI for needs assessment, case management and communication. Transparency and protection of vulnerable groups are especially important here.',
      euActRiskLevel: 'High-Risk / Limited Risk',
      euActRiskDetail: 'Annex III, Category 5 — High-risk for AI in essential social services',
      whyAffected: [
        'AI in the allocation or assessment of social benefits is high-risk.',
        'Vulnerable groups (children, elderly, people with disabilities) receive special protection under the EU AI Act.',
        'GDPR special categories (health data, social data) are frequently involved.',
        'NGOs and non-profit organisations are equally responsible as deployers as commercial organisations.',
      ],
      typicalUseCases: [
        { name: 'AI-assisted case management and needs assessment', risk: 'high' },
        { name: 'Chatbot for counselling and initial information', risk: 'limited' },
        { name: 'Donor management and fundraising AI', risk: 'minimal' },
        { name: 'Risk screening for vulnerable individuals', risk: 'high' },
        { name: 'Translation and interpretation AI', risk: 'minimal' },
        { name: 'Automated reporting for funders', risk: 'minimal' },
        { name: 'Child welfare risk assessment AI', risk: 'high' },
      ],
      obligations: [
        'Special protection for vulnerable groups — risk assessment with heightened care',
        'Transparency towards those affected about AI-assisted assessments',
        'Human final decision for all case-relevant assessments',
        'Data protection impact assessment when processing sensitive social data',
        'Documentation of oversight by specialist staff',
      ],
      faq: [
        {
          q: 'Does the EU AI Act apply to non-profit organisations?',
          a: 'Yes. Deployer obligations under the EU AI Act do not distinguish by legal form or profit motive. Social organisations and NGOs are fully covered.',
        },
        {
          q: 'What does "vulnerable groups" mean in the context of the EU AI Act?',
          a: 'Persons who may be particularly affected by AI decisions due to age, disability, social situation or other factors. EU AI Act Art. 9 explicitly requires heightened care.',
        },
        {
          q: 'Can we use AI tools like ChatGPT for counselling conversations?',
          a: 'Yes, but: affected persons must be informed, no sensitive case data without consent, and the system must be documented in the register.',
        },
        {
          q: 'Is AI Registry free?',
          a: 'Yes. Permanently free — especially for organisations with limited resources we have made the entire documentation free of charge.',
        },
      ],
      metaTitle: 'EU AI Act for Social Organisations and NGOs — AI Registry free',
      metaDescription:
        'Document AI in social organisations. Protection of vulnerable groups, transparency obligations, GDPR. Permanently free.',
    },
  },
];

export function getIndustryBySlug(slug: string): Industry | undefined {
  return industries.find((i) => i.slug === slug || i.deSlug === slug);
}

export function getIndustrySlugForLocale(industry: Industry, locale: string): string {
  return locale === 'de' ? industry.deSlug : industry.slug;
}
