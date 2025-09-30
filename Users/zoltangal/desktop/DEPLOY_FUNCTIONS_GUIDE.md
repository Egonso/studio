# Anleitung: Firebase Function & Regeln bereitstellen (Finaler Prozess)

Sie haben es fast geschafft! Die folgenden Schritte stellen sicher, dass Ihr `stripeWebhook` korrekt bereitgestellt wird und für zukünftige Käufe funktioniert.

**WICHTIG:** Alle `firebase`-Befehle müssen vom **Hauptprojektordner** aus ausgeführt werden (in Ihrem Fall `/Users/zoltangal/desktop`).

---

### Phase 1: Code kompilieren (Sehr wichtiger erster Schritt)

Dieser Schritt übersetzt Ihren TypeScript-Code (`.ts`) in lauffähigen JavaScript-Code (`.js`), den Firebase versteht.

1.  Öffnen Sie Ihr Terminal. Stellen Sie sicher, dass Sie sich im Hauptprojektordner (`/Users/zoltangal/desktop`) befinden.
2.  Wechseln Sie in das `functions`-Verzeichnis:
    ```bash
    cd functions
    ```
3.  Installieren Sie die notwendigen Pakete (falls noch nicht geschehen):
    ```bash
    npm install
    ```
4.  Führen Sie den Build-Befehl aus, um den Code zu kompilieren:
    ```bash
    npm run build
    ```
    Nachdem dieser Befehl erfolgreich war, sollte ein `lib`-Ordner innerhalb Ihres `functions`-Ordners existieren.

---

### Phase 2: Code und Regeln bereitstellen

Jetzt, da der Code kompiliert ist, laden wir ihn in die Cloud hoch.

1.  Wechseln Sie vom `functions`-Verzeichnis **zurück in den Hauptprojektordner** (sehr wichtig!):
    ```bash
    cd ..
    ```
2.  Stellen Sie sicher, dass Sie sich im richtigen Verzeichnis befinden. Der `pwd`-Befehl sollte `/Users/zoltangal/desktop` ausgeben:
    ```bash
    pwd
    ```
3.  Stellen Sie die Firestore-Regeln bereit (falls noch nicht geschehen):
    ```bash
    firebase deploy --only firestore:rules
    ```
4.  Stellen Sie die Funktionen bereit. Dieser Befehl wird nun Ihren lokalen Code finden und ihn in die Cloud hochladen.
    ```bash
    firebase deploy --only functions
    ```
    **Erfolg!** Der Befehl sollte nun ohne die Frage nach dem Löschen durchlaufen und anzeigen, dass `stripeWebhook` erstellt oder aktualisiert wird.

---

### Phase 3: Geheime Schlüssel hinzufügen (Letzter Schritt!)

Damit Ihre Funktion mit Stripe kommunizieren kann, müssen Sie ihr die API-Schlüssel sicher mitteilen.

1.  **Öffnen Sie die Google Cloud Console für Ihr Projekt:**
    *   Klicken Sie auf diesen Link: [https://console.cloud.google.com/functions/details/us-central1/stripeWebhook?project=ai-act-compass-m6o05](https://console.cloud.google.com/functions/details/us-central1/stripeWebhook?project=ai-act-compass-m6o05)
    *   (Möglicherweise müssen Sie sich mit Ihrem Google-Konto anmelden und 1-2 Minuten warten, bis die Funktion nach dem Deployment in der Liste erscheint.)

2.  **Gehen Sie zum Bearbeiten der Funktion:**
    *   Klicken Sie oben auf die Schaltfläche **"BEARBEITEN"**.

3.  **Öffnen Sie die Laufzeit-Einstellungen:**
    *   Klicken Sie auf **"WEITER"**, um zum Abschnitt **"Laufzeit-, Build- und Verbindungseinstellungen"** zu gelangen.
    *   Öffnen Sie diesen Abschnitt (falls er nicht schon offen ist).

4.  **Fügen Sie die geheimen Schlüssel hinzu:**
    *   Scrollen Sie nach unten zum Unterabschnitt **"Laufzeitumgebungsvariablen"**.
    *   Klicken Sie auf **"+ VARIABLE HINZUFÜGEN"**.
        *   **Name:** `STRIPE_API_KEY`
        *   **Wert:** Fügen Sie hier Ihren **geheimen Stripe-API-Schlüssel** ein (er beginnt mit `sk_live_...` oder `sk_test_...`).
    *   Klicken Sie erneut auf **"+ VARIABLE HINZUFÜGEN"**.
        *   **Name:** `STRIPE_WEBHOOK_SECRET`
        *   **Wert:** Fügen Sie hier Ihr **Stripe-Webhook-Signaturgeheimnis** ein (es beginnt mit `whsec_...`). Sie finden dieses in Ihrem Stripe-Dashboard unter "Entwickler" -> "Webhooks" -> der entsprechende Endpunkt.

5.  **Speichern Sie die Funktion:**
    *   Klicken Sie ganz unten auf die Schaltfläche **"WEITER"** und dann auf **"BEREITSTELLEN"**.
    *   Die Funktion wird nun mit den neuen Umgebungsvariablen neu bereitgestellt. Dieser Vorgang kann 1-2 Minuten dauern.

---

### ✅ Fertig!

Sobald die Bereitstellung abgeschlossen ist, ist Ihr System **vollständig konfiguriert** und bereit, zukünftige Käufe sicher über den Stripe Webhook zu verarbeiten. Es sind keine weiteren Schritte erforderlich. Großartige Arbeit!
