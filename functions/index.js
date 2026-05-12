const crypto = require("crypto");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

admin.initializeApp();

const squareAccessToken = defineSecret("SQUARE_ACCESS_TOKEN");
const squareWebhookSignatureKey = defineSecret("SQUARE_WEBHOOK_SIGNATURE_KEY");
const appUrl = defineString("APP_URL", {
  default: "https://zaspdragon.github.io/Portaly/"
});
const squareApiBaseUrl = defineString("SQUARE_API_BASE_URL", {
  default: "https://connect.squareup.com"
});
const squareApiVersion = defineString("SQUARE_API_VERSION", {
  default: "2026-01-22"
});
const squarePlanVariationStarter = defineString("SQUARE_PLAN_VARIATION_STARTER", { default: "" });
const squarePlanVariationAgency = defineString("SQUARE_PLAN_VARIATION_AGENCY", { default: "" });
const squarePlanVariationGrowth = defineString("SQUARE_PLAN_VARIATION_GROWTH", { default: "" });
const squarePaymentLinkStarter = defineString("SQUARE_PAYMENT_LINK_STARTER", {
  default: "https://square.link/u/mfu6eun7"
});
const squarePaymentLinkAgency = defineString("SQUARE_PAYMENT_LINK_AGENCY", {
  default: "https://square.link/u/ojz2a1Au"
});
const squarePaymentLinkGrowth = defineString("SQUARE_PAYMENT_LINK_GROWTH", {
  default: "https://square.link/u/Iy99LyYg"
});
const squarePaymentLinkEnterprise = defineString("SQUARE_PAYMENT_LINK_ENTERPRISE", {
  default: "https://square.link/u/96br6x5W"
});

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function nowIso() {
  return new Date().toISOString();
}

function paymentLinkForPlan(planId) {
  const links = {
    starter: squarePaymentLinkStarter.value(),
    agency: squarePaymentLinkAgency.value(),
    growth: squarePaymentLinkGrowth.value(),
    enterprise: squarePaymentLinkEnterprise.value()
  };
  return links[planId] || "";
}

function planVariationIdForPlan(planId) {
  const variations = {
    starter: squarePlanVariationStarter.value(),
    agency: squarePlanVariationAgency.value(),
    growth: squarePlanVariationGrowth.value()
  };
  return variations[planId] || "";
}

function planIdFromVariation(variationId) {
  const entries = Object.entries({
    starter: squarePlanVariationStarter.value(),
    agency: squarePlanVariationAgency.value(),
    growth: squarePlanVariationGrowth.value()
  });
  const match = entries.find(([, value]) => value && value === variationId);
  return match ? match[0] : "";
}

function normalizeSquareStatus(status) {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "PAUSED":
      return "paused";
    case "CANCELED":
      return "canceled";
    case "DEACTIVATED":
      return "canceled";
    case "PENDING":
      return "trialing";
    case "COMPLETED":
      return "canceled";
    default:
      return String(status || "").toLowerCase() || "trialing";
  }
}

function isoFromSquareDate(value) {
  if (!value) {
    return "";
  }
  if (String(value).includes("T")) {
    return value;
  }
  return `${value}T00:00:00.000Z`;
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
    throw createHttpError(403, "Portaly user profile not found.");
  }

  return {
    uid: decoded.uid,
    profile: {
      id: profileSnap.id,
      ...profileSnap.data()
    }
  };
}

async function authenticateUserOnly(req) {
  const authHeader = req.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    throw createHttpError(401, "Missing Firebase ID token.");
  }

  const idToken = authHeader.slice("Bearer ".length);
  return admin.auth().verifyIdToken(idToken);
}

function canManageBilling(profile) {
  return ["agencyOwner", "platformOwner"].includes(profile.role);
}

function canViewBilling(profile) {
  return canManageBilling(profile) || profile.role === "agencyAdmin";
}

function canInviteClientManagers(profile) {
  return ["agencyOwner", "agencyAdmin"].includes(profile.role);
}

function resolveAgencyId(profile, requestedAgencyId) {
  if (profile.role === "platformOwner" && requestedAgencyId) {
    return requestedAgencyId;
  }

  if (!profile.agencyId) {
    throw createHttpError(400, "No agency is attached to this account.");
  }

  return profile.agencyId;
}

