# Quick Capture Owner-Rolle statt Personenname

Status: umgesetzt am 2026-03-06 in Quick Capture, Public Capture und Detailpflege.

## Warum

- Die bisherige Quick-Capture-Copy implizierte eine Person (`Name eingeben`), obwohl das Register fachlich eine stabile Verantwortungsrolle braucht.
- Personenbasierte Eingaben verschlechtern Audit-Trail, RACI-Faehigkeit und Grosskunden-Tauglichkeit.
- Im Public-Capture wurde derselbe Wert zugleich als fachliche Verantwortung und als `capturedByName` recycelt. Das vermischte Governance-Ownership und Einreicher:in semantisch falsch.

## Produktentscheidung

- Primaerfeld ist jetzt `Owner-Rolle (funktional)`.
- Optionales Sekundaerfeld ist `Kontaktperson (optional)`.
- Die Rolle bleibt das kanonische Governance-Feld (`responsibility.responsibleParty`).
- Die Kontaktperson wird separat gespeichert (`responsibility.contactPersonName`) und nur intern angezeigt.
- `capturedByName` wird im Code-Capture nur noch aus der optionalen Kontaktperson befuellt, nicht mehr aus der Owner-Rolle.

## Datenfluss

1. Quick Capture und `/erfassen` erfassen `ownerRole` plus optional `contactPersonName`.
2. Capture-Input und Use-Case-Card Schema akzeptieren beide Felder.
3. `prepareUseCaseForStorage` schreibt:
   - `responsibility.responsibleParty`
   - `responsibility.contactPersonName`
4. `POST /api/capture-by-code` akzeptiert rueckwaertskompatibel weiter `ownerName`, mappt es aber auf die fachliche Owner-Rolle.
5. Die Detailansicht zeigt intern Owner-Rolle und optionale Kontaktperson getrennt an.

## Betroffene Dateien

- `src/components/register/quick-capture-modal.tsx`
- `src/app/erfassen/page.tsx`
- `src/app/api/capture-by-code/route.ts`
- `src/lib/register-first/types.ts`
- `src/lib/register-first/schema.ts`
- `src/components/register/detail/use-case-metadata-section.tsx`
- `src/components/register/detail/use-case-header.tsx`
- `src/components/register/register-board.tsx`
- `src/components/register/capture-form.tsx`
- `src/components/register/detail/use-case-assessment-wizard.tsx`
- `src/components/register/use-case-pass-card.tsx`
- `src/app/pass/[useCaseId]/page.tsx`

## Risiken

- Bestehende externe Clients, die noch `ownerName` senden, bleiben funktionsfaehig, aber der Wert wird jetzt als Rolle interpretiert.
- Die optionale Kontaktperson liegt im internen JSON-Card-Modell und sollte nicht ungeprueft in oeffentliche Artefakte uebernommen werden.
- Alte lokale Guest-Capture-Eintraege behalten ihr bisheriges Format; neue Eintraege nutzen `ownerRole`.

## Rollback

- Rueckbau durch Revert der oben genannten Dateien.
- Kein Migrationsschritt noetig, da `contactPersonName` optional ist und der API-Pfad `ownerName` weiter akzeptiert.
