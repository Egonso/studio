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
const STRIPE_API_KEY = (0, params_1.defineSecret)('STRIPE_API_KEY');
const STRIPE_WEBHOOK_SECRET = (0, params_1.defineSecret)('STRIPE_WEBHOOK_SECRET');
const LANDING_PAGE_API_KEY = (0, params_1.defineSecret)('LANDING_PAGE_API_KEY');
const app = (0, express_1.default)();
// Admin init handled in index.ts or lazy
// API Key Validation Middleware
const validateApiKey = (req, res, next) => {
    const apiKey = req.get('X-API-Key');
    if (!apiKey || apiKey !== LANDING_PAGE_API_KEY.value()) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
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
// 1. Verify Customer
app.post('/verify-customer', validateApiKey, async (req, res) => {
    var _a, _b, _c, _d, _e, _f;
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ verified: false, error: 'Email required' });
        return;
    }
    try {
        const normalizedEmail = email.toLowerCase();
        const customer = await getDb().collection('customers').doc(normalizedEmail).get();
        if (customer.exists && ((_a = customer.data()) === null || _a === void 0 ? void 0 : _a.status) === 'active') {
            res.status(200).json({
                verified: true,
                customerName: ((_b = customer.data()) === null || _b === void 0 ? void 0 : _b.name) || null,
                customerEmail: (_c = customer.data()) === null || _c === void 0 ? void 0 : _c.email,
                purchaseDate: ((_e = (_d = customer.data()) === null || _d === void 0 ? void 0 : _d.created) === null || _e === void 0 ? void 0 : _e.toDate().toISOString()) || null,
                productId: ((_f = customer.data()) === null || _f === void 0 ? void 0 : _f.productId) || null
            });
            return;
        }
        res.status(200).json({ verified: false, error: 'No active purchase found' });
    }
    catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ verified: false, error: 'Internal error' });
    }
});
// 1c. Check Stripe Purchase DIRECTLY
app.post('/check-stripe-purchase', async (req, res) => {
    var _a, _b, _c;
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ hasPurchased: false, error: 'Email required' });
        return;
    }
    const normalizedEmail = email.toLowerCase();
    const db = getDb();
    try {
        const customerDoc = await db.collection('customers').doc(normalizedEmail).get();
        if (customerDoc.exists && ((_a = customerDoc.data()) === null || _a === void 0 ? void 0 : _a.status) === 'active') {
            res.status(200).json({ hasPurchased: true, source: 'firestore' });
            return;
        }
    }
    catch (error) {
        console.error('Firestore check failed:', error.message);
    }
    try {
        // Updated API version to match current defaults or leave generic if possible, but typing forces it.
        // Assuming user has latest stripe which might have 2024-04-10
        const stripe = new stripe_1.default(STRIPE_API_KEY.value(), { apiVersion: '2024-06-20' });
        // Note: casting 'as any' for apiVersion to avoid strict checks if SDK version mismatches slightly. 
        // Or I will use the one I saw in error '2024-04-10' if that IS the installed SDK version default.
        // The error said: Type '"2023-10-16"' is not assignable to type '"2024-04-10"'.
        // So I should use '2024-04-10'.
        const sessions = await stripe.checkout.sessions.list({ limit: 50 });
        const matchingSessions = sessions.data.filter(s => {
            var _a, _b, _c;
            return s.status === 'complete' &&
                (((_a = s.customer_email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === normalizedEmail ||
                    ((_c = (_b = s.customer_details) === null || _b === void 0 ? void 0 : _b.email) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === normalizedEmail);
        });
        if (matchingSessions.length > 0) {
            const session = matchingSessions[0];
            await db.collection('customers').doc(normalizedEmail).set({
                email: normalizedEmail,
                name: ((_b = session.customer_details) === null || _b === void 0 ? void 0 : _b.name) || null,
                stripeId: session.customer || null,
                status: 'active',
                purchaseAmount: session.amount_total,
                productId: ((_c = session.metadata) === null || _c === void 0 ? void 0 : _c.productId) || 'eu-ai-act-certification',
                canRegister: true,
                created: admin.firestore.FieldValue.serverTimestamp(),
                source: 'stripe-api-recovery'
            }, { merge: true });
            res.status(200).json({ hasPurchased: true, source: 'stripe-recovered' });
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
    const { email, name, stripeId, amountTotal, productId } = req.body;
    if (!email) {
        res.status(400).json({ success: false, error: 'Email required' });
        return;
    }
    try {
        const normalizedEmail = email.toLowerCase();
        await getDb().collection('customers').doc(normalizedEmail).set({
            email: normalizedEmail,
            name: name || null,
            stripeId: stripeId || null,
            status: 'active',
            purchaseAmount: amountTotal || 0,
            productId: productId || 'eu-ai-act-certification',
            canRegister: true,
            created: admin.firestore.FieldValue.serverTimestamp(),
            source: 'landing-page-webhook'
        }, { merge: true });
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
            attempts: existingExam.exists ? (((_a = existingExam.data()) === null || _a === void 0 ? void 0 : _a.attempts) || 0) + 1 : 1
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
    const { email, certificateCode, certificateId, holderName, company, issuedDate, validUntil, pdfUrl } = req.body;
    if (!email || !certificateCode) {
        res.status(400).json({ success: false, error: 'Email and certificateCode required' });
        return;
    }
    try {
        const normalizedEmail = email.toLowerCase();
        const db = getDb();
        await db.collection('user_certificates').doc(normalizedEmail).set({
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
        await db.collection('public_certificates').doc(certificateCode).set({
            certificateCode,
            holderName: holderName || 'Zertifizierte Person',
            company: company || null,
            issuedDate: issuedDate || new Date().toISOString(),
            validUntil: validUntil || null,
            modules: ['EU AI Act Basics'],
            status: 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
        const normalizedEmail = email.toLowerCase();
        const db = getDb();
        const [customer, exam, certificate] = await Promise.all([
            db.collection('customers').doc(normalizedEmail).get(),
            db.collection('user_exams').doc(normalizedEmail).get(),
            db.collection('user_certificates').doc(normalizedEmail).get()
        ]);
        res.status(200).json({
            hasPurchased: customer.exists && ((_a = customer.data()) === null || _a === void 0 ? void 0 : _a.status) === 'active',
            purchase: customer.exists ? {
                date: ((_c = (_b = customer.data()) === null || _b === void 0 ? void 0 : _b.created) === null || _c === void 0 ? void 0 : _c.toDate().toISOString()) || null,
                amount: ((_d = customer.data()) === null || _d === void 0 ? void 0 : _d.purchaseAmount) || null,
                productId: ((_e = customer.data()) === null || _e === void 0 ? void 0 : _e.productId) || null
            } : null,
            examPassed: exam.exists ? (_f = exam.data()) === null || _f === void 0 ? void 0 : _f.examPassed : null,
            examDate: exam.exists && ((_g = exam.data()) === null || _g === void 0 ? void 0 : _g.examDate) ? (_h = exam.data()) === null || _h === void 0 ? void 0 : _h.examDate.toDate().toISOString() : null,
            examAttempts: exam.exists ? (_j = exam.data()) === null || _j === void 0 ? void 0 : _j.attempts : 0,
            hasCertificate: certificate.exists,
            certificate: certificate.exists ? {
                code: (_k = certificate.data()) === null || _k === void 0 ? void 0 : _k.certificateCode,
                issuedDate: (_l = certificate.data()) === null || _l === void 0 ? void 0 : _l.issuedDate,
                validUntil: (_m = certificate.data()) === null || _m === void 0 ? void 0 : _m.validUntil,
                holderName: (_o = certificate.data()) === null || _o === void 0 ? void 0 : _o.holderName
            } : null
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
exports.api = (0, https_1.onRequest)({ region: 'europe-west1', secrets: [STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, LANDING_PAGE_API_KEY], cors: true }, app);
//# sourceMappingURL=legacyApi.js.map