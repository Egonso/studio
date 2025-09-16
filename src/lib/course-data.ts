
export interface Video {
    id: string;
    title: string;
    description: string;
    url: string;
}

export interface Module {
    id: string;
    title: string;
    videos: Video[];
    isExam?: boolean;
}

export const courseData: Module[] = [
    {
        id: "module-0",
        title: "Modul 0 – Einführung & Überblick",
        videos: [
            {
                id: "video-0-1",
                title: "Video 0.1: Begrüßung & Expert:innen",
                description: "Willkommen zum E-Learning-Kurs „EU-KI-Gesetz für KMU“. In diesem Video lernen Sie die Kursleitung und die Expert:innen kennen, die Sie auf Ihrer Lernreise begleiten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Intro%20zu%20Dritt%20EU%20AI%20Act%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=25d66838-8ed8-4a6d-8662-c8b6c27d7833"
            },
            {
                id: "video-0-2",
                title: "Video 0.2: Kursziele & Lernpfad",
                description: "Willkommen zurück! Sie erfahren, welche Ziele der Kurs verfolgt, wie die vier Module aufgebaut sind und was Sie am Ende können werden.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz_videos%2FVideo%200.2%20Kursziele%20%26%20Lernpfad.mp4?alt=media&token=b7c01f6d-3a1f-4420-a562-13a5acfb308b"
            },
            {
                id: "video-0-3",
                title: "Video 0.3: Plattform-Guide & Technik",
                description: "Willkommen! Dieses Video führt Sie durch die Lernplattform und zeigt, wie Sie Videos, Ressourcen und Quizzes optimal nutzen.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Einfu%CC%88hrungsvideo%20(1080p_60fps_H264-128kbit_AAC).mp4?alt=media&token=968a54c3-4e8b-4f2f-8129-1b3f50ccbea5"
            },
            {
                id: "video-0-4",
                title: "Video 0.4: Materialien & Ressourcen",
                description: "Willkommen! Sie erhalten einen Überblick über die Checklisten, Templates, Infografiken und weiteren Ressourcen, die Sie im Kurs unterstützen.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Materialliste%20Zoltan%20EU%20AI%20Act%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=31ed45f6-a30c-4aa3-8e6e-675ac070cb3d"
            },
            {
                id: "video-0-5",
                title: "Video 0.5: Quick-Win: Betroffen-Check",
                description: "Willkommen! Prof. Wendt zeigt Ihnen eine kurze Checkliste, mit der Sie sofort prüfen können, ob Ihr Unternehmen vom AI Act betroffen ist.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Quickwin%20Janine%20Wendt%20EU%20AI%20Act%20(1080p_24fps_H264-128kbit_AAC).mp4?alt=media&token=fdb589bd-97dc-4f83-9a0f-dc825c1ce7ac"
            }
        ]
    },
    {
        id: "module-1",
        title: "Modul 1 – Technische Essentials",
        videos: [
            {
                id: "video-1-1",
                title: "Video 1.1: Was ist KI? Einführung in Neuronale Netze",
                description: "Willkommen! Sie lernen, wie Künstliche Intelligenz aus Beispielen lernt und welche Rolle neuronale Netze dabei spielen.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/eukigesetz_videos%2F1.1%20Momo%20technische%20Grundlagen.mp4?alt=media&token=ccaf498c-1f27-4bcf-8179-4a53acb360a4"
            },
            {
                id: "video-1-2",
                title: "Video 1.2: Tokens & Embeddings: Sprache in Zahlen",
                description: "Willkommen! Dieses Video erklärt anschaulich, wie Texte in Zahlen übersetzt werden und warum das für Sprach-KI so wichtig ist.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.2%20Tokenisierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=29773c28-6e01-411d-9a10-995ea19891d9"
            },
            {
                id: "video-1-3",
                title: "Video 1.3: Large Language Models: GPT & Co.",
                description: "Willkommen! Sie erfahren, wie große Sprachmodelle funktionieren, welche Stärken und Grenzen sie haben und wo sie für KMUs nützlich sind.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.3%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=5a968127-4454-4a28-900a-6e3a9fc98cb0"
            },
            {
                id: "video-1-4",
                title: "Video 1.4: Prompt Engineering Basics",
                description: "Willkommen! Sie lernen, wie Sie durch geschicktes Prompten bessere Ergebnisse von KI-Systemen erhalten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.4%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=36bb95ef-384d-4d7c-bd9d-f9d198feb5a5"
            },
            {
                id: "video-1-5",
                title: "Video 1.5: Tools vs. Modelle: Super-Agents",
                description: "Willkommen! Sie sehen, wie KI-Modelle in Tools integriert werden und wie sogenannte Super-Agents ganze Abläufe steuern können.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.5%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=6979bd21-ce44-4e22-93aa-50e78f5c0c12"
            },
            {
                id: "video-1-6",
                title: "Video 1.6: RAG – Firmeneigene KI-Antworten",
                description: "Willkommen! Dieses Video zeigt, wie Sie Ihre eigenen Dokumente mit KI nutzbar machen können – für präzisere Antworten im Unternehmen.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.6%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=cedece03-59ce-4ee3-ad6f-b52c73a0ddbf"
            },
            {
                id: "video-1-7",
                title: "Video 1.7: Offline- & Open-Source-LLMs",
                description: "Willkommen! Sie erfahren, welche Vorteile lokale und offene KI-Modelle bieten, besonders in Bezug auf Datenschutz und Kosten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.7%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=56a228b7-76a8-4a6a-bfd5-01128dff2ee2"
            },
            {
                id: "video-1-8",
                title: "Video 1.8: Risiken & Bias",
                description: "Willkommen! Sie lernen, wie Verzerrungen und Halluzinationen in KI entstehen und wie Sie die Qualität der Ergebnisse sichern.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%201.8%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=49d9f993-4cd8-4afe-bcaf-a850516e787e"
            },
            {
                id: "video-1-9",
                title: "Video 1.9: Datenschutz & Security",
                description: "Willkommen! Sie erhalten praktische Grundlagen, wie Sie KI-Systeme sicher einsetzen und DSGVO-Vorgaben erfüllen.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifierung%20Modul%201.9%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=98f66815-f073-40a2-bf3c-95c6ac5359ed"
            }
        ]
    },
    {
        id: "module-2",
        title: "Modul 2 – Rechtliche Grundlagen",
        videos: [
            {
                id: "video-2-1",
                title: "Video 2.1: Was regelt der AI Act?",
                description: "Willkommen! Sie erhalten einen Überblick, welche Ziele der AI Act verfolgt und wie er mit anderen Gesetzen zusammenspielt.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20-%20Modul%202.1%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=3aabfe85-424d-41a6-a6cb-2260fc75657e"
            },
            {
                id: "video-2-2",
                title: "Video 2.2: Risiko-Pyramide",
                description: "Willkommen! Dieses Video erklärt die vier Risikoklassen des AI Acts – von minimalem Risiko bis zu verbotenen Anwendungen.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202.2%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=a26f2c0f-ea67-4be1-911a-b221bb254434"
            },
            {
                id: "video-2-3",
                title: "Video 2.3: Verbotene Praktiken",
                description: "Willkommen! Sie lernen, welche KI-Anwendungen in der EU grundsätzlich verboten sind.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202.3%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=92a70d9f-00b2-4ac9-8b2e-a9fcf4f2bffe"
            },
            {
                id: "video-2-4",
                title: "Video 2.4: Hochrisiko-Pflichten",
                description: "Willkommen! Sie erfahren, welche Pflichten Anbieter und Nutzer von Hochrisiko-Systemen haben.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202%204%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=fce19041-f951-4716-af86-f3f16efda1bd"
            },
            {
                id: "video-2-5",
                title: "Video 2.5: Generative KI vs. GPAI",
                description: "Willkommen! Dieses Video zeigt die Unterschiede zwischen generativer KI und Basismodellen (GPAI) und erklärt deren Pflichten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202.5%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=47ba2572-7fe3-4a9e-8569-1df8a2be42b8"
            },
            {
                id: "video-2-6",
                title: "Video 2.6: Entscheidungsbaum live",
                description: "Willkommen! Prof. Wendt führt Sie durch eine praktische Fallprüfung: Ist ein System Hochrisiko oder nicht?",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202%206%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=e7f044f1-22ee-4b0e-96f6-83214140a010"
            },
            {
                id: "video-2-7",
                title: "Video 2.7: Praxisfall Chatbot",
                description: "Willkommen! Sie sehen, wie Transparenzpflichten bei Chatbots praktisch umgesetzt werden.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202%207%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=f1500d79-85e8-4ea8-9173-a89b1131870d"
            },
            {
                id: "video-2-8",
                title: "Video 2.8: Praxisfall Emotionserkennung",
                description: "Willkommen! Ein Beispiel zeigt, warum Emotionserkennung am Arbeitsplatz verboten ist.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202.8%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=701a5d58-04c5-4997-82fa-d71fb7a81a66"
            },
            {
                id: "video-2-9",
                title: "Video 2.9: Compliance-Fahrplan",
                description: "Willkommen! Sie erhalten eine Roadmap bis 2026, um Ihr Unternehmen Schritt für Schritt AI-Act-konform zu machen.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%202.9%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=5710ded6-e85f-4f98-aba0-cbc5460fc2fe"
            }
        ]
    },
    {
        id: "module-3",
        title: "Modul 3 – Ethik & Kommunikation",
        videos: [
            {
                id: "video-3-1",
                title: "Video 3.1: Ethische Grundlagen",
                description: "Willkommen! Sie lernen zentrale ethische Modelle kennen – Utilitarismus, Deontologie und die Prinzipien vertrauenswürdiger KI.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Ethik%203.1%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=71b87e52-4381-40fd-a764-baf5a52ca3de"
            },
            {
                id: "video-3-2",
                title: "Video 3.2: Ethik in KMU-Prozessen",
                description: "Willkommen! Dieses Video übersetzt ethische Prinzipien in konkrete Checklisten und Verantwortlichkeiten für Ihr Unternehmen.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Ethik%203.2%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=af445328-c9f5-47bb-8fe8-f3ede6f14b33"
            },
            {
                id: "video-3-3",
                title: "Video 3.3: Interne Kommunikation",
                description: "Willkommen! Sie erfahren, wie Sie intern über KI-Einsatz informieren, Ängste abbauen und Zielgruppen gezielt ansprechen.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Ethik%203.3%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=47447b89-0eb4-4db0-a1f4-8dbd70c661bf"
            },
            {
                id: "video-3-4",
                title: "Video 3.4: Externe Kommunikation",
                description: "Willkommen! Sie lernen, wie Sie über KI gegenüber Kunden, Partnern und Medien transparent und vertrauensvoll kommunizieren.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Ethik%203.4%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=2c2bbf81-feff-452a-831e-37663d969275"
            },
            {
                id: "video-3-5",
                title: "Video 3.5: Rollenspiel „Herr Sommer“",
                description: "Willkommen! In einem Rollenspiel erleben Sie, wie empathische Kommunikation über den AI Act funktioniert.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Ethik%203.5%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=3c3bd626-5259-4f78-a015-2ac222a072ac"
            }
        ]
    },
    {
        id: "module-4",
        title: "Modul 4 – Praxis & Prüfungsvorbereitung",
        videos: [
            {
                id: "video-4-1",
                title: "Video 4.1: On-Boarding Roadmap",
                description: "Willkommen! Sie füllen den 5-Schritte-Plan aus und übertragen die Roadmap in die Praxis Ihres Unternehmens.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%204.1%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=d126f56f-e744-41db-8c24-b51dc3a73b53"
            },
            {
                id: "video-4-2",
                title: "Video 4.2: Simulation I – Chatbot",
                description: "Willkommen! In einer Simulation lernen Sie, wie ein KMU-Kunde auf Fragen zum KI-Chatbot reagiert – und wie Sie souverän antworten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%204.2%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=6c282645-80ab-404c-b419-664f05436e76"
            },
            {
                id: "video-4-3",
                title: "Video 4.3: Simulation II – Handel & Service",
                description: "Willkommen! Sie sehen, wie Datenschutz (DSGVO) und KI-Technik in einem realistischen Online-Handelsfall zusammenspielen.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%204.3%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=08c696b9-cbaa-43ac-8499-c1faeb33f3e8"
            },
            {
                id: "video-4-4",
                title: "Video 4.4: Simulation III – Gesundheitswesen",
                description: "Willkommen! Ein Praxisbeispiel zeigt die hohen Anforderungen an KI im Klinikalltag – von CE bis Patientenaufklärung.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Modul%204.4%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=7ee7c758-1948-4db1-b8af-0ecdd61afda5"
            },
            {
                id: "video-4-5",
                title: "Video 4.5: Prüfungsvorbereitung",
                description: "Willkommen! Sie erhalten die wichtigsten Fakten und Tipps für die Multiple-Choice-Prüfung.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Pru%CC%88fungsvorbereitung%20Abschluss%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=324c7e4c-0b4d-4c18-812c-c92d70f353ea"
            }
        ]
    },
    {
        id: "module-exam",
        title: "Prüfung",
        isExam: true,
        videos: [],
    },
    {
        id: "module-5",
        title: "Abschluss",
        videos: [
            {
                id: "video-5-1",
                title: "Video 5.1: Zertifikat & Updates",
                description: "Willkommen! Sie erfahren, wie Sie Ihr Zertifikat und Badge erhalten und über Newsletter-Updates auf dem Laufenden bleiben.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/EU%20AI%20Act%20Zertifizierung%20Abschluss%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=4a43337d-1e34-40b5-bbca-91ccb13de068"
            }
        ]
    },
    {
        id: "module-6",
        title: "Bonus: Implementation & Kultur",
        videos: [
            {
                id: "video-6-1",
                title: "Implementation & Kultur",
                description: "Erfahren Sie, wie das PERMA-Modell für Wohlbefinden genutzt werden kann, um KI für Menschen zu gestalten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20-%20Extra%20Video%20zu%20PERMA%20Assistenzkurs%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=cd570ac5-9ae6-4188-b215-afc636379b22"
            },
            {
                id: "video-6-2",
                title: "Implementation & Kultur",
                description: "Erfahren Sie, wie das PERMA-Modell für Wohlbefinden genutzt werden kann, um KI für Menschen zu gestalten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%201%20Einfu%CC%88hrung%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=e543b604-7d92-4eae-8000-692714982927"
            },
            {
                id: "video-6-3",
                title: "Implementation & Kultur",
                description: "Erfahren Sie, wie das PERMA-Modell für Wohlbefinden genutzt werden kann, um KI für Menschen zu gestalten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%202%20Modul%201%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=445cc5e8-3cc4-4016-86b6-4afe3ff61466"
            },
            {
                id: "video-6-4",
                title: "Implementation & Kultur",
                description: "Erfahren Sie, wie das PERMA-Modell für Wohlbefinden genutzt werden kann, um KI für Menschen zu gestalten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%203%20Modul%202%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=1ded1418-47f3-4301-b9bc-ad66dbad0ec1"
            },
            {
                id: "video-6-5",
                title: "Implementation & Kultur",
                description: "Erfahren Sie, wie das PERMA-Modell für Wohlbefinden genutzt werden kann, um KI für Menschen zu gestalten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%204%20Modul%203%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=d7a98997-c531-4d57-86c1-bb7ff1a6d6da"
            },
            {
                id: "video-6-6",
                title: "Implementation & Kultur",
                description: "Erfahren Sie, wie das PERMA-Modell für Wohlbefinden genutzt werden kann, um KI für Menschen zu gestalten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%205%20Modul%204%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=54a763a8-412b-4575-9c60-9ebb5608cabe"
            },
            {
                id: "video-6-7",
                title: "Implementation & Kultur",
                description: "Erfahren Sie, wie das PERMA-Modell für Wohlbefinden genutzt werden kann, um KI für Menschen zu gestalten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%206%20Modul%205%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=b0ce97b9-5b61-48dd-a683-3a1b9c34a78c"
            },
            {
                id: "video-6-8",
                title: "Implementation & Kultur",
                description: "Erfahren Sie, wie das PERMA-Modell für Wohlbefinden genutzt werden kann, um KI für Menschen zu gestalten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%207%20Modul%206%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=3df3df1f-6427-4e25-a197-bb63f6ed123f"
            },
            {
                id: "video-6-9",
                title: "Implementation & Kultur",
                description: "Erfahren Sie, wie das PERMA-Modell für Wohlbefinden genutzt werden kann, um KI für Menschen zu gestalten.",
                url: "https://firebasestorage.googleapis.com/v0/b/ki-eu-akt-zertifizierung.firebasestorage.app/o/Marlies%20Video%208%20Modul%207%20EU%20AI%20Act%20Zertifizierung%20(1080p_30fps_H264-128kbit_AAC).mp4?alt=media&token=32367c9a-9013-442b-b0e8-6a0d3ee26971"
            }
        ]
    }
];