function buildHashUrl(path) {
  const base = String(appUrl.value() || "https://zaspdragon.github.io/Portaly/").replace(/#.*$/, "");
  return `${base}#/${String(path || "").replace(/^#?\/?/, "")}`;
}

function createInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

async function getInviteByToken(inviteToken) {
  const querySnapshot = await admin.firestore()
    .collection("clientInvites")
    .where("inviteToken", "==", inviteToken)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const docSnap = querySnapshot.docs[0];
  return {
    ref: docSnap.ref,
    invite: {
      id: docSnap.id,
      ...docSnap.data()
    }
  };
}

async function resolveClientInviteScope(invite) {
  const agencySnap = invite.agencyId
    ? await admin.firestore().collection("agencies").doc(invite.agencyId).get()
    : null;
  const clientIds = Array.isArray(invite.assignedClientIds) ? invite.assignedClientIds : [];
  const siteIds = Array.isArray(invite.assignedSiteIds) ? invite.assignedSiteIds : [];
  const assignedClientNames = [];
  const assignedSiteNames = [];

  await Promise.all(clientIds.map(async clientId => {
    const snap = await admin.firestore().collection("clients").doc(clientId).get();
    if (snap.exists) {
      assignedClientNames.push(snap.data().name || clientId);
    }
  }));

  await Promise.all(siteIds.map(async siteId => {
    const snap = await admin.firestore().collection("sites").doc(siteId).get();
    if (snap.exists) {
      assignedSiteNames.push(snap.data().name || siteId);
    }
  }));

  let authAccountExists = false;
  try {
    await admin.auth().getUserByEmail(invite.email);
    authAccountExists = true;
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  return {
    ...invite,
    agencyName: agencySnap?.exists ? (agencySnap.data().name || "Portaly Agency") : "Portaly Agency",
    assignedClientNames,
    assignedSiteNames,
    authAccountExists,
    inviteLink: invite.inviteLink || buildHashUrl(`accept-invite/${invite.inviteToken}`)
  };
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

async function getSubscriptionRefAndData(agencyId) {
  const collectionRef = admin.firestore().collection("subscriptions");
  const querySnapshot = await collectionRef.where("agencyId", "==", agencyId).limit(1).get();
  const docRef = querySnapshot.empty ? collectionRef.doc() : querySnapshot.docs[0].ref;
  const existing = querySnapshot.empty ? {} : querySnapshot.docs[0].data();

  return {
    docRef,
    subscription: {
      id: docRef.id,
      ...existing
    }
  };
}

async function updateAgencyBillingFields(agencyRef, data) {
  await agencyRef.set({
    ...data,
    billingProvider: "square",
    updatedAt: nowIso()
  }, { merge: true });
}

async function upsertSubscriptionRecord(agencyId, data) {
  const { docRef, subscription } = await getSubscriptionRefAndData(agencyId);
  await docRef.set({
    id: docRef.id,
    agencyId,
    billingProvider: "square",
    squareCustomerId: data.squareCustomerId || subscription.squareCustomerId || "",
    squareSubscriptionId: data.squareSubscriptionId || subscription.squareSubscriptionId || "",
    planId: data.planId || subscription.planId || "",
    status: data.status || subscription.status || "trialing",
    trialStart: data.trialStart || subscription.trialStart || "",
    trialEnd: data.trialEnd || subscription.trialEnd || "",
    currentPeriodStart: data.currentPeriodStart || subscription.currentPeriodStart || "",
    currentPeriodEnd: data.currentPeriodEnd || subscription.currentPeriodEnd || "",
    canceledAt: data.canceledAt || subscription.canceledAt || "",
    cancelAtPeriodEnd: typeof data.cancelAtPeriodEnd === "boolean" ? data.cancelAtPeriodEnd : !!subscription.cancelAtPeriodEnd,
    pausedAt: data.pausedAt || subscription.pausedAt || "",
    resumedAt: data.resumedAt || subscription.resumedAt || "",
    nextBillingDate: data.nextBillingDate || subscription.nextBillingDate || "",
    createdAt: subscription.createdAt || data.createdAt || nowIso(),
    updatedAt: nowIso()
  }, { merge: true });
}

async function squareRequest(path, method = "GET", body = null) {
  if (!squareAccessToken.value()) {
    throw createHttpError(503, "Square access token is not configured.");
  }

  const response = await fetch(`${squareApiBaseUrl.value()}${path}`, {
    method,
    headers: {
      "Square-Version": squareApiVersion.value(),
      Authorization: `Bearer ${squareAccessToken.value()}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorText = (payload.errors || []).map(item => item.detail || item.code).filter(Boolean).join("; ");
    throw createHttpError(response.status, errorText || payload.message || "Square request failed.");
  }

  return payload;
}

async function syncSquareSubscriptionRecord(agencyId, squareSubscriptionId, requestedPlanId = "") {
  const payload = await squareRequest(`/v2/subscriptions/${squareSubscriptionId}?include=actions`);
  const subscription = payload.subscription || {};
  const actions = payload.actions || [];
  const normalizedStatus = normalizeSquareStatus(subscription.status);
  const planId = requestedPlanId || planIdFromVariation(subscription.plan_variation_id) || "";
  const cancelAtPeriodEnd = actions.some(action => String(action.type || "").toUpperCase() === "CANCEL");

  const update = {
    squareCustomerId: subscription.customer_id || "",
    squareSubscriptionId: subscription.id || squareSubscriptionId,
    planId,
    status: cancelAtPeriodEnd && normalizedStatus === "active" ? "cancel_at_period_end" : normalizedStatus,
    currentPeriodStart: isoFromSquareDate(subscription.start_date),
    currentPeriodEnd: isoFromSquareDate(subscription.charged_through_date || subscription.paid_until_date || ""),
    trialStart: isoFromSquareDate(subscription.start_date),
    trialEnd: isoFromSquareDate(subscription.paid_until_date || ""),
    canceledAt: isoFromSquareDate(subscription.canceled_date || ""),
    cancelAtPeriodEnd,
    pausedAt: normalizedStatus === "paused" ? nowIso() : "",
    nextBillingDate: isoFromSquareDate(subscription.charged_through_date || subscription.paid_until_date || "")
  };

  const { agencyRef } = await getAgencyRefAndData(agencyId);
  await updateAgencyBillingFields(agencyRef, {
    planId: planId || undefined,
    subscriptionStatus: update.status,
    squareCustomerId: update.squareCustomerId,
    squareSubscriptionId: update.squareSubscriptionId
  });
  await upsertSubscriptionRecord(agencyId, update);

  return {
    agencyId,
    ...update
  };
}

function responseJson(res, status, body) {
  res.status(status).json(body);
}

exports.createClientManagerInvite = onRequest(
  {
    cors: true
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!canInviteClientManagers(auth.profile)) {
        throw createHttpError(403, "Only agency leadership can invite client managers.");
      }

      const agencyId = resolveAgencyId(auth.profile, req.body.agencyId);
      const email = String(req.body.email || "").trim().toLowerCase();
      const firstName = String(req.body.firstName || "").trim();
      const lastName = String(req.body.lastName || "").trim();
      const phone = String(req.body.phone || "").trim();
      const assignedClientIds = Array.isArray(req.body.assignedClientIds) ? req.body.assignedClientIds.filter(Boolean) : [];
      const assignedSiteIds = Array.isArray(req.body.assignedSiteIds) ? req.body.assignedSiteIds.filter(Boolean) : [];

      if (!email || !firstName || !lastName) {
        throw createHttpError(400, "First name, last name, and email are required.");
      }
      if (!assignedClientIds.length && !assignedSiteIds.length) {
        throw createHttpError(400, "Assign at least one client or site before inviting a client manager.");
      }

      const inviteCollection = admin.firestore().collection("clientInvites");
      const existingInviteQuery = await inviteCollection
        .where("email", "==", email)
        .limit(10)
        .get();
      const existingPendingInvite = existingInviteQuery.docs
        .map(docSnap => ({ ref: docSnap.ref, data: docSnap.data() }))
        .find(item => item.data.agencyId === agencyId && item.data.status === "pending");

      const inviteRef = existingPendingInvite ? existingPendingInvite.ref : inviteCollection.doc();
      const createdAt = existingPendingInvite
        ? (existingPendingInvite.data.createdAt || nowIso())
        : nowIso();
      const inviteToken = createInviteToken();
      const tokenExpiresAt = new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString();
      const inviteLink = buildHashUrl(`accept-invite/${inviteToken}`);

      const inviteRecord = {
        id: inviteRef.id,
        agencyId,
        email,
        firstName,
        lastName,
        phone,
        role: "clientManager",
        assignedClientIds,
        assignedSiteIds,
        status: "pending",
        inviteToken,
        tokenExpiresAt,
        acceptedAt: "",
        createdAt,
        updatedAt: nowIso(),
        createdBy: auth.uid,
        inviteLink
      };

      await inviteRef.set(inviteRecord, { merge: true });

      responseJson(res, 200, {
        ok: true,
        invite: await resolveClientInviteScope(inviteRecord)
      });
    } catch (error) {
      logger.error("createClientManagerInvite failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to create the client manager invite."
      });
    }
  }
);

exports.verifyClientManagerInvite = onRequest(
  {
    cors: true
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const inviteToken = String(req.body.token || "").trim();
      if (!inviteToken) {
        throw createHttpError(400, "Invite token is required.");
      }

      const result = await getInviteByToken(inviteToken);
      if (!result) {
        throw createHttpError(404, "This Portaly invite could not be found.");
      }

      responseJson(res, 200, {
        ok: true,
        invite: await resolveClientInviteScope(result.invite)
      });
    } catch (error) {
      logger.error("verifyClientManagerInvite failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to verify the client manager invite."
      });
    }
  }
);

exports.acceptClientManagerInvite = onRequest(
  {
    cors: true
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const decoded = await authenticateUserOnly(req);
      const inviteToken = String(req.body.token || "").trim();
      if (!inviteToken) {
        throw createHttpError(400, "Invite token is required.");
      }

      const result = await getInviteByToken(inviteToken);
      if (!result) {
        throw createHttpError(404, "This Portaly invite could not be found.");
      }

      const invite = result.invite;
      const email = String(decoded.email || "").trim().toLowerCase();
      if (!email || email !== String(invite.email || "").trim().toLowerCase()) {
        throw createHttpError(403, "Sign in with the invited email before continuing.");
      }
      if (invite.status === "accepted" && invite.acceptedBy && invite.acceptedBy !== decoded.uid) {
        throw createHttpError(403, "This invite has already been accepted by another account.");
      }
      if (invite.tokenExpiresAt && new Date(invite.tokenExpiresAt) < new Date()) {
        throw createHttpError(410, "This invite has expired. Ask the agency to send a new invite.");
      }

      const userRef = admin.firestore().collection("users").doc(decoded.uid);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const existing = userSnap.data();
        if (existing.agencyId && existing.agencyId !== invite.agencyId) {
          throw createHttpError(409, "This email is already connected to a different Portaly agency.");
        }
        if (existing.role && existing.role !== "clientManager") {
          throw createHttpError(409, "This Portaly login already belongs to a different role.");
        }
      }

      const createdAt = userSnap.exists ? (userSnap.data().createdAt || nowIso()) : nowIso();
      const mergedClientIds = [...new Set([...(userSnap.data()?.assignedClientIds || []), ...(invite.assignedClientIds || [])])];
      const mergedSiteIds = [...new Set([...(userSnap.data()?.assignedSiteIds || []), ...(invite.assignedSiteIds || [])])];
      const userProfile = {
        id: decoded.uid,
        agencyId: invite.agencyId,
        role: "clientManager",
        firstName: invite.firstName || userSnap.data()?.firstName || "",
        lastName: invite.lastName || userSnap.data()?.lastName || "",
        email: invite.email,
        phone: invite.phone || userSnap.data()?.phone || "",
        status: "active",
        assignedClientIds: mergedClientIds,
        assignedSiteIds: mergedSiteIds,
        workerId: "",
        createdAt,
        updatedAt: nowIso()
      };

      await userRef.set(userProfile, { merge: true });
      await result.ref.set({
        status: "accepted",
        acceptedAt: nowIso(),
        acceptedBy: decoded.uid,
        updatedAt: nowIso()
      }, { merge: true });

      responseJson(res, 200, {
        ok: true,
        invite: await resolveClientInviteScope({
          ...invite,
          status: "accepted",
          acceptedAt: nowIso(),
          acceptedBy: decoded.uid,
          updatedAt: nowIso()
        }),
        user: userProfile
      });
    } catch (error) {
      logger.error("acceptClientManagerInvite failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to accept the client manager invite."
      });
    }
  }
);

exports.createSquareSubscriptionLink = onRequest(
  {
    cors: true
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!canManageBilling(auth.profile)) {
        throw createHttpError(403, "Only agency owners can start checkout.");
      }

      const planId = String(req.body.planId || "").trim();
      const link = paymentLinkForPlan(planId);
      if (!planId || !link) {
        throw createHttpError(400, "Square payment link missing for this plan.");
      }

      const agencyId = resolveAgencyId(auth.profile, req.body.agencyId);
      const { agencyRef } = await getAgencyRefAndData(agencyId);
      await updateAgencyBillingFields(agencyRef, {
        planId
      });

      responseJson(res, 200, {
        provider: "square",
        planId,
        url: link,
        appUrl: appUrl.value()
      });
    } catch (error) {
      logger.error("createSquareSubscriptionLink failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to prepare the Square checkout link."
      });
    }
  }
);

exports.cancelSquareSubscription = onRequest(
  {
    cors: true,
    secrets: [squareAccessToken]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!canManageBilling(auth.profile)) {
        throw createHttpError(403, "Only agency owners can cancel billing.");
      }

      const subscriptionId = String(req.body.subscriptionId || "").trim();
      if (!subscriptionId) {
        throw createHttpError(400, "Subscription ID is required.");
      }

      const agencyId = resolveAgencyId(auth.profile, req.body.agencyId);
      await squareRequest(`/v2/subscriptions/${subscriptionId}/cancel`, "POST");
      await upsertSubscriptionRecord(agencyId, {
        squareSubscriptionId: subscriptionId,
        status: "cancel_at_period_end",
        canceledAt: nowIso(),
        cancelAtPeriodEnd: true
      });
      const { agencyRef } = await getAgencyRefAndData(agencyId);
      await updateAgencyBillingFields(agencyRef, {
        subscriptionStatus: "cancel_at_period_end",
        squareSubscriptionId: subscriptionId
      });

      responseJson(res, 200, {
        ok: true,
        status: "cancel_at_period_end"
      });
    } catch (error) {
      logger.error("cancelSquareSubscription failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to cancel the Square subscription."
      });
    }
  }
);

exports.pauseSquareSubscription = onRequest(
  {
    cors: true,
    secrets: [squareAccessToken]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!canManageBilling(auth.profile)) {
        throw createHttpError(403, "Only agency owners can pause billing.");
      }

      const subscriptionId = String(req.body.subscriptionId || "").trim();
      if (!subscriptionId) {
        throw createHttpError(400, "Subscription ID is required.");
      }

      const agencyId = resolveAgencyId(auth.profile, req.body.agencyId);
      await squareRequest(`/v2/subscriptions/${subscriptionId}/pause`, "POST", {
        pause_reason: "Paused from Portaly billing page",
        resume_change_timing: "IMMEDIATE"
      });
      await upsertSubscriptionRecord(agencyId, {
        squareSubscriptionId: subscriptionId,
        status: "paused",
        pausedAt: nowIso()
      });
      const { agencyRef } = await getAgencyRefAndData(agencyId);
      await updateAgencyBillingFields(agencyRef, {
        subscriptionStatus: "paused",
        squareSubscriptionId: subscriptionId
      });

      responseJson(res, 200, {
        ok: true,
        status: "paused"
      });
    } catch (error) {
      logger.error("pauseSquareSubscription failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to pause the Square subscription."
      });
    }
  }
);

exports.resumeSquareSubscription = onRequest(
  {
    cors: true,
    secrets: [squareAccessToken]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!canManageBilling(auth.profile)) {
        throw createHttpError(403, "Only agency owners can resume billing.");
      }

      const subscriptionId = String(req.body.subscriptionId || "").trim();
      if (!subscriptionId) {
        throw createHttpError(400, "Subscription ID is required.");
      }

      const agencyId = resolveAgencyId(auth.profile, req.body.agencyId);
      await squareRequest(`/v2/subscriptions/${subscriptionId}/resume`, "POST", {
        resume_change_timing: "IMMEDIATE"
      });
      await upsertSubscriptionRecord(agencyId, {
        squareSubscriptionId: subscriptionId,
        status: "active",
        resumedAt: nowIso(),
        cancelAtPeriodEnd: false
      });
      const { agencyRef } = await getAgencyRefAndData(agencyId);
      await updateAgencyBillingFields(agencyRef, {
        subscriptionStatus: "active",
        squareSubscriptionId: subscriptionId
      });

      responseJson(res, 200, {
        ok: true,
        status: "active"
      });
    } catch (error) {
      logger.error("resumeSquareSubscription failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to resume the Square subscription."
      });
    }
  }
);

exports.swapSquareSubscriptionPlan = onRequest(
  {
    cors: true,
    secrets: [squareAccessToken]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!canManageBilling(auth.profile)) {
        throw createHttpError(403, "Only agency owners can change plans.");
      }

      const subscriptionId = String(req.body.subscriptionId || "").trim();
      const newPlanId = String(req.body.newPlanId || "").trim();
      if (!subscriptionId || !newPlanId) {
        throw createHttpError(400, "Subscription ID and new plan ID are required.");
      }

      const newPlanVariationId = planVariationIdForPlan(newPlanId);
      if (!newPlanVariationId) {
        throw createHttpError(400, "Square plan variation ID is not configured for that plan.");
      }

      const agencyId = resolveAgencyId(auth.profile, req.body.agencyId);
      await squareRequest(`/v2/subscriptions/${subscriptionId}/swap-plan`, "POST", {
        new_plan_variation_id: newPlanVariationId
      });
      await upsertSubscriptionRecord(agencyId, {
        squareSubscriptionId: subscriptionId,
        planId: newPlanId,
        status: "active"
      });
      const { agencyRef } = await getAgencyRefAndData(agencyId);
      await updateAgencyBillingFields(agencyRef, {
        planId: newPlanId,
        subscriptionStatus: "active",
        squareSubscriptionId: subscriptionId
      });

      responseJson(res, 200, {
        ok: true,
        planId: newPlanId,
        status: "active"
      });
    } catch (error) {
      logger.error("swapSquareSubscriptionPlan failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to change the Square subscription plan."
      });
    }
  }
);

exports.getSquareSubscriptionStatus = onRequest(
  {
    cors: true,
    secrets: [squareAccessToken]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!canViewBilling(auth.profile)) {
        throw createHttpError(403, "Only agency leadership can view billing.");
      }

      const subscriptionId = String(req.body.subscriptionId || "").trim();
      if (!subscriptionId) {
        throw createHttpError(400, "Subscription ID is required.");
      }

      const payload = await squareRequest(`/v2/subscriptions/${subscriptionId}?include=actions`);
      responseJson(res, 200, {
        ok: true,
        subscription: payload.subscription || null,
        actions: payload.actions || []
      });
    } catch (error) {
      logger.error("getSquareSubscriptionStatus failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to retrieve the Square subscription."
      });
    }
  }
);

exports.syncSquareSubscriptionToFirestore = onRequest(
  {
    cors: true,
    secrets: [squareAccessToken]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!canViewBilling(auth.profile)) {
        throw createHttpError(403, "Only agency leadership can refresh billing.");
      }

      const subscriptionId = String(req.body.subscriptionId || "").trim();
      if (!subscriptionId) {
        throw createHttpError(400, "Subscription ID is required.");
      }

      const agencyId = resolveAgencyId(auth.profile, req.body.agencyId);
      const synced = await syncSquareSubscriptionRecord(agencyId, subscriptionId, String(req.body.planId || "").trim());
      responseJson(res, 200, {
        ok: true,
        subscription: synced
      });
    } catch (error) {
      logger.error("syncSquareSubscriptionToFirestore failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to refresh the Square subscription."
      });
    }
  }
);

exports.updateSquarePaymentMethod = onRequest(
  {
    cors: true
  },
  async (_req, res) => {
    responseJson(res, 200, {
      ok: true,
      message: "Payment method updates are handled securely through Square. Contact support or use the Square subscription email receipt to update payment details."
    });
  }
);

exports.squareWebhook = onRequest(
  {
    cors: false,
    secrets: [squareAccessToken, squareWebhookSignatureKey]
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Use POST for this endpoint.");
      return;
    }

    try {
      const event = req.body || {};
      const eventType = String(event.type || "");
      const data = event.data || {};
      const subscription = data.subscription || data.object?.subscription || null;

      logger.info("squareWebhook received", {
        type: eventType
      });

      if (subscription?.id) {
        const query = await admin.firestore()
          .collection("agencies")
          .where("squareSubscriptionId", "==", subscription.id)
          .limit(1)
          .get();

        if (!query.empty) {
          const agencyId = query.docs[0].id;
          await syncSquareSubscriptionRecord(agencyId, subscription.id);
        }
      }

      // TODO: Verify Square webhook signatures before enabling production automation.
      // Future events to watch:
      // - payment.updated
      // - subscription.created
      // - subscription.updated
      // - invoice.payment_made
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error("squareWebhook failed", error);
      res.status(error.status || 500).json({
        error: error.message || "Unable to process the Square webhook."
      });
    }
  }
);

exports.createSquareCheckoutSession = exports.createSquareSubscriptionLink;
