import { z } from "zod";

const ctaSchema = z.object({
  label: z.string().min(3),
  href: z.string().startsWith("/"),
  style: z.enum(["primary", "secondary"]),
});

const scenarioSchema = z.object({
  area: z.string().min(2),
  description: z.string().min(12),
});

const landingPageContentSchema = z.object({
  hero: z.object({
    eyebrow: z.string().min(3),
    headline: z.string().min(10),
    subline: z.string().min(20),
    primaryCta: ctaSchema,
    secondaryCta: ctaSchema,
  }),
  problem: z.object({
    title: z.literal("Schatten-KI ist der Normalzustand."),
    intro: z.string().min(20),
    scenarios: z.array(scenarioSchema).length(3),
    consequenceLabel: z.string().min(10),
    consequences: z.array(z.string().min(8)).min(3),
  }),
  solution: z.object({
    title: z.literal("Transparenz ist der erste Schritt."),
    intro: z.string().min(20),
    outcomes: z.array(z.string().min(8)).length(5),
  }),
  free: z.object({
    title: z.literal("Dokumentation ist kein Premium-Feature."),
    copy: z.string().min(20),
  }),
  extension: z.object({
    title: z.literal("Wenn Organisationen ihre KI systematisch steuern wollen."),
    copy: z.string().min(20),
  }),
  closing: z.object({
    title: z.literal("Beginnen Sie mit Transparenz."),
    copy: z.string().min(12),
    primaryCta: ctaSchema,
    supportLine: z.string().min(8),
  }),
});

export type LandingPageContent = z.infer<typeof landingPageContentSchema>;

export const landingPageContent: LandingPageContent = landingPageContentSchema.parse({
  hero: {
    eyebrow: "AI Governance Register",
    headline: "Schatten-KI existiert bereits. Ohne Register bleibt sie unsichtbar.",
    subline:
      "Erfassen Sie KI-Anwendungen mit Quick Capture in unter 30 Sekunden. Das Register bleibt dauerhaft kostenlos und schafft eine nachvollziehbare Grundlage für den EU AI Act.",
    primaryCta: {
      label: "KI-Anwendung jetzt erfassen",
      href: "/capture",
      style: "primary",
    },
    secondaryCta: {
      label: "Register öffnen",
      href: "/my-register",
      style: "secondary",
    },
  },
  problem: {
    title: "Schatten-KI ist der Normalzustand.",
    intro:
      "In fast jeder Organisation wird KI bereits genutzt, bevor ein formaler Governance-Rahmen steht. Das ist kein Ausnahmefall, sondern Alltag.",
    scenarios: [
      {
        area: "Marketing",
        description: "Teams nutzen KI-Tools für Content, Analysen und Kampagnensteuerung.",
      },
      {
        area: "HR",
        description: "Screening- und Assistenzprozesse werden mit KI getestet und erweitert.",
      },
      {
        area: "IT",
        description: "APIs werden eingebunden, Workflows automatisiert und Modelle integriert.",
      },
    ],
    consequenceLabel: "Ohne Register entsteht Unklarheit:",
    consequences: [
      "Verantwortlichkeiten bleiben offen.",
      "Risiken werden uneinheitlich bewertet.",
      "Die AI-Act-Lage ist nicht belastbar dokumentiert.",
    ],
  },
  solution: {
    title: "Transparenz ist der erste Schritt.",
    intro:
      "Das AI Governance Register ist der offene Standard für KI-Dokumentation. Es bleibt dauerhaft kostenlos und macht KI-Einsatz im Unternehmen strukturiert sichtbar.",
    outcomes: [
      "Quick Capture in unter 30 Sekunden.",
      "Strukturierte Erfassung je KI-Anwendung.",
      "Risikoklassifizierung mit nachvollziehbarer Grundlage.",
      "Klare Zuordnung von Verantwortlichkeiten.",
      "Use-Case-Pass als PDF und JSON.",
    ],
  },
  free: {
    title: "Dokumentation ist kein Premium-Feature.",
    copy:
      "Transparenz ist Mindeststandard. KI-Verantwortung beginnt mit Klarheit. Deshalb bleibt das AI Governance Register dauerhaft kostenlos, ohne Begrenzung.",
  },
  extension: {
    title: "Wenn Organisationen ihre KI systematisch steuern wollen.",
    copy:
      "Das AI Governance Register ist der offene Standard für KI-Dokumentation und bleibt dauerhaft kostenlos. Organisationen erfassen ihre KI-Anwendungen transparent, nachvollziehbar und EU-AI-Act-konform. Wer seine Organisation KI-gerecht steuern will, ergänzt das Register mit AI Governance Control für zeitgemäße KI-Governance.",
  },
  closing: {
    title: "Beginnen Sie mit Transparenz.",
    copy:
      "Starten Sie mit dem Register, bevor Risiken und Verantwortlichkeiten unsichtbar werden.",
    primaryCta: {
      label: "KI-Anwendung jetzt erfassen",
      href: "/capture",
      style: "primary",
    },
    supportLine: "Ohne Verpflichtung. Ohne Kosten.",
  },
});
