import { buildCertificateVerifyUrl } from './public';
import type { BadgeAlignment, PersonCertificateRecord } from './types';

export const CERTIFICATE_BADGE_ASSET_URL =
  'https://i.postimg.cc/Dwym3LgN/EU-AI-Act-SIEGEL-2160-x-1080-px-Anhanger-25-x-25-Zoll2.webp';

const alignmentStyles: Record<BadgeAlignment, string> = {
  left: 'left',
  center: 'center',
  right: 'right',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildCertificateBadgeMarkup(
  certificate:
    | Pick<PersonCertificateRecord, 'certificateCode' | 'holderName'>
    | { certificateCode: string; holderName: string },
  alignment: BadgeAlignment = 'center',
  assetUrl: string = CERTIFICATE_BADGE_ASSET_URL,
): string {
  const safeHolderName = escapeHtml(certificate.holderName);
  const verifyUrl = buildCertificateVerifyUrl(certificate.certificateCode);
  const textAlign = alignmentStyles[alignment] ?? alignmentStyles.center;

  return `<div style="text-align:${textAlign};">
  <a href="${verifyUrl}"
     target="_blank"
     rel="noopener noreferrer"
     aria-label="Zertifikat von ${safeHolderName} prüfen"
     style="text-decoration:none;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="display:inline-flex;align-items:center;gap:10px;border:1px solid #1f4d5b;border-radius:14px;padding:10px 14px;background:linear-gradient(135deg,#0f172a,#111827);color:#e5f7fb;box-shadow:0 10px 30px rgba(2,8,23,0.25);">
      <img src="${escapeHtml(assetUrl)}"
           alt="KI-Register Zertifikat"
           style="width:44px;height:44px;flex-shrink:0;border-radius:9999px;" />
      <div style="display:flex;flex-direction:column;justify-content:center;min-width:0;">
        <div style="font-weight:600;font-size:14px;line-height:1.2;color:#f8fafc;">KI-Register zertifiziert</div>
        <div style="font-size:12px;line-height:1.2;color:#7dd3fc;">Code ${escapeHtml(certificate.certificateCode)} verifizieren</div>
      </div>
    </div>
  </a>
</div>`;
}
