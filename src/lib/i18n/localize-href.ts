export function localizeHref(locale: string, href: string): string {
  if (!href || href.startsWith('#')) {
    return href;
  }

  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return href;
  }

  if (href === '/') {
    return `/${locale}`;
  }

  if (href === `/${locale}` || href.startsWith(`/${locale}/`)) {
    return href;
  }

  return `/${locale}${href.startsWith('/') ? href : `/${href}`}`;
}
