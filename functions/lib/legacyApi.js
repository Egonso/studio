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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const params_1 = require("firebase-functions/params");
const billing_entitlements_1 = require("./billing-entitlements");
const product_entitlement_sync_1 = require("./product-entitlement-sync");
const STRIPE_API_VERSION = '2026-02-25.clover';
const STRIPE_SECRET_KEY = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
const STRIPE_API_KEY = (0, params_1.defineSecret)('STRIPE_API_KEY');
const STRIPE_WEBHOOK_SECRET = (0, params_1.defineSecret)('STRIPE_WEBHOOK_SECRET');
const LANDING_PAGE_API_KEY = (0, params_1.defineSecret)('LANDING_PAGE_API_KEY');
const app = (0, express_1.default)();
// Admin init handled in index.ts or lazy
// API Key Validation Middleware
const validateApiKey = (req, res, next) => {
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
    }
    else {
        express_1.default.json()(req, res, next);
    }
});
// Helper to access DB (lazy)
const getDb = () => admin.firestore();
function safeSecretValue(secret) {
    try {
        return secret.value();
    }
    catch (_a) {
        return '';
    }
}
function resolveStripeSecretKey() {
    return (safeSecretValue(STRIPE_SECRET_KEY) ||
        process.env.STRIPE_SECRET_KEY ||
        safeSecretValue(STRIPE_API_KEY) ||
        process.env.STRIPE_API_KEY ||
        null);
}
function normalizeEmail(value) {
    const normalized = value === null || value === void 0 ? void 0 : value.trim().toLowerCase();
    return normalized && normalized.length > 0 ? normalized : null;
}
function toLineItemHints(lineItems) {
    return lineItems.data.map((item) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const product = (_a = item.price) === null || _a === void 0 ? void 0 : _a.product;
        return {
            priceId: (_c = (_b = item.price) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null,
            lookupKey: (_e = (_d = item.price) === null || _d === void 0 ? void 0 : _d.lookup_key) !== null && _e !== void 0 ? _e : null,
            productId: typeof product === 'string' ? product : ((_f = product === null || product === void 0 ? void 0 : product.id) !== null && _f !== void 0 ? _f : null),
            productName: typeof product === 'object' && product && 'name' in product
                ? ((_g = product.name) !== null && _g !== void 0 ? _g : null)
                : null,
            description: (_h = item.description) !== null && _h !== void 0 ? _h : null,
        };
    });
}
async function readLegacyCompatibleEntitlement(db, email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return null;
    }
    const customerEntitlementSnapshot = await db
        .collection('customerEntitlements')
        .doc(normalizedEmail)
        .get();
    const parsed = (0, billing_entitlements_1.parseCustomerEntitlementRecord)(normalizedEmail, customerEntitlementSnapshot.data());
    if (parsed) {
        return parsed;
    }
    return (0, product_entitlement_sync_1.repairCustomerEntitlementFromLegacyCustomer)(db, normalizedEmail);
}
// 1. Verify Customer
app.post('/verify-customer', validateApiKey, async (req, res) => {
    var _a, _b, _c, _d;
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
            (0, product_entitlement_sync_1.repairCustomerEntitlementFromLegacyCustomer)(getDb(), normalizedEmail),
            getDb().collection('customers').doc(normalizedEmail).get(),
        ]);
        if (entitlement &&
            entitlement.status === 'active' &&
            entitlement.plan !== 'free') {
            res.status(200).json({
                verified: true,
                customerName: ((_a = customer.data()) === null || _a === void 0 ? void 0 : _a.name) || null,
                customerEmail: normalizedEmail,
                purchaseDate: ((_c = (_b = customer.data()) === null || _b === void 0 ? void 0 : _b.created) === null || _c === void 0 ? void 0 : _c.toDate().toISOString()) || null,
                productId: entitlement.productId || ((_d = customer.data()) === null || _d === void 0 ? void 0 : _d.productId) || null,
                entitlementPlan: entitlement.plan,
            });
            return;
        }
        res
            .status(200)
            .json({ verified: false, error: 'No active purchase found' });
    }
    catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ verified: false, error: 'Internal error' });
    }
});
// 1c. Check Stripe Purchase DIRECTLY
app.post('/check-stripe-purchase', async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
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
        const entitlement = (_a = (await (0, billing_entitlements_1.parseCustomerEntitlementRecord)(normalizedEmail, (await db.collection('customerEntitlements').doc(normalizedEmail).get()).data()))) !== null && _a !== void 0 ? _a : (await (0, product_entitlement_sync_1.repairCustomerEntitlementFromLegacyCustomer)(db, normalizedEmail));
        if (entitlement &&
            entitlement.status === 'active' &&
            entitlement.plan !== 'free') {
            res.status(200).json({
                hasPurchased: true,
                source: 'customer-entitlement',
                entitlementPlan: entitlement.plan,
            });
            return;
        }
    }
    catch (error) {
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
        const stripe = new stripe_1.default(stripeKey, { apiVersion: STRIPE_API_VERSION });
        const sessions = await stripe.checkout.sessions.list({ limit: 50 });
        const matchingSessions = sessions.data.filter((s) => {
            var _a, _b, _c;
            return s.status === 'complete' &&
                (((_a = s.customer_email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === normalizedEmail ||
                    ((_c = (_b = s.customer_details) === null || _b === void 0 ? void 0 : _b.email) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === normalizedEmail);
        });
        if (matchingSessions.length > 0) {
            const session = matchingSessions[0];
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                limit: 20,
                expand: ['data.price.product'],
            });
            const resolvedEntitlement = (0, billing_entitlements_1.inferCheckoutEntitlement)({
                metadata: session.metadata,
                productId: (_c = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.productId) !== null && _c !== void 0 ? _c : null,
                lineItems: toLineItemHints(lineItems),
            });
            const plan = (_d = resolvedEntitlement === null || resolvedEntitlement === void 0 ? void 0 : resolvedEntitlement.plan) !== null && _d !== void 0 ? _d : null;
            await db
                .collection('customers')
                .doc(normalizedEmail)
                .set({
                email: normalizedEmail,
                name: ((_e = session.customer_details) === null || _e === void 0 ? void 0 : _e.name) || null,
                stripeId: session.customer || null,
                status: 'active',
                purchaseAmount: session.amount_total,
                productId: ((_f = session.metadata) === null || _f === void 0 ? void 0 : _f.productId) || 'eu-ai-act-certification',
                entitlementPlan: plan,
                canRegister: true,
                created: admin.firestore.FieldValue.serverTimestamp(),
                source: 'stripe-api-recovery',
            }, { merge: true });
            if (plan && plan !== 'free') {
                const entitlement = await (0, product_entitlement_sync_1.upsertCustomerEntitlement)(db, (0, billing_entitlements_1.buildCustomerEntitlementRecord)({
                    email: normalizedEmail,
                    plan,
                    source: 'stripe_checkout',
                    productId: ((_g = session.metadata) === null || _g === void 0 ? void 0 : _g.productId) || null,
                    billingProductKey: (_h = resolvedEntitlement === null || resolvedEntitlement === void 0 ? void 0 : resolvedEntitlement.billingProductKey) !== null && _h !== void 0 ? _h : null,
                    checkoutSessionId: session.id,
                    stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
                }));
                await (0, product_entitlement_sync_1.applyCustomerEntitlementToProductModels)(db, normalizedEmail, entitlement, 'stripe_webhook');
            }
            res.status(200).json({
                hasPurchased: true,
                source: 'stripe-recovered',
                entitlementPlan: plan,
            });
            return;
        }
        res.status(200).json({ hasPurchased: false, error: 'No purchase found' });
    }
    catch (error) {
        console.error('Stripe check error:', error);
        res.status(500).json({ hasPurchased: false, error: 'Stripe API error' });
    }
});
// 1b. Record Purchase
app.post('/record-purchase', validateApiKey, async (req, res) => {
    var _a, _b;
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
        const resolvedEntitlement = (0, billing_entitlements_1.inferCheckoutEntitlement)({
            productId: typeof productId === 'string' ? productId : null,
            productName: typeof name === 'string' ? name : null,
        });
        const plan = (_a = resolvedEntitlement === null || resolvedEntitlement === void 0 ? void 0 : resolvedEntitlement.plan) !== null && _a !== void 0 ? _a : null;
        await getDb()
            .collection('customers')
            .doc(normalizedEmail)
            .set({
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
        }, { merge: true });
        if (plan && plan !== 'free') {
            const entitlement = await (0, product_entitlement_sync_1.upsertCustomerEntitlement)(getDb(), (0, billing_entitlements_1.buildCustomerEntitlementRecord)({
                email: normalizedEmail,
                plan,
                source: 'stripe_webhook',
                productId: productId || null,
                stripeCustomerId: stripeId || null,
                billingProductKey: (_b = resolvedEntitlement === null || resolvedEntitlement === void 0 ? void 0 : resolvedEntitlement.billingProductKey) !== null && _b !== void 0 ? _b : null,
            }));
            await (0, product_entitlement_sync_1.applyCustomerEntitlementToProductModels)(getDb(), normalizedEmail, entitlement, 'stripe_webhook');
        }
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Record purchase error:', error);
        res.status(500).json({ success: false, error: 'Internal error' });
    }
});
// 2. Record Exam
app.post('/record-exam', validateApiKey, async (req, res) => {
    var _a;
    const { email, examPassed, sectionScores, totalScore } = req.body;
    if (!email) {
        res.status(400).json({ success: false, error: 'Email required' });
        return;
    }
    try {
        const normalizedEmail = email.toLowerCase();
        const examRef = getDb().collection('user_exams').doc(normalizedEmail);
        const existingExam = await examRef.get();
        await examRef.set({
            email: normalizedEmail,
            examPassed: examPassed || false,
            sectionScores: sectionScores || [],
            totalScore: totalScore || 0,
            examDate: admin.firestore.FieldValue.serverTimestamp(),
            attempts: existingExam.exists
                ? (((_a = existingExam.data()) === null || _a === void 0 ? void 0 : _a.attempts) || 0) + 1
                : 1,
        }, { merge: true });
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Record exam error:', error);
        res.status(500).json({ success: false, error: 'Internal error' });
    }
});
// 3. Record Certificate
app.post('/record-certificate', validateApiKey, async (req, res) => {
    const { email, certificateCode, certificateId, holderName, company, issuedDate, validUntil, pdfUrl, } = req.body;
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
            .set({
            email: normalizedEmail,
            certificateCode,
            certificateId: certificateId || null,
            holderName: holderName || null,
            company: company || null,
            issuedDate: issuedDate || new Date().toISOString(),
            validUntil: validUntil || null,
            pdfUrl: pdfUrl || null,
            recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
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
    }
    catch (error) {
        console.error('Record certificate error:', error);
        res.status(500).json({ success: false, error: 'Internal error' });
    }
});
// 4. Get User Status
app.get('/user-status/:email', async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
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
            hasPurchased: Boolean(entitlement &&
                entitlement.status === 'active' &&
                entitlement.plan !== 'free'),
            purchase: customer.exists
                ? {
                    date: ((_b = (_a = customer.data()) === null || _a === void 0 ? void 0 : _a.created) === null || _b === void 0 ? void 0 : _b.toDate().toISOString()) || null,
                    amount: ((_c = customer.data()) === null || _c === void 0 ? void 0 : _c.purchaseAmount) || null,
                    productId: ((_d = customer.data()) === null || _d === void 0 ? void 0 : _d.productId) || null,
                }
                : null,
            entitlementPlan: (_e = entitlement === null || entitlement === void 0 ? void 0 : entitlement.plan) !== null && _e !== void 0 ? _e : null,
            examPassed: exam.exists ? (_f = exam.data()) === null || _f === void 0 ? void 0 : _f.examPassed : null,
            examDate: exam.exists && ((_g = exam.data()) === null || _g === void 0 ? void 0 : _g.examDate)
                ? (_h = exam.data()) === null || _h === void 0 ? void 0 : _h.examDate.toDate().toISOString()
                : null,
            examAttempts: exam.exists ? (_j = exam.data()) === null || _j === void 0 ? void 0 : _j.attempts : 0,
            hasCertificate: certificate.exists,
            certificate: certificate.exists
                ? {
                    code: (_k = certificate.data()) === null || _k === void 0 ? void 0 : _k.certificateCode,
                    issuedDate: (_l = certificate.data()) === null || _l === void 0 ? void 0 : _l.issuedDate,
                    validUntil: (_m = certificate.data()) === null || _m === void 0 ? void 0 : _m.validUntil,
                    holderName: (_o = certificate.data()) === null || _o === void 0 ? void 0 : _o.holderName,
                }
                : null,
        });
    }
    catch (error) {
        console.error('Get user status error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
});
app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
});
exports.api = (0, https_1.onRequest)({
    region: 'europe-west1',
    secrets: [
        STRIPE_SECRET_KEY,
        STRIPE_API_KEY,
        STRIPE_WEBHOOK_SECRET,
        LANDING_PAGE_API_KEY,
    ],
    cors: true,
}, app);
//# sourceMappingURL=legacyApi.js.map