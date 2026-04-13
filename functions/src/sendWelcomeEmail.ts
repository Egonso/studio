import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import {
  resolveFunctionsEmailitApiKey,
  resolveFunctionsEmailitFromEmail,
  resolveFunctionsEmailitTemplate,
  sendEmailitTemplateEmail,
} from './emailit';

function resolveTemplateId(): string {
  return (
    resolveFunctionsEmailitTemplate(
      'EMAILIT_WELCOME_TEMPLATE',
      'welcome_template',
    ) || 'welcome'
  );
}

function resolveSenderEmail(): string {
  return (
    resolveFunctionsEmailitFromEmail() ||
    'ki-eu-akt@momofeichtinger.com'
  );
}

export const sendWelcomeEmailOnPurchase = functions.firestore
  .document('stripe_events/{eventId}')
  .onCreate(async (snap) => {
    try {
      const emailitApiKey = resolveFunctionsEmailitApiKey();
      if (!emailitApiKey) {
        console.error('EMAILIT_API_KEY is not configured');
        return null;
      }
      const eventData = snap.data();

      // Check if this is a successful checkout event
      if (eventData.type !== 'checkout.session.completed') {
        console.log('Event type is not checkout.session.completed, skipping');
        return null;
      }

      // Extract customer information from the event
      const customerEmail = eventData.email || eventData.raw?.customer_details?.email || eventData.metadata?.customerEmail;
      const customerName = eventData.metadata?.customerName || eventData.raw?.customer_details?.name || 'Kunde';
      const companyName = eventData.metadata?.companyName || '';
      const amount = eventData.raw?.amount_total || 0;
      const currency = eventData.raw?.currency || 'eur';

      if (!customerEmail) {
        console.error('No customer email found in event data');
        return null;
      }

      console.log(`Sending welcome email to: ${customerEmail}`);

      await sendEmailitTemplateEmail({
        apiKey: emailitApiKey,
        to: customerEmail,
        from: resolveSenderEmail(),
        template: resolveTemplateId(),
        idempotencyKey: `welcome-email-${snap.id}`,
        variables: {
          customerName: customerName,
          customerEmail: customerEmail,
          companyName: companyName,
          loginUrl: 'https://fortbildung.eukigesetz.com/login',
          supportEmail: 'KI-EU-Akt@momofeichtinger.com',
          amount: (amount / 100).toFixed(2), // Convert cents to euros
          currency: currency.toUpperCase(),
        },
        meta: {
          customerEmail,
          eventId: snap.id,
        },
      });

      console.log(`Welcome email sent successfully to ${customerEmail}`);

      // Update the event document to mark email as sent
      await snap.ref.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;
    } catch (error) {
      console.error('Error sending welcome email:', error);

      // Update the event document to mark email as failed
      await snap.ref.update({
        emailSent: false,
        emailError: (error as Error).message,
        emailErrorAt: admin.firestore.FieldValue.serverTimestamp()
      });

      throw error;
    }
  });
