import { buildCertificateVerifyUrl } from './public';
import type { BadgeAlignment, PersonCertificateRecord } from './types';

export const CERTIFICATE_BADGE_ASSET_URL = '';

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
  const normalizedAssetUrl = assetUrl.trim();
  const sealMarkup = normalizedAssetUrl
    ? `<img src="${escapeHtml(normalizedAssetUrl)}"
           alt="AI Register Quality Seal"
           style="width:28px;height:28px;display:block;object-fit:cover;filter:grayscale(1) contrast(1.15);" />`
    : `<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;">KR</span>`;

  return `<div style="text-align:${textAlign};">
  <a href="${verifyUrl}"
     target="_blank"
     rel="noopener noreferrer"
     aria-label="Verify certificate of ${safeHolderName}"
     style="text-decoration:none;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="display:inline-flex;align-items:stretch;min-width:0;border:1px solid #111827;background:#ffffff;color:#111827;">
      <div style="display:flex;align-items:center;justify-content:center;padding:12px;border-right:1px solid #111827;background:#111827;min-width:52px;">
        ${sealMarkup}
      </div>
      <div style="display:flex;flex-direction:column;justify-content:center;gap:4px;padding:11px 14px;min-width:0;text-align:left;">
        <div style="font-size:11px;line-height:1;text-transform:uppercase;letter-spacing:0.2em;color:#6b7280;">AI Register</div>
        <div style="font-size:14px;line-height:1.2;font-weight:600;color:#111827;">Verified Certificate</div>
        <div style="font-size:11px;line-height:1.2;color:#4b5563;">Verify code ${escapeHtml(certificate.certificateCode)}</div>
      </div>
    </div>
  </a>
</div>`;
}
