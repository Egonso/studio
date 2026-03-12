import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import express, { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { defineSecret } from 'firebase-functions/params';
import {
  buildCustomerEntitlementRecord,
  inferCheckoutEntitlement,
  parseCustomerEntitlementRecord,
  type BillingLineItemHint,
} from './billing-entitlements';
import {
  applyCustomerEntitlementToProductModels,
  repairCustomerEntitlementFromLegacyCustomer,
  upsertCustomerEntitlement,
} from './product-entitlement-sync';

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const LANDING_PAGE_API_KEY = defineSecret('LANDING_PAGE_API_KEY');

const app = express();
// Admin init handled in index.ts or lazy

// API Key Validation Middleware
const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.get('X-API-Key');
  if (!apiKey || apiKey !== LANDING_PAGE_API_KEY.value()) {
    res
      .status(401)
      .json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
    return;
  }
  next();
};

app.use((req, res, next) => {
  if (req.originalUrl === '/stripe/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Helper to access DB (lazy)
const getDb = () => admin.firestore();

function safeSecretValue(secret: { value: () => string }): string {
  try {
    return secret.value();
  } catch {
    return '';
  }
}

function resolveStripeSecretKey(): string | null {
  return (
    safeSecretValue(STRIPE_SECRET_KEY) ||
    process.env.STRIPE_SECRET_KEY ||
    safeSecretValue(STRIPE_API_KEY) ||
    process.env.STRIPE_API_KEY ||
    null
  );
}

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function toLineItemHints(
  lineItems: Stripe.ApiList<Stripe.LineItem>,
): BillingLineItemHint[] {
  return lineItems.data.map((item) => {
    const product = item.price?.product;
    return {
      priceId: item.price?.id ?? null,
      lookupKey: item.price?.lookup_key ?? null,
      productId: typeof product === 'string' ? product : (product?.id ?? null),
      productName:
        typeof product === 'object' && product && 'name' in product
          ? (product.name ?? null)
          : null,
      description: item.description ?? null,
    };
  });
}

async function readLegacyCompatibleEntitlement(
  db: FirebaseFirestore.Firestore,
  email: string,
) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const customerEntitlementSnapshot = await db
    .collection('customerEntitlements')
    .doc(normalizedEmail)
    .get();
  const parsed = parseCustomerEntitlementRecord(
    normalizedEmail,
    customerEntitlementSnapshot.data() as Record<string, unknown> | undefined,
  );

  if (parsed) {
    return parsed;
  }

  return repairCustomerEntitlementFromLegacyCustomer(db, normalizedEmail);
}

// 1. Verify Customer
app.post(
  '/verify-customer',
  validateApiKey,
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ verified: false, error: 'Email required' });
      return;
    }

    try {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        res.status(400).json({ verified: false, error: 'Email required' });
        return;
      }

      const [entitlement, customer] = await Promise.all([
        repairCustomerEntitlementFromLegacyCustomer(getDb(), normalizedEmail),
        getDb().collection('customers').doc(normalizedEmail).get(),
      ]);

      if (
        entitlement &&
        entitlement.status === 'active' &&
        entitlement.plan !== 'free'
      ) {
        res.status(200).json({
          verified: true,
          customerName: customer.data()?.name || null,
          customerEmail: normalizedEmail,
          purchaseDate:
            customer.data()?.created?.toDate().toISOString() || null,
          productId:
            entitlement.productId || customer.data()?.productId || null,
          entitlementPlan: entitlement.plan,
        });
        return;
      }
      res
        .status(200)
        .json({ verified: false, error: 'No active purchase found' });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ verified: false, error: 'Internal error' });
    }
  },
);

