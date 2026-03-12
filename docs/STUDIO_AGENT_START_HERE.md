# Studio Agent Start Here

Stand: 2026-03-12  
Gilt fuer: `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio`

Dieses Dokument zieht die aktuell relevanten Strategieentscheidungen aus `second brain/eukigesetz.com/strategie` in das `studio`, damit Agents und Entwickler:innen vor der Arbeit denselben verbindlichen Kontext haben.

## Worum es fuer diese Sprints geht

Die aktuelle Sprint-Lage betrifft keine abstrakte Plattform-Vision, sondern einen konkreten Register-First-Bereich:

1. Stabilitaet und Ladefehler
2. Quick-Capture und Public-Capture UX
3. Klarer Login fuer bestehende Nutzer
4. Supplier-Request Rueckansicht
5. Sicheres Register-Loeschen
6. Workflow-Verknuepfung fuer Einsatzfaelle

Deshalb zaehlen fuer diese Sprints nur die Strategiedokumente, die direkt Produktgrenzen, UI-Verhalten, Capture-Logik und Register-Control-Trennung steuern.

## Verbindliche Referenzbasis

### 1. UI-Charta

Quelle: `second brain/eukigesetz.com/strategie/EUKI_Governance_UI_Charta_v2.md`

Fuer `studio` verbindlich zusammengefasst:

1. Das Produkt ist ein Governance-Instrument, kein Marketing-Interface.
2. Ziel jeder Oberflaeche ist dokumentieren, strukturieren, nachweisbar machen.
3. Der Stil ist dokumentenzentrierter Institutional Minimalism.
4. Jede Seite hat genau ein primaeres Objekt.
5. Aktionen muessen getrennt werden in:
   - Objektaktionen
   - formale Workflow-Aktionen
   - Organisations-Utilities
6. Utilities sind kontextabhaengig. Sie gehoeren nicht als globale Standardmoebel auf jede Seite.
7. Farben dienen primar der Statuskennzeichnung:
   - Grau fuer `UNREVIEWED` und `REVIEW_RECOMMENDED`
   - Blau fuer `REVIEWED`
   - Gruen fuer `PROOF_READY`
8. Nicht zulaessig im Register:
   - Amber- und Alarmoptik als Standard
   - KPI-Hitzekarten im SaaS-Stil
   - aggressive Upgrade-Muster
9. Registerseiten bleiben ruhig, sachlich und objektzentriert.
10. Register und organisationsweite Control-Ebene muessen sprachlich und visuell getrennt bleiben.

### 2. Codex v1.1

Quelle: `second brain/eukigesetz.com/strategie/EUKIgesetz_Codex_v1.1.md`

Was Agents daraus mitnehmen muessen:

1. Der EU AI Act wirkt praktisch als Organisationsrecht.
2. Der KI-Einsatzfall ist die zentrale Governance-Einheit.
3. Ziel ist zuordenbare Verantwortung, nicht maximale Protokollierung.
4. Das Minimalprinzip gilt:
   - Zweck und Kontext
   - Risiko
   - verantwortliche Rolle
   - Massnahmen
   - Review-/Aenderungslogik
5. Tool oder Vendor sind wichtige Attribute, aber nicht die primaere Governance-Einheit.

### 3. Register First v1.1

Quelle: `second brain/eukigesetz.com/strategie/EUKIgesetz_Register_First_v1.1.md`

Verbindliche Produktlogik:

1. Capture vor Governance.
2. Das Register ist Ergebnis des Capture-Systems, nicht der schwere Einstieg.
3. Kernfluss:
   - Capture
   - Register
   - Nachweis
   - Distribution
4. Capture muss unter 30 Sekunden moeglich bleiben.
5. Ein neu erfasster Einsatzfall startet immer sachlich und ohne Alarmismus.

### 4. Kernannahmen

Quelle: `second brain/eukigesetz.com/strategie/KI-Register Ansatz - Kernannahmen.md`

Praktische Leitplanken:

1. Use Case statt Tool- oder Prompt-Governance.
2. Minimaldatensatz statt Vollstaendigkeitstheater.
3. Vendor- oder Tool-Wechsel sind Review-Trigger, aber keine neue Primaereinheit.
4. Registerpflicht folgt Wirkung und Risiko, nicht jeder Kleinstnutzung.
5. Nachweis entsteht ueber standardisierte Artefakte.

### 5. Register/Control Trennung

Quelle: `second brain/eukigesetz.com/strategie/Implementierungsplan_Zwei_Ebenen_Register_Control_2026-02-26.md`

Fuer diese Sprints besonders wichtig:

1. Register bleibt vollwertig und darf nicht wie eine Demo aussehen.
2. Control ist eine eigene org-weite Steuerungsebene.
3. Im Register-Kontext moeglichst kein `Dashboard`-Wording.
4. Keine Lock-Icon- oder Upsell-Orgie im Kernregister.
5. Feature-Flags fuer groessere Control- oder neue Architektur-Slices standardmaessig `false`.

