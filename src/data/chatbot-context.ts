/**
 * Comprehensive chatbot context: site tree, feature descriptions, and FAQ.
 * Used by site-chatbot.ts to give the assistant full knowledge of the platform.
 */

export const SITE_TREE = `
SITEMAP — EuKIGesetz Studio (fortbildung.eukigesetz.com)

🏠 HAUPTNAVIGATION (eingeloggte User):
├── /dashboard .............. Register-Übersicht (Alias)
│   Technischer Kompatibilitäts-Pfad für die Register-Übersicht.
│   Fokus: Dokumentation und Governance-Status im Register-Kontext.
│
├── /control ................ AI Governance Control
│   Organisationsweite Steuerungsebene (Feature-Flag gesteuert):
│   - KPI Header
│   - Governance Maturity Model
│   - Action Queue (priorisierte Maßnahmen)
│   - Portfolio-, Audit- und Policy-Module
│
├── /projects ............... Meine Projekte (KI-Einsatzfälle)
│   Zentrale Verwaltung aller KI-Projekte/Einsatzfälle:
│   - Neues Projekt erstellen (Name, Beschreibung, Risikokategorie)
│   - Projekte bearbeiten, löschen, archivieren
│   - Pro Projekt: Risikoklasse, Status, Compliance-Fortschritt
│   - Jedes Projekt kann AI-Tools zuordnen
│
├── /cbs .................... Smart Policy Engine
│   KI-gestützte Compliance-Richtlinien erstellen:
│   - Automatische Richtlinienerstellung basierend auf Projektdaten
│   - Richtlinien bearbeiten, exportieren, teilen
│   - Mapping auf EU AI Act Artikel
│   └── /cbs/share/[policyId] ... Geteilte Richtlinie (öffentlicher Link)
│
├── /cbd .................... Compliance by Design
│   Anforderungen direkt in die Entwicklung integrieren:
│   - Design Canvas für KI-Anforderungen
│   - Compliance-Checks während der Entwicklung
│   - Integration von Transparenz, Fairness, Sicherheit
│
├── /kurs ................... AI-Act-Kompetenz Kurs
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
├── /my-register ............ AI Governance Register
│   Formale Dokumentation aller KI-Einsatzfälle:
│   - Quick Capture: Schnellerfassung von Use Cases
│   - Status-Workflow: Prüfung ausstehend → empfohlen → abgeschlossen → nachweisfähig
│   - Öffentliche Verifizierung einzelner Einträge
│   - Organisation & Scope-Einstellungen (Zahnrad-Icon)
│   - Register-Kennzahlen: Registrierte Fälle, Status-Verteilung
│
├── /capture ................. Standalone Quick Capture
│   Schnellerfassung eines KI-Einsatzfalls (ohne Register-Kontext)
│
├── /ai-management .......... KI-Management System
│   Überblick und Verwaltung aller KI-Systeme:
│   - Tool-Inventar
│   - Risikobewertungen
│   - Compliance-Status je Tool
│
├── /aims ................... AIMS Setup (AI Management System)
│   Ersteinrichtung des KI-Management-Systems:
│   - Wizard-basierte Konfiguration
│   - Organisationskontext definieren
│
├── /audit-report ........... Audit Report
│   Generierung von Compliance-Berichten:
│   - Automatischer Report basierend auf Projektdaten
│   - Export-Funktionen
│   - Auflistung von Compliance-Lücken
│
├── /portfolio .............. Compliance-Portfolio
│   Gesamtansicht aller Compliance-Nachweise:
│   - Projektstatus-Übersicht
│   - Dokumentationsstatus
│   - Reifegradanzeige
│
├── /assessment ............. Risiko-Assessment
│   AI-Risikobewertung durchführen:
│   - Geführter Assessment-Wizard
│   - Risikoklassifizierung nach EU AI Act
│   └── /assessment/context ... Kontextbezogenes Assessment
│
└── /login .................. Anmeldeseite
    Login/Registrierung für die Plattform

🌐 ÖFFENTLICHE SEITEN (kein Login erforderlich):
├── / ....................... Landingpage
├── /verify/[code] ......... Verifikationsseite (Code-basiert)
├── /verify/pass/[hashId] .. Verifikations-Pass (öffentliche Use-Case Prüfung)
├── /trust/[projectId] ..... Öffentliches Trust Portal
└── /cbs/share/[policyId] .. Geteilte Compliance-Richtlinie
`;

