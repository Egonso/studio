# Register-First Sprint Prompts

Stand: 2026-03-12  
Projekt: `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio`

Diese Datei enthaelt ausgearbeitete Copy-Paste-Prompts fuer die aktuell priorisierten Register-First-Sprints. Die Prompts sind bewusst so formuliert, dass ein Agent nicht nur plant, sondern den Slice end-to-end umsetzt: Analyse, Implementierung, Verifikation, Doku.

## Nutzung

1. Pro Sprint einen eigenen Thread.
2. Pro Sprint einen eigenen `codex/*`-Branch.
3. Keine zwei Prompts gleichzeitig auf dieselben UI-Dateien ansetzen.
4. Vor jedem Sprint:
   - `AGENTS.md`
   - `docs/STUDIO_AGENT_START_HERE.md`
   - die im Prompt genannten Zusatzdokumente lesen
5. Jede Umsetzung braucht:
   - Typen/Schemas
   - Fehlerbehandlung
   - Tests passend zum Scope
   - kurze technische Notiz in `docs/`

## Empfohlene Reihenfolge

1. Sprint 0
2. Sprint 1
3. Sprint 2
4. Sprint 3
5. Sprint 4
6. Sprint 5
7. Sprint 6

## Standard-Output fuer jeden Sprint

Jeder Agent soll am Ende genau diese Punkte liefern:

1. Kurze Zusammenfassung des umgesetzten Ziels
2. Liste der geaenderten Dateien
3. Verifikationsresultate
4. Offene Risiken oder Annahmen
5. Rollback-Hinweis

---

## Sprint 0 - Runtime-Stabilitaet und Ladefehler isolieren

```text
Du arbeitest im Projekt /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio.

Arbeite auf einem neuen Branch:
codex/runtime-stability-load-fix

Lies vor der Arbeit:
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/AGENTS.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/STUDIO_AGENT_START_HERE.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/server-output-debug.log

TASK:
Analysiere und behebe den aktuellen Seiten-Ladefehler reproduzierbar. Behandle das Ticket nicht als diffuses "irgendwas laedt manchmal nicht", sondern als klaren Stabilisierungssprint mit Root-Cause-Diagnose.

WICHTIGE KRITIK AM AUSGANGSTICKET:
- "Seiten-Ladefehler" ist zu unscharf.
- Im Repo gibt es mehrere moegliche Fehlerquellen.
- Das Log zeigt mindestens einen harten 500er fuer /ai-management.
- Es gibt ausserdem Runtime-Reloads und keine sauber nachgewiesene Baseline.

KONKRETER KONTEXT:
- Server-Log: /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/server-output-debug.log
- Betroffene Route mit dokumentiertem 500er: /ai-management
- Primaere Startdatei: /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/app/ai-management/page.tsx

ZIEL:
1) Den konkreten Ladefehler lokal reproduzieren.
2) Die genaue Ursache isolieren.
3) Nur die zusammenhaengende Ursache beheben, ohne nebenbei unverbundene Baustellen aufzureissen.
4) Eine kleine, nachvollziehbare Verifikation hinterlassen.

IN SCOPE:
- kaputter default export einer Seite
- fehlerhafte Komposition einer App-Router-Page
- Import-/Render-Probleme mit direktem Bezug zum 500er
- kleine Guardrails gegen denselben Fehler erneut

OUT OF SCOPE:
- globaler Refactor des Routings
- Aufraeumen aller Runtime-Warnungen ohne direkten Bezug
- paralleles Abarbeiten anderer Tickets
- Grossumbau von AIMS/Management-Architektur

UMSETZUNGSAUFTRAEGE:
1. Reproduziere den Fehler lokal und dokumentiere:
   - Route
   - Fehlermeldung
   - Root Cause
2. Lies die betroffene Route und zusammenhaengende Imports.
3. Behebe nur die zusammenhaengende Ursache.
4. Falls sinnvoll, fuege einen kleinen Smoke-Check oder Guardrail hinzu.
5. Erstelle eine technische Notiz in docs/ mit:
   - Symptom
   - Root Cause
   - Fix
   - Verifikation
   - Restrisiken
   - Rollback

VALIDIERUNG:
- npm run lint
- npm run typecheck
- wenn moeglich: lokaler Route-Smoke fuer /ai-management

WICHTIG:
- Wenn lint oder typecheck bereits durch bestehende Altfehler blockiert sind, benenne praezise, was neu ist und was Altlast ist.
- Keine stillen Nebenaenderungen in Login, Capture oder Register.

ERWARTETES ENDERGEBNIS:
- Route laedt wieder ohne 500
- Root Cause ist dokumentiert
- Verifikation ist nachvollziehbar
```

