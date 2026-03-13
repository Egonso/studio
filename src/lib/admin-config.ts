const RAW_ADMIN_EMAILS = [
  'mo.feich@gmail.com',
  'zoltangal@web.com',
] as const;

export const ADMIN_EMAILS = Object.freeze(
  RAW_ADMIN_EMAILS.map((email) => email.trim().toLowerCase()),
);

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && ADMIN_EMAILS.includes(normalized));
}