export const FEATURE_OVERVIEW = `
FEATURES & FUNKTIONEN — EuKIGesetz Studio

═══════════════════════════════════════════════════════════

📊 REGISTER-ÜBERSICHT (/dashboard Alias)
Was es tut: Zentraler Überblick über Register-Status und Dokumentationsstand
Für wen: Alle eingeloggten Nutzer
Kernfunktionen:
- Register-Status und offene Prüfungen auf einen Blick
- Schnellzugriff auf Register und Capture
- Kompatibler Einstiegspunkt für bestehende /dashboard-Links
- Keine Vermischung mit der organisationsweiten Control-Ebene

═══════════════════════════════════════════════════════════

🧭 AI GOVERNANCE CONTROL (/control)
Was es tut: Organisationsweite Steuerung und Governance-Reifegrad
Für wen: Governance Leads, Compliance-Leitung, Audit-Verantwortliche
Kernfunktionen:
- KPI Header (10-Sekunden-Überblick)
- Maturity Level (Level 1-5)
- Priorisierte Maßnahmen mit Deep Links ins Register
- Organisationsweite Audit-, Policy- und Export-Funktionen

═══════════════════════════════════════════════════════════

📂 PROJEKTE & EINSATZFÄLLE (/projects)
Was es tut: Verwaltung aller KI-Projekte und Einsatzfälle
Für wen: Compliance-Verantwortliche, Projektleiter
Kernfunktionen:
- Neues Projekt anlegen mit Name, Beschreibung, Kategorie
- Risikokategorie zuweisen (minimal, begrenzt, hoch, verboten)
- Tools/KI-Systeme dem Projekt zuordnen
- Compliance-Status pro Projekt verfolgen
- Projekte archivieren oder löschen

═══════════════════════════════════════════════════════════

⚙️ SMART POLICY ENGINE (/cbs)
Was es tut: Automatische Erstellung von Compliance-Richtlinien
Für wen: Compliance-Verantwortliche, Rechtsabteilung
Kernfunktionen:
- KI-gestützte Richtlinienerstellung
- Mapping auf EU AI Act Artikel
- Richtlinien bearbeiten und anpassen
- Teilen per öffentlichem Link (/cbs/share/...)
- Export als Dokument

═══════════════════════════════════════════════════════════

🎨 COMPLIANCE BY DESIGN (/cbd)
Was es tut: Compliance-Anforderungen in den Entwicklungsprozess integrieren
Für wen: Entwickler, Product Owner, Compliance-Beauftragte
Kernfunktionen:
- Design Canvas für KI-Anforderungen
- Transparenz-, Fairness- und Sicherheitschecks
- Integration in die Produktentwicklung

═══════════════════════════════════════════════════════════

🎓 AI-ACT-KOMPETENZ KURS (/kurs)
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

📋 AI GOVERNANCE REGISTER (/my-register)
Was es tut: Formale Dokumentation aller KI-Einsatzfälle
Für wen: Compliance-Officer, Datenschutzbeauftragte
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
- Register-Kennzahlen

═══════════════════════════════════════════════════════════

🔍 RISIKO-ASSESSMENT (/assessment)
Was es tut: Geführte Risikobewertung von KI-Systemen
Für wen: Projektleiter, Risk Manager
Kernfunktionen:
- Wizard-basiertes Assessment
- Risikoklassifizierung nach EU AI Act Kategorien
- Kontextbezogene Bewertung

═══════════════════════════════════════════════════════════

📊 AUDIT REPORT (/audit-report)
Was es tut: Automatisierte Compliance-Berichte generieren
Für wen: Management, Audit-Teams, externe Prüfer
Kernfunktionen:
- Automatischer Report aus Projektdaten
- Compliance-Lücken identifizieren
- Export-Funktionen

═══════════════════════════════════════════════════════════

🌐 TRUST PORTAL (/trust/[projectId])
Was es tut: Öffentlich einsehbarer Compliance-Nachweis
Für wen: Externe Stakeholder, Kunden, Regulatoren
Kernfunktionen:
- Öffentliche Darstellung des Compliance-Status
- Vertrauensscore
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
A: Beginne mit einem Projekt unter /projects. Erstelle dort deinen ersten KI-Einsatzfall. 
   Dann nutze den Kurs (/kurs) für das nötige Grundwissen und die Zertifizierung (/exam).

Q: "Wo finde ich den Text vom EU AI Act?"
A: Unter /gesetz findest du den Volltext. Du kannst direkt zu Artikeln springen, z.B. /gesetz#art_5.

Q: "Wie dokumentiere ich unsere KI-Nutzung?"
A: Nutze das AI Governance Register unter /my-register. Klicke auf "+ Erfassen" für Quick Capture.
   Dort gibst du den Use-Case-Namen, das genutzten Tool und den Datenkontext an.

Q: "Was ist der Unterschied zwischen Projekten und Register?"
A: Projekte (/projects) = tiefe Compliance-Analyse einzelner KI-Vorhaben.
   Register (/my-register) = schnelle, formale Dokumentation aller KI-Einsatzfälle (Governance).

Q: "Wie erstelle ich eine Richtlinie?"
A: Gehe zur Smart Policy Engine (/cbs). Dort kannst du KI-gestützt Compliance-Richtlinien erstellen,
   die automatisch auf relevante EU AI Act Artikel gemappt werden.

Q: "Wie kann ich den Compliance-Status öffentlich zeigen?"
A: Konfiguriere dein Trust Portal in der Register-Übersicht (/dashboard, Alias) oder im Register. Es erstellt eine öffentliche Seite 
   unter /trust/[projektId], die Kunden und Partnern deinen Compliance-Status zeigt.

Q: "Was passiert nach der Zertifizierungsprüfung?"
A: Nach Bestehen der Prüfung (/exam) erhältst du ein Zertifikat. Dieses kann auch über das 
   Verifikationssystem (/verify) von Dritten überprüft werden.

Q: "Wie mache ich einen Use Case öffentlich verifizierbar?"
A: Im Register (/my-register): Öffne das 3-Punkt-Menü beim Eintrag → "Öffentlich machen".
   Dann kannst du den Verify-Link kopieren und teilen.
`;
