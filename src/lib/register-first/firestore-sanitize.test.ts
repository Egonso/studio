import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeFirestorePayload } from "./firestore-sanitize";

test("sanitizeFirestorePayload entfernt undefined tief in Register-Payloads", () => {
  const payload = sanitizeFirestorePayload({
    organisationName: "Test GmbH",
    orgSettings: {
      raci: {
        aiOwner: {
          name: "Jane Doe",
          email: undefined,
          department: undefined,
        },
        reviewOwner: null,
      },
      reviewCycle: {
        type: "fixed",
        interval: undefined,
      },
    },
  });

  assert.deepEqual(payload, {
    organisationName: "Test GmbH",
    orgSettings: {
      raci: {
        aiOwner: {
          name: "Jane Doe",
        },
        reviewOwner: null,
      },
      reviewCycle: {
        type: "fixed",
      },
    },
  });
});

test("sanitizeFirestorePayload behaelt null, false und leere Strings", () => {
  const payload = sanitizeFirestorePayload({
    organisationUnit: null,
    publicOrganisationDisclosure: false,
    orgSettings: {
      aiPolicy: {
        url: "",
      },
    },
  });

  assert.deepEqual(payload, {
    organisationUnit: null,
    publicOrganisationDisclosure: false,
    orgSettings: {
      aiPolicy: {
        url: "",
      },
    },
  });
});
