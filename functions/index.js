const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const Stripe = require("stripe");

admin.initializeApp();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const appUrl = defineString("APP_URL", {
  default: "https://zaspdragon.github.io/Portaly/"
});
const priceStarter = defineString("STRIPE_PRICE_STARTER", { default: "" });
const priceAgency = defineString("STRIPE_PRICE_AGENCY", { default: "" });
const priceGrowth = defineString("STRIPE_PRICE_GROWTH", { default: "" });

function stripeClient() {
  return new Stripe(stripeSecretKey.value(), {
    apiVersion: "2026-02-25.clover"
  });
}

async function authenticateRequest(req) {
  const authHeader = req.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    throw createHttpError(401, "Missing Firebase ID token.");
  }

  const idToken = authHeader.slice("Bearer ".length);
  const decoded = await admin.auth().verifyIdToken(idToken);
  const profileSnap = await admin.firestore().collection("users").doc(decoded.uid).get();

  if (!profileSnap.exists) {
    throw createHttpError(403, "User profile not found in Firestore.");
  }

  const profile = {
    id: profileSnap.id,
    ...profileSnap.data()
  };

  return {
    uid: decoded.uid,
    profile
  };
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function resolveAgencyId(profile, requestedAgencyId) {
  if (profile.role === "platformOwner" && requestedAgencyId) {
    return requestedAgencyId;
  }

  if (!profile.agencyId) {
    throw createHttpError(400, "No agency is attached to this user.");
  }

  return profile.agencyId;
}

function resolvePriceId(planId) {
  const planMap = {
    starter: priceStarter.value(),
    agency: priceAgency.value(),
    growth: priceGrowth.value()
  };

  if (!planMap[planId]) {
    throw createHttpError(400, `Missing Stripe price ID for the ${planId} plan.`);
  }

  return planMap[planId];
}

function mapStripeStatus(status) {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete_expired":
      return "expired_trial";
    default:
      return status || "trialing";
  }
}

async function getAgencyRefAndData(agencyId) {
  const agencyRef = admin.firestore().collection("agencies").doc(agencyId);
  const agencySnap = await agencyRef.get();

  if (!agencySnap.exists) {
    throw createHttpError(404, "Agency not found.");
  }

  return {
    agencyRef,
    agency: {
      id: agencySnap.id,
      ...agencySnap.data()
    }
  };
}

async function ensureStripeCustomer(stripe, agencyRef, agency, profile) {
  if (agency.stripeCustomerId) {
    return agency.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    name: agency.name,
    email: profile.email || undefined,
    metadata: {
      agencyId: agency.id,
      ownerUserId: agency.ownerUserId || profile.id
    }
  });

  await agencyRef.update({
    stripeCustomerId: customer.id,
    updatedAt: new Date().toISOString()
  });

  return customer.id;
}

function isoFromUnix(value) {
  if (!value) {
    return "";
  }
  return new Date(value * 1000).toISOString();
}

async function upsertSubscriptionRecord({
  agencyId,
  stripeCustomerId = "",
  stripeSubscriptionId = "",
  planId = "",
  status = "trialing",
  currentPeriodStart = "",
  currentPeriodEnd = "",
  trialStart = "",
  trialEnd = ""
}) {
  if (!agencyId) {
    return;
  }

  const collectionRef = admin.firestore().collection("subscriptions");
  const querySnapshot = await collectionRef.where("agencyId", "==", agencyId).limit(1).get();
  const docRef = querySnapshot.empty ? collectionRef.doc() : querySnapshot.docs[0].ref;
  const existing = querySnapshot.empty ? {} : querySnapshot.docs[0].data();
  const now = new Date().toISOString();

  await docRef.set({
    id: docRef.id,
    agencyId,
    stripeCustomerId: stripeCustomerId || existing.stripeCustomerId || "",
    stripeSubscriptionId: stripeSubscriptionId || existing.stripeSubscriptionId || "",
    planId: planId || existing.planId || "",
    status: status || existing.status || "trialing",
    currentPeriodStart: currentPeriodStart || existing.currentPeriodStart || "",
    currentPeriodEnd: currentPeriodEnd || existing.currentPeriodEnd || "",
    trialStart: trialStart || existing.trialStart || "",
    trialEnd: trialEnd || existing.trialEnd || "",
    createdAt: existing.createdAt || now,
    updatedAt: now
  }, { merge: true });
}

exports.createCheckoutSession = onRequest(
  {
    cors: true,
    secrets: [stripeSecretKey]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!["agencyOwner", "platformOwner"].includes(auth.profile.role)) {
        throw createHttpError(403, "Only agency owners can start a subscription.");
      }

      const planId = req.body.planId;
      if (!planId || planId === "enterprise") {
        throw createHttpError(400, "Choose a Stripe-backed plan before checkout.");
      }

      const trialDays = Math.max(0, Math.min(Number(req.body.trialDays || 0), 14));
      const agencyId = resolveAgencyId(auth.profile, req.body.agencyId);
      const { agencyRef, agency } = await getAgencyRefAndData(agencyId);
      const stripe = stripeClient();
      const customerId = await ensureStripeCustomer(stripe, agencyRef, agency, auth.profile);

      const sessionConfig = {
        mode: "subscription",
        customer: customerId,
        allow_promotion_codes: true,
        client_reference_id: agencyId,
        line_items: [
          {
            price: resolvePriceId(planId),
            quantity: 1
          }
        ],
        success_url: `${appUrl.value()}#/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl.value()}#/billing?checkout=cancel`,
        metadata: {
          agencyId,
          planId,
          initiatedBy: auth.uid
        },
        subscription_data: {
          metadata: {
            agencyId,
            planId
          }
        }
      };

      if (trialDays > 0) {
        sessionConfig.subscription_data.trial_period_days = trialDays;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      await agencyRef.update({
        planId,
        updatedAt: new Date().toISOString()
      });

      await upsertSubscriptionRecord({
        agencyId,
        stripeCustomerId: customerId,
        planId,
        status: trialDays > 0 ? "trialing" : "active"
      });

      res.status(200).json({
        url: session.url,
        sessionId: session.id
      });
    } catch (error) {
      logger.error("createCheckoutSession failed", error);
      res.status(error.status || 500).json({
        error: error.message || "Unable to create Stripe checkout session."
      });
    }
  }
);

