import test from "node:test";
import assert from "node:assert/strict";

import {
  getCaptureByCodeErrorCopy,
  stripCaptureByCodeDebugSuffix,
} from "./error-copy";

test("stripCaptureByCodeDebugSuffix entfernt interne API-Suffixe", () => {
  assert.equal(
    stripCaptureByCodeDebugSuffix(
      "Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut. [API-2-default-credentials]"
    ),
    "Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut."
  );
});

test("getCaptureByCodeErrorCopy mappt 503 bei Code-Prüfung auf generische Copy", () => {
  assert.deepEqual(
    getCaptureByCodeErrorCopy(
      503,
      "Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut. [API-2-default-credentials]",
      "validate"
    ),
    {
      title: "Dienst vorübergehend nicht verfügbar",
      description:
        "Der Zugangscode konnte gerade nicht geprüft werden. Bitte versuchen Sie es in wenigen Minuten erneut.",
    }
  );
});

test("getCaptureByCodeErrorCopy erkennt abgelaufene Codes", () => {
  assert.deepEqual(
    getCaptureByCodeErrorCopy(410, "Dieser Code ist abgelaufen", "validate"),
    {
      title: "Code abgelaufen",
      description:
        "Dieser Code ist abgelaufen",
    }
  );
});

test("getCaptureByCodeErrorCopy nutzt fuer Submit-400 den Formularhinweis", () => {
  assert.deepEqual(
    getCaptureByCodeErrorCopy(
      400,
      "Code, Use-Case Name und Owner-Rolle sind Pflichtfelder",
      "submit"
    ),
    {
      title: "Angaben prüfen",
      description:
        "Code, Use-Case Name und Owner-Rolle sind Pflichtfelder",
    }
  );
});