## Studio-interne Pflichtreferenzen fuer diesen Sprint-Bund

Diese Doku lebt bereits im Repo und soll vor Eingriffen in die betroffenen Flows gelesen werden:

1. `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/PUBLIC_CAPTURE_QUICK_PARITY_2026-03-08.md`
   - Quick Capture und `/erfassen` sollen denselben Capture-Kern teilen.
2. `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/QUICK_CAPTURE_OWNER_ROLE_2026-03-06.md`
   - Owner-Rolle ist kanonisch, Personenname nicht.
3. `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/REGISTER_UI_REFINEMENT_AND_FLAGS_2026-02-27.md`
   - Achtung: Aktivierte Control-Flags koennen Register-Kontext aufweichen.
4. `/Users/zoltangal/Desktop/METAProjekt/Programmieren/studio/docs/LANDINGPAGE_REGISTER_FIRST_2026-02-27.md`
   - Landing-Routen sollen institutionell, ruhig und registerzentriert bleiben.

## Welche neueren Strategiedokumente sinnvoll integriert wurden

Diese Quellen sind fuer die aktuellen Sprints direkt handlungsleitend und wurden deshalb in dieses Repo-Kontextdokument uebernommen:

1. `EUKI_Governance_UI_Charta_v2.md`
2. `EUKIgesetz_Codex_v1.1.md`
3. `EUKIgesetz_Register_First_v1.1.md`
4. `KI-Register Ansatz - Kernannahmen.md`
5. `Implementierungsplan_Zwei_Ebenen_Register_Control_2026-02-26.md`

## Welche neueren Strategiedokumente nur sekundaer sind

Diese Dokumente koennen hilfreich sein, sollten aber nicht zum Pflicht-Startkontext fuer die aktuellen Sprints gemacht werden:

1. `Landingpage_Design_Philosophie.md`
   - Relevant nur fuer Landingpages und visuelle Hero-/Akquise-Seiten, nicht fuer Register-, Login- oder Supplier-UI.
2. `UseCase_Detail_UX_Sprints.md`
   - Nuetzlich als UI-Kritikreferenz, aber keine primaere Leitplanke fuer die aktuellen Tickets.
3. `Governance_Nachweis_Audit_Sprints.md`
   - Relevant fuer spaetere Review-/Audit- und Trust-Layer-Arbeit, nicht fuer den jetzigen Register-Bug-Bund.

## Welche Dokumente bewusst nicht als primaere Sprint-Leitlinie uebernommen wurden

1. `PRODUCT_CORE_FUNCTIONS.md`
   - Enthaelt veraltetes `Dashboard`- und RAG-Framing, das mit UI-Charta und Register/Control-Trennung kollidiert.
2. `Implementierungsplan_Studio_Officer_Architektur.md`
   - Eigenstaendiger Trust-/Officer-Track, aktuell ausserhalb dieses Sprint-Bundes.
3. Pitch-, Investor- und Monetarisierungsdokumente
   - Nuetzlich fuer Positionierung, aber nicht fuer UI- oder Implementierungsentscheidungen in diesen Tickets.

## Arbeitsregeln fuer die aktuellen Sprints

1. Keine Sammel-PRs ueber Bugs, UX und neue Datenmodell-Themen.
2. Capture-Logik nur einmal implementieren und in Modal plus Public Capture gemeinsam nutzen.
3. Jede Aenderung an Register, Capture, Supplier-Request oder Workflow-Verknuepfung braucht:
   - Typen oder Schema-Anpassung
   - Fehlerbehandlung
   - Smoke-/Integrationstest
   - Doku-Update
4. Destruktive Flows wie Register-Loeschen brauchen zusaetzlich:
   - explizite Schutzmechanik
   - Rollback-Notiz
   - klares Verhalten fuer aktive Register, Access Codes und abhaengige Daten
5. Neue groessere Flows wie Workflow-Verknuepfung nur hinter Feature-Flag.

## Einstieg pro Task-Typ

1. Capture / Quick Capture / `/erfassen`
   - Lies die beiden Capture-Dokus oben und dann `REGISTER_FIRST_SPRINT_PROMPTS_2026-03-12.md`
2. Login / Landing / Onboarding
   - Lies UI-Charta, Register First und Landing-Route-Doku
3. Supplier Request
   - Lies UI-Charta, Codex-Minimalprinzip und die Sprint-Prompts
4. Register-Loeschen
   - Lies UI-Charta, Codex-Minimalprinzip und Register/Control-Trennung
5. Workflow-Verknuepfung
   - Lies Codex, Kernannahmen und Register/Control-Trennung vor dem Datenmodell
