# Governance Settings Save Fix

Status: umgesetzt am 2026-03-08

## Problem

Die Seite `/settings/governance` baute verschachtelte `orgSettings`-Payloads clientseitig auf und schrieb sie ungefiltert via `updateDoc(...)`.

Firestore lehnt verschachtelte `undefined`-Werte ab. Genau diese entstehen in der Governance-UI leicht, zum Beispiel bei teilweise ausgefuellten RACI-Rollen oder optionalen Unterfeldern in Review- und Incident-Konfigurationen.

Symptom:

1. Klick auf `Aenderungen speichern`
2. roter Toast `Einstellungen konnten nicht gespeichert werden`
3. kein persistierter Stand in AI Governance Control

## Entscheidung

Der Fix sitzt bewusst an zwei Stellen:

1. Register-Updates werden vor `updateDoc(...)` tief von `undefined` bereinigt.
2. Die Governance-Seite erzeugt optionale Unterobjekte sauberer und schreibt keine halb-leeren Feldstrukturen mehr.

Damit wird nicht nur diese eine Seite stabiler, sondern jede kuenftige Register-Profil-Aktualisierung robuster.

## Umsetzung

1. Neue Hilfsfunktion:
   - `src/lib/register-first/firestore-sanitize.ts`
2. `updateRegister(...)` verwendet jetzt die Sanitisierung vor Firestore-Updates:
   - `src/lib/register-first/register-repository.ts`
3. Governance-Settings normalisieren optionale Felder und RACI-Eintraege vor dem Speichern:
   - `src/app/settings/governance/page.tsx`
4. Fehler werden zusaetzlich in die Console geloggt, damit echte Rule-/Runtime-Probleme sichtbar bleiben.

## Risiken

1. Die Sanitisierung entfernt nur `undefined`, nicht `null`, `false` oder leere Strings. Das ist gewollt, damit explizite Entscheidungen erhalten bleiben.
2. Leere optionale Strings koennen weiterhin gespeichert werden, wenn die UI sie bewusst so setzt. Der aktuelle Fix zielt auf Speichersicherheit, nicht auf komplette semantische Bereinigung aller Felder.

## Rollback

1. Rueckbau von `firestore-sanitize.ts`
2. Rueckbau der Sanitisierung in `register-repository.ts`
3. Rueckbau der Governance-Payload-Normalisierung in `src/app/settings/governance/page.tsx`

## Verifikation

1. `npm run lint`
2. `npm run typecheck`
3. `node --import tsx --test src/lib/register-first/firestore-sanitize.test.ts`
