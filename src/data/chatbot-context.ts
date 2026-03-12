/**
 * Comprehensive chatbot context: site tree, feature descriptions, and FAQ.
 * Used by site-chatbot.ts to give the assistant full knowledge of the platform.
 */

export const SITE_TREE = `
SITEMAP — EuKIGesetz Studio (kiregister.com)

🏠 HAUPTNAVIGATION (eingeloggte User):
├── /my-register ............ AI Governance Register
│   Kanonische Free-Register Oberfläche:
│   - Register-Überblick
│   - Use Cases
│   - External Inbox
│   - Quick Capture und Use-Case Pässe
│
├── /control ................ AI Governance Control
│   Kanonische bezahlte Governance-Steuerung:
│   - KPI Header
│   - Governance Maturity Model
│   - Action Queue (priorisierte Maßnahmen)
│   - Policies, Exports, Trust Portal, Academy
│
├── /control/policies ....... Policy Engine
│   Organisationsweite Richtlinien und Policy-Steuerung
│
├── /control/exports ........ Export Center
│   Organisationsweite Audit- und Nachweis-Exporte
│
├── /control/trust .......... Trust Portal Management
│   Öffentliche Vertrauenssignale und Verify-Ausgaben
│
├── /academy ................. AI Governance Academy
│   Strukturierter Online-Kurs zum EU AI Act:
│   - Module 1-5 mit Videos und Materialien
│   - Fortschrittsanzeige pro Modul
│   - Download von Arbeitsmaterialien (PDF)
│   - Videobasiertes Lernen mit Praxisfällen
│
├── /gesetz ................. EU AI Act Volltext-Viewer
│   Volltext des EU AI Act zum Nachschlagen:
│   - Alle 113 Artikel durchsuchbar
│   - 180 Erwägungsgründe
│   - Deep-Linking zu einzelnen Artikeln (#art_5)
│   - Sprungmarken und Kapitelnavigation
│
├── /exam ................... Zertifizierungsprüfung
│   Abschlusstest für die AI-Act-Kompetenz:
│   - Multiple-Choice Prüfung
│   - Bestehensgrenze und Ergebnisanzeige
│   - Zertifikat nach Bestehen
│
├── /capture ................. Standalone Quick Capture
│   Schnellerfassung eines KI-Einsatzfalls (ohne Register-Kontext)
│
└── /login .................. Anmeldeseite
    Login/Registrierung für die Plattform

🌐 ÖFFENTLICHE SEITEN (kein Login erforderlich):
├── / ....................... Landingpage
├── /erfassen ............... Öffentliche Erfassung per Zugangscode
├── /request/[requestToken] ... Öffentliche Lieferantenanfrage
├── /verify/[code] ......... Verifikationsseite (Code-basiert)
├── /verify/pass/[hashId] .. Verifikations-Pass (öffentliche Use-Case Prüfung)
├── /trust/[projectId] ..... Öffentliches Trust Portal
└── /cbs/share/[policyId] .. Geteilte Compliance-Richtlinie
`;