---

## Sprint 1 - Capture Validation + Custom Tool UX

```text
Du arbeitest im Projekt /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio.

Arbeite auf einem neuen Branch:
codex/capture-validation-custom-tool

Lies vor der Arbeit:
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/AGENTS.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/STUDIO_AGENT_START_HERE.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/PUBLIC_CAPTURE_QUICK_PARITY_2026-03-08.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/QUICK_CAPTURE_OWNER_ROLE_2026-03-06.md

TASK:
Behebe den stillen Quick-Capture-Fehler im Flow "Erfassungslink teilen" und ersetze die frustrierende "Kein Tool gefunden"-Leerstelle durch eine produktive Custom-Tool-Aktion.

WICHTIGE KRITIK AM AUSGANGSTICKET:
- Das Problem sitzt sehr wahrscheinlich nicht nur im Modal, sondern auch in /erfassen.
- Aktuell wird Speichern ueber disabled-Zustaende blockiert, aber nicht sauber validiert.
- Die UI signalisiert Pflichtfelder nicht konsistent gegen die reale Speicherlogik.
- Das ist ein UX- und Konsistenzproblem, nicht nur ein einzelner Bug.

KONKRETER KONTEXT:
- Quick Capture Modal:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/components/register/quick-capture-modal.tsx
- Gemeinsame Capture-Felder:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/components/register/quick-capture-fields.tsx
- Public Capture:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/app/erfassen/page.tsx
- Tool Autocomplete:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/components/tool-autocomplete.tsx

ZIEL:
1) Reproduziere das Verhalten im Quick-Capture-Kontext.
2) Definiere sauber, welche Felder fachlich Pflicht sind und welche nur visuell "rot markiert" waren.
3) Fuehre eine gemeinsame Validierungslogik fuer Quick Capture und /erfassen ein.
4) Zeige echte Inline-Fehler oder deutliche Feldmarkierungen statt stiller Blockade.
5) Sorge dafuer, dass unbekannte Tools nicht als Fehler-Ende wirken, sondern als "Custom Tool anlegen".

IN SCOPE:
- gemeinsame Validierungslogik fuer Capture-Felder
- sichtbare Fehlerrueckmeldung
- Fokussierung des ersten fehlerhaften Felds oder aehnlich klare Nutzerfuehrung
- CTA fuer Custom Tool statt "Kein Tool gefunden"
- Tests fuer Validierungslogik oder kritische Feldfaelle

OUT OF SCOPE:
- kompletter Redesign des Capture-Flows
- neues grosses Tool-Datenmodell
- Neubau eines Tool-Management-Backends
- Login-/Landing-Refactor

UMSETZUNGSAUFTRAEGE:
1. Reproduziere den fehlerhaften Flow fuer "Erfassungslink teilen".
2. Vergleiche Quick Capture und /erfassen fachlich und technisch.
3. Ziehe Validierungsregeln in einen gemeinsamen Helper, wenn das die Paritaet verbessert.
4. Implementiere:
   - Inline-Fehler oder Feld-Highlighting
   - klare, lesbare Fehlermeldung
   - Fokus/Scroll auf das erste Problemfeld
5. Passe das Tool-Autocomplete an:
   - statt "Kein Tool gefunden" soll eine produktive CTA erscheinen
   - Formulierung ruhig und sachlich, kein Fehlerton
6. Dokumentiere die Entscheidung in docs/:
   - alte stille Validierung
   - neue Pflichtfelder
   - Paritaet zwischen Modal und Public Capture
   - Risiken
   - Rollback

AKZEPTANZKRITERIEN:
1) Kein stiller Abbruch mehr.
2) Pflichtfelder sind fuer Nutzer klar erkennbar.
3) Quick Capture und /erfassen verhalten sich gleich.
4) Unbekannte Tools fuehren zu einer produktiven Aktion statt zu einer Sackgasse.
5) Tests decken die neue Logik mindestens als Smoke-/Unit-Fall ab.

VALIDIERUNG:
- npm run lint
- npm run typecheck
- relevante Tests fuer Capture-/Validierungslogik
- manueller Smoke:
  - Quick Capture mit fehlenden Feldern
  - /erfassen mit fehlenden Feldern
  - unbekanntes Tool eingeben

WICHTIG:
- Die UI-Charta gilt auch hier: ruhig, sachlich, keine Alarmoptik.
- Wenn ein Feld fachlich nicht mehr Pflicht sein soll, aendere nicht nur die UI, sondern auch die Logik und Doku konsistent.

ERWARTETES ENDERGEBNIS:
- konsistente Capture-Validierung
- sichtbare Rueckmeldung
- sauberer Custom-Tool-Pfad
```

