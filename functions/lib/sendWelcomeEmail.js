"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmailOnPurchase = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const sgMail = __importStar(require("@sendgrid/mail"));
// SendGrid configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const WELCOME_EMAIL_TEMPLATE_ID = process.env.SENDGRID_WELCOME_TEMPLATE_ID || 'd-31f1e6dcfac74aa7bcb399622afce289';
const SENDER_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'ki-eu-akt@momofeichtinger.com';
// Initialize SendGrid inside handler
// sgMail.setApiKey(SENDGRID_API_KEY);
exports.sendWelcomeEmailOnPurchase = functions.firestore
    .document('stripe_events/{eventId}')
    .onCreate(async (snap, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        if (!SENDGRID_API_KEY) {
            console.error('SENDGRID_API_KEY is not configured');
            return null;
        }
        sgMail.setApiKey(SENDGRID_API_KEY);
        const eventData = snap.data();
        // Check if this is a successful checkout event
        if (eventData.type !== 'checkout.session.completed') {
            console.log('Event type is not checkout.session.completed, skipping');
            return null;
        }
        // Extract customer information from the event
        const customerEmail = eventData.email || ((_b = (_a = eventData.raw) === null || _a === void 0 ? void 0 : _a.customer_details) === null || _b === void 0 ? void 0 : _b.email) || ((_c = eventData.metadata) === null || _c === void 0 ? void 0 : _c.customerEmail);
        const customerName = ((_d = eventData.metadata) === null || _d === void 0 ? void 0 : _d.customerName) || ((_f = (_e = eventData.raw) === null || _e === void 0 ? void 0 : _e.customer_details) === null || _f === void 0 ? void 0 : _f.name) || 'Kunde';
        const companyName = ((_g = eventData.metadata) === null || _g === void 0 ? void 0 : _g.companyName) || '';
        const amount = ((_h = eventData.raw) === null || _h === void 0 ? void 0 : _h.amount_total) || 0;
        const currency = ((_j = eventData.raw) === null || _j === void 0 ? void 0 : _j.currency) || 'eur';
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
    }
    catch (error) {
        console.error('Error sending welcome email:', error);
        // Update the event document to mark email as failed
        await snap.ref.update({
            emailSent: false,
            emailError: error.message,
            emailErrorAt: admin.firestore.FieldValue.serverTimestamp()
        });
        throw error;
    }
});
//# sourceMappingURL=sendWelcomeEmail.js.map
