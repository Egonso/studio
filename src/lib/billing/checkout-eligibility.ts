import type Stripe from 'stripe';

export type CheckoutEligibilityReason =
  | 'status_incomplete'
  | 'payment_status_unpaid'
  | 'invalid_mode'
  | 'missing_subscription'
  | 'subscription_inactive';

const CLAIMABLE_PAYMENT_STATUSES = new Set<
  Stripe.Checkout.Session.PaymentStatus
>(['paid', 'no_payment_required']);

const CLAIMABLE_SUBSCRIPTION_STATUSES = new Set<
  Stripe.Subscription.Status
>(['active', 'trialing']);

export function getCheckoutEligibility(input: {
  session: Stripe.Checkout.Session;
  subscription?: Stripe.Subscription | null;
}): {
  ok: boolean;
  reason: CheckoutEligibilityReason | null;
} {
  const { session, subscription } = input;

  if (session.mode !== 'subscription') {
    return { ok: false, reason: 'invalid_mode' };
  }

  if (session.status !== 'complete') {
    return { ok: false, reason: 'status_incomplete' };
  }

  if (!CLAIMABLE_PAYMENT_STATUSES.has(session.payment_status)) {
    return { ok: false, reason: 'payment_status_unpaid' };
  }

  if (typeof session.subscription !== 'string') {
    return { ok: false, reason: 'missing_subscription' };
  }

  if (!subscription) {
    return { ok: false, reason: 'missing_subscription' };
  }

  if (!CLAIMABLE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return { ok: false, reason: 'subscription_inactive' };
  }

  return { ok: true, reason: null };
}

export function getCheckoutEligibilityErrorMessage(
  reason: CheckoutEligibilityReason,
): string {
  switch (reason) {
    case 'invalid_mode':
      return 'Checkout session does not represent a subscription purchase.';
    case 'status_incomplete':
      return 'Checkout session not completed.';
    case 'payment_status_unpaid':
      return 'Checkout payment is not settled.';
    case 'missing_subscription':
      return 'Checkout session is missing a subscription record.';
    case 'subscription_inactive':
      return 'Checkout subscription is not active.';
    default:
      return 'Checkout session is not eligible for entitlement activation.';
  }
}