---

## Sprint 2 - Existing-User Login Flow klaeren

```text
Du arbeitest im Projekt /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio.

Arbeite auf einem neuen Branch:
codex/existing-user-login-flow

Lies vor der Arbeit:
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/AGENTS.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/STUDIO_AGENT_START_HERE.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/LANDINGPAGE_REGISTER_FIRST_2026-02-27.md

TASK:
Mache den Login fuer bestehende Nutzer klar, direkt und frei von alter Misch-UI, insbesondere ausgehend von /landingsimple und den Onboarding-Hinweisen.

WICHTIGE KRITIK AM AUSGANGSTICKET:
- "Login redesign" ist als Sprint zu gross.
- Das echte Problem ist die verwirrende Existing-User-Fuehrung.
- Die Sonderfaelle invite code, workspace invite, purchase und import duerfen dabei nicht zerstoert werden.

KONKRETER KONTEXT:
- Landing-Einstieg:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/app/landingsimple/page.tsx
- Setup-/Onboarding-Hinweise:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/components/landing/setup-section.tsx
- Login-Seite:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/app/login/page.tsx

ZIEL:
1) Bestehende Nutzer bekommen aus Landing und Setup einen klaren Login-Einstieg.
2) Die alte Vermischung von Registrierung und Login wird fuer den Existing-User-Kontext aufgeloest.
3) Kontexte wie Invite, Purchase, Import und Workspace-Einladung bleiben erhalten.

IN SCOPE:
- Verlinkungen und CTA-Texte fuer bestehende Nutzer
- initiale Tab-/Flow-Steuerung auf der Login-Seite
- Erhalt von Query-Kontexten
- ruhiger, registergerechter Existing-User-Pfad

OUT OF SCOPE:
- kompletter Auth-Rewrite
- neue Auth-Provider
- Umbau der Stripe-/Purchase-Logik
- komplettes visuelles Redesign aller Auth-Screens

UMSETZUNGSAUFTRAEGE:
1. Identifiziere alle Existing-User-Einstiege:
   - landingsimple Header
   - SetupSection "Bereits ein Konto?"
   - Sonderfaelle mit Code/Email/Purchase/Import
2. Vereinheitliche die Login-Fuehrung.
3. Stelle sicher, dass bestehende Nutzer nicht versehentlich in Registrierungs-UI landen, wenn sie klar anmelden wollen.
4. Erhalte invite-/purchase-/import-Kontext bei Weiterleitungen.
5. Dokumentiere in docs/:
   - alte Verwirrung
   - neuer Existing-User-Pfad
   - erhaltene Sonderfaelle
   - Risiken
   - Rollback

AKZEPTANZKRITERIEN:
1) "Bereits ein Konto / Anmelden" fuehrt in einen klaren Bestandsnutzer-Flow.
2) Invite-/Import-/Purchase-Kontext geht nicht verloren.
3) Die Login-Seite ist im Register-Kontext ruhiger und weniger vermischt.
4) Es gibt einen klaren manuellen Smoke-Test fuer:
   - normalen Login
   - Login mit Invite-Code
   - Login mit Purchase-/Import-Kontext

VALIDIERUNG:
- npm run lint
- npm run typecheck
- manueller Smoke fuer die drei obigen Faelle

WICHTIG:
- Im Register-Kontext keine Growth-Sprache.
- Aendere nur das, was fuer den Existing-User-Flow noetig ist.

ERWARTETES ENDERGEBNIS:
- klarer Bestandsnutzer-Login
- erhaltene Sonderfaelle
- dokumentierte Navigation
```

---

## Sprint 3 - Supplier Request Inbox + Schema-Normalisierung