exports.createBillingPortalSession = onRequest(
  {
    cors: true,
    secrets: [stripeSecretKey]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!["agencyOwner", "platformOwner"].includes(auth.profile.role)) {
        throw createHttpError(403, "Only agency owners can manage billing.");
      }

      const agencyId = resolveAgencyId(auth.profile, req.body.agencyId);
      const { agencyRef, agency } = await getAgencyRefAndData(agencyId);
      const stripe = stripeClient();
      const customerId = await ensureStripeCustomer(stripe, agencyRef, agency, auth.profile);

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl.value()}#/billing`
      });

      res.status(200).json({
        url: portalSession.url
      });
    } catch (error) {
      logger.error("createBillingPortalSession failed", error);
      res.status(error.status || 500).json({
        error: error.message || "Unable to create Stripe billing portal session."
      });
    }
  }
);

exports.createPortalSession = exports.createBillingPortalSession;

exports.stripeWebhook = onRequest(
  {
    cors: false,
    secrets: [stripeSecretKey, stripeWebhookSecret]
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Use POST for this endpoint.");
      return;
    }

    const stripe = stripeClient();
    const signature = req.get("stripe-signature");
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, stripeWebhookSecret.value());
    } catch (error) {
      logger.error("Stripe webhook signature verification failed", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const agencyId = session.metadata && session.metadata.agencyId
            ? session.metadata.agencyId
            : session.client_reference_id;

          if (agencyId) {
            const { agencyRef } = await getAgencyRefAndData(agencyId);
            await agencyRef.update({
              stripeCustomerId: session.customer || "",
              stripeSubscriptionId: session.subscription || "",
              subscriptionStatus: "trialing",
              updatedAt: new Date().toISOString()
            });
            await upsertSubscriptionRecord({
              agencyId,
              stripeCustomerId: session.customer || "",
              stripeSubscriptionId: session.subscription || "",
              planId: session.metadata && session.metadata.planId ? session.metadata.planId : "",
              status: "trialing"
            });
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const agencyIdFromMetadata = subscription.metadata && subscription.metadata.agencyId;
          const agencyRef = agencyIdFromMetadata
            ? admin.firestore().collection("agencies").doc(agencyIdFromMetadata)
            : null;

          let targetRef = agencyRef;
          if (!targetRef || !(await targetRef.get()).exists) {
            const query = await admin.firestore()
              .collection("agencies")
              .where("stripeCustomerId", "==", subscription.customer)
              .limit(1)
              .get();
            targetRef = query.empty ? null : query.docs[0].ref;
          }

          if (targetRef) {
            const targetSnap = await targetRef.get();
            const targetAgency = targetSnap.data();
            const update = {
              stripeCustomerId: subscription.customer || "",
              stripeSubscriptionId: subscription.id || "",
              subscriptionStatus: mapStripeStatus(subscription.status),
              updatedAt: new Date().toISOString()
            };

            if (subscription.metadata && subscription.metadata.planId) {
              update.planId = subscription.metadata.planId;
            }

            await targetRef.update(update);
            await upsertSubscriptionRecord({
              agencyId: targetRef.id,
              stripeCustomerId: subscription.customer || "",
              stripeSubscriptionId: subscription.id || "",
              planId: update.planId || targetAgency.planId || "",
              status: mapStripeStatus(subscription.status),
              currentPeriodStart: isoFromUnix(subscription.current_period_start),
              currentPeriodEnd: isoFromUnix(subscription.current_period_end),
              trialStart: isoFromUnix(subscription.trial_start),
              trialEnd: isoFromUnix(subscription.trial_end)
            });
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object;
          const query = await admin.firestore()
            .collection("agencies")
            .where("stripeCustomerId", "==", invoice.customer)
            .limit(1)
            .get();

          if (!query.empty) {
            await query.docs[0].ref.update({
              subscriptionStatus: "past_due",
              updatedAt: new Date().toISOString()
            });
            await upsertSubscriptionRecord({
              agencyId: query.docs[0].id,
              stripeCustomerId: invoice.customer || "",
              status: "past_due"
            });
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object;
          const query = await admin.firestore()
            .collection("agencies")
            .where("stripeCustomerId", "==", invoice.customer)
            .limit(1)
            .get();

          if (!query.empty) {
            await query.docs[0].ref.update({
              subscriptionStatus: "active",
              updatedAt: new Date().toISOString()
            });
            await upsertSubscriptionRecord({
              agencyId: query.docs[0].id,
              stripeCustomerId: invoice.customer || "",
              status: "active"
            });
          }
          break;
        }

        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error("stripeWebhook handler failed", error);
      res.status(500).json({
        error: error.message || "Unable to process Stripe webhook."
      });
    }
  }
);
