
// index.js (CommonJS)
const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const PDFDocument = require("pdfkit");
const express = require("express");
const stripeLib = require("stripe");

// Secrets (über Secret Manager, NICHT in Storage!)
const { defineSecret } = require("firebase-functions/params");
const STRIPE_API_KEY = defineSecret("STRIPE_API_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const LANDING_PAGE_API_KEY = defineSecret("LANDING_PAGE_API_KEY");

// Firebase Admin initialisieren (einmalig)
try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

// API Key Validation Middleware (für Landing Page Calls)
const validateApiKey = (req, res, next) => {
  const apiKey = req.get("X-API-Key");
  if (!apiKey || apiKey !== LANDING_PAGE_API_KEY.value()) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or missing API key" });
  }
  next();
};

// Express-App
const app = express();

// Stripe RAW-Body für Webhooks nötig:
app.use((req, res, next) => {
  // Nur auf der Webhook-Route raw lassen; für andere Routen gerne json()
  if (req.originalUrl === "/stripe/webhook") {
    // Firebase v2 onRequest: rawBody ist bereits verfügbar
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Webhook-Endpoint
app.post("/stripe/webhook", (req, res) => {
  const stripe = stripeLib(STRIPE_API_KEY.value());
  const sig = req.get("stripe-signature");
  let event;

  try {
    // In v2 ist req.rawBody verfügbar:
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      STRIPE_WEBHOOK_SECRET.value()
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventLogRef = db.collection("stripe_events").doc(event.id);

  const handleEvent = async () => {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email;
        const stripeCustomerId = session.customer;
        const customerName = session.customer_details?.name;
        const amountTotal = session.amount_total;

        if (customerEmail) {
          const normalizedEmail = customerEmail.toLowerCase();
          const userRef = db.collection("customers").doc(normalizedEmail);
          await userRef.set({
            email: normalizedEmail,
            name: customerName || null,
            stripeId: stripeCustomerId,
            status: "active",
            purchaseAmount: amountTotal,
            productId: session.metadata?.productId || "eu-ai-act-certification",
            canRegister: true,
            created: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          console.log(`User ${customerEmail} created/updated from checkout session.`);

          await eventLogRef.set({
            type: event.type,
            email: customerEmail,
            customer: stripeCustomerId,
            amount_total: session.amount_total,
            currency: session.currency,
            metadata: session.metadata,
            created: admin.firestore.FieldValue.serverTimestamp(),
          });

        } else {
          console.warn("Checkout session completed without customer email.");
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const customerEmail = invoice.customer_email;
        const stripeCustomerId = invoice.customer;

        if (customerEmail) {
          const userRef = db.collection("customers").doc(customerEmail);
          await userRef.set({
            email: customerEmail,
            stripeId: stripeCustomerId,
            status: "active",
            lastInvoicePaid: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          console.log(`User ${customerEmail} updated from invoice.paid.`);
        }
        await eventLogRef.set({
          type: event.type,
          email: customerEmail,
          customer: stripeCustomerId,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          created: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const customerEmail = charge.billing_details.email;

        if (customerEmail) {
          const userRef = db.collection("customers").doc(customerEmail);
          await userRef.update({
            status: "refunded",
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`User ${customerEmail} status set to refunded.`);
        }
        await eventLogRef.set({
          type: event.type,
          email: customerEmail,
          customer: charge.customer,
          amount_refunded: charge.amount_refunded,
          currency: charge.currency,
          created: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
        await eventLogRef.set({
          type: event.type,
          data: event.data.object,
          created: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    res.status(200).json({ received: true });
  };

  handleEvent().catch(error => {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  });
});


// Optional: einfache Health-Route
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// ============================================
// API Endpoints für Landing Page Integration
// ============================================

// 1. Verify Customer - Prüft ob E-Mail einen gültigen Kauf hat
app.post("/verify-customer", validateApiKey, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ verified: false, error: "Email required" });
  }
  // ... (rest of implementation logic is fine, just changing route path)

  try {
    const normalizedEmail = email.toLowerCase();
    const customerRef = db.collection("customers").doc(normalizedEmail);
    const customer = await customerRef.get();

    if (customer.exists && customer.data().status === "active") {
      return res.status(200).json({
        verified: true,
        customerName: customer.data().name || null,
        customerEmail: customer.data().email,
        purchaseDate: customer.data().created?.toDate().toISOString() || null,
        productId: customer.data().productId || null
      });
    }

    return res.status(200).json({ verified: false, error: "No active purchase found" });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ verified: false, error: "Internal error" });
  }
});

// 1c. Check Stripe Purchase DIRECTLY - Fallback when webhook sync fails
// This queries Stripe API directly to verify payment status
app.post("/check-stripe-purchase", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ hasPurchased: false, error: "Email required" });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    // First check Firestore (fast path)
    const customerRef = db.collection("customers").doc(normalizedEmail);
    const customerDoc = await customerRef.get();

    if (customerDoc.exists && customerDoc.data().status === "active") {
      return res.status(200).json({ hasPurchased: true, source: "firestore" });
    }
  } catch (firestoreError) {
    console.error("Firestore check failed:", firestoreError.message);
    // Continue to Stripe check
  }

  try {
    const stripe = stripeLib(STRIPE_API_KEY.value());

    // Primary check: Search checkout sessions by customer_email
    // Note: 'complete' is a valid status filter
    const sessions = await stripe.checkout.sessions.list({
      limit: 50,
    });

    // Filter sessions by email (API doesn't support customer_email filter directly for all cases)
    const matchingSessions = sessions.data.filter(s =>
      s.status === 'complete' &&
      (s.customer_email?.toLowerCase() === normalizedEmail ||
        s.customer_details?.email?.toLowerCase() === normalizedEmail)
    );

    if (matchingSessions.length > 0) {
      // Found a completed session!
      const session = matchingSessions[0];
      const customerRef = db.collection("customers").doc(normalizedEmail);

      await customerRef.set({
        email: normalizedEmail,
        name: session.customer_details?.name || null,
        stripeId: session.customer || null,
        status: "active",
        purchaseAmount: session.amount_total,
        productId: session.metadata?.productId || "eu-ai-act-certification",
        canRegister: true,
        created: admin.firestore.FieldValue.serverTimestamp(),
        source: "stripe-api-recovery"
      }, { merge: true });

      console.log(`Recovered purchase for ${normalizedEmail} from Stripe checkout session`);
      return res.status(200).json({ hasPurchased: true, source: "stripe-recovered" });
    }

    // Secondary check: Look for customer by email
    const customers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 10
    });

    console.log(`Stripe customer search for ${normalizedEmail}: found ${customers.data.length} customers`);

    if (customers.data.length > 0) {
      const customer = customers.data[0];

      // Check for payment intents
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 10
      });

      const successfulPayment = paymentIntents.data.find(pi => pi.status === 'succeeded');

      if (successfulPayment) {
        const customerRef = db.collection("customers").doc(normalizedEmail);
        await customerRef.set({
          email: normalizedEmail,
          name: customer.name || null,
          stripeId: customer.id,
          status: "active",
          purchaseAmount: successfulPayment.amount,
          canRegister: true,
          created: admin.firestore.FieldValue.serverTimestamp(),
          source: "stripe-api-recovery"
        }, { merge: true });

        console.log(`Recovered purchase for ${normalizedEmail} from Stripe payment intent`);
        return res.status(200).json({ hasPurchased: true, source: "stripe-recovered" });
      }

      // FALLBACK FOR 100% PROMO CODES:
      // If customer exists in Stripe but has no payments, they used a free promo code
      // Check if customer was created recently (within last 30 days) = valid promo purchase
      const customerCreatedAt = new Date(customer.created * 1000);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (customerCreatedAt > thirtyDaysAgo) {
        const customerRef = db.collection("customers").doc(normalizedEmail);
        await customerRef.set({
          email: normalizedEmail,
          name: customer.name || null,
          stripeId: customer.id,
          status: "active",
          purchaseAmount: 0,
          productId: "eu-ai-act-certification-promo",
          canRegister: true,
          created: admin.firestore.FieldValue.serverTimestamp(),
          source: "stripe-promo-code-recovery"
        }, { merge: true });

        console.log(`Recovered PROMO purchase for ${normalizedEmail} - customer exists with no payments`);
        return res.status(200).json({ hasPurchased: true, source: "stripe-promo-recovered" });
      }
    }

    return res.status(200).json({ hasPurchased: false, error: "No purchase found for this email" });
  } catch (error) {
    console.error("Stripe check error:", error.message, error.type, error.code);
    return res.status(500).json({ hasPurchased: false, error: "Stripe API error: " + error.message });
  }
});

// 1b. Record Purchase (Internal/Trusted) - Erlaubt der Landing Page, Käufe direkt zu melden
// Dies umgeht Probleme, wenn der Stripe Webhook nicht direkt an diese Function zeigt.
app.post("/record-purchase", validateApiKey, async (req, res) => {
  const { email, name, stripeId, amountTotal, productId } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Email required" });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const userRef = db.collection("customers").doc(normalizedEmail);

    await userRef.set({
      email: normalizedEmail,
      name: name || null,
      stripeId: stripeId || null,
      status: "active",
      purchaseAmount: amountTotal || 0,
      productId: productId || "eu-ai-act-certification",
      canRegister: true,
      created: admin.firestore.FieldValue.serverTimestamp(),
      source: "landing-page-webhook"
    }, { merge: true });

    console.log(`Purchase recorded via API for ${normalizedEmail}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Record purchase error:", error);
    return res.status(500).json({ success: false, error: "Internal error" });
  }
});

// 2. Record Exam Result - Speichert Prüfungsergebnis von Landing Page
app.post("/record-exam", validateApiKey, async (req, res) => {
  const { email, examPassed, sectionScores, totalScore } = req.body;
  // ... (implementation)

  if (!email) {
    return res.status(400).json({ success: false, error: "Email required" });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const examRef = db.collection("user_exams").doc(normalizedEmail);
    const existingExam = await examRef.get();

    await examRef.set({
      email: normalizedEmail,
      examPassed: examPassed || false,
      sectionScores: sectionScores || [],
      totalScore: totalScore || 0,
      examDate: admin.firestore.FieldValue.serverTimestamp(),
      attempts: existingExam.exists
        ? (existingExam.data().attempts || 0) + 1
        : 1
    }, { merge: true });

    console.log(`Exam result recorded for ${normalizedEmail}: passed=${examPassed}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Record exam error:", error);
    return res.status(500).json({ success: false, error: "Internal error" });
  }
});

// 3. Record Certificate - Registriert Zertifikat von Landing Page
app.post("/record-certificate", validateApiKey, async (req, res) => {
  const {
    email,
    certificateCode,
    certificateId,
    holderName,
    company,
    issuedDate,
    validUntil,
    pdfUrl
  } = req.body;

  if (!email || !certificateCode) {
    return res.status(400).json({ success: false, error: "Email and certificateCode required" });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    // 1. Private User Record (keyed by email)
    const certRef = db.collection("user_certificates").doc(normalizedEmail);
    await certRef.set({
      email: normalizedEmail,
      certificateCode,
      certificateId: certificateId || null,
      holderName: holderName || null,
      company: company || null,
      issuedDate: issuedDate || new Date().toISOString(),
      validUntil: validUntil || null,
      pdfUrl: pdfUrl || null,
      recordedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 2. Public Record (keyed by certificateCode) - Safe for public lookup
    const publicCertRef = db.collection("public_certificates").doc(certificateCode);
    await publicCertRef.set({
      certificateCode,
      holderName: holderName || "Zertifizierte Person",
      company: company || null,
      issuedDate: issuedDate || new Date().toISOString(),
      validUntil: validUntil || null,
      modules: ["EU AI Act Basics"], // Default or passed from frontend
      status: "active",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Certificate ${certificateCode} recorded for ${normalizedEmail} and public lookup`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Record certificate error:", error);
    return res.status(500).json({ success: false, error: "Internal error" });
  }
});

// 4. Get User Status - Holt kompletten User-Status für Dashboard
app.get("/user-status/:email", async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    const [customer, exam, certificate] = await Promise.all([
      db.collection("customers").doc(normalizedEmail).get(),
      db.collection("user_exams").doc(normalizedEmail).get(),
      db.collection("user_certificates").doc(normalizedEmail).get()
    ]);

    return res.status(200).json({
      hasPurchased: customer.exists && customer.data().status === "active",
      purchase: customer.exists ? {
        date: customer.data().created?.toDate().toISOString() || null,
        amount: customer.data().purchaseAmount || null,
        productId: customer.data().productId || null
      } : null,
      examPassed: exam.exists ? exam.data().examPassed : null,
      examDate: exam.exists && exam.data().examDate
        ? exam.data().examDate.toDate().toISOString()
        : null,
      examAttempts: exam.exists ? exam.data().attempts : 0,
      hasCertificate: certificate.exists,
      certificate: certificate.exists ? {
        code: certificate.data().certificateCode,
        issuedDate: certificate.data().issuedDate,
        validUntil: certificate.data().validUntil,
        holderName: certificate.data().holderName
      } : null
    });
  } catch (error) {
    console.error("Get user status error:", error);
    return res.status(500).json({ error: "Internal error" });
  }
});

// Export der Function (eine einzige HTTPS-Funktion, die Express bedient)
exports.api = functions.https.onRequest(
  { secrets: [STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, LANDING_PAGE_API_KEY], cors: true },
  app
);
