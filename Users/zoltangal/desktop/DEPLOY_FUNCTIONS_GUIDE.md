# Anleitung: Firebase Function bereitstellen (Finaler Prozess)

Sie haben es fast geschafft. Dieser Prozess wird jetzt funktionieren. Der Schlüssel sind zwei einfache Phasen, die in der richtigen Reihenfolge ausgeführt werden müssen.

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
    Nachdem dieser Befehl erfolgreich war, existiert der Ordner `lib` mit der Datei `index.js` darin. **Der Fehler `functions/lib/index.js does not exist` ist damit behoben.**

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

3.  Stellen Sie die Funktion bereit. Dieser Befehl wird nun Ihren **kompilierten** Code finden und ihn in die Cloud hochladen. Die Frage, ob etwas gelöscht werden soll, wird nicht mehr erscheinen. Stattdessen wird die Funktion `stripeWebhook` erstellt.
    ```bash
    firebase deploy --only functions
    ```
    **Erfolg!** Der Befehl sollte nun durchlaufen und anzeigen, dass `stripeWebhook` erstellt wird.

---

### Phase 3: Geheime Schlüssel hinzufügen (Letzter Schritt!)

Damit Ihre Funktion mit Stripe kommunizieren kann, müssen Sie ihr die API-Schlüssel sicher mitteilen.

1.  **Öffnen Sie die Google Cloud Console für Ihr Projekt:**
    *   Warten Sie nach dem erfolgreichen Deployment ca. 1-2 Minuten.
    *   Klicken Sie auf diesen Link: [https://console.cloud.google.com/functions/details/us-central1/stripeWebhook?project=ai-act-compass-m6o05](https://console.cloud.google.com/functions/details/us-central1/stripeWebhook?project=ai-act-compass-m6o05)
    *   Die Seite sollte jetzt nicht mehr "Resource not found" anzeigen, sondern die Details Ihrer Funktion.

2.  **Gehen Sie zum Bearbeiten der Funktion:**
    *   Klicken Sie oben auf die Schaltfläche **"BEARBEITEN"**.

3.  **Öffnen Sie die Laufzeit-Einstellungen:**
    *   Klicken Sie auf **"WEITER"**, um zum Abschnitt **"Laufzeit-, Build- und Verbindungseinstellungen"** zu gelangen.

4.  **Fügen Sie die geheimen Schlüssel hinzu:**
    *   Scrollen Sie zum Unterabschnitt **"Laufzeitumgebungsvariablen"**.
    *   Klicken Sie auf **"+ VARIABLE HINZUFÜGEN"**:
        *   **Name:** `STRIPE_API_KEY`
        *   **Wert:** Ihr geheimer Stripe-API-Schlüssel (`sk_...`).
    *   Klicken Sie erneut auf **"+ VARIABLE HINZUFÜGEN"**:
        *   **Name:** `STRIPE_WEBHOOK_SECRET`
        *   **Wert:** Ihr Stripe-Webhook-Signaturgeheimnis (`whsec_...`).

5.  **Speichern:**
    *   Klicken Sie unten auf **"WEITER"** und dann auf **"BEREITSTELLEN"**.

---

### ✅ Fertig!

Ihr System ist jetzt **vollständig konfiguriert**.