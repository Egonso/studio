export function getPublicSiteOrigin(): string {
  const rawOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (!rawOrigin) {
    return 'https://kiregister.com';
  }

  return rawOrigin.replace(/\/+$/, '');
}

export const PUBLIC_ORGANIZATION = {
  name: 'KI-Register',
  legalName: 'ZukunftBilden GmbH & BewusstseinBilden UG',
  email: 'zoltangal@web.de',
};