```text
Du arbeitest im Projekt /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio.

Arbeite auf einem neuen Branch:
codex/supplier-request-inbox

Lies vor der Arbeit:
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/AGENTS.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/STUDIO_AGENT_START_HERE.md

TASK:
Baue eine Rueckansicht fuer Lieferantenanfragen und normalisiere den bestehenden Supplier-Request-Write-Pfad auf das echte Register-Schema.

WICHTIGE KRITIK AM AUSGANGSTICKET:
- Ein Teil des Flows existiert bereits.
- Der aktuelle API-Pfad schreibt schemafremde Registerkartenwerte.
- Das ist nicht nur ein UI-Feature, sondern auch ein Datenqualitaets- und Stabilitaetsthema.

KONKRETER KONTEXT:
- Oeffentliche Request-Seite:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/app/request/[registerId]/page.tsx
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/app/request/[registerId]/client.tsx
- API:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/app/api/supplier-submit/route.ts
- Register-Liste / Uebersicht:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/components/register/register-board.tsx
- Typen/Schemas:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/lib/register-first/types.ts
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/lib/register-first/schema.ts
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/lib/register-first/use-case-builder.ts

ZIEL:
1) Gestellte Lieferantenanfragen muessen im Register sichtbar werden.
2) Die Speicherung darf keine schemafremden Card-Werte mehr schreiben.
3) Nutze bestehende Status- und Label-Mechanik, wo sinnvoll.
4) Die Rueckansicht soll ruhig, dokumentenzentriert und nicht wie ein zweites Produkt wirken.

IN SCOPE:
- supplier-submit normalisieren
- supplier-Anfragen im Register sichtbar machen
- Filter oder Subview fuer diese Faelle
- klare Anzeige von:
  - Tool/Lieferant
  - Erfassungsdatum
  - Status oder Statusableitung
- docs/ und Tests

OUT OF SCOPE:
- komplexes Lieferantenportal mit Kommunikation
- neuer externer Workflow-Engine
- genereller Neubau des Register-Boards

UMSETZUNGSAUFTRAEGE:
1. Analysiere die aktuelle Speicherung in supplier-submit.
2. Gleiche sie gegen die aktuellen Register-Schemas ab.
3. Entscheide sauber:
   - bleibt Supplier Request ein Use Case mit Labels
   - oder braucht es wirklich eine zusaetzliche Anfragenstruktur
4. Bevorzuge den bestehenden Record-of-Truth-Ansatz, wenn fachlich ausreichend.
5. Implementiere eine sichtbare Rueckansicht fuer Registernutzer.
6. Lege eine technische Notiz in docs/ an:
   - bisheriger inkonsistenter Datenpfad
   - neue Speicherung
   - Anzeige-/Filterlogik
   - Risiken fuer bestehende Daten
   - Rollback

AKZEPTANZKRITERIEN:
1) Gestellte Lieferantenanfragen sind im Register sichtbar.
2) Die Speicherung ist schema-kompatibel.
3) Der Datenfluss ist dokumentiert.
4) Die UI bleibt innerhalb der EUKI-Charta ruhig und sachlich.

VALIDIERUNG:
- npm run lint
- npm run typecheck
- wenn vorhanden: gezielte Tests fuer Typ-/Schema-Kompatibilitaet
- manueller Smoke:
  - Request absenden
  - im Register wiederfinden
  - Status/Metadaten pruefen

WICHTIG:
- Nicht einfach neue Schattenfelder erfinden.
- Wenn bestehende Daten bereits schemafremd sind, dokumentiere Migrations- oder Altlastenlage explizit.

ERWARTETES ENDERGEBNIS:
- sichtbare Supplier-Rueckansicht
- normalisierte Speicherung
- dokumentierte Datenentscheidung
```

---

## Sprint 4 - Register-Loeschen sicher und reversibel planen

