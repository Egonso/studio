# Register First Execution Brief

Stand: 2026-03-23

## Scope

Aktueller Slice:

- Risikoklassen-Assistenz auf der Use-Case-Detailseite
- kanonische Risiko-Taxonomie
- deterministische Vorschlagslogik
- kurze menschliche Pruefung als ruhiger Review-Flow
- optionale AI-Formulierungshilfe fuer den Begruendungsvermerk

Nicht Teil dieses Slices:

- keine automatische Governance-Entscheidung
- keine Datenmigration
- keine verpflichtende LLM-Nutzung
- kein globaler Umbau des Governance Centers

## Zielbild

Die Detailseite bleibt object-first und dokumentenzentriert.

`Risikoklasse` ist kein nacktes Freitextfeld mehr, aber auch kein automatischer Bescheid.
Stattdessen gilt:

- sichtbarer Vorschlag statt stillem Prefill
- menschliche Bestaetigung statt automatischer Einstufung
- kurzer Review statt schwerem Wizard
- ruhige UI statt Alarm-Aesthetik

## Delivery Gates

### Preview

- Preview-URL: noch nicht dokumentiert
- Preview-Verantwortliche fuer Abnahme: noch nicht benannt
- Status: nicht release-ready, bis Preview-Pfad und Verantwortliche eingetragen sind

### Feature Flag

- Name: `NEXT_PUBLIC_REGISTER_FIRST_RISK_ASSIST_DETAIL`
- Server-Alias: `REGISTER_FIRST_RISK_ASSIST_DETAIL`
- Default: `false`
- Owner: Register-First Produkt / Studio Engineering

### Rollback

Rollback ist bewusst rein ueber Flag moeglich:

1. `NEXT_PUBLIC_REGISTER_FIRST_RISK_ASSIST_DETAIL=false`
2. neu deployen
3. Detailseite faellt auf das bestehende Freitextfeld zurueck

Es gibt keinen Backfill und keinen Migrationsschritt, der fuer Rollback rueckgaengig gemacht werden muesste.

### Acceptance

- Merge-Entscheider*in: noch nicht dokumentiert
- Release-Entscheidung: erst nach Preview-Abnahme

## Daten- und Migrationswirkung

- kein neues Persistenzmodell
- kein Backfill
- bestehendes Feld bleibt:
  - `governanceAssessment.core.aiActCategory`
- bekannte Legacy-Werte werden beim Speichern auf die kanonische Darstellung normalisiert
- unbekannte Freitext-Werte bleiben bis zur bewussten Ueberschreibung erhalten

## Umgesetzter Funktionsumfang

1. Kanonische Taxonomie:
   - `UNASSESSED`
   - `MINIMAL`
   - `LIMITED`
   - `HIGH`
   - `PROHIBITED`
2. Deterministische Suggestion Engine mit:
   - `suggestedRiskClass`
   - `signalStrength`
   - `reviewRecommended`
   - `reasons`
   - `openQuestions`
3. Kompakte Assistenz in der Detailseite:
   - Vorschlag ansehen
   - Entwurf uebernehmen
   - selbst einstufen
   - kurze Pruefung starten
4. Kurzer Review-Flow:
   - Signale lesen
   - Risikoklasse bestaetigen oder anpassen
   - optional Governance-Fakten dokumentieren
   - optionalen Vermerk speichern
5. Optionale AI-Schreibhilfe:
   - CTA `Begruendung formulieren`
   - Kontext aus Vorschlag, Gruenden und offenen Fragen
   - klare Kennzeichnung `Drafted by AI - Needs Human Review`
   - keine automatische Klassenwahl

## Validierung

Fuer diesen Slice wurden folgende Checks erfolgreich ausgefuehrt:

- `./node_modules/.bin/tsx --test src/lib/register-first/risk-taxonomy.test.ts`
- `./node_modules/.bin/tsx --test src/lib/register-first/risk-suggestion-engine.test.ts src/lib/register-first/risk-taxonomy.test.ts`
- `./node_modules/.bin/tsx src/lib/register-first/__tests__/smoke.ts`
- `./node_modules/.bin/tsx --test src/components/register/detail/risk-class-assist-model.test.ts src/components/register/detail/risk-class-assist.test.tsx`
- `./node_modules/.bin/tsx --test src/components/register/detail/use-case-assessment-wizard-model.test.ts src/components/register/detail/risk-class-assist-model.test.ts src/components/register/detail/risk-class-assist.test.tsx`
- `./node_modules/.bin/tsx --test src/app/api/auth-routes.test.ts`
- `npm run typecheck`
- gezielte `eslint`-Laeufe auf die geaenderten Register-First- und Detailseiten-Dateien

Noch offen:

- echter Preview-/Browser-Durchlauf mit Flag off und Flag on

## Preview-Abnahmeskript

Mit Flag `off`:

1. Use-Case-Detailseite oeffnen
2. `Risikoklasse` bleibt beim bisherigen Edit-Feld
3. bestehendes Speichern funktioniert unveraendert

Mit Flag `on`:

1. Use-Case mit internem Assistenzfall pruefen
2. Use-Case mit Kunden-/Chatbot-Fall pruefen
3. Use-Case mit Bewerberkommunikation pruefen
4. Use-Case mit vorhandenem Freitextwert pruefen
5. Vorschlag ansehen
6. Entwurf uebernehmen
7. manuell abweichende Klasse waehlen
8. kurze Pruefung starten
9. speichern und nach Reload erneut pruefen

Vollstaendiges Abnahmeprotokoll:

- `docs/REGISTER_FIRST_RISK_ASSIST_PREVIEW_ACCEPTANCE_2026-03-23.md`

## Offene Risiken

- Preview-URL und Preview-Abnahmeverantwortung sind nicht dokumentiert
- Merge-/Release-Entscheider*in ist nicht dokumentiert
- Browservalidierung gegen echte Daten steht noch aus
- die AI-Formulierungshilfe haengt von einer funktionierenden Draft-API und gueltigem API-Key ab

## Naechster sinnvoller Schritt

1. Preview mit Flag `on` deployen
2. Use-Case-Beispiele gegen die Abnahmeliste pruefen
3. Flag weiter `false` auf main lassen bis Abnahme
4. danach den bestehenden Slice rollbar machen oder bei Bedarf nur noch Feinschliff an Prompt und Copy vornehmen
