
# Anleitung: Firebase Function bereitstellen (Finaler Prozess)

Damit Ihr neuer Stripe-Webhook für zukünftige Käufe funktioniert, müssen wir den Code in die Cloud hochladen. Folgen Sie einfach diesen Schritten.

**Alle folgenden Befehle müssen von Ihrem `desktop`-Verzeichnis aus ausgeführt werden, es sei denn, es wird anders angegeben.**

---

### Schritt 1: Das Terminal im **Hauptprojektordner** (`desktop`) öffnen

Stellen Sie sicher, dass Ihr Terminal im Hauptverzeichnis Ihres Projekts geöffnet ist. Dies ist der Ordner, der `src`, `functions` und `package.json` enthält.

---

### Schritt 2: In das `functions`-Verzeichnis wechseln

Führen Sie diesen Befehl im Terminal aus:

```bash
cd functions
```

---

### Schritt 3: Die Abhängigkeiten der Funktion installieren (falls noch nicht geschehen)

Führen Sie diesen Befehl aus, während Sie sich im `functions`-Verzeichnis befinden:

```bash
npm install
```

---

### Schritt 4: Den Funktions-Code kompilieren

Dieser Befehl ist entscheidend. Er übersetzt Ihren TypeScript-Code (`.ts`) in lauffähigen JavaScript-Code (`.js`), den Firebase versteht.

Führen Sie diesen Befehl aus, während Sie sich im `functions`-Verzeichnis befinden:

```bash
npm run build
```

Nachdem dieser Befehl erfolgreich war, sollte ein `lib`-Ordner innerhalb Ihres `functions`-Ordners existieren.

---

### Schritt 5: Zurück ins Hauptverzeichnis wechseln (SEHR WICHTIG)

Führen Sie diesen Befehl aus, um wieder in den `desktop`-Ordner zu gelangen:

```bash
cd ..
```

---

### Schritt 6: Die Funktion bereitstellen

Jetzt, da der Code kompiliert ist, laden wir ihn in die Cloud hoch.

Führen Sie diesen Befehl von Ihrem **Hauptprojektordner (`desktop`)** aus:

```bash
firebase deploy --only functions
```

Wenn alles geklappt hat, sehen Sie eine Erfolgsmeldung, die bestätigt, dass die `stripeWebhook`-Funktion bereitgestellt wurde. Das Terminal sollte **NICHT** mehr fragen, ob Sie die Funktion löschen möchten.

---

### Schritt 7: Geheime Schlüssel (Environment Variables) hinzufügen

Falls noch nicht geschehen, folgen Sie den Schritten aus der vorherigen Anleitung, um Ihre Stripe-Schlüssel (`STRIPE_API_KEY` und `STRIPE_WEBHOOK_SECRET`) sicher in der Google Cloud Console zu hinterlegen.

---

### Fertig!

Das System ist jetzt für alle zukünftigen Käufe korrekt konfiguriert.
