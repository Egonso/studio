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
exports.processAffiliateCommission = processAffiliateCommission;
const admin = __importStar(require("firebase-admin"));
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const AFFILIATE_DEFAULTS = {
    defaultCommissionBoostRate: 100,
    defaultCommissionOngoingRate: 20,
    defaultBoostPeriodMonths: 3,
    defaultAttributionWindowMonths: 3,
};
// Approximate Stripe fee for European cards (1.4% + 0.25 EUR = 25 cents)
const STRIPE_FEE_PERCENT = 1.4;
const STRIPE_FEE_FIXED_CENTS = 25;
// ---------------------------------------------------------------------------
// Net amount calculation (gross minus estimated Stripe fees)
// ---------------------------------------------------------------------------
function calculateNetAmount(grossCents) {
    if (grossCents <= 0)
        return 0;
    const percentageFee = Math.round((grossCents * STRIPE_FEE_PERCENT) / 100);
    const net = grossCents - percentageFee - STRIPE_FEE_FIXED_CENTS;
    return Math.max(0, net);
}
// ---------------------------------------------------------------------------
// Main commission processing function
// ---------------------------------------------------------------------------
async function processAffiliateCommission(db, stripe, input) {
    var _a, _b, _c, _d;
    if (!input.email || input.grossAmount <= 0)
        return;
    // 1. Find active referral for this email
    const referralsSnap = await db
        .collection('affiliateReferrals')
        .where('referredEmail', '==', input.email)
        .where('status', 'in', ['signed_up', 'converted'])
        .limit(1)
        .get();
    if (referralsSnap.empty)
        return; // Not a referred customer
    const referralDoc = referralsSnap.docs[0];
    const referral = referralDoc.data();
    // 2. For un-converted referrals, check attribution window
    if (referral.status === 'signed_up') {
        if (new Date() > new Date(referral.attributionExpiresAt)) {
            // Attribution expired and never purchased
            await referralDoc.ref.update({
                status: 'expired',
                updatedAt: new Date().toISOString(),
            });
            return;
        }
    }
    // 3. Load affiliate record
    const affiliateSnap = await db
        .collection('affiliates')
        .doc(referral.affiliateEmail)
        .get();
    if (!affiliateSnap.exists)
        return;
    const affiliate = affiliateSnap.data();
    if (!affiliate.active)
        return;
    // 4. Load global settings
    const globalSnap = await db
        .collection('affiliateSettings')
        .doc('global')
        .get();
    const globalSettings = globalSnap.exists
        ? globalSnap.data()
        : Object.assign(Object.assign({}, AFFILIATE_DEFAULTS), { updatedAt: '', updatedBy: 'system' });
    // 5. Resolve effective rates
    const boostPeriodMonths = (_a = affiliate.boostPeriodMonths) !== null && _a !== void 0 ? _a : globalSettings.defaultBoostPeriodMonths;
    const firstPurchaseDate = referral.firstPurchaseAt
        ? new Date(referral.firstPurchaseAt)
        : new Date();
    const boostEndDate = new Date(firstPurchaseDate);
    boostEndDate.setMonth(boostEndDate.getMonth() + boostPeriodMonths);
    const isBoostPeriod = new Date() <= boostEndDate;
    const commissionRate = isBoostPeriod
        ? ((_b = affiliate.commissionBoostRate) !== null && _b !== void 0 ? _b : globalSettings.defaultCommissionBoostRate)
        : ((_c = affiliate.commissionOngoingRate) !== null && _c !== void 0 ? _c : globalSettings.defaultCommissionOngoingRate);
    // 6. Calculate net-based commission
    const netAmount = calculateNetAmount(input.grossAmount);
    const commissionAmount = Math.round((netAmount * commissionRate) / 100);
    if (commissionAmount <= 0)
        return;
    // 7. Update referral if first purchase
    if (referral.status === 'signed_up') {
        await referralDoc.ref.update({
            status: 'converted',
            firstPurchaseAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }
    // 8. Create commission record
    const commissionRef = db.collection('affiliateCommissions').doc();
    const commissionRecord = {
        commissionId: commissionRef.id,
        affiliateEmail: referral.affiliateEmail,
        referredEmail: input.email,
        referralId: referralDoc.id,
        stripeEventId: input.stripeEventId,
        stripeEventType: input.stripeEventType,
        checkoutSessionId: input.checkoutSessionId,
        invoiceId: input.invoiceId,
        subscriptionId: input.subscriptionId,
        grossAmount: input.grossAmount,
        currency: input.currency,
        commissionRate,
        commissionAmount,
        isBoostPeriod,
        payoutStatus: 'pending',
        stripeTransferId: null,
        transferredAt: null,
        failureReason: null,
        createdAt: new Date().toISOString(),
    };
    // 9. Attempt payout via Stripe Transfer
    if (affiliate.stripeConnectAccountId && affiliate.stripeConnectOnboardingComplete) {
        try {
            const transfer = await stripe.transfers.create({
                amount: commissionAmount,
                currency: input.currency || 'eur',
                destination: affiliate.stripeConnectAccountId,
                description: `KIRegister Affiliate Commission`,
                metadata: {
                    commissionId: commissionRef.id,
                    affiliateEmail: referral.affiliateEmail,
                    referredEmail: input.email,
                },
            });
            commissionRecord.payoutStatus = 'transferred';
            commissionRecord.stripeTransferId = transfer.id;
            commissionRecord.transferredAt = new Date().toISOString();
        }
        catch (err) {
            commissionRecord.payoutStatus = 'failed';
            commissionRecord.failureReason = (_d = err === null || err === void 0 ? void 0 : err.message) !== null && _d !== void 0 ? _d : 'Transfer failed';
            console.error('Affiliate transfer failed:', err);
        }
    }
    else {
        commissionRecord.payoutStatus = 'no_connect_account';
    }
    await commissionRef.set(commissionRecord);
    // 10. Update affiliate aggregate stats
    const paidOutIncrement = commissionRecord.payoutStatus === 'transferred' ? commissionAmount : 0;
    await affiliateSnap.ref.update({
        totalPurchases: admin.firestore.FieldValue.increment(1),
        totalEarnings: admin.firestore.FieldValue.increment(commissionAmount),
        totalPaidOut: admin.firestore.FieldValue.increment(paidOutIncrement),
        updatedAt: new Date().toISOString(),
    });
    console.log(`Affiliate commission: ${commissionAmount} cents (${commissionRate}%${isBoostPeriod ? ' boost' : ''}) ` +
        `for ${referral.affiliateEmail} from ${input.email} [${commissionRecord.payoutStatus}]`);
}
//# sourceMappingURL=affiliate-commission.js.map