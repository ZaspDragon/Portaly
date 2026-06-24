const crypto = require("crypto");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { google } = require("googleapis");
const { Resend } = require("resend");

admin.initializeApp();

const squareAccessToken = defineSecret("SQUARE_ACCESS_TOKEN");
const squareWebhookSignatureKey = defineSecret("SQUARE_WEBHOOK_SIGNATURE_KEY");
const resendApiKey = defineSecret("RESEND_API_KEY");
const gmailOauthClientId = defineSecret("GMAIL_OAUTH_CLIENT_ID");
const gmailOauthClientSecret = defineSecret("GMAIL_OAUTH_CLIENT_SECRET");
const gmailOauthRefreshToken = defineSecret("GMAIL_OAUTH_REFRESH_TOKEN");
const appUrl = defineString("APP_URL", {
  default: "https://zaspdragon.github.io/Portaly/"
});
const inviteEmailFrom = defineString("INVITE_EMAIL_FROM", {
  default: "Portaly <onboarding@resend.dev>"
});
// Use onboarding@resend.dev for testing. Use a verified sending domain such as
// noreply@verified-domain.com in production so recipient inbox placement improves.
const inviteEmailReplyTo = defineString("INVITE_EMAIL_REPLY_TO", {
  default: ""
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
const squarePaymentLinkGrowth = defineString("SQUARE_PAYMENT_LINK_GROWTH", {
  default: "https://square.link/u/Iy99LyYg"
});
const squarePaymentLinkEnterprise = defineString("SQUARE_PAYMENT_LINK_ENTERPRISE", {
  default: "https://square.link/u/96br6x5W"
});
const inviteCorsOrigins = [
  "https://zaspdragon.github.io",
  "http://localhost:5000",
  "http://localhost:5173"
];
const DUPLICATE_PUNCH_WINDOW_MS = 2 * 60 * 1000;
const LEGACY_PLAN_ALIASES = {
  agency: "growth"
};
const WORKER_BILLING_PLANS = {
  starter: {
    id: "starter",
    label: "Starter",
    baseMonthlyPrice: 49,
    includedWorkers: 10,
    additionalWorkerPrice: 4
  },
  growth: {
    id: "growth",
    label: "Growth",
    baseMonthlyPrice: 249,
    includedWorkers: 50,
    additionalWorkerPrice: 3
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    baseMonthlyPrice: null,
    includedWorkers: null,
    additionalWorkerPrice: null
  }
};

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function nowIso() {
  return new Date().toISOString();
}

function startOfWeek(value = new Date()) {
  const date = new Date(value);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfWeek(value = new Date()) {
  const date = startOfWeek(value);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
}

function paymentLinkForPlan(planId) {
  const normalizedPlanId = normalizePlanId(planId);
  const links = {
    starter: squarePaymentLinkStarter.value(),
    growth: squarePaymentLinkGrowth.value(),
    enterprise: squarePaymentLinkEnterprise.value()
  };
  return links[normalizedPlanId] || "";
}

function planVariationIdForPlan(planId) {
  const normalizedPlanId = normalizePlanId(planId);
  const variations = {
    starter: squarePlanVariationStarter.value(),
    growth: squarePlanVariationGrowth.value()
  };
  return variations[normalizedPlanId] || "";
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

function normalizePlanId(planId) {
  const normalized = String(planId || "").trim().toLowerCase();
  return LEGACY_PLAN_ALIASES[normalized] || normalized || "growth";
}

function getWorkerBillingPlan(planId) {
  return WORKER_BILLING_PLANS[normalizePlanId(planId)] || WORKER_BILLING_PLANS.growth;
}

function canInviteClientManagers(profile) {
  return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(profile.role);
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

function normalizeInviteStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function isPublicInviteStatus(status) {
  return ["pending", "sent", "opened"].includes(normalizeInviteStatus(status));
}

function nextInviteStatusAfterEmail(status) {
  return normalizeInviteStatus(status) === "opened" ? "opened" : "sent";
}

function isValidEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getInviteByToken(inviteToken) {
  const normalizedToken = String(inviteToken || "").trim();
  if (!normalizedToken) {
    return null;
  }

  const directSnap = await admin.firestore().collection("clientInvites").doc(normalizedToken).get();
  if (directSnap.exists) {
    return {
      ref: directSnap.ref,
      invite: {
        id: directSnap.id,
        ...directSnap.data()
      }
    };
  }

  const querySnapshot = await admin.firestore()
    .collection("clientInvites")
    .where("inviteToken", "==", normalizedToken)
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

async function getInviteByIdOrToken(inviteId, inviteToken) {
  const collection = admin.firestore().collection("clientInvites");
  const normalizedId = String(inviteId || "").trim();
  const normalizedToken = String(inviteToken || "").trim();

  if (normalizedId) {
    const inviteSnap = await collection.doc(normalizedId).get();
    if (inviteSnap.exists) {
      const invite = {
        id: inviteSnap.id,
        ...inviteSnap.data()
      };
      if (!normalizedToken || invite.inviteToken === normalizedToken || invite.id === normalizedToken) {
        return {
          ref: inviteSnap.ref,
          invite
        };
      }
    }
  }

  if (!normalizedToken) {
    return null;
  }

  return getInviteByToken(normalizedToken);
}

function buildClientInviteEmailContent({ firstName, agencyName, inviteUrl, assignedClientNames = [], assignedSiteNames = [] }) {
  const safeName = firstName || "there";
  const clientsText = assignedClientNames.length ? assignedClientNames.join(", ") : "your assigned client";
  const sitesText = assignedSiteNames.length ? assignedSiteNames.join(", ") : "your assigned site";
  const escapedUrl = escapeHtml(inviteUrl);
  const escapedAgencyName = escapeHtml(agencyName || "Portaly Agency");
  const escapedClients = escapeHtml(clientsText);
  const escapedSites = escapeHtml(sitesText);

  return {
    subject: "You've been invited to approve timecards in Portaly",
    text: [
      `Hi ${safeName},`,
      "",
      `${agencyName || "A staffing agency"} has invited you to Portaly to review and approve timecards for ${sitesText}.`,
      "",
      `Assigned clients: ${clientsText}`,
      `Assigned sites: ${sitesText}`,
      "",
      "Use this secure link to set up access and continue to approvals:",
      inviteUrl,
      "",
      "Once you sign in, you can review assigned worker timecards, correct missed punches, and approve submitted hours.",
      "",
      "Thank you,",
      "Portaly"
    ].join("\n"),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f5f8ff;padding:24px;color:#10203a;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbe7ff;border-radius:18px;padding:32px;box-shadow:0 16px 48px rgba(16,32,58,0.08);">
          <p style="margin:0 0 8px;color:#1f6fff;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;">Portaly</p>
          <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#10203a;">You've been invited to approve timecards in Portaly</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Hi ${escapeHtml(safeName)},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">${escapedAgencyName} invited you to review and approve timecards for your assigned warehouse or client site in Portaly.</p>
          <div style="margin:20px 0;padding:18px;border-radius:14px;background:#f7faff;border:1px solid #dbe7ff;">
            <p style="margin:0 0 8px;font-size:14px;color:#52627a;"><strong>Assigned clients:</strong> ${escapedClients}</p>
            <p style="margin:0;font-size:14px;color:#52627a;"><strong>Assigned sites:</strong> ${escapedSites}</p>
          </div>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.65;">Use this secure link to set up access, review assigned worker timecards, and approve submitted hours.</p>
          <p style="margin:0 0 24px;">
            <a href="${escapedUrl}" style="display:inline-block;background:#1f6fff;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700;">Set Up Access</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7b93;">If the button does not open, copy and paste this link into your browser:</p>
          <p style="margin:0;word-break:break-all;font-size:13px;color:#1f6fff;">${escapedUrl}</p>
        </div>
      </div>
    `
  };
}

function buildDemoAccessEmailContent() {
  const loginUrl = buildHashUrl("login");
  const lines = [
    "Thanks for checking out Portaly.",
    "",
    "Demo Login:",
    `URL: ${loginUrl}`,
    "Email: demo@portaly.com",
    "Password: demo123",
    "",
    "You can test:",
    "- Worker QR punching",
    "- Client manager approvals",
    "- Payroll export",
    "- Agency dashboard"
  ];

  return {
    subject: "Your Portaly Demo Access",
    text: lines.join("\n"),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f5f8ff;padding:24px;color:#10203a;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbe7ff;border-radius:18px;padding:32px;box-shadow:0 16px 48px rgba(16,32,58,0.08);">
          <p style="margin:0 0 8px;color:#1f6fff;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;">Portaly</p>
          <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#10203a;">Your Portaly Demo Access</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Thanks for checking out Portaly.</p>
          <div style="margin:20px 0;padding:18px;border-radius:14px;background:#f7faff;border:1px solid #dbe7ff;">
            <p style="margin:0 0 8px;font-size:14px;color:#52627a;"><strong>URL:</strong> <a href="${escapeHtml(loginUrl)}" style="color:#1f6fff;text-decoration:none;">${escapeHtml(loginUrl)}</a></p>
            <p style="margin:0 0 8px;font-size:14px;color:#52627a;"><strong>Email:</strong> demo@portaly.com</p>
            <p style="margin:0;font-size:14px;color:#52627a;"><strong>Password:</strong> demo123</p>
          </div>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.65;">You can test:</p>
          <ul style="margin:0;padding-left:20px;color:#52627a;font-size:15px;line-height:1.7;">
            <li>Worker QR punching</li>
            <li>Client manager approvals</li>
            <li>Payroll export</li>
            <li>Agency dashboard</li>
          </ul>
        </div>
      </div>
    `
  };
}

async function sendInviteEmailMessage({ to, subject, html, text }) {
  if (!resendApiKey.value()) {
    throw createHttpError(503, "Email sending is not connected yet. Copy the invite link and send it manually.");
  }

  const resend = new Resend(resendApiKey.value());
  const payload = {
    from: inviteEmailFrom.value(),
    to: [to],
    subject,
    html,
    text
  };

  if (inviteEmailReplyTo.value()) {
    payload.replyTo = inviteEmailReplyTo.value();
  }

  const emailResult = await resend.emails.send(payload);
  console.log("Resend response", emailResult);
  logger.info("Resend response", emailResult || {});
  if (emailResult?.error) {
    throw createHttpError(502, emailResult.error.message || "Invite email sending failed.");
  }

  return emailResult;
}

function isGmailInviteConfigured() {
  return !!(gmailOauthClientId.value() && gmailOauthClientSecret.value() && gmailOauthRefreshToken.value());
}

function toBase64Url(value) {
  return Buffer.from(String(value || ""), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildEncodedMimeSubject(subject) {
  return `=?UTF-8?B?${Buffer.from(String(subject || ""), "utf8").toString("base64")}?=`;
}

function buildGmailInviteMimeMessage({ from, to, subject, text, html }) {
  const boundary = `portaly_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${buildEncodedMimeSubject(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary=\"${boundary}\"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=\"UTF-8\"",
    "Content-Transfer-Encoding: 7bit",
    "",
    String(text || ""),
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=\"UTF-8\"",
    "Content-Transfer-Encoding: 7bit",
    "",
    String(html || ""),
    "",
    `--${boundary}--`,
    ""
  ].join("\r\n");
}

async function getGmailInviteClient() {
  if (!isGmailInviteConfigured()) {
    throw createHttpError(503, "Gmail API is not configured yet. Open Email Draft or copy the invite link and send it manually.");
  }

  const oauth2Client = new google.auth.OAuth2(
    gmailOauthClientId.value(),
    gmailOauthClientSecret.value()
  );
  oauth2Client.setCredentials({
    refresh_token: gmailOauthRefreshToken.value()
  });

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
  });
  const profile = await gmail.users.getProfile({
    userId: "me"
  });
  const senderEmail = String(profile?.data?.emailAddress || "").trim();
  if (!senderEmail) {
    throw createHttpError(503, "Gmail sender account could not be resolved. Open Email Draft or copy the invite link and send it manually.");
  }

  return {
    gmail,
    senderEmail
  };
}

async function sendInviteEmailViaGmailMessage({ to, subject, html, text }) {
  const { gmail, senderEmail } = await getGmailInviteClient();
  const mimeMessage = buildGmailInviteMimeMessage({
    from: `Portaly <${senderEmail}>`,
    to,
    subject,
    text,
    html
  });
  const gmailResult = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: toBase64Url(mimeMessage)
    }
  });
  console.log("Gmail API response", gmailResult?.data || gmailResult);
  logger.info("Gmail API response", gmailResult?.data || {});

  return {
    id: String(gmailResult?.data?.id || "").trim(),
    threadId: String(gmailResult?.data?.threadId || "").trim()
  };
}

async function sendDemoAccessEmailMessage({ to, subject, html, text }) {
  if (isGmailInviteConfigured()) {
    const gmailResult = await sendInviteEmailViaGmailMessage({
      to,
      subject,
      html,
      text
    });
    return {
      provider: "gmail",
      providerMessageId: gmailResult.id || ""
    };
  }

  if (resendApiKey.value()) {
    const resendResult = await sendInviteEmailMessage({
      to,
      subject,
      html,
      text
    });
    return {
      provider: "resend",
      providerMessageId: String(resendResult?.data?.id || resendResult?.id || "").trim()
    };
  }

  throw createHttpError(503, "Demo access email sending is not connected yet.");
}

async function writeInviteAuditLog({ agencyId, action, entityId, actorId = "", actorRole = "system", oldValue = null, newValue = null, reason = "" }) {
  if (!agencyId || !action || !entityId) {
    return;
  }

  const createdAt = nowIso();
  await admin.firestore().collection("auditLogs").doc().set({
    agencyId,
    action,
    entityType: "clientInvites",
    entityId,
    userId: actorId,
    actorId,
    role: actorRole,
    actorRole,
    oldValue,
    newValue,
    reason,
    createdAt,
    timestamp: createdAt
  });
}

async function markInviteExpired(result) {
  if (!result || !result.invite) {
    return result;
  }

  const invite = result.invite;
  const expired = invite.tokenExpiresAt && new Date(invite.tokenExpiresAt) < new Date();
  if (!expired || invite.status === "expired") {
    return result;
  }

  const oldValue = { ...invite };
  const updatedInvite = {
    ...invite,
    status: "expired",
    updatedAt: nowIso()
  };

  await result.ref.set({
    status: "expired",
    updatedAt: updatedInvite.updatedAt
  }, { merge: true });

  await writeInviteAuditLog({
    agencyId: invite.agencyId,
    action: "invite_expired",
    entityId: invite.id,
    oldValue,
    newValue: updatedInvite,
    reason: "Invite link expired before acceptance."
  });

  return {
    ...result,
    invite: updatedInvite
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

function parseValidDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateKey(value) {
  const date = parseValidDate(value) || new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function getCurrentBillingPeriod(subscription = {}, agency = {}, anchor = new Date()) {
  const configuredStart = parseValidDate(subscription.currentPeriodStart || agency.currentPeriodStart);
  const configuredEnd = parseValidDate(subscription.currentPeriodEnd || subscription.nextBillingDate || agency.currentPeriodEnd || agency.nextBillingDate);
  if (configuredStart && configuredEnd && configuredEnd >= configuredStart) {
    return {
      start: configuredStart,
      end: configuredEnd
    };
  }

  const current = parseValidDate(anchor) || new Date();
  const start = new Date(current.getFullYear(), current.getMonth(), 1);
  const end = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function isDateInRange(value, start, end) {
  const date = parseValidDate(value);
  return !!date && date >= start && date <= end;
}

function dateRangeOverlaps(startValue, endValue, periodStart, periodEnd) {
  const start = parseValidDate(startValue) || periodStart;
  const end = parseValidDate(endValue) || periodEnd;
  return start <= periodEnd && end >= periodStart;
}

async function getAgencyRows(collectionName, agencyId) {
  const snapshot = await admin.firestore()
    .collection(collectionName)
    .where("agencyId", "==", agencyId)
    .get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

function buildWorkerBillingMetricsFromRows({ agency, subscription, punches, timesheets, approvals, assignments, anchor = new Date() }) {
  const agencyId = agency.id;
  const plan = getWorkerBillingPlan(subscription.planId || agency.planId);
  const period = getCurrentBillingPeriod(subscription, agency, anchor);
  const activeWorkerIds = new Set();
  const activeReasons = {};
  const addWorkerActivity = (workerId, reason) => {
    const normalizedWorkerId = String(workerId || "").trim();
    if (!normalizedWorkerId) {
      return;
    }
    activeWorkerIds.add(normalizedWorkerId);
    activeReasons[normalizedWorkerId] = [...new Set([...(activeReasons[normalizedWorkerId] || []), reason])];
  };

  (punches || [])
    .filter(punch => isDateInRange(punch.timestamp || punch.createdAt, period.start, period.end))
    .forEach(punch => addWorkerActivity(punch.workerId, "punch"));

  (timesheets || [])
    .filter(timesheet => String(timesheet.status || "").toLowerCase() === "approved")
    .filter(timesheet => {
      if (timesheet.payPeriodStart || timesheet.payPeriodEnd) {
        return dateRangeOverlaps(timesheet.payPeriodStart, timesheet.payPeriodEnd, period.start, period.end);
      }
      return isDateInRange(timesheet.approvedAt || timesheet.updatedAt || timesheet.createdAt, period.start, period.end);
    })
    .forEach(timesheet => addWorkerActivity(timesheet.workerId, "approved_timesheet"));

  (approvals || [])
    .filter(approval => String(approval.status || "").toLowerCase() === "approved")
    .filter(approval => isDateInRange(approval.reviewedAt || approval.signedAt || approval.updatedAt || approval.createdAt || approval.submittedAt, period.start, period.end))
    .forEach(approval => addWorkerActivity(approval.workerId, "approved_timesheet"));

  (assignments || [])
    .filter(assignment => {
      const status = String(assignment.status || "").toLowerCase();
      if (status === "inactive" && !assignment.endDate) {
        return false;
      }
      return dateRangeOverlaps(assignment.startDate || assignment.createdAt, assignment.endDate, period.start, period.end);
    })
    .forEach(assignment => addWorkerActivity(assignment.workerId, "assignment"));

  const activeWorkerCount = activeWorkerIds.size;
  const includedWorkerCount = plan.includedWorkers === null ? activeWorkerCount : Number(plan.includedWorkers || 0);
  const additionalWorkerCount = plan.includedWorkers === null ? 0 : Math.max(activeWorkerCount - includedWorkerCount, 0);
  const baseMonthlyPrice = plan.baseMonthlyPrice === null ? null : Number(plan.baseMonthlyPrice || 0);
  const additionalWorkerPrice = plan.additionalWorkerPrice === null ? null : Number(plan.additionalWorkerPrice || 0);
  const estimatedMonthlyCharge = baseMonthlyPrice === null ? null : baseMonthlyPrice + (additionalWorkerCount * additionalWorkerPrice);
  const periodStart = period.start.toISOString();
  const periodEnd = period.end.toISOString();

  return {
    id: `billingMetrics_${agencyId}_${formatDateKey(period.start)}`,
    agencyId,
    planId: plan.id,
    planName: plan.label,
    billingProvider: "square",
    billingPeriodStart: periodStart,
    billingPeriodEnd: periodEnd,
    activeWorkerCount,
    includedWorkerCount,
    additionalWorkerCount,
    baseMonthlyPrice,
    additionalWorkerPrice,
    estimatedMonthlyCharge,
    currency: "USD",
    activeWorkerIds: Array.from(activeWorkerIds).sort(),
    activeWorkerReasons: activeReasons,
    calculationVersion: "worker-billing-v1",
    squareReady: {
      subscriptionId: subscription.squareSubscriptionId || agency.squareSubscriptionId || "",
      planId: plan.id,
      billingMode: "base_subscription_plus_active_worker_overage",
      activeWorkerQuantity: activeWorkerCount,
      includedWorkerQuantity: includedWorkerCount,
      additionalWorkerQuantity: additionalWorkerCount,
      meteredComponentKey: "active_worker_overage"
    },
    calculatedAt: nowIso()
  };
}

async function calculateAndStoreWorkerBillingMetrics(agencyId) {
  const { agency } = await getAgencyRefAndData(agencyId);
  const { subscription } = await getSubscriptionRefAndData(agencyId);
  const [punches, timesheets, approvals, assignments] = await Promise.all([
    getAgencyRows("punches", agencyId),
    getAgencyRows("timesheets", agencyId),
    getAgencyRows("approvals", agencyId),
    getAgencyRows("assignments", agencyId)
  ]);
  const metrics = buildWorkerBillingMetricsFromRows({
    agency,
    subscription,
    punches,
    timesheets,
    approvals,
    assignments
  });

  await admin.firestore().collection("billingMetrics").doc(metrics.id).set({
    ...metrics,
    createdAt: metrics.calculatedAt,
    updatedAt: metrics.calculatedAt
  }, { merge: true });

  return metrics;
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
  const resolvedPlanId = requestedPlanId || planIdFromVariation(subscription.plan_variation_id) || "";
  const planId = resolvedPlanId ? normalizePlanId(resolvedPlanId) : "";
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

function normalizeNameForLookup(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizePinCode(value) {
  return String(value || "").trim();
}

async function writeAuditLogEntry({ agencyId = "", action, entityType, entityId, oldValue = null, newValue = null, metadata = {}, role = "worker", userId = "", source = "portalyPublicPunch" }) {
  const auditRef = admin.firestore().collection("auditLogs").doc();
  await auditRef.set({
    id: auditRef.id,
    agencyId,
    userId,
    role,
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
    metadata,
    source,
    timestamp: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso()
  });
}

async function getPublicPunchContextRecord({ agencyId, clientId, siteId }) {
  const [agencySnap, clientSnap, siteSnap, directorySnap] = await Promise.all([
    admin.firestore().collection("agencies").doc(agencyId).get(),
    admin.firestore().collection("clients").doc(clientId).get(),
    admin.firestore().collection("sites").doc(siteId).get(),
    admin.firestore().collection("sitePunchDirectories").doc(siteId).get()
  ]);

  if (!agencySnap.exists) {
    throw createHttpError(404, "Agency not found for this punch station.");
  }
  if (!clientSnap.exists || clientSnap.data().agencyId !== agencyId || clientSnap.data().status === "inactive") {
    throw createHttpError(404, "Client not found for this punch station.");
  }
  if (!siteSnap.exists || siteSnap.data().agencyId !== agencyId || siteSnap.data().clientId !== clientId || siteSnap.data().status === "inactive") {
    throw createHttpError(404, "Site not found for this punch station.");
  }
  if (directorySnap.exists) {
    const directory = directorySnap.data() || {};
    if (directory.qrEnabled === false || String(directory.status || "active").toLowerCase() === "inactive") {
      throw createHttpError(403, "This punch station is not active.");
    }
  }

  return {
    agency: { id: agencySnap.id, ...agencySnap.data() },
    client: { id: clientSnap.id, ...clientSnap.data() },
    site: { id: siteSnap.id, ...siteSnap.data() }
  };
}

async function resolvePublicWorker({ agencyId, siteId, workerId, workerName }) {
  const workersSnapshot = await admin.firestore()
    .collection("workers")
    .where("agencyId", "==", agencyId)
    .get();
  const allWorkers = workersSnapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
  const assignmentsSnapshot = await admin.firestore()
    .collection("assignments")
    .where("agencyId", "==", agencyId)
    .get();
  const assignments = assignmentsSnapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
  const normalizedName = normalizeNameForLookup(workerName);

  let worker = workerId
    ? allWorkers.find(item => item.id === workerId) || null
    : allWorkers.find(item => normalizeNameForLookup(`${item.firstName || ""} ${item.lastName || ""}`) === normalizedName) || null;

  if (!worker) {
    throw createHttpError(404, "Worker could not be found for this site.");
  }
  if (worker.status === "inactive") {
    throw createHttpError(403, "This worker is inactive.");
  }

  const activeAssignment = assignments.find(assignment => assignment.workerId === worker.id && assignment.siteId === siteId && !["inactive", "ended"].includes(String(assignment.status || "").toLowerCase())) || null;
  const allowedOnSite = worker.assignedSiteId === siteId || worker.allowCrossSitePunching === true || !!activeAssignment;
  if (!allowedOnSite) {
    throw createHttpError(403, "This worker is not assigned to the selected site.");
  }

  return {
    worker,
    assignment: activeAssignment
  };
}

function validateWorkerPin(worker, pinCode) {
  const normalizedPin = normalizePinCode(pinCode);
  if (!/^\d{4}$/.test(normalizedPin)) {
    throw createHttpError(400, "A valid 4-digit PIN is required.");
  }
  const workerPin = normalizePinCode(worker.pinCode || worker.pin || "");
  if (!workerPin || workerPin !== normalizedPin) {
    throw createHttpError(403, "The worker PIN did not match.");
  }
}

async function getWorkerRecentPunches(workerId) {
  const snapshot = await admin.firestore()
    .collection("punches")
    .where("workerId", "==", workerId)
    .get();
  return snapshot.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((left, right) => new Date(left.timestamp || 0) - new Date(right.timestamp || 0));
}

function validatePunchSequence(punches, action, timestamp) {
  const recentPunches = (punches || []).filter(Boolean);
  const lastPunch = recentPunches[recentPunches.length - 1] || null;
  const duplicatePunch = recentPunches.find(punch => punch.action === action && Math.abs(new Date(timestamp) - new Date(punch.timestamp || 0)) <= DUPLICATE_PUNCH_WINDOW_MS);
  if (duplicatePunch) {
    throw createHttpError(409, "That punch looks like a duplicate.");
  }

  if (action === "startLunch" && (!lastPunch || lastPunch.action !== "clockIn" && lastPunch.action !== "endLunch")) {
    throw createHttpError(409, "Cannot start lunch before clocking in.");
  }
  if (action === "endLunch" && (!lastPunch || lastPunch.action !== "startLunch")) {
    throw createHttpError(409, "Cannot end lunch before lunch starts.");
  }
  if (action === "clockOut" && (!lastPunch || !["clockIn", "endLunch"].includes(lastPunch.action))) {
    throw createHttpError(409, "Cannot clock out before clocking in.");
  }
  if (action === "clockIn" && lastPunch && ["clockIn", "endLunch"].includes(lastPunch.action)) {
    throw createHttpError(409, "This worker is already clocked in.");
  }
}

function filterWorkerWeekPunches(punches, { agencyId, clientId, siteId, anchor = new Date() }) {
  const weekStart = startOfWeek(anchor);
  const weekEnd = endOfWeek(anchor);
  return {
    weekStart,
    weekEnd,
    punches: (punches || [])
      .filter(punch => !agencyId || punch.agencyId === agencyId)
      .filter(punch => !clientId || (punch.clientId || punch.companyId || "") === clientId)
      .filter(punch => !siteId || punch.siteId === siteId)
      .filter(punch => {
        const punchAt = new Date(punch.timestamp || "");
        return !Number.isNaN(punchAt.getTime()) && punchAt >= weekStart && punchAt <= weekEnd;
      })
      .sort((left, right) => new Date(left.timestamp || 0) - new Date(right.timestamp || 0))
  };
}

exports.createWorkerSitePunch = onRequest(
  {
    cors: inviteCorsOrigins
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const agencyId = String(req.body.agencyId || "").trim();
      const clientId = String(req.body.clientId || req.body.companyId || "").trim();
      const siteId = String(req.body.siteId || "").trim();
      const workerId = String(req.body.workerId || "").trim();
      const workerName = String(req.body.workerName || "").trim();
      const pinCode = String(req.body.pinCode || "").trim();
      const action = String(req.body.action || "").trim();
      const timestamp = String(req.body.timestamp || nowIso()).trim();
      const allowedActions = new Set(["clockIn", "startLunch", "endLunch", "clockOut"]);

      if (!agencyId || !clientId || !siteId || !workerName || !action) {
        throw createHttpError(400, "Agency, client, site, worker name, and punch action are required.");
      }
      if (!allowedActions.has(action)) {
        throw createHttpError(400, "Invalid worker punch action.");
      }

      const context = await getPublicPunchContextRecord({ agencyId, clientId, siteId });
      const { worker, assignment } = await resolvePublicWorker({ agencyId, siteId, workerId, workerName });
      validateWorkerPin(worker, pinCode);
      const recentPunches = await getWorkerRecentPunches(worker.id);
      validatePunchSequence(recentPunches, action, timestamp);

      const punchId = String(req.body.id || "").trim() || admin.firestore().collection("punches").doc().id;
      const punchRecord = {
        id: punchId,
        agencyId,
        companyId: clientId,
        companyName: context.client.name || "",
        clientId,
        clientName: context.client.name || "",
        siteId,
        siteName: context.site.name || "",
        workerId: worker.id,
        workerName: `${worker.firstName || ""} ${worker.lastName || ""}`.trim() || workerName,
        workerMatched: true,
        assignmentId: assignment?.id || "",
        action,
        timestamp,
        localDate: String(req.body.localDate || "").trim() || timestamp.slice(0, 10),
        source: "publicPunchPage",
        createdAt: String(req.body.createdAt || "").trim() || nowIso(),
        updatedAt: String(req.body.createdAt || "").trim() || nowIso(),
        createdBy: "worker-public",
        createdByRole: "worker",
        status: "active",
        deviceInfo: String(req.body.deviceInfo || "").slice(0, 500)
      };

      await admin.firestore().collection("punches").doc(punchId).set(punchRecord, { merge: false });
      await writeAuditLogEntry({
        agencyId,
        action: "punch_created",
        entityType: "punches",
        entityId: punchId,
        newValue: punchRecord,
        metadata: {
          workerId: worker.id,
          siteId,
          source: "publicPunchPage"
        }
      });

      responseJson(res, 200, {
        ok: true,
        punch: punchRecord
      });
    } catch (error) {
      logger.error("createWorkerSitePunch failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to save the worker punch."
      });
    }
  }
);

exports.createWorkerCorrectionRequest = onRequest(
  {
    cors: inviteCorsOrigins
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const agencyId = String(req.body.agencyId || "").trim();
      const clientId = String(req.body.clientId || req.body.companyId || "").trim();
      const siteId = String(req.body.siteId || "").trim();
      const workerId = String(req.body.workerId || "").trim();
      const workerName = String(req.body.workerName || "").trim();
      const pinCode = String(req.body.pinCode || "").trim();
      const requestedAction = String(req.body.requestedAction || "").trim();
      const requestedTimestamp = String(req.body.requestedTimestamp || "").trim();
      const reason = String(req.body.reason || req.body.note || "").trim();
      const allowedActions = new Set(["clockIn", "startLunch", "endLunch", "clockOut"]);

      if (!agencyId || !clientId || !siteId || !workerName || !requestedAction || !requestedTimestamp || !reason) {
        throw createHttpError(400, "Agency, client, site, worker, requested punch, time, and reason are required.");
      }
      if (!allowedActions.has(requestedAction)) {
        throw createHttpError(400, "Invalid correction request action.");
      }

      const context = await getPublicPunchContextRecord({ agencyId, clientId, siteId });
      const { worker } = await resolvePublicWorker({ agencyId, siteId, workerId, workerName });
      validateWorkerPin(worker, pinCode);

      const requestId = String(req.body.id || "").trim() || admin.firestore().collection("correctionRequests").doc().id;
      const requestRecord = {
        id: requestId,
        agencyId,
        companyId: clientId,
        companyName: context.client.name || "",
        clientId,
        clientName: context.client.name || "",
        siteId,
        siteName: context.site.name || "",
        workerId: worker.id,
        workerName: `${worker.firstName || ""} ${worker.lastName || ""}`.trim() || workerName,
        workerMatched: true,
        requestedAction,
        requestedTimestamp,
        requestedLocalDate: String(req.body.requestedLocalDate || "").trim() || requestedTimestamp.slice(0, 10),
        reason,
        note: String(req.body.note || "").trim(),
        status: "pending",
        source: "publicPunchPage",
        createdAt: String(req.body.createdAt || "").trim() || nowIso(),
        updatedAt: String(req.body.updatedAt || "").trim() || nowIso(),
        deviceInfo: String(req.body.deviceInfo || "").slice(0, 500),
        createdBy: "worker-public",
        createdByRole: "worker"
      };

      await admin.firestore().collection("correctionRequests").doc(requestId).set(requestRecord, { merge: false });
      await writeAuditLogEntry({
        agencyId,
        action: "correction_requested",
        entityType: "correctionRequests",
        entityId: requestId,
        newValue: requestRecord,
        metadata: {
          workerId: worker.id,
          siteId,
          source: "publicPunchPage"
        }
      });

      responseJson(res, 200, {
        ok: true,
        correctionRequest: requestRecord
      });
    } catch (error) {
      logger.error("createWorkerCorrectionRequest failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to save the worker correction request."
      });
    }
  }
);

exports.getWorkerPublicTimeSnapshot = onRequest(
  {
    cors: inviteCorsOrigins
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const agencyId = String(req.body.agencyId || "").trim();
      const clientId = String(req.body.clientId || req.body.companyId || "").trim();
      const siteId = String(req.body.siteId || "").trim();
      const workerId = String(req.body.workerId || "").trim();
      const workerName = String(req.body.workerName || "").trim();
      const pinCode = String(req.body.pinCode || "").trim();

      if (!agencyId || !clientId || !siteId || !workerName) {
        throw createHttpError(400, "Agency, client, site, and worker name are required.");
      }

      await getPublicPunchContextRecord({ agencyId, clientId, siteId });
      const { worker } = await resolvePublicWorker({ agencyId, siteId, workerId, workerName });
      validateWorkerPin(worker, pinCode);

      const recentPunches = await getWorkerRecentPunches(worker.id);
      const weekSnapshot = filterWorkerWeekPunches(recentPunches, {
        agencyId,
        clientId,
        siteId
      });

      responseJson(res, 200, {
        ok: true,
        workerId: worker.id,
        workerName: `${worker.firstName || ""} ${worker.lastName || ""}`.trim() || workerName,
        weekStart: weekSnapshot.weekStart.toISOString(),
        weekEnd: weekSnapshot.weekEnd.toISOString(),
        punches: weekSnapshot.punches
      });
    } catch (error) {
      logger.error("getWorkerPublicTimeSnapshot failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to load the worker time snapshot."
      });
    }
  }
);

exports.createClientManagerInvite = onRequest(
  {
    cors: inviteCorsOrigins
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
        .find(item => item.data.agencyId === agencyId && isPublicInviteStatus(item.data.status));

      const reusablePendingInvite = existingPendingInvite
        && existingPendingInvite.ref.id === existingPendingInvite.data.inviteToken
        ? existingPendingInvite
        : null;
      const inviteToken = reusablePendingInvite ? reusablePendingInvite.ref.id : createInviteToken();
      const inviteRef = reusablePendingInvite ? reusablePendingInvite.ref : inviteCollection.doc(inviteToken);
      const createdAt = reusablePendingInvite
        ? (reusablePendingInvite.data.createdAt || nowIso())
        : nowIso();
      const tokenExpiresAt = new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString();
      const inviteLink = buildHashUrl(`accept-invite/${inviteToken}`);

      const inviteRecord = {
        id: inviteToken,
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
        openedAt: reusablePendingInvite?.data?.openedAt || "",
        lastOpenedAt: reusablePendingInvite?.data?.lastOpenedAt || "",
        openedCount: Number(reusablePendingInvite?.data?.openedCount || 0),
        acceptedAt: "",
        acceptedBy: "",
        createdAt,
        updatedAt: nowIso(),
        createdBy: auth.uid,
        inviteLink,
        authAccountExists: false,
        emailStatus: "pending",
        emailProvider: "gmail",
        providerMessageId: "",
        resendEmailId: "",
        emailLastError: ""
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

exports.sendClientManagerInviteEmail = onRequest(
  {
    cors: inviteCorsOrigins,
    secrets: [resendApiKey]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!canInviteClientManagers(auth.profile)) {
        throw createHttpError(403, "Only agency leadership can send client manager invites.");
      }

      const inviteId = String(req.body.inviteId || "").trim();
      const inviteToken = String(req.body.inviteToken || "").trim();
      const requestedAgencyId = String(req.body.agencyId || "").trim();
      if (!inviteToken && !inviteId) {
        throw createHttpError(400, "Invite details are required.");
      }

      const agencyId = resolveAgencyId(auth.profile, requestedAgencyId);
      const result = await markInviteExpired(await getInviteByIdOrToken(inviteId, inviteToken));
      if (!result) {
        throw createHttpError(404, "This client manager invite could not be found.");
      }

      const invite = result.invite;
      if (invite.agencyId !== agencyId) {
        throw createHttpError(403, "This invite does not belong to your agency.");
      }
      if (!isPublicInviteStatus(invite.status)) {
        throw createHttpError(409, "Only active client manager invites can be emailed.");
      }

      const scopedInvite = await resolveClientInviteScope(invite);
      const email = String(req.body.email || invite.email || "").trim().toLowerCase();
      if (!email || email !== String(invite.email || "").trim().toLowerCase()) {
        throw createHttpError(400, "Invite email does not match the stored client manager invite.");
      }

      const { agency } = await getAgencyRefAndData(agencyId);
      const inviteUrl = String(req.body.inviteUrl || scopedInvite.inviteLink || buildHashUrl(`accept-invite/${invite.inviteToken}`)).trim();
      const emailContent = buildClientInviteEmailContent({
        firstName: invite.firstName || req.body.firstName || "",
        agencyName: agency.name || scopedInvite.agencyName || "Portaly Agency",
        inviteUrl,
        assignedClientNames: scopedInvite.assignedClientNames || [],
        assignedSiteNames: scopedInvite.assignedSiteNames || []
      });

      let emailResult;
      try {
        emailResult = await sendInviteEmailMessage({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        });
      } catch (error) {
        const failedAt = nowIso();
        await result.ref.set({
          emailSentAt: "",
          emailSentBy: auth.uid,
          emailStatus: "failed",
          emailProvider: "resend",
          emailLastError: error.message || "Invite email sending failed.",
          updatedAt: failedAt
        }, { merge: true });
        throw error;
      }

      const resendEmailId = String(emailResult?.data?.id || emailResult?.id || "").trim();

      const emailSentAt = nowIso();
      const nextStatus = nextInviteStatusAfterEmail(invite.status);
      await result.ref.set({
        status: nextStatus,
        emailSentAt,
        emailSentBy: auth.uid,
        emailStatus: "sent",
        emailProvider: "resend",
        resendEmailId,
        emailLastError: "",
        updatedAt: emailSentAt
      }, { merge: true });

      const updatedInvite = {
        ...scopedInvite,
        inviteLink: inviteUrl,
        status: nextStatus,
        emailSentAt,
        emailSentBy: auth.uid,
        emailStatus: "sent",
        emailProvider: "resend",
        resendEmailId,
        emailLastError: "",
        updatedAt: emailSentAt
      };

      responseJson(res, 200, {
        ok: true,
        invite: updatedInvite
      });
    } catch (error) {
      logger.error("sendClientManagerInviteEmail failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to send the client manager invite email."
      });
    }
  }
);

exports.sendClientManagerInviteEmailViaGmail = onRequest(
  {
    cors: inviteCorsOrigins,
    secrets: [gmailOauthClientId, gmailOauthClientSecret, gmailOauthRefreshToken]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      const auth = await authenticateRequest(req);
      if (!canInviteClientManagers(auth.profile)) {
        throw createHttpError(403, "Only agency leadership can send client manager invites.");
      }

      const inviteId = String(req.body.inviteId || "").trim();
      const inviteToken = String(req.body.inviteToken || "").trim();
      const requestedAgencyId = String(req.body.agencyId || "").trim();
      if (!inviteToken && !inviteId) {
        throw createHttpError(400, "Invite details are required.");
      }

      const agencyId = resolveAgencyId(auth.profile, requestedAgencyId);
      const result = await markInviteExpired(await getInviteByIdOrToken(inviteId, inviteToken));
      if (!result) {
        throw createHttpError(404, "This client manager invite could not be found.");
      }

      const invite = result.invite;
      if (invite.agencyId !== agencyId) {
        throw createHttpError(403, "This invite does not belong to your agency.");
      }
      if (!isPublicInviteStatus(invite.status)) {
        throw createHttpError(409, "Only active client manager invites can be emailed.");
      }

      const scopedInvite = await resolveClientInviteScope(invite);
      const email = String(req.body.email || invite.email || "").trim().toLowerCase();
      if (!email || email !== String(invite.email || "").trim().toLowerCase()) {
        throw createHttpError(400, "Invite email does not match the stored client manager invite.");
      }

      const { agency } = await getAgencyRefAndData(agencyId);
      const inviteUrl = String(req.body.inviteUrl || scopedInvite.inviteLink || buildHashUrl(`accept-invite/${invite.inviteToken}`)).trim();
      const emailContent = buildClientInviteEmailContent({
        firstName: invite.firstName || req.body.firstName || "",
        agencyName: agency.name || scopedInvite.agencyName || "Portaly Agency",
        inviteUrl,
        assignedClientNames: scopedInvite.assignedClientNames || [],
        assignedSiteNames: scopedInvite.assignedSiteNames || []
      });

      let gmailResult;
      try {
        gmailResult = await sendInviteEmailViaGmailMessage({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        });
      } catch (error) {
        const failedAt = nowIso();
        await result.ref.set({
          emailSentAt: "",
          emailSentBy: auth.uid,
          emailStatus: "failed",
          emailProvider: "gmail",
          providerMessageId: "",
          emailLastError: error.message || "Invite email sending failed.",
          updatedAt: failedAt
        }, { merge: true });
        throw error;
      }

      const emailSentAt = nowIso();
      const nextStatus = nextInviteStatusAfterEmail(invite.status);
      await result.ref.set({
        status: nextStatus,
        emailSentAt,
        emailSentBy: auth.uid,
        emailStatus: "sent",
        emailProvider: "gmail",
        providerMessageId: gmailResult.id || "",
        emailLastError: "",
        updatedAt: emailSentAt
      }, { merge: true });

      const updatedInvite = {
        ...scopedInvite,
        inviteLink: inviteUrl,
        status: nextStatus,
        emailSentAt,
        emailSentBy: auth.uid,
        emailStatus: "sent",
        emailProvider: "gmail",
        providerMessageId: gmailResult.id || "",
        emailLastError: "",
        updatedAt: emailSentAt
      };

      responseJson(res, 200, {
        ok: true,
        invite: updatedInvite
      });
    } catch (error) {
      logger.error("sendClientManagerInviteEmailViaGmail failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to send the client manager invite email through Gmail."
      });
    }
  }
);

exports.sendDemoAccessEmail = onRequest(
  {
    cors: inviteCorsOrigins,
    secrets: [resendApiKey, gmailOauthClientId, gmailOauthClientSecret, gmailOauthRefreshToken]
  },
  async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const companyName = String(req.body?.companyName || "").trim();
    const createdAt = nowIso();
    const demoRequestRef = admin.firestore().collection("demoRequests").doc();

    try {
      if (req.method !== "POST") {
        responseJson(res, 405, { error: "Use POST for this endpoint." });
        return;
      }

      if (!isValidEmailAddress(email)) {
        throw createHttpError(400, "Enter a valid email address to receive demo access.");
      }

      const emailContent = buildDemoAccessEmailContent();
      let delivery;

      try {
        delivery = await sendDemoAccessEmailMessage({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        });
      } catch (error) {
        await demoRequestRef.set({
          id: demoRequestRef.id,
          email,
          companyName,
          createdAt,
          updatedAt: nowIso(),
          status: "failed",
          source: "Portaly demo form",
          emailProvider: error?.message?.toLowerCase().includes("gmail") ? "gmail" : (resendApiKey.value() ? "resend" : ""),
          emailLastError: error.message || "Demo email sending failed."
        }, { merge: true });
        throw error;
      }

      const emailSentAt = nowIso();
      await demoRequestRef.set({
        id: demoRequestRef.id,
        email,
        companyName,
        createdAt,
        updatedAt: emailSentAt,
        status: "sent",
        source: "Portaly demo form",
        emailProvider: delivery.provider,
        providerMessageId: delivery.providerMessageId || "",
        emailLastError: "",
        emailSentAt
      }, { merge: true });

      responseJson(res, 200, {
        ok: true,
        requestId: demoRequestRef.id,
        status: "sent"
      });
    } catch (error) {
      logger.error("sendDemoAccessEmail failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to send demo access right now."
      });
    }
  }
);

exports.verifyClientManagerInvite = onRequest(
  {
    cors: inviteCorsOrigins
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

      const result = await markInviteExpired(await getInviteByToken(inviteToken));
      if (!result) {
        throw createHttpError(404, "This Portaly invite could not be found.");
      }

      const invite = result.invite;
      if (invite.status === "revoked") {
        throw createHttpError(410, "This invite is no longer active. Ask the agency to send a new client manager invite.");
      }

      let verifiedInvite = invite;
      if (isPublicInviteStatus(invite.status)) {
        const openedAt = invite.openedAt || nowIso();
        const lastOpenedAt = nowIso();
        const openedCount = Math.max(1, Number(invite.openedCount || 0) + 1);
        verifiedInvite = {
          ...invite,
          status: "opened",
          openedAt,
          lastOpenedAt,
          openedCount,
          updatedAt: lastOpenedAt
        };
        await result.ref.set({
          status: "opened",
          openedAt,
          lastOpenedAt,
          openedCount,
          updatedAt: lastOpenedAt
        }, { merge: true });
        await writeInviteAuditLog({
          agencyId: invite.agencyId,
          action: "invite_opened",
          entityId: invite.id,
          newValue: {
            status: "opened",
            openedAt,
            lastOpenedAt,
            openedCount
          }
        });
      }

      responseJson(res, 200, {
        ok: true,
        invite: await resolveClientInviteScope(verifiedInvite)
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
    cors: inviteCorsOrigins
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

      const result = await markInviteExpired(await getInviteByToken(inviteToken));
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
      if (invite.status === "revoked") {
        throw createHttpError(410, "This invite is no longer active. Ask the agency to send a new client manager invite.");
      }
      if (invite.status === "expired" || (invite.tokenExpiresAt && new Date(invite.tokenExpiresAt) < new Date())) {
        throw createHttpError(410, "This invite has expired. Ask the agency to send a new invite.");
      }
      if (!isPublicInviteStatus(invite.status) && invite.status !== "accepted") {
        throw createHttpError(409, "This invite is no longer pending. Ask the agency to send a fresh invite.");
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

      const acceptedAt = nowIso();
      const acceptedInvite = {
        ...invite,
        status: "accepted",
        acceptedAt,
        acceptedBy: decoded.uid,
        authAccountExists: true,
        updatedAt: acceptedAt
      };

      await userRef.set(userProfile, { merge: true });
      await result.ref.set({
        status: "accepted",
        acceptedAt,
        acceptedBy: decoded.uid,
        authAccountExists: true,
        updatedAt: acceptedAt
      }, { merge: true });
      await writeInviteAuditLog({
        agencyId: invite.agencyId,
        action: "invite_accepted",
        entityId: invite.id,
        actorId: decoded.uid,
        actorRole: "clientManager",
        oldValue: invite,
        newValue: acceptedInvite
      });

      responseJson(res, 200, {
        ok: true,
        invite: await resolveClientInviteScope(acceptedInvite),
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

      const requestedPlanId = String(req.body.planId || "").trim();
      const planId = normalizePlanId(requestedPlanId);
      const link = paymentLinkForPlan(planId);
      if (!requestedPlanId || !link) {
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
      const requestedNewPlanId = String(req.body.newPlanId || "").trim();
      const newPlanId = normalizePlanId(requestedNewPlanId);
      if (!subscriptionId || !requestedNewPlanId) {
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

exports.syncWorkerBillingMetrics = onRequest(
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
      if (!canViewBilling(auth.profile)) {
        throw createHttpError(403, "Only agency leadership can update billing metrics.");
      }

      const agencyId = resolveAgencyId(auth.profile, req.body.agencyId);
      const metrics = await calculateAndStoreWorkerBillingMetrics(agencyId);
      responseJson(res, 200, {
        ok: true,
        metrics
      });
    } catch (error) {
      logger.error("syncWorkerBillingMetrics failed", error);
      responseJson(res, error.status || 500, {
        error: error.message || "Unable to update worker billing metrics."
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
