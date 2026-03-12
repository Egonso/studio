import SupplierRequestForm from "./client";

import { PageStatePanel, PublicIntakeShell } from "@/components/product-shells";
import { resolveSupplierRequestTokenAccess } from "@/lib/register-first/request-token-admin";

function renderError(title: string, description: string) {
  return (
    <PublicIntakeShell
      title="Lieferantenangaben einreichen"
      description="Dieser öffentliche Lieferantenlink dient nur zur strukturierten Erfassung von Angaben. Interne Register- oder Governance-Ansichten bleiben dabei verborgen."
      actions={[]}
      asidePoints={[
        "Lieferantenangaben werden intern als nachvollziehbare Einreichung gespeichert.",
        "Nur der signierte und noch gültige Link erlaubt diese Einreichung.",
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

export default async function SupplierRequestPage({
  params,
}: {
  params: Promise<{ registerId: string }>;
}) {
  const { registerId: encodedRequestToken } = await params;
  const requestToken = decodeURIComponent(encodedRequestToken);
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
          "Dieser Lieferanten-Link ist nicht mehr gueltig."
        );
      case "revoked":
        return renderError(
          "Link widerrufen",
          "Dieser Lieferanten-Link wurde bereits widerrufen."
        );
      case "register_not_found":
        return renderError(
          "Register nicht verfuegbar",
          "Dieses Register ist nicht mehr aktiv."
        );
      default:
        return renderError(
          "Ungueltiger Link",
          "Dieser Lieferanten-Link ist ungueltig oder beschaedigt."
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