```text
Du arbeitest im Projekt /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio.

Arbeite auf einem neuen Branch:
codex/register-delete-safe

Lies vor der Arbeit:
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/AGENTS.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/STUDIO_AGENT_START_HERE.md

TASK:
Implementiere einen sicheren Register-Loeschflow fuer die Hauptregister-Verwaltung.

WICHTIGE KRITIK AM AUSGANGSTICKET:
- Das ist kein reines UI-Icon-Thema.
- Im Service gibt es aktuell keinen sauber erkennbaren Register-Delete-Pfad.
- Vor UI muss geklaert werden, was mit aktivem Register, Use Cases, Access Codes und moeglicher Wiederherstellung passiert.

KONKRETER KONTEXT:
- Register-Service:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/lib/register-first/register-service.ts
- Register-Typ:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/lib/register-first/types.ts
- My Register:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/app/my-register/page.tsx
- Register Board / Management-UI:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/components/register/register-board.tsx

ZIEL:
1) Einen klaren, sicheren und dokumentierten Loeschpfad fuer Register schaffen.
2) Eine starke Schutzmechanik mit Namenseingabe verwenden.
3) Soft Delete vs. Hard Delete explizit entscheiden und dokumentieren.
4) Edge Cases sauber behandeln.

EDGE CASES:
- letztes verbleibendes Register
- aktuell aktives Register im Client
- Access Codes des Registers
- abhaengige Use Cases und oeffentliche Links
- moeglicher Rollback/Wiederherstellungspfad

IN SCOPE:
- Service- und Repository-Erweiterung
- Register-Management-UI
- Bestaetigungsdialog
- Schutzmechanik
- Doku
- Tests

OUT OF SCOPE:
- Bulk-Delete
- org-weite Archivierungsplattform
- Mischung mit Supplier- oder Workflow-Sprint

UMSETZUNGSAUFTRAEGE:
1. Pruefe zuerst die bestehende Register-Service- und Repository-Lage.
2. Entscheide und dokumentiere:
   - soft delete oder hard delete
   - warum
   - welche Folgen das fuer Use Cases, Codes und aktive Auswahl hat
3. Implementiere Service und UI.
4. Nutze eine Namensbestaetigung im Dialog.
5. Erstelle eine technische Notiz in docs/ mit:
   - Delete-Strategie
   - Datenfolgen
   - Sicherheitsmechanik
   - Testfaelle
   - Rollback

AKZEPTANZKRITERIEN:
1) Register kann nur nach expliziter Namenseingabe geloescht werden.
2) Verhalten fuer das letzte Register ist klar definiert.
3) Abhaengige Daten verhalten sich konsistent.
4) Rollback oder Wiederherstellbarkeit ist beschrieben.
5) Wenn der Flow gross oder riskant ist, fuehre ihn hinter Feature-Flag mit default false ein.

VALIDIERUNG:
- npm run lint
- npm run typecheck
- geeignete Tests fuer Service-/Delete-Verhalten
- manueller Smoke fuer:
  - Register mit weiteren Registern
  - letztes Register
  - Verhalten nach Loeschung im Client

WICHTIG:
- Keine versteckte Destruktivitaet.
- Wenn ein echter Hard Delete zu riskant ist, favorisiere einen reversiblen Pfad und dokumentiere das offen.

ERWARTETES ENDERGEBNIS:
- sicherer Register-Loeschflow
- dokumentierte Delete-Strategie
- nachvollziehbare Schutzmechanik
```

---

## Sprint 5 - Workflow-Linking Foundation

```text
Du arbeitest im Projekt /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio.

Arbeite auf einem neuen Branch:
codex/workflow-link-foundation

Lies vor der Arbeit:
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/AGENTS.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/STUDIO_AGENT_START_HERE.md

TASK:
Schaffe die technische Grundlage dafuer, KI-Einsatzfaelle mit internen Prozessen oder Workflows zu verknuepfen.

WICHTIGE KRITIK AM AUSGANGSTICKET:
- Das Feature hat aktuell kein klares Datenmodell.
- Ohne Foundation wird der spaetere UI-Sprint fast sicher in Ad-hoc-Felder ausarten.
- Das ist zuerst ein Datenmodell-, Service- und Kompatibilitaetssprint.

KONKRETER KONTEXT:
- Typen:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/lib/register-first/types.ts
- Schema:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/lib/register-first/schema.ts
- Service/Repository:
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/lib/register-first/register-service.ts
  /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/src/lib/register-first/register-repository.ts

ZIEL:
1) Ein minimales, rueckwaertskompatibles Datenmodell fuer Workflow-Verknuepfungen definieren.
2) Typen, Schemas und Service-Pfade konsistent einfuehren.
3) Dokumentieren, ob Workflows nur Referenzen, Namen oder eigene Entitaeten sind.
4) Den neuen Flow hinter Feature-Flag mit default false absichern.

IN SCOPE:
- neue Typen oder Referenztypen
- Schema-Anpassungen
- Service-Methoden zum Setzen/Lesen/Entfernen
- ggf. kleiner Workflow-Referenzvertrag
- Doku in docs/

OUT OF SCOPE:
- grosse UI
- komplexe Prozessbibliothek
- automatisierte Governance-Ableitungen
- parallele Control-Logik

UMSETZUNGSAUFTRAEGE:
1. Definiere zuerst den kleinsten sinnvollen Datenvertrag.
2. Achte strikt auf Rueckwaertskompatibilitaet.
3. Implementiere Service-Methoden:
   - Link setzen
   - Link lesen
   - Link entfernen
4. Fuehre ein Feature-Flag fuer den neuen Flow ein, default false.
5. Dokumentiere in docs/:
   - Datenmodell
   - Begruendung
   - Risiken
   - Migrationsbedarf oder bewusste Nicht-Migration
   - Rollback

AKZEPTANZKRITERIEN:
1) Das neue Feld oder die neue Referenz ist typisiert.
2) Das Schema validiert die neue Struktur sauber.
3) Bestehende Cards bleiben gueltig.
4) Service-Layer kann die Verknuepfung setzen und entfernen.
5) Feature-Flag ist vorhanden und default false.

VALIDIERUNG:
- npm run lint
- npm run typecheck
- passende Tests fuer Typ-/Schema-/Service-Verhalten

WICHTIG:
- Nicht zu frueh eine ueberkomplexe Prozessdomaine bauen.
- Erst die kleinste tragfaehige Foundation.

ERWARTETES ENDERGEBNIS:
- saubere Workflow-Link-Basis
- klare Doku
- vorbereitet fuer den UI-Sprint
```