export const FEATURE_OVERVIEW = `
FEATURES & FUNKTIONEN — EuKIGesetz Studio

═══════════════════════════════════════════════════════════

📋 AI GOVERNANCE REGISTER (/my-register)
Was es tut: Formale Dokumentation aller KI-Einsatzfälle
Für wen: Free-Register Nutzer, Compliance-Officer, Datenschutzbeauftragte
Kernfunktionen:
- Quick Capture: Use Cases schnell erfassen (Name, Tool, Kontext, Daten)
- 4-stufiger Status-Workflow:
  • Formale Prüfung ausstehend
  • Prüfung empfohlen
  • Prüfung abgeschlossen
  • Nachweisfähig
- Öffentliche Verifizierung einzelner Einträge
- Organisations-Scope konfigurieren (Name, Einheit)
- Audit-Trail mit Statusänderungen
- External Inbox für tracebare externe Einreichungen

═══════════════════════════════════════════════════════════

🧭 AI GOVERNANCE CONTROL (/control)
Was es tut: Organisationsweite Steuerung und Governance-Reifegrad
Für wen: Governance Leads, Compliance-Leitung, Audit-Verantwortliche
Kernfunktionen:
- KPI Header (10-Sekunden-Überblick)
- Maturity Level (Level 1-5)
- Priorisierte Maßnahmen mit Deep Links ins Register
- Organisationsweite Policy-, Export- und Trust-Funktionen

═══════════════════════════════════════════════════════════

⚙️ POLICY ENGINE (/control/policies)
Was es tut: Automatische Erstellung von Compliance-Richtlinien
Für wen: Compliance-Verantwortliche, Rechtsabteilung
Kernfunktionen:
- KI-gestützte Richtlinienerstellung
- Mapping auf EU AI Act Artikel
- Richtlinien bearbeiten und anpassen
- Teilen per öffentlichem Link (/cbs/share/...)
- Export als Dokument

═══════════════════════════════════════════════════════════

📦 EXPORT CENTER (/control/exports)
Was es tut: Organisationsweite Audit- und Nachweis-Exporte bündeln
Für wen: Audit, Compliance-Leitung, Procurement, externe Prüfer
Kernfunktionen:
- Governance Report
- ISO / Audit Dossier
- Policy Bundle
- Trust Portal Bundle

═══════════════════════════════════════════════════════════

🎓 AI GOVERNANCE ACADEMY (/academy)
Was es tut: Strukturierter Lernkurs zum EU AI Act
Für wen: Alle Mitarbeiter, die mit KI arbeiten
Kernfunktionen:
- 5 Module mit Videos und Arbeitsmaterialien
- Fortschrittsanzeige pro Modul/Video
- PDF-Downloads für jedes Thema
- Praxisorientierte Fallstudien
Module:
1. Grundlagen des EU AI Act
2. Risikoklassen und Pflichten
3. Technische Compliance
4. Praxis-Simulationen
5. Implementation & Governance

═══════════════════════════════════════════════════════════

📜 EU AI ACT VOLLTEXT (/gesetz)
Was es tut: Vollständiger Gesetzestext zum Durchsuchen
Für wen: Alle, die den Originaltext nachschlagen wollen
Kernfunktionen:
- 113 Artikel + 180 Erwägungsgründe
- Volltextsuche
- Deep-Linking (z.B. /gesetz#art_5)
- Kapitelnavigation

═══════════════════════════════════════════════════════════

📝 ZERTIFIZIERUNGSPRÜFUNG (/exam)
Was es tut: Kompetenznachweis durch Abschlusstest
Für wen: Kursteilnehmer nach Abschluss aller Module
Kernfunktionen:
- Multiple-Choice Prüfung
- Sofortige Ergebnisanzeige
- Zertifikat bei Bestehen

═══════════════════════════════════════════════════════════

🌐 TRUST & VERIFY
Was es tut: Öffentlich einsehbarer Compliance-Nachweis
Für wen: Externe Stakeholder, Kunden, Regulatoren
Kernfunktionen:
- Öffentliche Verify-Pässe für einzelne Use Cases
- Trust Portal Ausgabe für geteilte Nachweise
- Keine Anmeldung erforderlich

═══════════════════════════════════════════════════════════

✅ VERIFIKATION (/verify/pass/[hashId])
Was es tut: Öffentlicher Nachweis für einzelne Use Cases
Für wen: Externe, denen ein Verify-Link geteilt wurde
Kernfunktionen:
- Use-Case Details einsehen
- Status und Datenbank-Referenz prüfen
- Kein Login erforderlich
`;

export const COMMON_QUESTIONS = `
HÄUFIGE NUTZER-SZENARIEN (Chatbot-Wissen)

Q: "Wie starte ich mit der Compliance?"
A: Starte im Register unter /my-register. Erfasse dort deinen ersten KI-Einsatzfall.
   Für Governance-Aufbau und Richtlinien geht es danach in /control und /control/policies weiter.

Q: "Wo finde ich den Text vom EU AI Act?"
A: Unter /gesetz findest du den Volltext. Du kannst direkt zu Artikeln springen, z.B. /gesetz#art_5.

Q: "Wie dokumentiere ich unsere KI-Nutzung?"
A: Nutze das AI Governance Register unter /my-register. Klicke auf "+ Erfassen" für Quick Capture.
   Dort gibst du den Use-Case-Namen, das genutzten Tool und den Datenkontext an.

Q: "Was ist der Unterschied zwischen Register und Control?"
A: Register (/my-register) = schnelle, formale Dokumentation aller KI-Einsatzfälle.
   Control (/control) = organisationsweite Steuerung mit Policies, Exports, Trust und Academy.

Q: "Wie erstelle ich eine Richtlinie?"
A: Gehe zur Policy Engine unter /control/policies. Dort kannst du KI-gestützt Compliance-Richtlinien erstellen,
   die automatisch auf relevante EU AI Act Artikel gemappt werden.

Q: "Wie kann ich den Compliance-Status öffentlich zeigen?"
A: Nutze /control/trust für die interne Steuerung und aktiviere öffentliche Nachweise direkt an den Use Cases im Register.
   Öffentliche Verify-Links laufen über /verify/pass/[hashId].

Q: "Was passiert nach der Zertifizierungsprüfung?"
A: Nach Bestehen der Prüfung (/exam) erhältst du ein Zertifikat. Dieses kann auch über das 
   Verifikationssystem (/verify) von Dritten überprüft werden.

Q: "Wie mache ich einen Use Case öffentlich verifizierbar?"
A: Im Register (/my-register): Öffne das 3-Punkt-Menü beim Eintrag → "Öffentlich machen".
   Dann kannst du den Verify-Link kopieren und teilen.
`;
