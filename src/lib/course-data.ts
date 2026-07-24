
export interface Resource {
    title: string;
    url: string;
    type: 'pdf' | 'xlsx' | 'docx';
}

export interface LocalizedCourseText {
    de: string;
    en: string;
}

export interface LegalUpdateSource {
    label: LocalizedCourseText;
    url: string;
    localizedUrl?: LocalizedCourseText;
}

export interface LegalUpdate {
    checkedAt: string;
    status: LocalizedCourseText;
    points: LocalizedCourseText[];
    sources: LegalUpdateSource[];
}

export interface Video {
    id: string;
    title: string;
    description: string;
    url: string;
    resources?: Resource[];
    isDirectDownload?: boolean;
    legalUpdate?: LegalUpdate;
}

export interface Module {
    id: string;
    title: string;
    videos: Video[];
    isExam?: boolean;
}

const CURRENT_LAW_STATUS: LocalizedCourseText = {
    de: "Geprüft am 24. Juli 2026 anhand des geltenden AI Act und der amtlichen EU-Hinweise.",
    en: "Reviewed on 24 July 2026 against the AI Act in force and official EU guidance.",
};

const DIGITAL_OMNIBUS_STATUS: LocalizedCourseText = {
    de: "Die Änderung wurde am 24. Juli 2026 im Amtsblatt veröffentlicht und tritt am 27. Juli 2026 in Kraft.",
    en: "The amendment was published in the Official Journal on 24 July 2026 and enters into force on 27 July 2026.",
};

const ARTICLE_50_STATUS: LocalizedCourseText = {
    de: "Artikel 50 ist Teil des verabschiedeten AI Act. Seine Transparenzpflichten gelten grundsätzlich ab 2. August 2026.",
    en: "Article 50 forms part of the adopted AI Act. Its transparency obligations generally apply from 2 August 2026.",
};

const EU_SOURCES: Record<string, LegalUpdateSource> = {
    digitalOmnibus: {
        label: {
            de: "Verordnung (EU) 2026/1744 im Amtsblatt",
            en: "Regulation (EU) 2026/1744 in the Official Journal",
        },
        url: "https://eur-lex.europa.eu/eli/reg/2026/1744/oj",
        localizedUrl: {
            de: "https://eur-lex.europa.eu/eli/reg/2026/1744/oj/deu",
            en: "https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng",
        },
    },
    aiLiteracyFaq: {
        label: {
            de: "EU-Kommission: Fragen und Antworten zu KI-Kompetenz",
            en: "European Commission: AI literacy questions and answers",
        },
        url: "https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers",
    },
    article3: {
        label: {
            de: "AI Act Service Desk: Artikel 3",
            en: "AI Act Service Desk: Article 3",
        },
        url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-3",
    },
    article2: {
        label: {
            de: "AI Act Service Desk: Artikel 2",
            en: "AI Act Service Desk: Article 2",
        },
        url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-2",
    },
    article5: {
        label: {
            de: "AI Act Service Desk: Artikel 5",
            en: "AI Act Service Desk: Article 5",
        },
        url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5",
    },
    article6: {
        label: {
            de: "AI Act Service Desk: Artikel 6",
            en: "AI Act Service Desk: Article 6",
        },
        url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6",
    },
    article10: {
        label: {
            de: "AI Act Service Desk: Artikel 10",
            en: "AI Act Service Desk: Article 10",
        },
        url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-10",
    },
    article25: {
        label: {
            de: "AI Act Service Desk: Artikel 25",
            en: "AI Act Service Desk: Article 25",
        },
        url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-25",
    },
    article26: {
        label: {
            de: "AI Act Service Desk: Artikel 26",
            en: "AI Act Service Desk: Article 26",
        },
        url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26",
    },
    article50: {
        label: {
            de: "AI Act Service Desk: Artikel 50",
            en: "AI Act Service Desk: Article 50",
        },
        url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50",
    },
    highRiskConsultation: {
        label: {
            de: "EU-Kommission: Entwurf der Hochrisiko-Leitlinien",
            en: "European Commission: draft high-risk guidelines",
        },
        url: "https://digital-strategy.ec.europa.eu/en/consultations/targeted-consultation-draft-guidelines-classification-high-risk-artificial-intelligence-systems",
    },
    article50Guidelines: {
        label: {
            de: "EU-Kommission: Leitlinien zu den Transparenzpflichten",
            en: "European Commission: transparency obligations guidelines",
        },
        url: "https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems",
    },
};