---

## Sprint 6 - Workflow-Linking UI

```text
Du arbeitest im Projekt /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio.

Arbeite auf einem neuen Branch:
codex/workflow-link-ui

Lies vor der Arbeit:
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/AGENTS.md
- /Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/STUDIO_AGENT_START_HERE.md
- die Doku aus Sprint 5

TASK:
Implementiere die UI fuer die Verknuepfung eines KI-Einsatzfalls mit einem internen Prozess oder Workflow.

WICHTIGE KRITIK AM AUSGANGSTICKET:
- Der erste Instinkt waere oft: "suchbares Dropdown einbauen".
- Das reicht nicht.
- Die UI muss in die dokumentenzentrierte Register-Welt passen und darf nicht wie ein generischer SaaS-Selector wirken.

KONKRETER KONTEXT:
- Use-Case-Detail / Register-Detailbereiche im bestehenden Register-First-UI
- die in Sprint 5 eingefuehrten Typen und Services

ZIEL:
1) Nutzer koennen bestehende Workflow-/Prozess-Verknuepfungen setzen, sehen, aendern und entfernen.
2) Die UI bleibt innerhalb der EUKI UI-Charta ruhig, sachlich und objektzentriert.
3) Die Funktion ist ueber Feature-Flag steuerbar.

IN SCOPE:
- Detailansicht oder eine klar begrenzte Register-Interaktion
- suchbarer Selector oder Dropdown fuer vorhandene Prozesse
- Anzeige der aktuellen Verknuepfung
- Entfernen/Aendern
- docs/ und Smoke-Test

OUT OF SCOPE:
- BPM-Suite
- komplexe org-weite Workflow-Verwaltung
- neue Datenmodell-Aenderungen ohne Bezug zu Sprint 5
- Control-/Analytics-Automation

UMSETZUNGSAUFTRAEGE:
1. Integriere die Foundation aus Sprint 5 in einen passenden Register- oder Detailkontext.
2. Waehle bewusst eine ruhige UI:
   - kein lautes Panel
   - kein Utility-Overload
   - keine Growth-/Upgrade-Sprache
3. Sorge fuer:
   - aktuellen Link anzeigen
   - Link setzen
   - Link aendern
   - Link entfernen
4. Dokumentiere in docs/:
   - Platzierung der UI
   - Datenfluss
   - Feature-Flag
   - Risiken
   - Rollback

AKZEPTANZKRITERIEN:
1) Workflow-Verknuepfung ist sichtbar, setzbar und entfernbar.
2) Die UI passt zur EUKI-Charta.
3) Kein aggressives Utility-Moebel auf falschen Seiten.
4) Ein Smoke-Test fuer Setzen, Anzeigen und Entfernen ist vorhanden.

VALIDIERUNG:
- npm run lint
- npm run typecheck
- Smoke-Test fuer:
  - Link setzen
  - Link anzeigen
  - Link entfernen

WICHTIG:
- Wenn die Foundation aus Sprint 5 fehlt oder unklar ist, stoppe nicht einfach im UI herumzuimprovisieren.
- Nutze den Datenvertrag aus Sprint 5, nicht neue Schattenfelder.

ERWARTETES ENDERGEBNIS:
- fertig verdrahtete Workflow-Link-UI
- ruhige, registerkonforme Interaktion
- saubere Doku
```
