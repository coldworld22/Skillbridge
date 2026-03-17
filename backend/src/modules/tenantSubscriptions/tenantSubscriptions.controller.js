const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const subscriptionSync = require("../../services/subscriptionSyncService");
const stripeService = require("../../services/stripeService");
const plansService = require("../plans/plans.service");
const AppError = require("../../utils/AppError");
const db = require("../../config/database");
const { frontendBase } = require("../../utils/frontend");
const logger = require("../../utils/logger");
const {
  normalizeCurrency,
  getMinorUnitsMultiplier,
} = require("../payments/helpers/currency");

const DEFAULT_CURRENCY = "usd";

const normalizeInterval = (value) => {
  const v = String(value || "monthly").toLowerCase();
  return v === "yearly" ? "yearly" : "monthly";
};

const addInterval = (start, interval) => {
  const base = new Date(start);
  if (interval === "yearly") {
    base.setFullYear(base.getFullYear() + 1);
  } else {
    base.setMonth(base.getMonth() + 1);
  }
  return base;
};

exports.replaySubscriptions = catchAsync(async (req, res) => {
  const tenantId = req.body?.tenant_id || req.query?.tenant_id || null;
  const result = await subscriptionSync.replayTenantSubscriptions({ tenantId });
  sendSuccess(res, result, "Subscription replay completed");
});

exports.createStripeCheckout = catchAsync(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new AppError("Tenant context is required", 400);

  const { plan_id, interval: rawInterval, success_url, cancel_url } =
    req.body || {};
  if (!plan_id) throw new AppError("plan_id is required", 400);

  const interval = normalizeInterval(rawInterval);
  const plan = await plansService.getPlanById(plan_id);
  if (!plan) throw new AppError("Plan not found", 404);

  const amount =
    interval === "yearly" ? plan.price_yearly : plan.price_monthly;
  if (amount === null || amount === undefined) {
    throw new AppError("Plan price is missing for the selected interval", 400);
  }
  const amountNumber = Number(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    throw new AppError("Plan price is invalid", 400);
  }

  const currency = (
    normalizeCurrency(plan.currency) || DEFAULT_CURRENCY
  ).toLowerCase();
  const client = await stripeService.getClient();
  const multiplier = getMinorUnitsMultiplier(currency);
  const unitAmount = Math.round(amountNumber * multiplier);

  const fallbackBase = frontendBase || "http://localhost:3000";
  const successUrl =
    success_url ||
    `${fallbackBase}/dashboard/admin/billing?status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    cancel_url ||
    `${fallbackBase}/dashboard/admin/billing?status=cancelled`;

  const session = await client.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenant_id: tenantId,
      plan_id,
      interval,
    },
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `${plan.name} (${interval})`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
  });

  sendSuccess(
    res,
    {
      session_id: session.id,
      url: session.url,
    },
    "Stripe checkout session created",
  );
});

exports.confirmStripeCheckout = catchAsync(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new AppError("Tenant context is required", 400);
  const { session_id } = req.body || {};
  if (!session_id) throw new AppError("session_id is required", 400);

  const client = await stripeService.getClient();
  const session = await client.checkout.sessions.retrieve(session_id);

  if (!session || session.payment_status !== "paid") {
    throw new AppError("Payment not completed yet", 400);
  }
  const metadata = session.metadata || {};
  const metaTenant = metadata.tenant_id;
  if (metaTenant && metaTenant !== tenantId) {
    throw new AppError("Tenant mismatch for this session", 403);
  }
  const planId = metadata.plan_id;
  if (!planId) throw new AppError("plan_id missing in session", 400);
  const interval = normalizeInterval(metadata.interval);
  const plan = await plansService.getPlanById(planId);
  if (!plan) throw new AppError("Plan not found", 404);

  const now = new Date();
  const periodEnd = addInterval(now, interval);
  const providerSub =
    session.subscription || session.payment_intent || session.id;
  const providerCustomer = session.customer || null;

  const payload = {
    tenant_id: tenantId,
    plan_id: planId,
    state: "active",
    period_start: now,
    period_end: periodEnd,
    provider: "stripe",
    provider_sub: providerSub,
    provider_cust: providerCustomer,
    meta: {
      interval,
      currency: session.currency,
      amount_total: session.amount_total,
      session_id: session.id,
    },
    updated_at: db.fn.now(),
  };

  let subscription;
  try {
    const [row] = await db("subscriptions")
      .insert(payload)
      .onConflict("tenant_id")
      .merge(payload)
      .returning("*");
    subscription = row || payload;
  } catch (err) {
    logger.error("Failed to upsert tenant subscription", {
      error: err.message,
      tenantId,
    });
    throw new AppError("Failed to store subscription", 500);
  }

  try {
    await db("tenants").where({ id: tenantId }).update({
      plan_id: planId,
      status: "active",
      updated_at: db.fn.now(),
    });
  } catch (err) {
    logger.warn("Failed to sync tenant plan_id after Stripe payment", {
      error: err.message,
      tenantId,
    });
  }

  const sync = await subscriptionSync.syncTenantSubscriptionState(tenantId);

  sendSuccess(
    res,
    { subscription, sync },
    "Subscription activated via Stripe",
  );
});
