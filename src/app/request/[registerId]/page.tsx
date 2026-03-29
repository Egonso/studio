import SupplierRequestForm from "./client";
import SupplierInviteFlow from "./invite-client";

import { PageStatePanel, PublicIntakeShell } from "@/components/product-shells";
import { resolveSupplierRequestTokenAccess } from "@/lib/register-first/request-token-admin";
import { resolveSupplierInviteAccess } from "@/lib/register-first/supplier-invites";

function renderError(title: string, description: string) {
  return (
    <PublicIntakeShell
      title="Lieferantenangaben einreichen"
      description="Dieser Link dient nur zur strukturierten Erfassung von Angaben. Interne Register- oder Governance-Ansichten bleiben dabei verborgen."
      actions={[]}
      asidePoints={[
        "Angaben werden intern als nachvollziehbare Einreichung gespeichert.",
        "Nur der signierte und noch gueltige Link erlaubt diese Einreichung.",
      ]}
    >
      <PageStatePanel
        tone="error"
        area="public_external_intake"
        title={title}
        description={description}
      />
    </PublicIntakeShell>
  );
}

function isV2InviteToken(token: string): boolean {
  return token.startsWith("sinv1.");
}

export default async function SupplierRequestPage({
  params,
}: {
  params: Promise<{ registerId: string }>;
}) {
  const { registerId: encodedRequestToken } = await params;
  const requestToken = decodeURIComponent(encodedRequestToken);

  // ── V2 Invite Flow ──────────────────────────────────────────────────────
  if (isV2InviteToken(requestToken)) {
    let inviteAccess;
    try {
      inviteAccess = await resolveSupplierInviteAccess(requestToken);
    } catch (error) {
      console.error("Supplier invite resolution failed:", error);
      return renderError(
        "Dienst nicht verfuegbar",
        "Bitte versuchen Sie es in wenigen Minuten erneut."
      );
    }

    if (!inviteAccess.ok) {
      switch (inviteAccess.reason) {
        case "expired":
          return renderError(
            "Anfrage abgelaufen",
            "Diese Lieferantenanfrage ist nicht mehr gueltig. Bitte wenden Sie sich an den Absender."
          );
        case "revoked":
          return renderError(
            "Anfrage zurueckgezogen",
            "Diese Lieferantenanfrage wurde zurueckgezogen."
          );
        case "already_submitted":
          return renderError(
            "Bereits beantwortet",
            "Diese Lieferantenanfrage wurde bereits beantwortet."
          );
        case "register_not_found":
          return renderError(
            "Register nicht verfuegbar",
            "Dieses Register ist nicht mehr aktiv."
          );
        default:
          return renderError(
            "Ungueltiger Link",
            "Dieser Link ist ungueltig oder beschaedigt."
          );
      }
    }

    const organisationName =
      inviteAccess.value.register.organisationName ??
      inviteAccess.value.register.name ??
      "Unbekannt";

    return (
      <SupplierInviteFlow
        requestToken={requestToken}
        inviteId={inviteAccess.value.invite.inviteId}
        organisationName={organisationName}
        supplierOrganisationHint={inviteAccess.value.invite.supplierOrganisationHint ?? null}
        intendedEmail={inviteAccess.value.invite.intendedEmail}
        expiresAt={inviteAccess.value.invite.expiresAt}
        inviteStatus={inviteAccess.value.invite.status}
      />
    );
  }

  // ── V1 Legacy Flow ──────────────────────────────────────────────────────
  let tokenAccess;

  try {
    tokenAccess = await resolveSupplierRequestTokenAccess(requestToken);
  } catch (error) {
    console.error("Supplier request token resolution failed:", error);
    return renderError(
      "Dienst nicht verfuegbar",
      "Bitte versuchen Sie es in wenigen Minuten erneut."
    );
  }

  if (!tokenAccess.ok) {
    switch (tokenAccess.reason) {
      case "expired":
        return renderError(
          "Link abgelaufen",
          "Dieser Einreichungslink ist nicht mehr gueltig."
        );
      case "revoked":
        return renderError(
          "Link widerrufen",
          "Dieser Einreichungslink wurde bereits widerrufen."
        );
      case "register_not_found":
        return renderError(
          "Register nicht verfuegbar",
          "Dieses Register ist nicht mehr aktiv."
        );
      default:
        return renderError(
          "Ungueltiger Link",
          "Dieser Einreichungslink ist ungueltig oder beschaedigt."
        );
    }
  }

  const organisationName =
    tokenAccess.value.register.organisationName ??
    tokenAccess.value.register.name ??
    "Unbekannt";

  return (
    <SupplierRequestForm
      requestToken={requestToken}
      requestTokenId={tokenAccess.value.token.tokenId}
      organisationName={organisationName}
      expiresAt={tokenAccess.value.token.expiresAt}
    />
  );
}
