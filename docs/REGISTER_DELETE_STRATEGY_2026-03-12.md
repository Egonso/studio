# Register Delete Strategy

## Entscheidung

Die Hauptregister-Verwaltung nutzt einen expliziten **Soft-Delete-Pfad**. Ein Hard Delete wird bewusst **nicht** implementiert.

### Warum kein Hard Delete

- Ein Register hat abhängige Daten in mehreren Firestore-Bereichen:
  - `users/{userId}/registers/{registerId}`
  - `users/{userId}/registers/{registerId}/useCases/*`
  - `publicUseCases/*`
  - `registerAccessCodes/*`
  - öffentliche Supplier-/Capture-Einstiegspunkte
- Ein physisches Löschen über mehrere Collections hinweg wäre ohne belastbaren Migrations- und Recovery-Pfad unnötig riskant.
- Die Produktanforderung fordert keine versteckte Destruktivität. Soft Delete erlaubt Sperrung plus Wiederherstellung.

## Konkrete Delete-Strategie

Der Delete-Flow läuft in dieser Reihenfolge:

1. Delete-Preview laden:
   - betroffene Use Cases
   - öffentliche Verify-Links
   - Access Codes
   - Fallback-Register
2. Exakte Namensbestätigung prüfen.
3. Letztes verbleibendes Register blockieren.
4. Öffentliche Use-Case-Einträge aus `publicUseCases` entfernen.
5. Aktive Access Codes deaktivieren und mit `deactivatedReason="REGISTER_DELETED"` markieren.
6. Register-Dokument auf `isDeleted=true` setzen und `deletionState` persistieren.
7. Aktives/default Register auf ein verbleibendes Fallback-Register umstellen.

## Datenfolgen

### Register

- `isDeleted=true`
- `deletionState.strategy="SOFT_DELETE"`
- `deletionState` dokumentiert:
  - Löschzeitpunkt
  - löschenden User
  - Anzahl betroffener Use Cases
  - Anzahl öffentlicher Use Cases
  - Anzahl Access Codes
  - Anzahl tatsächlich deaktivierter Codes

### Use Cases

- Use Cases werden **nicht physisch gelöscht**.
- Sie bleiben im Register erhalten und werden über die Register-Auflösung nicht mehr erreichbar.
- Bereits öffentliche Use Cases werden aus dem Public Index entfernt.
- Beim Restore werden weiterhin als öffentlich markierte Use Cases erneut publiziert.

### Access Codes

- Nur aktuell aktive Codes werden deaktiviert.
- Bereits manuell widerrufene Codes bleiben widerrufen.
- Die Ursache wird unterschieden:
  - `MANUAL`
  - `REGISTER_DELETED`

### Öffentliche Links

- `capture-by-code` liefert für gelöschte Register `410`.
- Supplier-Request-Seiten und `supplier-submit` akzeptieren gelöschte Register nicht mehr.
- Verify-Links werden durch das Entfernen aus `publicUseCases` sofort inert.

## Sicherheitsmechanik

- UI-Flow hinter Feature Flag:
  - `NEXT_PUBLIC_REGISTER_FIRST_REGISTER_DELETION`
  - Default: `false`
- Löschen nur nach exakter Namenseingabe des aktuell sichtbaren Register-Namens.
- Kein Delete des letzten verbleibenden Registers.
- Kein implizites Fallback auf gelöschte Register bei aktiver Auswahl oder persisted default.

## Verhalten bei Edge Cases

### Letztes Register

- Delete wird vom Service mit `REGISTER_DELETE_FORBIDDEN` abgelehnt.

### Aktuell aktives Register im Client

- Nach erfolgreichem Delete wird automatisch auf ein verbleibendes Register umgeschaltet.

### Access Codes

- Aktive Codes werden deaktiviert.
- Manuell deaktivierte Codes bleiben deaktiviert.

### Abhängige Use Cases und öffentliche Links

- Use Cases bleiben erhalten, sind aber während des Soft Deletes nicht erreichbar.
- Öffentliche Verify-Links und Supplier-/Capture-Einstiegspunkte werden geschlossen.

## Rollback / Wiederherstellung

Wiederherstellung erfolgt über `registerService.restoreRegister(registerId)`.

Der Restore-Pfad:

1. setzt `isDeleted=false`
2. löscht `deletionState`
3. aktiviert nur Codes mit `deactivatedReason="REGISTER_DELETED"` erneut
4. republiziert weiterhin öffentliche Use Cases in `publicUseCases`

Nicht Bestandteil dieses Flows:

- physisches Löschen historischer Daten
- org-weite Archivierungsplattform
- Bulk-Restore/Bulk-Delete

## Testfälle

- Delete-Preview für letztes Register ist blockiert.
- Delete mit falscher Namensbestätigung schlägt fehl.
- Delete mit mehreren Registern deaktiviert:
  - Public Index
  - aktive Access Codes
  - aktives/default Register
- Restore reaktiviert nur registerbedingt deaktivierte Codes.
- Restore republiziert öffentliche Use Cases.
- Öffentliche Supplier-/Capture-Pfade lehnen gelöschte Register ab.
