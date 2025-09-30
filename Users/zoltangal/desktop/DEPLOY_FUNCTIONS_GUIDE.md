
# Anleitung: Firebase Function & Regeln bereitstellen (Finaler Prozess)

Sie haben es fast geschafft! Die folgenden Schritte stellen sicher, dass Ihr `stripeWebhook` korrekt bereitgestellt wird und für zukünftige Käufe funktioniert.

**WICHTIG:** Alle `firebase`-Befehle müssen vom **Hauptprojektordner** aus ausgeführt werden (in Ihrem Fall `/Users/zoltangal/desktop`).

---

### Phase 1: Code kompilieren (bereits erledigt)

Dieser Schritt übersetzt Ihren TypeScript-Code in lauffähigen JavaScript-Code. Sie haben dies bereits erfolgreich getan.

1.  Im Terminal in das `functions`-Verzeichnis wechseln:
    ```bash
    cd functions
    ```
2.  Die Abhängigkeiten installieren (falls noch nicht geschehen):
    ```bash
    npm install
    ```
3.  Den Code kompilieren:
    ```bash
    npm run build
    ```
    Danach sollte ein `lib`-Ordner in `functions` existieren.

---

### Phase 2: Code bereitstellen (bereits erledigt)

Sie haben den kompilierten Code und die Regeln erfolgreich in die Cloud hochgeladen.

1.  Vom `functions`-Verzeichnis zurück ins Hauptverzeichnis wechseln:
    ```bash
    cd ..
    ```
2.  Die Firestore-Regeln bereitstellen:
    ```bash
    firebase deploy --only firestore:rules
    ```
3.  Die Funktionen bereitstellen:
    ```bash
    firebase deploy --only functions
    ```
    **Erfolg!** Ihr letzter Terminal-Log hat bestätigt, dass dies funktioniert hat. Die `stripeWebhook`-Funktion ist jetzt live.

---

### Phase 3: Geheime Schlüssel hinzufügen (Letzter Schritt!)

Damit Ihre Funktion mit Stripe kommunizieren kann, müssen Sie ihr die API-Schlüssel sicher mitteilen.

1.  **Öffnen Sie die Google Cloud Console für Ihr Projekt:**
    *   Klicken Sie auf diesen Link: [https://console.cloud.google.com/functions/details/us-central1/stripeWebhook?project=ai-act-compass-m6o05](https://console.cloud.google.com/functions/details/us-central1/stripeWebhook?project=ai-act-compass-m6o05)
    *   (Möglicherweise müssen Sie sich mit Ihrem Google-Konto anmelden.)

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