// 1c. Check Stripe Purchase DIRECTLY
app.post('/check-stripe-purchase', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ hasPurchased: false, error: 'Email required' });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    res.status(400).json({ hasPurchased: false, error: 'Email required' });
    return;
  }
  const db = getDb();

  try {
    const entitlement =
      (await parseCustomerEntitlementRecord(
        normalizedEmail,
        (
          await db.collection('customerEntitlements').doc(normalizedEmail).get()
        ).data() as Record<string, unknown> | undefined,
      )) ??
      (await repairCustomerEntitlementFromLegacyCustomer(db, normalizedEmail));
    if (
      entitlement &&
      entitlement.status === 'active' &&
      entitlement.plan !== 'free'
    ) {
      res.status(200).json({
        hasPurchased: true,
        source: 'customer-entitlement',
        entitlementPlan: entitlement.plan,
      });
      return;
    }
  } catch (error: any) {
    console.error('Firestore check failed:', error.message);
  }

  try {
    const stripeKey = resolveStripeSecretKey();
    if (!stripeKey) {
      res
        .status(500)
        .json({ hasPurchased: false, error: 'Stripe key not configured' });
      return;
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any });

    const sessions = await stripe.checkout.sessions.list({ limit: 50 });

    const matchingSessions = sessions.data.filter(
      (s) =>
        s.status === 'complete' &&
        (s.customer_email?.toLowerCase() === normalizedEmail ||
          s.customer_details?.email?.toLowerCase() === normalizedEmail),
    );

    if (matchingSessions.length > 0) {
      const session = matchingSessions[0];
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          limit: 20,
          expand: ['data.price.product'],
        },
      );
      const resolvedEntitlement = inferCheckoutEntitlement({
        metadata: session.metadata,
        productId: session.metadata?.productId ?? null,
        lineItems: toLineItemHints(lineItems),
      });
      const plan = resolvedEntitlement?.plan ?? null;
      await db
        .collection('customers')
        .doc(normalizedEmail)
        .set(
          {
            email: normalizedEmail,
            name: session.customer_details?.name || null,
            stripeId: session.customer || null,
            status: 'active',
            purchaseAmount: session.amount_total,
            productId: session.metadata?.productId || 'eu-ai-act-certification',
            entitlementPlan: plan,
            canRegister: true,
            created: admin.firestore.FieldValue.serverTimestamp(),
            source: 'stripe-api-recovery',
          },
          { merge: true },
        );
      if (plan && plan !== 'free') {
        const entitlement = await upsertCustomerEntitlement(
          db,
          buildCustomerEntitlementRecord({
            email: normalizedEmail,
            plan,
            source: 'stripe_checkout',
            productId: session.metadata?.productId || null,
            billingProductKey: resolvedEntitlement?.billingProductKey ?? null,
            checkoutSessionId: session.id,
            stripeCustomerId:
              typeof session.customer === 'string' ? session.customer : null,
          }),
        );
        await applyCustomerEntitlementToProductModels(
          db,
          normalizedEmail,
          entitlement,
          'stripe_webhook',
        );
      }
      res.status(200).json({
        hasPurchased: true,
        source: 'stripe-recovered',
        entitlementPlan: plan,
      });
      return;
    }
    res.status(200).json({ hasPurchased: false, error: 'No purchase found' });
  } catch (error: any) {
    console.error('Stripe check error:', error);
    res.status(500).json({ hasPurchased: false, error: 'Stripe API error' });
  }
});

// 1b. Record Purchase
app.post(
  '/record-purchase',
  validateApiKey,
  async (req: Request, res: Response) => {
    const { email, name, stripeId, amountTotal, productId } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email required' });
      return;
    }

    try {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        res.status(400).json({ success: false, error: 'Email required' });
        return;
      }
      const resolvedEntitlement = inferCheckoutEntitlement({
        productId: typeof productId === 'string' ? productId : null,
        productName: typeof name === 'string' ? name : null,
      });
      const plan = resolvedEntitlement?.plan ?? null;
      await getDb()
        .collection('customers')
        .doc(normalizedEmail)
        .set(
          {
            email: normalizedEmail,
            name: name || null,
            stripeId: stripeId || null,
            status: 'active',
            purchaseAmount: amountTotal || 0,
            productId: productId || 'eu-ai-act-certification',
            entitlementPlan: plan,
            canRegister: true,
            created: admin.firestore.FieldValue.serverTimestamp(),
            source: 'landing-page-webhook',
          },
          { merge: true },
        );
      if (plan && plan !== 'free') {
        const entitlement = await upsertCustomerEntitlement(
          getDb(),
          buildCustomerEntitlementRecord({
            email: normalizedEmail,
            plan,
            source: 'stripe_webhook',
            productId: productId || null,
            stripeCustomerId: stripeId || null,
            billingProductKey: resolvedEntitlement?.billingProductKey ?? null,
          }),
        );
        await applyCustomerEntitlementToProductModels(
          getDb(),
          normalizedEmail,
          entitlement,
          'stripe_webhook',
        );
      }
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Record purchase error:', error);
      res.status(500).json({ success: false, error: 'Internal error' });
    }
  },
);

