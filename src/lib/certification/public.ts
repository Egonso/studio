import { buildPublicAppUrl } from '@/lib/app-url';

export function buildCertificateVerifyHref(certificateCode: string): string {
  return `/verify/${encodeURIComponent(certificateCode)}`;
}

export function buildCertificateVerifyUrl(certificateCode: string): string {
  return buildPublicAppUrl(buildCertificateVerifyHref(certificateCode));
}
