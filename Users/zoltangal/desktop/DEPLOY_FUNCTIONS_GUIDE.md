# Anleitung: Firebase Function bereitstellen (Finaler Prozess)

Dieser Prozess wird jetzt funktionieren. Die vorherigen Probleme wurden durch eine vollständige Neukonfiguration des `functions`-Ordners behoben.

**WICHTIG:** Führen Sie die Befehle genau wie beschrieben im richtigen Verzeichnis aus.

---

### Phase 1: Code kompilieren (Der entscheidende erste Schritt)

Dieser Schritt übersetzt Ihren TypeScript-Code (`.ts`) in lauffähigen JavaScript-Code (`.js`), den Firebase versteht. **Ohne diesen Schritt kann das Deployment nicht funktionieren.**

1.  Öffnen Sie Ihr Terminal. Stellen Sie sicher, dass Sie sich im Hauptprojektordner (`/Users/zoltangal/desktop`) befinden.

2.  Wechseln Sie in das `functions`-Verzeichnis:
    ```bash
    cd functions
    ```

3.  Führen Sie den Build-Befehl aus, um den Code zu kompilieren:
    ```bash
    npm run build
    ```
    **Erwartetes Ergebnis:** Im Gegensatz zu vorher sollte dieser Befehl jetzt **keine lange Hilfeliste** mehr ausgeben. Er sollte entweder **gar nichts** ausgeben und einfach zur nächsten Zeile springen oder eine kurze Erfolgsmeldung zeigen. Danach existiert der Ordner `lib` mit der Datei `index.js` darin. **Der Fehler `functions/lib/index.js does not exist` ist damit behoben.**

---

### Phase 2: Code in die Cloud hochladen

Jetzt, da der Code kompiliert ist, laden wir ihn in die Cloud hoch.

1.  Wechseln Sie vom `functions`-Verzeichnis **zurück in den Hauptprojektordner** (sehr wichtig!):
    ```bash
    cd ..
    ```

2.  Stellen Sie sicher, dass Sie sich im richtigen Verzeichnis befinden. Der `pwd`-Befehl sollte `/Users/zoltangal/desktop` ausgeben:
    ```bash
    pwd
    ```

3.  Stellen Sie die Funktion bereit. Dieser Befehl wird nun Ihren **kompilierten** Code finden und ihn in die Cloud hochladen. Er wird die Funktion `stripeWebhook` neu erstellen.
    ```bash
    firebase deploy --only functions
    ```
    **Erfolg!** Der Befehl sollte nun durchlaufen und anzeigen, dass `stripeWebhook` erstellt oder aktualisiert wird.

---

### Phase 3: Geheime Schlüssel hinzufügen

Folgen Sie den Schritten aus der vorherigen Anleitung, um Ihre Stripe-Schlüssel (`STRIPE_API_KEY` und `STRIPE_WEBHOOK_SECRET`) sicher in der Google Cloud Console zu hinterlegen. Der Link zur Funktion wird nach dem erfolgreichen Deployment im Terminal angezeigt und sollte nun funktionieren.