export const courseData: Module[] = [
    {
        id: "module-0",
        title: "Module 0 – Introduction & Overview",
        videos: [
            {
                id: "video-0-1",
                title: "Video 0.1: Welcome & Experts",
                description: "Welcome to the e-learning course 'EU AI Act for SMEs'. In this video you will meet the course leaders and the experts who will accompany you on your learning journey.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Intro%20zu%20Dritt%20EU%20AI%20Act%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=25d66838-8ed8-4a6d-8662-c8b6c27d7833",
                legalUpdate: {
                    checkedAt: "2026-07-24",
                    status: DIGITAL_OMNIBUS_STATUS,
                    points: [
                        {
                            de: "Der AI Act verlangt keine Funktion „KI-Act-Beauftragte:r“. Eine solche Rolle kann intern sinnvoll sein, ist aber ein Governance-Modell des Kurses und keine gesetzlich vorgeschriebene Stelle.",
                            en: "The AI Act does not require an “AI Act Officer”. Such a role can be useful internally, but it is a course governance model rather than a legally mandated function.",
                        },
                        {
                            de: "Ab 27. Juli 2026 verlangt Artikel 4 Maßnahmen zur Unterstützung der Entwicklung von KI-Kompetenz. Ein bestimmtes Kompetenzniveau muss nicht garantiert werden.",
                            en: "From 27 July 2026, Article 4 requires measures that support the development of AI literacy. It does not require a specific level of competence to be guaranteed.",
                        },
                    ],
                    sources: [
                        EU_SOURCES.digitalOmnibus,
                        EU_SOURCES.aiLiteracyFaq,
                    ],
                },
            },
            {
                id: "video-0-2",
                title: "Video 0.2: Course Objectives & Learning Path",
                description: "Welcome back! You will learn what goals the course pursues, how the four modules are structured and what you will be able to do by the end.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz_videos%2FVideo%200.2%20Kursziele%20%26%20Lernpfad.mp4?alt=media&token=b7c01f6d-3a1f-4420-a562-13a5acfb308b"
            },
            {
                id: "video-0-3",
                title: "Video 0.3: Platform Guide & Technical Setup",
                description: "Welcome! This video guides you through the learning platform and shows how to make the best use of videos, resources and quizzes.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Einfu%CC%88hrungsvideo%20(1080p_60fps_H264-128kbit_AAC).mp4?alt=media&token=968a54c3-4e8b-4f2f-8129-1b3f50ccbea5"
            },
            {
                id: "video-0-4",
                title: "Video 0.4: Materials & Resources",
                description: "Welcome! You will get an overview of the checklists, templates, infographics and additional resources that support you throughout the course.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Materialliste%20Zoltan%20EU%20AI%20Act%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=31ed45f6-a30c-4aa3-8e6e-675ac070cb3d"
            },
            {
                id: "video-0-5",
                title: "Video 0.5: Quick Win: Applicability Check",
                description: "Welcome! Prof. Wendt shows you a short checklist to immediately determine whether your organisation is affected by the AI Act.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Quickwin%20Janine%20Wendt%20EU%20AI%20Act%20(1080p_24fps_H264-128kbit_AAC).mp4?alt=media&token=fdb589bd-97dc-4f83-9a0f-dc825c1ce7ac",
                legalUpdate: {
                    checkedAt: "2026-07-24",
                    status: CURRENT_LAW_STATUS,
                    points: [
                        {
                            de: "Die Anzahl der „Ja“-Antworten ist nur eine erste Orientierung. Der Anwendungsbereich folgt zunächst aus Artikel 2; Rolle, Zweck und Einsatzkontext werden anschließend insbesondere nach den Artikeln 3, 5, 6 und 50 geprüft.",
                            en: "The number of “yes” answers is only an initial orientation. Scope is determined first under Article 2; the role, intended purpose and context of use are then assessed in particular under Articles 3, 5, 6 and 50.",
                        },
                        {
                            de: "Import aus einem Drittstaat und Vertrieb unter eigenem Namen sind getrennte Rollenfragen. Wer ein System unter eigenem Namen oder eigener Marke anbietet, kann nach Artikel 25 Pflichten eines Anbieters übernehmen.",
                            en: "Importing from a third country and placing a system on the market under one's own name are separate role questions. Article 25 can transfer provider obligations to a party using its own name or trademark.",
                        },
                    ],
                    sources: [
                        EU_SOURCES.article2,
                        EU_SOURCES.article3,
                        EU_SOURCES.article25,
                        EU_SOURCES.article6,
                        EU_SOURCES.article50,
                    ],
                },
            }
        ]
    },
    {
        id: "module-1",
        title: "Module 1 – Technical Essentials",
        videos: [
            {
                id: "video-1-1",
                title: "Video 1.1: What Is AI? Introduction to Neural Networks",
                description: "Welcome! You will learn how artificial intelligence learns from examples and what role neural networks play in this process.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz_videos%2F1.1%20Momo%20technische%20Grundlagen.mp4?alt=media&token=ccaf498c-1f27-4bcf-8179-4a53acb360a4",
                resources: [
                    { title: "Glossary of AI Key Terms", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModull%201%2FGlossar_KI_Grundbegri%EF%AC%83e_Modul1_1.1.pdf?alt=media&token=597d692c-16fd-4439-a796-812b230b215f", type: "pdf" }
                ]
            },
            {
                id: "video-1-2",
                title: "Video 1.2: Tokens & Embeddings: Language in Numbers",
                description: "Welcome! This video explains in an accessible way how texts are translated into numbers and why this is so important for language AI.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.2%20Tokenisierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=29773c28-6e01-411d-9a10-995ea19891d9",
                resources: [
                    { title: "Token Calculator", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModull%201%2FModul1_1.2_Token_Rechner.xlsx?alt=media&token=435f164a-567f-4902-b723-c6719b4b565d", type: "xlsx" }
                ]
            },
            {
                id: "video-1-3",
                title: "Video 1.3: Large Language Models: GPT & Co.",
                description: "Welcome! You will learn how large language models work, what their strengths and limitations are and where they are useful for SMEs.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.3%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=5a968127-4454-4a28-900a-6e3a9fc98cb0",
                resources: [
                    { title: "LLM Comparison", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModull%201%2FModul1_1.3_Vergleich_LLMs.xlsx?alt=media&token=c50ac105-c62e-4c26-811e-23fcd2066a3a", type: "xlsx" }
                ]
            },
            {
                id: "video-1-4",
                title: "Video 1.4: Prompt Engineering Basics",
                description: "Welcome! You will learn how to obtain better results from AI systems through effective prompting.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.4%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=36bb95ef-384d-4d7c-bd9d-f9d198feb5a5",
                resources: [
                    { title: "Prompt Checklist", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModull%201%2FModul1_1.4_Prompt_Checkliste.pdf?alt=media&token=6cfbde1f-7bfc-470b-a04a-63dcab9927c4", type: "pdf" }
                ]
            },
            {
                id: "video-1-5",
                title: "Video 1.5: Tools vs. Models: Super Agents",
                description: "Welcome! You will see how AI models are integrated into tools and how so-called super agents can orchestrate entire workflows.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.5%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=6979bd21-ce44-4e22-93aa-50e78f5c0c12"
            },
            {
                id: "video-1-6",
                title: "Video 1.6: RAG – Company-Specific AI Answers",
                description: "Welcome! This video shows how you can make your own documents usable with AI for more precise answers within your organisation.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.6%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=cedece03-59ce-4ee3-ad6f-b52c73a0ddbf",
                resources: [
                    { title: "RAG Template", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModull%201%2FModul1_1.5_RAG_Template.xlsx?alt=media&token=93999728-f0fd-4bad-86b8-2c2cb7edfb1a", type: "xlsx" }
                ]
            },
            {
                id: "video-1-7",
                title: "Video 1.7: Offline & Open-Source LLMs",
                description: "Welcome! You will learn what advantages local and open AI models offer, particularly regarding data protection and cost.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.7%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=56a228b7-76a8-4a6a-bfd5-01128dff2ee2",
                 resources: [
                    { title: "Open-Source Criteria Matrix", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModull%201%2FModul1_1.7_OpenSource_Kriterienmatrix.xlsx?alt=media&token=39ecc64a-a06d-4c68-b38e-11fbb8308aaa", type: "xlsx" }
                ]
            },
            {
                id: "video-1-8",
                title: "Video 1.8: Risks & Bias",
                description: "Welcome! You will learn how biases and hallucinations arise in AI and how to ensure the quality of results.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.8%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=49d9f993-4cd8-4afe-bcaf-a850516e787e",
                 resources: [
                    { title: "Bias Test Checklist (PDF)", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModull%201%2FModul1_1.8_Bias_Test_Checkliste.pdf?alt=media&token=a223dad6-2b9b-4342-9289-670578da810a", type: "pdf" },
                    { title: "Bias Test Checklist (Excel)", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModull%201%2FModul1_1.8_Bias_Test_Checkliste.xlsx?alt=media&token=045a628f-ed3b-4231-89a5-c0dba095d797", type: "xlsx" }
                ]
            },
            {
                id: "video-1-9",
                title: "Video 1.9: Data Protection & Security",
                description: "Welcome! You will receive practical fundamentals on how to deploy AI systems securely and comply with GDPR requirements.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifierung%20Modul%201.9%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=98f66815-f073-40a2-bf3c-95c6ac5359ed",
                 resources: [
                    { title: "Data Protection Checklist", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModull%201%2FModul1_1.6_Datenschutz_Checkliste.pdf?alt=media&token=498d199a-172c-45d6-aa9d-40690d916ddc", type: "pdf" },
                    { title: "Privacy by Design Checklist", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModull%201%2FModul1_1.9_Privacy_by_Design_Checkliste.pdf?alt=media&token=d0c8cfca-671e-4409-83e4-2d815b22c522", type: "pdf" }
                ]
            }
        ]
    },
    {
        id: "module-2",
        title: "Module 2 – Legal Foundations",
        videos: [
            {
                id: "video-2-1",
                title: "Video 2.1: What Does the AI Act Regulate?",
                description: "Welcome! You will get an overview of the objectives the AI Act pursues and how it interacts with other legislation.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20-%20Modul%202.1%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=3aabfe85-424d-41a6-a6cb-2260fc75657e"
            },
            {
                id: "video-2-2",
                title: "Video 2.2: Risk Pyramid",
                description: "Welcome! This video explains the four risk categories of the AI Act \u2013 from minimal risk to prohibited applications.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202.2%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=a26f2c0f-ea67-4be1-911a-b221bb254434",
                legalUpdate: {
                    checkedAt: "2026-07-24",
                    status: DIGITAL_OMNIBUS_STATUS,
                    points: [
                        {
                            de: "Die Risikopyramide ist ein Lernmodell, keine abschließende gesetzliche Klassifikation. Die im Video genannte Spanne von 5 bis 15 Prozent für Hochrisiko-Systeme ist weder ein gesetzlicher Schwellenwert noch eine amtlich bestätigte Marktquote.",
                            en: "The risk pyramid is a learning model, not an exhaustive legal classification. The 5 to 15 per cent range stated for high-risk systems is neither a legal threshold nor an officially confirmed market share.",
                        },
                        {
                            de: "„Minimales Risiko“ bedeutet nicht automatisch „keine Pflichten“. Artikel 4 gilt rollenbezogen unabhängig von der Risikoklasse; ab 2. August 2026 kann Artikel 50 für bestimmte Systeme und Ausgaben zusätzliche Transparenzpflichten auslösen.",
                            en: "“Minimal risk” does not automatically mean “no obligations”. Article 4 applies by role regardless of risk class, while Article 50 can trigger additional transparency duties for certain systems and outputs from 2 August 2026.",
                        },
                    ],
                    sources: [
                        EU_SOURCES.digitalOmnibus,
                        EU_SOURCES.article50,
                    ],
                },
                resources: [
                    { title: "Risk Pyramid", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%202%2FModul2_2.2_Risiko-Pyramide.pdf?alt=media&token=435d532b-51e4-4185-baeb-eb6ece742821", type: "pdf" }
                ]
            },
            {
                id: "video-2-3",
                title: "Video 2.3: Prohibited Practices",
                description: "Welcome! You will learn which AI applications are fundamentally prohibited in the EU.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202.3%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=92a70d9f-00b2-4ac9-8b2e-a9fcf4f2bffe",
                legalUpdate: {
                    checkedAt: "2026-07-24",
                    status: DIGITAL_OMNIBUS_STATUS,
                    points: [
                        {
                            de: "Das Verbot des Social Scoring ist nicht auf Behörden beschränkt. Artikel 5 Absatz 1 Buchstabe c formuliert das Verbot akteursneutral, sofern die dort genannten Voraussetzungen erfüllt sind.",
                            en: "The social-scoring prohibition is not limited to public authorities. Article 5(1)(c) is actor-neutral where its stated conditions are met.",
                        },
                        {
                            de: "Nicht jedes Verbot ist ausnahmslos formuliert. Für die konkrete Prüfung müssen die Voraussetzungen und Ausnahmen des jeweiligen Buchstabens in Artikel 5 gelesen werden.",
                            en: "Not every prohibition is formulated without exceptions. A concrete assessment must consider the conditions and exceptions of the relevant point in Article 5.",
                        },
                        {
                            de: "Der Digital Omnibus ergänzt Artikel 5 um Verbote für bestimmte KI-Systeme, die nicht einvernehmliches intimes Material oder Darstellungen sexuellen Kindesmissbrauchs erzeugen oder manipulieren. Diese neuen Tatbestände gelten ab 2. Dezember 2026.",
                            en: "The Digital Omnibus adds Article 5 prohibitions for certain AI systems that generate or manipulate non-consensual intimate material or child sexual abuse material. These new provisions apply from 2 December 2026.",
                        },
                    ],
                    sources: [
                        EU_SOURCES.article5,
                        EU_SOURCES.digitalOmnibus,
                    ],
                },
                resources: [
                    { title: "Prohibited Practices", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%202%2FModul2_2.3_Verbotene_Praktiken.pdf?alt=media&token=1164dc8d-0dbf-4dad-ab8f-1ab6de0d0605", type: "pdf" }
                ]
            },
            {
                id: "video-2-4",
                title: "Video 2.4: High-Risk Obligations",
                description: "Welcome! You will learn what obligations providers and deployers of high-risk systems have.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202%204%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=fce19041-f951-4716-af86-f3f16efda1bd",
                legalUpdate: {
                    checkedAt: "2026-07-24",
                    status: CURRENT_LAW_STATUS,
                    points: [
                        {
                            de: "Artikel 10 verlangt, dass Datensätze nach bestem Bemühen fehlerfrei und vollständig sind. Er fordert außerdem die Prüfung, Erkennung, Verhinderung und Minderung möglicher Verzerrungen, nicht absolute Fehler- oder Vorurteilsfreiheit.",
                            en: "Article 10 requires datasets to be, to the best extent possible, free of errors and complete. It also requires possible biases to be examined, detected, prevented and mitigated rather than promising absolute freedom from errors or bias.",
                        },
                        {
                            de: "Anbieter- und Betreiberpflichten bleiben getrennt: Artikel 10 richtet die Daten-Governance an Anbieter; Artikel 26 regelt unter anderem die Eingabedaten und Überwachung durch Betreiber.",
                            en: "Provider and deployer duties remain distinct: Article 10 directs data governance obligations to providers, while Article 26 covers deployer duties including input data and monitoring.",
                        },
                    ],
                    sources: [
                        EU_SOURCES.article10,
                        EU_SOURCES.article26,
                    ],
                },
                resources: [
                    { title: "High-Risk Obligations", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%202%2FModul2_2.4_Hochrisiko_Pflichten.xlsx?alt=media&token=ae69bb02-375d-4ede-a7a4-162ff033879b", type: "xlsx" }
                ]
            },
            {
                id: "video-2-5",
                title: "Video 2.5: Generative AI vs. GPAI",
                description: "Welcome! This video shows the differences between generative AI and general-purpose AI models (GPAI) and explains their respective obligations.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202.5%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=47ba2572-7fe3-4a9e-8569-1df8a2be42b8",
                legalUpdate: {
                    checkedAt: "2026-07-24",
                    status: ARTICLE_50_STATUS,
                    points: [
                        {
                            de: "Die Transparenzpflichten stehen im endgültigen AI Act in Artikel 50, nicht in Artikel 52.",
                            en: "The final AI Act places the transparency obligations in Article 50, not Article 52.",
                        },
                        {
                            de: "Artikel 50 verlangt keine pauschale sichtbare Kennzeichnung jeder generativen Ausgabe. Er unterscheidet insbesondere die maschinenlesbare Markierung durch Anbieter von der Offenlegung bestimmter Deepfakes und Texte von öffentlichem Interesse durch Betreiber; Ausnahmen bleiben zu prüfen.",
                            en: "Article 50 does not require a blanket visible label on every generative output. It distinguishes, in particular, machine-readable marking by providers from deployer disclosure for certain deepfakes and public-interest text, subject to its exceptions.",
                        },
                        {
                            de: "Für bestimmte Systeme, die bereits vor dem 2. August 2026 in Verkehr gebracht wurden, setzt die neue Übergangsregel die Umsetzung von Artikel 50 Absatz 2 bis 2. Dezember 2026 fest.",
                            en: "For certain systems placed on the market before 2 August 2026, the new transitional rule sets 2 December 2026 as the deadline to comply with Article 50(2).",
                        },
                    ],
                    sources: [
                        EU_SOURCES.article50,
                        EU_SOURCES.article50Guidelines,
                        EU_SOURCES.digitalOmnibus,
                    ],
                },
                resources: [
                    { title: "GPAI vs. Generative AI", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%202%2FModul2_2.5_GPAI_vs_GenerativeKI.pdf?alt=media&token=a7b260e7-8cf9-4010-bf4b-c1a7029a7d5c", type: "pdf" }
                ]
            },
            {
                id: "video-2-6",
                title: "Video 2.6: Decision Tree Live",
                description: "Welcome! Prof. Wendt walks you through a practical case assessment: Is a system high-risk or not?",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202%206%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=e7f044f1-22ee-4b0e-96f6-83214140a010",
                legalUpdate: {
                    checkedAt: "2026-07-24",
                    status: CURRENT_LAW_STATUS,
                    points: [
                        {
                            de: "Artikel 6 enthält zwei getrennte Hochrisiko-Wege: Sicherheitskomponenten oder Produkte nach Absatz 1 und Anhang I sowie die Einsatzfälle nach Absatz 2 und Anhang III.",
                            en: "Article 6 contains two separate high-risk routes: safety components or products under paragraph 1 and Annex I, and the use cases under paragraph 2 and Annex III.",
                        },
                        {
                            de: "Die Ausnahme in Artikel 6 Absatz 3 verlangt fehlendes erhebliches Risiko und zusätzlich mindestens eine der vier dort genannten Bedingungen. Systeme nach Anhang III bleiben bei Profiling natürlicher Personen immer hochriskant.",
                            en: "The Article 6(3) exception requires both an absence of significant risk and at least one of the four stated conditions. Annex III systems that profile natural persons remain high-risk.",
                        },
                        {
                            de: "Der im Video erwähnte Leitlinienentwurf ist noch nicht endgültig. Die Konsultation endete am 23. Juli 2026; außerdem gilt für Transparenzpflichten die endgültige Artikelnummer 50 statt 52.",
                            en: "The draft guidelines mentioned in the video are not yet final. The consultation ended on 23 July 2026, and the final article number for transparency duties is 50 rather than 52.",
                        },
                    ],
                    sources: [
                        EU_SOURCES.article6,
                        EU_SOURCES.highRiskConsultation,
                        EU_SOURCES.article50,
                    ],
                },
                resources: [
                    { title: "Decision Tree", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%202%2FModul2_2.6_Entscheidungsbaum.xlsx?alt=media&token=a6ca8b22-8e51-4e62-a70f-0ef7c65f7516", type: "xlsx" }
                ]
            },
            {
                id: "video-2-7",
                title: "Video 2.7: Case Study: Chatbot",
                description: "Welcome! You will see how transparency obligations for chatbots are implemented in practice.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202%207%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=f1500d79-85e8-4ea8-9173-a89b1131870d",
                legalUpdate: {
                    checkedAt: "2026-07-24",
                    status: ARTICLE_50_STATUS,
                    points: [
                        {
                            de: "Für Chatbots gilt die endgültige Artikelnummer 50 statt 52. Absatz 1 adressiert den Anbieter, der das System so gestaltet, dass Menschen über die Interaktion mit KI informiert werden.",
                            en: "For chatbots, the final article number is 50 rather than 52. Paragraph 1 addresses the provider, who must design the system so that people are informed they are interacting with AI.",
                        },
                        {
                            de: "Ein sichtbarer Hinweis bleibt eine sinnvolle Umsetzung. Vor der rechtlichen Zuordnung muss aber geprüft werden, ob das Unternehmen Anbieter, Betreiber oder beides ist und ob die Ausnahme für einen aus Sicht einer verständigen Person offensichtlichen KI-Kontext greift.",
                            en: "A visible notice remains a sensible implementation. Legal allocation still requires checking whether the organisation is a provider, deployer or both, and whether the exception for an AI context obvious to a reasonably well-informed person applies.",
                        },
                    ],
                    sources: [
                        EU_SOURCES.article50,
                        EU_SOURCES.article50Guidelines,
                    ],
                },
                resources: [
                    { title: "Chatbot Labelling", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%202%2FModul2_2.7_Chatbot_Kennzeichnung.pdf?alt=media&token=b08e3036-97c4-42ac-b800-fb5bdc1b47da", type: "pdf" }
                ]
            },
            {
                id: "video-2-8",
                title: "Video 2.8: Case Study: Emotion Recognition",
                description: "Welcome! An example demonstrates why emotion recognition in the workplace is prohibited.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202.8%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=701a5d58-04c5-4997-82fa-d71fb7a81a66",
                legalUpdate: {
                    checkedAt: "2026-07-24",
                    status: CURRENT_LAW_STATUS,
                    points: [
                        {
                            de: "Emotionserkennung am Arbeitsplatz und in Bildungseinrichtungen ist grundsätzlich verboten, aber Artikel 5 Absatz 1 Buchstabe f enthält eine Ausnahme für medizinische oder sicherheitsbezogene Gründe.",
                            en: "Emotion recognition in workplaces and education institutions is generally prohibited, but Article 5(1)(f) contains an exception for medical or safety reasons.",
                        },
                    ],
                    sources: [EU_SOURCES.article5],
                },
                resources: [
                    { title: "Emotion Recognition", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%202%2FModul2_2.8_Emotionserkennung.pdf?alt=media&token=94d2e1e4-14e6-4117-876c-f584936cd094", type: "pdf" }
                ]
            },
            {
                id: "video-2-9",
                title: "Video 2.9: Compliance Roadmap",
                description: "Welcome! You will receive an implementation roadmap. The dated legal update shown below supplements the unchanged video and download.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202.9%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=5710ded6-e85f-4f98-aba0-cbc5460fc2fe",
                legalUpdate: {
                    checkedAt: "2026-07-24",
                    status: DIGITAL_OMNIBUS_STATUS,
                    points: [
                        {
                            de: "Die im Video genannten Hochrisiko-Fristen August 2026 und August 2027 wurden geändert. Die Regeln für Systeme nach Artikel 6 Absatz 2 und Anhang III gelten ab 2. Dezember 2027; für Systeme nach Artikel 6 Absatz 1 und Anhang I ab 2. August 2028.",
                            en: "The August 2026 and August 2027 high-risk dates stated in the video have changed. Rules for systems under Article 6(2) and Annex III apply from 2 December 2027, while systems under Article 6(1) and Annex I apply from 2 August 2028.",
                        },
                        {
                            de: "Ab 27. Juli 2026 verlangt Artikel 4 die Unterstützung der Entwicklung von KI-Kompetenz, aber keine Garantie eines bestimmten Niveaus. Kursabschluss oder Zertifikat allein belegen daher noch keine vollständige Erfüllung.",
                            en: "From 27 July 2026, Article 4 requires support for the development of AI literacy, but no guarantee of a specific level. Completing the course or holding a certificate alone therefore does not demonstrate full compliance.",
                        },
                        {
                            de: "Eine Funktion „KI-Act-Beauftragte:r“ bleibt eine mögliche interne Governance-Entscheidung und ist keine Pflichtrolle des AI Act.",
                            en: "An “AI Act Officer” remains an optional internal governance decision rather than a mandatory role under the AI Act.",
                        },
                    ],
                    sources: [
                        EU_SOURCES.digitalOmnibus,
                        EU_SOURCES.aiLiteracyFaq,
                    ],
                },
                resources: [
                    { title: "Compliance Roadmap", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%202%2FModul2_2.9_Compliance_Roadmap.xlsx?alt=media&token=e3cd1e0e-2ad9-4224-b882-1b105eec84de", type: "xlsx" }
                ]
            }
        ]
    },
    {
        id: "module-3",
        title: "Module 3 – Ethics & Communication",
        videos: [
            {
                id: "video-3-1",
                title: "Video 3.1: Ethical Foundations",
                description: "Welcome! You will learn about key ethical models \u2013 utilitarianism, deontology and the principles of trustworthy AI.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Ethik%203.1%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=71b87e52-4381-40fd-a764-baf5a52ca3de",
                resources: [
                    { title: "Ethics Principles", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%203%2FModul3_3.1_Ethik_Prinzipien.pdf?alt=media&token=f55828e5-be0e-4f03-9bae-02de8efefa18", type: "pdf" }
                ]
            },
            {
                id: "video-3-2",
                title: "Video 3.2: Ethics in SME Processes",
                description: "Welcome! This video translates ethical principles into concrete checklists and responsibilities for your organisation.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Ethik%203.2%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=af445328-c9f5-47bb-8fe8-f3ede6f14b33",
                 resources: [
                    { title: "Ethics Self-Assessment", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%203%2FModul3_3.2_Ethik_Selbstcheck.xlsx?alt=media&token=98787ba6-5af5-41e8-bfd7-ac5aa14cacd4", type: "xlsx" }
                ]
            },
            {
                id: "video-3-3",
                title: "Video 3.3: Internal Communication",
                description: "Welcome! You will learn how to inform your organisation about AI usage, address concerns and target specific audiences.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Ethik%203.3%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=47447b89-0eb4-4db0-a1f4-8dbd70c661bf",
                 resources: [
                    { title: "Transparency Logbook", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%203%2FModul3_3.3_Transparenz_Logbuch.xlsx?alt=media&token=34dadc2b-bb6d-4c7c-ab7e-dbc259eaf76a", type: "xlsx" }
                ]
            },
            {
                id: "video-3-4",
                title: "Video 3.4: External Communication",
                description: "Welcome! You will learn how to communicate transparently and build trust about AI with customers, partners and the media.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Ethik%203.4%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=2c2bbf81-feff-452a-831e-37663d969275",
                 resources: [
                    { title: "Bias Audit Checklist", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%203%2FModul3_3.4_Bias_Audit_Checkliste.pdf?alt=media&token=41e2c196-df36-4222-86a1-9c7eb9768007", type: "pdf" },
                    { title: "Bias Audit", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%203%2FModul3_3.4_Bias_Audit.xlsx?alt=media&token=5ed03deb-ba03-46e9-a1fe-5a50d414a82f", type: "xlsx" }
                ]
            },
            {
                id: "video-3-5",
                title: "Video 3.5: Role Play 'Mr Sommer'",
                description: "Welcome! In a role play you will experience how empathetic communication about the AI Act works in practice.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Ethik%203.5%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=3c3bd626-5259-4f78-a015-2ac222a072ac",
                resources: [
                    { title: "RACI Matrix", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%203%2FModul3_3.5_RACI_Matrix.xlsx?alt=media&token=3b310c3e-0fe2-4e8b-be01-113b6d4fbdd8", type: "xlsx" },
                    { title: "Communication FAQ", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%203%2FModul3_3.6_Kommunikation_FAQ.pdf?alt=media&token=5529ff42-89cd-4f8a-990b-8e1e16296b66", type: "pdf" }
                ]
            }
        ]
    },
    {
        id: "module-4",
        title: "Module 4 – Practice & Exam Preparation",
        videos: [
            {
                id: "video-4-1",
                title: "Video 4.1: On-Boarding Roadmap",
                description: "Welcome! You will complete the 5-step plan and apply the roadmap to your organisation's practice.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%204.1%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=d126f56f-e744-41db-8c24-b51dc3a73b53"
            },
            {
                id: "video-4-2",
                title: "Video 4.2: Simulation I – Chatbot",
                description: "Welcome! In a simulation you will learn how an SME customer responds to questions about the AI chatbot \u2013 and how to answer confidently.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%204.2%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=6c282645-80ab-404c-b419-664f05436e76",
                resources: [
                    { title: "Roadmap Simulation", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%204%2FModul4_4.2_Roadmap_Simulation.xlsx?alt=media&token=9d602a55-b17e-4e52-b790-c71428c61080", type: "xlsx" }
                ]
            },
            {
                id: "video-4-3",
                title: "Video 4.3: Simulation II – Retail & Service",
                description: "Welcome! You will see how data protection (GDPR) and AI technology interact in a realistic online retail case.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%204.3%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=08c696b9-cbaa-43ac-8499-c1faeb33f3e8",
                resources: [
                    { title: "GDPR Checklist", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%204%2FModul4_4.3_DSGVO_Checkliste.pdf?alt=media&token=6fe1501b-37f2-4353-9058-8dfa888eb540", type: "pdf" }
                ]
            },
            {
                id: "video-4-4",
                title: "Video 4.4: Simulation III – Healthcare",
                description: "Welcome! A practical example shows the stringent requirements for AI in clinical practice \u2013 from CE marking to patient information.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%204.4%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=7ee7c758-1948-4db1-b8af-0ecdd61afda5",
                resources: [
                    { title: "High-Risk Healthcare", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%204%2FModul4_4.4_Hochrisiko_Gesundheitswesen.pdf?alt=media&token=d93d412a-f2c0-4dc7-ab2a-814b4ee7a1b1", type: "pdf" }
                ]
            },
            {
                id: "video-4-5",
                title: "Video 4.5: Exam Preparation",
                description: "Welcome! You will receive the most important facts and tips for the multiple-choice exam.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Pru%CC%88fungsvorbereitung%20Abschluss%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=324c7e4c-0b4d-4c18-812c-c92d70f353ea",
                resources: [
                    { title: "Flashcards Q&A", url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz%2FModul%204%2FModul4_4.5_Lernkarten_QA.xlsx?alt=media&token=fb99a615-1f66-46e9-92e6-897d5eb8691f", type: "xlsx" }
                ]
            }
        ]
    },
    {
        id: "module-exam",
        title: "Certification",
        isExam: true,
        videos: [],
    },
    {
        id: "module-5",
        title: "Conclusion",
        videos: [
            {
                id: "video-5-1",
                title: "Video 5.1: Certificate & Updates",
                description: "Welcome! You will learn how to receive your certificate and badge and stay up to date via newsletter updates.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Abschluss%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=4a43337d-1e34-40b5-bbca-91ccb13de068"
            },
            {
                id: "video-5-2",
                title: "Farewell & Bloopers",
                description: "A little behind-the-scenes look as a thank you for your participation in the course.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Blooper%202%20fu%CC%88r%20Werbung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=d8f3dd57-afc1-44cf-b27b-71174731627b"
            }
        ]
    },
    {
        id: "module-superresource",
        title: "Super Resource: Variable Matrix",
        videos: [
            {
                id: "download-6-1",
                title: "Complete EU AI Act Variable Matrix",
                description: "Comprehensive Excel file with all variables, criteria and relationships of the EU AI Act.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU_AI_Act_COMPLETE_Professional_Sales_Workbook_UPDATED.xlsx?alt=media",
                isDirectDownload: true,
            }
        ]
    },
    {
        id: "module-6",
        title: "Bonus: Implementation & Culture",
        videos: [
            {
                id: "video-6-1",
                title: "Implementation & Culture",
                description: "Learn how the PERMA model for well-being can be used to design AI for people.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20-%20Extra%20Video%20zu%20PERMA%20Assistenzkurs%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=cd570ac5-9ae6-4188-b215-afc636379b22",
                resources: [ ]
            },
            {
                id: "video-6-2",
                title: "Implementation & Culture",
                description: "Learn how the PERMA model for well-being can be used to design AI for people.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%201%20Einfu%CC%88hrung%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=e543b604-7d92-4eae-8000-692714982927"
            },
            {
                id: "video-6-3",
                title: "Implementation & Culture",
                description: "Learn how the PERMA model for well-being can be used to design AI for people.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%203%20Modul%202%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=445cc5e8-3cc4-4016-86b6-4afe3ff61466"
            },
            {
                id: "video-6-4",
                title: "Implementation & Culture",
                description: "Learn how the PERMA model for well-being can be used to design AI for people.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%204%20Modul%203%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=d7a98997-c531-4d57-86c1-bb7ff1a6d6da"
            },
            {
                id: "video-6-5",
                title: "Implementation & Culture",
                description: "Learn how the PERMA model for well-being can be used to design AI for people.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%205%20Modul%204%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=54a763a8-412b-4575-9c60-9ebb5608cabe"
            },
            {
                id: "video-6-6",
                title: "Implementation & Culture",
                description: "Learn how the PERMA model for well-being can be used to design AI for people.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%206%20Modul%205%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=b0ce97b9-5b61-48dd-a683-3a1b9c34a78c"
            },
            {
                id: "video-6-7",
                title: "Implementation & Culture",
                description: "Learn how the PERMA model for well-being can be used to design AI for people.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%207%20Modul%206%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=3df3df1f-6427-4e25-a197-bb63f6ed123f"
            },
            {
                id: "video-6-8",
                title: "Implementation & Culture",
                description: "Learn how the PERMA model for well-being can be used to design AI for people.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%208%20Modul%207%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=32367c9a-9013-442b-b0e8-6a0d3ee26971"
            }
        ]
    }
];
