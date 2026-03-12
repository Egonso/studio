# Existing-User Login Flow

Stand: 2026-03-12  
Scope: `'/landingsimple'`, `SetupSection`, `'/login'`, bestehende Nutzer im Register-Kontext

## Alte Verwirrung

1. `'/landingsimple'` verlinkte bestehende Nutzer auf die generische Login-Seite ohne klaren Bestandsnutzer-Modus.
2. Mehrere Existing-User-CTAs bauten Login-Links lokal und uneinheitlich zusammen.
3. `'/login'` zeigte fuer Bestandsnutzer dieselbe gemischte Login/Registrieren-UI wie fuer Neuregistrierung.
4. Bereits vorbelegte E-Mail oder Import-/Purchase-Kontext schob die Seite leicht in Registrierungs-UI, auch wenn die Person sich klar anmelden wollte.
5. Der Purchase-Hinweis arbeitete mit Growth-Sprache statt mit ruhiger Register-Fuehrung.

## Neuer Existing-User-Pfad

1. Bestehende Nutzer gehen aus `'/landingsimple'` und aus den Onboarding-Hinweisen gezielt auf `'/login?mode=login'`.
2. Existing-User-CTAs aus Setup- und Invite-Kontext uebergeben weiter ihre vorhandenen Query-Werte:
   `email`, `code`, `workspaceInvite`, `importUseCase`, `purchase`, `session_id`.
3. `mode=login` ist jetzt ein expliziter Bestandsnutzer-Flow:
   Die Login-Seite zeigt nur den Anmeldepfad und blendet die gemischte Tab-UI fuer diesen Einstieg aus.
4. Sonderkontexte werden auf `'/login'` ruhig erklaert:
   Einladungscode, Import, Workspace-Einladung und Kaufkontext bleiben sichtbar und erhalten.
5. Falls doch registriert werden muss, fuehrt ein leiser Sekundaer-Link in die Registrierung, ohne Query-Kontext zu verlieren.

## Erhaltene Sonderfaelle

1. Invite-Code:
   Login mit `code` leitet nach erfolgreicher Anmeldung weiter auf `'/erfassen?code=...'`.
2. Import:
   Login mit `importUseCase` leitet nach erfolgreicher Anmeldung weiter auf `'/einrichten?import=...'`.
3. Purchase:
   `purchase` und `session_id` bleiben auf `'/login'` erhalten; die Seite haelt die E-Mail-Fuehrung dafuer sichtbar.
4. Workspace-Einladung:
   `workspaceInvite` bleibt im Login-Link erhalten und wird nach Anmeldung oder Registrierung weiterhin von `'/api/invites/accept'` verarbeitet.

## Umsetzung

1. Gemeinsamer Builder fuer Login-Links:
   `src/lib/auth/login-routing.ts`
2. Landing- und Setup-Einstiege wurden auf denselben Existing-User-Flow gestellt.
3. `'/login'` steuert Initial-Flow und Kontext-Hinweise jetzt aus den Query-Parametern statt aus verstreuter UI-Logik.
4. Growth-Copy im Purchase-Kontext wurde durch ruhige, registerbezogene Hinweise ersetzt.

## Manueller Smoke-Test

1. Normaler Login
   Auf `'/landingsimple'` oben rechts `Anmelden` klicken.
   Erwartung: `'/login?mode=login'`, keine gemischte Tab-UI, nur klarer Login-Card.

2. Login mit Invite-Code
   `'/einladen?code=AI-XXXXXX'` oeffnen und `Anmelden` waehlen.
   Erwartung: `code` bleibt in der URL, Login-Ansicht zeigt Hinweis zum Einladungscode, erfolgreiche Anmeldung fuehrt auf `'/erfassen?code=AI-XXXXXX'`.

3. Login mit Purchase-/Import-Kontext
   Variante Import: `'/login?mode=login&importUseCase=PUBLIC_ID'`.
   Variante Purchase: `'/login?mode=login&purchase=true&session_id=cs_test_123'`.
   Erwartung: ruhige Login-Ansicht ohne Register-Tab-Mischung; Import bleibt fuer den Redirect erhalten; Purchase-Kontext bleibt fuer E-Mail-/Login-Fuehrung sichtbar.

## Risiken

1. Die Registrierungslogik auf `'/login'` bleibt fachlich unveraendert; diese Aenderung loest nur die Existing-User-Fuehrung.
2. Externe Deep Links, die bewusst ohne `mode=login` oder `mode=signup` kommen, laufen weiter ueber die kontextabhaengige Default-Steuerung.
3. Workspace-Invite-Registrierung bleibt von der bestehenden Backend- und Kauf-Logik abhaengig.

## Rollback

1. Revert von:
   `src/lib/auth/login-routing.ts`
   `src/app/landingsimple/page.tsx`
   `src/components/landing/setup-section.tsx`
   `src/app/einrichten/page.tsx`
   `src/app/einladen/page.tsx`
   `src/app/login/page.tsx`
   `src/app/api/invites/route.ts`
   `src/components/trust-portal/portal-systems-table.tsx`
2. Doku entfernen:
   `docs/EXISTING_USER_LOGIN_FLOW_2026-03-12.md`
