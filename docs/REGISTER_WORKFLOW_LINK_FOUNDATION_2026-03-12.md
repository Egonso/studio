# Register Workflow Link Foundation

## Ziel

Diese Aenderung schafft die kleinste tragfaehige Grundlage, um KI-Einsatzfaelle
(`UseCaseCard`) mit internen Workflows oder Prozessen zu verknuepfen, ohne
bereits eine eigene Prozessdomaene oder UI-Struktur vorwegzunehmen.

## Datenmodell

Neues optionales Feld auf `UseCaseCard`:

```ts
workflowRef?: {
  workflowId: string;
  workflowName?: string | null;
  linkedAt: string;
} | null;
```

Bedeutung:

- `workflowId` ist die fachliche Quelle der Verknuepfung.
- `workflowName` ist nur ein optionaler Anzeige-Snapshot.
- `linkedAt` dokumentiert, wann die Referenz zuletzt gesetzt wurde.

## Entscheidungslogik

Workflows sind in diesem Sprint bewusst **keine eigenen Entitaeten** im
Register-First-Modell.

Es gilt:

- Gespeichert wird nur eine Referenz auf einen extern oder spaeter intern
  verwalteten Workflow.
- Namen allein sind nicht die Quelle der Wahrheit.
- Es gibt keine neue Workflow-Tabelle, keine Prozessbibliothek und keine
  Governance-Ableitung aus der Verknuepfung.

Das verhindert Ad-hoc-Felder im spaeteren UI-Sprint, ohne jetzt schon ein zu
grosses Modell zu erzwingen.

## Rueckwaertskompatibilitaet

- `workflowRef` ist optional und nullable.
- Bestehende Cards bleiben unveraendert gueltig.
- Es gibt keinen `cardVersion`-Bump.
- Bestehende Repository-Pfade (`create/getById/save/list`) bleiben ausreichend,
  weil das Feld additive Metadaten auf derselben Card ist.

## Service-Verhalten

Neue Methoden im Standalone-Service:

- `setWorkflowReference(...)`
- `getWorkflowReference(...)`
- `removeWorkflowReference(...)`

Zusaetzlich blockiert `updateUseCase(...)` echte Aenderungen an `workflowRef`,
wenn das neue Feature-Flag deaktiviert ist. Unveraenderte mitgesendete Werte
bleiben erlaubt, damit bestehende Update-Pfade nicht unnötig brechen.

## Feature-Flag

Neues Flag:

- `registerFirst.workflowLinks`
- Env: `NEXT_PUBLIC_REGISTER_FIRST_WORKFLOW_LINKS`
- Fallback: `REGISTER_FIRST_WORKFLOW_LINKS`
- Default: `false`

Die Foundation kann damit ausgerollt werden, ohne sofort UI oder manuelle
Prozessverknuepfungen freizuschalten.

## Risiken

- Es gibt noch keine referenzielle Integritaet gegen eine Workflow-Quelle.
- `workflowName` kann gegenueber einer spaeteren Workflow-Quelle veralten.
- Der erste Schnitt ist bewusst nur `0..1` Link pro Use Case.
- Exporte, Public Index und Governance-Automationen nutzen die Verknuepfung
  noch nicht.

## Migration

Bewusst keine Migration in diesem Sprint.

Gruende:

- Das Feld ist rein additiv.
- Es existiert aktuell keine belastbare Workflow-Quelle fuer ein Backfill.
- Eine Zwangsmigration wuerde nur leere oder spekulative Daten erzeugen.

## Rollback

Rollback ist nicht-destruktiv:

1. Feature-Flag `workflowLinks` auf `false` lassen oder wieder deaktivieren.
2. UI-/Service-Pfade fuer neue Verknuepfungen bleiben dadurch inaktiv.
3. Bereits gespeicherte `workflowRef`-Felder koennen ignoriert oder spaeter
   gezielt entfernt werden.

Da keine bestehende Struktur ersetzt wurde, ist kein Daten-Rollback fuer
Bestandskarten erforderlich.
