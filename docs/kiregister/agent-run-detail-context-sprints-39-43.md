# KIRegister Agent Run Detail Context Sprints 39-43

Stand: 2026-06-17
Status: Lokal implementiert und validiert

## Ziel

Dieser Block macht Agentenläufe nicht nur zählbar, sondern erklärbar.

Ein Run-Protokoll soll zeigen, welche Quellen übersprungen wurden und warum.
Das hilft besonders dann, wenn der Agent keine Kandidaten findet oder weniger
findet als erwartet.

## Enthaltene Sprints

### Sprint 39: Skipped Sources im Run-Protokoll

`agentRuns` speichern jetzt bounded `skippedSources`.

Pro Eintrag:

- Quelle
- optional aufgelöster Pfad
- Grund

Maximal 50 Einträge werden gespeichert.

### Sprint 40: CLI-Übertragung

`studio-agent operator run submit` überträgt `skippedSources` aus lokalen
Autopilot-Run-JSONs.

### Sprint 41: Run-Detail in der Review-Inbox

Wenn ein Run in der Review-Inbox als Filter aktiv ist, lädt die UI zusätzlich
das Run-Detail.

Sichtbar werden:

- Evidenzanzahl
- übersprungene Quellen
- Fehlertext
- Liste der übersprungenen Quellen

### Sprint 42: Ruhige Fehlerdarstellung

Fehler und übersprungene Quellen werden sachlich dargestellt. Keine
Alarmästhetik, keine dramatische Dringlichkeit.

### Sprint 43: Blockabschluss

Der Block ist gegen ESLint, Typecheck und Run-Modelltests validiert.

## Akzeptanzkriterien

- Run-Protokolle können übersprungene Quellen speichern.
- Lokale Autopilot-Run-Dateien übertragen diese Quellen.
- Die Review-Inbox zeigt Detailkontext zum aktiven Run.
- Lange Pfade brechen sauber um.
- Keine neue Mutation entsteht in der Review-Inbox.

## Nächste sinnvolle Blöcke

- visueller Preview-/Browser-Check der Review-Inbox
- signierbarer Audit-Anhang für Candidate-Review-Auszüge
- kleinere Copy-/Dichteprüfung der Agent-Kit-Settings nach UI-Charta
