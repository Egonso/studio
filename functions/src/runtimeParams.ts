import {
  defineSecret,
  defineString,
} from 'firebase-functions/params';

export const emailitApiKeySecret = defineSecret('EMAILIT_API_KEY');
export const supplierSessionSecret = defineSecret('SUPPLIER_SESSION_SECRET');

export const emailitFromEmailParam = defineString('EMAILIT_FROM_EMAIL');
export const emailitSupplierReminderTemplateParam = defineString(
  'EMAILIT_SUPPLIER_REMINDER_TEMPLATE',
);
export const emailitWelcomeTemplateParam = defineString(
  'EMAILIT_WELCOME_TEMPLATE',
  {
    default: 'welcome',
  },
);
export const appPublicOriginParam = defineString('APP_PUBLIC_ORIGIN', {
  default: 'https://kiregister.com',
});

