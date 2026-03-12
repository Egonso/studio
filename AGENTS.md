# Studio Agent Guardrails

Diese Datei gilt fuer alle Arbeiten in `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio` und ergaenzt die uebergeordneten Anweisungen aus dem Workspace.

## Vor jeder nicht-trivialen Aufgabe

1. Lies `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/STUDIO_AGENT_START_HERE.md`.
2. Wenn die Aufgabe Register, Capture, Login, Landing, Supplier-Request oder Workflow-Verknuepfung betrifft, lies zusaetzlich `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/REGISTER_FIRST_SPRINT_PROMPTS_2026-03-12.md`.
3. Wenn API oder Datenmodell betroffen sind, aktualisiere die passende Doku in `docs/` im selben Arbeitsgang.

## Verbindliche Delivery-Regeln

1. Arbeite nie direkt auf `main`. Wenn du nicht auf einem `codex/*`-Branch bist, lege zuerst einen an.
2. Ein PR, ein Hauptziel. Keine Sammel-PRs ueber mehrere Themen.
3. Rueckwaertskompatibilitaet ist Standard. Breaking Changes nur mit Migrationsplan.
4. Neue groessere Flows hinter Feature-Flags, standardmaessig `false`, bis Freigabe vorliegt.
5. Keine versteckte Automatisierung von Governance-Entscheidungen.

## Mindeststandard pro Aenderung

1. Klare Typen und Schemas.
2. Explizite Fehlerbehandlung.
3. Mindestens Smoke- oder Integration-Tests passend zum Scope.
4. Kurze technische Notiz in `docs/`:
   - Warum
   - Datenfluss
   - Risiken
   - Rollback

## Produkt- und UI-Regeln

1. Das Register ist `Record of Truth`. Control ist abgeleitete, organisationsweite Steuerung. Diese Ebenen nicht vermischen.
2. Der KI-Einsatzfall ist die primaere Governance-Einheit, nicht Tool, Prompt oder Vendor.
3. Capture muss schnell, ruhig und ohne Governance-Theater sein. Erst erfassen, dann strukturieren.
4. Jede Seite hat genau ein primaeres Objekt. Aktionen anderer Ebenen duerfen dieses Objekt nicht visuell ueberlagern.
5. Trenne sauber:
   - Objektaktionen
   - formale Workflow-Aktionen
   - Organisations-Utilities
6. Utilities sind kontextabhaengig, nicht global auf jeder Seite.
7. Statusfarben nur gemaess UI-Charta:
   - Grau fuer `UNREVIEWED` und `REVIEW_RECOMMENDED`
   - Blau fuer `REVIEWED`
   - Gruen fuer `PROOF_READY`
8. Keine Default-Ambers, keine roten KPI-Dramen, keine SaaS-RAG-Optik im Register.
9. Register-Kontext ist dokumentenzentriert und institutionell ruhig, nicht werblich.
10. Im Register-Kontext kein aggressives Upsell-Wording und moeglichst kein `Dashboard`-Framing.

## Konfliktregel fuer Doku

Wenn Dokumente sich widersprechen, gilt diese Reihenfolge:

1. `AGENTS.md`
2. `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/STUDIO_AGENT_START_HERE.md`
3. task-spezifische Doku in `docs/`
4. `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/AGENT_PROMPT_AND_WORKFLOW.md` nur als aelterer Hintergrund