// 2. Record Exam
app.post(
  '/record-exam',
  validateApiKey,
  async (req: Request, res: Response) => {
    const { email, examPassed, sectionScores, totalScore } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email required' });
      return;
    }

    try {
      const normalizedEmail = email.toLowerCase();
      const examRef = getDb().collection('user_exams').doc(normalizedEmail);
      const existingExam = await examRef.get();

      await examRef.set(
        {
          email: normalizedEmail,
          examPassed: examPassed || false,
          sectionScores: sectionScores || [],
          totalScore: totalScore || 0,
          examDate: admin.firestore.FieldValue.serverTimestamp(),
          attempts: existingExam.exists
            ? (existingExam.data()?.attempts || 0) + 1
            : 1,
        },
        { merge: true },
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Record exam error:', error);
      res.status(500).json({ success: false, error: 'Internal error' });
    }
  },
);

// 3. Record Certificate
app.post(
  '/record-certificate',
  validateApiKey,
  async (req: Request, res: Response) => {
    const {
      email,
      certificateCode,
      certificateId,
      holderName,
      company,
      issuedDate,
      validUntil,
      pdfUrl,
    } = req.body;
    if (!email || !certificateCode) {
      res
        .status(400)
        .json({ success: false, error: 'Email and certificateCode required' });
      return;
    }

    try {
      const normalizedEmail = email.toLowerCase();
      const db = getDb();

      await db
        .collection('user_certificates')
        .doc(normalizedEmail)
        .set(
          {
            email: normalizedEmail,
            certificateCode,
            certificateId: certificateId || null,
            holderName: holderName || null,
            company: company || null,
            issuedDate: issuedDate || new Date().toISOString(),
            validUntil: validUntil || null,
            pdfUrl: pdfUrl || null,
            recordedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      await db
        .collection('public_certificates')
        .doc(certificateCode)
        .set({
          certificateCode,
          holderName: holderName || 'Zertifizierte Person',
          company: company || null,
          issuedDate: issuedDate || new Date().toISOString(),
          validUntil: validUntil || null,
          modules: ['EU AI Act Basics'],
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Record certificate error:', error);
      res.status(500).json({ success: false, error: 'Internal error' });
    }
  },
);

// 4. Get User Status
app.get('/user-status/:email', async (req: Request, res: Response) => {
  const { email } = req.params;
  if (!email) {
    res.status(400).json({ error: 'Email required' });
    return;
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      res.status(400).json({ error: 'Email required' });
      return;
    }
    const db = getDb();
    const [entitlement, customer, exam, certificate] = await Promise.all([
      readLegacyCompatibleEntitlement(db, normalizedEmail),
      db.collection('customers').doc(normalizedEmail).get(),
      db.collection('user_exams').doc(normalizedEmail).get(),
      db.collection('user_certificates').doc(normalizedEmail).get(),
    ]);

    res.status(200).json({
      hasPurchased: Boolean(
        entitlement &&
        entitlement.status === 'active' &&
        entitlement.plan !== 'free',
      ),
      purchase: customer.exists
        ? {
            date: customer.data()?.created?.toDate().toISOString() || null,
            amount: customer.data()?.purchaseAmount || null,
            productId: customer.data()?.productId || null,
          }
        : null,
      entitlementPlan: entitlement?.plan ?? null,
      examPassed: exam.exists ? exam.data()?.examPassed : null,
      examDate:
        exam.exists && exam.data()?.examDate
          ? exam.data()?.examDate.toDate().toISOString()
          : null,
      examAttempts: exam.exists ? exam.data()?.attempts : 0,
      hasCertificate: certificate.exists,
      certificate: certificate.exists
        ? {
            code: certificate.data()?.certificateCode,
            issuedDate: certificate.data()?.issuedDate,
            validUntil: certificate.data()?.validUntil,
            holderName: certificate.data()?.holderName,
          }
        : null,
    });
  } catch (error) {
    console.error('Get user status error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

export const api = onRequest(
  {
    region: 'europe-west1',
    secrets: [
      STRIPE_SECRET_KEY,
      STRIPE_API_KEY,
      STRIPE_WEBHOOK_SECRET,
      LANDING_PAGE_API_KEY,
    ],
    cors: true,
  },
  app,
);
