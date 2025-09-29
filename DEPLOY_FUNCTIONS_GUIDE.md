
# Anleitung: Firebase Function & Regeln bereitstellen (Vereinfachter Prozess)

Damit Ihr neuer Stripe-Webhook für zukünftige Käufe funktioniert, müssen wir den Code in die Cloud hochladen. Folgen Sie einfach diesen Schritten.

---

### Schritt 1: Das Terminal im **Hauptprojektordner** öffnen

Stellen Sie sicher, dass Ihr Terminal im Hauptverzeichnis Ihres Projekts geöffnet ist. Dies ist der Ordner, der `src`, `functions` und `package.json` enthält.

**Alle folgenden Befehle müssen von diesem Hauptordner aus ausgeführt werden.**

---

### Schritt 2: In das `functions`-Verzeichnis wechseln

```bash
cd functions
```

---

### Schritt 3: Die Abhängigkeiten der Funktion installieren (falls noch nicht geschehen)

```bash
npm install
```

---

### Schritt 4: Den Funktions-Code kompilieren

Dieser Befehl übersetzt Ihren TypeScript-Code (`.ts`) in lauffähigen JavaScript-Code (`.js`), den Firebase versteht.

```bash
npm run build
```

Nachdem dieser Befehl erfolgreich war, sollte ein `lib`-Ordner innerhalb Ihres `functions`-Ordners existieren.

---

### Schritt 5: Zurück ins Hauptverzeichnis wechseln (SEHR WICHTIG)

```bash
cd ..
```

---

### Schritt 6: Die Funktion bereitstellen

Jetzt, da der Code kompiliert ist, laden wir ihn in die Cloud hoch.

```bash
firebase deploy --only functions
```

Wenn alles geklappt hat, sehen Sie eine Erfolgsmeldung, die bestätigt, dass die `stripeWebhook`-Funktion bereitgestellt wurde.

---

### Schritt 7: Die Firestore-Regeln bereitstellen

Falls noch nicht geschehen, führen Sie diesen Befehl aus, um die Sicherheitsregeln zu aktualisieren.

```bash
firebase deploy --only firestore:rules
```

---

### Schritt 8: Geheime Schlüssel (Environment Variables) hinzufügen

Falls noch nicht geschehen, folgen Sie den Schritten aus der vorherigen Anleitung, um Ihre Stripe-Schlüssel (`STRIPE_API_KEY` und `STRIPE_WEBHOOK_SECRET`) sicher in der Google Cloud Console zu hinterlegen.

---

### Fertig!

Das System ist jetzt für alle zukünftigen Käufe korrekt konfiguriert.
