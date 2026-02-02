import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

// SendGrid configuration
const SENDGRID_API_KEY = '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';
const WELCOME_EMAIL_TEMPLATE_ID = 'd-31f1e6dcfac74aa7bcb399622afce289';
const SENDER_EMAIL = 'ki-eu-akt@momofeichtinger.com';

// Initialize SendGrid inside handler
// sgMail.setApiKey(SENDGRID_API_KEY);

export const sendWelcomeEmailOnPurchase = functions.firestore
  .document('stripe_events/{eventId}')
  .onCreate(async (snap, context) => {
    try {
      sgMail.setApiKey(SENDGRID_API_KEY);
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

      // Prepare email data for SendGrid template
      const emailData = {
        to: customerEmail,
        from: SENDER_EMAIL,
        templateId: WELCOME_EMAIL_TEMPLATE_ID,
        dynamicTemplateData: {
          customerName: customerName,
          customerEmail: customerEmail,
          companyName: companyName,
          loginUrl: 'https://fortbildung.eukigesetz.com/login',
          supportEmail: 'KI-EU-Akt@momofeichtinger.com',
          amount: (amount / 100).toFixed(2), // Convert cents to euros
          currency: currency.toUpperCase()
        }
      };

      // Send the email
      await sgMail.send(emailData);

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