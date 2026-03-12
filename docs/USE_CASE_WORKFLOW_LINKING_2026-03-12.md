# Use-Case Workflow Linking

Stand: 2026-03-12  
Scope: Ruhige Prozess-/Workflow-Verknüpfung im Register-Detail auf Basis des bestehenden `policyLinks`-Vertrags

## Platzierung der UI

1. Die Verknüpfung sitzt in der Use-Case-Detailansicht unter `Owner & Organisation`.
2. Die Interaktion bleibt im dokumentenzentrierten Register-Kontext:
   - ruhige Referenzliste statt lautes Utility-Panel
   - inline aufklappbare Suche statt generischer SaaS-Combobox
3. Der bestehende Control-Einstieg bleibt darunter erhalten und wird nicht mit der Zuordnung vermischt.

## Datenfluss

1. Kanonische Datenbasis bleibt `UseCaseCard.governanceAssessment.flex.policyLinks`.
2. Vorhandene verknüpfbare Dokumente werden über `policyService.listPolicies(registerId)` geladen.
3. Die Detail-UI löst Referenzen gegen vorhandene `PolicyDocument`-Einträge auf:
   - Treffer: Titel + Status + `policyId`
   - kein Treffer: Referenz bleibt als rohe Dokumentreferenz sichtbar
4. Speichern läuft über den bestehenden Register-Pfad:
   - `UseCaseMetadataSection` -> `registerService.updateUseCase()`
5. Sprint-5-Foundation wird weiterverwendet:
   - `focus=policy` scrollt in die Sektion
   - `edit=1&focus=policy` öffnet die Zuordnung direkt
   - Action Queue nutzt jetzt diesen Deep Link für fehlende Verknüpfungen

## Feature-Flag

1. Neuer Flag im Register-First-Flagset:
   - `registerWorkflowLinks`
2. Umgebungsvariablen:
   - `NEXT_PUBLIC_REGISTER_WORKFLOW_LINKS_ENABLED`
   - `REGISTER_WORKFLOW_LINKS_ENABLED`
3. Aktuelle Deploy-Konfiguration:
   - `apphosting.yaml`: aktiviert
   - `netlify.toml`: aktiviert
4. Bei deaktiviertem Flag bleibt die Detailseite funktional; nur die Verknüpfungssektion wird ausgeblendet.

## Smoke-Test

1. `src/lib/register-first/workflow-links.test.ts`
2. Deckt ab:
   - Link setzen
   - Link auflösen / anzeigen
   - Link entfernen
3. Ergänzend prüft `src/lib/control/__tests__/action-queue-engine.smoke.ts`, dass fehlende Verknüpfungen jetzt einen direkten Policy-Focus-Link erzeugen.

## Risiken

1. `policyLinks` kann bereits rohe URL-Referenzen aus bestehender Org-/Policy-Pflege enthalten; diese werden neutral angezeigt, aber nicht in der Dokumentsuche aufgelöst.
2. Der Vertrag erlaubt mehrere Referenzen; die UI bleibt deshalb bewusst listenförmig und reduziert nicht künstlich auf genau ein Dokument.
3. Wenn keine Register-Dokumente vorhanden sind, bleibt nur der Anzeige-/Entfernungsfall verfügbar; die Suche zeigt dann bewusst einen leeren, ruhigen Zustand.

## Rollback

1. Revert der Dateien:
   - `src/components/register/detail/use-case-workflow-link-section.tsx`
   - `src/components/register/detail/use-case-metadata-section.tsx`
   - `src/app/my-register/[useCaseId]/page.tsx`
   - `src/lib/register-first/workflow-links.ts`
   - `src/lib/register-first/workflow-links.test.ts`
   - `src/lib/control/action-queue-engine.ts`
   - `src/lib/control/__tests__/action-queue-engine.smoke.ts`
   - `src/lib/register-first/flags.ts`
   - `apphosting.yaml`
   - `netlify.toml`
2. Oder nur Feature-Flag deaktivieren:
   - `NEXT_PUBLIC_REGISTER_WORKFLOW_LINKS_ENABLED=false`
3. Keine Datenmigration nötig; bestehende `policyLinks` bleiben unverändert im Register gespeichert.
