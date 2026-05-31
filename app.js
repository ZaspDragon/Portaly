(() => {
  "use strict";

  const COLLECTIONS = [
    "agencies",
    "users",
    "clientInvites",
    "clients",
    "sites",
    "workers",
    "assignments",
    "punches",
    "punchRequests",
    "timesheets",
    "approvals",
    "payrollRuns",
    "subscriptions",
    "auditLogs",
    "settings"
  ];

  const SAMPLE_DATA_COLLECTIONS = [
    "clients",
    "sites",
    "workers",
    "assignments",
    "punches",
    "punchRequests",
    "timesheets",
    "approvals",
    "payrollRuns",
    "auditLogs"
  ];

  const STORAGE_KEYS = {
    demo: "portaly_demo_store_v6",
    session: "portaly_session_v6",
    routeNotice: "portaly_route_notice_v6",
    pendingInvite: "portaly_pending_invite_v1",
    offlinePunchQueue: "portaly_offline_punch_queue_v1"
  };

  const DEFAULT_BRAND = "#1f6fff";
  const DEFAULT_SUPPORT_EMAIL = "support@portaly-demo.com";
  const DEFAULT_SUPPORT_PHONE = "(800) 555-0199";
  const BILLING_LOCK_STATUSES = new Set(["past_due", "unpaid", "expired_trial", "canceled"]);
  const PUBLIC_ROUTES = new Set(["landing", "pricing", "demo", "login", "trial", "trial-success", "billing-required", "forgot-password", "trial-expired", "approval-link", "complete-profile", "accept-invite", "punch", "clock"]);
  const WORKER_ROUTES = new Set(["worker-punch", "my-history", "help", "billing-required"]);
  const CLIENT_ROUTES = new Set(["approvals", "client-approval", "help", "billing-required"]);
  const AGENCY_SCOPED_COLLECTIONS = new Set([
    "clients",
    "sites",
    "workers",
    "assignments",
    "punches",
    "punchRequests",
    "approvals",
    "timesheets",
    "payrollRuns",
    "auditLogs"
  ]);
  const DEFAULT_APP_URL = `${window.location.origin}${window.location.pathname}`;
  const BILLING_CONFIG = window.PORTALY_BILLING_CONFIG || {};

  const ROLE_META = {
    platformOwner: {
      label: "Platform Owner",
      home: "dashboard",
      badge: "PO"
    },
    agencyOwner: {
      label: "Agency Owner",
      home: "dashboard",
      badge: "AO"
    },
    agencyAdmin: {
      label: "Agency Admin",
      home: "dashboard",
      badge: "AA"
    },
    clientManager: {
      label: "Client Manager",
      home: "approvals",
      badge: "CM"
    },
    worker: {
      label: "Worker",
      home: "worker-punch",
      badge: "WK"
    }
  };

  const PLAN_DEFINITIONS = {
    starter: {
      id: "starter",
      name: "Starter",
      label: "Starter",
      price: 99,
      workerLimit: 25,
      siteLimit: 1,
      squarePaymentLink: BILLING_CONFIG.starterPaymentLink || "https://square.link/u/mfu6eun7",
      features: ["QR punches", "Basic payroll export", "Up to 25 workers", "1 client site"]
    },
    agency: {
      id: "agency",
      name: "Agency",
      label: "Agency",
      price: 249,
      workerLimit: 100,
      siteLimit: 5,
      squarePaymentLink: BILLING_CONFIG.agencyPaymentLink || "https://square.link/u/ojz2a1Au",
      features: ["Client approvals", "Payroll exports", "Exception alerts", "Up to 100 workers"]
    },
    growth: {
      id: "growth",
      name: "Growth",
      label: "Growth",
      price: 499,
      workerLimit: null,
      siteLimit: null,
      squarePaymentLink: BILLING_CONFIG.growthPaymentLink || "https://square.link/u/Iy99LyYg",
      features: ["Unlimited workers", "Unlimited clients and sites", "White-label branding", "Advanced reports"]
    },
    enterprise: {
      id: "enterprise",
      name: "Enterprise",
      label: "Enterprise",
      price: null,
      workerLimit: null,
      siteLimit: null,
      squarePaymentLink: BILLING_CONFIG.enterprisePaymentLink || "https://square.link/u/96br6x5W",
      features: ["Multi-branch agencies", "Custom integrations", "Dedicated onboarding", "Contact sales"]
    }
  };

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", badge: "DB", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "agencies", label: "Agencies", badge: "AG", roles: ["platformOwner"] },
    { id: "workers", label: "Workers", badge: "WK", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "clients", label: "Clients", badge: "CL", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "sites", label: "Sites", badge: "ST", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "assignments", label: "Assignments", badge: "AS", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "live-punches", label: "Live Punches", badge: "LP", roles: ["platformOwner", "agencyOwner", "agencyAdmin", "clientManager"] },
    { id: "approvals", label: "Approvals", badge: "AP", roles: ["platformOwner", "agencyOwner", "agencyAdmin", "clientManager"] },
    { id: "payroll", label: "Payroll", badge: "PY", roles: ["agencyOwner", "agencyAdmin"] },
    { id: "margin", label: "Margin", badge: "MR", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "exceptions", label: "Problems to Fix", badge: "PF", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "qr-codes", label: "Site QR", badge: "QR", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "users", label: "Users", badge: "US", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "billing", label: "Billing", badge: "BL", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "settings", label: "Settings", badge: "SE", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] }
  ];

  const PUNCH_LABELS = {
    clockIn: "Clock In",
    startLunch: "Start Lunch",
    endLunch: "End Lunch",
    clockOut: "Clock Out"
  };

  const PUNCH_STATUS_LABELS = {
    clockIn: "Clocked In",
    startLunch: "On Lunch",
    endLunch: "Clocked In",
    clockOut: "Clocked Out"
  };

  const PUBLIC_INVITE_STATUSES = new Set(["pending", "sent", "opened"]);

  const CLIENT_CORRECTION_REASONS = [
    "Missed clock in",
    "Missed clock out",
    "Wrong time selected",
    "Lunch not recorded",
    "Worker forgot to punch",
    "Supervisor approved correction",
    "Other"
  ];

  const QR_PATTERN = [1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0];

  const state = {
    initialized: false,
    loading: false,
    mobileNavOpen: false,
    route: "landing",
    selectedPlan: "agency",
    selectedPayPeriod: "",
    roi: {
      workers: 48,
      adminHours: 12,
      disputes: 6
    },
    now: new Date(),
    notice: loadStoredNotice(),
    modal: null,
    toasts: [],
    pendingLink: null,
    inviteFlow: {
      token: "",
      loading: false,
      details: null,
      error: ""
    },
    demoAccess: {
      email: "",
      companyName: "",
      message: ""
    },
    publicPunch: {
      loading: false,
      error: "",
      directories: [],
      agencies: [],
      clients: [],
      sites: [],
      workers: [],
      assignments: [],
      siteWorkers: [],
      directory: null,
      agencyId: "",
      agencyName: "",
      companyId: "",
      companyName: "",
      siteId: "",
      siteName: "",
      saving: false,
      emptyMessage: "",
      requestHelpMessage: "",
      requestDraft: null,
      lastMessage: "",
      lastAction: "",
      lastSavedAt: "",
      lastStatus: "",
      lastWorkerName: ""
    },
    profileRepair: null,
    approvalViewLogKey: "",
    filters: {
      liveStatus: "all",
      liveClient: "all",
      liveSite: "all",
      liveWorker: "all",
      liveAction: "all",
      liveDateFrom: "",
      liveDateTo: ""
    },
    firebase: {
      config: window.PORTALY_FIREBASE_CONFIG || {},
      ready: false,
      app: null,
      auth: null,
      db: null,
      api: null,
      billing: "",
      error: ""
    },
    network: {
      isOnline: navigator.onLine !== false,
      syncingOfflineQueue: false,
      lastOfflineAt: "",
      lastOnlineAt: navigator.onLine !== false ? new Date().toISOString() : ""
    },
    session: {
      mode: "public",
      role: null,
      userId: null,
      agencyId: null,
      agency: null,
      agencyName: "",
      workerId: null,
      email: "",
      name: "Guest",
      assignedClientIds: [],
      assignedSiteIds: [],
      subscriptionStatus: null
    },
    authUser: null,
    demoStore: emptyStore(),
    cache: emptyStore()
  };

  window.PortalyApp = {
    isFirebaseReady,
    isDemoMode,
    isCloudMode,
    saveRecord,
    addRecord,
    getRecords,
    getRecord,
    updateRecord,
    deleteRecord,
    createAuditLog,
    loadAppData,
    refreshCurrentView,
    openModal,
    closeModal,
    confirmAction,
    showToast
  };

  document.addEventListener("DOMContentLoaded", () => {
    void initializeApp();
  });

  window.addEventListener("hashchange", () => {
    void handleHashChange();
  });

  window.addEventListener("unhandledrejection", event => {
    if (state.initialized) {
      reportRuntimeIssue("unhandledrejection", event.reason, {
        toastMessage: "Something went wrong. Portaly kept the app open so you can keep working."
      });
    }
  });

  window.addEventListener("error", event => {
    if (state.initialized && event.error) {
      reportRuntimeIssue("window.error", event.error, {
        toastMessage: ""
      });
    }
  });

  function reportRuntimeIssue(context, error, options = {}) {
    const details = {
      context,
      route: state.route,
      session: {
        mode: state.session.mode,
        role: state.session.role,
        agencyId: state.session.agencyId,
        userId: state.session.userId
      },
      inviteFlow: {
        token: state.inviteFlow.token,
        loading: state.inviteFlow.loading,
        hasDetails: !!state.inviteFlow.details,
        error: state.inviteFlow.error
      },
      network: state.network,
      errorCode: error?.code || "",
      errorMessage: error?.message || String(error || "")
    };
    console.error(`[Portaly] ${context}`, details, error);
    if (options.toastMessage) {
      pushToast(options.toastMessage, options.toastType || "warning");
    }
    return details;
  }

  function isNetworkErrorLike(error) {
    const code = String(error?.code || "").toLowerCase();
    const message = String(error?.message || "").toLowerCase();
    return [
      "failed-precondition",
      "permission-denied",
      "network-error",
      "unavailable",
      "deadline-exceeded"
    ].includes(code)
      || message.includes("network")
      || message.includes("offline")
      || message.includes("failed to fetch")
      || message.includes("timeout")
      || message.includes("could not reach");
  }

  async function initializeApp() {
    renderLoading();
    bindGlobalEvents();
    state.demoStore = loadDemoStore();

    try {
      await initializeFirebase();
      const initialCloudUser = state.firebase.ready ? await getInitialAuthUser() : null;

      if (initialCloudUser) {
        await establishCloudSession(initialCloudUser);
      } else {
        restoreStoredSession();
      }

      await applyEntryRoute();
      await refreshSessionData();
      await flushOfflinePunchQueue({ silent: true });
      if (state.session.mode === "cloud") {
        await refreshSessionData();
      }
      normalizeFilters();
      applyTheme();
      state.initialized = true;
      renderApp();
      startClock();
    } catch (error) {
      reportRuntimeIssue("initializeApp failed", error, {
        toastMessage: ""
      });
      try {
        normalizeFilters();
        applyTheme();
        state.initialized = true;
        renderApp();
        startClock();
        pushToast("Portaly recovered from a startup issue. Some live data may need a refresh.", "warning");
      } catch (recoveryError) {
        console.error("[Portaly] initializeApp recovery failed", recoveryError);
        renderFatalError(error);
      }
    }
  }

  function bindGlobalEvents() {
    document.addEventListener("click", event => {
      const trigger = event.target.closest("[data-action]");
      if (!trigger) {
        return;
      }
      event.preventDefault();
      void handleAction(trigger);
    });

    document.addEventListener("submit", event => {
      const form = event.target.closest("form[data-form]");
      if (!form) {
        return;
      }
      event.preventDefault();
      void handleFormSubmit(form);
    });

    document.addEventListener("change", event => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) {
        return;
      }
      void handleInputChange(target);
    });

    window.addEventListener("online", () => {
      void handleConnectivityChange(true);
    });

    window.addEventListener("offline", () => {
      void handleConnectivityChange(false);
    });
  }

  async function initializeFirebase() {
    const config = normalizeFirebaseConfig(window.PORTALY_FIREBASE_CONFIG || {});
    state.firebase.config = config;
    console.log("[Portaly] initializeFirebase config", window.PORTALY_FIREBASE_CONFIG || {});

    if (!config.enabled) {
      console.warn("[Portaly] Firebase disabled in config");
      return;
    }

    await waitForFirebaseLayer();
    console.log("[Portaly] initializeFirebase bridge", window.PortalyFirebase || null);

    if (!window.PortalyFirebase) {
      state.firebase.error = "Firebase browser modules did not load.";
      console.error("[Portaly] initializeFirebase error", state.firebase.error);
      return;
    }

    try {
      const bridge = window.PortalyFirebase;
      state.firebase.api = bridge;
      state.firebase.app = bridge.app || null;
      state.firebase.auth = bridge.auth || null;
      state.firebase.db = bridge.db || null;
      state.firebase.ready = !!bridge.ready;
      state.firebase.error = bridge.error || "";
      state.firebase.billing = "square";
      console.log("[Portaly] initializeFirebase readyState", state.firebase.ready);
      if (state.firebase.error) {
        console.error("[Portaly] initializeFirebase bridgeError", state.firebase.error);
      }
    } catch (error) {
      console.error("[Portaly] initializeFirebase exception", error);
      state.firebase.error = error.message || "Unable to initialize Firebase.";
      state.firebase.ready = false;
    }
  }

  function getInitialAuthUser() {
    return new Promise(resolve => {
      if (!state.firebase.auth) {
        resolve(null);
        return;
      }
      let unsubscribe = () => {};
      unsubscribe = state.firebase.auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user || null);
      });
    });
  }

  function waitForFirebaseLayer(timeoutMs = 7000) {
    if (window.PortalyFirebase && (window.PortalyFirebase.ready || window.PortalyFirebase.error || window.PortalyFirebase.disabled)) {
      return Promise.resolve(window.PortalyFirebase);
    }

    return new Promise(resolve => {
      let done = false;
      const finish = () => {
        if (done) {
          return;
        }
        done = true;
        window.removeEventListener("portaly-firebase-ready", onReady);
        clearTimeout(timer);
        resolve(window.PortalyFirebase || null);
      };
      const onReady = () => finish();
      const timer = window.setTimeout(() => finish(), timeoutMs);
      window.addEventListener("portaly-firebase-ready", onReady, { once: true });
    });
  }

  function normalizeFirebaseConfig(config) {
    const normalized = {
      ...config,
      enabled: typeof config.enabled === "boolean" ? config.enabled : !!config.apiKey,
      trialDays: Number(config.trialDays || 14),
      appUrl: config.appUrl || DEFAULT_APP_URL
    };

    if (!normalized.firebaseConfig) {
      normalized.firebaseConfig = {
        apiKey: config.apiKey || "",
        authDomain: config.authDomain || "",
        projectId: config.projectId || "",
        storageBucket: config.storageBucket || "",
        messagingSenderId: config.messagingSenderId || "",
        appId: config.appId || "",
        measurementId: config.measurementId || ""
      };
    }

    return normalized;
  }

  function hasConfiguredFirebaseCloudMode() {
    const config = state.firebase.config || normalizeFirebaseConfig(window.PORTALY_FIREBASE_CONFIG || {});
    const firebaseConfig = config.firebaseConfig || {};
    return !!(
      config.enabled
      && firebaseConfig.apiKey
      && firebaseConfig.authDomain
      && firebaseConfig.projectId
      && firebaseConfig.appId
    );
  }

  function renderFirebaseSetupNotice(options = {}) {
    const margin = options.margin || "18px 0";
    const title = options.title || "Cloud setup is not complete yet.";
    const body = options.body || "Portaly can still run from GitHub Pages without a custom domain. Add your Firebase web config and make sure https://zaspdragon.github.io and localhost are listed in Firebase Authentication authorized domains when you are ready to turn on Cloud Mode.";
    return `
      <div class="notice-card warning" style="margin: ${escapeAttribute(margin)};">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(body)}</p>
        </div>
      </div>
    `;
  }

  function getFirebaseUnavailableMessage(defaultMessage) {
    const detail = String(state.firebase.error || "").trim();
    return detail ? `${defaultMessage} ${detail}` : defaultMessage;
  }

  function loadOfflinePunchQueue() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.offlinePunchQueue);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (error) {
      reportRuntimeIssue("loadOfflinePunchQueue", error, {
        toastMessage: ""
      });
      return [];
    }
  }

  function writeOfflinePunchQueue(queue) {
    window.localStorage.setItem(STORAGE_KEYS.offlinePunchQueue, JSON.stringify(Array.isArray(queue) ? queue : []));
  }

  function getOfflinePunchQueueForAgency(agencyId) {
    const normalizedAgencyId = String(agencyId || "").trim();
    return loadOfflinePunchQueue()
      .filter(item => !normalizedAgencyId || String(item?.agencyId || item?.punch?.agencyId || "").trim() === normalizedAgencyId)
      .map(item => ({
        ...(item?.punch || {}),
        id: item?.id || item?.punch?.id || createId("queued"),
        queuedOffline: true
      }));
  }

  function queueOfflinePunch(recordId, punch, error = null) {
    const queue = loadOfflinePunchQueue();
    const nextRecord = {
      id: recordId,
      agencyId: punch?.agencyId || state.session.agencyId || state.session.agency?.id || "",
      queuedAt: new Date().toISOString(),
      retries: 0,
      errorMessage: error?.message || "",
      punch: {
        ...punch,
        id: recordId,
        queuedOffline: true
      }
    };
    const withoutExisting = queue.filter(item => item?.id !== recordId);
    withoutExisting.push(nextRecord);
    writeOfflinePunchQueue(withoutExisting);
    return nextRecord;
  }

  async function flushOfflinePunchQueue(options = {}) {
    if (state.network.syncingOfflineQueue || state.session.mode !== "cloud" || !state.firebase.ready || !state.firebase.db) {
      return 0;
    }
    if (!state.network.isOnline) {
      return 0;
    }

    const queue = loadOfflinePunchQueue();
    if (!queue.length) {
      return 0;
    }

    const sessionAgencyId = state.session.agencyId || state.session.agency?.id || "";
    const eligible = queue.filter(item => {
      const itemAgencyId = String(item?.agencyId || item?.punch?.agencyId || "").trim();
      return !sessionAgencyId || itemAgencyId === sessionAgencyId;
    });
    if (!eligible.length) {
      return 0;
    }

    state.network.syncingOfflineQueue = true;
    let syncedCount = 0;
    const remaining = [];

    try {
      for (const item of queue) {
        const belongsToSession = eligible.some(candidate => candidate?.id === item?.id);
        if (!belongsToSession) {
          remaining.push(item);
          continue;
        }

        try {
          const savedPunch = await saveData("punches", item.id, {
            ...(item.punch || {}),
            queuedOffline: false,
            syncedAt: new Date().toISOString()
          });
          await appendAuditLog("offline_punch_synced", "punches", savedPunch.id, null, savedPunch, {
            actorId: state.session.userId,
            actorRole: state.session.role,
            reason: "offline_queue_flush"
          });
          syncedCount += 1;
        } catch (error) {
          remaining.push({
            ...item,
            retries: Number(item?.retries || 0) + 1,
            errorMessage: error?.message || ""
          });
          reportRuntimeIssue("flushOfflinePunchQueue.item", error, {
            toastMessage: ""
          });
        }
      }

      writeOfflinePunchQueue(remaining);
      if (syncedCount && !options.silent) {
        pushToast(`${syncedCount} queued punch${syncedCount === 1 ? "" : "es"} synced successfully.`, "success");
      }
      return syncedCount;
    } finally {
      state.network.syncingOfflineQueue = false;
    }
  }

  async function handleConnectivityChange(isOnline) {
    const now = new Date().toISOString();
    state.network.isOnline = isOnline;
    state.network.lastOnlineAt = isOnline ? now : state.network.lastOnlineAt;
    state.network.lastOfflineAt = !isOnline ? now : state.network.lastOfflineAt;
    if (state.initialized) {
      pushToast(isOnline ? "Connection restored. Portaly is syncing live data again." : "You are offline. Portaly will keep the app open and queue supported actions.", isOnline ? "success" : "warning");
      if (isOnline) {
        try {
          const syncedCount = await flushOfflinePunchQueue({ silent: true });
          if (syncedCount) {
            await refreshSessionData();
            renderApp();
            pushToast(`${syncedCount} queued punch${syncedCount === 1 ? "" : "es"} synced successfully.`, "success");
          } else {
            renderApp();
          }
        } catch (error) {
          reportRuntimeIssue("handleConnectivityChange.online", error, {
            toastMessage: "Connection returned, but Portaly could not sync everything yet."
          });
        }
      } else {
        renderApp();
      }
    }
  }

  function renderLoading() {
    const root = document.getElementById("app");
    if (!root) {
      return;
    }
    root.innerHTML = `
      <div class="loading-card">
        <div class="surface-card">
          <p class="eyebrow">Portaly</p>
          <h2>Loading your staffing agency workspace</h2>
          <p>Preparing demo access, cloud auth, worker punch tools, and billing controls.</p>
          <div class="loading-skeleton-stack" aria-hidden="true">
            <span class="skeleton-line skeleton-line-lg"></span>
            <span class="skeleton-line"></span>
            <span class="skeleton-line skeleton-line-sm"></span>
          </div>
        </div>
      </div>
    `;
  }

  async function handleHashChange() {
    if (!state.initialized) {
      return;
    }
    try {
      state.route = normalizeRoute(parseHashRoute());
      if (state.route === "accept-invite") {
        await loadInviteFlowState();
      } else if (state.route === "punch" || state.route === "clock") {
        await loadPublicPunchState();
      } else if (state.route === "qr-codes") {
        await ensurePublishedSitePunchDirectories();
      }
      state.mobileNavOpen = false;
      applyBodyState();
      renderApp();
    } catch (error) {
      reportRuntimeIssue("handleHashChange failed", error, {
        toastMessage: ""
      });
      state.route = "landing";
      state.mobileNavOpen = false;
      applyBodyState();
      renderApp();
      pushToast("That page could not be loaded. Portaly returned you to the landing page.", "warning");
    }
  }

  async function applyEntryRoute() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const workerId = params.get("workerId");
    const siteId = params.get("siteId");
    const hashWorker = parseWorkerHash();

    if (hashWorker) {
      await handleDirectWorkerRequest(hashWorker);
      return;
    }

    if (mode === "worker" && workerId) {
      await handleDirectWorkerRequest(workerId);
      return;
    }

    if (mode === "site" && siteId) {
      navigatePublicPunchRoute("", "", siteId, { replace: true });
      return;
    }

      state.route = normalizeRoute(parseHashRoute());
      if (state.route === "accept-invite") {
        await loadInviteFlowState();
      } else if (state.route === "punch" || state.route === "clock") {
        await loadPublicPunchState();
      } else if (state.route === "qr-codes") {
        await ensurePublishedSitePunchDirectories();
      }
      if (!window.location.hash) {
        navigate(state.route, { replace: true });
      }
  }

  async function handleDirectWorkerRequest(workerId) {
    const scoped = getScopedData();
    const demoWorker = state.demoStore.workers.find(worker => worker.id === workerId);

    if (state.session.mode === "cloud" && state.session.role === "worker" && state.session.workerId === workerId) {
      navigate("worker-punch", { replace: true });
      return;
    }

    if (demoWorker) {
      startDemoRole("worker", { workerId });
      navigate("worker-punch", { replace: true });
      return;
    }

    if (state.session.mode === "public") {
      state.pendingLink = { type: "worker", workerId };
      state.notice = "This worker link requires a signed-in worker account.";
      storeNotice(state.notice);
      navigate("login", { replace: true });
      return;
    }

    if (scoped.workers.some(worker => worker.id === workerId)) {
      navigate("worker-punch", { replace: true });
      return;
    }

    state.notice = "We could not match that worker QR link.";
    storeNotice(state.notice);
    navigate(getHomeRoute(), { replace: true });
  }

  function parseHashRoute() {
    const hash = getHashPath();
    if (!hash) {
      return getHomeRoute();
    }
    if (hash === "site-qr") {
      return "qr-codes";
    }
    if (hash.startsWith("worker/")) {
      return "worker-punch";
    }
    if (hash.startsWith("approve/")) {
      return "approval-link";
    }
    if (hash.startsWith("client-approval/")) {
      return "client-approval";
    }
    if (hash.startsWith("accept-invite/")) {
      return "accept-invite";
    }
    return hash;
  }

  function getHashFragment() {
    return window.location.hash.replace(/^#\/?/, "").trim();
  }

  function getHashPath() {
    return getHashFragment().split("?")[0].trim();
  }

  function getHashSearchParams() {
    const fragment = getHashFragment();
    const queryIndex = fragment.indexOf("?");
    return new URLSearchParams(queryIndex >= 0 ? fragment.slice(queryIndex + 1) : "");
  }

  function parseWorkerHash() {
    const hash = getHashPath();
    if (!hash.startsWith("worker/")) {
      return "";
    }
    return hash.split("/")[1] || "";
  }

  function parseApprovalHash() {
    const hash = getHashPath();
    if (hash.startsWith("approve/")) {
      return {
        mode: "token",
        value: hash.split("/")[1] || ""
      };
    }
    if (hash.startsWith("client-approval/")) {
      return {
        mode: "id",
        value: hash.split("/")[1] || ""
      };
    }
    return null;
  }

  function parseInviteHash() {
    const hash = getHashPath();
    if (!hash.startsWith("accept-invite/")) {
      return "";
    }
    return hash.split("/")[1] || "";
  }

  function parsePublicPunchHash() {
    const route = getHashPath();
    if (route !== "punch" && route !== "clock") {
      return null;
    }
    const params = getHashSearchParams();
    return {
      agencyId: String(params.get("agencyId") || "").trim(),
      companyId: String(params.get("clientId") || params.get("companyId") || "").trim(),
      siteId: String(params.get("siteId") || "").trim()
    };
  }

  function getMissingInviteMessage() {
    return "This invite no longer exists or has already been accepted.";
  }

  function getMalformedInviteMessage() {
    return "Invite is malformed.";
  }

  function getAcceptedInviteMessage() {
    return "This invite has already been accepted.";
  }

  function getRevokedInviteMessage() {
    return "This invite has been revoked.";
  }

  function getStoredPendingInviteToken() {
    return String(window.localStorage.getItem(STORAGE_KEYS.pendingInvite) || "").trim();
  }

  function storePendingInviteToken(token) {
    const nextToken = String(token || "").trim();
    if (!nextToken) {
      window.localStorage.removeItem(STORAGE_KEYS.pendingInvite);
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.pendingInvite, nextToken);
  }

  function clearPendingInviteToken() {
    window.localStorage.removeItem(STORAGE_KEYS.pendingInvite);
  }

  function getHomeRoute() {
    if (state.profileRepair && state.authUser) {
      return "complete-profile";
    }
    if (state.session.mode === "public" || !state.session.role) {
      return "landing";
    }
    if (isBillingLocked()) {
      if (state.session.role === "agencyOwner" || state.session.role === "agencyAdmin" || state.session.role === "platformOwner") {
        return "billing";
      }
      return "billing-required";
    }
    return ROLE_META[state.session.role].home;
  }

  function normalizeRoute(route) {
    const candidate = route === "site-qr" ? "qr-codes" : (route || getHomeRoute());
    if (candidate === "approval-link" || candidate === "accept-invite" || candidate === "punch" || candidate === "clock" || candidate === "landing") {
      return candidate;
    }
    const allowed = getAllowedRoutes();
    if (allowed.has(candidate)) {
      return candidate;
    }
    return getHomeRoute();
  }

  function getAllowedRoutes() {
    if (state.session.mode === "public" || !state.session.role) {
      return PUBLIC_ROUTES;
    }

    if (state.session.role === "worker") {
      return WORKER_ROUTES;
    }

    if (state.session.role === "clientManager") {
      return CLIENT_ROUTES;
    }

    if (isBillingLocked()) {
      return new Set(["billing", "settings", "billing-required"]);
    }

    return new Set(NAV_ITEMS.filter(item => item.roles.includes(state.session.role)).map(item => item.id));
  }

  function navigate(route, options = {}) {
    const target = `#/${route}`;
    if (options.replace) {
      window.history.replaceState(null, "", target);
      state.route = normalizeRoute(route);
      renderApp();
      return;
    }

    if (window.location.hash === target) {
      state.route = normalizeRoute(route);
      renderApp();
      return;
    }

    window.location.hash = target;
  }

  function navigateInviteRoute(token, options = {}) {
    const target = `#/accept-invite/${encodeURIComponent(String(token || "").trim())}`;
    if (options.replace) {
      window.history.replaceState(null, "", target);
      state.route = normalizeRoute(parseHashRoute());
      renderApp();
      return;
    }
    if (window.location.hash === target) {
      state.route = normalizeRoute(parseHashRoute());
      renderApp();
      return;
    }
    window.location.hash = target;
  }

  function navigatePublicPunchRoute(agencyId = "", companyId = "", siteId = "", options = {}) {
    const params = new URLSearchParams();
    if (agencyId) {
      params.set("agencyId", agencyId);
    }
    if (companyId) {
      params.set("clientId", companyId);
    }
    if (siteId) {
      params.set("siteId", siteId);
    }
    const query = params.toString();
    const target = query ? `#/punch?${query}` : "#/punch";
    if (options.replace) {
      window.history.replaceState(null, "", target);
      state.route = normalizeRoute(parseHashRoute());
      void loadPublicPunchState().finally(() => renderApp());
      return;
    }
    if (window.location.hash === target) {
      state.route = normalizeRoute(parseHashRoute());
      void loadPublicPunchState().finally(() => renderApp());
      return;
    }
    window.location.hash = target;
  }

  function restoreStoredSession() {
    const raw = safeJsonParse(window.localStorage.getItem(STORAGE_KEYS.session));
    if (!raw || raw.mode !== "demo" || !raw.role) {
      setPublicSession();
      return;
    }
    const user = findDemoUserByRole(raw.role, raw.userId, raw.workerId);
    if (!user) {
      setPublicSession();
      return;
    }
    state.session = buildSessionFromUser(user, "demo");
  }

  function persistSession() {
    if (state.session.mode === "demo") {
      window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({
        mode: "demo",
        role: state.session.role,
        userId: state.session.userId,
        workerId: state.session.workerId || null
      }));
      return;
    }
    window.localStorage.removeItem(STORAGE_KEYS.session);
  }

  function setPublicSession() {
    state.session = {
      mode: "public",
      role: null,
      userId: null,
      agencyId: null,
      agency: null,
      agencyName: "",
      workerId: null,
      email: "",
      name: "Guest",
      assignedClientIds: [],
      assignedSiteIds: [],
      subscriptionStatus: null
    };
    persistSession();
  }

  async function establishCloudSession(authUser) {
    console.log("[Portaly] Establishing cloud session");
    console.log("[Portaly] auth uid", authUser?.uid || "");
    console.log("Firebase UID", authUser?.uid || "");
    state.authUser = authUser;
    let profile = await loadCloudUserProfile(authUser.uid);
    console.log("[Portaly] loaded user profile", profile);
    console.log("Firestore role", profile?.role || "");
    console.log("Firestore agencyId", profile?.agencyId || "");
    profile = await repairOwnerProfileIfNeeded(authUser, profile);
    console.log("[Portaly] repaired user profile", profile);

    if (!profile) {
      const pendingInviteToken = parseInviteHash() || getStoredPendingInviteToken();
      if (pendingInviteToken) {
        console.warn("[Portaly] users/{uid} missing, routing to accept-invite", authUser.uid);
        setPublicSession();
        storePendingInviteToken(pendingInviteToken);
        await loadInviteFlowState(pendingInviteToken, { force: true });
        pushToast("Your login is ready. Finish accepting your Portaly invite.", "warning");
        navigateInviteRoute(pendingInviteToken, { replace: true });
        return;
      }

      console.warn("[Portaly] users/{uid} missing, routing to complete-profile", authUser.uid);
      state.profileRepair = {
        uid: authUser.uid,
        email: authUser.email || "",
        agencyId: null,
        prefill: state.profileRepair?.prefill || null
      };
      pushToast("Your login exists. Finish setting up your Portaly workspace.", "warning");
      setPublicSession();
      navigate("complete-profile", { replace: true });
      return;
    }

    state.profileRepair = null;
    state.session = buildSessionFromUser(profile, "cloud");
    state.session.email = authUser.email || profile.email || "";
    state.session.name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email || "Cloud User";
    state.session.userId = profile.id || authUser.uid;
    state.session.role = profile.role || state.session.role;
    state.session.agencyId = profile.agencyId || state.session.agencyId || null;

    let agency = null;
    if (state.session.agencyId && state.firebase.db) {
      const agencySnapshot = await state.firebase.db.collection("agencies").doc(state.session.agencyId).get();
      if (agencySnapshot.exists) {
        agency = { id: agencySnapshot.id, ...agencySnapshot.data() };
      }
    }

    state.session.agency = agency;
    state.session.agencyName = agency?.name || "";
    state.cache.agencies = agency ? [agency] : [];
    const displayedRole = getRoleLabel(state.session.role);
    console.log("[Portaly] loaded agency", agency);
    console.log("[Portaly] final session state", state.session);
    console.log("Sidebar role", displayedRole);

    if (state.pendingLink && state.pendingLink.type === "worker" && state.session.role === "worker" && state.session.workerId === state.pendingLink.workerId) {
      navigate("worker-punch", { replace: true });
      state.pendingLink = null;
    }
  }

  async function loadCloudUserProfile(uid) {
    if (!state.firebase.ready) {
      return null;
    }
    const snapshot = await state.firebase.db.collection("users").doc(uid).get();
    if (!snapshot.exists) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() };
  }

  async function repairOwnerProfileIfNeeded(authUser, profile) {
    if (!state.firebase.ready || !state.firebase.db || !authUser?.uid) {
      return profile;
    }

    const ownedAgency = await findAgencyOwnedBy(authUser.uid);
    if (!ownedAgency?.id) {
      return profile;
    }

    const expectedAgencyId = String(ownedAgency.id || "").trim();
    const currentRole = String(profile?.role || "").trim();
    const currentAgencyId = String(profile?.agencyId || "").trim();
    const currentStatus = String(profile?.status || "").trim();
    const hasExplicitNonOwnerRole = !!profile && !!currentRole && currentRole !== "agencyOwner";
    const needsRepair = !hasExplicitNonOwnerRole && (
      !profile
      || !currentRole
      || currentRole === "agencyOwner" && (currentAgencyId !== expectedAgencyId || currentStatus !== "active")
    );

    console.log("[Portaly] owner profile check", {
      uid: authUser.uid,
      currentRole,
      currentAgencyId,
      currentStatus,
      expectedAgencyId,
      hasExplicitNonOwnerRole,
      needsRepair
    });

    if (!needsRepair) {
      if (hasExplicitNonOwnerRole) {
        console.log("[Portaly] owner profile repair skipped because Firestore already has an explicit non-owner role", {
          uid: authUser.uid,
          currentRole,
          currentAgencyId
        });
      }
      return profile;
    }

    const nowIso = new Date().toISOString();
    const repairedProfile = {
      id: authUser.uid,
      agencyId: expectedAgencyId,
      role: "agencyOwner",
      firstName: profile?.firstName || state.profileRepair?.prefill?.ownerFirstName || "",
      lastName: profile?.lastName || state.profileRepair?.prefill?.ownerLastName || "",
      email: authUser.email || profile?.email || "",
      phone: profile?.phone || ownedAgency?.settings?.supportPhone || "",
      status: profile?.status || "active",
      assignedClientIds: Array.isArray(profile?.assignedClientIds) ? profile.assignedClientIds : [],
      assignedSiteIds: Array.isArray(profile?.assignedSiteIds) ? profile.assignedSiteIds : [],
      workerId: profile?.workerId || "",
      createdAt: profile?.createdAt || ownedAgency?.createdAt || nowIso,
      updatedAt: nowIso
    };

    try {
      await state.firebase.db.collection("users").doc(authUser.uid).set(repairedProfile, { merge: true });
      console.log("[Portaly] owner profile repaired", {
        uid: authUser.uid,
        agencyId: expectedAgencyId
      });
      return await loadCloudUserProfile(authUser.uid);
    } catch (error) {
      console.error("[Portaly] owner profile repair failed", {
        uid: authUser.uid,
        expectedAgencyId,
        error
      });
      return profile;
    }
  }

  async function repairCurrentAgencyAccess(options = {}) {
    requirePermission(state.session.role === "agencyOwner", "Only the agency owner can repair agency access.");
    if (!state.firebase.ready || !state.firebase.db || !state.authUser?.uid) {
      throw new Error("Cloud Mode is not ready yet. Try again in a moment.");
    }

    const ownedAgency = await findAgencyOwnedBy(state.authUser.uid);
    if (!ownedAgency?.id) {
      throw new Error("We could not find an agency owned by this login.");
    }

    const existingProfile = await loadCloudUserProfile(state.authUser.uid);
    const nowIso = new Date().toISOString();
    const repairedProfile = {
      id: state.authUser.uid,
      agencyId: ownedAgency.id,
      role: "agencyOwner",
      firstName: existingProfile?.firstName || "",
      lastName: existingProfile?.lastName || "",
      email: state.authUser.email || existingProfile?.email || "",
      phone: existingProfile?.phone || ownedAgency?.settings?.supportPhone || "",
      status: "active",
      assignedClientIds: Array.isArray(existingProfile?.assignedClientIds) ? existingProfile.assignedClientIds : [],
      assignedSiteIds: Array.isArray(existingProfile?.assignedSiteIds) ? existingProfile.assignedSiteIds : [],
      workerId: existingProfile?.workerId || "",
      createdAt: existingProfile?.createdAt || ownedAgency?.createdAt || nowIso,
      updatedAt: nowIso
    };

    await state.firebase.db.collection("users").doc(state.authUser.uid).set(repairedProfile, { merge: true });
    await establishCloudSession(state.authUser);
    await refreshSessionData();
    await loadPublicPunchState();
    renderApp();

    if (!options.silent) {
      pushToast("Your agency access was repaired successfully.", "success");
    }
    return repairedProfile;
  }

  function buildSessionFromUser(user, mode) {
    return {
      mode,
      role: user.role,
      userId: user.id,
      agencyId: user.agencyId || null,
      agency: null,
      agencyName: "",
      workerId: user.workerId || null,
      email: user.email || "",
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.displayName || user.email || ROLE_META[user.role]?.label || "User",
      assignedClientIds: Array.isArray(user.assignedClientIds) ? user.assignedClientIds : [],
      assignedSiteIds: Array.isArray(user.assignedSiteIds) ? user.assignedSiteIds : [],
      subscriptionStatus: null
    };
  }

  function getRoleLabel(role = state.session.role) {
    return ROLE_META[role]?.label || formatStatusLabel(role || "Unknown Role");
  }

  async function refreshSessionData() {
    if (state.session.mode === "public" || !state.session.role) {
      state.cache = emptyStore();
      applyTheme();
      return;
    }

    if (state.session.mode === "demo") {
      state.demoStore = loadDemoStore();
      state.cache = deepClone(state.demoStore);
      syncSubscriptionStatus();
      applyTheme();
      return;
    }

    const collections = collectionsForRole(state.session.role);
    const failedCollections = [];
    const previousCache = state.cache || emptyStore();
    const results = await Promise.all(collections.map(async collection => {
      try {
        const rows = await getData(collection);
        return [collection, Array.isArray(rows) ? rows.filter(Boolean) : []];
      } catch (error) {
        failedCollections.push(collection);
        reportRuntimeIssue("refreshSessionData collection failed", error, {
          toastMessage: "",
        });
        console.warn("[Portaly] refreshSessionData collection fallback", {
          collection,
          cachedRows: (previousCache[collection] || []).length
        });
        return [collection, Array.isArray(previousCache[collection]) ? deepClone(previousCache[collection]) : []];
      }
    }));

    state.cache = emptyStore();
    results.forEach(([collection, rows]) => {
      state.cache[collection] = rows;
    });

    const cachedAgency = (state.cache.agencies || []).find(agency => agency.id === state.session.agencyId) || state.session.agency || null;
    state.session.agency = cachedAgency;
    state.session.agencyName = cachedAgency?.name || "";

    syncSubscriptionStatus();
    syncOwnerClockState();
    applyTheme();
    if (failedCollections.length) {
      pushToast("Some live data could not be loaded. Portaly kept the app running with the data it could recover.", "warning");
    }
  }

  function syncOwnerClockState(options = {}) {
    if (!state.session.role || state.session.mode === "public" || state.session.role === "worker" || state.session.role === "clientManager") {
      return null;
    }

    const currentAgencyId = String(state.session.agencyId || state.session.agency?.id || "").trim();
    if (!currentAgencyId) {
      return null;
    }

    const hashState = parsePublicPunchHash() || {};
    const previous = state.publicPunch || {};
    const query = {
      agencyId: String(options.agencyId || hashState.agencyId || previous.agencyId || currentAgencyId).trim(),
      companyId: String(options.companyId || hashState.companyId || previous.companyId || "").trim(),
      siteId: String(options.siteId || hashState.siteId || previous.siteId || "").trim()
    };

    const nextState = buildPublicPunchStateFromRecords(query, getScopedData());
    state.publicPunch = {
      ...previous,
      ...nextState,
      loading: false,
      saving: false,
      error: nextState.error || "",
      fallbackNotice: "",
      requestHelpMessage: previous.requestHelpMessage || "",
      requestDraft: previous.requestDraft || null,
      lastMessage: previous.lastMessage || "",
      lastAction: previous.lastAction || "",
      lastSavedAt: previous.lastSavedAt || "",
      lastStatus: previous.lastStatus || "",
      lastWorkerName: previous.lastWorkerName || ""
    };
    return state.publicPunch;
  }

  function collectionsForRole(role) {
    if (role === "platformOwner") {
      return COLLECTIONS.slice();
    }

    if (role === "worker") {
      return ["agencies", "users", "clients", "sites", "workers", "punches", "timesheets", "settings"];
    }

    if (role === "clientManager") {
      return ["agencies", "users", "clients", "sites", "workers", "punches", "punchRequests", "timesheets", "approvals", "settings"];
    }

    return COLLECTIONS.slice();
  }

  function syncSubscriptionStatus() {
    const agency = getCurrentAgency();
    const subscription = getCurrentSubscription();
    state.session.subscriptionStatus = subscription?.status || (agency ? agency.subscriptionStatus : null);
  }

  async function loadAppData() {
    await refreshSessionData();
    return getScopedData();
  }

  async function refreshCurrentView() {
    await refreshSessionData();
    normalizeFilters();
    renderApp();
  }

  function emptyStore() {
    return COLLECTIONS.reduce((accumulator, collection) => {
      accumulator[collection] = [];
      return accumulator;
    }, {});
  }

  async function getData(collection) {
    if (state.session.mode !== "cloud") {
      return deepClone(state.demoStore[collection] || []);
    }

    const db = state.firebase.db;
    const role = state.session.role;
    const agencyId = state.session.agencyId || state.session.agency?.id;
    const assignedClientIds = state.session.assignedClientIds || [];
    const assignedSiteIds = state.session.assignedSiteIds || [];

    if (collection === "agencies") {
      if (role === "platformOwner") {
        return mapSnapshot(await db.collection("agencies").get());
      }
      if (!agencyId) {
        return [];
      }
      const snapshot = await db.collection("agencies").doc(agencyId).get();
      return snapshot.exists ? [{ id: snapshot.id, ...snapshot.data() }] : [];
    }

    if (collection === "users") {
      if (role === "platformOwner") {
        return mapSnapshot(await db.collection("users").get());
      }
      if (role === "worker" || role === "clientManager") {
        const snapshot = await db.collection("users").doc(state.session.userId).get();
        return snapshot.exists ? [{ id: snapshot.id, ...snapshot.data() }] : [];
      }
      return mapSnapshot(await db.collection("users").where("agencyId", "==", agencyId).get()).filter(user => {
        return true;
      });
    }

    if (collection === "clientInvites") {
      if (role === "platformOwner") {
        return mapSnapshot(await db.collection("clientInvites").get());
      }
      if (!agencyId || state.session.role === "worker" || state.session.role === "clientManager") {
        return [];
      }
      return mapSnapshot(await db.collection("clientInvites").where("agencyId", "==", agencyId).get());
    }

    if (collection === "punchRequests") {
      const baseRows = agencyId
        ? mapSnapshot(await db.collection("punchRequests").where("agencyId", "==", agencyId).get())
        : mapSnapshot(await db.collection("punchRequests").get());

      if (role === "platformOwner") {
        return baseRows;
      }

      if (role === "clientManager") {
        return filterClientManagerRows(collection, baseRows, assignedClientIds, assignedSiteIds);
      }

      return baseRows;
    }

    const baseRows = agencyId
      ? mapSnapshot(await db.collection(collection).where("agencyId", "==", agencyId).get())
      : mapSnapshot(await db.collection(collection).get());

    if (role === "platformOwner") {
      return baseRows;
    }

    if (role === "worker") {
      return filterWorkerRows(collection, baseRows);
    }

    if (role === "clientManager") {
      return filterClientManagerRows(collection, baseRows, assignedClientIds, assignedSiteIds);
    }

    return baseRows;
  }

  function filterWorkerRows(collection, rows) {
    switch (collection) {
      case "workers":
        return rows.filter(row => row.id === state.session.workerId);
      case "clients":
        return rows.filter(row => row.id === getCurrentWorker()?.assignedClientId);
      case "sites":
        return rows.filter(row => row.id === getCurrentWorker()?.assignedSiteId);
      case "punches":
      case "punchRequests":
      case "timesheets":
      case "approvals":
        return rows.filter(row => row.workerId === state.session.workerId);
      default:
        return [];
    }
  }

  function filterClientManagerRows(collection, rows, assignedClientIds, assignedSiteIds) {
    switch (collection) {
      case "clients":
        return rows.filter(row => assignedClientIds.includes(row.id));
      case "sites":
        return rows.filter(row => assignedSiteIds.includes(row.id));
      case "workers":
      case "punches":
      case "punchRequests":
      case "timesheets":
      case "approvals":
        return rows.filter(row => assignedClientIds.includes(row.clientId || row.assignedClientId) || assignedSiteIds.includes(row.siteId || row.assignedSiteId));
      default:
        return [];
    }
  }

  async function saveData(collection, id, data) {
    const now = new Date().toISOString();
    const recordId = id || createId(collection);
    const existing = findRecord(collection, recordId);
    let payload = {
      ...existing,
      ...data,
      id: recordId,
      updatedAt: now,
      createdAt: existing?.createdAt || data.createdAt || now
    };

    if (AGENCY_SCOPED_COLLECTIONS.has(collection)) {
      payload = {
        ...payload,
        agencyId: payload.agencyId || existing?.agencyId || state.session.agencyId || state.session.agency?.id || ""
      };

      if (!payload.agencyId) {
        console.error("[Portaly] Missing agencyId for save", {
          collection,
          recordId,
          session: state.session,
          payload
        });
        throw new Error("Your agency workspace is not loaded. Please log out and log back in.");
      }
    }

    if (collection === "workers") {
      delete payload.loginEmail;
      if (!payload.userId) {
        delete payload.userId;
      }
    }

    if (state.session.mode === "cloud") {
      await state.firebase.db.collection(collection).doc(recordId).set(payload, { merge: false });
      state.cache[collection] = [...(state.cache[collection] || []).filter(row => row.id !== recordId), payload];
    } else {
      const store = loadDemoStore();
      const rows = (store[collection] || []).filter(row => row.id !== recordId);
      rows.push(payload);
      store[collection] = rows;
      writeDemoStore(store);
      state.demoStore = store;
      state.cache[collection] = rows;
    }

    return payload;
  }

  async function updateData(collection, id, data) {
    const existing = findRecord(collection, id);
    if (!existing) {
      return saveData(collection, id, data);
    }
    return saveData(collection, id, { ...existing, ...data });
  }

  async function deleteData(collection, id) {
    if (state.session.mode === "cloud") {
      await state.firebase.db.collection(collection).doc(id).delete();
      state.cache[collection] = (state.cache[collection] || []).filter(row => row.id !== id);
      return;
    }

    const store = loadDemoStore();
    store[collection] = (store[collection] || []).filter(row => row.id !== id);
    writeDemoStore(store);
    state.demoStore = store;
    state.cache[collection] = store[collection];
  }

  function isFirebaseReady() {
    return !!state.firebase.ready;
  }

  function isDemoMode() {
    return state.session.mode === "demo";
  }

  function isCloudMode() {
    return state.session.mode === "cloud";
  }

  async function saveRecord(collectionName, id, data) {
    return saveData(collectionName, id, data);
  }

  async function addRecord(collectionName, data) {
    return saveData(collectionName, createId(collectionName), data);
  }

  async function getRecords(collectionName) {
    return getData(collectionName);
  }

  async function getRecord(collectionName, id) {
    const rows = await getData(collectionName);
    return rows.find(row => row.id === id) || null;
  }

  async function updateRecord(collectionName, id, data) {
    return updateData(collectionName, id, data);
  }

  async function deleteRecord(collectionName, id) {
    return deleteData(collectionName, id);
  }

  async function createAuditLog(action, entityType, entityId, oldValue, newValue, metadata) {
    return appendAuditLog(action, entityType, entityId, oldValue, newValue, metadata);
  }

  function formatSignupAuthError(error) {
    const code = String(error?.code || "");
    if (code.includes("email-already-in-use")) {
      return "That email is already in use. Try logging in or reset the password first.";
    }
    if (code.includes("invalid-email")) {
      return "Enter a valid email address.";
    }
    if (code.includes("weak-password")) {
      return "Choose a stronger password before starting the trial.";
    }
    if (code.includes("operation-not-allowed")) {
      return "Email and Password sign-in is not enabled in Firebase Authentication yet.";
    }
    if (code.includes("network-request-failed")) {
      return "We could not reach Firebase. Check your connection and try again.";
    }
    return error?.message || "We could not create your account right now.";
  }

  function formatLoginAuthError(error) {
    const code = String(error?.code || "");
    if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
      return "Check your email and password, then try again.";
    }
    if (code.includes("too-many-requests")) {
      return "Too many login attempts were made. Reset the password or wait a moment before trying again.";
    }
    if (code.includes("network-request-failed")) {
      return "We could not reach Firebase. Check your connection and try again.";
    }
    return error?.message || "We could not sign you in right now.";
  }

  function formatSignupFirestoreError(error) {
    const code = String(error?.code || "");
    if (code.includes("permission-denied")) {
      return "Firestore blocked the signup write. Deploy the updated Firestore rules and try again.";
    }
    if (code.includes("unavailable") || code.includes("network-request-failed")) {
      return "We reached Firebase Auth, but Firestore was unavailable while setting up the agency.";
    }
    return error?.message || "We could not finish creating the agency in Firestore.";
  }

  function findRecord(collection, id) {
    const source = state.session.mode === "demo" ? state.demoStore : state.cache;
    return (source[collection] || []).find(row => row.id === id) || null;
  }

  function loadDemoStore() {
    const parsed = safeJsonParse(window.localStorage.getItem(STORAGE_KEYS.demo));
    const seed = buildDemoSeed();
    if (parsed && typeof parsed === "object") {
      const merged = emptyStore();
      let changed = false;
      COLLECTIONS.forEach(collection => {
        if (Array.isArray(parsed[collection])) {
          merged[collection] = parsed[collection];
        } else {
          merged[collection] = deepClone(seed[collection] || []);
          changed = true;
        }
      });
      if (changed) {
        window.localStorage.setItem(STORAGE_KEYS.demo, JSON.stringify(merged));
      }
      return merged;
    }
    window.localStorage.setItem(STORAGE_KEYS.demo, JSON.stringify(seed));
    return seed;
  }

  function writeDemoStore(store) {
    window.localStorage.setItem(STORAGE_KEYS.demo, JSON.stringify(store));
  }

  function resetDemoStore() {
    const seed = buildDemoSeed();
    writeDemoStore(seed);
    state.demoStore = seed;
    state.cache = deepClone(seed);
  }

  function findDemoUserByRole(role, userId, workerId) {
    const users = state.demoStore.users || [];
    if (role === "worker" && workerId) {
      const workerUser = users.find(user => user.role === "worker" && user.workerId === workerId);
      if (workerUser) {
        return workerUser;
      }
      const worker = (state.demoStore.workers || []).find(item => item.id === workerId);
      const baseUser = users.find(user => user.role === "worker");
      if (worker && baseUser) {
        return {
          ...baseUser,
          id: `${baseUser.id}_${workerId}`,
          agencyId: worker.agencyId,
          workerId,
          firstName: worker.firstName,
          lastName: worker.lastName,
          email: worker.loginEmail || worker.email || baseUser.email,
          assignedClientIds: worker.assignedClientId ? [worker.assignedClientId] : [],
          assignedSiteIds: worker.assignedSiteId ? [worker.assignedSiteId] : []
        };
      }
    }
    if (userId) {
      const byId = users.find(user => user.id === userId);
      if (byId) {
        return byId;
      }
    }
    return users.find(user => user.role === role) || null;
  }

  function startDemoRole(role, options = {}) {
    const user = findDemoUserByRole(role, null, options.workerId);
    if (!user) {
      pushToast("That demo role is not available.", "warning");
      return;
    }
    state.session = buildSessionFromUser(user, "demo");
    persistSession();
  }

  function canManageWorkers() {
    return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role);
  }

  function canManageClients() {
    return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role);
  }

  function canManageSites() {
    return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role);
  }

  function canManageAssignments() {
    return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role);
  }

  function canManagePunches() {
    return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role);
  }

  function canReviewPunchRequests(record = null) {
    if (["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role)) {
      return true;
    }
    if (state.session.role !== "clientManager") {
      return false;
    }
    if (!record) {
      return true;
    }
    return recordMatchesAssignmentScope(record.clientId, record.siteId);
  }

  function canApproveRecord(record) {
    if (["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role)) {
      return true;
    }
    if (state.session.role !== "clientManager" || !record) {
      return false;
    }
    return recordMatchesAssignmentScope(record.clientId, record.siteId);
  }

  function canEditTimesheets(record) {
    return canApproveRecord(record);
  }

  function canViewMargin() {
    return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role);
  }

  function canManageUsers() {
    return ["platformOwner", "agencyOwner"].includes(state.session.role);
  }

  function canInviteClientManagers() {
    return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role);
  }

  function canManageBilling() {
    return ["platformOwner", "agencyOwner"].includes(state.session.role);
  }

  function canManageSettings() {
    return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role);
  }

  function canDeleteSampleData() {
    return ["platformOwner", "agencyOwner"].includes(state.session.role);
  }

  function canPermanentlyDeleteRecords() {
    return ["platformOwner", "agencyOwner"].includes(state.session.role);
  }

  function canDeleteAssignment() {
    return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role);
  }

  function canDeactivateEntity(entityType) {
    switch (entityType) {
      case "workers":
      case "clients":
      case "sites":
        return ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role);
      case "users":
        return ["platformOwner", "agencyOwner"].includes(state.session.role);
      default:
        return false;
    }
  }

  function recordMatchesAssignmentScope(clientId, siteId) {
    if (state.session.role !== "clientManager") {
      return false;
    }
    const clientIds = state.session.assignedClientIds || [];
    const siteIds = state.session.assignedSiteIds || [];
    return clientIds.includes(clientId) || siteIds.includes(siteId);
  }

  function canClientCorrectPunch(punch) {
    return !!punch && state.session.role === "clientManager" && recordMatchesAssignmentScope(punch.clientId, punch.siteId);
  }

  function showToast(message, type = "success") {
    pushToast(message, type);
  }

  function openModal(title, html, onSave, options = {}) {
    state.modal = {
      type: options.type || "custom-form",
      title,
      html,
      saveLabel: options.saveLabel || "Save",
      saveTone: options.saveTone || "button-primary",
      cancelLabel: options.cancelLabel || "Cancel",
      formName: options.formName || "custom-modal-save",
      onSave: typeof onSave === "function" ? onSave : null,
      size: options.size || "",
      message: options.message || "",
      readOnly: !!options.readOnly
    };
    renderApp();
  }

  function closeModal() {
    state.modal = null;
    renderApp();
  }

  function confirmAction(message, onConfirm, options = {}) {
    state.modal = {
      type: "confirm",
      title: options.title || "Confirm",
      message,
      confirmLabel: options.confirmLabel || "Confirm",
      cancelLabel: options.cancelLabel || "Cancel",
      confirmTone: options.confirmTone || "button-primary",
      onConfirm
    };
    renderApp();
  }

  function requirePermission(condition, message) {
    if (!condition) {
      throw new Error(message || "You do not have permission to do that.");
    }
  }

  async function handleAction(trigger) {
    const action = trigger.dataset.action;

    try {
      switch (action) {
        case "toggle-nav":
          state.mobileNavOpen = !state.mobileNavOpen;
          renderApp();
          break;
        case "close-nav":
          state.mobileNavOpen = false;
          renderApp();
          break;
        case "go-route":
          navigate(trigger.dataset.route || getHomeRoute());
          break;
        case "scroll-marketing-section":
          scrollToMarketingSection(trigger.dataset.section || "");
          break;
        case "book-live-demo":
          openLiveDemoRequest();
          break;
        case "reload-app":
          window.location.reload();
          break;
        case "logout":
          await handleLogout();
          break;
        case "demo-login":
          startDemoRole(trigger.dataset.role || "agencyOwner", { workerId: trigger.dataset.workerId });
          await refreshSessionData();
          navigate(getHomeRoute(), { replace: true });
          pushToast(`Opened ${ROLE_META[state.session.role].label} demo.`, "success");
          break;
        case "reset-demo":
          confirmAction("Reset the demo back to the original sample data?", async () => {
            resetDemoStore();
            if (state.session.mode === "demo") {
              await refreshCurrentView();
            } else {
              renderApp();
            }
            closeModal();
            pushToast("Demo data reset in this browser.", "success");
          }, {
            title: "Reset Demo Data",
            confirmLabel: "Reset Demo",
            confirmTone: "button-danger"
          });
          break;
        case "delete-sample-data":
          openDeleteSampleDataModal();
          break;
        case "repair-agency-access":
          await repairCurrentAgencyAccess();
          break;
        case "open-worker-form":
          requirePermission(canManageWorkers(), "Only agency owners, admins, or platform owners can edit workers.");
          state.modal = { type: "worker-form", workerId: trigger.dataset.workerId || "" };
          renderApp();
          break;
        case "view-worker":
          state.modal = { type: "worker-view", workerId: trigger.dataset.workerId || "" };
          renderApp();
          break;
        case "worker-history":
          state.modal = { type: "worker-history", workerId: trigger.dataset.workerId || "" };
          renderApp();
          break;
        case "deactivate-worker":
          await deactivateWorker(trigger.dataset.workerId || "");
          break;
        case "delete-worker":
          await requestWorkerDelete(trigger.dataset.workerId || "");
          break;
        case "open-client-form":
          requirePermission(canManageClients(), "Only agency owners, admins, or platform owners can edit clients.");
          state.modal = { type: "client-form", clientId: trigger.dataset.clientId || "" };
          renderApp();
          break;
        case "open-client-manager-invite":
          requirePermission(canInviteClientManagers(), "Only agency owners, agency admins, or platform owners can invite client managers.");
          openClientManagerInviteModal({
            clientId: trigger.dataset.clientId || "",
            siteId: trigger.dataset.siteId || ""
          });
          break;
        case "view-client-sites":
          openClientSitesModal(trigger.dataset.clientId || "");
          break;
        case "deactivate-client":
          await deactivateClient(trigger.dataset.clientId || "");
          break;
        case "delete-client":
          await requestClientDelete(trigger.dataset.clientId || "");
          break;
        case "open-site-form":
          requirePermission(canManageSites(), "Only agency owners, admins, or platform owners can edit sites.");
          state.modal = { type: "site-form", siteId: trigger.dataset.siteId || "" };
          renderApp();
          break;
        case "open-site-qr":
          openQrModal({ qrType: "site", siteId: trigger.dataset.siteId || "" });
          break;
        case "deactivate-site":
          await deactivateSite(trigger.dataset.siteId || "");
          break;
        case "delete-site":
          await requestSiteDelete(trigger.dataset.siteId || "");
          break;
        case "open-assignment-form":
          requirePermission(canManageAssignments(), "Only agency owners, admins, or platform owners can edit assignments.");
          openAssignmentModal(trigger.dataset.assignmentId || "");
          break;
        case "end-assignment":
          await endAssignment(trigger.dataset.assignmentId || "");
          break;
        case "delete-assignment":
          await requestAssignmentDelete(trigger.dataset.assignmentId || "");
          break;
        case "open-punch-form":
          requirePermission(canManagePunches(), "Only agency owners, admins, or platform owners can edit punches.");
          openPunchModal(trigger.dataset.punchId || "");
          break;
        case "fix-missing-clock-out":
          await fixMissingClockOut(trigger.dataset.workerId || "");
          break;
        case "open-punch-note":
          openPunchNoteModal(trigger.dataset.punchId || "");
          break;
        case "open-payroll-edit":
          state.modal = { type: "payroll-edit", timesheetId: trigger.dataset.timesheetId || "" };
          renderApp();
          break;
        case "open-approval-edit":
          openApprovalEditModal(trigger.dataset.timesheetId || "");
          break;
        case "open-client-time-edit":
          openClientTimecardCorrectionModal(trigger.dataset.timesheetId || "");
          break;
        case "open-client-missing-punch":
          openClientMissingPunchModal(trigger.dataset.timesheetId || "");
          break;
        case "view-approval":
          await logApprovalViewed(trigger.dataset.timesheetId || "");
          openApprovalDetailModal(trigger.dataset.timesheetId || "");
          break;
        case "copy-approval-link":
          await copyApprovalLink(trigger.dataset.approvalId || "", trigger.dataset.linkMode || "internal");
          break;
        case "email-approval-link":
          await emailApprovalLinkPlaceholder(trigger.dataset.approvalId || "");
          break;
        case "text-approval-link":
          await textApprovalLinkPlaceholder(trigger.dataset.approvalId || "");
          break;
        case "open-reject-modal":
          state.modal = {
            type: "reject-note",
            targetType: trigger.dataset.targetType || "timesheet",
            targetId: trigger.dataset.targetId || ""
          };
          renderApp();
          break;
        case "close-modal":
          closeModal();
          break;
        case "confirm-modal":
          if (state.modal?.type === "confirm" && typeof state.modal.onConfirm === "function") {
            await state.modal.onConfirm();
          }
          break;
        case "approve-timesheet":
          if (state.session.role === "clientManager") {
            openClientApprovalSignatureModal(trigger.dataset.timesheetId || "");
          } else {
            await approveTimesheet(trigger.dataset.timesheetId || "", "");
          }
          break;
        case "reject-timesheet":
          await rejectTimesheet(trigger.dataset.timesheetId || "", trigger.dataset.note || "");
          break;
        case "export-payroll-row":
          await copyTimesheetCsv(trigger.dataset.timesheetId || "");
          break;
        case "view-timesheet-history":
          openAuditHistoryModal("timesheets", trigger.dataset.timesheetId || "", "Timesheet History");
          break;
        case "open-margin-edit":
          openMarginEditModal(trigger.dataset.assignmentId || "", trigger.dataset.timesheetId || "");
          break;
        case "view-margin-breakdown":
          openMarginBreakdownModal(trigger.dataset.assignmentId || "", trigger.dataset.timesheetId || "");
          break;
        case "open-qr-form":
          openQrModal({
            qrType: trigger.dataset.qrType || "",
            workerId: trigger.dataset.workerId || "",
            siteId: trigger.dataset.siteId || ""
          });
          break;
        case "open-publish-punch-page":
          openPublishPunchPageModal(trigger.dataset.siteId || "");
          break;
        case "publish-site-to-punch-page":
          await publishSiteToPunchPage(trigger.dataset.siteId || "");
          break;
        case "deactivate-qr-link":
          await deactivateQrLink(trigger.dataset.qrType || "", trigger.dataset.recordId || "");
          break;
        case "open-user-form":
          requirePermission(canManageUsers(), "Only platform owners and agency owners can manage users.");
          openUserModal(trigger.dataset.userId || "");
          break;
        case "send-invite-email-placeholder":
        case "send-client-invite-email":
          await sendClientManagerInviteEmail({
            inviteId: trigger.dataset.inviteId || "",
            inviteToken: trigger.dataset.inviteToken || "",
            agencyId: trigger.dataset.agencyId || "",
            email: trigger.dataset.email || "",
            firstName: trigger.dataset.firstName || "",
            lastName: trigger.dataset.lastName || "",
            inviteUrl: trigger.dataset.link || ""
          });
          break;
        case "open-invite-email-draft":
          openInviteEmailDraft({
            inviteId: trigger.dataset.inviteId || "",
            inviteToken: trigger.dataset.inviteToken || "",
            agencyId: trigger.dataset.agencyId || "",
            email: trigger.dataset.email || "",
            firstName: trigger.dataset.firstName || "",
            lastName: trigger.dataset.lastName || "",
            inviteUrl: trigger.dataset.link || ""
          });
          break;
        case "magic-link-placeholder":
          pushToast("Passwordless email link sign-in is the next step. For now, use the invite link to set up email and password access.", "warning");
          break;
        case "revoke-client-invite":
          openRevokeClientInviteModal(trigger.dataset.inviteId || "");
          break;
        case "accept-client-invite":
          await acceptCurrentInvite();
          break;
        case "accept-demo-invite":
          await acceptCurrentInvite({ demoOnly: true });
          break;
        case "deactivate-user":
          await deactivateUser(trigger.dataset.userId || "");
          break;
        case "reset-password-user":
          await sendUserResetPassword(trigger.dataset.userId || "");
          break;
        case "punch-action":
          await capturePunch(trigger.dataset.punch || "");
          break;
        case "public-punch-action":
          try {
            await savePublicSitePunch(trigger.dataset.punch || "");
          } catch (error) {
            const requestedAction = String(trigger.dataset.punch || "").trim();
            const requestedAt = new Date();
            state.publicPunch = {
              ...(state.publicPunch || {}),
              saving: false,
              requestHelpMessage: "Punch didn't go through? Submit a punch request.",
              requestDraft: {
                requestedAction,
                requestedDate: formatDateInput(requestedAt),
                requestedTime: formatTimeInput(requestedAt)
              }
            };
            renderApp();
            const context = getPublicPunchContext();
            if (context.agencyId && context.companyId && context.siteId) {
              openPunchRequestModal();
              throw new Error("Punch could not be saved. Submit a punch request instead.");
            }
            throw error;
          }
          break;
        case "refresh-public-punch":
          state.publicPunch = {
            ...(state.publicPunch || {}),
            loading: true,
            error: ""
          };
          renderApp();
          await loadPublicPunchState();
          renderApp();
          pushToast("Punch stations refreshed.", "success");
          break;
        case "open-punch-request":
          openPunchRequestModal();
          break;
        case "approve-punch-request":
          await approvePunchRequest(trigger.dataset.requestId || "");
          break;
        case "reject-punch-request":
          await rejectPunchRequest(trigger.dataset.requestId || "");
          break;
        case "copy-link":
          await copyText(trigger.dataset.copy || "", trigger.dataset.copySuccess || "");
          break;
        case "download-qr-png":
          await downloadQrCardPng({
            qrKey: trigger.dataset.qrKey || "",
            link: trigger.dataset.link || "",
            fileName: trigger.dataset.fileName || "portaly-qr.png"
          });
          break;
        case "print-qr-card":
          await printQrCard({
            qrKey: trigger.dataset.qrKey || "",
            link: trigger.dataset.link || "",
            companyName: trigger.dataset.companyName || "",
            siteName: trigger.dataset.siteName || ""
          });
          break;
        case "copy-payroll-csv":
          await copyPayrollCsv(false);
          break;
        case "copy-payroll-excel":
          await copyPayrollCsv(true);
          break;
        case "select-plan":
          state.selectedPlan = trigger.dataset.plan || "agency";
          renderApp();
          break;
        case "start-checkout":
          await startBillingCheckout(trigger.dataset.plan || state.selectedPlan);
          break;
        case "upgrade-plan":
          await changeBillingPlan(trigger.dataset.plan || "", "upgrade");
          break;
        case "downgrade-plan":
          await changeBillingPlan(trigger.dataset.plan || "", "downgrade");
          break;
        case "pause-subscription":
          await handleSquareSubscriptionAction("pause");
          break;
        case "resume-subscription":
          await handleSquareSubscriptionAction("resume");
          break;
        case "reactivate-subscription":
          await handleSquareSubscriptionAction("reactivate");
          break;
        case "cancel-subscription":
          openCancelSubscriptionModal();
          break;
        case "manage-billing":
          await openBillingPortal();
          break;
        case "refresh-subscription":
          await refreshSubscriptionStatus();
          break;
        case "view-payment-history":
          openPaymentHistoryPlaceholder();
          break;
        case "update-payment-method":
          openPaymentMethodPlaceholder();
          break;
        case "privacy-placeholder":
          handleBillingPlaceholder("Privacy Policy will be published with your live Portaly workspace and legal review.");
          break;
        case "terms-placeholder":
          handleBillingPlaceholder("Terms of Service will be published with your live Portaly workspace and legal review.");
          break;
        case "open-support":
          openSupportPlaceholder();
          break;
        case "print-view":
          window.print();
          break;
        case "dismiss-notice":
          state.notice = "";
          storeNotice("");
          renderApp();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(error);
      pushToast(error.message || "We hit a snag.", "danger");
    }
  }

  async function handleFormSubmit(form) {
    const formName = form.dataset.form;
    const values = readFormValues(form);
    setFormBusyState(form, true);

    try {
      switch (formName) {
        case "login":
          await submitLogin(values);
          break;
        case "forgot-password":
          await submitForgotPassword(values);
          break;
        case "trial":
          await submitTrialSignup(values);
          break;
        case "complete-profile":
          await submitCompleteProfile(values);
          break;
        case "demo-access":
          await submitDemoAccess(values);
          break;
        case "client-manager-invite":
          await submitClientManagerInvite(values);
          break;
        case "accept-invite-create":
          await submitAcceptInviteCreate(values);
          break;
        case "accept-invite-login":
          await submitAcceptInviteLogin(values);
          break;
        case "worker-save":
          await saveWorkerForm(values);
          break;
        case "client-save":
          await saveClientForm(values);
          break;
        case "site-save":
          await saveSiteForm(values);
          break;
        case "assignment-save":
          await saveAssignmentForm(values);
          break;
        case "punch-save":
          await savePunchForm(values);
          break;
        case "punch-request-save":
          await savePunchRequestForm(values);
          break;
        case "payroll-save":
          await savePayrollForm(values);
          break;
        case "approval-hours-save":
          await saveApprovalHoursForm(values);
          break;
        case "qr-save":
          await saveQrForm(values);
          break;
        case "user-save":
          await saveUserForm(values);
          break;
        case "settings-save":
          await saveSettingsForm(values);
          break;
        case "reject-note":
          await submitRejectNote(values);
          break;
        case "custom-modal-save":
          if (state.modal?.type === "custom-form" && typeof state.modal.onSave === "function") {
            await state.modal.onSave(values);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      reportRuntimeIssue(`handleFormSubmit:${formName || "unknown"}`, error, {
        toastMessage: ""
      });
      pushToast(error.message || "We could not save that change.", "danger");
    } finally {
      setFormBusyState(form, false);
    }
  }

  function setFormBusyState(form, isBusy) {
    if (!form) {
      return;
    }
    form.dataset.busy = isBusy ? "true" : "false";
    form.setAttribute("aria-busy", isBusy ? "true" : "false");
    const submitControls = form.querySelectorAll('button[type="submit"], input[type="submit"]');
    submitControls.forEach(control => {
      control.disabled = !!isBusy;
    });
  }

  async function handleInputChange(target) {
    if (target.name === "liveStatus") {
      state.filters.liveStatus = target.value;
      renderApp();
      return;
    }

    if (target.name === "liveClient") {
      state.filters.liveClient = target.value;
      renderApp();
      return;
    }

    if (target.name === "liveSite") {
      state.filters.liveSite = target.value;
      renderApp();
      return;
    }

    if (target.name === "liveWorker") {
      state.filters.liveWorker = target.value;
      renderApp();
      return;
    }

    if (target.name === "liveAction") {
      state.filters.liveAction = target.value;
      renderApp();
      return;
    }

    if (target.name === "liveDateFrom") {
      state.filters.liveDateFrom = target.value;
      renderApp();
      return;
    }

    if (target.name === "liveDateTo") {
      state.filters.liveDateTo = target.value;
      renderApp();
      return;
    }

    if (target.name === "publicPunchAgencyId") {
      const nextAgencyId = String(target.value || "").trim();
      navigatePublicPunchRoute(nextAgencyId, "", "", { replace: true });
      return;
    }

    if (target.name === "publicPunchCompanyId") {
      const nextCompanyId = String(target.value || "").trim();
      const nextSiteId = state.publicPunch.siteId && (state.publicPunch.sites || []).some(site => site.id === state.publicPunch.siteId && site.clientId === nextCompanyId)
        ? state.publicPunch.siteId
        : "";
      navigatePublicPunchRoute(state.publicPunch.agencyId || "", nextCompanyId, nextSiteId, { replace: true });
      return;
    }

    if (target.name === "publicPunchSiteId") {
      const nextSiteId = String(target.value || "").trim();
      const matchedDirectory = state.publicPunch.directories.find(directory => directory.siteId === nextSiteId) || null;
      const matchedSite = (state.publicPunch.sites || []).find(site => site.id === nextSiteId) || null;
      navigatePublicPunchRoute(
        matchedDirectory?.agencyId || matchedSite?.agencyId || state.publicPunch.agencyId || "",
        matchedDirectory?.companyId || matchedSite?.clientId || state.publicPunch.companyId || "",
        nextSiteId,
        { replace: true }
      );
      return;
    }

    if (target.name === "publicPunchWorkerId") {
      const workerId = String(target.value || "").trim();
      const worker = (state.publicPunch.siteWorkers || state.publicPunch.directory?.publicWorkerOptions || []).find(option => option.id === workerId);
      const manualField = document.getElementById("public-punch-worker-name");
      if (worker && manualField instanceof HTMLInputElement) {
        manualField.value = worker.name;
      }
      return;
    }

    if (target.name === "payPeriod") {
      state.selectedPayPeriod = target.value;
      renderApp();
      return;
    }

    if (target.name === "roiWorkers" || target.name === "roiAdminHours" || target.name === "roiDisputes") {
      const nextValue = Number(target.value || 0);
      const safeValue = Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : 0;
      state.roi = {
        ...state.roi,
        workers: target.name === "roiWorkers" ? safeValue : state.roi.workers,
        adminHours: target.name === "roiAdminHours" ? safeValue : state.roi.adminHours,
        disputes: target.name === "roiDisputes" ? safeValue : state.roi.disputes
      };
      renderApp();
      return;
    }

    if (target.name === "primaryColor") {
      applyTheme(target.value || DEFAULT_BRAND);
    }
  }

  async function handleLogout() {
    const pendingInviteToken = state.route === "accept-invite"
      ? (parseInviteHash() || state.inviteFlow.token || getStoredPendingInviteToken())
      : "";
    console.log("[Portaly] handleLogout", {
      pendingInviteToken,
      route: state.route,
      authState: state.firebase.auth?.currentUser
        ? {
          uid: state.firebase.auth.currentUser.uid || "",
          email: state.firebase.auth.currentUser.email || ""
        }
        : null
    });
    state.modal = null;
    state.mobileNavOpen = false;
    if (state.session.mode === "cloud" && state.firebase.ready) {
      await state.firebase.auth.signOut();
      state.authUser = null;
    }
    state.profileRepair = null;
    setPublicSession();
    state.cache = emptyStore();
    if (pendingInviteToken) {
      await loadInviteFlowState(pendingInviteToken, { force: true });
      navigateInviteRoute(pendingInviteToken, { replace: true });
    } else {
      navigate("landing", { replace: true });
    }
    pushToast("You are signed out.", "success");
  }

  async function submitLogin(values) {
    if (!state.firebase.ready) {
      throw new Error(getFirebaseUnavailableMessage("Cloud Mode is not configured yet. Use Demo Mode until Firebase is enabled."));
    }

    if (!values.email || !values.password) {
      throw new Error("Enter your email and password.");
    }

    let result;
    try {
      result = await state.firebase.auth.signInWithEmailAndPassword(values.email, values.password);
    } catch (error) {
      throw new Error(formatLoginAuthError(error));
    }
    await establishCloudSession(result.user);
    await refreshSessionData();
    await flushOfflinePunchQueue({ silent: true });
    persistSession();

    if (state.profileRepair) {
      navigate("complete-profile", { replace: true });
      pushToast("Complete setup to create your agency workspace.", "warning");
      return;
    }

    if (state.pendingLink && state.pendingLink.type === "worker" && state.session.role === "worker" && state.session.workerId === state.pendingLink.workerId) {
      state.pendingLink = null;
      navigate("worker-punch", { replace: true });
      pushToast("Welcome back. Your punch screen is ready.", "success");
      return;
    }

    if (state.session.role === "clientManager") {
      await appendAuditLog("client_manager_login", "users", state.session.userId, null, {
        loginAt: new Date().toISOString(),
        via: "login"
      }, {
        actorId: state.session.userId,
        actorRole: "clientManager"
      });
    }

    navigate(getHomeRoute(), { replace: true });
    pushToast(`Logged in as ${ROLE_META[state.session.role].label}.`, "success");
  }

  async function submitForgotPassword(values) {
    if (!state.firebase.ready) {
      throw new Error(getFirebaseUnavailableMessage("Cloud Mode is not configured yet. Add Firebase first."));
    }

    if (!values.email) {
      throw new Error("Enter the email address for the account.");
    }

    await state.firebase.auth.sendPasswordResetEmail(values.email);
    pushToast("Password reset email sent.", "success");
    navigate("login", { replace: true });
  }

  async function submitDemoAccess(values) {
    const email = String(values.email || "").trim().toLowerCase();
    const companyName = String(values.companyName || "").trim();
    if (!email) {
      throw new Error("Enter your email so Portaly can send the demo login.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }

    await callSecureFunction("sendDemoAccessEmail", {
      email,
      companyName
    }, {
      requireAuth: false,
      errorMessage: "Portaly could not send demo access right now.",
      fallbackMessage: "Portaly could not send demo access right now.",
      networkErrorMessage: "Portaly could not reach the demo access email service."
    });

    state.demoAccess = {
      email,
      companyName,
      message: "Demo access sent. Check your email."
    };
    renderApp();
    pushToast("Demo access sent. Check your email.", "success");
  }

  async function submitTrialSignup(values) {
    if (!state.firebase.ready) {
      throw new Error(getFirebaseUnavailableMessage("Cloud Mode is not configured yet. Add your Firebase config first."));
    }
    console.log("[Portaly] Trial signup started");

    const required = ["agencyName", "ownerFirstName", "ownerLastName", "email", "phone", "password", "confirmPassword", "selectedPlan"];
    required.forEach(field => {
      if (!values[field]) {
        throw new Error("Please complete every required field.");
      }
    });

    if (values.password !== values.confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const selectedPlan = values.selectedPlan;
    const trialDays = Number((state.firebase.config && state.firebase.config.trialDays) || 14);
    const trialStart = new Date();
    const trialEnd = addDays(trialStart, trialDays);
    const trialStartedAt = trialStart.toISOString();
    const trialEndsAt = trialEnd.toISOString();
    const agencyId = createId("agency");
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const agencySettings = buildAgencySettings({
      agencyName: values.agencyName,
      logoInitials: initials(values.agencyName),
      primaryColor: DEFAULT_BRAND,
      supportEmail: values.email,
      supportPhone: values.phone,
      payrollContact: values.email,
      defaultPayPeriod: "Weekly"
    });

    let authResult;
    try {
      authResult = await state.firebase.auth.createUserWithEmailAndPassword(values.email, values.password);
      console.log("[Portaly] Auth user created UID", authResult.user.uid);
    } catch (error) {
      throw new Error(formatSignupAuthError(error));
    }

    const uid = authResult.user.uid;
    const authEmail = authResult.user.email || values.email;

    const agencyDoc = {
      id: agencyId,
      name: values.agencyName,
      ownerUserId: uid,
      status: "trial",
      planId: selectedPlan,
      subscriptionStatus: "trialing",
      trialStart: trialStartedAt,
      trialEnd: trialEndsAt,
      trialStartedAt,
      trialEndsAt,
      billingProvider: "square",
      squareCustomerId: "",
      squareSubscriptionId: "",
      createdAt,
      updatedAt,
      settings: agencySettings
    };

    const userDoc = {
      id: uid,
      agencyId,
      role: "agencyOwner",
      firstName: values.ownerFirstName,
      lastName: values.ownerLastName,
      email: authEmail,
      phone: values.phone,
      status: "active",
      assignedClientIds: [],
      assignedSiteIds: [],
      workerId: "",
      createdAt,
      updatedAt
    };

    const settingDoc = {
      id: agencyId,
      agencyId,
      trialDays,
      ...agencySettings,
      createdAt,
      updatedAt
    };

    const subscriptionDoc = {
      id: agencyId,
      agencyId,
      billingProvider: "square",
      squareCustomerId: "",
      squareSubscriptionId: "",
      planId: selectedPlan,
      status: "trialing",
      currentPeriodStart: "",
      currentPeriodEnd: "",
      trialStart: trialStartedAt,
      trialEnd: trialEndsAt,
      trialStartedAt,
      trialEndsAt,
      createdAt,
      updatedAt
    };

    try {
      console.log("[Portaly] Creating Firestore workspace docs", {
        agencyId,
        userId: uid,
        selectedPlan
      });
      const batch = state.firebase.db.batch();
      batch.set(state.firebase.db.collection("agencies").doc(agencyId), agencyDoc);
      batch.set(state.firebase.db.collection("users").doc(uid), userDoc);
      batch.set(state.firebase.db.collection("settings").doc(agencyId), settingDoc);
      batch.set(state.firebase.db.collection("subscriptions").doc(agencyId), subscriptionDoc);
      await batch.commit();
      console.log("[Portaly] Firestore batch committed", {
        agencyId,
        userId: uid
      });
    } catch (error) {
      console.error("[Portaly] Trial signup Firestore batch failed", error);
      state.authUser = authResult.user;
      state.profileRepair = {
        uid,
        email: values.email,
        agencyId,
        prefill: {
          agencyName: values.agencyName,
          ownerFirstName: values.ownerFirstName,
          ownerLastName: values.ownerLastName,
          phone: values.phone,
          selectedPlan
        }
      };
      setPublicSession();
      state.cache = emptyStore();
      navigate("complete-profile", { replace: true });
      pushToast("Your login was created, but your workspace setup was not completed. Finish setting up your Portaly workspace here.", "warning");
      return;
    }

    let sampleDataError = null;
    if (values.loadSampleData === "on") {
      try {
        await loadSampleDataIntoCloud(agencyId, uid, values.agencyName, selectedPlan);
      } catch (error) {
        console.error(error);
        sampleDataError = error;
      }
    }

    console.log("[Portaly] Establishing cloud session");
    await establishCloudSession(authResult.user);
    await refreshSessionData();
    syncOwnerClockState({ agencyId });
    await flushOfflinePunchQueue({ silent: true });
    navigatePublicPunchRoute(agencyId, "", "", { replace: true });
    if (sampleDataError) {
      pushToast("Your free trial is ready, but sample data could not be loaded.", "warning");
      return;
    }
    pushToast(`Your ${trialDays}-day free trial is ready.`, "success");
  }

  async function submitCompleteProfile(values) {
    if (!state.firebase.ready) {
      throw new Error(getFirebaseUnavailableMessage("Cloud Mode is not configured yet. Add your Firebase config first."));
    }
    console.log("[Portaly] Complete profile started");

    const authUser = state.authUser || state.firebase.auth?.currentUser || null;
    if (!authUser) {
      throw new Error("Sign in first so Portaly can finish creating your workspace.");
    }

    const required = ["agencyName", "ownerFirstName", "ownerLastName", "phone", "selectedPlan"];
    required.forEach(field => {
      if (!values[field]) {
        throw new Error("Please complete every required field.");
      }
    });

    const uid = authUser.uid;
    const email = authUser.email || values.email || "";
    const existingAgency = await findAgencyOwnedBy(uid);
    const trialDays = Number((state.firebase.config && state.firebase.config.trialDays) || 14);
    const nowIso = new Date().toISOString();
    const trialStartIso = existingAgency?.trialStart || nowIso;
    const trialEndIso = existingAgency?.trialEnd || addDays(new Date(trialStartIso), trialDays).toISOString();
    const userCreatedAt = (await loadCloudUserProfile(uid))?.createdAt || nowIso;
    const agencyCreatedAt = existingAgency?.createdAt || nowIso;
    const updatedAt = nowIso;
    const agencyId = state.profileRepair?.agencyId || existingAgency?.id || createId("agency");
    const agencySettings = buildAgencySettings({
      agencyName: values.agencyName,
      logoInitials: initials(values.agencyName),
      primaryColor: DEFAULT_BRAND,
      supportEmail: email,
      supportPhone: values.phone,
      payrollContact: email,
      defaultPayPeriod: "Weekly"
    });
    const existingSettings = await findAgencyScopedRecord("settings", agencyId);
    const existingSubscription = await findAgencyScopedRecord("subscriptions", agencyId);

    const userDoc = {
      id: uid,
      agencyId,
      role: "agencyOwner",
      firstName: values.ownerFirstName,
      lastName: values.ownerLastName,
      email,
      phone: values.phone,
      status: "active",
      assignedClientIds: [],
      assignedSiteIds: [],
      workerId: "",
      createdAt: userCreatedAt,
      updatedAt
    };

    const agencyDoc = {
      id: agencyId,
      name: values.agencyName,
      ownerUserId: uid,
      status: "trial",
      planId: values.selectedPlan,
      subscriptionStatus: "trialing",
      trialStart: trialStartIso,
      trialEnd: trialEndIso,
      trialStartedAt: trialStartIso,
      trialEndsAt: trialEndIso,
      billingProvider: "square",
      squareCustomerId: existingAgency?.squareCustomerId || "",
      squareSubscriptionId: existingAgency?.squareSubscriptionId || "",
      createdAt: agencyCreatedAt,
      updatedAt,
      settings: agencySettings
    };

    const settingDoc = {
      id: agencyId,
      agencyId,
      trialDays: Number(existingSettings?.trialDays || trialDays),
      ...agencySettings,
      createdAt: existingSettings?.createdAt || agencyCreatedAt,
      updatedAt
    };

    const subscriptionDoc = {
      id: agencyId,
      agencyId,
      billingProvider: "square",
      squareCustomerId: existingSubscription?.squareCustomerId || "",
      squareSubscriptionId: existingSubscription?.squareSubscriptionId || "",
      planId: values.selectedPlan,
      status: "trialing",
      currentPeriodStart: existingSubscription?.currentPeriodStart || "",
      currentPeriodEnd: existingSubscription?.currentPeriodEnd || "",
      trialStart: trialStartIso,
      trialEnd: trialEndIso,
      trialStartedAt: existingSubscription?.trialStartedAt || trialStartIso,
      trialEndsAt: existingSubscription?.trialEndsAt || trialEndIso,
      createdAt: existingSubscription?.createdAt || agencyCreatedAt,
      updatedAt
    };

    try {
      console.log("[Portaly] Creating Firestore workspace docs", {
        agencyId,
        userId: uid,
        selectedPlan: values.selectedPlan
      });
      const batch = state.firebase.db.batch();
      batch.set(state.firebase.db.collection("agencies").doc(agencyId), agencyDoc);
      batch.set(state.firebase.db.collection("users").doc(uid), userDoc);
      batch.set(state.firebase.db.collection("settings").doc(agencyId), settingDoc);
      batch.set(state.firebase.db.collection("subscriptions").doc(agencyId), subscriptionDoc);
      await batch.commit();
      console.log("[Portaly] Firestore batch committed", {
        agencyId,
        userId: uid
      });
    } catch (error) {
      console.error("[Portaly] Complete profile failed", {
        error,
        agencyId,
        userId: uid,
        existingAgencyId: existingAgency?.id || ""
      });
      throw new Error(`We could not finish your workspace setup. ${formatSignupFirestoreError(error)}`);
    }

    let sampleDataError = null;
    if (values.loadSampleData === "on") {
      try {
        await loadSampleDataIntoCloud(agencyId, uid, values.agencyName, values.selectedPlan);
      } catch (error) {
        console.error(error);
        sampleDataError = error;
      }
    }

    state.profileRepair = null;
    console.log("[Portaly] Establishing cloud session");
    await establishCloudSession(authUser);
    await refreshSessionData();
    syncOwnerClockState({ agencyId });
    await flushOfflinePunchQueue({ silent: true });
    navigatePublicPunchRoute(agencyId, "", "", { replace: true });
    if (sampleDataError) {
      pushToast("Your workspace is ready, but sample data could not be loaded.", "warning");
      return;
    }
    console.log("[Portaly] Complete profile success", {
      agencyId,
      userId: uid
    });
    pushToast("Your agency workspace is ready.", "success");
  }

  async function findAgencyOwnedBy(ownerUserId) {
    if (!state.firebase.ready || !ownerUserId) {
      return null;
    }
    try {
      const snapshot = await state.firebase.db.collection("agencies").where("ownerUserId", "==", ownerUserId).limit(1).get();
      const record = snapshot.docs && snapshot.docs[0];
      return record ? { id: record.id, ...record.data() } : null;
    } catch (error) {
      console.error("[Portaly] findAgencyOwnedBy failed", {
        ownerUserId,
        error
      });
      return null;
    }
  }

  async function findAgencyScopedRecord(collectionName, agencyId) {
    if (!state.firebase.ready || !agencyId) {
      return null;
    }
    try {
      const directSnapshot = await state.firebase.db.collection(collectionName).doc(agencyId).get();
      if (directSnapshot.exists) {
        return { id: directSnapshot.id, ...directSnapshot.data() };
      }
      const snapshot = await state.firebase.db.collection(collectionName).where("agencyId", "==", agencyId).limit(1).get();
      const record = snapshot.docs && snapshot.docs[0];
      return record ? { id: record.id, ...record.data() } : null;
    } catch (error) {
      console.error("[Portaly] findAgencyScopedRecord failed", {
        collectionName,
        agencyId,
        error
      });
      return null;
    }
  }

  async function loadSampleDataIntoCloud(agencyId, ownerUserId, agencyName, planId) {
    const bundle = buildCloudSampleBundle({
      agencyId,
      ownerUserId,
      agencyName,
      planId
    });

    const batch = state.firebase.db.batch();
    Object.entries(bundle).forEach(([collection, rows]) => {
      if (["agencies", "settings", "subscriptions"].includes(collection)) {
        return;
      }
      rows.forEach(row => {
        batch.set(state.firebase.db.collection(collection).doc(row.id), row);
      });
    });
    await batch.commit();
  }

  async function saveWorkerForm(values) {
    requirePermission(canManageWorkers(), "Only agency owners, admins, or platform owners can edit workers.");
    const workerId = values.id || createId("worker");
    const existing = findRecord("workers", workerId);
    const isNewWorker = !existing;
    const willBeActive = values.status !== "inactive";
    const now = new Date().toISOString();
    const agencyId = values.agencyId || existing?.agencyId || state.session.agencyId || state.session.agency?.id || "";
    enforcePlanLimit("worker", willBeActive, existing);

    if (!agencyId) {
      throw new Error("Your agency workspace is not loaded. Please log out and log back in.");
    }

    const worker = {
      agencyId,
      firstName: values.firstName || "",
      lastName: values.lastName || "",
      phone: values.phone || "",
      email: values.email || "",
      payRate: Number(values.payRate || 0),
      status: values.status || "active",
      assignedClientId: values.assignedClientId || "",
      assignedSiteId: values.assignedSiteId || "",
      workerNoteType: normalizeWorkerNoteType(values.workerNoteType || existing?.workerNoteType || ""),
      notes: values.notes || "",
      terminationReason: values.terminationReason || "",
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    await saveData("workers", workerId, worker);
    await syncTimesheetPayRates(workerId, worker.payRate);
    if (existing?.userId) {
      await syncLinkedUserFromWorker(existing.userId, { ...existing, ...worker });
    }
    await syncPunchDirectoriesForWorker({ id: workerId, ...worker }, existing);
    await appendAuditLog("worker_saved", "workers", workerId, existing, worker);
    state.modal = null;
    await refreshCurrentView();
    if (isNewWorker && worker.assignedSiteId) {
      syncOwnerClockState({
        agencyId,
        companyId: worker.assignedClientId || "",
        siteId: worker.assignedSiteId || ""
      });
      navigatePublicPunchRoute(agencyId, worker.assignedClientId || "", worker.assignedSiteId || "", { replace: true });
      pushToast("Worker added successfully and loaded on the clock page.", "success");
      return;
    }
    pushToast(existing ? "Worker updated successfully." : "Worker added successfully.", "success");
  }

  async function syncTimesheetPayRates(workerId, payRate) {
    const timesheets = getScopedData().timesheets.filter(timesheet => timesheet.workerId === workerId);
    await Promise.all(timesheets.map(timesheet => updateData("timesheets", timesheet.id, { payRate })));
  }

  async function saveClientForm(values) {
    requirePermission(canManageClients(), "Only agency owners, admins, or platform owners can edit clients.");
    const clientId = values.id || createId("client");
    const existing = findRecord("clients", clientId);
    const now = new Date().toISOString();
    const agencyId = values.agencyId || existing?.agencyId || state.session.agencyId || state.session.agency?.id || "";
    console.log("[Portaly] saveClientForm state.session", state.session);
    console.log("[Portaly] saveClientForm role", state.session.role);
    console.log("[Portaly] saveClientForm agencyId", agencyId);
    if (!agencyId) {
      throw new Error("Your agency workspace is not loaded. Please log out and log back in.");
    }
    const client = {
      agencyId,
      name: values.name || "",
      contactName: values.contactName || "",
      contactEmail: values.contactEmail || "",
      phone: values.phone || "",
      status: values.status || "active",
      billingContact: values.billingContact || "",
      notes: values.notes || "",
      internalNotes: values.internalNotes || "",
      clientVisibleNotes: values.clientVisibleNotes || "",
      createdBy: existing?.createdBy || state.session.userId || "",
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
    console.log("[Portaly] saveClientForm payload", client);
    await saveData("clients", clientId, client);
    await syncPunchDirectoriesForClient(clientId);
    await appendAuditLog("client_saved", "clients", clientId, existing, client);
    state.modal = null;
    await refreshCurrentView();
    pushToast(existing ? "Client updated successfully." : "Client added successfully.", "success");
  }

  async function saveSiteForm(values) {
    requirePermission(canManageSites(), "Only agency owners, admins, or platform owners can edit sites.");
    const siteId = values.id || createId("site");
    const existing = findRecord("sites", siteId);
    const willBeActive = values.status !== "inactive";
    const now = new Date().toISOString();
    const agencyId = values.agencyId || existing?.agencyId || state.session.agencyId || state.session.agency?.id || "";
    enforcePlanLimit("site", willBeActive, existing);

    if (!agencyId) {
      throw new Error("Your agency workspace is not loaded. Please log out and log back in.");
    }

    const site = {
      agencyId,
      clientId: values.clientId || "",
      name: values.name || "",
      address: values.address || "",
      city: values.city || "",
      state: values.state || "",
      zip: values.zip || "",
      siteContact: values.siteContact || "",
      sitePhone: values.sitePhone || "",
      qrCodeUrl: values.qrCodeUrl || existing?.qrCodeUrl || buildSiteLink(siteId, {
        agencyId,
        clientId: values.clientId || existing?.clientId || ""
      }),
      qrEnabled: values.qrEnabled ? values.qrEnabled === "true" || values.qrEnabled === "on" : existing?.qrEnabled !== false,
      qrExpiresAt: values.qrExpiresAt || existing?.qrExpiresAt || "",
      qrNotes: values.qrNotes || existing?.qrNotes || "",
      notes: values.notes || "",
      status: values.status || "active",
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
    await saveData("sites", siteId, site);
    await saveSitePunchDirectory({ id: siteId, ...site });
    await appendAuditLog("site_saved", "sites", siteId, existing, site);
    state.modal = null;
    await refreshCurrentView();
    pushToast(existing ? "Site updated successfully." : "Site added successfully.", "success");
  }

  async function saveAssignmentForm(values) {
    requirePermission(canManageAssignments(), "Only agency owners, admins, or platform owners can edit assignments.");
    const assignmentId = values.id || createId("assignment");
    const existing = findRecord("assignments", assignmentId);
    const isNewAssignment = !existing;
    const now = new Date().toISOString();
    const agencyId = values.agencyId || existing?.agencyId || state.session.agencyId || state.session.agency?.id || "";

    if (!agencyId) {
      throw new Error("Your agency workspace is not loaded. Please log out and log back in.");
    }

    const assignment = {
      agencyId,
      workerId: values.workerId || "",
      clientId: values.clientId || "",
      siteId: values.siteId || "",
      startDate: values.startDate ? new Date(values.startDate).toISOString() : existing?.startDate || new Date().toISOString(),
      endDate: values.endDate ? new Date(values.endDate).toISOString() : "",
      payRate: Number(values.payRate || 0),
      billRate: Number(values.billRate || 0),
      status: values.status || "active",
      shiftSchedule: values.shiftSchedule || "",
      notes: values.notes || "",
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
    await saveData("assignments", assignmentId, assignment);
    await syncWorkerFromAssignment(assignment);
    await syncTimesheetsFromAssignment(assignmentId, assignment);
    await appendAuditLog(existing ? "assignment_updated" : "assignment_created", "assignments", assignmentId, existing, assignment);
    state.modal = null;
    await refreshCurrentView();
    if (isNewAssignment && assignment.siteId) {
      syncOwnerClockState({
        agencyId,
        companyId: assignment.clientId || "",
        siteId: assignment.siteId || ""
      });
      navigatePublicPunchRoute(agencyId, assignment.clientId || "", assignment.siteId || "", { replace: true });
      pushToast("Assignment saved and loaded on the clock page.", "success");
      return;
    }
    pushToast(existing ? "Assignment updated successfully." : "Assignment added successfully.", "success");
  }

  async function savePunchForm(values) {
    requirePermission(canManagePunches(), "Only agency owners, admins, or platform owners can edit punches.");
    const punchId = values.id || createId("punch");
    const existing = findRecord("punches", punchId);
    const editReason = values.editReason || values.reason || "";
    if (existing && !editReason) {
      throw new Error("Manual punch edits require a reason.");
    }

    const worker = getWorker(values.workerId || existing?.workerId || "");
    if (!worker) {
      throw new Error("Choose a worker before saving the punch.");
    }

    const assignment = getAssignmentsForWorker(worker.id).find(item => item.siteId === (values.siteId || worker.assignedSiteId)) || getAssignmentsForWorker(worker.id)[0];
    const punchDate = values.punchDate || formatDateInput(existing?.timestamp || state.now);
    const punchTime = values.punchTime || formatTimeInput(existing?.timestamp || state.now);
    const timestamp = new Date(`${punchDate}T${punchTime}:00`).toISOString();
    if (isDuplicatePunchAction(worker.id, values.action || existing?.action || "clockIn", timestamp, existing?.id || "")) {
      throw new Error("This punch looks like a duplicate of another recent punch for the same worker.");
    }
    const punch = {
      agencyId: worker.agencyId || existing?.agencyId || state.session.agencyId || state.session.agency?.id,
      workerId: worker.id,
      workerName: fullName(worker),
      assignmentId: assignment?.id || existing?.assignmentId || "",
      clientId: values.clientId || worker.assignedClientId || assignment?.clientId || "",
      clientName: getClientName(values.clientId || worker.assignedClientId || assignment?.clientId || ""),
      siteId: values.siteId || worker.assignedSiteId || assignment?.siteId || "",
      siteName: getSiteName(values.siteId || worker.assignedSiteId || assignment?.siteId || ""),
      action: values.action || existing?.action || "clockIn",
      timestamp,
      source: existing?.source || (state.session.mode === "cloud" ? "cloud" : "demo"),
      createdBy: existing?.createdBy || state.session.userId || "manual-admin",
      edited: !!existing || !!editReason,
      notes: values.notes || "",
      editReason
    };

    await saveData("punches", punchId, punch);
    await appendAuditLog(existing ? "punch_edited" : "manual_punch_added", "punches", punchId, existing, punch);
    state.modal = null;
    await refreshCurrentView();
    pushToast(existing ? "Punch updated successfully." : "Manual punch added successfully.", "success");
  }

  async function savePayrollForm(values) {
    const existing = findRecord("timesheets", values.id);
    if (!existing) {
      throw new Error("That timesheet could not be found.");
    }
    const overrideReason = String(values.overrideReason || "").trim();
    if (existing.status === "approved" && ["platformOwner", "agencyOwner", "agencyAdmin"].includes(state.session.role) && !overrideReason) {
      throw new Error("Approved timecards require an admin override reason before editing.");
    }

    const updated = {
      approvedHours: Number(values.approvedHours || 0),
      regularHours: Number(values.regularHours || 0),
      overtimeHours: Number(values.overtimeHours || 0),
      payRate: Number(values.payRate || 0),
      workerId: values.workerId || existing.workerId,
      clientId: values.clientId || existing.clientId,
      siteId: values.siteId || existing.siteId,
      status: values.status || existing.status,
      adminNotes: values.adminNotes || existing.adminNotes || "",
      clientNotes: values.clientNotes || existing.clientNotes || ""
    };
    if (overrideReason) {
      updated.adminNotes = [updated.adminNotes, `Override reason: ${overrideReason}`].filter(Boolean).join("\n");
    }

    await updateData("timesheets", existing.id, updated);
    const approvalRecord = getScopedData().approvals.find(approval => approval.timesheetId === existing.id);
    if (approvalRecord) {
      await updateData("approvals", approvalRecord.id, {
        workerId: updated.workerId,
        clientId: updated.clientId,
        siteId: updated.siteId,
        note: updated.clientNotes || updated.adminNotes || approvalRecord.note || ""
      });
    }
    await appendAuditLog(existing.status === "approved" && overrideReason ? "approval_overridden" : "timesheet_edited", "timesheets", existing.id, existing, updated, {
      reason: overrideReason,
      actorId: state.session.userId,
      actorRole: state.session.role
    });
    state.modal = null;
    await refreshCurrentView();
    pushToast("Payroll row updated.", "success");
  }

  async function saveApprovalHoursForm(values) {
    const timesheet = findRecord("timesheets", values.id);
    if (!timesheet) {
      throw new Error("That timesheet could not be found.");
    }
    requirePermission(canEditTimesheets(timesheet), "You do not have permission to edit these hours.");

    const nowIso = new Date().toISOString();
    const clientEditReason = values.clientEditReason || values.correctionReason || "";
    const overrideReason = String(values.overrideReason || "").trim();
    if (state.session.role === "clientManager" && !clientEditReason) {
      throw new Error("Choose a correction reason before saving.");
    }
    if (state.session.role === "clientManager" && timesheet.status === "approved") {
      throw new Error("This timecard is locked after approval. Ask the agency admin for an override.");
    }
    if (state.session.role !== "clientManager" && timesheet.status === "approved" && !overrideReason) {
      throw new Error("Approved timecards require an admin override reason before editing.");
    }

    const updated = {
      approvedHours: Number(values.approvedHours || 0),
      regularHours: Number(values.regularHours || 0),
      overtimeHours: Number(values.overtimeHours || 0),
      status: values.status || timesheet.status,
      adminNotes: values.adminNotes || timesheet.adminNotes || "",
      clientNotes: values.clientNotes || timesheet.clientNotes || "",
      updatedAt: nowIso
    };

    if (state.session.role === "clientManager") {
      updated.clientEdited = true;
      updated.clientEditedBy = state.session.userId;
      updated.clientEditedAt = nowIso;
      updated.clientEditReason = clientEditReason;
      updated.originalApprovedHours = timesheet.originalApprovedHours ?? Number(timesheet.approvedHours || 0);
      updated.originalRegularHours = timesheet.originalRegularHours ?? Number(timesheet.regularHours || 0);
      updated.originalOvertimeHours = timesheet.originalOvertimeHours ?? Number(timesheet.overtimeHours || 0);
    } else if (overrideReason) {
      updated.adminNotes = [updated.adminNotes, `Override reason: ${overrideReason}`].filter(Boolean).join("\n");
    }

    await updateData("timesheets", timesheet.id, updated);
    const approvalRecord = getScopedData().approvals.find(approval => approval.timesheetId === timesheet.id);
    if (approvalRecord) {
      await updateData("approvals", approvalRecord.id, state.session.role === "clientManager" ? {
        note: values.clientNotes || values.adminNotes || approvalRecord.note || "",
        clientEdited: true,
        clientEditedBy: state.session.userId,
        clientEditedAt: nowIso,
        clientEditReason: clientEditReason
      } : {
        note: values.clientNotes || values.adminNotes || approvalRecord.note || ""
      });
    }
    await appendAuditLog(state.session.role === "clientManager"
      ? "client_timecard_corrected"
      : (timesheet.status === "approved" && overrideReason ? "approval_overridden" : "timesheet_hours_edited"), "timesheets", timesheet.id, timesheet, updated, {
      reason: clientEditReason || overrideReason,
      actorId: state.session.userId,
      actorRole: state.session.role,
      createdAt: nowIso
    });
    state.modal = null;
    await refreshCurrentView();
    pushToast(state.session.role === "clientManager" ? "Timecard correction saved." : "Timesheet hours updated.", "success");
  }

  async function saveQrForm(values) {
    requirePermission(canManageSites() || canManageWorkers(), "Only agency owners, admins, or platform owners can change QR links.");
    const qrType = values.qrTypeSelect || values.qrType || "worker";
    if (qrType === "worker") {
      const worker = findRecord("workers", values.workerId);
      if (!worker) {
        throw new Error("Choose a worker before saving the QR link.");
      }
      const next = {
        assignedClientId: values.clientId || worker.assignedClientId || "",
        assignedSiteId: values.siteId || worker.assignedSiteId || "",
        qrCodeUrl: buildWorkerLink(worker.id),
        qrEnabled: true,
        qrExpiresAt: values.qrExpiresAt ? new Date(values.qrExpiresAt).toISOString() : "",
        qrNotes: values.qrNotes || ""
      };
      await updateData("workers", worker.id, next);
      await appendAuditLog("worker_qr_saved", "workers", worker.id, worker, { ...worker, ...next });
      state.modal = null;
      await refreshCurrentView();
      pushToast("Worker QR link saved.", "success");
      return;
    }

    const site = findRecord("sites", values.siteId);
    if (!site) {
      throw new Error("Choose a site before saving the QR link.");
    }
    const next = {
      clientId: values.clientId || site.clientId || "",
      qrCodeUrl: buildSiteLink(site.id, {
        agencyId: site.agencyId || state.session.agencyId || state.session.agency?.id || "",
        clientId: values.clientId || site.clientId || ""
      }),
      qrEnabled: true,
      qrExpiresAt: values.qrExpiresAt ? new Date(values.qrExpiresAt).toISOString() : "",
      qrNotes: values.qrNotes || ""
    };
    await updateData("sites", site.id, next);
    await saveSitePunchDirectory({ ...site, ...next, id: site.id });
    await appendAuditLog("site_qr_saved", "sites", site.id, site, { ...site, ...next });
    state.modal = null;
    await refreshCurrentView();
    pushToast("Site QR link saved.", "success");
  }

  async function saveUserForm(values) {
    requirePermission(canManageUsers(), "Only platform owners and agency owners can manage users.");
    const existing = values.id ? findRecord("users", values.id) : null;
    if (!existing && values.role === "clientManager") {
      await submitClientManagerInvite({
        ...values,
        assignedClientIds: values.assignedClientId || "",
        assignedSiteIds: values.assignedSiteId || ""
      });
      return;
    }
    let userId = values.id || createId("user");
    let inviteMessage = "";

    if (!existing && state.session.mode === "cloud") {
      const created = await createCloudInviteProfile(values.email || "", values);
      userId = created.userId;
      inviteMessage = created.notice;
    }

    const user = {
      agencyId: values.agencyId || existing?.agencyId || state.session.agencyId || state.session.agency?.id,
      role: values.role || "agencyAdmin",
      firstName: values.firstName || "",
      lastName: values.lastName || "",
      email: values.email || "",
      phone: values.phone || "",
      status: values.status || (existing?.status || "active"),
      assignedClientIds: values.assignedClientId ? [values.assignedClientId] : [],
      assignedSiteIds: values.assignedSiteId ? [values.assignedSiteId] : [],
      workerId: values.workerId || ""
    };

    await saveData("users", userId, user);
    if (user.workerId) {
      const linkedWorker = findRecord("workers", user.workerId);
      if (linkedWorker) {
        await updateData("workers", linkedWorker.id, {
          userId,
          loginEmail: user.email || linkedWorker.loginEmail || linkedWorker.email || "",
          assignedClientId: user.assignedClientIds[0] || linkedWorker.assignedClientId || "",
          assignedSiteId: user.assignedSiteIds[0] || linkedWorker.assignedSiteId || ""
        });
      }
    }
    await appendAuditLog(existing ? "user_updated" : "user_created", "users", userId, existing, user);
    state.modal = null;
    await refreshCurrentView();
    pushToast(existing ? "User updated successfully." : inviteMessage || "User invited successfully.", "success");
  }

  async function saveSettingsForm(values) {
    requirePermission(canManageSettings(), "Only platform owners, agency owners, or agency admins can edit settings.");
    const settingsRecord = getCurrentSettings();
    const agency = getCurrentAgency();
    const nextSettings = buildAgencySettings({
      agencyName: values.agencyName || agency?.name || "Portaly Agency",
      logoInitials: values.logoInitials || initials(values.agencyName || agency?.name || "Portaly"),
      primaryColor: values.primaryColor || DEFAULT_BRAND,
      supportEmail: values.supportEmail || DEFAULT_SUPPORT_EMAIL,
      supportPhone: values.supportPhone || DEFAULT_SUPPORT_PHONE,
      payrollContact: values.payrollContact || values.supportEmail || DEFAULT_SUPPORT_EMAIL,
      defaultPayPeriod: values.defaultPayPeriod || "Weekly",
      timezone: values.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
      weekStartDay: values.weekStartDay || "Monday"
    });

    if (agency) {
      await updateData("agencies", agency.id, {
        name: nextSettings.agencyName,
        settings: nextSettings
      });
    }

    let savedSettings = settingsRecord;
    if (settingsRecord) {
      savedSettings = await updateData("settings", settingsRecord.id, nextSettings);
    } else {
      const settingsId = agency?.id || state.session.agencyId || state.session.agency?.id || createId("setting");
      savedSettings = await saveData("settings", settingsId, {
        agencyId: agency?.id || state.session.agencyId || state.session.agency?.id,
        ...nextSettings
      });
    }

    await appendAuditLog("settings_saved", "settings", savedSettings?.id || settingsRecord?.id || "new", settingsRecord, savedSettings || nextSettings);
    await refreshCurrentView();
    applyTheme(nextSettings.primaryColor);
    pushToast("Settings saved.", "success");
  }

  function openDeleteSampleDataModal() {
    requirePermission(canDeleteSampleData(), "Only agency owners or platform owners can delete sample data.");
    const agencies = state.session.role === "platformOwner"
      ? ((state.cache.agencies && state.cache.agencies.length ? state.cache.agencies : state.demoStore.agencies) || [])
      : [];
    const currentAgency = getCurrentAgency();
    const selectedAgencyId = state.session.role === "platformOwner" ? "" : (state.session.agencyId || currentAgency?.id || "");
    const targetAgencyName = selectedAgencyId ? (getAgencyName(selectedAgencyId) || currentAgency?.name || "Current agency") : "";

    openModal("Delete Sample Data", `
      <div class="notice-card danger">
        <div>
          <strong>This will delete sample workers, clients, sites, assignments, punches, timesheets, approvals, payroll runs, and audit logs for this agency.</strong>
          <p>This will NOT delete your agency account, users, settings, or subscription.</p>
        </div>
      </div>
      ${state.session.role === "platformOwner" ? `
        <div class="field-group">
          <label for="delete-sample-agency">Agency workspace</label>
          <select id="delete-sample-agency" name="targetAgencyId">
            ${renderSelectOptions(agencies, "", "Select agency")}
          </select>
        </div>
      ` : `
        <input name="targetAgencyId" type="hidden" value="${escapeAttribute(selectedAgencyId)}" />
        <div class="field-group">
          <label>Agency workspace</label>
          <input type="text" value="${escapeAttribute(targetAgencyName || "Current agency")}" readonly />
        </div>
      `}
      <div class="field-group">
        <label for="delete-sample-confirm">Type DELETE SAMPLE DATA to continue</label>
        <input id="delete-sample-confirm" name="confirmText" type="text" placeholder="DELETE SAMPLE DATA" />
      </div>
    `, submitDeleteSampleData, {
      saveLabel: "Delete Sample Data",
      saveTone: "button-danger",
      size: "small"
    });
  }

  async function submitDeleteSampleData(values) {
    requirePermission(canDeleteSampleData(), "Only agency owners or platform owners can delete sample data.");
    const confirmation = String(values.confirmText || "").trim();
    if (confirmation !== "DELETE SAMPLE DATA") {
      throw new Error("Type DELETE SAMPLE DATA to confirm.");
    }

    const targetAgencyId = state.session.role === "platformOwner"
      ? String(values.targetAgencyId || "").trim()
      : String(values.targetAgencyId || state.session.agencyId || getCurrentAgency()?.id || "").trim();

    if (!targetAgencyId) {
      throw new Error(state.session.role === "platformOwner"
        ? "Select an agency workspace first."
        : "Current agency workspace could not be found.");
    }

    if (state.session.mode === "cloud") {
      await deleteAgencySampleDataFromCloud(targetAgencyId);
    } else {
      deleteAgencySampleDataFromDemo(targetAgencyId);
    }

    await appendAuditLog("sample_data_deleted", "agency_workspace", targetAgencyId, {
      agencyId: targetAgencyId,
      collections: SAMPLE_DATA_COLLECTIONS.slice()
    }, {
      agencyId: targetAgencyId,
      collectionsCleared: SAMPLE_DATA_COLLECTIONS.slice()
    }, {
      reason: "DELETE SAMPLE DATA",
      actorId: state.session.userId,
      actorRole: state.session.role
    });

    state.modal = null;
    navigate("dashboard", { replace: true });
    await refreshCurrentView();
    pushToast("Sample data deleted.", "success");
  }

  async function deleteAgencySampleDataFromCloud(agencyId) {
    const db = state.firebase.db;
    if (!db) {
      throw new Error("Cloud data is not connected right now.");
    }

    for (const collectionName of SAMPLE_DATA_COLLECTIONS) {
      const snapshot = await db.collection(collectionName).where("agencyId", "==", agencyId).get();
      await Promise.all((snapshot.docs || []).map(record => db.collection(collectionName).doc(record.id).delete()));
    }
  }

  function deleteAgencySampleDataFromDemo(agencyId) {
    const store = loadDemoStore();
    SAMPLE_DATA_COLLECTIONS.forEach(collectionName => {
      store[collectionName] = (store[collectionName] || []).filter(record => record.agencyId !== agencyId);
    });
    writeDemoStore(store);
    state.demoStore = store;
    state.cache = deepClone(store);
  }

  async function submitRejectNote(values) {
    if (!state.modal) {
      return;
    }
    if (state.modal.targetType === "timesheet") {
      await rejectTimesheet(state.modal.targetId, values.note || "");
    }
  }

  async function approveTimesheet(timesheetId, note, signatureDetails = null) {
    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      throw new Error("That timesheet could not be found.");
    }
    requirePermission(canApproveRecord(timesheet), "You do not have permission to approve this timesheet.");

    if (state.session.role === "clientManager" && !signatureDetails?.signatureDataUrl) {
      throw new Error("A manager signature is required before approving this timesheet.");
    }

    const approvalRecord = getScopedData().approvals.find(approval => approval.timesheetId === timesheetId);
    const approvedAt = signatureDetails?.signedAt || new Date().toISOString();
    const managerSignature = signatureDetails ? {
      signedByName: signatureDetails.managerName || state.session.name || "",
      signedByEmail: signatureDetails.managerEmail || state.session.email || "",
      signedAt: approvedAt,
      signatureDataUrl: signatureDetails.signatureDataUrl || "",
      approvalNote: signatureDetails.approvalNote || note || "",
      clientId: timesheet.clientId,
      siteId: timesheet.siteId,
      timesheetId
    } : null;
    const updated = {
      status: "approved",
      approvedAt,
      approvedBy: state.session.userId,
      adminNotes: note || timesheet.adminNotes || "",
      clientNotes: note || timesheet.clientNotes || "",
      updatedAt: approvedAt,
      managerSignature: managerSignature || timesheet.managerSignature || null
    };

    await updateData("timesheets", timesheetId, updated);
    if (approvalRecord) {
      await updateData("approvals", approvalRecord.id, {
        status: "approved",
        reviewedAt: approvedAt,
        reviewedBy: state.session.userId,
        note: note || approvalRecord.note || "",
        managerName: signatureDetails?.managerName || approvalRecord.managerName || "",
        managerEmail: signatureDetails?.managerEmail || approvalRecord.managerEmail || "",
        signatureDataUrl: signatureDetails?.signatureDataUrl || approvalRecord.signatureDataUrl || "",
        signedAt: approvedAt,
        approvalNote: signatureDetails?.approvalNote || note || approvalRecord.approvalNote || "",
        managerSignature: managerSignature || approvalRecord.managerSignature || null
      });
    }
    if (managerSignature) {
      await appendAuditLog("signature_captured", "approvals", approvalRecord?.id || timesheetId, approvalRecord || timesheet, managerSignature, {
        reason: managerSignature.approvalNote || "",
        actorId: state.session.userId,
        actorRole: state.session.role,
        createdAt: approvedAt
      });
    }
    await appendAuditLog("timesheet_approved", "timesheets", timesheetId, timesheet, updated, {
      reason: signatureDetails?.approvalNote || note || "",
      actorId: state.session.userId,
      actorRole: state.session.role,
      createdAt: approvedAt
    });
    state.modal = null;
    await refreshCurrentView();
    pushToast("Timesheet approved.", "success");
  }

  async function rejectTimesheet(timesheetId, note) {
    if (!note) {
      throw new Error("Please add a rejection note.");
    }

    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      throw new Error("That timesheet could not be found.");
    }
    requirePermission(canApproveRecord(timesheet), "You do not have permission to reject this timesheet.");

    const approvalRecord = getScopedData().approvals.find(approval => approval.timesheetId === timesheetId);
    const updated = {
      status: "rejected",
      approvedAt: new Date().toISOString(),
      approvedBy: state.session.userId,
      adminNotes: note,
      clientNotes: note
    };

    await updateData("timesheets", timesheetId, updated);
    if (approvalRecord) {
      await updateData("approvals", approvalRecord.id, {
        status: "rejected",
        reviewedAt: new Date().toISOString(),
        reviewedBy: state.session.userId,
        note
      });
    }
    await appendAuditLog("timesheet_rejected", "timesheets", timesheetId, timesheet, updated, {
      reason: note,
      actorId: state.session.userId,
      actorRole: state.session.role
    });
    state.modal = null;
    await refreshCurrentView();
    pushToast("Timesheet rejected with note.", "warning");
  }

  async function capturePunch(action) {
    if (!action) {
      return;
    }

    const worker = getCurrentWorker();
    if (!worker) {
      throw new Error("No worker is selected.");
    }

    const assignment = getAssignmentsForWorker(worker.id)[0];
    const punchState = getWorkerPunchState(worker.id, getScopedData());
    if (!punchState.allowed[action]) {
      throw new Error("That punch action is not available right now.");
    }

    const timestamp = new Date().toISOString();
    if (isDuplicatePunchAction(worker.id, action, timestamp)) {
      throw new Error("That punch was already captured a moment ago. Portaly skipped the duplicate.");
    }
    const punch = {
      agencyId: worker.agencyId,
      workerId: worker.id,
      workerName: fullName(worker),
      assignmentId: assignment?.id || "",
      clientId: worker.assignedClientId || assignment?.clientId || "",
      clientName: getClientName(worker.assignedClientId || assignment?.clientId || ""),
      siteId: worker.assignedSiteId || assignment?.siteId || "",
      siteName: getSiteName(worker.assignedSiteId || assignment?.siteId || ""),
      action,
      timestamp,
      source: state.session.mode === "cloud" ? "cloud" : "demo",
      createdBy: state.session.userId || worker.userId || "demo-worker",
      edited: false,
      notes: ""
    };

    const punchId = createId("punch");
    let savedPunch;
    try {
      savedPunch = await saveData("punches", punchId, punch);
      await appendAuditLog("punch_captured", "punches", savedPunch.id, null, savedPunch);
      await refreshSessionData();
      await flushOfflinePunchQueue({ silent: true });
    } catch (error) {
      if (state.session.mode === "cloud" && isNetworkErrorLike(error)) {
        const queuedPunch = queueOfflinePunch(punchId, punch, error);
        reportRuntimeIssue("capturePunch offlineQueue", error, {
          toastMessage: ""
        });
        state.notice = `${getWorkerStatusMessage(action === "clockIn" ? "clocked-in" : action === "startLunch" ? "on-lunch" : action === "endLunch" ? "clocked-in" : "clocked-out")} at ${formatDateTime(timestamp)}. Portaly queued this punch and will sync it when the connection returns.`;
        storeNotice(state.notice);
        pushToast("Connection dropped. Portaly queued this punch and will sync it automatically.", "warning");
        renderApp();
        return queuedPunch;
      }
      throw error;
    }

    const messageMap = {
      clockIn: "You are clocked in",
      startLunch: "Lunch started",
      endLunch: "Lunch ended",
      clockOut: "You are clocked out"
    };

    state.notice = `${messageMap[action]} at ${formatDateTime(timestamp)}.`;
    storeNotice(state.notice);
    pushToast(`${PUNCH_LABELS[action]} saved.`, "success");
    renderApp();
  }

  function getSelectedPublicPunchDirectory() {
    const agencyField = document.getElementById("public-punch-agency");
    const companyField = document.getElementById("public-punch-company");
    const siteField = document.getElementById("public-punch-site");
    const agencyId = String(agencyField?.value || state.publicPunch.agencyId || state.publicPunch.directory?.agencyId || "").trim();
    const companyId = String(companyField?.value || state.publicPunch.companyId || state.publicPunch.directory?.companyId || "").trim();
    const siteId = String(siteField?.value || state.publicPunch.siteId || state.publicPunch.directory?.siteId || "").trim();
    const selectedSite = (state.publicPunch.sites || []).find(site => String(site.id || site.siteId || "").trim() === siteId) || null;
    const directory = (state.publicPunch.directories || []).find(item => item.siteId === siteId && (!agencyId || item.agencyId === agencyId) && (!companyId || item.companyId === companyId))
      || (state.publicPunch.directory && state.publicPunch.directory.siteId === siteId ? state.publicPunch.directory : null)
      || (selectedSite ? buildSitePunchDirectory(selectedSite, {
        agencies: state.publicPunch.agencies || [],
        clients: state.publicPunch.clients || [],
        workers: state.publicPunch.workers || [],
        assignments: state.publicPunch.assignments || []
      }) : null);
    return {
      agencyId,
      companyId,
      siteId,
      directory
    };
  }

  function getPunchStatusLabelFromAction(action) {
    return PUNCH_STATUS_LABELS[action] || "Ready";
  }

  function resolvePublicPunchWorker(directory) {
    const workerField = document.getElementById("public-punch-worker");
    const manualField = document.getElementById("public-punch-worker-name");
    const selectedWorkerId = String(workerField?.value || "").trim();
    const manualName = String(manualField?.value || "").trim();
    const workerOptions = Array.isArray(directory?.publicWorkerOptions) ? directory.publicWorkerOptions : [];
    const matchedById = workerOptions.find(option => option.id === selectedWorkerId) || null;
    if (matchedById) {
      return {
        workerId: matchedById.id || null,
        workerName: matchedById.name,
        workerMatched: true
      };
    }

    const matchedByName = manualName
      ? workerOptions.find(option => option.name.trim().toLowerCase() === manualName.toLowerCase()) || null
      : null;
    if (matchedByName) {
      return {
        workerId: matchedByName.id || null,
        workerName: matchedByName.name,
        workerMatched: true
      };
    }

    if (!manualName) {
      throw new Error("Enter the worker name before saving a punch.");
    }

    return {
      workerId: null,
      workerName: manualName,
      workerMatched: false
    };
  }

  function getPublicPunchContext() {
    const { agencyId, companyId, siteId, directory } = getSelectedPublicPunchDirectory();
    const client = (state.publicPunch.clients || []).find(item => item.id === companyId) || null;
    const site = (state.publicPunch.sites || []).find(item => item.id === siteId) || null;
    return {
      agencyId,
      agencyName: directory?.agencyName || state.publicPunch?.agencyName || getAgencyName(agencyId) || "",
      companyId,
      companyName: directory?.companyName || state.publicPunch?.companyName || client?.name || "",
      clientId: companyId,
      clientName: directory?.companyName || state.publicPunch?.companyName || client?.name || "",
      siteId,
      siteName: directory?.siteName || state.publicPunch?.siteName || site?.name || "",
      directory
    };
  }

  function shouldUsePublicPunchPreviewFallback() {
    return window.location.protocol === "file:" && !!state.publicPunch?.fallbackNotice;
  }

  function openPunchRequestModal() {
    const context = getPublicPunchContext();
    const requestDraft = state.publicPunch?.requestDraft || null;
    const workerField = document.getElementById("public-punch-worker");
    const manualField = document.getElementById("public-punch-worker-name");
    const availableWorkers = context.directory?.publicWorkerOptions || state.publicPunch?.siteWorkers || [];
    const matchedWorker = availableWorkers.find(option => option.id === String(workerField?.value || "").trim()) || null;
    const workerName = String(manualField?.value || matchedWorker?.name || state.publicPunch?.lastWorkerName || "").trim();

    openModal("Submit Punch Request", `
      <form class="form-grid" data-form="punch-request-save">
        <input type="hidden" name="agencyId" value="${escapeAttribute(context.agencyId)}" />
        <input type="hidden" name="companyId" value="${escapeAttribute(context.companyId)}" />
        <input type="hidden" name="siteId" value="${escapeAttribute(context.siteId)}" />
        <input type="hidden" name="workerId" value="${escapeAttribute(matchedWorker?.id || "")}" />
        <div class="field-group">
          <label for="punch-request-worker-name">Worker name</label>
          <input id="punch-request-worker-name" name="workerName" type="text" value="${escapeAttribute(workerName)}" placeholder="Type the worker name" />
        </div>
        <div class="field-group">
          <label for="punch-request-context">Company / site</label>
          <input id="punch-request-context" type="text" value="${escapeAttribute([context.companyName, context.siteName].filter(Boolean).join(" - ") || "Select a company and site first")}" readonly />
        </div>
        <div class="form-row two">
          <div class="field-group">
            <label for="punch-request-action">Requested punch type</label>
            <select id="punch-request-action" name="requestedAction">
              ${Object.keys(PUNCH_LABELS).map(entry => `<option value="${escapeAttribute(entry)}" ${requestDraft?.requestedAction === entry ? "selected" : ""}>${escapeHtml(PUNCH_LABELS[entry])}</option>`).join("")}
            </select>
          </div>
          <div class="field-group">
            <label for="punch-request-date">Requested punch date</label>
            <input id="punch-request-date" name="requestedDate" type="date" value="${escapeAttribute(requestDraft?.requestedDate || formatDateInput(state.now))}" />
          </div>
        </div>
        <div class="form-row two">
          <div class="field-group">
            <label for="punch-request-time">Requested punch time</label>
            <input id="punch-request-time" name="requestedTime" type="time" value="${escapeAttribute(requestDraft?.requestedTime || formatTimeInput(state.now))}" />
          </div>
          <div class="field-group">
            <label for="punch-request-reason">Reason / note</label>
            <input id="punch-request-reason" name="reason" type="text" placeholder="Explain what happened" />
          </div>
        </div>
      </form>
    `, null, {
      formName: "punch-request-save",
      saveLabel: "Submit Request",
      saveTone: "button-primary"
    });
  }

  async function savePublicSitePunch(action) {
    if (!PUNCH_LABELS[action]) {
      throw new Error("Choose a valid punch action.");
    }

    const { agencyId, companyId, siteId, directory } = getSelectedPublicPunchDirectory();
    const context = getPublicPunchContext();
    if (!agencyId || !companyId || !siteId) {
      throw new Error("Choose the staffing agency, company, and site before saving a punch.");
    }

    const worker = resolvePublicPunchWorker(directory || { publicWorkerOptions: state.publicPunch?.siteWorkers || [] });
    const now = new Date();
    const timestamp = now.toISOString();
    const punchId = createId("punch");
    const punch = {
      id: punchId,
      agencyId: agencyId,
      companyId,
      companyName: context.companyName || directory?.companyName || getClientName(companyId),
      clientId: companyId,
      clientName: context.companyName || directory?.companyName || getClientName(companyId),
      siteId,
      siteName: context.siteName || directory?.siteName || getSiteName(siteId),
      workerId: worker.workerId,
      workerName: worker.workerName,
      workerMatched: worker.workerMatched,
      action,
      timestamp,
      localDate: formatDateInput(timestamp),
      source: "publicPunchPage",
      createdAt: timestamp,
      deviceInfo: String(navigator.userAgent || "").slice(0, 500)
    };

    state.publicPunch = {
      ...state.publicPunch,
      saving: true,
      requestHelpMessage: "",
      requestDraft: null,
      lastAction: action,
      lastWorkerName: worker.workerName
    };
    renderApp();

    try {
      if (state.firebase.ready && state.firebase.db && !shouldUsePublicPunchPreviewFallback()) {
        await state.firebase.db.collection("punches").doc(punchId).set(punch, { merge: false });
      } else {
        await saveData("punches", punchId, punch);
      }
    } catch (error) {
      console.error("[Portaly] savePublicSitePunch failed", {
        action,
        agencyId,
        companyId,
        siteId,
        workerName: worker.workerName,
        error
      });
      throw error;
    }

    state.publicPunch = {
      ...state.publicPunch,
      saving: false,
      requestHelpMessage: "",
      requestDraft: null,
      lastAction: action,
      lastSavedAt: timestamp,
      lastStatus: getPunchStatusLabelFromAction(action),
      lastWorkerName: worker.workerName,
      lastMessage: `${PUNCH_LABELS[action]} saved for ${worker.workerName} at ${formatTime(timestamp)}.`
    };
    pushToast(`${PUNCH_LABELS[action]} saved.`, "success");
    renderApp();
  }

  async function savePunchRequestForm(values) {
    const context = getPublicPunchContext();
    const agencyId = String(values.agencyId || context.agencyId || "").trim();
    const companyId = String(values.companyId || context.companyId || "").trim();
    const siteId = String(values.siteId || context.siteId || "").trim();
    const workerId = String(values.workerId || "").trim();
    const workerName = String(values.workerName || "").trim();
    const requestedAction = String(values.requestedAction || "").trim();
    const requestedDate = String(values.requestedDate || "").trim();
    const requestedTime = String(values.requestedTime || "").trim();
    const reason = String(values.reason || "").trim();

    if (!agencyId || !companyId || !siteId) {
      throw new Error("Choose the company and site on the punch screen before submitting a request.");
    }
    if (!workerName) {
      throw new Error("Enter the worker name before submitting a request.");
    }
    if (!PUNCH_LABELS[requestedAction]) {
      throw new Error("Choose a punch type before submitting this request.");
    }
    if (!requestedDate || !requestedTime) {
      throw new Error("Enter the requested punch date and time.");
    }
    if (!reason) {
      throw new Error("Add a short reason so a manager can review this request.");
    }

    const requestedTimestamp = new Date(`${requestedDate}T${requestedTime}:00`);
    if (Number.isNaN(requestedTimestamp.getTime())) {
      throw new Error("Enter a valid requested punch date and time.");
    }

    const requestId = createId("punchRequest");
    const now = new Date().toISOString();
    const matchedWorker = workerId
      ? ((context.directory?.publicWorkerOptions || state.publicPunch?.siteWorkers || []).find(option => option.id === workerId) || null)
      : null;
    const requestRecord = {
      id: requestId,
      agencyId,
      companyId,
      companyName: context.companyName || context.directory?.companyName || "",
      clientId: companyId,
      clientName: context.companyName || context.directory?.companyName || "",
      siteId,
      siteName: context.siteName || context.directory?.siteName || "",
      workerId: matchedWorker?.id || workerId || null,
      workerName,
      workerMatched: !!(matchedWorker || workerId),
      requestedAction,
      requestedTimestamp: requestedTimestamp.toISOString(),
      requestedLocalDate: requestedDate,
      reason,
      status: "pending",
      source: "publicPunchPage",
      createdAt: now,
      updatedAt: now,
      deviceInfo: String(navigator.userAgent || "").slice(0, 500)
    };

    if (state.firebase.ready && state.firebase.db && !shouldUsePublicPunchPreviewFallback()) {
      await state.firebase.db.collection("punchRequests").doc(requestId).set(requestRecord, { merge: false });
    } else {
      await saveData("punchRequests", requestId, requestRecord);
    }

    state.publicPunch = {
      ...(state.publicPunch || {}),
      requestHelpMessage: "",
      requestDraft: null
    };
    closeModal();
    pushToast("Punch request submitted. A manager can review it shortly.", "success");
  }

  async function approvePunchRequest(requestId) {
    const request = findRecord("punchRequests", requestId);
    if (!request) {
      throw new Error("That punch request could not be found.");
    }
    requirePermission(canReviewPunchRequests(request), "You do not have permission to approve this punch request.");
    confirmAction(`Approve this ${PUNCH_LABELS[request.requestedAction] || "punch"} request for ${request.workerName}?`, async () => {
      const scoped = getScopedData();
      const matchedWorker = request.workerId
        ? scoped.workers.find(worker => worker.id === request.workerId) || null
        : (scoped.workers || []).find(worker => fullName(worker).trim().toLowerCase() === String(request.workerName || "").trim().toLowerCase() && worker.assignedSiteId === request.siteId) || null;
      const assignment = matchedWorker
        ? getAssignmentsForWorker(matchedWorker.id).find(item => item.siteId === request.siteId) || getAssignmentsForWorker(matchedWorker.id)[0] || null
        : null;
      const punchId = createId("punch");
      const punch = {
        agencyId: request.agencyId,
        workerId: matchedWorker?.id || request.workerId || null,
        workerName: matchedWorker ? fullName(matchedWorker) : request.workerName,
        assignmentId: assignment?.id || "",
        companyId: request.companyId || request.clientId || "",
        companyName: request.companyName || request.clientName || getClientName(request.clientId || request.companyId || ""),
        clientId: request.clientId || request.companyId || "",
        clientName: request.clientName || request.companyName || getClientName(request.clientId || request.companyId || ""),
        siteId: request.siteId,
        siteName: request.siteName || getSiteName(request.siteId),
        action: request.requestedAction,
        timestamp: request.requestedTimestamp,
        localDate: request.requestedLocalDate || formatDateInput(request.requestedTimestamp),
        source: "punchRequestApproval",
        createdAt: new Date().toISOString(),
        createdBy: state.session.userId || "manager-review",
        workerMatched: !!matchedWorker,
        notes: request.reason || ""
      };
      await saveData("punches", punchId, punch);
      await updateData("punchRequests", requestId, {
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: state.session.userId || "",
        resolvedPunchId: punchId
      });
      await appendAuditLog("punch_request_approved", "punchRequests", requestId, request, {
        ...request,
        status: "approved",
        resolvedPunchId: punchId
      });
      await refreshCurrentView();
      pushToast("Punch request approved.", "success");
    }, {
      title: "Approve Punch Request",
      confirmLabel: "Approve",
      confirmTone: "button-primary"
    });
  }

  async function rejectPunchRequest(requestId) {
    const request = findRecord("punchRequests", requestId);
    if (!request) {
      throw new Error("That punch request could not be found.");
    }
    requirePermission(canReviewPunchRequests(request), "You do not have permission to reject this punch request.");
    confirmAction(`Reject this punch request for ${request.workerName}?`, async () => {
      await updateData("punchRequests", requestId, {
        status: "rejected",
        reviewedAt: new Date().toISOString(),
        reviewedBy: state.session.userId || ""
      });
      await appendAuditLog("punch_request_rejected", "punchRequests", requestId, request, {
        ...request,
        status: "rejected"
      });
      await refreshCurrentView();
      pushToast("Punch request rejected.", "success");
    }, {
      title: "Reject Punch Request",
      confirmLabel: "Reject",
      confirmTone: "button-danger"
    });
  }

  async function syncLinkedUserFromWorker(userId, worker) {
    const linkedUser = findRecord("users", userId);
    if (!linkedUser) {
      return;
    }
    await updateData("users", userId, {
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.loginEmail || worker.email || linkedUser.email || "",
      phone: worker.phone || linkedUser.phone || "",
      workerId: worker.id,
      assignedClientIds: worker.assignedClientId ? [worker.assignedClientId] : [],
      assignedSiteIds: worker.assignedSiteId ? [worker.assignedSiteId] : []
    });
  }

  async function syncWorkerFromAssignment(assignment) {
    const worker = findRecord("workers", assignment.workerId);
    if (!worker) {
      return;
    }
    const updatedWorker = {
      assignedClientId: assignment.clientId,
      assignedSiteId: assignment.siteId,
      payRate: Number(assignment.payRate || worker.payRate || 0)
    };
    await updateData("workers", worker.id, updatedWorker);
    await syncPunchDirectoriesForWorker({ ...worker, ...updatedWorker }, worker);
    if (worker.userId) {
      await syncLinkedUserFromWorker(worker.userId, { ...worker, ...updatedWorker });
    }
  }

  async function syncTimesheetsFromAssignment(assignmentId, assignment) {
    const related = getScopedData().timesheets.filter(timesheet => timesheet.assignmentId === assignmentId);
    await Promise.all(related.map(timesheet => updateData("timesheets", timesheet.id, {
      clientId: assignment.clientId,
      siteId: assignment.siteId,
      payRate: Number(assignment.payRate || 0)
    })));
  }

  async function deactivateWorker(workerId) {
    requirePermission(canDeactivateEntity("workers"), "You do not have permission to deactivate workers.");
    const worker = findRecord("workers", workerId);
    if (!worker) {
      throw new Error("That worker could not be found.");
    }
    const updated = { status: "inactive" };
    await updateData("workers", workerId, updated);
    if (worker.userId) {
      await updateData("users", worker.userId, { status: "inactive" });
    }
    await appendAuditLog("worker_deactivated", "workers", workerId, worker, { ...worker, ...updated });
    await refreshCurrentView();
    pushToast("Worker deactivated successfully.", "warning");
  }

  async function requestWorkerDelete(workerId) {
    requirePermission(canPermanentlyDeleteRecords(), "Only platform owners and agency owners can permanently delete workers.");
    const worker = findRecord("workers", workerId);
    if (!worker) {
      throw new Error("That worker could not be found.");
    }
    confirmAction(`Permanently delete ${fullName(worker)}? This removes the worker record but keeps punch and payroll history.`, async () => {
      await deleteData("workers", workerId);
      await appendAuditLog("worker_deleted", "workers", workerId, worker, null);
      closeModal();
      await refreshCurrentView();
      pushToast("Worker deleted successfully.", "success");
    }, {
      title: "Delete Worker",
      confirmLabel: "Delete Worker",
      confirmTone: "button-danger"
    });
  }

  async function deactivateClient(clientId) {
    requirePermission(canDeactivateEntity("clients"), "You do not have permission to deactivate clients.");
    const client = findRecord("clients", clientId);
    if (!client) {
      throw new Error("That client could not be found.");
    }
    await updateData("clients", clientId, { status: "inactive" });
    await appendAuditLog("client_deactivated", "clients", clientId, client, { ...client, status: "inactive" });
    await refreshCurrentView();
    pushToast("Client deactivated successfully.", "warning");
  }

  async function requestClientDelete(clientId) {
    requirePermission(canPermanentlyDeleteRecords(), "Only platform owners and agency owners can permanently delete clients.");
    const client = findRecord("clients", clientId);
    if (!client) {
      throw new Error("That client could not be found.");
    }
    confirmAction(`Delete ${client.name}? Sites, assignments, and historical rows will keep their old IDs but may no longer show this client name.`, async () => {
      await deleteData("clients", clientId);
      await appendAuditLog("client_deleted", "clients", clientId, client, null);
      closeModal();
      await refreshCurrentView();
      pushToast("Client deleted successfully.", "success");
    }, {
      title: "Delete Client",
      confirmLabel: "Delete Client",
      confirmTone: "button-danger"
    });
  }

  async function deactivateSite(siteId) {
    requirePermission(canDeactivateEntity("sites"), "You do not have permission to deactivate sites.");
    const site = findRecord("sites", siteId);
    if (!site) {
      throw new Error("That site could not be found.");
    }
    await updateData("sites", siteId, { status: "inactive" });
    await appendAuditLog("site_deactivated", "sites", siteId, site, { ...site, status: "inactive" });
    await refreshCurrentView();
    pushToast("Site deactivated successfully.", "warning");
  }

  async function requestSiteDelete(siteId) {
    requirePermission(canPermanentlyDeleteRecords(), "Only platform owners and agency owners can permanently delete sites.");
    const site = findRecord("sites", siteId);
    if (!site) {
      throw new Error("That site could not be found.");
    }
    confirmAction(`Delete ${site.name}? Worker punch history and approvals will remain for audit purposes.`, async () => {
      await deleteData("sites", siteId);
      await appendAuditLog("site_deleted", "sites", siteId, site, null);
      closeModal();
      await refreshCurrentView();
      pushToast("Site deleted successfully.", "success");
    }, {
      title: "Delete Site",
      confirmLabel: "Delete Site",
      confirmTone: "button-danger"
    });
  }

  async function endAssignment(assignmentId) {
    requirePermission(canManageAssignments(), "You do not have permission to end assignments.");
    const assignment = findRecord("assignments", assignmentId);
    if (!assignment) {
      throw new Error("That assignment could not be found.");
    }
    const updated = {
      status: "ended",
      endDate: new Date().toISOString()
    };
    await updateData("assignments", assignmentId, updated);
    await appendAuditLog("assignment_ended", "assignments", assignmentId, assignment, { ...assignment, ...updated });
    await refreshCurrentView();
    pushToast("Assignment ended successfully.", "warning");
  }

  async function requestAssignmentDelete(assignmentId) {
    requirePermission(canDeleteAssignment(), "You do not have permission to delete assignments.");
    const assignment = findRecord("assignments", assignmentId);
    if (!assignment) {
      throw new Error("That assignment could not be found.");
    }
    confirmAction(`Delete the assignment for ${getWorkerName(assignment.workerId)}? Margin rows will recalculate automatically.`, async () => {
      await deleteData("assignments", assignmentId);
      await appendAuditLog("assignment_deleted", "assignments", assignmentId, assignment, null);
      closeModal();
      await refreshCurrentView();
      pushToast("Assignment deleted successfully.", "success");
    }, {
      title: "Delete Assignment",
      confirmLabel: "Delete Assignment",
      confirmTone: "button-danger"
    });
  }

  async function fixMissingClockOut(workerId) {
    requirePermission(canManagePunches(), "You do not have permission to fix punch issues.");
    const worker = getWorker(workerId);
    if (!worker) {
      throw new Error("That worker could not be found.");
    }
    const assignment = getAssignmentsForWorker(worker.id)[0];
    const timestamp = new Date().toISOString();
    const punch = {
      agencyId: worker.agencyId || state.session.agencyId || state.session.agency?.id,
      workerId: worker.id,
      workerName: fullName(worker),
      assignmentId: assignment?.id || "",
      clientId: worker.assignedClientId || assignment?.clientId || "",
      clientName: getClientName(worker.assignedClientId || assignment?.clientId || ""),
      siteId: worker.assignedSiteId || assignment?.siteId || "",
      siteName: getSiteName(worker.assignedSiteId || assignment?.siteId || ""),
      action: "clockOut",
      timestamp,
      source: "manual-fix",
      createdBy: state.session.userId || "manual-admin",
      edited: true,
      notes: "Missing clock out fixed manually by admin.",
      editReason: "Missing clock out fixed manually."
    };
    const savedPunch = await saveData("punches", createId("punch"), punch);
    await appendAuditLog("missing_clock_out_fixed", "punches", savedPunch.id, null, savedPunch);
    await refreshCurrentView();
    pushToast("Missing clock out fixed.", "success");
  }

  function openClientSitesModal(clientId) {
    const client = findRecord("clients", clientId);
    const sites = getScopedData().sites.filter(site => site.clientId === clientId);
    const invites = getClientInvites(clientId).slice().sort((left, right) => compareDates(right.createdAt, left.createdAt));
    if (!client) {
      return;
    }
    openModal(`${client.name} Details`, `
      <div class="detail-grid">
        ${renderDetailBox("Client", client.name || "-")}
        ${renderDetailBox("Contact", client.contactName || "-")}
        ${renderDetailBox("Contact email", client.contactEmail || "-")}
        ${renderDetailBox("Phone", client.phone || "-")}
        ${renderDetailBox("Billing contact", client.billingContact || "-")}
        ${renderDetailBox("Status", formatStatusLabel(client.status || "active"))}
      </div>
      <div class="stack-md" style="margin-top: 18px;">
        ${client.notes ? `<div>${renderDetailBox("Notes", client.notes)}</div>` : ""}
        ${client.internalNotes && state.session.role !== "clientManager" ? `<div>${renderDetailBox("Internal notes", client.internalNotes)}</div>` : ""}
        ${client.clientVisibleNotes ? `<div>${renderDetailBox("Client-visible notes", client.clientVisibleNotes)}</div>` : ""}
      </div>
      ${canInviteClientManagers() ? `
        <div class="page-actions" style="margin-top: 18px;">
          <button class="button button-secondary" data-action="open-client-manager-invite" data-client-id="${escapeHtml(client.id)}" type="button">Invite Client Manager</button>
        </div>
      ` : ""}
      ${invites.length ? `
        <div class="surface-card" style="margin-top: 18px; padding: 18px;">
          <p class="eyebrow">Client Manager Invites</p>
          <ul class="compact-list" style="margin-top: 12px;">
            ${invites.map(invite => `
              <li>
                <strong>${escapeHtml(`${invite.firstName || ""} ${invite.lastName || ""}`.trim() || invite.email || invite.id)}</strong>
                <span class="helper-copy">${escapeHtml(invite.email || "-")} - ${escapeHtml(formatStatusLabel(invite.status || "pending"))}</span>
                <div class="table-actions" style="margin-top: 10px;">
                  <button class="button button-ghost" data-action="copy-link" data-copy="${escapeAttribute(invite.inviteLink || buildClientManagerInviteLink(invite.inviteToken || ""))}" type="button">Copy Invite Link</button>
                  ${canInviteClientManagers() && PUBLIC_INVITE_STATUSES.has(String(invite.status || "pending").toLowerCase()) ? `<button class="button button-secondary" data-action="send-client-invite-email" ${buildInviteEmailActionAttributes(invite)} type="button">${escapeHtml(getInviteEmailButtonLabel(invite))}</button>` : ""}
                  ${canInviteClientManagers() && PUBLIC_INVITE_STATUSES.has(String(invite.status || "pending").toLowerCase()) ? `<button class="button button-danger" data-action="revoke-client-invite" data-invite-id="${escapeHtml(invite.id)}" type="button">Revoke Invite</button>` : ""}
                </div>
              </li>
            `).join("")}
          </ul>
        </div>
      ` : ""}
      <div style="margin-top: 18px;">
        <p class="eyebrow">Sites</p>
        ${sites.length ? `
        <ul class="history-list">
          ${sites.map(site => `
            <li class="history-item">
              <div>
                <strong>${escapeHtml(site.name)}</strong>
                <p class="inline-note">${escapeHtml(buildSiteAddress(site))}</p>
              </div>
              ${renderInlineStatus(site.status)}
            </li>
          `).join("")}
        </ul>
        ` : renderEmptyState("No sites for this client", "Add a site to start placing workers and client approvals.") }
      </div>
    `, null, {
      readOnly: true,
      cancelLabel: "Close",
      size: "small"
    });
  }

  function openAssignmentModal(assignmentId) {
    const assignment = assignmentId ? findRecord("assignments", assignmentId) : null;
    const scoped = getScopedData();
    openModal(assignment ? "Edit Assignment" : "Add Assignment", `
      <input name="id" type="hidden" value="${escapeAttribute(assignment?.id || "")}" />
      ${state.session.role === "platformOwner" ? `
        <div class="field-group">
          <label for="assignment-agency">Agency</label>
          <select id="assignment-agency" name="agencyId">
            ${renderSelectOptions(state.cache.agencies, assignment?.agencyId || "", "Select agency")}
          </select>
        </div>
      ` : ""}
      <div class="form-row two">
        <div class="field-group">
          <label for="assignment-worker">Worker</label>
          <select id="assignment-worker" name="workerId">
            ${renderSelectOptions(scoped.workers, assignment?.workerId, "Select worker")}
          </select>
        </div>
        <div class="field-group">
          <label for="assignment-client">Client</label>
          <select id="assignment-client" name="clientId">
            ${renderSelectOptions(scoped.clients, assignment?.clientId, "Select client")}
          </select>
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="assignment-site">Site</label>
          <select id="assignment-site" name="siteId">
            ${renderSelectOptions(scoped.sites, assignment?.siteId, "Select site")}
          </select>
        </div>
        <div class="field-group">
          <label for="assignment-status">Status</label>
          <select id="assignment-status" name="status">
            ${renderStaticOptions(["active", "ended", "pending"], assignment?.status || "active")}
          </select>
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="assignment-start-date">Start date</label>
          <input id="assignment-start-date" name="startDate" type="date" value="${escapeAttribute(formatDateInput(assignment?.startDate || state.now))}" />
        </div>
        <div class="field-group">
          <label for="assignment-end-date">End date</label>
          <input id="assignment-end-date" name="endDate" type="date" value="${escapeAttribute(formatDateInput(assignment?.endDate || ""))}" />
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="assignment-pay-rate">Pay rate</label>
          <input id="assignment-pay-rate" name="payRate" type="number" step="0.01" value="${escapeAttribute(String(assignment?.payRate || 0))}" />
        </div>
        <div class="field-group">
          <label for="assignment-bill-rate">Bill rate</label>
          <input id="assignment-bill-rate" name="billRate" type="number" step="0.01" value="${escapeAttribute(String(assignment?.billRate || 0))}" />
        </div>
      </div>
      <div class="field-group">
        <label for="assignment-shift-schedule">Shift schedule</label>
        <input id="assignment-shift-schedule" name="shiftSchedule" type="text" value="${escapeAttribute(assignment?.shiftSchedule || "")}" placeholder="Example: Mon-Fri 7:00 AM - 3:30 PM" />
      </div>
      <div class="field-group">
        <label for="assignment-notes">Notes</label>
        <textarea id="assignment-notes" name="notes">${escapeHtml(assignment?.notes || "")}</textarea>
      </div>
    `, null, {
      formName: "assignment-save",
      saveLabel: assignment ? "Save Assignment" : "Add Assignment"
    });
  }

  function openPunchModal(punchId) {
    const punch = punchId ? findRecord("punches", punchId) : null;
    const scoped = getScopedData();
    openModal(punch ? "Edit Punch" : "Add Manual Punch", `
      <input name="id" type="hidden" value="${escapeAttribute(punch?.id || "")}" />
      <div class="field-group">
        <label for="punch-worker">Worker</label>
        <select id="punch-worker" name="workerId">
          ${renderSelectOptions(scoped.workers, punch?.workerId, "Select worker")}
        </select>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="punch-action">Action</label>
          <select id="punch-action" name="action">
            ${renderStaticOptions(Object.keys(PUNCH_LABELS), punch?.action || "clockIn", key => PUNCH_LABELS[key] || key)}
          </select>
        </div>
        <div class="field-group">
          <label for="punch-client">Client</label>
          <select id="punch-client" name="clientId">
            ${renderSelectOptions(scoped.clients, punch?.clientId, "Select client")}
          </select>
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="punch-site">Site</label>
          <select id="punch-site" name="siteId">
            ${renderSelectOptions(scoped.sites, punch?.siteId, "Select site")}
          </select>
        </div>
        <div class="field-group">
          <label for="punch-reason">Edited reason</label>
          <input id="punch-reason" name="editReason" type="text" value="" placeholder="${escapeAttribute(punch ? "Required for edits" : "Reason for manual punch")}" />
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="punch-date">Date</label>
          <input id="punch-date" name="punchDate" type="date" value="${escapeAttribute(formatDateInput(punch?.timestamp || state.now))}" />
        </div>
        <div class="field-group">
          <label for="punch-time">Time</label>
          <input id="punch-time" name="punchTime" type="time" value="${escapeAttribute(formatTimeInput(punch?.timestamp || state.now))}" />
        </div>
      </div>
      <div class="field-group">
        <label for="punch-notes">Notes</label>
        <textarea id="punch-notes" name="notes">${escapeHtml(punch?.notes || "")}</textarea>
      </div>
    `, null, {
      formName: "punch-save",
      saveLabel: punch ? "Save Punch" : "Add Punch"
    });
  }

  function openPunchNoteModal(punchId) {
    const punch = findRecord("punches", punchId);
    if (!punch) {
      return;
    }
    openModal("Add Punch Note", `
      <input name="id" type="hidden" value="${escapeAttribute(punch.id)}" />
      <div class="field-group">
        <label for="punch-note-text">Notes</label>
        <textarea id="punch-note-text" name="notes">${escapeHtml(punch.notes || "")}</textarea>
      </div>
      <div class="field-group">
        <label for="punch-note-reason">Edited reason</label>
        <input id="punch-note-reason" name="editReason" type="text" placeholder="Why was this note added?" />
      </div>
    `, async values => {
      if (!values.editReason) {
        throw new Error("Add a reason before saving the note.");
      }
      await updateData("punches", punch.id, {
        notes: values.notes || "",
        edited: true,
        editReason: values.editReason
      });
      await appendAuditLog("punch_note_saved", "punches", punch.id, punch, {
        ...punch,
        notes: values.notes || "",
        edited: true,
        editReason: values.editReason
      });
      state.modal = null;
      await refreshCurrentView();
      pushToast("Punch note saved.", "success");
    }, {
      saveLabel: "Save Note"
    });
  }

  function openApprovalEditModal(timesheetId) {
    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      return;
    }
    openModal(state.session.role === "clientManager" ? "Correct Approved Hours" : "Edit Hours", `
      <input name="id" type="hidden" value="${escapeAttribute(timesheet.id)}" />
      ${timesheet.status === "approved" ? `
        <div class="notice-card warning">
          <div>
            <strong>This timecard is already approved.</strong>
            <p>${state.session.role === "clientManager" ? "Approved timecards are locked after signature. Ask the agency admin for an override." : "Agency staff can still edit this timecard, but an override reason is required."}</p>
          </div>
        </div>
      ` : ""}
      <div class="form-row two">
        <div class="field-group">
          <label for="approval-approved-hours">Approved hours</label>
          <input id="approval-approved-hours" name="approvedHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.approvedHours || 0))}" />
        </div>
        <div class="field-group">
          <label for="approval-status">Status</label>
          <select id="approval-status" name="status">
            ${renderStaticOptions(["pending", "approved", "rejected"], timesheet.status || "pending")}
          </select>
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="approval-regular-hours">Regular hours</label>
          <input id="approval-regular-hours" name="regularHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.regularHours || 0))}" />
        </div>
        <div class="field-group">
          <label for="approval-overtime-hours">Overtime hours</label>
          <input id="approval-overtime-hours" name="overtimeHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.overtimeHours || 0))}" />
        </div>
      </div>
      <div class="field-group">
        <label for="approval-client-notes">Approval note</label>
        <textarea id="approval-client-notes" name="clientNotes">${escapeHtml(timesheet.clientNotes || timesheet.adminNotes || "")}</textarea>
      </div>
      ${state.session.role === "clientManager" ? `
        <div class="field-group">
          <label for="approval-correction-reason">Correction reason</label>
          <select id="approval-correction-reason" name="clientEditReason">
            ${renderStaticOptions(CLIENT_CORRECTION_REASONS, "", value => value)}
          </select>
        </div>
      ` : ""}
      ${state.session.role !== "clientManager" ? `
        <div class="field-group">
          <label for="approval-admin-notes">Admin notes</label>
          <textarea id="approval-admin-notes" name="adminNotes">${escapeHtml(timesheet.adminNotes || "")}</textarea>
        </div>
        ${timesheet.status === "approved" ? `
          <div class="field-group">
            <label for="approval-override-reason">Admin override reason</label>
            <textarea id="approval-override-reason" name="overrideReason" placeholder="Explain why approved hours are being changed."></textarea>
          </div>
        ` : ""}
      ` : ""}
    `, null, {
      formName: "approval-hours-save",
      saveLabel: state.session.role === "clientManager" ? "Save Correction" : "Save Hours"
    });
  }

  function openApprovalDetailModal(timesheetId) {
    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      return;
    }
    const approval = getScopedData().approvals.find(item => item.timesheetId === timesheetId);
    const correctionSummary = buildApprovalCorrectionSummary(timesheet, approval, getScopedData());
    openModal("Approval Details", `
      <div class="detail-grid">
        ${renderDetailBox("Worker", getWorkerName(timesheet.workerId))}
        ${renderDetailBox("Client", getClientName(timesheet.clientId))}
        ${renderDetailBox("Site", getSiteName(timesheet.siteId))}
        ${renderDetailBox("Hours submitted", formatHours(timesheet.approvedHours))}
        ${renderDetailBox("Regular hours", formatHours(timesheet.regularHours))}
        ${renderDetailBox("Overtime hours", formatHours(timesheet.overtimeHours))}
        ${renderDetailBox("Punch details", buildTimesheetPunchSummaryText(timesheet, getScopedData().punches))}
        ${renderDetailBox("Approval note", approval?.note || timesheet.clientNotes || timesheet.adminNotes || "-")}
        ${renderDetailBox("Correction status", correctionSummary.status)}
        ${renderDetailBox("Latest correction reason", correctionSummary.reason)}
        ${renderDetailBox("Manager signature", correctionSummary.signature)}
      </div>
    `, null, {
      readOnly: true,
      cancelLabel: "Close",
      size: "small"
    });
  }

  function openClientTimecardCorrectionModal(timesheetId) {
    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      return;
    }
    requirePermission(state.session.role === "clientManager", "Only client managers can use this correction flow.");
    requirePermission(canApproveRecord(timesheet), "You do not have permission to correct this timecard.");
    const scoped = getScopedData();
    const defaultDate = getClientCorrectionDate(timesheet, scoped.punches);
    const punchMap = getPunchMapForDate(timesheet, scoped.punches, defaultDate);
    openModal("Edit Time", `
      <input name="timesheetId" type="hidden" value="${escapeAttribute(timesheet.id)}" />
      <div class="field-group">
        <label for="client-correction-date">Correction date</label>
        <input id="client-correction-date" name="correctionDate" type="date" value="${escapeAttribute(defaultDate)}" />
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="client-clock-in">Edit Clock In</label>
          <input id="client-clock-in" name="clockInTime" type="time" value="${escapeAttribute(formatTimeInput(punchMap.clockIn?.timestamp || ""))}" />
        </div>
        <div class="field-group">
          <label for="client-clock-out">Edit Clock Out</label>
          <input id="client-clock-out" name="clockOutTime" type="time" value="${escapeAttribute(formatTimeInput(punchMap.clockOut?.timestamp || ""))}" />
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="client-start-lunch">Edit Start Lunch</label>
          <input id="client-start-lunch" name="startLunchTime" type="time" value="${escapeAttribute(formatTimeInput(punchMap.startLunch?.timestamp || ""))}" />
        </div>
        <div class="field-group">
          <label for="client-end-lunch">Edit End Lunch</label>
          <input id="client-end-lunch" name="endLunchTime" type="time" value="${escapeAttribute(formatTimeInput(punchMap.endLunch?.timestamp || ""))}" />
        </div>
      </div>
      <div class="form-row three">
        <div class="field-group">
          <label for="client-approved-hours">Approved hours</label>
          <input id="client-approved-hours" name="approvedHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.approvedHours || 0))}" />
        </div>
        <div class="field-group">
          <label for="client-regular-hours">Edit approved regular hours</label>
          <input id="client-regular-hours" name="regularHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.regularHours || 0))}" />
        </div>
        <div class="field-group">
          <label for="client-overtime-hours">Edit approved overtime hours</label>
          <input id="client-overtime-hours" name="overtimeHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.overtimeHours || 0))}" />
        </div>
      </div>
      <div class="field-group">
        <label for="client-correction-reason-select">Correction reason</label>
        <select id="client-correction-reason-select" name="correctionReason">
          ${renderStaticOptions(CLIENT_CORRECTION_REASONS, "", value => value)}
        </select>
      </div>
      <div class="field-group">
        <label for="client-correction-notes">Correction reason details</label>
        <textarea id="client-correction-notes" name="correctionNotes" placeholder="Tell the agency what was corrected and why."></textarea>
      </div>
    `, async values => {
      await saveClientTimecardCorrection(timesheetId, values);
    }, {
      saveLabel: "Save Correction"
    });
  }

  function openClientMissingPunchModal(timesheetId) {
    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      return;
    }
    requirePermission(state.session.role === "clientManager", "Only client managers can add a missing punch here.");
    requirePermission(canApproveRecord(timesheet), "You do not have permission to add a missing punch.");
    const defaultDate = getClientCorrectionDate(timesheet, getScopedData().punches);
    openModal("Add Missing Punch", `
      <input name="timesheetId" type="hidden" value="${escapeAttribute(timesheet.id)}" />
      <div class="form-row two">
        <div class="field-group">
          <label for="missing-punch-action">Missing punch type</label>
          <select id="missing-punch-action" name="action">
            ${renderStaticOptions(Object.keys(PUNCH_LABELS), "clockIn", key => PUNCH_LABELS[key] || key)}
          </select>
        </div>
        <div class="field-group">
          <label for="missing-punch-date">Punch date</label>
          <input id="missing-punch-date" name="punchDate" type="date" value="${escapeAttribute(defaultDate)}" />
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="missing-punch-time">Punch time</label>
          <input id="missing-punch-time" name="punchTime" type="time" value="${escapeAttribute(formatTimeInput(state.now))}" />
        </div>
        <div class="field-group">
          <label for="missing-punch-reason">Correction reason</label>
          <select id="missing-punch-reason" name="correctionReason">
            ${renderStaticOptions(CLIENT_CORRECTION_REASONS, "", value => value)}
          </select>
        </div>
      </div>
      <div class="field-group">
        <label for="missing-punch-notes">Correction details</label>
        <textarea id="missing-punch-notes" name="correctionNotes" placeholder="Explain why the punch is being added."></textarea>
      </div>
    `, async values => {
      await saveClientMissingPunch(timesheetId, values);
    }, {
      saveLabel: "Save Correction"
    });
  }

  function openClientApprovalSignatureModal(timesheetId) {
    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      return;
    }
    requirePermission(state.session.role === "clientManager", "Only client managers can sign this approval flow.");
    requirePermission(canApproveRecord(timesheet), "You do not have permission to approve this timesheet.");
    openModal("Approve and Sign", `
      <div class="notice-card">
        <div>
          <strong>Manager signature is required before approval.</strong>
          <p>Portaly will save the manager name, email, signature, site, and timestamp with this timesheet approval.</p>
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="approval-manager-name">Manager name</label>
          <input id="approval-manager-name" name="managerName" type="text" value="${escapeAttribute(state.session.name || "")}" />
        </div>
        <div class="field-group">
          <label for="approval-manager-email">Manager email</label>
          <input id="approval-manager-email" name="managerEmail" type="email" value="${escapeAttribute(state.session.email || "")}" />
        </div>
      </div>
      <div class="field-group">
        <label for="approval-signature">Type your full name to sign</label>
        <input id="approval-signature" name="signatureText" type="text" placeholder="Type your full name" />
      </div>
      <div class="field-group">
        <label for="approval-signature-note">Approval note</label>
        <textarea id="approval-signature-note" name="approvalNote" placeholder="Optional approval note"></textarea>
      </div>
    `, async values => {
      const managerName = String(values.managerName || "").trim();
      const managerEmail = String(values.managerEmail || "").trim();
      const signatureText = String(values.signatureText || "").trim();
      if (!managerName || !managerEmail || !signatureText) {
        throw new Error("Manager name, email, and signature are required.");
      }
      await approveTimesheet(timesheetId, values.approvalNote || "", {
        managerName,
        managerEmail,
        signatureDataUrl: buildSignatureDataUrl(signatureText),
        signedAt: new Date().toISOString(),
        approvalNote: values.approvalNote || ""
      });
    }, {
      saveLabel: "Approve and Sign"
    });
  }

  async function saveClientTimecardCorrection(timesheetId, values) {
    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      throw new Error("That timesheet could not be found.");
    }
    requirePermission(state.session.role === "clientManager", "Only client managers can save this correction.");
    requirePermission(canApproveRecord(timesheet), "You do not have permission to correct this timecard.");
    if (timesheet.status === "approved") {
      throw new Error("This timecard is locked after approval. Ask the agency admin for an override.");
    }
    const correctionReason = String(values.correctionReason || "").trim();
    if (!correctionReason) {
      throw new Error("Choose a correction reason before saving.");
    }
    const noteText = String(values.correctionNotes || "").trim();
    if (!noteText) {
      throw new Error("Add correction details before saving.");
    }

    const correctionDate = values.correctionDate || getClientCorrectionDate(timesheet, getScopedData().punches);
    const scoped = getScopedData();
    const existingPunchMap = getPunchMapForDate(timesheet, scoped.punches, correctionDate);
    const nowIso = new Date().toISOString();
    let changed = false;

    for (const actionKey of Object.keys(PUNCH_LABELS)) {
      const timeField = `${actionKey}Time`;
      const timeValue = String(values[timeField] || "").trim();
      const existingPunch = existingPunchMap[actionKey] || null;
      if (!timeValue) {
        continue;
      }

      const correctedTimestamp = new Date(`${correctionDate}T${timeValue}:00`).toISOString();
      if (existingPunch && existingPunch.timestamp === correctedTimestamp && existingPunch.action === actionKey && Number(existingPunch.edited ? 1 : 0) === 1) {
        continue;
      }

      const punchPayload = buildClientCorrectionPunchPayload(timesheet, existingPunch, actionKey, correctedTimestamp, correctionReason, noteText, nowIso);
      const punchId = existingPunch?.id || createId("punch");
      await saveData("punches", punchId, punchPayload);
      await appendAuditLog("client_timecard_corrected", "punches", punchId, existingPunch, punchPayload, {
        reason: correctionReason,
        actorId: state.session.userId,
        actorRole: "clientManager",
        createdAt: nowIso
      });
      changed = true;
    }

    const nextApprovedHours = Number(values.approvedHours || 0);
    const nextRegularHours = Number(values.regularHours || 0);
    const nextOvertimeHours = Number(values.overtimeHours || 0);
    const hoursChanged = nextApprovedHours !== Number(timesheet.approvedHours || 0)
      || nextRegularHours !== Number(timesheet.regularHours || 0)
      || nextOvertimeHours !== Number(timesheet.overtimeHours || 0);

    if (hoursChanged) {
      const updatedTimesheet = {
        approvedHours: nextApprovedHours,
        regularHours: nextRegularHours,
        overtimeHours: nextOvertimeHours,
        clientEdited: true,
        clientEditedBy: state.session.userId,
        clientEditedAt: nowIso,
        clientEditReason: correctionReason,
        originalApprovedHours: timesheet.originalApprovedHours ?? Number(timesheet.approvedHours || 0),
        originalRegularHours: timesheet.originalRegularHours ?? Number(timesheet.regularHours || 0),
        originalOvertimeHours: timesheet.originalOvertimeHours ?? Number(timesheet.overtimeHours || 0),
        clientNotes: noteText || timesheet.clientNotes || "",
        updatedAt: nowIso
      };
      await updateData("timesheets", timesheet.id, updatedTimesheet);
      await appendAuditLog("client_timecard_corrected", "timesheets", timesheet.id, timesheet, updatedTimesheet, {
        reason: correctionReason,
        actorId: state.session.userId,
        actorRole: "clientManager",
        createdAt: nowIso
      });
      changed = true;
    }

    const approvalRecord = scoped.approvals.find(approval => approval.timesheetId === timesheet.id);
    if (approvalRecord && changed) {
      await updateData("approvals", approvalRecord.id, {
        note: noteText || approvalRecord.note || correctionReason,
        clientEdited: true,
        clientEditedBy: state.session.userId,
        clientEditedAt: nowIso,
        clientEditReason: correctionReason,
        updatedAt: nowIso
      });
    }

    if (!changed) {
      throw new Error("Make at least one correction before saving.");
    }

    state.modal = null;
    await refreshCurrentView();
    pushToast("Timecard correction saved.", "success");
  }

  async function saveClientMissingPunch(timesheetId, values) {
    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      throw new Error("That timesheet could not be found.");
    }
    requirePermission(state.session.role === "clientManager", "Only client managers can add this missing punch.");
    requirePermission(canApproveRecord(timesheet), "You do not have permission to add a missing punch.");
    if (timesheet.status === "approved") {
      throw new Error("This timecard is locked after approval. Ask the agency admin for an override.");
    }
    const correctionReason = String(values.correctionReason || "").trim();
    if (!correctionReason) {
      throw new Error("Choose a correction reason before saving.");
    }
    if (!values.punchDate || !values.punchTime) {
      throw new Error("Choose the missing punch date and time.");
    }
    if (!String(values.correctionNotes || "").trim()) {
      throw new Error("Add correction details before saving.");
    }

    const nowIso = new Date().toISOString();
    const correctedTimestamp = new Date(`${values.punchDate}T${values.punchTime}:00`).toISOString();
    const punchPayload = buildClientCorrectionPunchPayload(timesheet, null, values.action || "clockIn", correctedTimestamp, correctionReason, values.correctionNotes || "", nowIso);
    const punchId = createId("punch");
    await saveData("punches", punchId, punchPayload);
    await appendAuditLog("client_timecard_corrected", "punches", punchId, null, punchPayload, {
      reason: correctionReason,
      actorId: state.session.userId,
      actorRole: "clientManager",
      createdAt: nowIso
    });

    const approvalRecord = getScopedData().approvals.find(approval => approval.timesheetId === timesheet.id);
    if (approvalRecord) {
      await updateData("approvals", approvalRecord.id, {
        note: values.correctionNotes || approvalRecord.note || correctionReason,
        clientEdited: true,
        clientEditedBy: state.session.userId,
        clientEditedAt: nowIso,
        clientEditReason: correctionReason,
        updatedAt: nowIso
      });
    }

    state.modal = null;
    await refreshCurrentView();
    pushToast("Missing punch added.", "success");
  }

  function buildClientCorrectionPunchPayload(timesheet, existingPunch, actionKey, correctedTimestamp, correctionReason, notes, nowIso) {
    return {
      agencyId: timesheet.agencyId,
      workerId: timesheet.workerId,
      workerName: getWorkerName(timesheet.workerId),
      assignmentId: timesheet.assignmentId || existingPunch?.assignmentId || "",
      clientId: timesheet.clientId,
      clientName: getClientName(timesheet.clientId),
      siteId: timesheet.siteId,
      siteName: getSiteName(timesheet.siteId),
      action: actionKey,
      timestamp: correctedTimestamp,
      source: existingPunch?.source || "client-correction",
      createdBy: existingPunch?.createdBy || state.session.userId || "client-manager",
      edited: true,
      editedBy: state.session.userId,
      editedByRole: "clientManager",
      editedAt: nowIso,
      editReason: correctionReason,
      originalTimestamp: existingPunch?.originalTimestamp || existingPunch?.timestamp || "",
      correctedTimestamp,
      originalAction: existingPunch?.originalAction || existingPunch?.action || actionKey,
      correctedAction: actionKey,
      notes: notes || existingPunch?.notes || "",
      updatedAt: nowIso
    };
  }

  function getClientCorrectionDate(timesheet, punches) {
    const relevantPunches = getTimesheetPunches(timesheet, punches);
    const latest = relevantPunches.slice().sort((left, right) => compareDates(right.timestamp, left.timestamp))[0];
    return formatDateInput(latest?.timestamp || timesheet.payPeriodEnd || state.now);
  }

  function getPunchMapForDate(timesheet, punches, dateValue) {
    const rows = getTimesheetPunches(timesheet, punches).filter(punch => formatDateInput(punch.timestamp) === dateValue);
    return Object.keys(PUNCH_LABELS).reduce((accumulator, actionKey) => {
      const matches = rows.filter(punch => punch.action === actionKey).sort((left, right) => compareDates(right.timestamp, left.timestamp));
      accumulator[actionKey] = matches[0] || null;
      return accumulator;
    }, {});
  }

  function buildSignatureDataUrl(signatureText) {
    return `data:text/plain,${encodeURIComponent(signatureText)}`;
  }

  function buildApprovalCorrectionSummary(timesheet, approval, scoped) {
    const editedPunches = getTimesheetPunches(timesheet, scoped.punches).filter(punch => punch.edited);
    const editedBy = timesheet.clientEditedBy ? getUserName(timesheet.clientEditedBy) : (approval?.clientEditedBy ? getUserName(approval.clientEditedBy) : "");
    return {
      status: editedPunches.length || timesheet.clientEdited || approval?.clientEdited
        ? `Client Edited${editedBy ? ` by ${editedBy}` : ""}`
        : "No client corrections",
      reason: timesheet.clientEditReason || approval?.clientEditReason || (editedPunches[0]?.editReason || "-"),
      signature: approval?.managerName
        ? `${approval.managerName} · ${approval.managerEmail || "-"} · ${formatDateTime(approval.signedAt)}`
        : "Not signed yet"
    };
  }

  async function copyTimesheetCsv(timesheetId) {
    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      throw new Error("That payroll row could not be found.");
    }
    await copyText(buildPayrollCsv([timesheet], false));
  }

  function openAuditHistoryModal(entityType, entityId, title) {
    const logs = getScopedData().auditLogs
      .filter(log => log.entityType === entityType && log.entityId === entityId)
      .sort((left, right) => compareDates(right.timestamp, left.timestamp));
    openModal(title, `
      ${logs.length ? `
        <ul class="history-list">
          ${logs.map(log => `
            <li class="history-item">
              <div>
                <strong>${escapeHtml(formatStatusLabel(log.action.replace(/_/g, " ")))}</strong>
                <p class="inline-note">${escapeHtml(formatDateTime(log.timestamp))}</p>
              </div>
              <span class="status-badge">${escapeHtml(ROLE_META[log.role]?.label || log.role)}</span>
            </li>
          `).join("")}
        </ul>
      ` : renderEmptyState("No audit history yet", "Changes to this record will show here after someone edits it.") }
    `, null, {
      readOnly: true,
      cancelLabel: "Close",
      size: "small"
    });
  }

  function openMarginEditModal(assignmentId, timesheetId) {
    const assignment = findRecord("assignments", assignmentId);
    const timesheet = findRecord("timesheets", timesheetId);
    if (!assignment || !timesheet) {
      return;
    }
    openModal("Edit Margin Inputs", `
      <div class="field-group">
        <label for="margin-status">Assignment status</label>
        <select id="margin-status" name="status">
          ${renderStaticOptions(["active", "ended", "pending"], assignment.status || "active")}
        </select>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="margin-pay-rate">Pay rate</label>
          <input id="margin-pay-rate" name="payRate" type="number" step="0.01" value="${escapeAttribute(String(assignment.payRate || 0))}" />
        </div>
        <div class="field-group">
          <label for="margin-bill-rate">Bill rate</label>
          <input id="margin-bill-rate" name="billRate" type="number" step="0.01" value="${escapeAttribute(String(assignment.billRate || 0))}" />
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="margin-regular-hours">Regular hours</label>
          <input id="margin-regular-hours" name="regularHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.regularHours || 0))}" />
        </div>
        <div class="field-group">
          <label for="margin-overtime-hours">Overtime hours</label>
          <input id="margin-overtime-hours" name="overtimeHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.overtimeHours || 0))}" />
        </div>
      </div>
    `, async values => {
      await updateData("assignments", assignment.id, {
        payRate: Number(values.payRate || 0),
        billRate: Number(values.billRate || 0),
        status: values.status || assignment.status
      });
      await updateData("timesheets", timesheet.id, {
        payRate: Number(values.payRate || 0),
        regularHours: Number(values.regularHours || 0),
        overtimeHours: Number(values.overtimeHours || 0),
        approvedHours: Number(values.regularHours || 0) + Number(values.overtimeHours || 0)
      });
      await appendAuditLog("margin_inputs_updated", "assignments", assignment.id, assignment, {
        ...assignment,
        payRate: Number(values.payRate || 0),
        billRate: Number(values.billRate || 0),
        status: values.status || assignment.status
      });
      state.modal = null;
      await refreshCurrentView();
      pushToast("Margin inputs updated.", "success");
    }, {
      saveLabel: "Save Margin Inputs"
    });
  }

  function openMarginBreakdownModal(assignmentId, timesheetId) {
    const assignment = findRecord("assignments", assignmentId);
    const timesheet = findRecord("timesheets", timesheetId);
    if (!assignment || !timesheet) {
      return;
    }
    const payRate = Number(timesheet.payRate || assignment.payRate || 0);
    const billRate = Number(assignment.billRate || 0);
    const regularHours = Number(timesheet.regularHours || 0);
    const overtimeHours = Number(timesheet.overtimeHours || 0);
    const revenue = billRate * (regularHours + overtimeHours);
    const laborCost = calculateLaborCost(regularHours, overtimeHours, payRate);
    const grossProfit = revenue - laborCost;
    const marginPercent = revenue ? (grossProfit / revenue) * 100 : 0;
    openModal("Margin Breakdown", `
      <div class="detail-grid">
        ${renderDetailBox("Worker", getWorkerName(timesheet.workerId))}
        ${renderDetailBox("Pay rate", formatCurrency(payRate))}
        ${renderDetailBox("Bill rate", formatCurrency(billRate))}
        ${renderDetailBox("Hours", formatHours(regularHours + overtimeHours))}
        ${renderDetailBox("Revenue", formatCurrency(revenue))}
        ${renderDetailBox("Labor cost", formatCurrency(laborCost))}
        ${renderDetailBox("Gross profit", formatCurrency(grossProfit))}
        ${renderDetailBox("Margin %", formatPercent(marginPercent))}
      </div>
    `, null, {
      readOnly: true,
      cancelLabel: "Close",
      size: "small"
    });
  }

  function openQrModal(input = {}) {
    const scoped = getScopedData();
    const site = input.siteId ? findRecord("sites", input.siteId) : scoped.sites[0] || null;
    openModal("Generate Site Punch QR", `
      <input name="qrType" type="hidden" value="site" />
      <div class="field-group">
        <label for="qr-client">Company</label>
        <select id="qr-client" name="clientId">
          ${renderSelectOptions(scoped.clients, site?.clientId || "", "Select company")}
        </select>
      </div>
      <div class="field-group">
        <label for="qr-site">Site / location</label>
        <select id="qr-site" name="siteId">
          ${renderSelectOptions(scoped.sites, site?.id || "", "Select site")}
        </select>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="qr-expiration">Expiration</label>
          <input id="qr-expiration" name="qrExpiresAt" type="date" value="${escapeAttribute(formatDateInput(site?.qrExpiresAt || ""))}" />
        </div>
        <div class="field-group">
          <label for="qr-notes">Notes</label>
          <input id="qr-notes" name="qrNotes" type="text" value="${escapeAttribute(site?.qrNotes || "")}" placeholder="Optional instructions for this QR sheet" />
        </div>
      </div>
      <p class="helper-copy">Portaly will generate one public punch QR for the selected company and site.</p>
    `, null, {
      formName: "qr-save",
      saveLabel: "Save Site QR"
    });
  }

  function openPublishPunchPageModal(initialSiteId = "") {
    requirePermission(canManageSites(), "Only agency owners, admins, or platform owners can publish a site to the punch page.");
    const scoped = getScopedData();
    const activeSites = (scoped.sites || [])
      .filter(site => site && !isInactiveStatus(site.status) && site.clientId)
      .slice()
      .sort((left, right) => `${getClientName(left.clientId)} ${left.name}`.localeCompare(`${getClientName(right.clientId)} ${right.name}`));
    openModal("Publish to Punch Page", `
      <div class="notice-card">
        <div>
          <strong>Publish one live site punch station.</strong>
          <p>Portaly will confirm the site is active, refresh the worker list for that site, and generate the QR-ready punch link.</p>
        </div>
      </div>
      <div class="field-group">
        <label for="publish-punch-site">Site / location</label>
        <select id="publish-punch-site" name="siteId">
          ${renderSelectOptions(activeSites, initialSiteId || activeSites[0]?.id || "", "Select site", "name")}
        </select>
      </div>
      <p class="helper-copy">Workers will open the punch page from this QR and can still type their name manually if they are not assigned yet.</p>
    `, async values => {
      await publishSiteToPunchPage(values.siteId || "");
    }, {
      saveLabel: "Publish to Punch Page",
      saveTone: "button-primary"
    });
  }

  async function publishSiteToPunchPage(siteId) {
    requirePermission(canManageSites(), "Only agency owners, admins, or platform owners can publish a site to the punch page.");
    const site = findRecord("sites", siteId);
    if (!site) {
      throw new Error("Choose a site before publishing the punch page.");
    }
    if (isInactiveStatus(site.status)) {
      throw new Error("Reactivate this site before publishing it to the punch page.");
    }
    if (!site.clientId) {
      throw new Error("Assign the site to a company/client before publishing it to the punch page.");
    }
    const scoped = getScopedData();
    const link = buildSiteLink(site.id);
    const sitePatch = site.qrEnabled === false || !String(site.qrCodeUrl || "").trim()
      ? {
        qrEnabled: true,
        qrCodeUrl: link,
        updatedAt: new Date().toISOString()
      }
      : null;
    const siteForPublish = sitePatch ? { ...site, ...sitePatch } : site;
    if (sitePatch) {
      await updateData("sites", site.id, sitePatch);
    }
    const siteWorkers = getSitePunchWorkers(siteForPublish, scoped.workers || [], scoped.assignments || []);
    const directory = await saveSitePunchDirectory(siteForPublish);
    const companyName = getClientName(site.clientId);
    const qrKey = `publish-${site.id}`;
    const fileName = `portaly-qr-${slugifyFilename(companyName)}-${slugifyFilename(site.name)}.png`;
    const workerNote = siteWorkers.length
      ? `${siteWorkers.length} assigned worker${siteWorkers.length === 1 ? "" : "s"} will appear in the punch dropdown.`
      : "No assigned workers were found yet. Workers can still type their name manually on the punch page.";

    state.modal = null;
    renderApp();
    openModal("Punch Page Published", `
      <div class="detail-grid">
        ${renderDetailBox("Company", companyName)}
        ${renderDetailBox("Site", site.name || "Site")}
        ${renderDetailBox("Assigned Workers", String(siteWorkers.length))}
      </div>
      <div class="qr-preview" style="margin-top: 18px;">
        ${renderQrCanvas(link, qrKey, `${companyName} ${site.name} Punch QR`)}
      </div>
      <p class="helper-copy" style="margin-top: 16px;">${escapeHtml(workerNote)}</p>
      <p class="helper-copy qr-link-text">${escapeHtml(link)}</p>
      <div class="table-actions qr-actions" style="margin-top: 16px;">
        <button class="button button-secondary" data-action="copy-link" data-copy="${escapeAttribute(link)}" data-copy-success="${escapeAttribute("Punch link copied.")}" type="button">Copy Link</button>
        <button class="button button-ghost" data-action="download-qr-png" data-qr-key="${escapeAttribute(qrKey)}" data-link="${escapeAttribute(link)}" data-file-name="${escapeAttribute(fileName)}" type="button">Download PNG</button>
        <button class="button button-ghost" data-action="print-qr-card" data-qr-key="${escapeAttribute(qrKey)}" data-link="${escapeAttribute(link)}" data-company-name="${escapeAttribute(companyName)}" data-site-name="${escapeAttribute(site.name || "Site")}" type="button">Print QR</button>
      </div>
    `, null, {
      readOnly: true,
      cancelLabel: "Close",
      size: "small"
    });
    await appendAuditLog("punch_page_published", "sitePunchDirectories", directory?.id || site.id, null, {
      siteId: site.id,
      agencyId: site.agencyId,
      clientId: site.clientId,
      link,
      workerCount: siteWorkers.length
    });
    pushToast("Punch page published successfully.", "success");
  }

  async function deactivateQrLink(qrType, recordId) {
    requirePermission(canManageSites() || canManageWorkers(), "You do not have permission to change QR links.");
    const collectionName = qrType === "worker" ? "workers" : "sites";
    const record = findRecord(collectionName, recordId);
    if (!record) {
      throw new Error("That QR link could not be found.");
    }
    await updateData(collectionName, recordId, {
      qrEnabled: false
    });
    if (qrType === "site") {
      await deleteData("sitePunchDirectories", recordId);
    }
    await appendAuditLog("qr_link_deactivated", collectionName, recordId, record, { ...record, qrEnabled: false });
    await refreshCurrentView();
    pushToast("QR link deactivated.", "warning");
  }

  function openUserModal(userId) {
    const user = userId ? findRecord("users", userId) : null;
    const scoped = getScopedData();
    const roleOptions = user
      ? ["agencyOwner", "agencyAdmin", "clientManager", "worker"]
      : (state.session.role === "platformOwner" ? ["agencyOwner", "agencyAdmin", "worker", "clientManager"] : ["agencyAdmin", "worker", "clientManager"]);
    openModal(user ? "Edit User" : "Invite User", `
      <input name="id" type="hidden" value="${escapeAttribute(user?.id || "")}" />
      ${state.session.role === "platformOwner" ? `
        <div class="field-group">
          <label for="user-agency">Agency</label>
          <select id="user-agency" name="agencyId">
            ${renderSelectOptions(state.cache.agencies, user?.agencyId || "", "Select agency")}
          </select>
        </div>
      ` : ""}
      <div class="form-row two">
        <div class="field-group">
          <label for="user-first-name">First name</label>
          <input id="user-first-name" name="firstName" type="text" value="${escapeAttribute(user?.firstName || "")}" />
        </div>
        <div class="field-group">
          <label for="user-last-name">Last name</label>
          <input id="user-last-name" name="lastName" type="text" value="${escapeAttribute(user?.lastName || "")}" />
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="user-email">Email</label>
          <input id="user-email" name="email" type="email" value="${escapeAttribute(user?.email || "")}" />
        </div>
        <div class="field-group">
          <label for="user-phone">Phone</label>
          <input id="user-phone" name="phone" type="text" value="${escapeAttribute(user?.phone || "")}" />
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="user-role">Role</label>
          <select id="user-role" name="role">
            ${renderStaticOptions(roleOptions, user?.role || "agencyAdmin", value => ROLE_META[value]?.label || value)}
          </select>
        </div>
        <div class="field-group">
          <label for="user-status">Status</label>
          <select id="user-status" name="status">
            ${renderStaticOptions(["active", "inactive", "invited"], user?.status || "active")}
          </select>
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="user-client">Assigned client</label>
          <select id="user-client" name="assignedClientId">
            ${renderSelectOptions(scoped.clients, user?.assignedClientIds?.[0] || "", "Optional client")}
          </select>
        </div>
        <div class="field-group">
          <label for="user-site">Assigned site</label>
          <select id="user-site" name="assignedSiteId">
            ${renderSelectOptions(scoped.sites, user?.assignedSiteIds?.[0] || "", "Optional site")}
          </select>
        </div>
      </div>
      <div class="field-group">
        <label for="user-worker-link">Linked worker</label>
        <select id="user-worker-link" name="workerId">
          ${renderSelectOptions(scoped.workers, user?.workerId || "", "Optional worker")}
        </select>
      </div>
      ${!user ? `
        <p class="helper-copy">Choose Client Manager here only if you want Portaly to create a site approval invite instead of a full internal staff account.</p>
      ` : ""}
    `, null, {
      formName: "user-save",
      saveLabel: user ? "Save User" : "Invite User"
    });
  }

  async function deactivateUser(userId) {
    requirePermission(canManageUsers(), "Only platform owners and agency owners can manage users.");
    const user = findRecord("users", userId);
    if (!user) {
      throw new Error("That user could not be found.");
    }
    await updateData("users", userId, { status: "inactive" });
    await appendAuditLog("user_deactivated", "users", userId, user, { ...user, status: "inactive" });
    await refreshCurrentView();
    pushToast("User deactivated successfully.", "warning");
  }

  async function sendUserResetPassword(userId) {
    requirePermission(canManageUsers(), "Only platform owners and agency owners can manage users.");
    const user = findRecord("users", userId);
    if (!user?.email) {
      throw new Error("That user record does not have an email address.");
    }
    if (state.session.mode !== "cloud" || !state.firebase.ready) {
      pushToast("Password reset is only available for Cloud Mode users.", "warning");
      return;
    }
    await state.firebase.auth.sendPasswordResetEmail(user.email);
    await appendAuditLog("password_reset_sent", "users", userId, user, { email: user.email });
    pushToast("Password reset email sent.", "success");
  }

  async function createCloudInviteProfile(email, values) {
    if (!email) {
      throw new Error("Enter an email address before inviting a user.");
    }
    if (!state.firebase.ready || !state.firebase.api?.initializeApp || !state.firebase.api?.getAuth) {
      return {
        userId: createId("user"),
        notice: "User profile created, but cloud auth invite is not connected."
      };
    }

    const config = state.firebase.config.firebaseConfig || {};
    const secondaryName = `PortalyInvite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tempPassword = `Portaly!${Math.random().toString(36).slice(2, 10)}9`;
    let secondaryApp = null;

    try {
      secondaryApp = state.firebase.api.initializeApp(config, secondaryName);
      const secondaryAuth = state.firebase.api.getAuth(secondaryApp);
      const credential = await state.firebase.api.createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);
      await state.firebase.api.sendPasswordResetEmail(secondaryAuth, email).catch(() => {});
      await state.firebase.api.signOut(secondaryAuth).catch(() => {});
      if (typeof secondaryApp.delete === "function") {
        await secondaryApp.delete().catch(() => {});
      }
      return {
        userId: credential.user.uid,
        notice: `User invited. A reset email was sent to ${email}.`
      };
    } catch (error) {
      if (secondaryApp && typeof secondaryApp.delete === "function") {
        await secondaryApp.delete().catch(() => {});
      }
      if (String(error?.code || "").includes("email-already-in-use")) {
        throw new Error("That email already exists in Firebase Auth. Ask the user to log in once or reset their password before creating a new profile.");
      }
      throw error;
    }
  }

  async function handlePlanPreview(planId) {
    if (!planId) {
      return;
    }
    state.selectedPlan = planId;
    if (state.session.mode === "demo") {
      const agency = getCurrentAgency();
      const subscription = getCurrentSubscription();
      if (agency) {
        await updateData("agencies", agency.id, { planId });
      }
      if (subscription) {
        await updateData("subscriptions", subscription.id, { planId });
      }
      await refreshCurrentView();
      return;
    }
    await startBillingCheckout(planId);
  }

  async function changeBillingPlan(planId, direction = "change") {
    if (!planId) {
      throw new Error("Choose a plan first.");
    }

    const plan = getPlanDefinition(planId);
    if (!plan) {
      throw new Error("Plan not found.");
    }

    if (!canManageBilling()) {
      throw new Error("Only the agency owner or platform owner can change billing.");
    }

    if (state.session.mode === "demo") {
      const agency = getCurrentAgency();
      const subscription = getCurrentSubscription();
      if (agency) {
        await updateData("agencies", agency.id, {
          planId,
          subscriptionStatus: subscription?.status || agency.subscriptionStatus || "trialing"
        });
      }
      if (subscription) {
        await updateData("subscriptions", subscription.id, {
          planId,
          status: subscription?.status || "trialing",
          updatedAt: new Date().toISOString()
        });
      }
      await appendAuditLog("subscription_changed", "subscriptions", subscription?.id || agency?.id || planId, subscription || agency, {
        planId
      }, {
        reason: `${direction}_plan_demo`
      });
      await refreshCurrentView();
      pushToast(`${plan.label} plan selected in Demo Mode.`, "success");
      return;
    }

    const subscription = getCurrentSubscription();
    if (!subscription?.squareSubscriptionId) {
      await startBillingCheckout(planId);
      return;
    }

    const response = await callBillingFunction("swapSquareSubscriptionPlan", {
      subscriptionId: subscription.squareSubscriptionId,
      newPlanId: planId,
      agencyId: state.session.agencyId
    }, {
      fallbackMessage: "Square subscription updates are not connected yet. Use your secure checkout link or contact support."
    });

    if (!response) {
      return;
    }

    await appendAuditLog("subscription_changed", "subscriptions", subscription.id, subscription, {
      planId
    }, {
      reason: `${direction}_plan`
    });
    await refreshSubscriptionStatus(true, `${plan.label} plan update requested.`);
  }

  function handleBillingPlaceholder(message) {
    state.notice = message;
    storeNotice(state.notice);
    pushToast(message, "success");
    renderApp();
  }

  function normalizeConfigUrl(value) {
    return String(value || "").trim().replace(/\/$/, "");
  }

  function resolveEndpointUrl(baseOrEndpoint, endpoint) {
    const normalized = normalizeConfigUrl(baseOrEndpoint);
    if (!normalized) {
      return "";
    }
    const suffix = `/${String(endpoint || "").trim().replace(/^\//, "")}`;
    if (!suffix || suffix === "/") {
      return normalized;
    }
    return normalized.toLowerCase().endsWith(suffix.toLowerCase())
      ? normalized
      : `${normalized}${suffix}`;
  }

  function getFunctionsBaseUrl() {
    return normalizeConfigUrl(BILLING_CONFIG.functionsBaseUrl || state.firebase.config.functionsBaseUrl || "");
  }

  function getInviteBackendUrl() {
    return normalizeConfigUrl(state.firebase.config.inviteBackendUrl || window.PORTALY_FIREBASE_CONFIG?.inviteBackendUrl || "");
  }

  function hasSecureBackend(baseUrl = "") {
    return !!normalizeConfigUrl(baseUrl || getFunctionsBaseUrl());
  }

  function hasInviteBackend() {
    return !!getInviteBackendUrl();
  }

  function getBillingFunctionsBaseUrl() {
    return getFunctionsBaseUrl();
  }

  function hasBillingBackend() {
    return hasSecureBackend();
  }

  async function callSecureFunction(endpoint, payload = {}, options = {}) {
    const requireAuth = options.requireAuth !== false;
    const requestBaseUrl = normalizeConfigUrl(options.baseUrl || getFunctionsBaseUrl());

    if (!requestBaseUrl) {
      if (typeof options.onNoBackend === "function") {
        options.onNoBackend();
        return null;
      }
      throw new Error(options.fallbackMessage || "This secure Portaly service is not connected yet.");
    }

    const headers = {
      "Content-Type": "application/json"
    };

    if (requireAuth) {
      if (!state.firebase.auth?.currentUser) {
        throw new Error(options.authMessage || "Sign in before using this secure Portaly action.");
      }
      headers.Authorization = `Bearer ${await state.firebase.auth.currentUser.getIdToken()}`;
    }

    const requestUrl = resolveEndpointUrl(requestBaseUrl, endpoint);
    console.log("[Portaly] callSecureFunction requestUrl", requestUrl);
    let response;
    try {
      response = await fetch(requestUrl, {
        method: options.method || "POST",
        headers,
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("[Portaly] callSecureFunction fetchError", {
        endpoint,
        requestUrl,
        error
      });
      if (options.networkErrorMessage) {
        const networkError = new Error(options.networkErrorMessage);
        networkError.code = "network-error";
        networkError.requestUrl = requestUrl;
        networkError.cause = error;
        throw networkError;
      }
      error.code = error.code || "network-error";
      error.requestUrl = requestUrl;
      throw error;
    }

    const data = await response.json().catch(() => ({}));
    console.log("[Portaly] callSecureFunction response", {
      endpoint,
      requestUrl,
      status: response?.status ?? "unknown",
      body: data
    });
    if (!response.ok) {
      const backendError = new Error(data.error || options.errorMessage || "Portaly could not complete this secure request.");
      backendError.status = response.status;
      backendError.body = data;
      backendError.requestUrl = requestUrl;
      throw backendError;
    }
    return data;
  }

  async function callBillingFunction(endpoint, payload = {}, options = {}) {
    return callSecureFunction(endpoint, payload, {
      ...options,
      requireAuth: true,
      authMessage: "Sign in to a cloud account before using Square billing tools.",
      errorMessage: options.errorMessage || "Square billing request failed.",
      onNoBackend: () => handleBillingPlaceholder(options.fallbackMessage || "Square subscription self-service will connect here after the secure backend is deployed.")
    });
  }

  function normalizeStringArray(value) {
    if (Array.isArray(value)) {
      return [...new Set(value.map(item => String(item || "").trim()).filter(Boolean))];
    }
    const normalized = String(value || "").trim();
    return normalized ? [normalized] : [];
  }

  function getInviteConfig() {
    return window.PORTALY_FIREBASE_CONFIG?.inviteConfig || state.firebase.config.inviteConfig || {};
  }

  function canUseFrontendInviteLinks() {
    return !!getInviteConfig().allowFrontendInviteLinks;
  }

  function getInviteExpiryDays() {
    const configuredDays = Number(getInviteConfig().inviteExpiryDays || 14);
    return Number.isFinite(configuredDays) && configuredDays > 0 ? configuredDays : 14;
  }

  function createClientInviteToken() {
    if (window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(24);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    }
    return `${createId("invite")}_${Math.random().toString(36).slice(2, 18)}`;
  }

  function buildClientManagerInviteLink(token) {
    const baseUrl = String(window.PORTALY_FIREBASE_CONFIG?.appUrl || state.firebase.config.appUrl || DEFAULT_APP_URL || window.location.href || "").replace(/#.*$/, "");
    return `${baseUrl}#/accept-invite/${encodeURIComponent(String(token || "").trim())}`;
  }

  function findLocalClientInvite(token) {
    const inviteToken = String(token || "").trim();
    if (!inviteToken) {
      return null;
    }
    return (state.demoStore.clientInvites || []).find(invite => invite.inviteToken === inviteToken) || null;
  }

  function buildLocalClientInviteDetails(invite) {
    if (!invite) {
      return null;
    }
    const clientIds = Array.isArray(invite.assignedClientIds) ? invite.assignedClientIds : [];
    const siteIds = Array.isArray(invite.assignedSiteIds) ? invite.assignedSiteIds : [];
    return {
      ...invite,
      source: "demo",
      inviteLink: invite.inviteLink || buildClientManagerInviteLink(invite.inviteToken),
      agencyName: getAgencyName(invite.agencyId) || "Portaly Demo Agency",
      assignedClientNames: clientIds.map(id => getClientNameFromStore(id, state.demoStore.clients || [])),
      assignedSiteNames: siteIds.map(id => getSiteNameFromStore(id, state.demoStore.sites || [])),
      authAccountExists: false
    };
  }

  function buildCloudInviteDetails(invite, source = "cloud-frontend") {
    if (!invite) {
      return null;
    }
    const clientIds = Array.isArray(invite.assignedClientIds) ? invite.assignedClientIds : [];
    const siteIds = Array.isArray(invite.assignedSiteIds) ? invite.assignedSiteIds : [];
    return {
      ...invite,
      source,
      status: String(invite.status || "pending").trim().toLowerCase() || "pending",
      emailStatus: String(invite.emailStatus || "pending").trim().toLowerCase() || "pending",
      providerMessageId: invite.providerMessageId || "",
      resendEmailId: invite.resendEmailId || "",
      openedCount: Number(invite.openedCount || 0),
      openedAt: invite.openedAt || "",
      lastOpenedAt: invite.lastOpenedAt || "",
      inviteLink: invite.inviteLink || buildClientManagerInviteLink(invite.inviteToken || invite.id),
      agencyName: invite.agencyName || getAgencyName(invite.agencyId) || getCurrentAgency()?.name || "Portaly Agency",
      assignedClientNames: invite.assignedClientNames || clientIds.map(id => getClientName(id)).filter(name => name && name !== "Unknown Client"),
      assignedSiteNames: invite.assignedSiteNames || siteIds.map(id => getSiteName(id)).filter(name => name && name !== "Unknown Site"),
      authAccountExists: invite.authAccountExists === true
    };
  }

  function getPublicInviteErrorMessage(error) {
    const code = String(error?.code || "").trim().toLowerCase();
    const message = String(error?.message || "").trim().toLowerCase();
    if (message === getMissingInviteMessage().toLowerCase()) {
      return getMissingInviteMessage();
    }
    if (message === getMalformedInviteMessage().toLowerCase()) {
      return getMalformedInviteMessage();
    }
    if (message === getAcceptedInviteMessage().toLowerCase()) {
      return getAcceptedInviteMessage();
    }
    if (message === getRevokedInviteMessage().toLowerCase()) {
      return getRevokedInviteMessage();
    }
    if (
      code === "permission-denied"
      || message.includes("permission")
      || message.includes("insufficient permissions")
    ) {
      return "This invite could not be opened because it is missing pending status or rules were not published.";
    }
    if (
      ["unauthenticated", "unavailable", "failed-precondition", "not-found"].includes(code)
      || message.includes("failed to fetch")
      || message.includes("could not be found")
      || message.includes("no longer available")
      || message.includes("network")
    ) {
      return "This invite link is invalid, expired, or no longer available.";
    }
    return "This invite link is invalid, expired, or no longer available.";
  }

  async function loadInviteFromBackend(token, options = {}) {
    const inviteBackendUrl = getInviteBackendUrl();
    if (!inviteBackendUrl) {
      return null;
    }

    try {
      const result = await callSecureFunction("verifyClientManagerInvite", {
        token
      }, {
        baseUrl: inviteBackendUrl,
        requireAuth: false,
        errorMessage: "Portaly could not verify this invite.",
        networkErrorMessage: "Portaly could not verify this invite."
      });
      return buildCloudInviteDetails(result?.invite || null, "cloud-backend");
    } catch (error) {
      if (!options.silent) {
        reportRuntimeIssue("loadInviteFromBackend failed", error, {
          toastMessage: ""
        });
      }
      return null;
    }
  }

  function shouldTrackInviteOpen(invite) {
    return PUBLIC_INVITE_STATUSES.has(String(invite?.status || "").trim().toLowerCase());
  }

  async function trackInviteOpened(inviteToken, invite) {
    if (!inviteToken || !shouldTrackInviteOpen(invite) || !hasInviteBackend()) {
      return;
    }

    const refreshedInvite = await loadInviteFromBackend(inviteToken, { silent: true });
    if (!refreshedInvite) {
      return;
    }

    if (state.inviteFlow.token === inviteToken) {
      state.inviteFlow.details = refreshedInvite;
      state.inviteFlow.error = "";
      renderApp();
    }
  }

  async function createCloudClientManagerInvite(payload, options = {}) {
    if (!state.firebase.ready || !state.firebase.db) {
      throw new Error("Cloud invite links are not available until Firebase is fully connected.");
    }

    const createdAt = new Date().toISOString();
    const inviteToken = createClientInviteToken();
    const inviteUrl = buildClientManagerInviteLink(inviteToken);
    const invite = buildCloudInviteDetails({
      id: inviteToken,
      agencyId: payload.agencyId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone || "",
      role: "clientManager",
      assignedClientIds: payload.assignedClientIds,
      assignedSiteIds: payload.assignedSiteIds,
      status: "pending",
      inviteMode: options.inviteMode || payload.inviteMode || "firestoreFallback",
      inviteToken,
      tokenExpiresAt: addDays(new Date(createdAt), getInviteExpiryDays()).toISOString(),
      openedAt: "",
      lastOpenedAt: "",
      openedCount: 0,
      acceptedAt: "",
      acceptedBy: "",
      createdBy: state.session.userId,
      createdAt,
      updatedAt: createdAt,
      emailStatus: "pending",
      emailProvider: options.emailProvider || payload.emailProvider || "manual",
      providerMessageId: "",
      resendEmailId: "",
      emailLastError: "",
      agencyName: getAgencyName(payload.agencyId) || getCurrentAgency()?.name || "Portaly Agency",
      assignedClientNames: payload.assignedClientIds.map(id => getClientName(id)).filter(name => name && name !== "Unknown Client"),
      assignedSiteNames: payload.assignedSiteIds.map(id => getSiteName(id)).filter(name => name && name !== "Unknown Site"),
      authAccountExists: false,
      inviteLink: inviteUrl
    }, "cloud-frontend");

    console.log("[Portaly] createCloudClientManagerInvite payload", payload);
    console.log("[Portaly] createCloudClientManagerInvite inviteUrl", inviteUrl);
    await saveData("clientInvites", inviteToken, invite);
    return invite;
  }

  async function loadFrontendCloudInvite(token) {
    if (!state.firebase.ready || !state.firebase.db) {
      throw new Error("Cloud invite links are not available until Firebase is fully connected.");
    }

    const documentPath = `clientInvites/${String(token || "").trim()}`;
    const authUser = state.firebase.auth?.currentUser || state.authUser || null;
    console.log("[Portaly] loadFrontendCloudInvite", {
      token,
      documentPath,
      firebaseReady: state.firebase.ready,
      authState: authUser
        ? {
          uid: authUser.uid || "",
          email: authUser.email || ""
        }
        : null
    });

    try {
      const snapshot = await state.firebase.db.collection("clientInvites").doc(token).get();
      const snapshotData = snapshot.exists ? (snapshot.data() || {}) : null;
      console.log("[Portaly] loadFrontendCloudInvite snapshot", {
        token,
        documentPath,
        exists: snapshot.exists,
        status: snapshot.exists ? (snapshotData?.status || "") : "",
        inviteId: snapshot.id || "",
        inviteData: snapshotData
      });
      if (!snapshot.exists) {
        const backendInvite = await loadInviteFromBackend(token, { silent: true });
        if (backendInvite) {
          void trackInviteOpened(token, backendInvite);
          return backendInvite;
        }
        throw new Error(getMissingInviteMessage());
      }
      if (snapshot.id !== token) {
        throw new Error(getMalformedInviteMessage());
      }
      if (!snapshotData || typeof snapshotData.status !== "string" || !snapshotData.status.trim()) {
        throw new Error(getMalformedInviteMessage());
      }
      if (snapshotData.inviteToken !== snapshot.id) {
        throw new Error(getMalformedInviteMessage());
      }
      if (snapshotData.status === "accepted") {
        throw new Error(getAcceptedInviteMessage());
      }
      if (snapshotData.status === "revoked") {
        throw new Error(getRevokedInviteMessage());
      }
      const invite = buildCloudInviteDetails({ id: snapshot.id, ...snapshotData }, "cloud-frontend");
      void trackInviteOpened(token, invite);
      return invite;
    } catch (error) {
      if ((String(error?.code || "").toLowerCase() === "permission-denied" || isNetworkErrorLike(error)) && hasInviteBackend()) {
        const backendInvite = await loadInviteFromBackend(token, { silent: true });
        if (backendInvite) {
          return backendInvite;
        }
      }
      console.error("[Portaly] loadFrontendCloudInvite failed", {
        token,
        documentPath,
        firebaseReady: state.firebase.ready,
        authState: authUser
          ? {
            uid: authUser.uid || "",
            email: authUser.email || ""
          }
          : null,
        errorCode: error?.code || "",
        errorMessage: error?.message || "",
        error
      });
      const publicError = getPublicInviteErrorMessage(error);
      if (String(error?.code || "").toLowerCase() === "permission-denied") {
        throw new Error("This invite could not be opened because it is missing pending status or rules were not published.");
      }
      throw new Error(publicError);
    }
  }

  async function acceptFrontendCloudInvite(invite, authUser) {
    if (!state.firebase.ready || !state.firebase.db) {
      throw new Error("Cloud invite acceptance is not available until Firebase is fully connected.");
    }
    const inviteStatus = String(invite?.status || "").trim().toLowerCase();
    if (inviteStatus === "revoked") {
      throw new Error(getRevokedInviteMessage());
    }
    if (inviteStatus === "expired") {
      throw new Error("This invite has expired. Ask the agency to send a new invite.");
    }
    if (!PUBLIC_INVITE_STATUSES.has(inviteStatus) && inviteStatus !== "accepted") {
      throw new Error("This invite is no longer pending. Ask your staffing agency for a fresh link.");
    }

    const existingProfile = await loadCloudUserProfile(authUser.uid);
    if (existingProfile?.agencyId && existingProfile.agencyId !== invite.agencyId) {
      throw new Error("This email is already connected to a different Portaly agency.");
    }
    if (existingProfile?.role && existingProfile.role !== "clientManager") {
      throw new Error("This Portaly login already belongs to a different role.");
    }

    const acceptedAt = new Date().toISOString();
    const mergedClientIds = [...new Set([...(existingProfile?.assignedClientIds || []), ...normalizeStringArray(invite.assignedClientIds)])];
    const mergedSiteIds = [...new Set([...(existingProfile?.assignedSiteIds || []), ...normalizeStringArray(invite.assignedSiteIds)])];
    const userProfile = {
      id: authUser.uid,
      agencyId: invite.agencyId,
      role: "clientManager",
      firstName: invite.firstName || existingProfile?.firstName || "",
      lastName: invite.lastName || existingProfile?.lastName || "",
      email: invite.email,
      phone: invite.phone || existingProfile?.phone || "",
      status: "active",
      assignedClientIds: mergedClientIds,
      assignedSiteIds: mergedSiteIds,
      workerId: "",
      inviteToken: invite.inviteToken || invite.id,
      createdAt: existingProfile?.createdAt || acceptedAt,
      updatedAt: acceptedAt
    };

    await state.firebase.db.collection("users").doc(authUser.uid).set(userProfile, { merge: false });
    const invitePatch = {
      status: "accepted",
      acceptedAt,
      acceptedBy: authUser.uid,
      updatedAt: acceptedAt,
      authAccountExists: true
    };
    await state.firebase.db.collection("clientInvites").doc(invite.id || invite.inviteToken).set(invitePatch, { merge: true });
    const updatedInvite = {
      ...invite,
      ...invitePatch
    };

    return {
      invite: buildCloudInviteDetails(updatedInvite, "cloud-frontend"),
      user: userProfile
    };
  }

  async function loadInviteFlowState(tokenInput = "", options = {}) {
    const token = String(parseInviteHash() || tokenInput || getStoredPendingInviteToken() || "").trim();
    if (!token) {
      state.inviteFlow = {
        token: "",
        loading: false,
        details: null,
        error: ""
      };
      clearPendingInviteToken();
      return null;
    }

    if (!options.force && state.inviteFlow.token === token && !state.inviteFlow.loading && (state.inviteFlow.details || state.inviteFlow.error)) {
      return state.inviteFlow.details;
    }

    storePendingInviteToken(token);
    state.inviteFlow = {
      token,
      loading: true,
      details: null,
      error: ""
    };
    if (state.initialized) {
      renderApp();
    }

    try {
      const localInvite = buildLocalClientInviteDetails(findLocalClientInvite(token));
      if (localInvite) {
        state.inviteFlow = {
          token,
          loading: false,
          details: localInvite,
          error: ""
        };
        return localInvite;
      }

      const details = await loadFrontendCloudInvite(token);
      state.inviteFlow = {
        token,
        loading: false,
        details,
        error: ""
      };
      return details;
    } catch (error) {
      console.error("[Portaly] loadInviteFlowState failed", {
        token,
        firebaseReady: state.firebase.ready,
        errorCode: error?.code || "",
        errorMessage: error?.message || "",
        error
      });
      state.inviteFlow = {
        token,
        loading: false,
        details: null,
        error: error?.message === getMissingInviteMessage()
          ? getMissingInviteMessage()
          : getPublicInviteErrorMessage(error)
      };
      console.error("[Portaly] loadInviteFlowState failed", {
        token,
        inviteFlow: state.inviteFlow,
        error
      });
      return null;
    }
  }

  function renderCheckboxOptionList(name, rows, selectedIds, labelBuilder) {
    const selected = new Set(normalizeStringArray(selectedIds));
    return (rows || []).map(row => `
      <label class="checkbox-row compact">
        <input type="checkbox" name="${escapeAttribute(name)}" value="${escapeAttribute(row.id)}" ${selected.has(row.id) ? "checked" : ""} />
        <span>${escapeHtml(labelBuilder(row))}</span>
      </label>
    `).join("");
  }

  function resolveInviteAgencyId(assignedClientIds, assignedSiteIds, explicitAgencyId = "") {
    const agencyIds = new Set();
    const requestedAgencyId = String(explicitAgencyId || "").trim();
    if (requestedAgencyId) {
      agencyIds.add(requestedAgencyId);
    }

    normalizeStringArray(assignedClientIds).forEach(clientId => {
      const client = findRecord("clients", clientId);
      if (client?.agencyId) {
        agencyIds.add(client.agencyId);
      }
    });

    normalizeStringArray(assignedSiteIds).forEach(siteId => {
      const site = findRecord("sites", siteId);
      if (site?.agencyId) {
        agencyIds.add(site.agencyId);
      }
    });

    if (agencyIds.size > 1) {
      throw new Error("Assigned clients and sites must belong to the same agency before you send this invite.");
    }

    const [resolvedAgencyId] = [...agencyIds];
    if (resolvedAgencyId) {
      return resolvedAgencyId;
    }

    if (state.session.agencyId) {
      return state.session.agencyId;
    }

    throw new Error("Choose a client or site from one agency before creating this client manager invite.");
  }

  function openClientManagerInviteModal(options = {}) {
    const scoped = getScopedData();
    const selectedClientIds = options.clientId ? [options.clientId] : [];
    const selectedSiteIds = options.siteId ? [options.siteId] : [];
    const availableSites = selectedClientIds.length
      ? scoped.sites.filter(site => selectedClientIds.includes(site.clientId) || selectedSiteIds.includes(site.id))
      : scoped.sites;

    openModal("Invite Client Manager", `
      <div class="notice-card">
        <div>
          <strong>Invite a client manager to review and approve timecards.</strong>
          <p>Portaly will keep their access limited to the assigned client and site only. If automated email is not connected yet, the invite will still be saved as pending so you can copy the link or activate the manager manually.</p>
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="invite-first-name">First name</label>
          <input id="invite-first-name" name="firstName" type="text" placeholder="Jordan" />
        </div>
        <div class="field-group">
          <label for="invite-last-name">Last name</label>
          <input id="invite-last-name" name="lastName" type="text" placeholder="Lee" />
        </div>
      </div>
      <div class="form-row two">
        <div class="field-group">
          <label for="invite-email">Email</label>
          <input id="invite-email" name="email" type="email" placeholder="manager@client.com" />
        </div>
        <div class="field-group">
          <label for="invite-phone">Phone</label>
          <input id="invite-phone" name="phone" type="text" placeholder="(555) 555-0144" />
        </div>
      </div>
      <input name="role" type="hidden" value="clientManager" />
      <input name="status" type="hidden" value="invited" />
      <div class="field-group">
        <label>Assigned clients</label>
        <div class="checkbox-stack">
          ${renderCheckboxOptionList("assignedClientIds", scoped.clients, selectedClientIds, client => client.name)}
        </div>
      </div>
      <div class="field-group">
        <label>Assigned sites</label>
        <div class="checkbox-stack">
          ${renderCheckboxOptionList("assignedSiteIds", availableSites, selectedSiteIds, site => `${site.name} - ${getClientName(site.clientId)}`)}
        </div>
      </div>
      <p class="helper-copy">Use one or both assignments. Client managers will only see approvals and timecards for the selected scope.</p>
    `, null, {
      formName: "client-manager-invite",
      saveLabel: "Create Invite"
    });
  }

  async function createDemoClientManagerInvite(payload) {
    const createdAt = new Date().toISOString();
    const userId = createId("user");
    const inviteToken = `${createId("cm")}_${Math.random().toString(36).slice(2, 12)}`;
    const tokenExpiresAt = addDays(new Date(createdAt), 14).toISOString();
    const user = {
      agencyId: payload.agencyId,
      role: "clientManager",
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      status: "invited",
      assignedClientIds: payload.assignedClientIds,
      assignedSiteIds: payload.assignedSiteIds,
      workerId: ""
    };
    await saveData("users", userId, user);
    const invite = {
      agencyId: payload.agencyId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      role: "clientManager",
      assignedClientIds: payload.assignedClientIds,
      assignedSiteIds: payload.assignedSiteIds,
      status: "pending",
      inviteMode: "demoFallback",
      inviteToken,
      tokenExpiresAt,
      openedAt: "",
      lastOpenedAt: "",
      openedCount: 0,
      acceptedAt: "",
      acceptedBy: "",
      createdAt,
      updatedAt: createdAt,
      createdBy: state.session.userId,
      inviteLink: buildClientManagerInviteLink(inviteToken),
      authAccountExists: false,
      emailStatus: "pending",
      emailProvider: "manual",
      providerMessageId: "",
      resendEmailId: "",
      emailLastError: "",
      userId
    };
    return saveData("clientInvites", inviteToken, {
      ...invite,
      id: inviteToken
    });
  }

  function buildInviteEmailActionAttributes(invite) {
    const inviteLink = invite?.inviteLink || buildClientManagerInviteLink(invite?.inviteToken || invite?.id || "");
    return `
      data-invite-id="${escapeAttribute(invite?.id || "")}"
      data-invite-token="${escapeAttribute(invite?.inviteToken || invite?.id || "")}"
      data-agency-id="${escapeAttribute(invite?.agencyId || "")}"
      data-email="${escapeAttribute(invite?.email || "")}"
      data-first-name="${escapeAttribute(invite?.firstName || "")}"
      data-last-name="${escapeAttribute(invite?.lastName || "")}"
      data-link="${escapeAttribute(inviteLink)}"
    `.replace(/\s+/g, " ").trim();
  }

  function getInviteEmailButtonLabel(invite) {
    const status = String(invite?.status || "").trim().toLowerCase();
    const emailStatus = String(invite?.emailStatus || "").trim().toLowerCase();
    if (emailStatus === "sent" || status === "sent" || status === "opened") {
      return "Resend Invite";
    }
    return "Send Invite Email";
  }

  function openInviteSuccessModal(invite) {
    if (!invite) {
      return;
    }
    const assignedClients = (invite.assignedClientNames || normalizeStringArray(invite.assignedClientIds).map(id => getClientName(id))).filter(Boolean);
    const assignedSites = (invite.assignedSiteNames || normalizeStringArray(invite.assignedSiteIds).map(id => getSiteName(id))).filter(Boolean);
    const inviteLink = invite.inviteLink || buildClientManagerInviteLink(invite.inviteToken || invite.id || "");
    const inviteEmailAttrs = buildInviteEmailActionAttributes({
      ...invite,
      inviteLink
    });
    const fallbackInviteMessage = invite.inviteMode === "firestoreFallback"
      ? `
        <div class="notice-card" style="margin: 0 0 16px;">
          <div>
            <strong>Invite saved as pending.</strong>
            <p>Email sending is not connected yet, but the manager can be activated manually.</p>
          </div>
        </div>
      `
      : "";
    openModal("Client Manager Invite Ready", `
      <div class="approval-review-card">
        <p class="eyebrow">Invite ready</p>
        <h3>Copy this secure invite link and send it to the client manager.</h3>
        <p>The client manager will use this invite to set up access and approve assigned site timecards in Portaly.</p>
        ${fallbackInviteMessage}
        <div class="detail-grid" style="margin-top: 18px;">
          ${renderDetailBox("Email", invite.email || "-")}
          ${renderDetailBox("Status", formatStatusLabel(invite.status || "pending"))}
          ${renderDetailBox("Assigned clients", assignedClients.join(", ") || "None selected")}
          ${renderDetailBox("Assigned sites", assignedSites.join(", ") || "None selected")}
        </div>
        <div class="approval-action-row" style="margin-top: 18px;">
          <button class="button button-primary" data-action="copy-link" data-copy="${escapeAttribute(inviteLink)}" data-copy-success="${escapeAttribute("Invite link copied successfully. Send this link to the client manager.")}" type="button">Copy Invite Link</button>
          <button class="button button-secondary" data-action="send-client-invite-email" ${inviteEmailAttrs} type="button">${escapeHtml(getInviteEmailButtonLabel(invite))}</button>
          <button class="button button-ghost" data-action="open-invite-email-draft" ${inviteEmailAttrs} type="button">Open Email Draft</button>
          <button class="button button-ghost" data-action="magic-link-placeholder" type="button">Magic Link Login</button>
        </div>
        <p class="helper-copy" style="margin-top: 16px;">You've been invited to Portaly to review and approve timecards for your assigned site.</p>
        <p class="helper-copy" style="margin-top: 8px;">If the email does not arrive, copy the invite link and send it manually.</p>
      </div>
    `, null, {
      readOnly: true,
      cancelLabel: "Close",
      size: "small"
    });
  }

  function normalizeInviteEmailPayload(values = {}) {
    const inviteRecord = values.inviteId ? findRecord("clientInvites", values.inviteId) : null;
    const invite = inviteRecord ? { ...inviteRecord, ...values } : { ...values };
    const inviteToken = String(invite.inviteToken || invite.id || values.inviteToken || "").trim();
    const inviteId = String(invite.id || values.inviteId || inviteToken).trim();
    return {
      inviteId,
      inviteToken,
      agencyId: String(invite.agencyId || values.agencyId || state.session.agencyId || "").trim(),
      email: String(invite.email || values.email || "").trim().toLowerCase(),
      firstName: String(invite.firstName || values.firstName || "").trim(),
      lastName: String(invite.lastName || values.lastName || "").trim(),
      inviteUrl: String(invite.inviteLink || values.inviteUrl || values.link || (inviteToken ? buildClientManagerInviteLink(inviteToken) : "")).trim()
    };
  }

  function buildInviteEmailDraft(values = {}) {
    const payload = normalizeInviteEmailPayload(values);
    const inviteRecord = payload.inviteId ? findRecord("clientInvites", payload.inviteId) : null;
    const agencyName = inviteRecord?.agencyName || getAgencyName(payload.agencyId) || getCurrentAgency()?.name || "Portaly Agency";
    const subject = "You've been invited to approve timecards in Portaly";
    const body = [
      `Hi ${payload.firstName || "there"},`,
      "",
      `${agencyName} has invited you to Portaly to review and approve assigned site timecards.`,
      "",
      "Use this secure invite link to set up access:",
      payload.inviteUrl,
      "",
      "If the link does not open, copy and paste it into your browser."
    ].join("\n");
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(payload.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return {
      payload,
      subject,
      body,
      gmailComposeUrl
    };
  }

  function openInviteEmailDraft(values = {}, toastMessage = "A Gmail draft was opened so you can send the invite manually.") {
    const draft = buildInviteEmailDraft(values);
    console.log("[Portaly] openInviteEmailDraft", {
      email: draft.payload.email,
      inviteToken: draft.payload.inviteToken,
      inviteUrl: draft.payload.inviteUrl,
      gmailComposeUrl: draft.gmailComposeUrl
    });
    window.open(draft.gmailComposeUrl, "_blank", "noopener");
    if (toastMessage) {
      pushToast(toastMessage, "warning");
    }
  }

  async function sendClientManagerInviteEmail(values = {}) {
    const payload = normalizeInviteEmailPayload(values);
    if (!payload.inviteToken || !payload.email) {
      throw new Error("This client manager invite is missing the email details needed to send it.");
    }

    const functionsBaseUrl = getFunctionsBaseUrl();
    console.log("[Portaly] sendClientManagerInviteEmail functionsBaseUrl", functionsBaseUrl || "(empty)");
    console.log("[Portaly] sendClientManagerInviteEmail inviteToken", payload.inviteToken);
    console.log("[Portaly] sendClientManagerInviteEmail inviteUrl", payload.inviteUrl);

    if (!functionsBaseUrl) {
      openInviteEmailDraft(payload, "Gmail API is not connected yet. A draft was opened so you can send the invite manually.");
      return;
    }

    const authUser = state.firebase.auth?.currentUser;
    if (!authUser) {
      throw new Error("Sign in to your cloud agency before sending invite emails.");
    }
    const idToken = await authUser.getIdToken();
    const requestUrl = `${functionsBaseUrl}/sendClientManagerInviteEmailViaGmail`;
    console.log("[Portaly] sendClientManagerInviteEmail requestUrl", requestUrl);

    let response;
    try {
      response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inviteToken: payload.inviteToken,
          inviteUrl: payload.inviteUrl
        })
      });
    } catch (error) {
      console.error("[Portaly] sendClientManagerInviteEmail fetchError", error);
      openInviteEmailDraft(payload, "Could not reach the Gmail invite backend. A draft was opened so you can send the invite manually.");
      return;
    }

    console.log("[Portaly] sendClientManagerInviteEmail responseStatus", response?.status ?? "unknown");

    const responseText = await response.text().catch(() => "");
    let result = {};
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        result = {
          rawBody: responseText
        };
      }
    }
    console.log("[Portaly] sendClientManagerInviteEmail responseBody", result);
    if (!response.ok) {
      console.error("[Portaly] sendClientManagerInviteEmail backendError", result);
      try {
        await refreshSessionData();
        renderApp();
      } catch (refreshError) {
        console.error("[Portaly] sendClientManagerInviteEmail refreshAfterErrorFailed", refreshError);
      }
      const backendMessage = result.error || result.message || "Portaly could not send this invite email.";
      if (response.status === 503 || /gmail api/i.test(backendMessage) || /gmail invite email/i.test(backendMessage)) {
        openInviteEmailDraft(payload, "Gmail API is not configured yet. A draft was opened so you can send the invite manually.");
        return;
      }
      throw new Error(backendMessage);
    }

    await refreshSessionData();
    renderApp();
    pushToast("Invite email sent successfully.", "success");
  }

  async function submitClientManagerInvite(values) {
    requirePermission(canInviteClientManagers(), "Only agency owners, agency admins, or platform owners can invite client managers.");
    const assignedClientIds = normalizeStringArray(values.assignedClientIds);
    const assignedSiteIds = normalizeStringArray(values.assignedSiteIds);
    if (!values.firstName || !values.lastName || !values.email) {
      throw new Error("First name, last name, and email are required.");
    }
    if (!assignedClientIds.length && !assignedSiteIds.length) {
      throw new Error("Assign at least one client or site before sending the invite.");
    }
    const agencyId = resolveInviteAgencyId(assignedClientIds, assignedSiteIds, values.agencyId || state.session.agencyId);

    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: String(values.email || "").trim().toLowerCase(),
      phone: values.phone || "",
      assignedClientIds,
      assignedSiteIds,
      agencyId,
      inviteMode: "firestoreFallback"
    };

    const inviteBackendUrl = getInviteBackendUrl();
    const allowFrontendInviteLinks = window.PORTALY_FIREBASE_CONFIG?.inviteConfig?.allowFrontendInviteLinks === true || canUseFrontendInviteLinks();
    console.log("[Portaly] submitClientManagerInvite inviteBackendUrl", inviteBackendUrl || "(empty)");
    console.log("[Portaly] submitClientManagerInvite allowFrontendInviteLinks", allowFrontendInviteLinks);
    console.log("[Portaly] submitClientManagerInvite payload", payload);

    let invite;
    let usedFallbackInviteMode = false;
    if (state.session.mode === "cloud") {
      if (inviteBackendUrl) {
        try {
          const result = await callSecureFunction("createClientManagerInvite", payload, {
            baseUrl: inviteBackendUrl,
            requireAuth: true,
            authMessage: "Sign in to your cloud agency before inviting client managers.",
            errorMessage: "Portaly could not create this client manager invite.",
            networkErrorMessage: "Could not reach the secure Portaly invite service."
          });
          if (!result?.invite) {
            return;
          }
          invite = buildCloudInviteDetails(result.invite, "cloud-backend") || result.invite;
        } catch (error) {
          if (allowFrontendInviteLinks) {
            console.warn("[Portaly] submitClientManagerInvite falling back to Firestore invite storage", error);
            invite = await createCloudClientManagerInvite(payload, {
              inviteMode: "firestoreFallback",
              emailProvider: "manual"
            });
            usedFallbackInviteMode = true;
          } else {
            throw error;
          }
        }
      } else if (allowFrontendInviteLinks) {
        invite = await createCloudClientManagerInvite(payload, {
          inviteMode: "firestoreFallback",
          emailProvider: "manual"
        });
        usedFallbackInviteMode = true;
      } else {
        throw new Error("Client manager invites are not connected yet. Turn on frontend invite links or add an invite backend URL.");
      }
    } else {
      invite = await createDemoClientManagerInvite(payload);
    }

    console.log("[Portaly] submitClientManagerInvite inviteUrl", invite?.inviteLink || "");

    await appendAuditLog("client_manager_invited", "clientInvites", invite.id, null, invite, {
      actorId: state.session.userId,
      actorRole: state.session.role
    });
    state.modal = null;
    await refreshCurrentView();
    if (usedFallbackInviteMode) {
      pushToast("Invite saved as pending. Email sending is not connected yet, but the manager can be activated manually.", "success");
    }
    const inviteLink = invite?.inviteLink || buildClientManagerInviteLink(invite?.inviteToken || invite?.id || "");
    if (inviteLink) {
      try {
        await copyText(inviteLink, "Invite link copied successfully. Send this link to the client manager.");
      } catch (error) {
        console.warn("[Portaly] invite link copy failed", error);
        pushToast("Invite link created successfully.", "success");
      }
    } else {
      pushToast("Invite link created successfully.", "success");
    }
    openInviteSuccessModal(invite);
  }

  async function submitAcceptInviteCreate(values) {
    if (!state.firebase.ready) {
      throw new Error("Cloud invite acceptance is not connected yet. Open this invite from the live Portaly site after Firebase is enabled.");
    }

    const invite = state.inviteFlow.details || await loadInviteFlowState("", { force: true });
    if (!invite) {
      throw new Error(state.inviteFlow.error || "This invite could not be loaded.");
    }
    if (!values.password || !values.confirmPassword) {
      throw new Error("Create and confirm a password to continue.");
    }
    if (values.password !== values.confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    let authResult;
    try {
      authResult = await state.firebase.auth.createUserWithEmailAndPassword(invite.email, values.password);
    } catch (error) {
      throw new Error(formatSignupAuthError(error));
    }
    state.authUser = authResult.user;
    await acceptCurrentInvite({
      token: invite.inviteToken || state.inviteFlow.token,
      authUser: authResult.user
    });
  }

  async function submitAcceptInviteLogin(values) {
    if (!state.firebase.ready) {
      throw new Error("Cloud invite acceptance is not connected yet. Open this invite from the live Portaly site after Firebase is enabled.");
    }

    const invite = state.inviteFlow.details || await loadInviteFlowState("", { force: true });
    if (!invite) {
      throw new Error(state.inviteFlow.error || "This invite could not be loaded.");
    }
    if (!values.password) {
      throw new Error("Enter your password to continue.");
    }

    let authResult;
    try {
      authResult = await state.firebase.auth.signInWithEmailAndPassword(invite.email, values.password);
    } catch (error) {
      throw new Error(formatLoginAuthError(error));
    }
    state.authUser = authResult.user;
    await acceptCurrentInvite({
      token: invite.inviteToken || state.inviteFlow.token,
      authUser: authResult.user
    });
  }

  async function acceptCurrentInvite(options = {}) {
    const invite = state.inviteFlow.details || await loadInviteFlowState(options.token || "", { force: true });
    if (!invite) {
      throw new Error(state.inviteFlow.error || "This invite could not be loaded.");
    }

    if (invite.source === "demo" || options.demoOnly) {
      const inviteRecord = findLocalClientInvite(invite.inviteToken || state.inviteFlow.token);
      if (!inviteRecord) {
        throw new Error("This demo invite could not be found.");
      }
      const user = (state.demoStore.users || []).find(record => record.id === inviteRecord.userId) || null;
      if (!user) {
        throw new Error("The demo client manager profile is missing.");
      }
      const acceptedAt = new Date().toISOString();
      await saveData("users", inviteRecord.userId, {
        ...user,
        status: "active"
      });
      await saveData("clientInvites", inviteRecord.id, {
        ...inviteRecord,
        status: "accepted",
        acceptedAt,
        acceptedBy: inviteRecord.userId
      });
      clearPendingInviteToken();
      state.inviteFlow = {
        token: "",
        loading: false,
        details: null,
        error: ""
      };
      state.session = buildSessionFromUser({ ...user, status: "active" }, "demo");
      persistSession();
      await refreshSessionData();
      await appendAuditLog("invite_accepted", "clientInvites", inviteRecord.id, inviteRecord, {
        ...inviteRecord,
        status: "accepted",
        acceptedAt,
        acceptedBy: inviteRecord.userId
      }, {
        actorId: inviteRecord.userId,
        actorRole: "clientManager"
      });
      await appendAuditLog("client_manager_login", "users", inviteRecord.userId, null, {
        loginAt: acceptedAt,
        via: "demo_invite"
      }, {
        actorId: inviteRecord.userId,
        actorRole: "clientManager"
      });
      navigate("approvals", { replace: true });
      pushToast("Demo client manager access is ready.", "success");
      return;
    }

    const authUser = options.authUser || state.firebase.auth?.currentUser;
    if (!authUser) {
      throw new Error("Sign in with the invited email before continuing.");
    }

    const preferFrontendInviteAcceptance = canUseFrontendInviteLinks() && invite.source === "cloud-frontend";
    let result;
    if (preferFrontendInviteAcceptance) {
      try {
        result = await acceptFrontendCloudInvite(invite, authUser);
      } catch (error) {
        console.error("[Portaly] acceptCurrentInvite frontendAcceptFailed", {
          token: invite.inviteToken || state.inviteFlow.token,
          errorCode: error?.code || "",
          errorMessage: error?.message || "",
          error
        });
        if (!hasInviteBackend()) {
          throw error;
        }
      }
    }
    if (!result && hasInviteBackend()) {
      try {
        result = await callSecureFunction("acceptClientManagerInvite", {
          token: invite.inviteToken || state.inviteFlow.token
        }, {
          baseUrl: getInviteBackendUrl(),
          requireAuth: true,
          authMessage: "Sign in with the invited email before continuing.",
          errorMessage: "Portaly could not finish accepting this invite.",
          networkErrorMessage: "Portaly could not finish accepting this invite."
        });
      } catch (error) {
        console.error("[Portaly] acceptCurrentInvite backendAcceptFailed", {
          token: invite.inviteToken || state.inviteFlow.token,
          errorCode: error?.code || "",
          errorMessage: error?.message || "",
          error
        });
        if (canUseFrontendInviteLinks()) {
          result = await acceptFrontendCloudInvite(invite, authUser);
        } else {
          throw error;
        }
      }
    }
    if (!result) {
      if (canUseFrontendInviteLinks()) {
        result = await acceptFrontendCloudInvite(invite, authUser);
      } else {
        throw new Error("Client manager invites need the secure backend before Cloud Mode can finish setup.");
      }
    }

    state.authUser = authUser;
    clearPendingInviteToken();
    state.inviteFlow = {
      token: "",
      loading: false,
      details: null,
      error: ""
    };
    await establishCloudSession(authUser);
    await refreshSessionData();
    const acceptedInvite = result?.invite || invite;
    await appendAuditLog("invite_accepted", "clientInvites", acceptedInvite.id || invite.id, invite, acceptedInvite, {
      actorId: state.session.userId || authUser.uid,
      actorRole: "clientManager"
    });
    await appendAuditLog("client_manager_login", "users", state.session.userId || authUser.uid, null, {
      loginAt: new Date().toISOString(),
      via: options.authUser ? "invite_accept" : "invite_resume"
    }, {
      actorId: state.session.userId || authUser.uid,
      actorRole: "clientManager"
    });
    navigate("approvals", { replace: true });
    pushToast("Client manager access is ready. Welcome to Approvals.", "success");
  }

  function openRevokeClientInviteModal(inviteId) {
    requirePermission(canInviteClientManagers(), "Only agency owners, agency admins, or platform owners can revoke client manager invites.");
    const invite = findRecord("clientInvites", inviteId);
    if (!invite) {
      throw new Error("That client manager invite could not be found.");
    }
    if (!PUBLIC_INVITE_STATUSES.has(String(invite.status || "pending").toLowerCase())) {
      throw new Error("Only active client manager invites can be revoked.");
    }

    const label = `${invite.firstName || ""} ${invite.lastName || ""}`.trim() || invite.email || "this invite";
    confirmAction(`Revoke the client manager invite for ${label}? The current link will stop working immediately.`, async () => {
      const updatedAt = new Date().toISOString();
      const updatedInvite = await updateData("clientInvites", invite.id, {
        status: "revoked",
        updatedAt
      });

      if (state.session.mode === "demo" && invite.userId) {
        const demoUser = findRecord("users", invite.userId);
        if (demoUser && demoUser.status === "invited") {
          await updateData("users", invite.userId, {
            status: "inactive",
            updatedAt
          });
        }
      }

      await appendAuditLog("invite_revoked", "clientInvites", invite.id, invite, updatedInvite, {
        actorId: state.session.userId,
        actorRole: state.session.role
      });
      closeModal();
      await refreshCurrentView();
      pushToast("Client manager invite revoked.", "success");
    }, {
      title: "Revoke Invite",
      confirmLabel: "Revoke Invite",
      confirmTone: "button-danger"
    });
  }

  async function refreshSubscriptionStatus(showToastOnSuccess = false, successMessage = "Subscription status refreshed.") {
    const subscription = getCurrentSubscription();
    if (!subscription?.squareSubscriptionId) {
      handleBillingPlaceholder("Subscription not connected yet. If you already paid, click Refresh Billing again later or contact support with your Square receipt.");
      return;
    }

    const result = await callBillingFunction("syncSquareSubscriptionToFirestore", {
      subscriptionId: subscription.squareSubscriptionId,
      agencyId: state.session.agencyId
    }, {
      fallbackMessage: "Square status sync is not connected yet. If you already paid, contact support with your Square receipt."
    });

    if (!result) {
      return;
    }

    await refreshCurrentView();
    if (showToastOnSuccess) {
      pushToast(successMessage, "success");
    }
  }

  function openCancelSubscriptionModal() {
    requirePermission(canManageBilling(), "Only the agency owner or platform owner can cancel the subscription.");
    openModal("Cancel Subscription", `
      <div class="notice-card warning">
        <div>
          <strong>Cancel at the end of the current billing period?</strong>
          <p>Your team will keep access until the current billing cycle ends.</p>
        </div>
      </div>
      <div class="field-group">
        <label for="cancel-subscription-confirm">Type CANCEL SUBSCRIPTION to continue</label>
        <input id="cancel-subscription-confirm" name="confirmText" type="text" placeholder="CANCEL SUBSCRIPTION" />
      </div>
    `, async values => {
      const confirmation = String(values.confirmText || "").trim();
      if (confirmation !== "CANCEL SUBSCRIPTION") {
        throw new Error("Type CANCEL SUBSCRIPTION to confirm.");
      }
      await handleSquareSubscriptionAction("cancel");
    }, {
      saveLabel: "Cancel Subscription",
      saveTone: "button-danger",
      size: "small"
    });
  }

  async function logApprovalViewed(timesheetId) {
    const approval = getScopedData().approvals.find(item => item.timesheetId === timesheetId);
    if (!approval) {
      return;
    }
    await appendAuditLog("approval_viewed", "approvals", approval.id, null, {
      timesheetId,
      route: state.route
    }, {
      actorId: state.session.userId,
      actorRole: state.session.role
    });
  }

  async function ensureApprovalShareRecord(approvalId) {
    const approval = findRecord("approvals", approvalId);
    if (!approval) {
      throw new Error("That approval record could not be found.");
    }

    const timesheet = findRecord("timesheets", approval.timesheetId);
    const patch = {};

    if (!approval.approvalToken) {
      patch.approvalToken = createId("approvaltoken");
    }
    if (!approval.tokenExpiresAt) {
      patch.tokenExpiresAt = addDays(new Date(), 14).toISOString();
    }
    if (!approval.weekStart && timesheet?.payPeriodStart) {
      patch.weekStart = timesheet.payPeriodStart;
    }
    if (!approval.weekEnd && timesheet?.payPeriodEnd) {
      patch.weekEnd = timesheet.payPeriodEnd;
    }

    if (!Object.keys(patch).length) {
      return {
        ...approval,
        weekStart: approval.weekStart || timesheet?.payPeriodStart || "",
        weekEnd: approval.weekEnd || timesheet?.payPeriodEnd || ""
      };
    }

    const updated = await updateData("approvals", approvalId, patch);
    await refreshCurrentView();
    return updated;
  }

  function buildApprovalLink(approval, mode = "token") {
    if (!approval) {
      return "";
    }
    const route = mode === "internal"
      ? `#/client-approval/${approval.id}`
      : `#/approve/${approval.approvalToken || approval.id}`;
    return `${DEFAULT_APP_URL}${route}`;
  }

  function buildApprovalShareText(approval, link) {
    const timesheet = findRecord("timesheets", approval?.timesheetId || "");
    const clientName = getClientName(approval?.clientId || timesheet?.clientId || "");
    const siteName = getSiteName(approval?.siteId || timesheet?.siteId || "");
    const weekEnding = approval?.weekEnd || timesheet?.payPeriodEnd || "";
    return [
      `Portaly approval request for ${clientName || "your site"}`,
      siteName ? `Site: ${siteName}` : "",
      weekEnding ? `Week ending: ${formatDate(weekEnding)}` : "",
      `Review and sign here: ${link}`
    ].filter(Boolean).join("\n");
  }

  async function copyApprovalLink(approvalId, mode = "token") {
    const approval = await ensureApprovalShareRecord(approvalId);
    const link = buildApprovalLink(approval, mode);
    await copyText(link);
    await appendAuditLog("approval_sent", "approvals", approval.id, null, {
      linkMode: mode,
      link
    }, {
      reason: "copy_approval_link",
      actorId: state.session.userId,
      actorRole: state.session.role
    });
  }

  async function emailApprovalLinkPlaceholder(approvalId) {
    const approval = await ensureApprovalShareRecord(approvalId);
    const link = buildApprovalLink(approval, "token");
    const message = buildApprovalShareText(approval, link);
    await copyText(message);
    await appendAuditLog("approval_sent", "approvals", approval.id, null, {
      linkMode: "email_placeholder",
      link
    }, {
      reason: "email_placeholder",
      actorId: state.session.userId,
      actorRole: state.session.role
    });
    pushToast("Approval email draft copied. Send it from your email tool.", "success");
  }

  async function textApprovalLinkPlaceholder(approvalId) {
    const approval = await ensureApprovalShareRecord(approvalId);
    const link = buildApprovalLink(approval, "token");
    const message = buildApprovalShareText(approval, link);
    await copyText(message);
    await appendAuditLog("approval_sent", "approvals", approval.id, null, {
      linkMode: "text_placeholder",
      link
    }, {
      reason: "text_placeholder",
      actorId: state.session.userId,
      actorRole: state.session.role
    });
    pushToast("Approval text message copied. Send it from your phone or messaging tool.", "success");
  }

  async function handleSquareSubscriptionAction(action) {
    requirePermission(canManageBilling(), "Only the agency owner or platform owner can manage billing.");
    const subscription = getCurrentSubscription();

    if (state.session.mode === "demo") {
      await simulateDemoSubscriptionAction(action, subscription);
      return;
    }

    if (!subscription?.squareSubscriptionId) {
      handleBillingPlaceholder("Subscription not connected yet. If you already paid, click Refresh Billing or contact support with your Square receipt.");
      return;
    }

    const endpointMap = {
      pause: "pauseSquareSubscription",
      resume: "resumeSquareSubscription",
      reactivate: "resumeSquareSubscription",
      cancel: "cancelSquareSubscription"
    };
    const successMessages = {
      pause: "Subscription pause requested.",
      resume: "Subscription resume requested.",
      reactivate: "Subscription reactivation requested.",
      cancel: "Your subscription is scheduled to cancel at the end of your billing period."
    };
    const endpoint = endpointMap[action];
    if (!endpoint) {
      throw new Error("That Square billing action is not available.");
    }

    const result = await callBillingFunction(endpoint, {
      subscriptionId: subscription.squareSubscriptionId,
      agencyId: state.session.agencyId
    }, {
      fallbackMessage: "Square subscription self-service is not connected yet. Contact support or use your Square receipt email to manage billing."
    });

    if (!result) {
      return;
    }

    if (action === "cancel") {
      await appendAuditLog("subscription_canceled", "subscriptions", subscription.id, subscription, {
        status: "cancel_at_period_end",
        cancelAtPeriodEnd: true
      }, {
        reason: "customer_requested_cancel"
      });
    }

    await refreshSubscriptionStatus(true, successMessages[action]);
  }

  async function simulateDemoSubscriptionAction(action, subscription) {
    const agency = getCurrentAgency();
    const targetSubscription = subscription || getCurrentSubscription();
    const nowIso = new Date().toISOString();
    const update = {
      updatedAt: nowIso
    };

    if (action === "pause") {
      update.status = "paused";
      update.pausedAt = nowIso;
    } else if (action === "resume" || action === "reactivate") {
      update.status = "active";
      update.resumedAt = nowIso;
      update.cancelAtPeriodEnd = false;
    } else if (action === "cancel") {
      update.status = "canceled";
      update.canceledAt = nowIso;
      update.cancelAtPeriodEnd = true;
    }

    if (targetSubscription) {
      await updateData("subscriptions", targetSubscription.id, update);
    }
    if (agency) {
      await updateData("agencies", agency.id, {
        subscriptionStatus: update.status || agency.subscriptionStatus || "trialing",
        updatedAt: nowIso
      });
    }
    if (action === "cancel") {
      await appendAuditLog("subscription_canceled", "subscriptions", targetSubscription?.id || agency?.id || "demo", subscription, update, {
        reason: "demo_mode_cancel"
      });
    }
    await refreshCurrentView();
    pushToast(`Demo ${formatStatusLabel(action)} action saved.`, "success");
  }

  function openPaymentHistoryPlaceholder() {
    handleBillingPlaceholder("Payment history will sync here from Square once the secure billing backend is deployed.");
  }

  function openPaymentMethodPlaceholder() {
    const email = getSupportEmail();
    handleBillingPlaceholder(`Payment method updates are handled securely through Square. Contact ${email} or use your Square receipt email to update payment details.`);
  }

  function openSupportPlaceholder() {
    const email = getSupportEmail();
    const phone = getSupportPhone();
    handleBillingPlaceholder(`Support is available at ${email}${phone ? ` or ${phone}` : ""}.`);
  }

  function openLiveDemoRequest() {
    const email = String(getSupportEmail() || "").trim();
    const subject = encodeURIComponent("Book a Portaly live demo");
    const body = encodeURIComponent(
      "Hi Portaly,\n\nI would like to book a live demo for my staffing agency.\n\nAgency name:\nPrimary industry:\nApproximate worker count:\nBest contact phone:\nCurrent attendance or payroll challenge:\n\nThank you."
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  function renderDemoAccessSuccessNotice() {
    const message = String(state.demoAccess?.message || "").trim();
    if (!message) {
      return "";
    }
    return `
      <div class="notice-card" style="margin: 0 0 16px;">
        <div>
          <strong>Demo access sent</strong>
          <p>${escapeHtml(message)}</p>
        </div>
      </div>
    `;
  }

  function renderDemoAccessForm(options = {}) {
    const eyebrow = String(options.eyebrow || "Send Me Demo Access").trim();
    const title = String(options.title || "Send demo access to your inbox").trim();
    const copy = String(options.copy || "We will email a working Portaly demo login so you can test the worker clock, client approvals, payroll export, and agency dashboard.").trim();
    const cardClass = String(options.cardClass || "").trim();
    const buttonBlock = options.buttonBlock === true ? " button-block" : "";
    const includeBookDemo = options.includeBookDemo === true;
    const emailValue = escapeAttribute(state.demoAccess?.email || "");
    const companyValue = escapeAttribute(state.demoAccess?.companyName || "");
    return `
      <div class="support-card marketing-demo-access-card${cardClass ? ` ${escapeAttribute(cardClass)}` : ""}">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(copy)}</p>
        ${renderDemoAccessSuccessNotice()}
        <form class="form-grid demo-access-form" data-form="demo-access">
          <div class="field-group">
            <label for="demo-access-email-${escapeAttribute(options.idSuffix || "default")}">Work email</label>
            <input id="demo-access-email-${escapeAttribute(options.idSuffix || "default")}" name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@agency.com" value="${emailValue}" />
          </div>
          <div class="field-group">
            <label for="demo-access-company-${escapeAttribute(options.idSuffix || "default")}">Company name <span class="muted-text">(optional)</span></label>
            <input id="demo-access-company-${escapeAttribute(options.idSuffix || "default")}" name="companyName" type="text" autocomplete="organization" placeholder="Harbor Staffing" value="${companyValue}" />
          </div>
          <div class="page-actions">
            <button class="button button-primary${buttonBlock}" type="submit">Send Demo Access</button>
            ${includeBookDemo ? `<button class="button button-ghost" data-action="book-live-demo" type="button">Book Live Demo</button>` : ""}
          </div>
        </form>
      </div>
    `;
  }

  function scrollToMarketingSection(sectionId) {
    const targetId = String(sectionId || "").trim();
    if (!targetId) {
      return;
    }

    const runScroll = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    if (!["landing", "pricing"].includes(state.route)) {
      navigate("landing");
      window.setTimeout(runScroll, 90);
      return;
    }

    runScroll();
  }

  function enforcePlanLimit(entityType, willBeActive, existingRecord) {
    if (!willBeActive) {
      return;
    }

    const scoped = getScopedData();
    const agency = getCurrentAgency();
    const plan = getPlanDefinition(agency?.planId || "agency");
    const usage = getUsageStats(scoped, agency?.id);

    if (entityType === "worker" && !existingRecord && plan.workerLimit !== null && usage.activeWorkers >= plan.workerLimit) {
      throw new Error(`You have reached the ${plan.label} worker limit. Upgrade the plan to add more workers.`);
    }

    if (entityType === "site" && !existingRecord && plan.siteLimit !== null && usage.activeSites >= plan.siteLimit) {
      throw new Error(`You have reached the ${plan.label} site limit. Upgrade the plan to add more sites.`);
    }
  }

  async function appendAuditLog(action, entityType, entityId, oldValue, newValue, metadata = {}) {
    if (!state.session.role || state.session.mode === "public") {
      return;
    }
    const timestamp = metadata.createdAt || new Date().toISOString();
    const audit = {
      agencyId: state.session.agencyId || newValue?.agencyId || oldValue?.agencyId || "",
      userId: metadata.actorId || state.session.userId || "",
      actorId: metadata.actorId || state.session.userId || "",
      role: metadata.actorRole || state.session.role || "",
      actorRole: metadata.actorRole || state.session.role || "",
      action,
      entityType,
      entityId,
      oldValue: oldValue || null,
      newValue: newValue || null,
      reason: metadata.reason || "",
      createdAt: timestamp,
      timestamp
    };
    await saveData("auditLogs", createId("audit"), audit);
  }

  async function startBillingCheckout(planId) {
    const plan = getPlanDefinition(planId);

    if (!plan) {
      throw new Error("Plan not found.");
    }

    if (!plan.squarePaymentLink) {
      throw new Error("Square payment link missing.");
    }

    localStorage.setItem("portaly_selected_plan", plan.id);
    localStorage.setItem("portaly_selected_plan_name", plan.name);
    localStorage.setItem("portaly_selected_plan_price", plan.price ? `$${plan.price}/month` : "Custom");
    localStorage.setItem("portaly_selected_plan_link", plan.squarePaymentLink);

    // TODO: Add a Firebase Function that receives Square webhook events.
    // TODO: Watch payment.updated, subscription.created, subscription.updated, and invoice.payment_made.
    // TODO: Update Firestore agency and subscription planId/subscriptionStatus automatically after Square events.
    window.location.href = plan.squarePaymentLink;
  }

  async function openBillingPortal() {
    pushToast("Square billing is connected through secure Square payment links.", "success");
    navigate("billing");
  }

  function renderApp() {
    const root = document.getElementById("app");
    if (!root) {
      return;
    }

    try {
      state.route = normalizeRoute(state.route || parseHashRoute());
      applyBodyState();

      let html = "";
      if (state.route === "approval-link") {
        html = renderApprovalLinkShell();
      } else if (state.route === "punch" || state.route === "clock" || state.route === "landing") {
        html = renderPublicShell();
      } else if (state.route === "accept-invite") {
        html = renderPublicShell();
      } else if (state.session.role === "worker" && state.session.mode !== "public") {
        html = renderWorkerShell();
      } else if (state.session.mode === "public" || !state.session.role) {
        html = renderPublicShell();
      } else {
        html = renderOwnerShell();
      }

      root.innerHTML = html + renderModal();
      renderToasts();
      hydrateQrCanvases(root);
      focusMarketingRouteSection();
    } catch (error) {
      console.error("[Portaly] renderApp failed", {
        route: state.route,
        session: state.session,
        inviteFlow: state.inviteFlow,
        error
      });
      try {
        state.route = "landing";
        root.innerHTML = renderPublicShell() + renderModal();
        pushToast("Portaly recovered from a loading problem. You can keep using the app.", "warning");
        renderToasts();
      } catch (fallbackError) {
        console.error("[Portaly] renderApp fallback failed", fallbackError);
        renderFatalError(error);
      }
    }
  }

  function applyBodyState() {
    document.body.classList.toggle("nav-open", !!state.mobileNavOpen);
    document.body.dataset.layout = getLayoutMode();
  }

  function focusMarketingRouteSection() {
    if (state.route !== "pricing") {
      return;
    }
    window.requestAnimationFrame(() => {
      document.getElementById("pricing")?.scrollIntoView({ block: "start" });
    });
  }

  function getLayoutMode() {
    if (state.route === "approval-link" || state.route === "accept-invite" || state.route === "punch" || state.route === "clock" || state.route === "landing") {
      return "public";
    }
    if (state.session.role === "worker" && state.session.mode !== "public") {
      return "worker";
    }
    if (state.session.mode === "public" || !state.session.role) {
      return "public";
    }
    return "app";
  }

  function renderPublicShell() {
    if (state.route === "punch" || state.route === "clock") {
      return `
        <div class="public-root punch-root">
          ${renderPublicPunchPage()}
        </div>
      `;
    }
    return `
      <div class="public-root">
        ${renderMarketingHeader()}
        ${renderPublicPage()}
        ${renderMarketingFooter()}
      </div>
    `;
  }

  function renderMarketingHeader() {
    return `
      <header class="marketing-header">
        <div class="container marketing-nav">
          <div class="marketing-brand">
            <div class="brand-mark">${escapeHtml(getBrandInitials())}</div>
            <div>
              <p class="eyebrow">Staffing Agency Workforce Platform</p>
              <h1>${escapeHtml(getBrandName())}</h1>
            </div>
          </div>
          <div class="marketing-links">
            <button class="marketing-link" data-action="scroll-marketing-section" data-section="features" type="button">Solutions</button>
            <button class="marketing-link" data-action="scroll-marketing-section" data-section="how-it-works" type="button">How It Works</button>
            <button class="marketing-link" data-action="scroll-marketing-section" data-section="pricing" type="button">Pricing</button>
            <button class="marketing-link" data-action="go-route" data-route="clock" type="button">Worker Clock</button>
            <button class="marketing-link" data-action="go-route" data-route="login" type="button">Login</button>
          </div>
          <div class="marketing-actions">
            <button class="button button-secondary" data-action="book-live-demo" type="button">Book Live Demo</button>
            <button class="button button-primary" data-action="go-route" data-route="trial" type="button">Start Free Trial</button>
          </div>
        </div>
      </header>
    `;
  }

  function renderPublicPage() {
    switch (state.route) {
      case "approval-link":
        return renderPublicApprovalPage();
      case "complete-profile":
        return renderCompleteProfilePage();
      case "accept-invite":
        return renderAcceptInvitePage();
      case "punch":
      case "clock":
        return renderPublicPunchPage();
      case "landing":
        return renderMarketingLanding(false);
      case "pricing":
        return renderMarketingLanding(true);
      case "demo":
        return renderDemoAccessHub();
      case "login":
        return renderLoginPage();
      case "forgot-password":
        return renderForgotPasswordPage();
      case "trial":
        return renderTrialPage();
      case "trial-success":
        return renderTrialSuccessPage();
      case "trial-expired":
        return renderTrialExpiredPage();
      case "billing-required":
        return renderPublicBillingRequired();
      default:
        return renderMarketingLanding(false);
    }
  }

  function renderPublicPunchPage() {
    const punchState = state.publicPunch || {};
    const directories = Array.isArray(punchState.directories) ? punchState.directories.filter(Boolean) : [];
    const selectedDirectory = punchState.directory
      || directories.find(item => item.siteId === punchState.siteId && (!punchState.agencyId || item.agencyId === punchState.agencyId) && (!punchState.companyId || item.companyId === punchState.companyId))
      || null;
    const agencyOptions = Array.isArray(punchState.agencies) && punchState.agencies.length
      ? punchState.agencies.filter(agency => agency && agency.id).map(agency => ({
        id: agency.id,
        name: agency.name || agency.agencyName || getAgencyName(agency.id)
      }))
      : [...new Map(directories.map(directory => [directory.agencyId, {
        id: directory.agencyId,
        name: directory.agencyName
      }])).values()].filter(option => option.id);
    const companyOptions = Array.isArray(punchState.clients) && punchState.clients.length
      ? punchState.clients
        .filter(client => client && client.id)
        .filter(client => !punchState.agencyId || !client.agencyId || client.agencyId === punchState.agencyId)
        .map(client => ({
          id: client.id,
          name: client.name
        }))
      : [...new Map(
        directories
          .filter(directory => !punchState.agencyId || directory.agencyId === punchState.agencyId)
          .map(directory => [directory.companyId, {
            id: directory.companyId,
            name: directory.companyName
          }])
      ).values()].filter(option => option.id);
    const siteOptions = Array.isArray(punchState.sites) && punchState.sites.length
      ? punchState.sites
        .filter(site => site && site.id)
        .filter(site => (!punchState.agencyId || !site.agencyId || site.agencyId === punchState.agencyId) && (!punchState.companyId || site.clientId === punchState.companyId))
        .map(site => ({
          siteId: site.id,
          siteName: site.name,
          companyId: site.clientId || '',
          agencyId: site.agencyId || ''
        }))
      : directories.filter(directory => (!punchState.agencyId || directory.agencyId === punchState.agencyId) && (!punchState.companyId || directory.companyId === punchState.companyId));
    const workerOptions = Array.isArray(punchState.siteWorkers) && punchState.siteWorkers.length
      ? punchState.siteWorkers
      : (Array.isArray(selectedDirectory?.publicWorkerOptions) ? selectedDirectory.publicWorkerOptions : []);
    const selectedSite = (punchState.sites || []).find(site => site.id === punchState.siteId) || null;
    const resolvedAgencyName = selectedDirectory?.agencyName || punchState.agencyName || agencyOptions.find(agency => agency.id === punchState.agencyId)?.name || '';
    const resolvedCompanyName = selectedDirectory?.companyName || punchState.companyName || companyOptions.find(company => company.id === punchState.companyId)?.name || '';
    const resolvedSiteName = selectedDirectory?.siteName || punchState.siteName || selectedSite?.name || siteOptions.find(site => site.siteId === punchState.siteId)?.siteName || '';
    const punchReady = !!(punchState.agencyId && punchState.companyId && punchState.siteId && (selectedDirectory || selectedSite || siteOptions.some(site => site.siteId === punchState.siteId)));
    const punchDisabled = punchReady && !punchState.saving ? '' : 'disabled';
    const currentStatus = punchState.lastStatus || getPunchStatusLabelFromAction(punchState.lastAction);
    const currentWorker = punchState.lastWorkerName || 'Worker';
    const isQrStation = state.route === 'punch' && !!punchState.siteId;
    const showSelectors = !isQrStation;
    const topTitle = isQrStation ? (resolvedSiteName || 'Punch Station') : 'Worker Punch Clock';
    const topCopy = isQrStation
      ? 'Select or type your name, then tap the punch you need.'
      : 'Choose your staffing agency, company, site, and name. Then tap the punch you need.';
    const contextLine = [resolvedAgencyName, resolvedCompanyName, resolvedSiteName].filter(Boolean).join(' � ');
    const workerInputHelp = workerOptions.length
      ? 'Select your name from the list or type it manually if you do not see it yet.'
      : (punchState.siteId ? 'No assigned workers are loaded for this site yet. Type the worker name manually.' : 'Type the worker name exactly as it should appear on the timecard.');
    const savingMessage = punchState.saving ? 'Saving punch...' : '';
    const emptyMessage = punchState.emptyMessage
      || (!companyOptions.length
        ? 'Add a company/client first.'
        : !siteOptions.length
          ? 'Add a worksite under a client.'
          : !(Array.isArray(punchState.workers) && punchState.workers.length)
            ? 'Add workers or allow typed worker names.'
            : '');
    const adminRoute = state.session.mode !== 'public' && state.session.role ? getHomeRoute() : 'login';
    const adminLabel = state.session.mode !== 'public' && state.session.role ? 'Dashboard' : 'Admin Login';

    if (punchState.loading) {
      return `
        <main class="auth-shell public-punch-shell">
          <div class="container punch-center-shell">
            <div class="worker-card primary minimal-punch-card">
              <div class="public-punch-topbar">
                <p class="eyebrow">Portaly Punch Clock</p>
                <div class="public-punch-topbar-actions">
                  <button class="button button-ghost button-text" data-action="refresh-public-punch" type="button">Refresh</button>
                  <button class="button button-ghost button-text" data-action="go-route" data-route="${escapeHtml(adminRoute)}" type="button">${escapeHtml(adminLabel)}</button>
                </div>
              </div>
              <h2>Loading punch station</h2>
              <p class="helper-copy">Preparing the worker punch screen.</p>
              <div class="loading-skeleton-stack" aria-hidden="true">
                <span class="skeleton-line skeleton-line-lg"></span>
                <span class="skeleton-line"></span>
                <span class="skeleton-line skeleton-line-sm"></span>
              </div>
            </div>
          </div>
        </main>
      `;
    }

    return `
      <main class="auth-shell public-punch-shell">
        <div class="container punch-center-shell">
          <div class="worker-card primary minimal-punch-card">
            <div class="public-punch-topbar">
              <p class="eyebrow">Portaly Punch Clock</p>
              <div class="public-punch-topbar-actions">
                <button class="button button-ghost button-text" data-action="refresh-public-punch" type="button">Refresh</button>
                <button class="button button-ghost button-text" data-action="go-route" data-route="${escapeHtml(adminRoute)}" type="button">${escapeHtml(adminLabel)}</button>
              </div>
            </div>
            <h2>${escapeHtml(topTitle)}</h2>
            <p class="helper-copy">${escapeHtml(topCopy)}</p>
            ${contextLine ? `<p class="helper-copy public-punch-context">${escapeHtml(contextLine)}</p>` : ''}
            ${punchState.error ? `
              <div class="notice-card danger" style="margin-top: 16px;">
                <div>
                  <strong>Punch station unavailable</strong>
                  <p>${escapeHtml(punchState.error)}</p>
                </div>
              </div>
            ` : punchState.fallbackNotice ? `
              <div class="notice-card warning" style="margin-top: 16px;">
                <div>
                  <strong>Demo punch stations loaded</strong>
                  <p>${escapeHtml(punchState.fallbackNotice)}</p>
                </div>
              </div>
            ` : emptyMessage ? `
              <div class="notice-card warning" style="margin-top: 16px;">
                <div>
                  <strong>Punch page setup needed</strong>
                  <p>${escapeHtml(emptyMessage)}</p>
                </div>
              </div>
            ` : !directories.length ? `
              <div class="notice-card warning" style="margin-top: 16px;">
                <div>
                  <strong>No punch stations are ready yet</strong>
                  <p>${escapeHtml(state.firebase.ready ? 'Ask the staffing agency admin to add a client, site, worker assignment, and generate a site QR.' : 'Firebase is not configured yet, so Portaly is using demo punch data for now.')}</p>
                </div>
              </div>
            ` : ''}

            <div class="form-grid punch-minimal-form" data-public-punch-form="true">
              ${showSelectors ? `
                <div class="field-group">
                  <label for="public-punch-agency">Staffing Agency</label>
                  <select id="public-punch-agency" name="publicPunchAgencyId">
                    <option value="">Select staffing agency</option>
                    ${agencyOptions.map(agency => `<option value="${escapeHtml(agency.id)}" ${punchState.agencyId === agency.id ? 'selected' : ''}>${escapeHtml(agency.name)}</option>`).join('')}
                  </select>
                </div>
                <div class="form-row two">
                  <div class="field-group">
                    <label for="public-punch-company">Company / Client</label>
                    <select id="public-punch-company" name="publicPunchCompanyId">
                      <option value="">Select company</option>
                      ${companyOptions.map(company => `<option value="${escapeHtml(company.id)}" ${punchState.companyId === company.id ? 'selected' : ''}>${escapeHtml(company.name)}</option>`).join('')}
                    </select>
                  </div>
                  <div class="field-group">
                    <label for="public-punch-site">Site</label>
                    <select id="public-punch-site" name="publicPunchSiteId">
                      <option value="">Select site</option>
                      ${siteOptions.map(site => `<option value="${escapeHtml(site.siteId)}" ${punchState.siteId === site.siteId ? 'selected' : ''}>${escapeHtml(site.siteName)}</option>`).join('')}
                    </select>
                  </div>
                </div>
              ` : `
                <div class="punch-station-lockup">
                  <span class="status-badge status-info">${escapeHtml(resolvedAgencyName || 'Staffing Agency')}</span>
                  <span class="status-badge status-info">${escapeHtml(resolvedCompanyName || 'Company')}</span>
                  <span class="status-badge status-success">${escapeHtml(resolvedSiteName || 'Site')}</span>
                </div>
              `}
              ${workerOptions.length ? `
                <div class="field-group">
                  <label for="public-punch-worker">Worker</label>
                  <select id="public-punch-worker" name="publicPunchWorkerId">
                    <option value="">Type the worker name instead</option>
                    ${workerOptions.map(worker => `<option value="${escapeHtml(worker.id)}">${escapeHtml(worker.name)}</option>`).join('')}
                  </select>
                </div>
              ` : ''}
              <div class="field-group">
                <label for="public-punch-worker-name">Worker name</label>
                <input id="public-punch-worker-name" name="publicPunchWorkerName" type="text" placeholder="${escapeAttribute(workerOptions.length ? 'Select the worker or type the name here' : 'Type the worker name')}" />
                <p class="helper-copy">${escapeHtml(workerInputHelp)}</p>
              </div>
            </div>

            <div class="punch-status-strip">
              <span><strong>Status:</strong> ${escapeHtml(currentStatus || 'Ready')}</span>
              <span><strong>Last punch:</strong> ${escapeHtml(punchState.lastAction ? PUNCH_LABELS[punchState.lastAction] : 'No punch yet')}</span>
            </div>

            <div class="worker-buttons">
              <button class="button button-primary button-large" data-action="public-punch-action" data-punch="clockIn" type="button" ${punchDisabled}>Clock In</button>
              <button class="button button-secondary button-large" data-action="public-punch-action" data-punch="startLunch" type="button" ${punchDisabled}>Start Lunch</button>
              <button class="button button-secondary button-large" data-action="public-punch-action" data-punch="endLunch" type="button" ${punchDisabled}>End Lunch</button>
              <button class="button button-ghost button-large" data-action="public-punch-action" data-punch="clockOut" type="button" ${punchDisabled}>Clock Out</button>
            </div>

            ${savingMessage ? `<p class="helper-copy" style="margin-top: 12px;">${escapeHtml(savingMessage)}</p>` : ''}

            ${punchState.lastMessage ? `
              <div class="worker-confirmation">
                <strong>${escapeHtml(PUNCH_LABELS[punchState.lastAction] || 'Punch saved')} for ${escapeHtml(currentWorker)}</strong>
                <p>${escapeHtml(punchState.lastMessage)}</p>
              </div>
            ` : ''}

            <div class="public-punch-footer">
              <button class="button button-ghost button-text" data-action="open-punch-request" type="button">Need help? Submit punch request</button>
              ${punchState.requestHelpMessage ? `<p class="helper-copy">${escapeHtml(punchState.requestHelpMessage)}</p>` : ''}
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function renderMarketingLanding(focusPricing) {
    const preview = getMarketingPreviewData();
    const roi = calculateMarketingRoi();
    const planCards = ["starter", "agency", "growth", "enterprise"]
      .map(planId => PLAN_DEFINITIONS[planId])
      .filter(Boolean)
      .map(plan => renderPricingCard(plan, plan.id === "growth", "marketing"))
      .join("");
    return `
      <main class="hero-shell">
        <section class="section landing-hero-section" id="hero">
          <div class="container hero-grid landing-hero-grid">
            <div class="hero-copy">
              <p class="eyebrow">Staffing agency timekeeping and approval software</p>
              <h2>Stop Payroll Disputes Before They Start</h2>
              <p>Track temporary workers, manage assignments, approve timesheets, and prepare payroll from one platform.</p>
              <p class="landing-trust-line">Trusted by staffing agencies managing warehouse, manufacturing, logistics, and temporary labor workforces.</p>
              <div class="hero-proof-row">
                <span class="hero-proof-pill">Missing punch visibility</span>
                <span class="hero-proof-pill">Digital client approvals</span>
                <span class="hero-proof-pill">Payroll-ready exports</span>
                <span class="hero-proof-pill">Multi-site staffing control</span>
              </div>
              <div class="hero-actions">
                <button class="button button-primary button-large" data-action="go-route" data-route="trial" type="button">Start Free Trial</button>
                <button class="button button-secondary button-large" data-action="book-live-demo" type="button">Book Live Demo</button>
              </div>
              <div class="hero-link-row">
                <button class="marketing-link" data-action="scroll-marketing-section" data-section="pricing" type="button">View Pricing</button>
                <button class="marketing-link" data-action="go-route" data-route="demo" type="button">Open Interactive Demo</button>
                <button class="marketing-link" data-action="go-route" data-route="clock" type="button">Open Worker Clock</button>
                <button class="marketing-link" data-action="go-route" data-route="login" type="button">Login</button>
              </div>
              ${renderDemoAccessForm({
                eyebrow: "Send Me Demo Access",
                title: "Email the demo login to yourself",
                copy: "Get a working Portaly demo login in your inbox so you can test worker QR punching, client approvals, payroll export, and the agency dashboard right away.",
                idSuffix: "landing",
                cardClass: "hero-demo-access-card",
                includeBookDemo: false
              })}
            </div>
            <div class="hero-panel landing-dashboard-panel">
              <div class="landing-dashboard-shell">
                <div class="landing-dashboard-top">
                  <div>
                    <p class="eyebrow">Live Operations Snapshot</p>
                    <h3>Staffing command center</h3>
                    <p>${escapeHtml(preview.agencyName)}</p>
                  </div>
                  <span class="status-badge status-success">Live</span>
                </div>
                <div class="landing-dashboard-grid">
                  ${renderDashboardPreviewCard("Active Workers", preview.metrics.activeWorkers, "Assigned and ready to work")}
                  ${renderDashboardPreviewCard("Clocked In Today", preview.metrics.clockedInToday, "Workers already captured today")}
                  ${renderDashboardPreviewCard("Pending Approvals", preview.metrics.pendingApprovals, "Waiting on client signoff")}
                  ${renderDashboardPreviewCard("Open Assignments", preview.metrics.openAssignments, "Placements live across sites")}
                  ${renderDashboardPreviewCard("Hours This Week", formatHours(preview.metrics.hoursThisWeek), "Approved and in-progress time")}
                </div>
                <div class="landing-dashboard-feed">
                  <div class="landing-feed-item">
                    <div>
                      <strong>Worker punch flow</strong>
                      <p>${escapeHtml(preview.workerName)} at ${escapeHtml(preview.siteName)}</p>
                    </div>
                    <span class="status-badge ${escapeHtml(preview.statusTone)}">${escapeHtml(preview.statusLabel)}</span>
                  </div>
                  <div class="landing-feed-item">
                    <div>
                      <strong>Client approval queue</strong>
                      <p>${escapeHtml(String(preview.metrics.pendingApprovals))} submitted timecards still need manager signoff.</p>
                    </div>
                    <span class="status-badge status-warning">Action needed</span>
                  </div>
                  <div class="landing-feed-item">
                    <div>
                      <strong>Payroll prep</strong>
                      <p>Approved hours are ready to move from timekeeping into export.</p>
                    </div>
                    <span class="status-badge status-success">Payroll ready</span>
                  </div>
                </div>
                <p class="helper-copy">Give owners, payroll teams, and client managers a live view before payroll turns into spreadsheet cleanup.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="statistics">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Platform Highlights</p>
                <h2 class="section-title">Built around the workflows staffing agencies need every day</h2>
              </div>
              <p class="section-copy">Portaly keeps punches, approvals, assignments, and payroll prep in one operational system.</p>
            </div>
            <div class="landing-kpi-grid">
              ${renderLandingHighlightCard("QR Time Tracking", "Workers scan a site QR and punch in from a fast, mobile-friendly clock screen.")}
              ${renderLandingHighlightCard("Manager Approvals", "Client and site managers review submitted hours, approve timecards, and add notes digitally.")}
              ${renderLandingHighlightCard("Payroll Export Ready", "Approved hours stay organized by worker, client, and site so payroll export is cleaner.")}
              ${renderLandingHighlightCard("24/7 Worker Self-Service", "Workers can clock in, start lunch, end lunch, or clock out without creating an account.")}
            </div>
          </div>
        </section>

        <section class="section" id="features">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Core Features</p>
                <h2 class="section-title">Everything staffing agency owners need to control time, approvals, and payroll prep</h2>
              </div>
              <p class="section-copy">Each part of Portaly is designed to solve one of the staffing problems that slows payroll down.</p>
            </div>
            <div class="feature-grid">
              ${renderFeatureCard("QR Clock-In", "Workers scan and clock in instantly from a site-specific punch page built for phones and shared kiosks.")}
              ${renderFeatureCard("Assignment Management", "Assign workers to clients and job sites so time, approvals, and payroll stay tied to the right placement.")}
              ${renderFeatureCard("Client Approval Workflow", "Client and site managers approve hours digitally, reject mistakes, and keep payroll moving without email chains.")}
              ${renderFeatureCard("Payroll Export", "Export approved hours instantly once timecards are signed off and ready for your payroll process.")}
              ${renderFeatureCard("Multi-Site Management", "Manage hundreds of locations, multiple clients, and complex staffing books from one dashboard.")}
              ${renderFeatureCard("Real-Time Dashboard", "See who is clocked in, what approvals are pending, and where punch issues are building before payroll day.")}
            </div>
          </div>
        </section>

        <section class="section" id="screenshots">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Product Screenshots</p>
                <h2 class="section-title">Show staffing buyers the exact screens their team will use</h2>
              </div>
              <p class="section-copy">These product views mirror the workflows that matter most: worker punches, client approvals, and payroll-ready exports.</p>
            </div>
            <div class="marketing-screenshot-grid">
              ${renderMarketingScreenshotCard(
                "Worker Clock",
                "No-login QR punch screen",
                "Workers scan a site QR, pick their name, and punch in seconds from a phone.",
                `
                  <div class="marketing-shot-shell">
                    <div class="marketing-shot-top">
                      <strong>${escapeHtml(preview.siteName)}</strong>
                      <span class="status-badge ${escapeHtml(preview.statusTone)}">${escapeHtml(preview.statusLabel)}</span>
                    </div>
                    <div class="marketing-shot-field">
                      <span>Worker</span>
                      <strong>${escapeHtml(preview.workerName)}</strong>
                    </div>
                    <div class="marketing-shot-button-grid">
                      <span class="marketing-shot-button is-primary">Clock In</span>
                      <span class="marketing-shot-button">Start Lunch</span>
                      <span class="marketing-shot-button">End Lunch</span>
                      <span class="marketing-shot-button">Clock Out</span>
                    </div>
                    <p class="helper-copy">Last action: ${escapeHtml(preview.statusLabel)} for ${escapeHtml(preview.workerName)}</p>
                  </div>
                `,
                `<button class="button button-secondary" data-action="go-route" data-route="clock" type="button">Open Worker Clock</button>`
              )}
              ${renderMarketingScreenshotCard(
                "Client Approval Portal",
                "Review weekly timecards without email chains",
                "Client managers approve hours, reject time, and add notes from a focused portal.",
                `
                  <div class="marketing-shot-shell">
                    <div class="marketing-shot-top">
                      <strong>${escapeHtml(preview.clientName)}</strong>
                      <span class="status-badge status-warning">Pending Approval</span>
                    </div>
                    <div class="marketing-shot-list">
                      <div class="marketing-shot-row"><span>Worker</span><strong>${escapeHtml(preview.workerName)}</strong></div>
                      <div class="marketing-shot-row"><span>Site</span><strong>${escapeHtml(preview.siteName)}</strong></div>
                      <div class="marketing-shot-row"><span>Hours</span><strong>${escapeHtml(formatHours(preview.metrics.hoursThisWeek))}</strong></div>
                      <div class="marketing-shot-row"><span>Notes</span><strong>Missing punch reviewed</strong></div>
                    </div>
                    <div class="marketing-shot-action-row">
                      <span class="marketing-shot-button is-primary">Approve Hours</span>
                      <span class="marketing-shot-button">Reject Time</span>
                    </div>
                  </div>
                `,
                `<button class="button button-secondary" data-action="demo-login" data-role="clientManager" type="button">Open Client Manager Demo</button>`
              )}
              ${renderMarketingScreenshotCard(
                "Payroll Export",
                "Move from approved time to payroll-ready output",
                "Approved hours stay organized by worker, client, and site so payroll is cleaner every week.",
                `
                  <div class="marketing-shot-shell">
                    <div class="marketing-shot-top">
                      <strong>Payroll Export</strong>
                      <span class="status-badge status-success">Ready</span>
                    </div>
                    <div class="marketing-shot-summary-grid">
                      <div class="marketing-shot-summary"><span>Approved Hours</span><strong>${escapeHtml(formatHours(preview.metrics.hoursThisWeek))}</strong></div>
                      <div class="marketing-shot-summary"><span>Pending Approvals</span><strong>${escapeHtml(String(preview.metrics.pendingApprovals))}</strong></div>
                    </div>
                    <div class="marketing-shot-list">
                      <div class="marketing-shot-row"><span>${escapeHtml(preview.workerName)}</span><strong>${escapeHtml(preview.clientName)}</strong></div>
                      <div class="marketing-shot-row"><span>${escapeHtml(preview.siteName)}</span><strong>CSV Export</strong></div>
                    </div>
                  </div>
                `,
                `<button class="button button-secondary" data-action="demo-login" data-role="agencyOwner" type="button">Open Agency Demo</button>`
              )}
            </div>
          </div>
        </section>

        <section class="section" id="how-it-works">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">How It Works</p>
                <h2 class="section-title">One workflow from client setup to payroll export</h2>
              </div>
              <p class="section-copy">This is the exact agency workflow Portaly is built to simplify.</p>
            </div>
            <div class="flow-grid landing-flow-grid">
              ${renderFlowStep(1, "Create Client", "Create the company record that owns the worksite and final approval path.")}
              ${renderFlowStep(2, "Create Site", "Set up the warehouse, plant, or location where workers punch and managers approve time.")}
              ${renderFlowStep(3, "Assign Worker", "Tie each worker to the right client and site so punches stay organized.")}
              ${renderFlowStep(4, "Worker Scans QR", "Workers open a mobile-first punch page and record time without needing a login.")}
              ${renderFlowStep(5, "Client Approves Hours", "Client managers review weekly timecards, leave notes, and approve digitally.")}
              ${renderFlowStep(6, "Export Payroll", "Agency staff export approved hours without rebuilding payroll in spreadsheets.")}
            </div>
            <div class="workflow-lanes" style="margin-top: 20px;">
              ${renderWorkflowLaneCard("Agency setup", "Clients, sites, workers, and assignments all stay tied to the same staffing workflow.", [
                "Create a client and jobsite",
                "Add workers without requiring worker logins",
                "Assign workers and publish a site QR"
              ])}
              ${renderWorkflowLaneCard("Worker time capture", "Workers only see a simple punch screen built for busy job sites and shared devices.", [
                "Scan QR or open the site punch page",
                "Choose or type a worker name",
                "Clock in, lunch, and clock out without email"
              ])}
              ${renderWorkflowLaneCard("Approval and payroll", "Managers and payroll teams move from punches to approved export-ready hours faster.", [
                "Client managers approve timecards",
                "Agency admins review issues and punch requests",
                "Payroll exports stay clean and auditable"
              ])}
            </div>
          </div>
        </section>

        <section class="section" id="onboarding">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Onboarding Wizard</p>
                <h2 class="section-title">Launch your agency workflow without a long implementation project</h2>
              </div>
              <p class="section-copy">New agency owners land in a guided setup flow so the first client, site, worker, assignment, and QR code are easy to publish.</p>
            </div>
            <div class="demo-stage-grid">
              <div class="demo-stage-screen">
                <p class="eyebrow">Guided Setup</p>
                <h3>From empty workspace to first live punch station</h3>
                <p class="section-copy">Portaly already walks owners through the steps that matter most instead of dropping them into a blank dashboard.</p>
                <div class="page-actions" style="margin-top: 20px;">
                  <button class="button button-primary" data-action="go-route" data-route="trial" type="button">Start Free Trial</button>
                  <button class="button button-secondary" data-action="demo-login" data-role="agencyOwner" type="button">Open Agency Demo</button>
                </div>
              </div>
              <div class="marketing-wizard-card">
                <div class="marketing-wizard-step is-complete"><span>01</span><div><strong>Add Client</strong><p>Create the company record and approval owner.</p></div></div>
                <div class="marketing-wizard-step is-complete"><span>02</span><div><strong>Add Site</strong><p>Create the warehouse, plant, or location.</p></div></div>
                <div class="marketing-wizard-step is-complete"><span>03</span><div><strong>Add Worker</strong><p>Build the worker roster without worker accounts.</p></div></div>
                <div class="marketing-wizard-step is-active"><span>04</span><div><strong>Assign Worker</strong><p>Connect workers to the right client and site.</p></div></div>
                <div class="marketing-wizard-step"><span>05</span><div><strong>Generate Site QR</strong><p>Publish the QR punch page workers will scan.</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="comparison">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Competitive Comparison</p>
                <h2 class="section-title">Stronger than spreadsheets and generic payroll tools for staffing operations</h2>
              </div>
              <p class="section-copy">Portaly is purpose-built for temporary labor workflows where assignments, job sites, approvals, and payroll all have to stay aligned.</p>
            </div>
            <div class="table-shell comparison-shell">
              <table class="comparison-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Spreadsheets</th>
                    <th>Generic Payroll Systems</th>
                    <th>Portaly</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderCompetitiveComparisonRow("QR Clock In", "Manual workaround", "Usually requires extra tooling", "Built in for every site")}
                  ${renderCompetitiveComparisonRow("Client Approval", "Phone calls and email follow-up", "Limited or outside workflow", "Digital approvals with notes and signatures")}
                  ${renderCompetitiveComparisonRow("Payroll Export", "Manual cleanup every week", "Partial export after heavy setup", "Approved hours ready for export")}
                  ${renderCompetitiveComparisonRow("Multi Site Tracking", "Hard to maintain", "Often weak across staffing books", "Manage clients, sites, and assignments in one view")}
                  ${renderCompetitiveComparisonRow("Worker Portal", "Not available", "Usually employee-login focused", "Simple no-login worker punch experience")}
                  ${renderCompetitiveComparisonRow("Real Time Dashboard", "No live visibility", "Basic status only", "Punches, approvals, assignments, and hours in one dashboard")}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="section" id="industries">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Supported Industries</p>
                <h2 class="section-title">Built for staffing firms placing workers into fast-moving operations</h2>
              </div>
              <p class="section-copy">Use Portaly across one warehouse, one client network, or a broader light industrial book of business.</p>
            </div>
            <div class="audience-grid landing-industry-grid">
              ${[
                "Warehouse Staffing",
                "Manufacturing Staffing",
                "Distribution Centers",
                "Logistics Staffing",
                "Light Industrial Staffing",
                "General Labor Staffing",
                "Administrative Staffing",
                "Hospitality Staffing"
              ].map(item => `<div class="audience-pill">${escapeHtml(item)}</div>`).join("")}
            </div>
          </div>
        </section>

        <section class="section" id="approval-portal">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Client Approval Portal</p>
                <h2 class="section-title">Give client managers a focused approval workspace instead of a full agency dashboard</h2>
              </div>
              <p class="section-copy">Assigned client managers can review hours, approve or reject timecards, and keep payroll moving without seeing the rest of the agency back office.</p>
            </div>
            <div class="split-grid">
              <div class="surface-card">
                <div class="card-top">
                  <div>
                    <p class="eyebrow">Portal Access</p>
                    <h3>Everything a client manager needs, nothing they do not</h3>
                  </div>
                </div>
                <ul class="list" style="margin-top: 16px;">
                  <li>Assigned client and site visibility only</li>
                  <li>Weekly timecard review with notes and approval status</li>
                  <li>Digital approval actions for submitted hours</li>
                  <li>Cleaner handoff back to the staffing agency payroll team</li>
                </ul>
                <div class="page-actions" style="margin-top: 18px;">
                  <button class="button button-primary" data-action="demo-login" data-role="clientManager" type="button">Open Client Manager Demo</button>
                  <button class="button button-secondary" data-action="go-route" data-route="login" type="button">Client Manager Login</button>
                </div>
              </div>
              <div class="surface-card approval-proof-card">
                <div class="marketing-shot-shell">
                  <div class="marketing-shot-top">
                    <strong>${escapeHtml(preview.clientName)} Approval Queue</strong>
                    <span class="status-badge status-warning">${escapeHtml(String(preview.metrics.pendingApprovals))} Pending</span>
                  </div>
                  <div class="marketing-shot-list">
                    <div class="marketing-shot-row"><span>${escapeHtml(preview.workerName)}</span><strong>${escapeHtml(preview.siteName)}</strong></div>
                    <div class="marketing-shot-row"><span>Week ending</span><strong>${escapeHtml(formatDate(state.now))}</strong></div>
                    <div class="marketing-shot-row"><span>Total hours</span><strong>${escapeHtml(formatHours(preview.metrics.hoursThisWeek))}</strong></div>
                  </div>
                  <div class="marketing-shot-action-row">
                    <span class="marketing-shot-button is-primary">Approve</span>
                    <span class="marketing-shot-button">Reject</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="testimonials">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Testimonials</p>
                <h2 class="section-title">The payoff is cleaner time, faster payroll, and happier client managers</h2>
              </div>
              <p class="section-copy">These are the outcomes staffing owners want to hear when they evaluate a new operations platform.</p>
            </div>
            <div class="feature-grid testimonial-grid">
              ${renderTestimonialCard("Portaly eliminated our paper timesheets.", "Operations Director", "Warehouse staffing agency")}
              ${renderTestimonialCard("Payroll takes half the time it used to, and approvals are finally organized by client and site.", "Payroll Manager", "Manufacturing staffing firm")}
              ${renderTestimonialCard("Our clients love approving hours digitally instead of texting supervisors on Friday afternoon.", "Agency Owner", "Temporary labor agency")}
            </div>
          </div>
        </section>

        <section class="section" id="demo-tour">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">See Portaly In Action</p>
                <h2 class="section-title">Show the full staffing workflow in one live walkthrough</h2>
              </div>
              <p class="section-copy">From worker punch capture to assignment setup and payroll export, the demo tells the story agency owners care about most.</p>
            </div>
            <div class="surface-card demo-stage-card">
              <div class="demo-stage-grid">
                <div class="demo-stage-screen">
                  <p class="eyebrow">Product Tour</p>
                  <h3>From QR punch to payroll export</h3>
                  <p class="section-copy">Walk through the same workflow your staffing desk runs every week without jumping between spreadsheets, texts, and approval emails.</p>
                  <div class="page-actions" style="margin-top: 20px;">
                    <button class="button button-primary" data-action="go-route" data-route="demo" type="button">Open Interactive Demo</button>
                    <button class="button button-secondary" data-action="book-live-demo" type="button">Book Live Demo</button>
                  </div>
                </div>
                <div class="demo-stage-list">
                  ${renderDemoWorkflowCard("Worker Clock In", "Workers scan a site QR and punch from a mobile-first clock page.", "01")}
                  ${renderDemoWorkflowCard("Assignment Creation", "Agency staff connect workers to the right client and site.", "02")}
                  ${renderDemoWorkflowCard("Timesheet Approval", "Client managers review hours, sign, and keep payroll moving.", "03")}
                  ${renderDemoWorkflowCard("Payroll Export", "Approved hours are ready for payroll without manual spreadsheet cleanup.", "04")}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="demo-accounts">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Demo Account</p>
                <h2 class="section-title">Open the real product flow instantly without filling out a sales form</h2>
              </div>
              <p class="section-copy">Use working demo roles to walk through the agency dashboard, worker punch flow, and client approval portal right now.</p>
            </div>
            <div class="feature-grid demo-access-grid">
              ${renderMarketingDemoRoleCard("Agency Owner Demo", "See the staffing dashboard, workers, sites, payroll, and billing pages as an owner.", "agencyOwner")}
              ${renderMarketingDemoRoleCard("Client Manager Demo", "Open the approval workflow and review weekly timecards as a client manager.", "clientManager")}
              ${renderMarketingDemoRoleCard("Worker Demo", "Go straight to the worker punch experience and test the QR-style clock flow.", "worker")}
            </div>
          </div>
        </section>

        <section class="section" id="roi">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">ROI Calculator</p>
                <h2 class="section-title">Estimate what cleaner time and approvals could save your staffing desk</h2>
              </div>
              <p class="section-copy">This estimator uses your own assumptions. It does not rely on customer benchmark claims or unsupported platform-wide percentages.</p>
            </div>
            <div class="roi-estimator-grid">
              <div class="surface-card roi-input-card">
                <div class="card-top">
                  <div>
                    <p class="eyebrow">Your Inputs</p>
                    <h3>Adjust the staffing desk math</h3>
                  </div>
                </div>
                <div class="form-grid" style="margin-top: 18px;">
                  <div class="field-group">
                    <label for="roi-workers">Active temp workers</label>
                    <input id="roi-workers" name="roiWorkers" type="number" min="0" value="${escapeAttribute(String(state.roi.workers))}" />
                  </div>
                  <div class="field-group">
                    <label for="roi-admin-hours">Admin hours per week spent fixing time</label>
                    <input id="roi-admin-hours" name="roiAdminHours" type="number" min="0" value="${escapeAttribute(String(state.roi.adminHours))}" />
                  </div>
                  <div class="field-group">
                    <label for="roi-disputes">Punch or timesheet disputes per month</label>
                    <input id="roi-disputes" name="roiDisputes" type="number" min="0" value="${escapeAttribute(String(state.roi.disputes))}" />
                  </div>
                </div>
                <p class="helper-copy" style="margin-top: 16px;">Assumptions: 55% of payroll admin time can be recovered, back-office labor cost is estimated at $28/hour, and each dispute costs about $95 in handling time.</p>
              </div>
              <div class="summary-grid roi-output-grid">
                ${renderRoiMetricCard("Hours Recovered / Month", formatHours(roi.monthlyHoursRecovered), "Back-office hours freed from chasing timecards and missing punches.")}
                ${renderRoiMetricCard("Admin Savings / Month", formatCurrency(roi.monthlyAdminSavings), "Estimated labor savings from cleaner time collection and approvals.")}
                ${renderRoiMetricCard("Dispute Savings / Month", formatCurrency(roi.monthlyDisputeSavings), "Estimated handling cost avoided from fewer punch disputes and corrections.")}
                ${renderRoiMetricCard("Annual Savings Potential", formatCurrency(roi.annualSavings), "A directional estimate to help owners justify the switch from spreadsheets.")}
              </div>
            </div>
          </div>
        </section>

        <section class="section ${focusPricing ? "marketing-section-highlight" : ""}" id="pricing">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Pricing</p>
                <h2 class="section-title">Flexible plans for agencies growing from one site to many</h2>
              </div>
              <p class="section-copy">Growth is the best fit for most staffing agencies that need cleaner approvals, stronger visibility, and payroll-ready exports.</p>
            </div>
            <div class="pricing-grid">
              ${planCards}
            </div>
            <div class="pricing-provider-grid" style="margin-top: 18px;">
              ${renderSubscriptionProviderCard(
                "Square Checkout",
                "Live today",
                "Self-serve checkout for agencies ready to start a paid subscription right away.",
                ["Working payment links", "Fastest path to go live", "Best for small and mid-size staffing teams"],
                `<button class="button button-primary" data-action="start-checkout" data-plan="growth" type="button">Start Square Checkout</button>`
              )}
              ${renderSubscriptionProviderCard(
                "Stripe or invoiced setup",
                "Guided onboarding",
                "Need a different billing motion? Use a live demo call to scope Stripe, invoice, or enterprise subscription setup.",
                ["Good for larger staffing groups", "Supports custom rollout planning", "Uses a working live-demo contact flow today"],
                `<button class="button button-secondary" data-action="book-live-demo" type="button">Request Billing Setup</button>`
              )}
            </div>
            <div class="notice-card pricing-note-card" style="margin-top: 18px;">
              <div>
                <strong>Start with a free trial, then move into a subscription path that fits your agency.</strong>
                <p>Square checkout is available today, and guided Stripe or invoiced subscription setup can be handled during onboarding without blocking the product evaluation.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="trust">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Trust</p>
                <h2 class="section-title">Built for staffing teams that need controlled access and payroll-ready data</h2>
              </div>
              <p class="section-copy">These are the platform signals staffing agencies look for when timekeeping, approvals, and payroll preparation all touch the same workflow.</p>
            </div>
            <div class="trust-grid">
              ${renderTrustBadge("Secure Cloud Platform")}
              ${renderTrustBadge("Role-Based Permissions")}
              ${renderTrustBadge("Multi-Tenant Staffing Support")}
              ${renderTrustBadge("Payroll Ready Exports")}
              ${renderTrustBadge("Mobile Friendly")}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="support-card marketing-callout landing-final-cta">
              <p class="eyebrow">Ready To Replace Spreadsheet Chaos?</p>
              <h3>Give your staffing team one platform for punches, approvals, assignments, and payroll prep</h3>
              <p>Show owners, payroll teams, and client managers the exact workflow that removes missing punches, cuts approval delays, and cleans up payroll export week.</p>
              <div class="page-actions" style="margin-top: 18px;">
                <button class="button button-primary" data-action="go-route" data-route="trial" type="button">Start Free Trial</button>
                <button class="button button-secondary" data-action="book-live-demo" type="button">Book Live Demo</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    `;
  }

  function renderApprovalLinkShell() {
    return `
      <div class="public-root approval-shell">
        ${renderPublicApprovalPage()}
      </div>
    `;
  }

  function buildApprovalRouteContext() {
    const parsed = parseApprovalHash();
    if (!parsed) {
      return null;
    }

    const sources = [];
    if (state.session.mode !== "public" && state.session.role) {
      sources.push(getScopedData());
    }
    sources.push(state.demoStore);

    for (const source of sources) {
      const approvals = source.approvals || [];
      const approval = approvals.find(item => (
        parsed.mode === "id"
          ? item.id === parsed.value
          : (item.approvalToken === parsed.value || item.id === parsed.value)
      ));
      if (!approval) {
        continue;
      }
      const timesheet = (source.timesheets || []).find(item => item.id === approval.timesheetId);
      const punches = getTimesheetPunches(timesheet, source.punches || []);
      return {
        parsed,
        source,
        approval,
        timesheet,
        punches
      };
    }

    return {
      parsed,
      source: null,
      approval: null,
      timesheet: null,
      punches: []
    };
  }

  function renderApprovalReviewPage(mode = "public") {
    const context = buildApprovalRouteContext();
    if (!context?.approval || !context?.timesheet) {
      return `
        <main class="auth-shell">
          <div class="container">
            <div class="auth-card approval-review-card" style="max-width: 860px; margin: 0 auto;">
              <p class="eyebrow">Approval Link</p>
              <h3>Approval link ready</h3>
              <p>This approval link could not load a matching timecard from the current session. Sign in as the assigned client manager or use the demo to review and sign hours.</p>
              <div class="page-actions" style="margin-top: 20px;">
                <button class="button button-primary" data-action="go-route" data-route="login" type="button">Login</button>
                <button class="button button-secondary" data-action="go-route" data-route="demo" type="button">View Demo</button>
              </div>
            </div>
          </div>
        </main>
      `;
    }

    const { approval, timesheet, punches } = context;
    const approvalNote = approval.note || timesheet.clientNotes || timesheet.adminNotes || "No note added yet.";
    const canAct = mode === "client" && canApproveRecord(timesheet);
    const historyBadges = [
      renderInlineStatus(approval.status || timesheet.status),
      approval.clientEdited || timesheet.clientEdited ? `<span class="status-badge status-warning">Client Edited</span>` : "",
      punches.some(punch => punch.edited) ? `<span class="status-badge status-warning">Edited</span>` : ""
    ].join("");

    return `
      <main class="auth-shell approval-shell-main">
        <div class="container">
          <div class="auth-card approval-review-card" style="max-width: 980px; margin: 0 auto;">
            <div class="page-actions" style="justify-content: space-between; align-items: flex-start; gap: 16px;">
              <div>
                <p class="eyebrow">Client Approval</p>
                <h3>${escapeHtml(getClientName(approval.clientId))} - ${escapeHtml(getSiteName(approval.siteId))}</h3>
                <p class="helper-copy">Week ending ${escapeHtml(formatDate(approval.weekEnd || timesheet.payPeriodEnd || state.now))}</p>
              </div>
              <div class="page-actions">
                ${historyBadges}
              </div>
            </div>

            <div class="detail-grid" style="margin-top: 20px;">
              ${renderDetailBox("Client", getClientName(approval.clientId))}
              ${renderDetailBox("Site", getSiteName(approval.siteId))}
              ${renderDetailBox("Worker", getWorkerName(approval.workerId))}
              ${renderDetailBox("Regular hours", formatHours(timesheet.regularHours || 0))}
              ${renderDetailBox("Overtime hours", formatHours(timesheet.overtimeHours || 0))}
              ${renderDetailBox("Total hours", formatHours(timesheet.approvedHours || 0))}
              ${renderDetailBox("Signature status", approval.managerName ? `Signed by ${approval.managerName}` : "Awaiting signature")}
              ${renderDetailBox("Approval note", approvalNote)}
            </div>

            <div class="surface-card" style="margin-top: 20px;">
              <p class="eyebrow">Punch details</p>
              ${punches.length ? `
                <ul class="history-list" style="margin-top: 14px;">
                  ${punches.map(punch => `
                    <li class="history-item">
                      <div>
                        <strong>${escapeHtml(PUNCH_LABELS[punch.action] || punch.action)}</strong>
                        <p class="inline-note">${escapeHtml(formatDateTime(punch.timestamp))}</p>
                      </div>
                      <div class="page-actions">
                        ${punch.edited ? `<span class="status-badge status-warning">Edited</span>` : ""}
                        ${renderInlineStatus("submitted")}
                      </div>
                    </li>
                  `).join("")}
                </ul>
              ` : renderEmptyState("No punches recorded yet", "Punch activity for this timecard will appear here once shifts are captured.")}
            </div>

            ${mode === "client" ? `
              <div class="summary-card" style="margin-top: 20px;">
                <p class="eyebrow">Approval link tools</p>
                <div class="page-actions" style="margin-top: 16px;">
                  <button class="button button-secondary" data-action="copy-approval-link" data-approval-id="${escapeHtml(approval.id)}" data-link-mode="internal" type="button">Copy Approval Link</button>
                  <button class="button button-ghost" data-action="email-approval-link" data-approval-id="${escapeHtml(approval.id)}" type="button">Email Approval Link</button>
                  <button class="button button-ghost" data-action="text-approval-link" data-approval-id="${escapeHtml(approval.id)}" type="button">Text Approval Link</button>
                </div>
              </div>
            ` : ""}

            ${canAct ? `
              <div class="page-actions approval-action-row" style="margin-top: 22px;">
                <button class="button button-secondary" data-action="open-client-time-edit" data-timesheet-id="${escapeHtml(timesheet.id)}" type="button">Edit Time</button>
                <button class="button button-secondary" data-action="open-client-missing-punch" data-timesheet-id="${escapeHtml(timesheet.id)}" type="button">Add Missing Punch</button>
                <button class="button button-primary" data-action="approve-timesheet" data-timesheet-id="${escapeHtml(timesheet.id)}" type="button">Approve and Sign</button>
                <button class="button button-danger" data-action="open-reject-modal" data-target-type="timesheet" data-target-id="${escapeHtml(timesheet.id)}" type="button">Reject</button>
              </div>
            ` : `
              <div class="notice-card" style="margin-top: 22px;">
                <div>
                  <strong>${mode === "public" ? "Sign in to approve this timecard." : "Review access is limited on this page."}</strong>
                  <p>${mode === "public" ? "This public approval page stays separate from the main dashboard. Sign in as the assigned client manager to approve or reject the timecard." : "Only the assigned client manager or agency staff can approve this record."}</p>
                </div>
              </div>
            `}
          </div>
        </div>
      </main>
    `;
  }

  function renderPublicApprovalPage() {
    return renderApprovalReviewPage("public");
  }

  function renderClientApprovalPage() {
    return renderApprovalReviewPage("client");
  }

  function renderDemoAccessHub() {
    return `
      <main class="auth-shell">
        <div class="container auth-grid">
          <div class="stack-lg">
            <div class="auth-card">
              <p class="eyebrow">Access Hub</p>
              <h3>Choose a Demo Account</h3>
              <p>Demo Mode stays public and separate from real user accounts. Open any role below instantly and test the workflow in this browser.</p>
              <div class="page-actions" style="margin-top: 18px;">
                <span class="mode-badge">Demo Mode - no signup required</span>
                <button class="button button-ghost" data-action="reset-demo" type="button">Reset Demo Data</button>
              </div>
            </div>
            <div class="grid grid-2">
              <div class="auth-card">
                <p class="eyebrow">Owner / Admin Portal</p>
                <h3>Powerful for agency operations</h3>
                <p>Review workers, approvals, payroll, margin, billing, and settings in a clean command center.</p>
                <ul class="list">
                  <li>Platform-wide metrics</li>
                  <li>Agency owner dashboard</li>
                  <li>Agency admin workflow</li>
                  <li>Client approval view</li>
                </ul>
              </div>
              <div class="auth-card">
                <p class="eyebrow">Worker Punch Portal</p>
                <h3>Simple enough for the warehouse floor</h3>
                <p>Open the worker punch screen directly and keep clock in, lunch, and clock out easy on a phone or kiosk.</p>
                <ul class="list">
                  <li>Large punch buttons</li>
                  <li>Current status on screen</li>
                  <li>Recent history</li>
                  <li>Need help card</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="stack-md">
            ${renderDemoRoleCard("Platform Owner", "View agencies, users, subscriptions, and system health.", "platformOwner")}
            ${renderDemoRoleCard("Agency Owner", "Manage one agency, workers, payroll, margin, billing, and settings.", "agencyOwner")}
            ${renderDemoRoleCard("Agency Admin", "Manage workers, assignments, punches, approvals, and payroll.", "agencyAdmin")}
            ${renderDemoRoleCard("Client Manager", "Approve submitted hours for your assigned client and sites only.", "clientManager")}
            ${renderDemoRoleCard("Worker", "Go directly to the mobile punch screen.", "worker")}
          </div>
        </div>
      </main>
    `;
  }

  function renderLoginPage() {
    const cloudConfigured = hasConfiguredFirebaseCloudMode();
    const cloudStatusNotice = !cloudConfigured
      ? renderFirebaseSetupNotice({
        margin: "0 0 18px",
        body: "Portaly can still run from GitHub Pages without a custom domain. Add your Firebase web config and make sure https://zaspdragon.github.io and localhost are listed in Firebase Authentication authorized domains when you are ready to turn on Cloud Mode."
      })
      : (!state.firebase.ready && state.firebase.error
        ? `
          <div class="notice-card warning" style="margin: 0 0 18px;">
            <div>
              <strong>Cloud login is still connecting.</strong>
              <p>${escapeHtml(state.firebase.error)}</p>
            </div>
          </div>
        `
        : "");
    const localPreviewWarning = isLocalFilePreview()
      ? `
        <div class="notice-card warning" style="margin: 0 0 18px;">
          <div>
            <strong>Cloud login works best from GitHub Pages or another authorized web domain.</strong>
            <p>You can keep using Demo Mode from this local preview. Use the published site URL when testing real Firebase sign-in.</p>
          </div>
        </div>
      `
      : "";
    const pendingInviteNotice = getStoredPendingInviteToken()
      ? `
        <div class="notice-card" style="margin: 0 0 18px;">
          <div>
            <strong>Client manager invite in progress</strong>
            <p>After login, Portaly will return you to the invite so you can finish setting up approvals access.</p>
          </div>
        </div>
      `
      : "";

    return `
      <main class="auth-shell">
        <div class="container auth-grid">
          <div class="auth-card">
            <p class="eyebrow">Cloud Mode</p>
            <h3>Login</h3>
            <p>Real users sign in with Firebase Authentication. Workers go straight to the punch screen. Client managers land in Approvals. Owners and admins land in the command center.</p>
            ${cloudStatusNotice}
            ${localPreviewWarning}
            ${pendingInviteNotice}
            <form class="form-grid" data-form="login">
              <div class="field-group">
                <label for="login-email">Email</label>
                <input id="login-email" name="email" type="email" placeholder="name@agency.com" />
              </div>
              <div class="field-group">
                <label for="login-password">Password</label>
                <input id="login-password" name="password" type="password" placeholder="Enter your password" />
              </div>
              <div class="page-actions">
                <button class="button button-primary button-block" type="submit" ${cloudConfigured ? "" : "disabled"}>Login</button>
              </div>
            </form>
            <div class="auth-link-row">
              <button class="button button-ghost" data-action="go-route" data-route="trial" type="button">Create Account / Start Free Trial</button>
              <button class="marketing-link" data-action="go-route" data-route="forgot-password" type="button">Forgot password?</button>
            </div>
          </div>
          <div class="stack-md">
            ${renderDemoAccessForm({
              eyebrow: "Send Me Demo Access",
              title: "Need instant demo credentials?",
              copy: "We will email the Portaly demo login so you can test the worker clock, client approvals, payroll export, and agency dashboard before starting a trial.",
              idSuffix: "login",
              cardClass: "login-demo-access-card",
              includeBookDemo: true
            })}
            <div class="support-card">
              <p class="eyebrow">Two Data Modes</p>
              <h3>Demo Mode stays local. Cloud Mode syncs.</h3>
              <p>Demo Mode uses localStorage only and does not create real accounts or billing records. Cloud Mode uses Firebase Authentication, Firestore, and Square payment links.</p>
            </div>
            <div class="support-card">
              <p class="eyebrow">Demo Account</p>
              <h3>Open a working demo instantly</h3>
              <p>Test the owner dashboard, client approval flow, and worker clock without creating a real account first.</p>
              <div class="page-actions" style="margin-top: 16px;">
                <button class="button button-secondary" data-action="demo-login" data-role="agencyOwner" type="button">Agency Owner Demo</button>
                <button class="button button-secondary" data-action="demo-login" data-role="clientManager" type="button">Client Manager Demo</button>
                <button class="button button-secondary" data-action="demo-login" data-role="worker" type="button">Worker Demo</button>
                <button class="button button-ghost" data-action="go-route" data-route="pricing" type="button">View Pricing</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function renderAcceptInvitePage() {
    const invite = state.inviteFlow.details || null;
    const authUser = state.firebase.auth?.currentUser || state.authUser || null;
    const inviteStatus = String(invite?.status || "").trim().toLowerCase();
    const authEmail = String(authUser?.email || "").trim().toLowerCase();
    const inviteEmail = String(invite?.email || "").trim().toLowerCase();
    const emailMatches = !!authEmail && !!inviteEmail && authEmail === inviteEmail;
    const signedInReady = !!authUser && emailMatches;
    const wrongAccount = !!authUser && !!inviteEmail && authEmail !== inviteEmail;
    const inviteExpired = inviteStatus === "expired" || (!!invite?.tokenExpiresAt && compareDates(invite.tokenExpiresAt, new Date().toISOString()) < 0);
    const inviteMalformed = !inviteStatus;
    const inviteUnavailable = inviteExpired || inviteMalformed || inviteStatus === "revoked";
    const assignedClients = (invite?.assignedClientNames || []).filter(Boolean);
    const assignedSites = (invite?.assignedSiteNames || []).filter(Boolean);

    if (state.inviteFlow.loading) {
      return `
        <main class="auth-shell">
          <div class="container auth-grid onboarding-auth-grid">
            <div class="auth-card onboarding-card">
              <p class="eyebrow">Portaly Invite</p>
              <h3>Loading invite details</h3>
              <p>Checking the assigned client, site, and access details for this approval invite.</p>
              <div class="loading-skeleton-stack" aria-hidden="true" style="margin-top: 18px;">
                <span class="skeleton-line skeleton-line-lg"></span>
                <span class="skeleton-line"></span>
                <span class="skeleton-line skeleton-line-sm"></span>
              </div>
            </div>
          </div>
        </main>
      `;
    }

    if (state.inviteFlow.error || !invite) {
      console.error("[Portaly] renderAcceptInvitePage missing invite", {
        inviteFlow: state.inviteFlow,
        authUser: authUser ? {
          uid: authUser.uid || "",
          email: authUser.email || ""
        } : null
      });
      return `
        <main class="auth-shell">
          <div class="container auth-grid onboarding-auth-grid">
            <div class="auth-card onboarding-card">
              <p class="eyebrow">Portaly Invite</p>
              <h3>We could not open this invite</h3>
                <p>${escapeHtml(state.inviteFlow.error || "This invite could not be found or is no longer available.")}</p>
              <div class="page-actions" style="margin-top: 18px;">
                <button class="button button-secondary" data-action="go-route" data-route="login" type="button">Login</button>
                <button class="button button-ghost" data-action="go-route" data-route="demo" type="button">View Demo</button>
              </div>
            </div>
          </div>
        </main>
      `;
    }

    const setupCard = inviteUnavailable
      ? `
        <div class="support-card onboarding-support-card">
          <p class="eyebrow">Invite Unavailable</p>
          <h3>${inviteMalformed ? "Invite details need attention" : inviteStatus === "revoked" ? "This invite has been revoked" : "Ask for a fresh Portaly invite"}</h3>
          <p>${inviteMalformed
            ? getMalformedInviteMessage()
            : inviteStatus === "revoked"
              ? getRevokedInviteMessage()
              : "This link can no longer be used. Contact the staffing agency so they can send a new client manager invite for your site."}</p>
          <div class="page-actions" style="margin-top: 16px;">
            <button class="button button-secondary button-block" data-action="go-route" data-route="login" type="button">Login</button>
          </div>
        </div>
      `
      : invite.source === "demo"
      ? `
        <div class="support-card onboarding-support-card">
          <p class="eyebrow">Demo Invite</p>
          <h3>Open the client approval demo</h3>
          <p>This demo invite keeps everything local to this browser. Use it to preview the client manager approvals flow without creating a real account.</p>
          <div class="page-actions" style="margin-top: 16px;">
            <button class="button button-primary button-block" data-action="accept-demo-invite" type="button">Continue to Approvals</button>
          </div>
        </div>
      `
      : wrongAccount
        ? `
          <div class="support-card onboarding-support-card">
            <p class="eyebrow">Wrong Account</p>
            <h3>Sign out and use the invited email</h3>
            <p>This invite was sent to <strong>${escapeHtml(invite.email || "")}</strong>. Sign out of the current account before continuing.</p>
            <div class="page-actions" style="margin-top: 16px;">
              <button class="button button-primary button-block" data-action="logout" type="button">Logout</button>
            </div>
          </div>
        `
        : signedInReady
          ? `
            <div class="support-card onboarding-support-card">
              <p class="eyebrow">Access Ready</p>
              <h3>${inviteStatus === "accepted" ? "Continue to approvals" : "Accept invite and continue"}</h3>
              <p>${inviteStatus === "accepted"
                ? "This invite has already been accepted for your login. Continue to the client approvals workspace."
                : "Your login is ready. Finish connecting this invite to your approvals workspace."}</p>
              <div class="page-actions" style="margin-top: 16px;">
                <button class="button button-primary button-block" data-action="accept-client-invite" type="button">${inviteStatus === "accepted" ? "Continue to Approvals" : "Accept Invite"}</button>
              </div>
            </div>
          `
          : inviteStatus === "accepted"
            ? `
              <div class="support-card onboarding-support-card">
                <p class="eyebrow">Invite Accepted</p>
                <h3>This invite has already been accepted</h3>
                <p>Sign in with <strong>${escapeHtml(invite.email || "")}</strong> to continue to the client approvals workspace.</p>
                <div class="page-actions" style="margin-top: 16px;">
                  <button class="button button-primary button-block" data-action="go-route" data-route="login" type="button">Login</button>
                </div>
              </div>
            `
          : invite.authAccountExists
            ? `
              <div class="support-card onboarding-support-card">
                <p class="eyebrow">Set Up Access</p>
                <h3>Sign in with your Portaly login</h3>
                <p>Your secure login is already on file. Sign in with the invited email to connect this approvals workspace.</p>
                <form class="form-grid" data-form="accept-invite-login" style="margin-top: 16px;">
                  <div class="field-group">
                    <label for="invite-login-email">Email</label>
                    <input id="invite-login-email" type="email" value="${escapeAttribute(invite.email || "")}" readonly />
                  </div>
                  <div class="form-row two">
                    <div class="field-group">
                      <label for="invite-login-first-name">First name</label>
                      <input id="invite-login-first-name" type="text" value="${escapeAttribute(invite.firstName || "")}" readonly />
                    </div>
                    <div class="field-group">
                      <label for="invite-login-last-name">Last name</label>
                      <input id="invite-login-last-name" type="text" value="${escapeAttribute(invite.lastName || "")}" readonly />
                    </div>
                  </div>
                  <div class="field-group">
                    <label for="invite-login-phone">Phone</label>
                    <input id="invite-login-phone" type="text" value="${escapeAttribute(invite.phone || "")}" readonly />
                  </div>
                  <div class="field-group">
                    <label for="invite-login-password">Password</label>
                    <input id="invite-login-password" name="password" type="password" placeholder="Enter your password" />
                  </div>
                  <p class="helper-copy">These access details came from your staffing agency invite. If anything looks wrong, contact the agency before continuing.</p>
                  <div class="modal-actions">
                    <button class="button button-primary button-block" type="submit">Accept Invite</button>
                  </div>
                </form>
              </div>
            `
            : `
              <div class="support-card onboarding-support-card">
                <p class="eyebrow">Set Up Access</p>
                <h3>Create your client manager login</h3>
                <p>Create a password for <strong>${escapeHtml(invite.email || "")}</strong>. Portaly will connect your login to the assigned approval workspace after setup.</p>
                <form class="form-grid" data-form="accept-invite-create" style="margin-top: 16px;">
                  <div class="field-group">
                    <label for="invite-create-email">Email</label>
                    <input id="invite-create-email" type="email" value="${escapeAttribute(invite.email || "")}" readonly />
                  </div>
                  <div class="form-row two">
                    <div class="field-group">
                      <label for="invite-create-first-name">First name</label>
                      <input id="invite-create-first-name" type="text" value="${escapeAttribute(invite.firstName || "")}" readonly />
                    </div>
                    <div class="field-group">
                      <label for="invite-create-last-name">Last name</label>
                      <input id="invite-create-last-name" type="text" value="${escapeAttribute(invite.lastName || "")}" readonly />
                    </div>
                  </div>
                  <div class="field-group">
                    <label for="invite-create-phone">Phone</label>
                    <input id="invite-create-phone" type="text" value="${escapeAttribute(invite.phone || "")}" readonly />
                  </div>
                  <div class="form-row two">
                    <div class="field-group">
                      <label for="invite-create-password">Password</label>
                      <input id="invite-create-password" name="password" type="password" placeholder="Create a password" />
                    </div>
                    <div class="field-group">
                      <label for="invite-create-confirm">Confirm password</label>
                      <input id="invite-create-confirm" name="confirmPassword" type="password" placeholder="Confirm password" />
                    </div>
                  </div>
                  <p class="helper-copy">Portaly will use these invited details to create your approval access and send you straight to the assigned approvals workspace.</p>
                  <div class="modal-actions">
                    <button class="button button-primary button-block" type="submit">Set Up Access</button>
                  </div>
                </form>
                <div class="page-actions" style="margin-top: 12px;">
                  <button class="button button-ghost" data-action="magic-link-placeholder" type="button">Email Me a Magic Link</button>
                </div>
              </div>
            `;

    return `
      <main class="auth-shell">
        <div class="container auth-grid onboarding-auth-grid">
          <div class="auth-card onboarding-card">
            <div class="onboarding-stepbar">
              <span class="mode-badge">Client Approval Invite</span>
              <div class="onboarding-badges">
                <span class="onboarding-pill">Assigned site access only</span>
                <span class="onboarding-pill">Digital approvals</span>
                <span class="onboarding-pill">Audit trail included</span>
                <span class="onboarding-pill">Square billing untouched</span>
              </div>
            </div>
            <p class="eyebrow">Client Manager Access</p>
            <h3>You've been invited to approve timecards in Portaly</h3>
            <p>Review submitted hours, correct missed punches, and sign approvals for your assigned site without seeing agency billing or margin data.</p>
            ${inviteExpired ? `
              <div class="notice-card danger" style="margin-top: 18px;">
                <div>
                  <strong>This invite has expired.</strong>
                  <p>Ask your staffing agency contact to send a new client manager invite.</p>
                </div>
              </div>
            ` : ""}
            ${inviteStatus !== "pending" && invite.source !== "demo" ? `
              <div class="notice-card warning" style="margin-top: 18px;">
                <div>
                  <strong>Status: ${escapeHtml(formatStatusLabel(inviteStatus || "pending"))}</strong>
                  <p>${inviteMalformed
                    ? getMalformedInviteMessage()
                    : inviteStatus === "accepted"
                      ? getAcceptedInviteMessage()
                      : inviteStatus === "revoked"
                        ? getRevokedInviteMessage()
                        : "This invite is no longer pending. Ask your staffing agency if you need a fresh link."}</p>
                </div>
              </div>
            ` : ""}
            <div class="detail-grid" style="margin-top: 18px;">
              ${renderDetailBox("Invited manager", `${invite.firstName || ""} ${invite.lastName || ""}`.trim() || invite.email || "-")}
              ${renderDetailBox("Email", invite.email || "-")}
              ${renderDetailBox("Agency", invite.agencyName || "Portaly")}
              ${renderDetailBox("Expires", invite.tokenExpiresAt ? formatDate(invite.tokenExpiresAt) : "Open")}
              ${renderDetailBox("Assigned clients", assignedClients.join(", ") || "Assigned at the site level")}
              ${renderDetailBox("Assigned sites", assignedSites.join(", ") || "Assigned at the client level")}
            </div>
            <div class="onboarding-helper" style="margin-top: 18px;">
              <strong>What happens next</strong>
              <p>Accepting this invite creates or links your Portaly login, then routes you straight to Approvals for the assigned client and site.</p>
            </div>
          </div>
          <div class="stack-md onboarding-side">
            ${setupCard}
            <div class="support-card onboarding-support-card">
              <p class="eyebrow">Access Scope</p>
              <h3>Limited to your assigned client and site</h3>
              <ul class="list">
                <li>Approve or reject submitted timecards</li>
                <li>Correct missed punches with a required reason</li>
                <li>Capture manager signature and notes</li>
                <li>No billing, settings, margin, or full agency dashboard access</li>
              </ul>
            </div>
            <div class="support-card onboarding-support-card">
              <p class="eyebrow">Need help?</p>
              <h3>Contact your staffing agency</h3>
              <p>If you received this link in error or need a fresh invite, contact the staffing agency support contact below.</p>
              <ul class="list">
                <li>${escapeHtml(getSupportEmail())}</li>
                <li>${escapeHtml(getSupportPhone())}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function renderForgotPasswordPage() {
    return `
      <main class="auth-shell">
        <div class="container auth-grid">
          <div class="auth-card">
            <p class="eyebrow">Forgot Password</p>
            <h3>Send a reset link</h3>
            <p>Enter the email tied to the account. Portaly will ask Firebase Authentication to send a password reset email.</p>
            <form class="form-grid" data-form="forgot-password">
              <div class="field-group">
                <label for="forgot-email">Email</label>
                <input id="forgot-email" name="email" type="email" placeholder="name@agency.com" />
              </div>
              <div class="page-actions">
                <button class="button button-primary button-block" type="submit">Send Reset Email</button>
              </div>
            </form>
            <div class="auth-link-row">
              <button class="button button-ghost" data-action="go-route" data-route="login" type="button">Back to Login</button>
            </div>
          </div>
          <div class="support-card">
            <p class="eyebrow">Need help?</p>
            <h3>Reach your agency or support team</h3>
            <p>If the reset email does not arrive, confirm the account exists first or contact support.</p>
          </div>
        </div>
      </main>
    `;
  }

  function renderTrialPage() {
    const cloudConfigured = hasConfiguredFirebaseCloudMode();
    const configReady = !!state.firebase.ready;
    const localPreviewWarning = isLocalFilePreview()
      ? `
        <div class="notice-card warning" style="margin: 18px 0;">
          <div>
            <strong>Use the published GitHub Pages URL when testing real signup.</strong>
            <p>Firebase Authentication can be limited from raw <code>file://</code> previews. Demo Mode still works locally.</p>
          </div>
        </div>
      `
      : "";
    return `
      <main class="auth-shell">
        <div class="container auth-grid">
          <div class="auth-card">
            <p class="eyebrow">Start Free Trial</p>
            <h3>Create your agency account</h3>
            <p>Start a real ${Number((state.firebase.config && state.firebase.config.trialDays) || 14)}-day free trial. We create the agency record, owner profile, and trial status automatically.</p>
            ${localPreviewWarning}
            ${cloudConfigured
              ? (configReady ? "" : `
                <div class="notice-card warning" style="margin: 18px 0;">
                  <div>
                    <strong>Cloud Mode is still connecting.</strong>
                    <p>${escapeHtml(state.firebase.error || "Portaly is still waiting for Firebase to finish loading.")}</p>
                  </div>
                </div>
              `)
              : renderFirebaseSetupNotice({
                margin: "18px 0",
                body: "Portaly can still run from GitHub Pages without a custom domain. Add your Firebase web config and make sure https://zaspdragon.github.io and localhost are listed in Firebase Authentication authorized domains before using real agency sign-up."
              })}
            <form class="form-grid" data-form="trial">
              <div class="field-group">
                <label for="trial-agency-name">Agency name</label>
                <input id="trial-agency-name" name="agencyName" type="text" placeholder="Harbor Staffing Group" />
              </div>
              <div class="form-row two">
                <div class="field-group">
                  <label for="trial-owner-first">Owner first name</label>
                  <input id="trial-owner-first" name="ownerFirstName" type="text" placeholder="Jamie" />
                </div>
                <div class="field-group">
                  <label for="trial-owner-last">Owner last name</label>
                  <input id="trial-owner-last" name="ownerLastName" type="text" placeholder="Waters" />
                </div>
              </div>
              <div class="form-row two">
                <div class="field-group">
                  <label for="trial-email">Email</label>
                  <input id="trial-email" name="email" type="email" placeholder="owner@agency.com" />
                </div>
                <div class="field-group">
                  <label for="trial-phone">Phone</label>
                  <input id="trial-phone" name="phone" type="text" placeholder="(555) 555-0123" />
                </div>
              </div>
              <div class="form-row two">
                <div class="field-group">
                  <label for="trial-password">Password</label>
                  <input id="trial-password" name="password" type="password" placeholder="Create a password" />
                </div>
                <div class="field-group">
                  <label for="trial-confirm">Confirm password</label>
                  <input id="trial-confirm" name="confirmPassword" type="password" placeholder="Confirm password" />
                </div>
              </div>
              <div class="field-group">
                <label for="trial-plan">Selected plan</label>
                <select id="trial-plan" name="selectedPlan">
                  <option value="starter">Starter - $99/month</option>
                  <option value="agency" selected>Agency - $249/month</option>
                  <option value="growth">Growth - $499/month</option>
                  <option value="enterprise">Enterprise - Custom</option>
                </select>
              </div>
              <label class="checkbox-row">
                <input type="checkbox" name="loadSampleData" />
                <span>Load sample clients, sites, workers, timesheets, and punches into the new agency.</span>
              </label>
              <div class="page-actions">
                <button class="button button-primary button-block" type="submit" ${cloudConfigured ? "" : "disabled"}>Start Free Trial</button>
              </div>
            </form>
          </div>
          <div class="stack-md">
            <div class="support-card">
              <p class="eyebrow">What happens next</p>
              <h3>Real account setup</h3>
              <ul class="list">
                <li>Create your secure login</li>
                <li>Create your agency workspace</li>
                <li>Start your 14-day free trial</li>
                <li>Open your owner dashboard</li>
                <li>Stay empty unless you choose sample data</li>
              </ul>
            </div>
            <div class="support-card">
              <p class="eyebrow">Billing</p>
              <h3>Square billing starts after the trial</h3>
              <p>Portaly uses secure Square payment links for subscription checkout. The frontend does not store payment secrets.</p>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function renderCompleteProfilePage() {
    const authUser = state.authUser || state.firebase.auth?.currentUser || null;
    const draft = state.profileRepair?.prefill || {};
    const accountEmail = authUser?.email || state.profileRepair?.email || "";
    const selectedPlan = draft.selectedPlan || window.localStorage.getItem("portaly_selected_plan") || "agency";
    return `
      <main class="auth-shell">
        <div class="container auth-grid onboarding-auth-grid">
          <div class="auth-card onboarding-card">
            <div class="onboarding-stepbar">
              <span class="mode-badge">Step 2 of 2: Workspace Setup</span>
              <div class="onboarding-badges">
                <span class="onboarding-pill">14-day free trial</span>
                <span class="onboarding-pill">Secure login created</span>
                <span class="onboarding-pill">No manual setup required</span>
                <span class="onboarding-pill">Square billing ready</span>
              </div>
            </div>
            <p class="eyebrow">Complete setup</p>
            <h3>Finish Setting Up Your Portaly Workspace</h3>
            <p>Your login was created successfully. Now let's create your agency workspace.</p>
            <div class="onboarding-helper">
              <strong>Workspace setup</strong>
              <p>This creates your agency dashboard, trial subscription, and owner profile.</p>
            </div>
            <form class="form-grid onboarding-form" data-form="complete-profile">
              <div class="field-group">
                <label for="complete-agency-name">Agency name</label>
                <input id="complete-agency-name" name="agencyName" type="text" placeholder="Harbor Staffing Group" value="${escapeAttribute(draft.agencyName || "")}" />
              </div>
              <div class="form-row two">
                <div class="field-group">
                  <label for="complete-owner-first">Owner first name</label>
                  <input id="complete-owner-first" name="ownerFirstName" type="text" placeholder="Jamie" value="${escapeAttribute(draft.ownerFirstName || "")}" />
                </div>
                <div class="field-group">
                  <label for="complete-owner-last">Owner last name</label>
                  <input id="complete-owner-last" name="ownerLastName" type="text" placeholder="Waters" value="${escapeAttribute(draft.ownerLastName || "")}" />
                </div>
              </div>
              <div class="form-row two">
                <div class="field-group">
                  <label for="complete-email">Email</label>
                  <input id="complete-email" name="email" type="email" value="${escapeAttribute(accountEmail)}" readonly />
                </div>
                <div class="field-group">
                  <label for="complete-phone">Phone number</label>
                  <input id="complete-phone" name="phone" type="text" placeholder="(555) 555-0123" value="${escapeAttribute(draft.phone || "")}" />
                </div>
              </div>
              <div class="field-group">
                <label for="complete-plan">Selected plan</label>
                <select id="complete-plan" name="selectedPlan">
                  <option value="starter" ${selectedPlan === "starter" ? "selected" : ""}>Starter - $99/month</option>
                  <option value="agency" ${selectedPlan === "agency" ? "selected" : ""}>Agency - $249/month</option>
                  <option value="growth" ${selectedPlan === "growth" ? "selected" : ""}>Growth - $499/month</option>
                  <option value="enterprise" ${selectedPlan === "enterprise" ? "selected" : ""}>Enterprise - Custom</option>
                </select>
              </div>
              <label class="checkbox-row">
                <input type="checkbox" name="loadSampleData" />
                <span>Load sample data into this new agency workspace.</span>
              </label>
              <div class="page-actions">
                <button class="button button-primary button-block button-large" type="submit">Create My Workspace</button>
              </div>
            </form>
          </div>
          <div class="stack-md onboarding-side">
            <div class="support-card onboarding-support-card">
              <p class="eyebrow">What happens next</p>
              <h3>Create workspace and continue</h3>
              <ul class="list">
                <li>Create your agency workspace</li>
                <li>Start your 14-day free trial</li>
                <li>Open your owner dashboard</li>
                <li>Invite your team when you're ready</li>
              </ul>
            </div>
            <div class="support-card onboarding-support-card">
              <p class="eyebrow">Built for agencies</p>
              <h3>Ready for staffing operations from day one</h3>
              <p>Portaly sets up your agency dashboard, worker punch tools, approval flow, payroll view, and Square-ready billing foundation in one step.</p>
            </div>
            <div class="support-card onboarding-support-card">
              <p class="eyebrow">Need a different login?</p>
              <h3>Sign out and switch accounts</h3>
              <p>If this is not the right account, you can sign out and return to login or start a different free trial.</p>
              <div class="page-actions" style="margin-top: 16px;">
                <button class="button button-secondary" data-action="logout" type="button">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function renderTrialSuccessPage() {
    const ownerClockRoute = getOwnerClockRoute();
    return `
      <main class="auth-shell">
        <div class="container">
          <div class="auth-card" style="max-width: 760px; margin: 0 auto;">
            <p class="eyebrow">Trial Started</p>
            <h3>Your agency workspace is ready</h3>
            <p>You now have ${Math.max(getTrialDaysRemaining(), 0)} days left in your free trial. Your staffing agency is preloaded on the worker clock page so you can verify the public punch flow right away.</p>
            <div class="page-actions" style="margin-top: 20px;">
              <button class="button button-primary" data-action="go-route" data-route="${escapeHtml(ownerClockRoute)}" type="button">Open Worker Clock</button>
              <button class="button button-secondary" data-action="go-route" data-route="${escapeHtml(getHomeRoute())}" type="button">Continue to Dashboard</button>
              <button class="button button-secondary" data-action="go-route" data-route="billing" type="button">Open Billing</button>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function renderPublicBillingRequired() {
    return `
      <main class="auth-shell">
        <div class="container">
          <div class="auth-card" style="max-width: 760px; margin: 0 auto;">
            <p class="eyebrow">Billing Required</p>
            <h3>This agency needs to fix billing before work can continue</h3>
            <p>Owners and admins can still log in and open Billing or Settings. Payroll, workers, clients, sites, and punch management stay locked until the subscription is active again.</p>
            <div class="page-actions" style="margin-top: 20px;">
              <button class="button button-primary" data-action="go-route" data-route="login" type="button">Login</button>
              <button class="button button-ghost" data-action="go-route" data-route="pricing" type="button">View Pricing</button>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function renderTrialExpiredPage() {
    return `
      <main class="auth-shell">
        <div class="container">
          <div class="auth-card" style="max-width: 760px; margin: 0 auto;">
            <p class="eyebrow">Trial Expired</p>
            <h3>Your free trial has ended</h3>
            <p>You can still log in to review Billing and Settings, but worker management, approvals, payroll, margin, and punch operations stay locked until a paid subscription is active.</p>
            <div class="page-actions" style="margin-top: 20px;">
              <button class="button button-primary" data-action="go-route" data-route="login" type="button">Login</button>
              <button class="button button-secondary" data-action="go-route" data-route="pricing" type="button">View Pricing</button>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function renderMarketingFooter() {
    return `
      <footer class="marketing-footer">
        <div class="container marketing-footer-row">
          <div>
            <strong>${escapeHtml(getBrandName())}</strong>
            <p class="muted-text">Attendance tracking, client approvals, assignment visibility, and payroll-ready exports for staffing agencies.</p>
            <div class="marketing-footer-links">
              <button class="marketing-link" data-action="privacy-placeholder" type="button">Privacy Policy</button>
              <button class="marketing-link" data-action="terms-placeholder" type="button">Terms of Service</button>
              <button class="marketing-link" data-action="open-support" type="button">Support</button>
            </div>
            <div class="marketing-trust-row">
              <span class="mode-badge">Secure billing through Square</span>
              <span class="mode-badge">Data export available</span>
            </div>
          </div>
          <div class="marketing-actions">
            <button class="button button-secondary" data-action="book-live-demo" type="button">Book Live Demo</button>
            <button class="button button-primary" data-action="go-route" data-route="trial" type="button">Start Free Trial</button>
          </div>
        </div>
      </footer>
    `;
  }

  function renderOwnerShell() {
    const pageTitle = getPageTitle();
    const displayedRole = getRoleLabel(state.session.role);
    return `
      <div class="app-root app-layout">
        <aside class="sidebar">
          <div class="sidebar-brand">
            <div class="brand-mark">${escapeHtml(getBrandInitials())}</div>
            <div>
              <p class="eyebrow">Staffing Agency Platform</p>
              <h1>${escapeHtml(getBrandName())}</h1>
              <p class="sidebar-copy">${escapeHtml(getCurrentAgency()?.name || "Portaly")}</p>
            </div>
          </div>
          <div class="sidebar-mode">
            <span class="mode-badge">${escapeHtml(getModeBadgeText())}</span>
            <p>${escapeHtml(getModeBadgeCopy())}</p>
          </div>
          <div class="sidebar-agency">
            <p class="eyebrow">Current role</p>
            <h2>${escapeHtml(displayedRole)}</h2>
            <p class="sidebar-note">${escapeHtml(getSubscriptionSummaryLine())}</p>
          </div>
          <nav class="nav" aria-label="Primary navigation">
            ${renderSidebarNav()}
          </nav>
          <div class="sidebar-footer">
            ${state.session.mode === "demo" ? `<button class="button button-secondary button-block" data-action="reset-demo" type="button">Reset Demo Data</button>` : ""}
            <button class="button button-ghost button-block" data-action="logout" type="button">Logout</button>
          </div>
        </aside>
        <div class="mobile-backdrop" data-action="close-nav"></div>
        <div class="app-main">
          <header class="topbar">
            <div class="topbar-title">
              <button class="menu-button" data-action="toggle-nav" type="button">Menu</button>
              <div>
                <p class="eyebrow">${escapeHtml(displayedRole)}</p>
                <h2>${escapeHtml(pageTitle)}</h2>
              </div>
            </div>
            <div class="topbar-actions">
              <span class="mode-badge">${escapeHtml(getModeBadgeText())}</span>
              ${renderTopbarButtons()}
            </div>
          </header>
          <main class="content-wrap stack-lg">
            ${renderNoticeBanner()}
            ${renderModeWarnings()}
            ${renderRouteView()}
          </main>
        </div>
      </div>
    `;
  }

  function renderWorkerShell() {
    return `
      <div class="worker-root worker-shell">
        <div class="worker-topbar">
          <div>
            <p class="eyebrow">${escapeHtml(getBrandName())}</p>
            <h2 class="page-heading">${escapeHtml(getCurrentAgency()?.name || getBrandName())}</h2>
          </div>
          <div class="topbar-actions">
            <span class="mode-badge">${escapeHtml(getModeBadgeText())}</span>
            ${state.session.mode === "demo" ? `<button class="button button-ghost" data-action="go-route" data-route="demo" type="button">Back to Access Hub</button>` : ""}
            <button class="button button-ghost" data-action="logout" type="button">Logout</button>
          </div>
        </div>
        ${renderNoticeBanner()}
        ${renderWorkerView()}
      </div>
    `;
  }

  function renderRouteView() {
    if (isBillingLocked() && !["billing", "settings"].includes(state.route)) {
      return renderLockedAgencyView();
    }

      switch (state.route) {
        case "dashboard":
          return renderDashboardPage();
        case "agencies":
          return renderAgenciesPage();
        case "workers":
          return renderWorkersPage();
      case "clients":
        return renderClientsPage();
      case "sites":
        return renderSitesPage();
      case "assignments":
        return renderAssignmentsPage();
      case "live-punches":
        return renderLivePunchesPage();
      case "approvals":
        return renderApprovalsPage();
      case "client-approval":
        return renderClientApprovalPage();
      case "payroll":
        return renderPayrollPage();
      case "margin":
        return renderMarginPage();
      case "exceptions":
        return renderExceptionsPage();
      case "qr-codes":
        return renderQrCodesPage();
      case "users":
        return renderUsersPage();
      case "billing":
        return renderBillingPage();
      case "settings":
        return renderSettingsPage();
      case "billing-required":
        return renderLockedAgencyView();
      default:
        return renderDashboardPage();
    }
  }

  function renderWorkerView() {
    if (isBillingLocked()) {
      return `
        <div class="worker-layout">
          <div class="worker-card primary">
            <p class="eyebrow">Billing Required</p>
            <h2>Punching is locked right now</h2>
            <p class="section-copy">Your agency needs to fix billing before worker punches can continue. Please contact your staffing agency.</p>
          </div>
          <div class="support-card">
            <p class="eyebrow">Need help?</p>
            <h3>Contact your agency</h3>
            <p>If your punch is wrong or the screen is locked, contact your supervisor or staffing agency.</p>
            <ul class="list">
              <li>${escapeHtml(getSupportEmail())}</li>
              <li>${escapeHtml(getSupportPhone())}</li>
            </ul>
          </div>
        </div>
      `;
    }

    switch (state.route) {
      case "my-history":
        return renderWorkerHistoryPage();
      case "help":
        return renderWorkerHelpPage();
      case "billing-required":
        return renderWorkerHelpPage();
      case "worker-punch":
      default:
        return renderWorkerPunchPage();
    }
  }

  function renderDashboardPage() {
    if (state.session.role === "platformOwner") {
      return renderPlatformDashboard();
    }

    const scoped = getScopedData();
    const metrics = buildAgencyDashboardMetrics(scoped);
    const attentionItems = buildAttentionItems(scoped).slice(0, 6);
    const usage = getUsageStats(scoped, state.session.agencyId);
    const plan = getPlanDefinition(getCurrentAgency()?.planId || "agency");
    const showOnboarding = shouldShowEmptyWorkspaceOnboarding(scoped);

    return `
      <section class="stack-lg">
        <div class="metrics-grid">
          ${renderMetricCard("Active Workers", metrics.activeWorkers, "Workers with active records", "AW")}
          ${renderMetricCard("Workers Clocked In Now", metrics.clockedInNow, "Workers currently active on shift", "CI")}
          ${renderMetricCard("Workers On Lunch", metrics.onLunch, "Workers currently on lunch", "LU")}
          ${renderMetricCard("Missing Clock Outs", metrics.missingClockOuts, "Workers with no clock out yet", "MC")}
          ${renderMetricCard("Punch Requests", metrics.pendingPunchRequests, "Workers asking for punch corrections", "PR")}
          ${renderMetricCard("Pending Client Approvals", metrics.pendingApprovals, "Timesheets waiting on approval", "AP")}
          ${renderMetricCard("Payroll Hours This Week", formatHours(metrics.payrollHours), "Approved and submitted time this week", "PY")}
          ${renderMetricCard("Estimated Gross Margin", formatCurrency(metrics.grossProfit), `${formatPercent(metrics.marginPercent)} average margin`, "GM")}
          ${renderMetricCard("Active Clients", metrics.activeClients, "Clients with active records", "CL")}
          ${renderMetricCard("Active Sites", metrics.activeSites, "Sites currently in service", "SI")}
          ${renderMetricCard("Subscription Status", formatStatusLabel(metrics.subscriptionStatus), `${escapeHtml(plan.label)} plan`, "SS")}
        </div>

        ${showOnboarding ? renderEmptyWorkspaceOnboarding() : ""}

        <div class="split-grid">
          <div class="surface-card">
            <div class="card-top">
              <div>
                <p class="eyebrow">Today's Attention Needed</p>
                <h2 class="page-heading">Problems to fix before payroll gets messy</h2>
              </div>
              <button class="button button-ghost" data-action="go-route" data-route="exceptions" type="button">Open Exceptions</button>
            </div>
            ${attentionItems.length ? `
              <ul class="attention-list" style="margin-top: 18px;">
                ${attentionItems.map(item => `
                  <li class="attention-item">
                    <div>
                      <strong>${escapeHtml(item.title)}</strong>
                      <p class="inline-note">${escapeHtml(item.detail)}</p>
                    </div>
                    <span class="status-badge ${item.tone}">${escapeHtml(item.label)}</span>
                  </li>
                `).join("")}
              </ul>
            ` : renderEmptyState("Everything looks clean right now", "No urgent issues are blocking worker time, approvals, or payroll at the moment.")}
          </div>

          <div class="stack-md">
            <div class="summary-card">
              <p class="eyebrow">Quick Actions</p>
              <h3>Move the day forward</h3>
              <div class="page-actions" style="margin-top: 16px;">
                ${canManageWorkers() ? `<button class="button button-primary" data-action="open-worker-form" type="button">Add Worker</button>` : ""}
                ${canManageClients() ? `<button class="button button-secondary" data-action="open-client-form" type="button">Add Client</button>` : ""}
                ${canManageSites() ? `<button class="button button-secondary" data-action="open-site-form" type="button">Add Site</button>` : ""}
                ${canManageAssignments() ? `<button class="button button-secondary" data-action="open-assignment-form" type="button">Assign Worker</button>` : ""}
                ${canManageSites() ? `<button class="button button-secondary" data-action="open-publish-punch-page" type="button">Publish to Punch Page</button>` : ""}
                ${canManageSites() ? `<button class="button button-ghost" data-action="go-route" data-route="qr-codes" type="button">Generate QR</button>` : ""}
                ${canReviewPunchRequests() ? `<button class="button button-ghost" data-action="go-route" data-route="live-punches" type="button">Review Punch Requests</button>` : ""}
                ${canApproveRecord() ? `<button class="button button-ghost" data-action="go-route" data-route="approvals" type="button">Review Approvals</button>` : ""}
                ${canManagePunches() ? `<button class="button button-ghost" data-action="go-route" data-route="payroll" type="button">Export Payroll</button>` : ""}
                ${canManageBilling() ? `<button class="button button-ghost" data-action="go-route" data-route="billing" type="button">Manage Billing</button>` : ""}
                ${canDeleteSampleData() ? `<button class="button button-danger" data-action="delete-sample-data" type="button">Delete Sample Data</button>` : ""}
              </div>
            </div>

            <div class="summary-card">
              <p class="eyebrow">Plan Usage</p>
              <h3>${escapeHtml(plan.label)} plan</h3>
              <div class="stack-sm" style="margin-top: 16px;">
                ${renderUsageRow("Workers", usage.activeWorkers, plan.workerLimit)}
                ${renderUsageRow("Sites", usage.activeSites, plan.siteLimit)}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderPlatformDashboard() {
    const scoped = getScopedData();
    const agencies = scoped.agencies;
    const users = scoped.users;
    const activeTrials = agencies.filter(agency => agency.subscriptionStatus === "trialing").length;
    const pastDue = agencies.filter(agency => ["past_due", "unpaid", "expired_trial"].includes(agency.subscriptionStatus)).length;
    const activeWorkers = scoped.workers.filter(worker => worker.status === "active").length;
    const pendingApprovals = scoped.approvals.filter(approval => approval.status === "pending").length;
    const monthlyValue = agencies.reduce((total, agency) => total + (getPlanDefinition(agency.planId).price || 0), 0);

    return `
      <section class="stack-lg">
        <div class="metrics-grid">
          ${renderMetricCard("Agencies", agencies.length, "Total tenants in the system", "AG")}
          ${renderMetricCard("Trialing", activeTrials, "Agencies currently in trial", "TR")}
          ${renderMetricCard("Past Due", pastDue, "Accounts needing billing help", "PD")}
          ${renderMetricCard("Users", users.length, "Profiles across all roles", "US")}
          ${renderMetricCard("Workers", activeWorkers, "Active worker records", "WK")}
          ${renderMetricCard("Pending Approvals", pendingApprovals, "Approvals still waiting", "AP")}
          ${renderMetricCard("Plan MRR", formatCurrency(monthlyValue), "Monthly plan value across agencies", "MR")}
          ${renderMetricCard("Payroll Runs", scoped.payrollRuns.length, "Recorded weekly payroll exports", "PR")}
        </div>
        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Agency Rollup</p>
              <h2 class="page-heading">Subscription and plan status</h2>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agency</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Trial End</th>
                  <th>Owner</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                ${agencies.map(agency => {
                  const owner = users.find(user => user.id === agency.ownerUserId);
                  return `
                    <tr>
                      <td>${escapeHtml(agency.name)}</td>
                      <td>${escapeHtml(getPlanDefinition(agency.planId).label)}</td>
                      <td>${renderInlineStatus(agency.subscriptionStatus)}</td>
                      <td>${escapeHtml(formatDate(agency.trialEnd))}</td>
                      <td>${escapeHtml(owner ? fullName(owner) : "Unknown")}</td>
                      <td>${escapeHtml(formatDateTime(agency.updatedAt))}</td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  function normalizeWorkerNoteType(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["best", "best-to-work-with", "standout", "joy", "great"].includes(normalized)) {
      return "best";
    }
    if (["terminated", "fired", "do-not-return", "ended"].includes(normalized)) {
      return "terminated";
    }
    if (normalized) {
      return "general";
    }
    return "";
  }

  function getWorkerNoteLabel(value) {
    const type = normalizeWorkerNoteType(value);
    switch (type) {
      case "best":
        return "Best To Work With";
      case "terminated":
        return "Ended / Fired";
      case "general":
        return "General Note";
      default:
        return "";
    }
  }

  function getWorkerNoteTone(value) {
    const type = normalizeWorkerNoteType(value);
    switch (type) {
      case "best":
        return "status-approved";
      case "terminated":
        return "status-danger";
      default:
        return "status-warning";
    }
  }

  function summarizeText(value, maxLength = 120) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
  }

  function getWorkerPrimaryNote(worker) {
    if (!worker) {
      return "";
    }
    const type = normalizeWorkerNoteType(worker.workerNoteType);
    const managerNote = String(worker.notes || "").trim();
    const terminationReason = String(worker.terminationReason || "").trim();
    if (type === "terminated") {
      return terminationReason || managerNote || "Marked as not eligible to return.";
    }
    return managerNote || terminationReason;
  }

  function renderWorkerNoteBadge(value) {
    const label = getWorkerNoteLabel(value);
    if (!label) {
      return "";
    }
    return `<span class="status-badge ${getWorkerNoteTone(value)}">${escapeHtml(label)}</span>`;
  }

  function getWorkerHoursByCompany(workerId, scoped = getScopedData()) {
    const rows = (scoped.timesheets || []).filter(timesheet => timesheet.workerId === workerId);
    const map = new Map();

    rows.forEach(timesheet => {
      const clientId = timesheet.clientId || "unassigned";
      const clientName = timesheet.clientName || getClientName(timesheet.clientId) || "Company";
      const trackedHours = Number(timesheet.approvedHours || (Number(timesheet.regularHours || 0) + Number(timesheet.overtimeHours || 0)) || 0);
      const regularHours = Number(timesheet.regularHours || 0);
      const overtimeHours = Number(timesheet.overtimeHours || 0);
      const current = map.get(clientId) || {
        clientId,
        clientName: clientName === "Unknown Client" ? "Company" : clientName,
        trackedHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        latestPayPeriodEnd: "",
        latestStatus: ""
      };

      current.clientName = current.clientName || clientName;
      current.trackedHours += trackedHours;
      current.regularHours += regularHours;
      current.overtimeHours += overtimeHours;
      current.latestStatus = timesheet.status || current.latestStatus || "";

      if (!current.latestPayPeriodEnd || compareDates(timesheet.payPeriodEnd || timesheet.updatedAt || timesheet.createdAt || "", current.latestPayPeriodEnd) > 0) {
        current.latestPayPeriodEnd = timesheet.payPeriodEnd || timesheet.updatedAt || timesheet.createdAt || "";
      }

      map.set(clientId, current);
    });

    return Array.from(map.values()).sort((left, right) => {
      if (right.trackedHours !== left.trackedHours) {
        return right.trackedHours - left.trackedHours;
      }
      return left.clientName.localeCompare(right.clientName);
    });
  }

  function getWorkerOverallTrackedHours(workerId, scoped = getScopedData()) {
    return sumNumbers(getWorkerHoursByCompany(workerId, scoped).map(row => row.trackedHours));
  }

  function renderWorkerHoursSummaryCard(workerId, options = {}) {
    const scoped = options.scoped || getScopedData();
    const rows = getWorkerHoursByCompany(workerId, scoped);
    const totalHours = sumNumbers(rows.map(row => row.trackedHours));
    const cardClass = options.cardClass || "worker-card";
    const eyebrow = options.eyebrow || "Hours Worked";
    const title = options.title || "Hours by company";
    const copy = options.copy || "Track your processed hours across every company you have worked for.";

    return `
      <div class="${cardClass}">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p class="helper-copy">${escapeHtml(copy)}</p>
        ${rows.length ? `
          <div class="hours-summary-list" style="margin-top: 16px;">
            ${rows.map(row => `
              <div class="hours-summary-row">
                <div>
                  <strong>${escapeHtml(row.clientName)}</strong>
                  <p class="helper-copy">${escapeHtml(formatHours(row.trackedHours))} total · ${escapeHtml(formatHours(row.overtimeHours))} OT${row.latestPayPeriodEnd ? ` · Latest period ${escapeHtml(formatDate(row.latestPayPeriodEnd))}` : ""}</p>
                </div>
                <span class="hours-summary-total">${escapeHtml(formatHours(row.trackedHours))}</span>
              </div>
            `).join("")}
          </div>
          <div class="info-row" style="margin-top: 14px;">
            <strong>Overall hours</strong>
            <span class="helper-copy">${escapeHtml(formatHours(totalHours))}</span>
          </div>
        ` : `<p class="helper-copy" style="margin-top: 14px;">Tracked hours will show here after time has been approved or processed.</p>`}
      </div>
    `;
  }

  function renderWorkerNotesSection(scoped) {
    const workersWithNotes = scoped.workers
      .filter(worker => getWorkerPrimaryNote(worker))
      .sort((left, right) => {
        const leftType = normalizeWorkerNoteType(left.workerNoteType);
        const rightType = normalizeWorkerNoteType(right.workerNoteType);
        if (leftType === rightType) {
          return fullName(left).localeCompare(fullName(right));
        }
        if (leftType === "terminated") {
          return -1;
        }
        if (rightType === "terminated") {
          return 1;
        }
        if (leftType === "best") {
          return -1;
        }
        if (rightType === "best") {
          return 1;
        }
        return fullName(left).localeCompare(fullName(right));
      });

    return `
      <div class="support-card">
        <p class="eyebrow">Worker Notes</p>
        <h3>Standout temps and separation reasons</h3>
        <p class="helper-copy">Keep quick notes on who was great to work with and why someone should not be returned to a site.</p>
        ${workersWithNotes.length ? `
          <div class="worker-note-list" style="margin-top: 16px;">
            ${workersWithNotes.map(worker => `
              <div class="worker-note-card">
                <div class="info-row">
                  <strong>${escapeHtml(fullName(worker))}</strong>
                  ${renderWorkerNoteBadge(worker.workerNoteType)}
                </div>
                <p class="helper-copy">${escapeHtml(getWorkerPrimaryNote(worker))}</p>
                <p class="inline-note">${escapeHtml(getClientName(worker.assignedClientId))} · ${escapeHtml(getSiteName(worker.assignedSiteId))} · ${escapeHtml(formatHours(getWorkerOverallTrackedHours(worker.id, scoped)))} overall</p>
              </div>
            `).join("")}
          </div>
        ` : `<p class="helper-copy" style="margin-top: 14px;">No standout or separation notes have been added yet.</p>`}
      </div>
    `;
  }

  function renderWorkersPage() {
    const scoped = getScopedData();
    const workers = scoped.workers.slice().sort((left, right) => fullName(left).localeCompare(fullName(right)));
    const timesheets = scoped.timesheets;

    return `
      <section class="stack-lg">
        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Workers</p>
              <h2 class="page-heading">Worker management</h2>
            </div>
            <div class="page-actions">
              ${canManageWorkers() ? `<button class="button button-primary" data-action="open-worker-form" type="button">Add Worker</button>` : ""}
            </div>
          </div>
          ${workers.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Status</th>
                    <th>Client</th>
                    <th>Site</th>
                    <th>Pay Rate</th>
                    <th>Last Punch</th>
                    <th>Total Hours This Week</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${workers.map(worker => {
                    const punchState = getWorkerPunchState(worker.id, scoped);
                    const lastPunch = getWorkerLatestPunch(worker.id, scoped.punches);
                    const weekHours = timesheets.filter(timesheet => timesheet.workerId === worker.id).reduce((sum, timesheet) => sum + Number(timesheet.approvedHours || 0), 0);
                    const notePreview = summarizeText(getWorkerPrimaryNote(worker), 92);
                    return `
                      <tr>
                        <td>
                          <strong>${escapeHtml(fullName(worker))}</strong>
                          <div class="inline-note">${escapeHtml(worker.phone || worker.email || "No contact info")}</div>
                          ${notePreview ? `<div class="worker-note-inline">${renderWorkerNoteBadge(worker.workerNoteType)}<span>${escapeHtml(notePreview)}</span></div>` : ""}
                        </td>
                        <td>${renderInlineStatus(punchState.label)}</td>
                        <td>${escapeHtml(getClientName(worker.assignedClientId))}</td>
                        <td>${escapeHtml(getSiteName(worker.assignedSiteId))}</td>
                        <td>${escapeHtml(formatCurrency(worker.payRate))}</td>
                        <td>${escapeHtml(lastPunch ? formatDateTime(lastPunch.timestamp) : "No punch today")}</td>
                        <td>${escapeHtml(formatHours(weekHours))}</td>
                        <td>
                          <div class="table-actions">
                            <button class="button button-ghost" data-action="view-worker" data-worker-id="${escapeHtml(worker.id)}" type="button">View</button>
                            <button class="button button-ghost" data-action="open-worker-form" data-worker-id="${escapeHtml(worker.id)}" type="button">Edit</button>
                            <button class="button button-ghost" data-action="worker-history" data-worker-id="${escapeHtml(worker.id)}" type="button">Punch History</button>
                            ${canDeactivateEntity("workers") ? `<button class="button button-ghost" data-action="deactivate-worker" data-worker-id="${escapeHtml(worker.id)}" type="button">Deactivate</button>` : ""}
                            ${canPermanentlyDeleteRecords() ? `<button class="button button-danger" data-action="delete-worker" data-worker-id="${escapeHtml(worker.id)}" type="button">Delete</button>` : ""}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No workers yet", "Add your first worker to start assignments, punch capture, and payroll tracking.")}
        </div>
        ${renderWorkerNotesSection(scoped)}
      </section>
    `;
  }

  function renderClientsPage() {
    const clients = getScopedData().clients;
    const pendingInviteCount = getClientInvites().filter(invite => invite.status === "pending").length;
    return `
      <section class="stack-lg">
        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Clients</p>
              <h2 class="page-heading">Client accounts</h2>
              ${pendingInviteCount ? `<p class="helper-copy">${escapeHtml(String(pendingInviteCount))} client manager invite${pendingInviteCount === 1 ? "" : "s"} pending right now.</p>` : ""}
            </div>
            <div class="page-actions">
              ${canInviteClientManagers() ? `<button class="button button-secondary" data-action="open-client-manager-invite" type="button">Invite Client Manager</button>` : ""}
              ${canManageClients() ? `<button class="button button-primary" data-action="open-client-form" type="button">Add Client</button>` : ""}
            </div>
          </div>
          ${clients.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Sites</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${clients.map(client => `
                    <tr>
                      <td>${escapeHtml(client.name)}</td>
                      <td>${escapeHtml(client.contactName || "-")}</td>
                      <td>${escapeHtml(client.contactEmail || "-")}</td>
                      <td>${escapeHtml(client.phone || "-")}</td>
                      <td>${renderInlineStatus(client.status)}</td>
                      <td>${escapeHtml(String(getScopedData().sites.filter(site => site.clientId === client.id).length))}</td>
                      <td>
                        <div class="table-actions">
                          <button class="button button-ghost" data-action="open-client-form" data-client-id="${escapeHtml(client.id)}" type="button">Edit</button>
                          <button class="button button-ghost" data-action="view-client-sites" data-client-id="${escapeHtml(client.id)}" type="button">View Details</button>
                          ${canInviteClientManagers() ? `<button class="button button-secondary" data-action="open-client-manager-invite" data-client-id="${escapeHtml(client.id)}" type="button">Invite Manager</button>` : ""}
                          ${canDeactivateEntity("clients") ? `<button class="button button-ghost" data-action="deactivate-client" data-client-id="${escapeHtml(client.id)}" type="button">Deactivate</button>` : ""}
                          ${canPermanentlyDeleteRecords() ? `<button class="button button-danger" data-action="delete-client" data-client-id="${escapeHtml(client.id)}" type="button">Delete</button>` : ""}
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No clients yet", "Add client companies here so workers, sites, approvals, and payroll can tie back cleanly.")}
        </div>
      </section>
    `;
  }

  function renderSitesPage() {
    const scoped = getScopedData();
    const sites = scoped.sites;
    return `
      <section class="stack-lg">
        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Sites</p>
              <h2 class="page-heading">Client sites and locations</h2>
            </div>
            ${canManageSites() ? `<button class="button button-primary" data-action="open-site-form" type="button">Add Site</button>` : ""}
          </div>
          ${sites.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Client</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Workers</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${sites.map(site => `
                    <tr>
                      <td>${escapeHtml(site.name)}</td>
                      <td>${escapeHtml(getClientName(site.clientId))}</td>
                      <td>${escapeHtml(buildSiteAddress(site))}</td>
                      <td>${renderInlineStatus(site.status)}</td>
                      <td>${escapeHtml(String(scoped.workers.filter(worker => worker.assignedSiteId === site.id).length))}</td>
                      <td>
                        <div class="table-actions">
                          <button class="button button-ghost" data-action="open-site-form" data-site-id="${escapeHtml(site.id)}" type="button">Edit</button>
                          <button class="button button-ghost" data-action="open-site-qr" data-site-id="${escapeHtml(site.id)}" type="button">Generate Site QR</button>
                          ${canDeactivateEntity("sites") ? `<button class="button button-ghost" data-action="deactivate-site" data-site-id="${escapeHtml(site.id)}" type="button">Deactivate</button>` : ""}
                          ${canPermanentlyDeleteRecords() ? `<button class="button button-danger" data-action="delete-site" data-site-id="${escapeHtml(site.id)}" type="button">Delete</button>` : ""}
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No sites yet", "Add your first site so workers can be assigned to a location and client managers can approve time by site.")}
        </div>
      </section>
    `;
  }

  function renderAssignmentsPage() {
    const scoped = getScopedData();
    const assignments = scoped.assignments;
    return `
      <section class="stack-lg">
        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Assignments</p>
              <h2 class="page-heading">Pay rate, bill rate, and spread</h2>
            </div>
            ${canManageAssignments() ? `<button class="button button-primary" data-action="open-assignment-form" type="button">Add Assignment</button>` : ""}
          </div>
          ${assignments.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Client</th>
                    <th>Site</th>
                    <th>Pay Rate</th>
                    <th>Bill Rate</th>
                    <th>Spread</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${assignments.map(assignment => `
                    <tr>
                      <td>${escapeHtml(getWorkerName(assignment.workerId))}</td>
                      <td>${escapeHtml(getClientName(assignment.clientId))}</td>
                      <td>${escapeHtml(getSiteName(assignment.siteId))}</td>
                      <td>${escapeHtml(formatCurrency(assignment.payRate))}</td>
                      <td>${escapeHtml(formatCurrency(assignment.billRate))}</td>
                      <td>${escapeHtml(formatCurrency(Number(assignment.billRate || 0) - Number(assignment.payRate || 0)))}</td>
                      <td>${renderInlineStatus(assignment.status)}</td>
                      <td>
                        <div class="table-actions">
                          <button class="button button-ghost" data-action="open-assignment-form" data-assignment-id="${escapeHtml(assignment.id)}" type="button">Edit</button>
                          <button class="button button-ghost" data-action="end-assignment" data-assignment-id="${escapeHtml(assignment.id)}" type="button">End Assignment</button>
                          ${canDeleteAssignment() ? `<button class="button button-danger" data-action="delete-assignment" data-assignment-id="${escapeHtml(assignment.id)}" type="button">Delete</button>` : ""}
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No assignments yet", "Assignments connect the worker, client, site, pay rate, and bill rate.")}
        </div>
      </section>
    `;
  }

  function renderLivePunchesPage() {
    const scoped = getScopedData();
    const workerOptions = new Map();
    (scoped.workers || []).forEach(worker => {
      workerOptions.set(worker.id, {
        value: worker.id,
        label: fullName(worker)
      });
    });
    (scoped.punches || []).forEach(punch => {
      if (!punch?.workerId && punch?.workerName) {
        workerOptions.set(`manual::${String(punch.workerName).trim().toLowerCase()}`, {
          value: `manual::${String(punch.workerName).trim().toLowerCase()}`,
          label: `${String(punch.workerName).trim()} (manual)`
        });
      }
    });
    const requestRows = (scoped.punchRequests || [])
      .slice()
      .sort((left, right) => compareDates(right.createdAt || right.requestedTimestamp, left.createdAt || left.requestedTimestamp));

    const rows = buildLivePunchRows(scoped).filter(row => {
      if (state.filters.liveStatus === "missing-clock-out" && row.exception !== "Missing clock out") {
        return false;
      }
      if (state.filters.liveStatus !== "all" && state.filters.liveStatus !== "missing-clock-out" && row.baseStatusKey !== state.filters.liveStatus) {
        return false;
      }
      if (state.filters.liveClient !== "all" && row.clientId !== state.filters.liveClient) {
        return false;
      }
      if (state.filters.liveSite !== "all" && row.siteId !== state.filters.liveSite) {
        return false;
      }
      if (state.filters.liveWorker !== "all" && !String(state.filters.liveWorker || "").startsWith("manual::") && row.workerId !== state.filters.liveWorker) {
        return false;
      }
      return true;
    });

    const punchRows = (scoped.punches || [])
      .slice()
      .sort((left, right) => compareDates(right.timestamp || right.createdAt, left.timestamp || left.createdAt))
      .filter(punch => {
        if (state.filters.liveClient !== "all" && (punch.companyId || punch.clientId) !== state.filters.liveClient) {
          return false;
        }
        if (state.filters.liveSite !== "all" && punch.siteId !== state.filters.liveSite) {
          return false;
        }
        if (state.filters.liveWorker !== "all") {
          if (String(state.filters.liveWorker || "").startsWith("manual::")) {
            const manualValue = `manual::${String(punch.workerName || "").trim().toLowerCase()}`;
            if (manualValue !== state.filters.liveWorker) {
              return false;
            }
          } else if ((punch.workerId || "") !== state.filters.liveWorker) {
            return false;
          }
        }
        if (state.filters.liveAction !== "all" && punch.action !== state.filters.liveAction) {
          return false;
        }
        if (state.filters.liveDateFrom) {
          const punchDate = formatDateInput(punch.localDate || punch.timestamp || punch.createdAt || "");
          if (punchDate && punchDate < state.filters.liveDateFrom) {
            return false;
          }
        }
        if (state.filters.liveDateTo) {
          const punchDate = formatDateInput(punch.localDate || punch.timestamp || punch.createdAt || "");
          if (punchDate && punchDate > state.filters.liveDateTo) {
            return false;
          }
        }
        return true;
      });

    return `
      <section class="stack-lg">
        <div class="filter-card">
          <div class="table-top">
            <div>
              <p class="eyebrow">Live Punches</p>
              <h2 class="page-heading">${state.session.role === "clientManager" ? "Punches and requests for your assigned sites" : "Today's punch activity"}</h2>
            </div>
            ${canManagePunches() ? `<button class="button button-primary" data-action="open-punch-form" type="button">Add Manual Punch</button>` : ""}
          </div>
          <div class="filter-group">
            <div class="field-group" style="min-width: 200px;">
              <label for="live-status">Status</label>
              <select id="live-status" name="liveStatus">
                <option value="all">All</option>
                <option value="clocked-in" ${state.filters.liveStatus === "clocked-in" ? "selected" : ""}>Clocked In</option>
                <option value="on-lunch" ${state.filters.liveStatus === "on-lunch" ? "selected" : ""}>On Lunch</option>
                <option value="missing-clock-out" ${state.filters.liveStatus === "missing-clock-out" ? "selected" : ""}>Missing Clock Out</option>
                <option value="clocked-out" ${state.filters.liveStatus === "clocked-out" ? "selected" : ""}>Clocked Out</option>
              </select>
            </div>
            <div class="field-group" style="min-width: 200px;">
              <label for="live-client">Company</label>
              <select id="live-client" name="liveClient">
                <option value="all">All companies</option>
                ${scoped.clients.map(client => `<option value="${escapeHtml(client.id)}" ${state.filters.liveClient === client.id ? "selected" : ""}>${escapeHtml(client.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field-group" style="min-width: 200px;">
              <label for="live-site">Site</label>
              <select id="live-site" name="liveSite">
                <option value="all">All sites</option>
                ${scoped.sites.map(site => `<option value="${escapeHtml(site.id)}" ${state.filters.liveSite === site.id ? "selected" : ""}>${escapeHtml(site.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field-group" style="min-width: 220px;">
              <label for="live-worker">Worker</label>
              <select id="live-worker" name="liveWorker">
                <option value="all">All workers</option>
                ${Array.from(workerOptions.values()).map(worker => `<option value="${escapeHtml(worker.value)}" ${state.filters.liveWorker === worker.value ? "selected" : ""}>${escapeHtml(worker.label)}</option>`).join("")}
              </select>
            </div>
            <div class="field-group" style="min-width: 200px;">
              <label for="live-action">Action</label>
              <select id="live-action" name="liveAction">
                <option value="all">All actions</option>
                ${Object.keys(PUNCH_LABELS).map(action => `<option value="${escapeHtml(action)}" ${state.filters.liveAction === action ? "selected" : ""}>${escapeHtml(PUNCH_LABELS[action])}</option>`).join("")}
              </select>
            </div>
            <div class="field-group" style="min-width: 180px;">
              <label for="live-date-from">From date</label>
              <input id="live-date-from" name="liveDateFrom" type="date" value="${escapeAttribute(state.filters.liveDateFrom || "")}" />
            </div>
            <div class="field-group" style="min-width: 180px;">
              <label for="live-date-to">To date</label>
              <input id="live-date-to" name="liveDateTo" type="date" value="${escapeAttribute(state.filters.liveDateTo || "")}" />
            </div>
          </div>
        </div>

        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Punch Requests</p>
              <h3>Worker requests waiting for a decision</h3>
            </div>
          </div>
          ${requestRows.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Company</th>
                    <th>Site</th>
                    <th>Requested Punch</th>
                    <th>Requested Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${requestRows.map(request => `
                    <tr>
                      <td>${escapeHtml(request.workerName || "Worker")}</td>
                      <td>${escapeHtml(request.companyName || request.clientName || getClientName(request.clientId || request.companyId))}</td>
                      <td>${escapeHtml(request.siteName || getSiteName(request.siteId))}</td>
                      <td>${escapeHtml(PUNCH_LABELS[request.requestedAction] || formatStatusLabel(request.requestedAction || ""))}</td>
                      <td>${escapeHtml(formatDateTime(request.requestedTimestamp || request.createdAt || ""))}</td>
                      <td>${escapeHtml(request.reason || "-")}</td>
                      <td>${renderInlineStatus(request.status || "pending")}</td>
                      <td>
                        <div class="table-actions">
                          ${request.status === "pending" && canReviewPunchRequests(request) ? `<button class="button button-primary" data-action="approve-punch-request" data-request-id="${escapeHtml(request.id)}" type="button">Approve</button>` : ""}
                          ${request.status === "pending" && canReviewPunchRequests(request) ? `<button class="button button-danger" data-action="reject-punch-request" data-request-id="${escapeHtml(request.id)}" type="button">Reject</button>` : ""}
                          ${request.resolvedPunchId ? `<button class="button button-ghost" data-action="open-punch-form" data-punch-id="${escapeHtml(request.resolvedPunchId)}" type="button">View Punch</button>` : ""}
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No punch requests are waiting", "If a worker says a punch did not go through, their request will show here for review.")}
        </div>

        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Worker Status</p>
              <h3>Current punch state by worker</h3>
            </div>
          </div>
          ${rows.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Client</th>
                    <th>Site</th>
                    <th>Last Action</th>
                    <th>Last Punch Time</th>
                    <th>Current Status</th>
                    <th>Hours Today</th>
                    <th>Exception Flag</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(row => `
                    <tr>
                      <td>${escapeHtml(row.workerName)}</td>
                      <td>${escapeHtml(row.clientName)}</td>
                      <td>${escapeHtml(row.siteName)}</td>
                      <td>${escapeHtml(row.lastActionLabel)}</td>
                      <td>${escapeHtml(row.lastPunchTime)}</td>
                      <td>${renderInlineStatus(row.statusLabel)}</td>
                      <td>${escapeHtml(row.hoursToday)}</td>
                      <td>${row.exception ? `<span class="status-badge status-warning">${escapeHtml(row.exception)}</span>` : `<span class="status-badge status-success">Clear</span>`}</td>
                      <td>
                        <div class="table-actions">
                          ${row.lastPunchId ? `<button class="button button-ghost" data-action="open-punch-form" data-punch-id="${escapeHtml(row.lastPunchId)}" type="button">Edit Punch</button>` : ""}
                          ${row.exception === "Missing clock out" ? `<button class="button button-primary" data-action="fix-missing-clock-out" data-worker-id="${escapeHtml(row.workerId)}" type="button">Mark Missing Clock Out Fixed</button>` : ""}
                          ${row.lastPunchId ? `<button class="button button-ghost" data-action="open-punch-note" data-punch-id="${escapeHtml(row.lastPunchId)}" type="button">Add Note</button>` : ""}
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No punches match these filters", "Try clearing the filters or wait until workers start punching in today.")}
        </div>

        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Punch Log</p>
              <h3>Raw punch records by company, site, worker, date, and action</h3>
            </div>
          </div>
          ${punchRows.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Company</th>
                    <th>Site</th>
                    <th>Worker</th>
                    <th>Action</th>
                    <th>Source</th>
                    <th>Match</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${punchRows.map(punch => `
                    <tr>
                      <td>${escapeHtml(formatDateTime(punch.timestamp || punch.createdAt || ""))}</td>
                      <td>${escapeHtml(punch.companyName || punch.clientName || getClientName(punch.companyId || punch.clientId))}</td>
                      <td>${escapeHtml(punch.siteName || getSiteName(punch.siteId))}</td>
                      <td>${escapeHtml(punch.workerName || getWorkerName(punch.workerId) || "Manual entry")}</td>
                      <td>${escapeHtml(PUNCH_LABELS[punch.action] || formatStatusLabel(punch.action || ""))}</td>
                      <td>${escapeHtml(punch.source || "manual")}</td>
                      <td>${punch.workerMatched === false ? `<span class="status-badge status-warning">Manual Name</span>` : `<span class="status-badge status-success">Matched</span>`}</td>
                      <td>
                        <div class="table-actions">
                          ${canManagePunches() && punch.id ? `<button class="button button-ghost" data-action="open-punch-form" data-punch-id="${escapeHtml(punch.id)}" type="button">Edit</button>` : ""}
                          ${canManagePunches() && punch.id ? `<button class="button button-ghost" data-action="open-punch-note" data-punch-id="${escapeHtml(punch.id)}" type="button">Add Note</button>` : ""}
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No raw punches match these filters", "Public site QR punches and staff-entered punches will appear here once they are saved.")}
        </div>
      </section>
    `;
  }

  function renderApprovalsPage() {
    const scoped = getScopedData();
    const approvals = scoped.approvals;
    const pending = approvals.filter(approval => approval.status === "pending");
    const history = approvals.filter(approval => approval.status !== "pending").slice().sort((left, right) => compareDates(right.reviewedAt || right.updatedAt, left.reviewedAt || left.updatedAt));

    return `
      <section class="stack-lg">
        <div class="metrics-grid">
          ${renderMetricCard("Pending Approval Count", pending.length, "Submitted timesheets waiting right now", "AP")}
          ${renderMetricCard("Approved History", approvals.filter(approval => approval.status === "approved").length, "Approved records in this view", "OK")}
          ${renderMetricCard("Rejected History", approvals.filter(approval => approval.status === "rejected").length, "Rejected records with notes", "RJ")}
          ${renderMetricCard("Submitted Hours", formatHours(sumNumbers(getApprovalTimesheets(pending).map(timesheet => timesheet.approvedHours))), "Hours currently awaiting approval", "HR")}
        </div>

        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Approvals</p>
              <h2 class="page-heading">${state.session.role === "clientManager" ? "Approve hours for your site" : "Client approval queue"}</h2>
            </div>
          </div>
          ${pending.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Client</th>
                    <th>Site</th>
                    <th>Hours Submitted</th>
                    <th>Punch Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${pending.map(approval => {
                    const timesheet = scoped.timesheets.find(item => item.id === approval.timesheetId);
                    const actions = state.session.role === "clientManager"
                      ? `
                        <button class="button button-ghost" data-action="view-approval" data-timesheet-id="${escapeHtml(approval.timesheetId)}" type="button">View Details</button>
                        <button class="button button-ghost" data-action="open-client-time-edit" data-timesheet-id="${escapeHtml(approval.timesheetId)}" type="button">Edit Time</button>
                        <button class="button button-secondary" data-action="open-client-missing-punch" data-timesheet-id="${escapeHtml(approval.timesheetId)}" type="button">Add Missing Punch</button>
                        <button class="button button-primary" data-action="approve-timesheet" data-timesheet-id="${escapeHtml(approval.timesheetId)}" type="button">Approve</button>
                        <button class="button button-danger" data-action="open-reject-modal" data-target-type="timesheet" data-target-id="${escapeHtml(approval.timesheetId)}" type="button">Reject</button>
                        <button class="button button-ghost" data-action="copy-approval-link" data-approval-id="${escapeHtml(approval.id)}" data-link-mode="internal" type="button">Copy Approval Link</button>
                        <button class="button button-ghost" data-action="email-approval-link" data-approval-id="${escapeHtml(approval.id)}" type="button">Email Approval Link</button>
                        <button class="button button-ghost" data-action="text-approval-link" data-approval-id="${escapeHtml(approval.id)}" type="button">Text Approval Link</button>
                      `
                      : `
                        <button class="button button-ghost" data-action="view-approval" data-timesheet-id="${escapeHtml(approval.timesheetId)}" type="button">View Details</button>
                        <button class="button button-ghost" data-action="open-approval-edit" data-timesheet-id="${escapeHtml(approval.timesheetId)}" type="button">Edit Hours</button>
                        <button class="button button-primary" data-action="approve-timesheet" data-timesheet-id="${escapeHtml(approval.timesheetId)}" type="button">Approve</button>
                        <button class="button button-danger" data-action="open-reject-modal" data-target-type="timesheet" data-target-id="${escapeHtml(approval.timesheetId)}" type="button">Reject</button>
                        <button class="button button-ghost" data-action="view-timesheet-history" data-timesheet-id="${escapeHtml(approval.timesheetId)}" type="button">View History</button>
                        <button class="button button-ghost" data-action="copy-approval-link" data-approval-id="${escapeHtml(approval.id)}" data-link-mode="token" type="button">Copy Approval Link</button>
                        <button class="button button-ghost" data-action="email-approval-link" data-approval-id="${escapeHtml(approval.id)}" type="button">Email Approval Link</button>
                        <button class="button button-ghost" data-action="text-approval-link" data-approval-id="${escapeHtml(approval.id)}" type="button">Text Approval Link</button>
                      `;
                    return `
                      <tr>
                        <td>${escapeHtml(getWorkerName(approval.workerId))}</td>
                        <td>${escapeHtml(getClientName(approval.clientId))}</td>
                        <td>${escapeHtml(getSiteName(approval.siteId))}</td>
                        <td>${escapeHtml(formatHours(timesheet?.approvedHours || 0))}</td>
                        <td>${escapeHtml(buildTimesheetPunchSummaryText(timesheet, scoped.punches))}</td>
                        <td>${renderApprovalStatusCell(approval, timesheet, scoped)}</td>
                        <td>
                          <div class="table-actions">
                            ${actions}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No approvals are waiting", "Submitted hours for this client or agency will appear here when they are ready for review.")}
        </div>

        <div class="surface-card">
          <div class="card-top">
            <div>
              <p class="eyebrow">History</p>
              <h2 class="page-heading">Approved and rejected history</h2>
            </div>
          </div>
          ${history.length ? `
            <ul class="history-list" style="margin-top: 18px;">
              ${history.map(approval => `
                <li class="history-item">
                  <div>
                    <strong>${escapeHtml(getWorkerName(approval.workerId))} - ${escapeHtml(getSiteName(approval.siteId))}</strong>
                    <p class="inline-note">${escapeHtml(approval.note || "No note added")} · ${escapeHtml(formatDateTime(approval.reviewedAt || approval.updatedAt))}</p>
                  </div>
                  <div class="page-actions">
                    ${renderInlineStatus(approval.status)}
                    ${(approval.clientEdited || scoped.timesheets.find(item => item.id === approval.timesheetId)?.clientEdited) ? `<span class="status-badge status-warning">Client Edited</span>` : ""}
                  </div>
                </li>
              `).join("")}
            </ul>
          ` : `<p class="helper-copy" style="margin-top: 16px;">Approved and rejected records will appear here.</p>`}
        </div>
      </section>
    `;
  }

  function renderPayrollPage() {
    const scoped = getScopedData();
    const payPeriods = getPayPeriods(scoped.timesheets);
    if (!state.selectedPayPeriod && payPeriods.length) {
      state.selectedPayPeriod = payPeriods[0].value;
    }

    const activePeriod = payPeriods.find(period => period.value === state.selectedPayPeriod) || payPeriods[0];
    const periodTimesheets = activePeriod
      ? scoped.timesheets.filter(timesheet => `${timesheet.payPeriodStart}|${timesheet.payPeriodEnd}` === activePeriod.value)
      : scoped.timesheets;

    const summary = buildPayrollSummary(periodTimesheets);

    return `
      <section class="stack-lg">
        <div class="metrics-grid">
          ${renderMetricCard("Approved Hours", formatHours(summary.approvedHours), "Approved and submitted hours", "AH")}
          ${renderMetricCard("Regular Hours", formatHours(summary.regularHours), "Straight-time hours", "RG")}
          ${renderMetricCard("Overtime Hours", formatHours(summary.overtimeHours), "Overtime hours", "OT")}
          ${renderMetricCard("Total Labor Cost", formatCurrency(summary.totalLaborCost), "Regular plus overtime labor cost", "LC")}
        </div>

        <div class="filter-card">
          <div class="filter-row">
            <div class="field-group" style="min-width: 260px;">
              <label for="pay-period">Weekly pay period</label>
              <select id="pay-period" name="payPeriod">
                ${payPeriods.map(period => `<option value="${escapeHtml(period.value)}" ${period.value === state.selectedPayPeriod ? "selected" : ""}>${escapeHtml(period.label)}</option>`).join("")}
              </select>
            </div>
            <div class="page-actions">
              <button class="button button-secondary" type="button" data-action="copy-payroll-csv">Export CSV</button>
              <button class="button button-secondary" type="button" data-action="copy-payroll-excel">Export Excel-ready CSV</button>
              <button class="button button-ghost" type="button" data-action="print-view">Export Weekly Timesheet PDF</button>
            </div>
          </div>
          <p class="print-note">Copying the CSV is available in-browser. PDF export uses your browser print dialog.</p>
        </div>

        <div class="table-shell">
          ${periodTimesheets.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Approved Hours</th>
                    <th>Regular Hours</th>
                    <th>OT Hours</th>
                    <th>Pay Rate</th>
                    <th>Total Labor Cost</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${periodTimesheets.map(timesheet => {
                    const payRate = Number(timesheet.payRate || getWorker(timesheet.workerId)?.payRate || 0);
                    const totalCost = calculateLaborCost(timesheet.regularHours, timesheet.overtimeHours, payRate);
                    return `
                      <tr>
                        <td>${escapeHtml(getWorkerName(timesheet.workerId))}</td>
                        <td>${escapeHtml(formatHours(timesheet.approvedHours))}</td>
                        <td>${escapeHtml(formatHours(timesheet.regularHours))}</td>
                        <td>${escapeHtml(formatHours(timesheet.overtimeHours))}</td>
                        <td>${escapeHtml(formatCurrency(payRate))}</td>
                        <td>${escapeHtml(formatCurrency(totalCost))}</td>
                        <td>${renderInlineStatus(timesheet.status)}</td>
                        <td>${escapeHtml(timesheet.adminNotes || "-")}</td>
                        <td>
                          <div class="table-actions">
                            <button class="button button-ghost" data-action="open-payroll-edit" data-timesheet-id="${escapeHtml(timesheet.id)}" type="button">Edit</button>
                            <button class="button button-primary" data-action="approve-timesheet" data-timesheet-id="${escapeHtml(timesheet.id)}" type="button">Approve</button>
                            <button class="button button-danger" data-action="open-reject-modal" data-target-type="timesheet" data-target-id="${escapeHtml(timesheet.id)}" type="button">Reject</button>
                            <button class="button button-ghost" data-action="export-payroll-row" data-timesheet-id="${escapeHtml(timesheet.id)}" type="button">Export Row</button>
                            <button class="button button-ghost" data-action="view-timesheet-history" data-timesheet-id="${escapeHtml(timesheet.id)}" type="button">View History</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No timesheets in this pay period", "When workers submit time, their weekly payroll rows will appear here.")}
        </div>
      </section>
    `;
  }

  function renderMarginPage() {
    const scoped = getScopedData();
    const rows = buildMarginRows(scoped);
    const summary = rows.reduce((accumulator, row) => {
      accumulator.revenue += row.revenue;
      accumulator.laborCost += row.laborCost;
      accumulator.grossProfit += row.grossProfit;
      return accumulator;
    }, { revenue: 0, laborCost: 0, grossProfit: 0 });
    const averageMargin = summary.revenue ? (summary.grossProfit / summary.revenue) * 100 : 0;

    return `
      <section class="stack-lg">
        <div class="metrics-grid">
          ${renderMetricCard("Total Revenue", formatCurrency(summary.revenue), "Bill rate multiplied by hours", "RV")}
          ${renderMetricCard("Total Labor Cost", formatCurrency(summary.laborCost), "Regular plus overtime labor cost", "LC")}
          ${renderMetricCard("Gross Profit", formatCurrency(summary.grossProfit), "Revenue minus labor cost", "GP")}
          ${renderMetricCard("Average Margin %", formatPercent(averageMargin), "Average margin across visible rows", "MG")}
        </div>
        <div class="table-shell">
          ${rows.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Client</th>
                    <th>Site</th>
                    <th>Pay Rate</th>
                    <th>Bill Rate</th>
                    <th>Hours</th>
                    <th>Revenue</th>
                    <th>Labor Cost</th>
                    <th>Gross Profit</th>
                    <th>Margin %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(row => `
                    <tr>
                      <td>${escapeHtml(row.workerName)}</td>
                      <td>${escapeHtml(row.clientName)}</td>
                      <td>${escapeHtml(row.siteName)}</td>
                      <td>${escapeHtml(formatCurrency(row.payRate))}</td>
                      <td>${escapeHtml(formatCurrency(row.billRate))}</td>
                      <td>${escapeHtml(formatHours(row.hours))}</td>
                      <td>${escapeHtml(formatCurrency(row.revenue))}</td>
                      <td>${escapeHtml(formatCurrency(row.laborCost))}</td>
                      <td>${escapeHtml(formatCurrency(row.grossProfit))}</td>
                      <td>${escapeHtml(formatPercent(row.marginPercent))}</td>
                      <td>
                        <div class="table-actions">
                          <button class="button button-ghost" data-action="open-margin-edit" data-assignment-id="${escapeHtml(row.assignmentId)}" data-timesheet-id="${escapeHtml(row.timesheetId)}" type="button">Edit Assignment</button>
                          <button class="button button-ghost" data-action="open-margin-edit" data-assignment-id="${escapeHtml(row.assignmentId)}" data-timesheet-id="${escapeHtml(row.timesheetId)}" type="button">Edit Bill Rate</button>
                          <button class="button button-ghost" data-action="view-margin-breakdown" data-assignment-id="${escapeHtml(row.assignmentId)}" data-timesheet-id="${escapeHtml(row.timesheetId)}" type="button">View Breakdown</button>
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No margin rows available", "Assignments and timesheets need to be in place before margin can be calculated.")}
        </div>
      </section>
    `;
  }

  function renderExceptionsPage() {
    const exceptions = buildExceptionItems(getScopedData());
    return `
      <section class="stack-lg">
        <div class="surface-card">
          <div class="card-top">
            <div>
              <p class="eyebrow">Problems to Fix</p>
              <h2 class="page-heading">Exception alerts</h2>
            </div>
          </div>
          ${exceptions.length ? `
            <ul class="exception-list" style="margin-top: 18px;">
              ${exceptions.map(exception => `
                <li class="exception-item">
                  <div>
                    <strong>${escapeHtml(exception.title)}</strong>
                    <p class="inline-note">${escapeHtml(exception.detail)}</p>
                  </div>
                  <span class="status-badge ${exception.tone}">${escapeHtml(exception.kind)}</span>
                </li>
              `).join("")}
            </ul>
          ` : renderEmptyState("No exception alerts", "Clock activity, approvals, and payroll rows look clear right now.")}
        </div>
      </section>
    `;
  }

  function renderQrCodesPage() {
    const scoped = getScopedData();
    const siteCards = scoped.sites
      .filter(site => site.status !== "inactive")
      .slice()
      .sort((left, right) => {
        const clientCompare = getClientName(left.clientId).localeCompare(getClientName(right.clientId));
        if (clientCompare !== 0) {
          return clientCompare;
        }
        return left.name.localeCompare(right.name);
      });

    return `
      <section class="stack-lg">
        <div class="table-top">
          <div>
            <p class="eyebrow">QR Codes</p>
            <h2 class="page-heading">Generate site punch QR codes</h2>
          </div>
          <div class="page-actions">
            <button class="button button-secondary" data-action="open-publish-punch-page" type="button">Publish to Punch Page</button>
            <button class="button button-primary" data-action="open-qr-form" data-qr-type="site" type="button">Generate Site QR</button>
          </div>
        </div>

        <div class="surface-card">
          <div class="card-top">
            <div>
              <p class="eyebrow">Site Punch Stations</p>
              <h3>One QR per company and location</h3>
            </div>
          </div>
          <p class="helper-copy">Each QR code opens a public punch page where workers can select or type their name, then clock in, start lunch, end lunch, or clock out from the same mobile-first screen.</p>
          ${siteCards.length ? `
            <div class="qr-card-grid" style="margin-top: 18px;">
              ${siteCards.map(site => {
                const link = site.qrEnabled === false ? "" : buildSiteLink(site.id);
                const companyName = getClientName(site.clientId);
                const fileName = `portaly-qr-${slugifyFilename(companyName)}-${slugifyFilename(site.name)}.png`;
                return `
                  <article class="link-card qr-card">
                    <div class="qr-preview">
                      ${link ? renderQrCanvas(link, site.id, `${companyName} ${site.name} QR`) : `<div class="qr-placeholder-copy">QR link deactivated</div>`}
                    </div>
                    <div class="stack-sm qr-card-copy" style="margin-top: 16px;">
                      <p class="eyebrow">${escapeHtml(companyName)}</p>
                      <strong>${escapeHtml(site.name)}</strong>
                      <p class="helper-copy">Scan to open the shared punch page for this site.</p>
                      <p class="helper-copy qr-link-text">${escapeHtml(link || "Link deactivated")}</p>
                      <div class="table-actions qr-actions">
                        <button class="button button-primary" data-action="publish-site-to-punch-page" data-site-id="${escapeAttribute(site.id)}" type="button">Publish</button>
                        <button class="button button-secondary" data-action="copy-link" data-copy="${escapeAttribute(link)}" data-copy-success="${escapeAttribute("Punch link copied.")}" type="button" ${link ? "" : "disabled"}>Copy Link</button>
                        <button class="button button-ghost" data-action="download-qr-png" data-qr-key="${escapeAttribute(site.id)}" data-link="${escapeAttribute(link)}" data-file-name="${escapeAttribute(fileName)}" type="button" ${link ? "" : "disabled"}>Download PNG</button>
                        <button class="button button-ghost" data-action="print-qr-card" data-qr-key="${escapeAttribute(site.id)}" data-link="${escapeAttribute(link)}" data-company-name="${escapeAttribute(companyName)}" data-site-name="${escapeAttribute(site.name)}" type="button" ${link ? "" : "disabled"}>Print QR</button>
                        <button class="button button-ghost" data-action="open-qr-form" data-qr-type="site" data-site-id="${escapeHtml(site.id)}" type="button">Edit</button>
                        <button class="button button-danger" data-action="deactivate-qr-link" data-qr-type="site" data-record-id="${escapeHtml(site.id)}" type="button">Deactivate</button>
                      </div>
                    </div>
                  </article>
                `;
              }).join("")}
            </div>
          ` : renderEmptyState("No sites to generate", "Add a site first so Portaly can generate a printable punch station QR card.")}
        </div>
      </section>
    `;
  }

  function renderUsersPage() {
    const users = getScopedData().users;
    const invites = getClientInvites().slice().sort((left, right) => compareDates(right.createdAt, left.createdAt));
    return `
      <section class="stack-lg">
        <div class="notice-card">
          <div>
            <strong>Control who can access Portaly and what they can see.</strong>
            <p>Invite client managers for assigned site approvals, or manage internal access for owners, admins, and worker-linked logins.</p>
          </div>
        </div>
        ${invites.length ? `
          <div class="table-shell">
            <div class="table-top">
              <div>
                <p class="eyebrow">Client Manager Invites</p>
                <h2 class="page-heading">Pending and accepted invite links</h2>
              </div>
              ${canInviteClientManagers() ? `<button class="button button-secondary" data-action="open-client-manager-invite" type="button">Invite Client Manager</button>` : ""}
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Assigned Clients</th>
                    <th>Assigned Sites</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${invites.map(invite => `
                    <tr>
                      <td>${escapeHtml(`${invite.firstName || ""} ${invite.lastName || ""}`.trim() || invite.email || invite.id)}</td>
                      <td>${escapeHtml(invite.email || "-")}</td>
                      <td>${renderInlineStatus(invite.status || "pending")}</td>
                      <td>${escapeHtml((invite.assignedClientIds || []).map(id => getClientName(id)).join(", ") || "-")}</td>
                      <td>${escapeHtml((invite.assignedSiteIds || []).map(id => getSiteName(id)).join(", ") || "-")}</td>
                      <td>
                        <div class="table-actions">
                          <button class="button button-primary" data-action="copy-link" data-copy="${escapeAttribute(invite.inviteLink || buildClientManagerInviteLink(invite.inviteToken || ""))}" data-copy-success="${escapeAttribute("Invite link copied successfully. Send this link to the client manager.")}" type="button">Copy Invite Link</button>
                          ${PUBLIC_INVITE_STATUSES.has(String(invite.status || "pending").toLowerCase()) ? `<button class="button button-ghost" data-action="send-client-invite-email" ${buildInviteEmailActionAttributes(invite)} type="button">${escapeHtml(getInviteEmailButtonLabel(invite))}</button>` : ""}
                          ${canInviteClientManagers() && PUBLIC_INVITE_STATUSES.has(String(invite.status || "pending").toLowerCase()) ? `<button class="button button-danger" data-action="revoke-client-invite" data-invite-id="${escapeHtml(invite.id)}" type="button">Revoke Invite</button>` : ""}
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        ` : ""}
        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Users</p>
              <h2 class="page-heading">Role-based access profiles</h2>
            </div>
            <div class="page-actions">
              ${canInviteClientManagers() ? `<button class="button button-secondary" data-action="open-client-manager-invite" type="button">Invite Client Manager</button>` : ""}
              ${canManageUsers() ? `<button class="button button-primary" data-action="open-user-form" type="button">Invite User</button>` : ""}
            </div>
          </div>
          ${users.length ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Agency</th>
                    <th>Status</th>
                    <th>Assigned Clients</th>
                    <th>Assigned Sites</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(user => `
                    <tr>
                      <td>${escapeHtml(fullName(user) || user.email || user.id)}</td>
                      <td>${escapeHtml(user.email || "-")}</td>
                      <td>${escapeHtml(ROLE_META[user.role]?.label || user.role)}</td>
                      <td>${escapeHtml(getAgencyName(user.agencyId))}</td>
                      <td>${renderInlineStatus(user.status || "active")}</td>
                      <td>${escapeHtml(String((user.assignedClientIds || []).length))}</td>
                      <td>${escapeHtml(String((user.assignedSiteIds || []).length))}</td>
                      <td>
                        <div class="table-actions">
                          ${canManageUsers() ? `<button class="button button-ghost" data-action="open-user-form" data-user-id="${escapeHtml(user.id)}" type="button">Edit User Role</button>` : ""}
                          ${canManageUsers() ? `<button class="button button-ghost" data-action="deactivate-user" data-user-id="${escapeHtml(user.id)}" type="button">Deactivate User</button>` : ""}
                          ${canManageUsers() ? `<button class="button button-secondary" data-action="reset-password-user" data-user-id="${escapeHtml(user.id)}" type="button">Reset Password Email</button>` : ""}
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No people added yet", "Invite a client manager or create the first internal access profile to route people by role in Portaly.")}
        </div>
      </section>
    `;
  }

  function renderBillingPage() {
    const agency = getCurrentAgency();
    const subscription = getCurrentSubscription();
    const plan = getPlanDefinition(agency?.planId || state.selectedPlan || "agency");
    const usage = getUsageStats(getScopedData(), agency?.id);
    const nextBillingDate = subscription?.currentPeriodEnd || subscription?.trialEnd || agency?.trialEnd || addDays(new Date(), 14).toISOString();
    const status = subscription?.status || agency?.subscriptionStatus || "trialing";
    const canManage = canManageBilling();
    const subscriptionConnected = !!subscription?.squareSubscriptionId;
    const planOptions = Object.values(PLAN_DEFINITIONS).map(item => renderPricingCard(item, item.id === (agency?.planId || state.selectedPlan), "billing")).join("");

    return `
      <section class="stack-lg">
        <div class="metrics-grid">
          ${renderMetricCard("Current Plan", plan.label, "Monthly plan tier", "PL")}
          ${renderMetricCard("Trial Days Remaining", Math.max(getTrialDaysRemaining(), 0), "Days left before billing starts", "TD")}
          ${renderMetricCard("Subscription Status", formatStatusLabel(status), "Square billing and Portaly subscription status", "SS")}
          ${renderMetricCard("Worker / Site Usage", `${usage.activeWorkers}${plan.workerLimit ? ` / ${plan.workerLimit}` : ""} workers`, `${usage.activeSites}${plan.siteLimit ? ` / ${plan.siteLimit}` : ""} sites`, "US")}
        </div>

        ${["past_due", "unpaid", "expired_trial"].includes(status) ? `
          <div class="notice-card danger">
            <div>
              <strong>Payment issue detected</strong>
              <p>Payroll, worker, site, and punch management stay locked until billing is fixed. Owners can still use Billing and Settings.</p>
            </div>
          </div>
        ` : ""}

        <div class="summary-card">
          <p class="eyebrow">Billing</p>
          <h3>${escapeHtml(plan.label)} plan</h3>
          <div class="detail-grid" style="margin-top: 18px;">
            ${renderDetailBox("Current plan", plan.label)}
            ${renderDetailBox("Subscription status", formatStatusLabel(status))}
            ${renderDetailBox("Trial days remaining", String(Math.max(getTrialDaysRemaining(), 0)))}
            ${renderDetailBox("Next billing date", formatDate(nextBillingDate))}
            ${renderDetailBox("Square customer ID", subscription?.squareCustomerId || agency?.squareCustomerId || "Not connected yet")}
            ${renderDetailBox("Square subscription ID", subscription?.squareSubscriptionId || agency?.squareSubscriptionId || "Not connected yet")}
          </div>
          <div class="stack-md" style="margin-top: 18px;">
            ${renderUsageRow("Active workers", usage.activeWorkers, plan.workerLimit)}
            ${renderUsageRow("Active sites", usage.activeSites, plan.siteLimit)}
          </div>
          <p class="helper-copy" style="margin-top: 18px;">Payments can start through Square checkout today, and larger agencies can use guided Stripe or invoiced subscription setup during onboarding.</p>
          ${!subscriptionConnected ? `
            <div class="notice-card warning" style="margin-top: 18px;">
              <div>
                <strong>Subscription not connected yet</strong>
                <p>If you already paid, click Refresh Subscription Status or contact support with your Square receipt email.</p>
              </div>
            </div>
          ` : ""}
          ${!canManage ? `
            <div class="notice-card" style="margin-top: 18px;">
              <div>
                <strong>Billing changes are limited</strong>
                <p>Only the agency owner or platform owner can change plan, pause, resume, or cancel billing.</p>
              </div>
            </div>
          ` : ""}
          <div class="page-actions billing-action-grid" style="margin-top: 18px;">
            <button class="button button-primary" data-action="start-checkout" data-plan="${escapeHtml(plan.id)}" type="button" ${!canManage ? "disabled" : ""}>Start Paid Subscription</button>
            <button class="button button-secondary" data-action="manage-billing" type="button" ${!canManage ? "disabled" : ""}>Manage Billing</button>
            <button class="button button-ghost" data-action="upgrade-plan" data-plan="growth" type="button" ${!canManage ? "disabled" : ""}>Upgrade Plan</button>
            <button class="button button-ghost" data-action="downgrade-plan" data-plan="starter" type="button" ${!canManage ? "disabled" : ""}>Downgrade Plan</button>
            <button class="button button-ghost" data-action="pause-subscription" type="button" ${!canManage || ["paused", "canceled"].includes(status) ? "disabled" : ""}>Pause Subscription</button>
            <button class="button button-ghost" data-action="resume-subscription" type="button" ${!canManage || status !== "paused" ? "disabled" : ""}>Resume Subscription</button>
            <button class="button button-danger" data-action="cancel-subscription" type="button" ${!canManage || ["canceled", "cancel_at_period_end"].includes(status) ? "disabled" : ""}>Cancel Subscription</button>
            <button class="button button-secondary" data-action="reactivate-subscription" type="button" ${!canManage || !["canceled", "cancel_at_period_end", "paused"].includes(status) ? "disabled" : ""}>Reactivate Subscription</button>
            <button class="button button-ghost" data-action="refresh-subscription" type="button">Refresh Subscription Status</button>
            <button class="button button-ghost" data-action="view-payment-history" type="button">View Payment History</button>
            <button class="button button-ghost" data-action="update-payment-method" type="button">Update Payment Method</button>
          </div>
        </div>

        <div class="pricing-grid">
          ${planOptions}
        </div>
      </section>
    `;
  }

  function renderSettingsPage() {
    const settings = getCurrentSettings();
    const agency = getCurrentAgency();
    const applied = buildAgencySettings({
      agencyName: settings?.agencyName || agency?.name || "Portaly Agency",
      logoInitials: settings?.logoInitials || initials(settings?.agencyName || agency?.name || "Portaly"),
      primaryColor: settings?.primaryColor || DEFAULT_BRAND,
      supportEmail: settings?.supportEmail || DEFAULT_SUPPORT_EMAIL,
      supportPhone: settings?.supportPhone || DEFAULT_SUPPORT_PHONE,
      payrollContact: settings?.payrollContact || DEFAULT_SUPPORT_EMAIL,
      defaultPayPeriod: settings?.defaultPayPeriod || "Weekly",
      timezone: settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
      weekStartDay: settings?.weekStartDay || "Monday"
    });

    return `
      <section class="stack-lg">
        ${state.session.mode === "demo" ? `
          <div class="notice-card warning">
            <div>
              <strong>Demo Mode warning</strong>
              <p>These settings only save inside this browser. They do not sync to other devices until Cloud Mode is enabled.</p>
            </div>
          </div>
        ` : ""}
        ${state.session.role === "agencyOwner" ? `
          <div class="notice-card warning">
            <div>
              <strong>Repair My Agency Access</strong>
              <p>If clients, sites, or workers are blocked by a missing agency link, Portaly can reconnect this owner profile to the correct agency automatically.</p>
            </div>
            <div class="page-actions" style="margin-top: 18px;">
              <button class="button button-secondary" data-action="repair-agency-access" type="button">Repair My Agency Access</button>
            </div>
          </div>
        ` : ""}
        <div class="setting-card">
          <p class="eyebrow">White Label Settings</p>
          <h3>Agency branding and support details</h3>
          <form class="form-grid" data-form="settings-save" style="margin-top: 18px;">
            <div class="form-row two">
              <div class="field-group">
                <label for="settings-agency-name">Agency name</label>
                <input id="settings-agency-name" name="agencyName" type="text" value="${escapeAttribute(applied.agencyName)}" />
              </div>
              <div class="field-group">
                <label for="settings-logo-initials">Logo initials</label>
                <input id="settings-logo-initials" name="logoInitials" type="text" value="${escapeAttribute(applied.logoInitials)}" />
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="settings-primary-color">Primary color</label>
                <input id="settings-primary-color" name="primaryColor" type="color" value="${escapeAttribute(normalizeColor(applied.primaryColor))}" />
              </div>
              <div class="field-group">
                <label for="settings-pay-period">Default pay period</label>
                <select id="settings-pay-period" name="defaultPayPeriod">
                  <option value="Weekly" ${applied.defaultPayPeriod === "Weekly" ? "selected" : ""}>Weekly</option>
                  <option value="Biweekly" ${applied.defaultPayPeriod === "Biweekly" ? "selected" : ""}>Biweekly</option>
                </select>
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="settings-support-email">Support email</label>
                <input id="settings-support-email" name="supportEmail" type="email" value="${escapeAttribute(applied.supportEmail)}" />
              </div>
              <div class="field-group">
                <label for="settings-support-phone">Support phone</label>
                <input id="settings-support-phone" name="supportPhone" type="text" value="${escapeAttribute(applied.supportPhone)}" />
              </div>
            </div>
            <div class="field-group">
              <label for="settings-payroll-contact">Payroll contact</label>
              <input id="settings-payroll-contact" name="payrollContact" type="email" value="${escapeAttribute(applied.payrollContact)}" />
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="settings-timezone">Timezone</label>
                <input id="settings-timezone" name="timezone" type="text" value="${escapeAttribute(applied.timezone || "")}" />
              </div>
              <div class="field-group">
                <label for="settings-week-start-day">Week start day</label>
                <select id="settings-week-start-day" name="weekStartDay">
                  ${renderStaticOptions(["Monday", "Sunday"], applied.weekStartDay || "Monday", value => value)}
                </select>
              </div>
            </div>
            <div class="page-actions">
              <button class="button button-primary" type="submit">Save Settings</button>
            </div>
          </form>
        </div>
        ${canDeleteSampleData() ? `
          <div class="notice-card danger">
            <div>
              <strong>Delete Sample Data</strong>
              <p>Clear sample workers, clients, sites, assignments, punches, timesheets, approvals, payroll runs, and audit logs from this agency workspace without deleting the owner account, settings, or subscription.</p>
            </div>
            <div class="page-actions" style="margin-top: 18px;">
              <button class="button button-danger" data-action="delete-sample-data" type="button">Delete Sample Data</button>
            </div>
          </div>
        ` : ""}
        <div class="support-card">
          <p class="eyebrow">Trust & Support</p>
          <h3>Professional customer controls</h3>
          <p>Portaly keeps legal links, support contact, secure Square billing, and export expectations visible for agency owners and admins.</p>
          <div class="page-actions" style="margin-top: 16px;">
            <button class="button button-ghost" data-action="privacy-placeholder" type="button">Privacy Policy</button>
            <button class="button button-ghost" data-action="terms-placeholder" type="button">Terms of Service</button>
            <button class="button button-secondary" data-action="open-support" type="button">Support</button>
          </div>
          <div class="page-actions" style="margin-top: 12px;">
            <span class="mode-badge">Secure billing through Square</span>
            <span class="mode-badge">Data export available</span>
          </div>
        </div>
      </section>
    `;
  }

  function renderLockedAgencyView() {
    return `
      <section class="stack-lg">
        <div class="notice-card danger">
          <div>
            <strong>Billing needs attention</strong>
            <p>This agency can still access Billing and Settings. All other operations stay locked until the subscription returns to an active or trialing state.</p>
          </div>
        </div>
        ${state.session.role === "agencyOwner" || state.session.role === "platformOwner" ? `
          <div class="page-actions">
            <button class="button button-primary" data-action="go-route" data-route="billing" type="button">Open Billing</button>
            <button class="button button-secondary" data-action="go-route" data-route="settings" type="button">Open Settings</button>
          </div>
        ` : `
          <div class="support-card">
            <p class="eyebrow">Need help?</p>
            <h3>Contact your agency owner</h3>
            <p>Billing access is limited to the agency owner or platform owner.</p>
          </div>
        `}
      </section>
    `;
  }

  function renderWorkerPunchPage() {
    const worker = getCurrentWorker();
    const scoped = getScopedData();

    if (!worker) {
      return renderWorkerHelpPage();
    }

    const punchState = getWorkerPunchState(worker.id, scoped);
    const recent = getWorkerPunchesForToday(worker.id, scoped.punches).slice().reverse().slice(0, 6);

    return `
      <div class="worker-layout">
        <div class="worker-card primary">
          <p class="eyebrow">Clock In / Clock Out</p>
          <h2>Clock In / Clock Out</h2>
          <p class="section-copy">Use the large buttons below. Portaly will only enable the next action that makes sense.</p>
          <div class="worker-status-banner">
            <strong>${escapeHtml(punchState.label)}</strong>
            <p>${escapeHtml(getWorkerStatusMessage(punchState.key))}</p>
          </div>
          <div class="worker-meta-grid">
            ${renderWorkerMeta("Worker name", fullName(worker))}
            ${renderWorkerMeta("Agency", getCurrentAgency()?.name || getBrandName())}
            ${renderWorkerMeta("Client", getClientName(worker.assignedClientId))}
            ${renderWorkerMeta("Site / location", getSiteName(worker.assignedSiteId))}
            ${renderWorkerMeta("Current date / time", formatDateTime(state.now.toISOString()))}
            ${renderWorkerMeta("Current punch status", punchState.label)}
          </div>
          <div class="worker-buttons">
            <button class="button button-primary button-large" data-action="punch-action" data-punch="clockIn" type="button" ${punchState.allowed.clockIn ? "" : "disabled"}>Clock In</button>
            <button class="button button-secondary button-large" data-action="punch-action" data-punch="startLunch" type="button" ${punchState.allowed.startLunch ? "" : "disabled"}>Start Lunch</button>
            <button class="button button-secondary button-large" data-action="punch-action" data-punch="endLunch" type="button" ${punchState.allowed.endLunch ? "" : "disabled"}>End Lunch</button>
            <button class="button button-ghost button-large" data-action="punch-action" data-punch="clockOut" type="button" ${punchState.allowed.clockOut ? "" : "disabled"}>Clock Out</button>
          </div>
          ${state.notice ? `
            <div class="worker-confirmation">
              <strong>${escapeHtml(state.notice.includes("clocked out") ? "Your shift is complete" : "Punch saved")}</strong>
              <p>${escapeHtml(state.notice)}</p>
            </div>
          ` : ""}
        </div>

        <div class="stack-md">
          <div class="worker-card">
            <p class="eyebrow">Recent Punch History</p>
            <h3>Today</h3>
            ${recent.length ? `
              <div class="history-timeline" style="margin-top: 10px;">
                ${recent.map(punch => `
                  <div class="history-timeline-item">
                    <strong>${escapeHtml(PUNCH_LABELS[punch.action] || punch.action)}</strong>
                    <span class="helper-copy">${escapeHtml(formatDateTime(punch.timestamp))}</span>
                  </div>
                `).join("")}
              </div>
            ` : `<p class="helper-copy" style="margin-top: 12px;">No punches have been saved yet today.</p>`}
          </div>

          ${renderWorkerHoursSummaryCard(worker.id, {
            eyebrow: "Hours Worked",
            title: "Hours by company",
            copy: "Track your processed hours across the companies where you have worked."
          })}

          <div class="support-card">
            <p class="eyebrow">Need help?</p>
            <h3>Contact your supervisor or staffing agency</h3>
            <p>If your punch is wrong, contact your supervisor or staffing agency.</p>
            <ul class="list">
              <li>${escapeHtml(getSupportPhone())}</li>
              <li>${escapeHtml(getSupportEmail())}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  function renderWorkerHistoryPage() {
    const worker = getCurrentWorker();
    const punches = worker ? getWorkerPunches(worker.id, getScopedData().punches).slice().reverse() : [];
    return `
      <div class="worker-layout">
        <div class="worker-card primary">
          <p class="eyebrow">My Punch History</p>
          <h2>My Punch History</h2>
          ${punches.length ? `
            <div class="history-timeline" style="margin-top: 18px;">
              ${punches.map(punch => `
                <div class="history-timeline-item">
                  <strong>${escapeHtml(PUNCH_LABELS[punch.action] || punch.action)}</strong>
                  <span class="helper-copy">${escapeHtml(formatDateTime(punch.timestamp))}</span>
                </div>
              `).join("")}
            </div>
          ` : `<p class="helper-copy" style="margin-top: 16px;">Your punch history will appear here after you start using the timeclock.</p>`}
        </div>
        <div class="stack-md">
          ${worker ? renderWorkerHoursSummaryCard(worker.id, {
            eyebrow: "Hours Worked",
            title: "Overall hours by company",
            copy: "Use this summary to keep track of your hours across each company."
          }) : ""}
          <div class="support-card">
            <p class="eyebrow">Help</p>
            <h3>Need a correction?</h3>
            <p>If a punch is missing or wrong, reach out to your agency so they can correct the record and keep payroll accurate.</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderWorkerHelpPage() {
    return `
      <div class="worker-layout">
        <div class="worker-card primary">
          <p class="eyebrow">Help</p>
          <h2>Need punch help?</h2>
          <p class="section-copy">If your punch is wrong, contact your supervisor or staffing agency before payroll is processed.</p>
          <div class="worker-meta-grid">
            ${renderWorkerMeta("Support email", getSupportEmail())}
            ${renderWorkerMeta("Support phone", getSupportPhone())}
          </div>
        </div>
        <div class="support-card">
          <p class="eyebrow">Tips</p>
          <h3>Quick reminders</h3>
          <ul class="list">
            <li>Clock in when you start working.</li>
            <li>Start lunch when you leave for lunch.</li>
            <li>End lunch when you come back.</li>
            <li>Clock out before you leave the site.</li>
          </ul>
        </div>
      </div>
    `;
  }

  function renderModal() {
    if (!state.modal) {
      return "";
    }

    switch (state.modal.type) {
      case "custom-form":
        return renderCustomModal();
      case "confirm":
        return renderConfirmModal();
      case "worker-form":
        return renderWorkerFormModal();
      case "worker-view":
        return renderWorkerViewModal();
      case "worker-history":
        return renderWorkerHistoryModal();
      case "client-form":
        return renderClientFormModal();
      case "site-form":
        return renderSiteFormModal();
      case "payroll-edit":
        return renderPayrollEditModal();
      case "reject-note":
        return renderRejectNoteModal();
      default:
        return "";
    }
  }

  function renderCustomModal() {
    const sizeClass = state.modal.size ? ` ${escapeHtml(state.modal.size)}` : "";
    const formId = escapeAttribute(state.modal.formId || `${state.modal.formName || "custom-modal-save"}-form`);
    const hasInlineForm = !state.modal.readOnly && /<form\b/i.test(String(state.modal.html || ""));
    const saveActions = state.modal.readOnly ? `
      <div class="modal-actions">
        <button class="button button-ghost" data-action="close-modal" type="button">${escapeHtml(state.modal.cancelLabel || "Close")}</button>
      </div>
    ` : `
      <div class="modal-actions">
        <button class="button ${escapeHtml(state.modal.saveTone || "button-primary")}" type="submit" form="${formId}">${escapeHtml(state.modal.saveLabel || "Save")}</button>
        <button class="button button-ghost" data-action="close-modal" type="button">${escapeHtml(state.modal.cancelLabel || "Cancel")}</button>
      </div>
    `;

    const body = state.modal.readOnly
      ? state.modal.html
      : hasInlineForm
        ? `${String(state.modal.html || "").replace(/<form\b([^>]*)>/i, (match, attrs) => (/id\s*=/.test(attrs) ? match : `<form id="${formId}"${attrs}>`))}${saveActions}`
        : `
          <form id="${formId}" class="form-grid" data-form="${escapeAttribute(state.modal.formName || "custom-modal-save")}">
            ${state.modal.html}
            ${saveActions}
          </form>
        `;

    return `
      <div class="modal">
        <div class="modal-card${sizeClass}">
          <div class="modal-head">
            <div>
              <p class="eyebrow">Edit</p>
              <h3>${escapeHtml(state.modal.title || "Update")}</h3>
            </div>
            <button class="modal-close" data-action="close-modal" type="button">Close</button>
          </div>
          ${state.modal.message ? `<p class="helper-copy" style="margin-bottom: 18px;">${escapeHtml(state.modal.message)}</p>` : ""}
          ${state.modal.readOnly ? `${state.modal.html}${saveActions}` : body}
        </div>
      </div>
    `;
  }

  function renderConfirmModal() {
    return `
      <div class="modal">
        <div class="modal-card small">
          <div class="modal-head">
            <div>
              <p class="eyebrow">Confirm</p>
              <h3>${escapeHtml(state.modal.title || "Confirm")}</h3>
            </div>
            <button class="modal-close" data-action="close-modal" type="button">Close</button>
          </div>
          <p class="helper-copy">${escapeHtml(state.modal.message || "Are you sure?")}</p>
          <div class="modal-actions">
            <button class="button ${escapeHtml(state.modal.confirmTone || "button-primary")}" data-action="confirm-modal" type="button">${escapeHtml(state.modal.confirmLabel || "Confirm")}</button>
            <button class="button button-ghost" data-action="close-modal" type="button">${escapeHtml(state.modal.cancelLabel || "Cancel")}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderWorkerFormModal() {
    const worker = state.modal.workerId ? getScopedData().workers.find(item => item.id === state.modal.workerId) : null;
    const scoped = getScopedData();
    const agencies = scoped.agencies.length ? scoped.agencies : state.cache.agencies;
    return `
      <div class="modal">
        <div class="modal-card">
          <div class="modal-head">
            <div>
              <p class="eyebrow">${worker ? "Edit Worker" : "Add Worker"}</p>
              <h3>${worker ? "Update worker details" : "Create a new worker"}</h3>
            </div>
            <button class="modal-close" data-action="close-modal" type="button">Close</button>
          </div>
          <form class="form-grid" data-form="worker-save">
            <input name="id" type="hidden" value="${escapeAttribute(worker?.id || "")}" />
            ${state.session.role === "platformOwner" ? `
              <div class="field-group">
                <label for="worker-agency">Agency</label>
                <select id="worker-agency" name="agencyId">
                  ${renderSelectOptions(agencies, worker?.agencyId || "", "Select agency")}
                </select>
              </div>
            ` : ""}
            <div class="form-row two">
              <div class="field-group">
                <label for="worker-first-name">First name</label>
                <input id="worker-first-name" name="firstName" type="text" value="${escapeAttribute(worker?.firstName || "")}" />
              </div>
              <div class="field-group">
                <label for="worker-last-name">Last name</label>
                <input id="worker-last-name" name="lastName" type="text" value="${escapeAttribute(worker?.lastName || "")}" />
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="worker-phone">Phone</label>
                <input id="worker-phone" name="phone" type="text" value="${escapeAttribute(worker?.phone || "")}" />
              </div>
              <div class="field-group">
                <label for="worker-email">Email (optional)</label>
                <input id="worker-email" name="email" type="email" value="${escapeAttribute(worker?.email || "")}" placeholder="Optional contact email" />
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="worker-client">Client</label>
                <select id="worker-client" name="assignedClientId">
                  ${scoped.clients.map(client => `<option value="${escapeHtml(client.id)}" ${worker?.assignedClientId === client.id ? "selected" : ""}>${escapeHtml(client.name)}</option>`).join("")}
                </select>
              </div>
              <div class="field-group">
                <label for="worker-site">Site</label>
                <select id="worker-site" name="assignedSiteId">
                  ${scoped.sites.map(site => `<option value="${escapeHtml(site.id)}" ${worker?.assignedSiteId === site.id ? "selected" : ""}>${escapeHtml(site.name)}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="worker-pay-rate">Pay rate</label>
                <input id="worker-pay-rate" name="payRate" type="number" step="0.01" value="${escapeAttribute(String(worker?.payRate || 0))}" />
              </div>
              <div class="field-group">
                <label for="worker-status">Status</label>
                <select id="worker-status" name="status">
                  <option value="active" ${worker?.status !== "inactive" ? "selected" : ""}>Active</option>
                  <option value="inactive" ${worker?.status === "inactive" ? "selected" : ""}>Inactive</option>
                </select>
              </div>
            </div>
            <div class="field-group">
              <label for="worker-notes">Notes</label>
              <textarea id="worker-notes" name="notes">${escapeHtml(worker?.notes || "")}</textarea>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="worker-note-type">Worker note type</label>
                <select id="worker-note-type" name="workerNoteType">
                  ${renderStaticOptions(["", "general", "best", "terminated"], normalizeWorkerNoteType(worker?.workerNoteType || ""), value => {
                    if (!value) {
                      return "No special note";
                    }
                    return getWorkerNoteLabel(value);
                  })}
                </select>
              </div>
              <div class="field-group">
                <label for="worker-termination-reason">If fired or ended, reason</label>
                <input id="worker-termination-reason" name="terminationReason" type="text" value="${escapeAttribute(worker?.terminationReason || "")}" placeholder="Example: Client requested removal after repeated no-show." />
              </div>
            </div>
            <div class="modal-actions">
              <button class="button button-primary" type="submit">Save Worker</button>
              <button class="button button-ghost" data-action="close-modal" type="button">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderWorkerViewModal() {
    const worker = getScopedData().workers.find(item => item.id === state.modal.workerId);
    if (!worker) {
      return "";
    }
    const punchState = getWorkerPunchState(worker.id, getScopedData());
    return `
      <div class="modal">
        <div class="modal-card small">
          <div class="modal-head">
            <div>
              <p class="eyebrow">Worker</p>
              <h3>${escapeHtml(fullName(worker))}</h3>
            </div>
            <button class="modal-close" data-action="close-modal" type="button">Close</button>
          </div>
          <div class="detail-grid">
            ${renderDetailBox("Status", punchState.label)}
            ${renderDetailBox("Client", getClientName(worker.assignedClientId))}
            ${renderDetailBox("Site", getSiteName(worker.assignedSiteId))}
            ${renderDetailBox("Pay rate", formatCurrency(worker.payRate))}
            ${renderDetailBox("Phone", worker.phone || "-")}
            ${renderDetailBox("Email", worker.email || "-")}
          </div>
          ${getWorkerPrimaryNote(worker) ? `
            <div class="support-card" style="margin-top: 18px;">
              <p class="eyebrow">Manager Note</p>
              <h3>${escapeHtml(getWorkerNoteLabel(worker.workerNoteType) || "General note")}</h3>
              <p>${escapeHtml(getWorkerPrimaryNote(worker))}</p>
            </div>
          ` : ""}
          ${renderWorkerHoursSummaryCard(worker.id, {
            eyebrow: "Hours Worked",
            title: "Overall hours by company",
            copy: "See the processed hours tied to each company for this worker.",
            cardClass: "support-card"
          })}
        </div>
      </div>
    `;
  }

  function renderWorkerHistoryModal() {
    const worker = getScopedData().workers.find(item => item.id === state.modal.workerId);
    if (!worker) {
      return "";
    }
    const punches = getWorkerPunches(worker.id, getScopedData().punches).slice().reverse();
    return `
      <div class="modal">
        <div class="modal-card">
          <div class="modal-head">
            <div>
              <p class="eyebrow">Punch History</p>
              <h3>${escapeHtml(fullName(worker))}</h3>
            </div>
            <button class="modal-close" data-action="close-modal" type="button">Close</button>
          </div>
          ${punches.length ? `
            <div class="history-timeline">
              ${punches.map(punch => `
                <div class="history-timeline-item">
                  <strong>${escapeHtml(PUNCH_LABELS[punch.action] || punch.action)}</strong>
                  <span class="helper-copy">${escapeHtml(formatDateTime(punch.timestamp))}</span>
                </div>
              `).join("")}
            </div>
          ` : `<p class="helper-copy">No punch history is available yet.</p>`}
        </div>
      </div>
    `;
  }

  function renderClientFormModal() {
    const client = state.modal.clientId ? getScopedData().clients.find(item => item.id === state.modal.clientId) : null;
    const agencies = getScopedData().agencies.length ? getScopedData().agencies : state.cache.agencies;
    return `
      <div class="modal">
        <div class="modal-card">
          <div class="modal-head">
            <div>
              <p class="eyebrow">${client ? "Edit Client" : "Add Client"}</p>
              <h3>${client ? "Update client details" : "Create a new client"}</h3>
            </div>
            <button class="modal-close" data-action="close-modal" type="button">Close</button>
          </div>
          <form class="form-grid" data-form="client-save">
            <input name="id" type="hidden" value="${escapeAttribute(client?.id || "")}" />
            ${state.session.role === "platformOwner" ? `
              <div class="field-group">
                <label for="client-agency">Agency</label>
                <select id="client-agency" name="agencyId">
                  ${renderSelectOptions(agencies, client?.agencyId || "", "Select agency")}
                </select>
              </div>
            ` : ""}
            <div class="field-group">
              <label for="client-name">Client name</label>
              <input id="client-name" name="name" type="text" value="${escapeAttribute(client?.name || "")}" />
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="client-contact-name">Contact name</label>
                <input id="client-contact-name" name="contactName" type="text" value="${escapeAttribute(client?.contactName || "")}" />
              </div>
              <div class="field-group">
                <label for="client-phone">Phone</label>
                <input id="client-phone" name="phone" type="text" value="${escapeAttribute(client?.phone || "")}" />
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="client-email">Contact email</label>
                <input id="client-email" name="contactEmail" type="email" value="${escapeAttribute(client?.contactEmail || "")}" />
              </div>
              <div class="field-group">
                <label for="client-status">Status</label>
                <select id="client-status" name="status">
                  <option value="active" ${client?.status !== "inactive" ? "selected" : ""}>Active</option>
                  <option value="inactive" ${client?.status === "inactive" ? "selected" : ""}>Inactive</option>
                </select>
              </div>
            </div>
            <div class="field-group">
              <label for="client-billing-contact">Billing contact</label>
              <input id="client-billing-contact" name="billingContact" type="text" value="${escapeAttribute(client?.billingContact || "")}" />
            </div>
            <div class="field-group">
              <label for="client-notes">Notes</label>
              <textarea id="client-notes" name="notes">${escapeHtml(client?.notes || "")}</textarea>
            </div>
            <div class="field-group">
              <label for="client-internal-notes">Internal notes</label>
              <textarea id="client-internal-notes" name="internalNotes">${escapeHtml(client?.internalNotes || "")}</textarea>
            </div>
            <div class="field-group">
              <label for="client-visible-notes">Client-visible notes</label>
              <textarea id="client-visible-notes" name="clientVisibleNotes">${escapeHtml(client?.clientVisibleNotes || "")}</textarea>
            </div>
            <div class="modal-actions">
              <button class="button button-primary" type="submit">Save Client</button>
              <button class="button button-ghost" data-action="close-modal" type="button">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderSiteFormModal() {
    const site = state.modal.siteId ? getScopedData().sites.find(item => item.id === state.modal.siteId) : null;
    const clients = getScopedData().clients;
    const agencies = getScopedData().agencies.length ? getScopedData().agencies : state.cache.agencies;
    return `
      <div class="modal">
        <div class="modal-card">
          <div class="modal-head">
            <div>
              <p class="eyebrow">${site ? "Edit Site" : "Add Site"}</p>
              <h3>${site ? "Update site details" : "Create a new site"}</h3>
            </div>
            <button class="modal-close" data-action="close-modal" type="button">Close</button>
          </div>
          <form class="form-grid" data-form="site-save">
            <input name="id" type="hidden" value="${escapeAttribute(site?.id || "")}" />
            ${state.session.role === "platformOwner" ? `
              <div class="field-group">
                <label for="site-agency">Agency</label>
                <select id="site-agency" name="agencyId">
                  ${renderSelectOptions(agencies, site?.agencyId || "", "Select agency")}
                </select>
              </div>
            ` : ""}
            <div class="field-group">
              <label for="site-client">Client</label>
              <select id="site-client" name="clientId">
                ${clients.map(client => `<option value="${escapeHtml(client.id)}" ${site?.clientId === client.id ? "selected" : ""}>${escapeHtml(client.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field-group">
              <label for="site-name">Site name</label>
              <input id="site-name" name="name" type="text" value="${escapeAttribute(site?.name || "")}" />
            </div>
            <div class="field-group">
              <label for="site-address">Address</label>
              <input id="site-address" name="address" type="text" value="${escapeAttribute(site?.address || "")}" />
            </div>
            <div class="form-row three">
              <div class="field-group">
                <label for="site-city">City</label>
                <input id="site-city" name="city" type="text" value="${escapeAttribute(site?.city || "")}" />
              </div>
              <div class="field-group">
                <label for="site-state">State</label>
                <input id="site-state" name="state" type="text" value="${escapeAttribute(site?.state || "")}" />
              </div>
              <div class="field-group">
                <label for="site-zip">ZIP</label>
                <input id="site-zip" name="zip" type="text" value="${escapeAttribute(site?.zip || "")}" />
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="site-contact">Site contact</label>
                <input id="site-contact" name="siteContact" type="text" value="${escapeAttribute(site?.siteContact || "")}" />
              </div>
              <div class="field-group">
                <label for="site-phone">Site phone</label>
                <input id="site-phone" name="sitePhone" type="text" value="${escapeAttribute(site?.sitePhone || "")}" />
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="site-status">Status</label>
                <select id="site-status" name="status">
                  <option value="active" ${site?.status !== "inactive" ? "selected" : ""}>Active</option>
                  <option value="inactive" ${site?.status === "inactive" ? "selected" : ""}>Inactive</option>
                </select>
              </div>
              <div class="field-group">
                <label for="site-qr-url">QR link override</label>
                <input id="site-qr-url" name="qrCodeUrl" type="text" value="${escapeAttribute(site?.qrCodeUrl || "")}" placeholder="${escapeAttribute(buildSiteLink(site?.id || "site_example", {
                  agencyId: site?.agencyId || state.session.agencyId || state.session.agency?.id || "",
                  clientId: site?.clientId || ""
                }))}" />
              </div>
            </div>
            <div class="field-group">
              <label for="site-notes">Notes</label>
              <textarea id="site-notes" name="notes">${escapeHtml(site?.notes || "")}</textarea>
            </div>
            <div class="modal-actions">
              <button class="button button-primary" type="submit">Save Site</button>
              <button class="button button-ghost" data-action="close-modal" type="button">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderPayrollEditModal() {
    const timesheet = getScopedData().timesheets.find(item => item.id === state.modal.timesheetId);
    if (!timesheet) {
      return "";
    }
    const payRate = Number(timesheet.payRate || getWorker(timesheet.workerId)?.payRate || 0);
    const scoped = getScopedData();
    return `
      <div class="modal">
        <div class="modal-card">
          <div class="modal-head">
            <div>
              <p class="eyebrow">Edit Payroll</p>
              <h3>${escapeHtml(getWorkerName(timesheet.workerId))}</h3>
            </div>
            <button class="modal-close" data-action="close-modal" type="button">Close</button>
          </div>
          <form class="form-grid" data-form="payroll-save">
            <input name="id" type="hidden" value="${escapeAttribute(timesheet.id)}" />
            <div class="form-row three">
              <div class="field-group">
                <label for="timesheet-worker">Worker</label>
                <select id="timesheet-worker" name="workerId">
                  ${renderSelectOptions(scoped.workers, timesheet.workerId, "Select worker")}
                </select>
              </div>
              <div class="field-group">
                <label for="timesheet-client">Client</label>
                <select id="timesheet-client" name="clientId">
                  ${renderSelectOptions(scoped.clients, timesheet.clientId, "Select client")}
                </select>
              </div>
              <div class="field-group">
                <label for="timesheet-site">Site</label>
                <select id="timesheet-site" name="siteId">
                  ${renderSelectOptions(scoped.sites, timesheet.siteId, "Select site")}
                </select>
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="timesheet-approved-hours">Approved hours</label>
                <input id="timesheet-approved-hours" name="approvedHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.approvedHours || 0))}" />
              </div>
              <div class="field-group">
                <label for="timesheet-status">Status</label>
                <select id="timesheet-status" name="status">
                  <option value="pending" ${timesheet.status === "pending" ? "selected" : ""}>Pending</option>
                  <option value="approved" ${timesheet.status === "approved" ? "selected" : ""}>Approved</option>
                  <option value="rejected" ${timesheet.status === "rejected" ? "selected" : ""}>Rejected</option>
                </select>
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="timesheet-regular-hours">Regular hours</label>
                <input id="timesheet-regular-hours" name="regularHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.regularHours || 0))}" />
              </div>
              <div class="field-group">
                <label for="timesheet-overtime-hours">Overtime hours</label>
                <input id="timesheet-overtime-hours" name="overtimeHours" type="number" step="0.01" value="${escapeAttribute(String(timesheet.overtimeHours || 0))}" />
              </div>
            </div>
            <div class="form-row two">
              <div class="field-group">
                <label for="timesheet-pay-rate">Pay rate</label>
                <input id="timesheet-pay-rate" name="payRate" type="number" step="0.01" value="${escapeAttribute(String(payRate))}" />
              </div>
              <div class="field-group">
                <label for="timesheet-admin-notes">Admin notes</label>
                <textarea id="timesheet-admin-notes" name="adminNotes">${escapeHtml(timesheet.adminNotes || "")}</textarea>
              </div>
            </div>
            <div class="field-group">
              <label for="timesheet-client-notes">Client notes</label>
              <textarea id="timesheet-client-notes" name="clientNotes">${escapeHtml(timesheet.clientNotes || "")}</textarea>
            </div>
            <div class="modal-actions">
              <button class="button button-primary" type="submit">Save Row</button>
              <button class="button button-ghost" data-action="close-modal" type="button">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderRejectNoteModal() {
    return `
      <div class="modal">
        <div class="modal-card small">
          <div class="modal-head">
            <div>
              <p class="eyebrow">Reject Timesheet</p>
              <h3>Add a note for the rejection</h3>
            </div>
            <button class="modal-close" data-action="close-modal" type="button">Close</button>
          </div>
          <form class="form-grid" data-form="reject-note">
            <div class="field-group">
              <label for="reject-note">Note</label>
              <textarea id="reject-note" name="note" placeholder="Tell the worker or agency what needs to be fixed."></textarea>
            </div>
            <div class="modal-actions">
              <button class="button button-danger" type="submit">Reject with Note</button>
              <button class="button button-ghost" data-action="close-modal" type="button">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderSidebarNav() {
    const allowed = getAllowedRoutes();
    return NAV_ITEMS
      .filter(item => item.roles.includes(state.session.role) && allowed.has(item.id))
      .map(item => `
        <button class="nav-item ${state.route === item.id ? "is-active" : ""}" data-action="go-route" data-route="${escapeHtml(item.id)}" type="button">
          <span class="nav-badge">${escapeHtml(item.badge)}</span>
          <span>${escapeHtml(item.label)}</span>
        </button>
      `)
      .join("");
  }

  function renderTopbarButtons() {
    if (state.route === "dashboard" && (state.session.role === "agencyOwner" || state.session.role === "agencyAdmin")) {
      return `
        <button class="button button-secondary" data-action="go-route" data-route="approvals" type="button">Review Timesheets</button>
        <button class="button button-ghost" data-action="go-route" data-route="payroll" type="button">Export Payroll</button>
      `;
    }

    if (state.route === "billing" && state.session.mode === "cloud") {
      return `<button class="button button-secondary" data-action="manage-billing" type="button">Manage Billing</button>`;
    }

    return "";
  }

  function renderNoticeBanner() {
    if (!state.notice) {
      return "";
    }
    return `
      <div class="notice-card">
        <div>
          <strong>Update</strong>
          <p>${escapeHtml(state.notice)}</p>
        </div>
        <button class="button button-ghost" data-action="dismiss-notice" type="button">Dismiss</button>
      </div>
    `;
  }

  function renderModeWarnings() {
    const queuedPunches = state.session.mode === "cloud"
      ? getOfflinePunchQueueForAgency(state.session.agencyId || state.session.agency?.id || "")
      : [];
    const connectivityBanner = !state.network.isOnline
      ? `
        <div class="notice-card warning">
          <div>
            <strong>You are offline.</strong>
            <p>Portaly will keep the current page open and queue supported worker punches in this browser until the connection returns.</p>
          </div>
        </div>
      `
      : queuedPunches.length
        ? `
          <div class="notice-card">
            <div>
              <strong>${queuedPunches.length} queued punch${queuedPunches.length === 1 ? "" : "es"} waiting to sync</strong>
              <p>Portaly saved worker punch activity locally and will push it to Cloud Mode automatically when the connection is stable.</p>
            </div>
          </div>
        `
        : "";

    if (state.session.mode === "demo") {
      return `
        ${connectivityBanner}
        <div class="notice-card warning">
          <div>
            <strong>Demo Mode: data only saves in this browser</strong>
            <p>Use Cloud Mode with Firebase Authentication and Firestore when you want live agency data that syncs across devices.</p>
          </div>
        </div>
      `;
    }

    if (state.session.mode === "cloud") {
      const agency = getCurrentAgency();
      const trialNotice = agency?.subscriptionStatus === "trialing"
        ? `
          <div class="notice-card warning">
            <div>
              <strong>You have ${Math.max(getTrialDaysRemaining(), 0)} days left in your free trial.</strong>
              <p>Upgrade to a paid subscription before the trial ends to keep worker, payroll, and approval workflows live.</p>
            </div>
            ${state.session.role === "agencyOwner" ? `<button class="button button-secondary" data-action="go-route" data-route="billing" type="button">Open Billing</button>` : ""}
          </div>
        `
        : "";

      return `
        ${connectivityBanner}
        ${trialNotice}
        <div class="notice-card">
          <div>
            <strong>Cloud Mode: data syncs across devices</strong>
            <p>Real users, live agency records, and subscription status now come from Firebase and Square payment links.</p>
          </div>
        </div>
      `;
    }

    return connectivityBanner;
  }

  function buildAgencyDashboardMetrics(scoped) {
    const safeScoped = {
      agencies: [],
      users: [],
      clients: [],
      sites: [],
      workers: [],
      assignments: [],
      punches: [],
      punchRequests: [],
      timesheets: [],
      approvals: [],
      payrollRuns: [],
      subscriptions: [],
      auditLogs: [],
      settings: [],
      ...(scoped || {})
    };
    const marginRows = buildMarginRows(safeScoped);
    const grossProfit = sumNumbers(marginRows.map(row => row.grossProfit));
    const revenue = sumNumbers(marginRows.map(row => row.revenue));
    const agency = getCurrentAgency();
    const subscription = getCurrentSubscription();
    return {
      activeWorkers: safeScoped.workers.filter(worker => worker.status !== "inactive").length,
      clockedInNow: buildLivePunchRows(safeScoped).filter(row => row.baseStatusKey === "clocked-in").length,
      onLunch: buildLivePunchRows(safeScoped).filter(row => row.baseStatusKey === "on-lunch").length,
      missingClockOuts: buildLivePunchRows(safeScoped).filter(row => row.exception === "Missing clock out").length,
      pendingPunchRequests: safeScoped.punchRequests.filter(request => request.status === "pending").length,
      pendingApprovals: safeScoped.approvals.filter(approval => approval.status === "pending").length,
      payrollHours: sumNumbers(safeScoped.timesheets.map(timesheet => timesheet.approvedHours || 0)),
      grossProfit,
      marginPercent: revenue ? (grossProfit / revenue) * 100 : 0,
      activeClients: safeScoped.clients.filter(client => client.status !== "inactive").length,
      activeSites: safeScoped.sites.filter(site => site.status !== "inactive").length,
      subscriptionStatus: subscription?.status || agency?.subscriptionStatus || "trialing"
    };
  }

  function buildLivePunchRows(scoped) {
    return scoped.workers.map(worker => {
      const punchState = getWorkerPunchState(worker.id, scoped);
      const lastPunch = getWorkerLatestPunch(worker.id, scoped.punches);
      const hoursToday = calculateHoursFromPunches(getWorkerPunchesForToday(worker.id, scoped.punches), state.now);
      const exception = buildWorkerException(worker.id, scoped);
      return {
        workerId: worker.id,
        workerName: fullName(worker),
        clientId: worker.assignedClientId,
        clientName: getClientName(worker.assignedClientId),
        siteId: worker.assignedSiteId,
        siteName: getSiteName(worker.assignedSiteId),
        lastPunchId: lastPunch?.id || "",
        lastActionLabel: lastPunch ? PUNCH_LABELS[lastPunch.action] || lastPunch.action : "No punch yet",
        lastPunchTime: lastPunch ? formatDateTime(lastPunch.timestamp) : "-",
        statusLabel: punchState.label,
        statusKey: exception === "Missing clock out" ? "missing-clock-out" : punchState.statusKey,
        baseStatusKey: punchState.statusKey,
        hoursToday: formatHours(hoursToday),
        exception
      };
    });
  }

  function buildMarginRows(scoped) {
    return scoped.timesheets.map(timesheet => {
      const assignment = scoped.assignments.find(item => item.id === timesheet.assignmentId) || scoped.assignments.find(item => item.workerId === timesheet.workerId) || null;
      const worker = scoped.workers.find(item => item.id === timesheet.workerId) || null;
      const payRate = Number(timesheet.payRate || assignment?.payRate || worker?.payRate || 0);
      const billRate = Number(assignment?.billRate || 0);
      const regularHours = Number(timesheet.regularHours || 0);
      const overtimeHours = Number(timesheet.overtimeHours || 0);
      const hours = regularHours + overtimeHours;
      const revenue = billRate * hours;
      const laborCost = calculateLaborCost(regularHours, overtimeHours, payRate);
      const grossProfit = revenue - laborCost;
      const marginPercent = revenue ? (grossProfit / revenue) * 100 : 0;
      return {
        assignmentId: assignment?.id || "",
        timesheetId: timesheet.id,
        workerName: getWorkerName(timesheet.workerId),
        clientName: getClientName(timesheet.clientId),
        siteName: getSiteName(timesheet.siteId),
        payRate,
        billRate,
        hours,
        revenue,
        laborCost,
        grossProfit,
        marginPercent
      };
    });
  }

  function buildPayrollSummary(timesheets) {
    return {
      approvedHours: sumNumbers(timesheets.map(timesheet => timesheet.approvedHours || 0)),
      regularHours: sumNumbers(timesheets.map(timesheet => timesheet.regularHours || 0)),
      overtimeHours: sumNumbers(timesheets.map(timesheet => timesheet.overtimeHours || 0)),
      totalLaborCost: sumNumbers(timesheets.map(timesheet => calculateLaborCost(
        timesheet.regularHours,
        timesheet.overtimeHours,
        Number(timesheet.payRate || getWorker(timesheet.workerId)?.payRate || 0)
      )))
    };
  }

  function buildAttentionItems(scoped) {
    return buildExceptionItems(scoped).map(exception => ({
      title: exception.title,
      detail: exception.detail,
      label: exception.kind,
      tone: exception.tone
    }));
  }

  function buildExceptionItems(scoped) {
    const items = [];
    const liveRows = buildLivePunchRows(scoped);

    liveRows.forEach(row => {
      if (row.statusKey === "missing-clock-out") {
        items.push({
          title: `${row.workerName} is still open on the clock`,
          detail: `${row.siteName} has a worker with no clock out on file yet.`,
          kind: "Missing clock out",
          tone: "status-warning"
        });
      }

      if (row.statusKey === "on-lunch") {
        items.push({
          title: `${row.workerName} started lunch but never ended it`,
          detail: `Review the lunch punch on ${row.siteName}.`,
          kind: "Lunch started but not ended",
          tone: "status-warning"
        });
      }

      if (row.exception === "Late punch") {
        items.push({
          title: `${row.workerName} clocked in late`,
          detail: `The first punch today came in after the scheduled start time.`,
          kind: "Late punch",
          tone: "status-warning"
        });
      }

      if (row.exception === "Duplicate punch") {
        items.push({
          title: `${row.workerName} has a duplicate punch`,
          detail: `Two matching actions were captured too close together.`,
          kind: "Duplicate punch",
          tone: "status-danger"
        });
      }
    });

    scoped.timesheets.filter(timesheet => timesheet.status === "pending").forEach(timesheet => {
      items.push({
        title: `${getWorkerName(timesheet.workerId)} is still waiting on approval`,
        detail: `${getClientName(timesheet.clientId)} has not approved this timesheet yet.`,
        kind: "Pending approval",
        tone: "status-warning"
      });
    });

    scoped.timesheets.filter(timesheet => timesheet.status === "rejected").forEach(timesheet => {
      items.push({
        title: `${getWorkerName(timesheet.workerId)} timesheet was rejected`,
        detail: timesheet.adminNotes || "Review the rejection note before payroll.",
        kind: "Rejected timesheet",
        tone: "status-danger"
      });
    });

    scoped.punches.filter(punch => punch.edited).forEach(punch => {
      items.push({
        title: `${getWorkerName(punch.workerId)} has a manual edit`,
        detail: punch.notes || "A punch was manually adjusted and should be reviewed.",
        kind: "Manual edit made",
        tone: "status-warning"
      });
    });

    scoped.punchRequests.filter(request => request.status === "pending").forEach(request => {
      items.push({
        title: `${request.workerName || "Worker"} submitted a punch request`,
        detail: `${request.siteName || "Site"} needs ${formatStatusLabel(request.requestedAction || "punch")} review.`,
        kind: "Punch request waiting",
        tone: "status-warning"
      });
    });

    return items;
  }

  function buildWorkerException(workerId, scoped) {
    const punches = getWorkerPunchesForToday(workerId, scoped.punches);
    const hasDuplicate = punches.some((punch, index) => {
      const next = punches[index + 1];
      return next && next.action === punch.action && Math.abs(new Date(next.timestamp) - new Date(punch.timestamp)) <= 5 * 60 * 1000;
    });
    if (hasDuplicate) {
      return "Duplicate punch";
    }

    const firstClockIn = punches.find(punch => punch.action === "clockIn");
    if (firstClockIn) {
      const start = new Date(firstClockIn.timestamp);
      if (start.getHours() > 7 || (start.getHours() === 7 && start.getMinutes() > 5)) {
        return "Late punch";
      }
    }

    const status = getWorkerPunchState(workerId, scoped);
    if (status.key === "clocked-in") {
      return "Missing clock out";
    }
    if (status.statusKey === "on-lunch") {
      return "No lunch recorded";
    }
    return "";
  }

  function getScopedData() {
    const source = state.session.mode === "demo" ? state.demoStore : state.cache;
    if (state.session.mode === "public" || !state.session.role) {
      return emptyStore();
    }

    if (state.session.role === "platformOwner") {
      return deepClone(source);
    }

    const agencyId = state.session.agencyId || state.session.agency?.id;
    const filterAgency = rows => (rows || []).filter(row => !row.agencyId || row.agencyId === agencyId);
    const scoped = {
      agencies: (source.agencies || []).filter(agency => agency.id === agencyId),
      users: filterAgency(source.users),
      clientInvites: filterAgency(source.clientInvites),
      clients: filterAgency(source.clients),
      sites: filterAgency(source.sites),
      workers: filterAgency(source.workers),
      assignments: filterAgency(source.assignments),
      punches: filterAgency(source.punches),
      punchRequests: filterAgency(source.punchRequests),
      timesheets: filterAgency(source.timesheets),
      approvals: filterAgency(source.approvals),
      payrollRuns: filterAgency(source.payrollRuns),
      subscriptions: filterAgency(source.subscriptions),
      auditLogs: filterAgency(source.auditLogs),
      settings: filterAgency(source.settings)
    };

    if (state.session.mode === "cloud") {
      const queuedPunches = getOfflinePunchQueueForAgency(agencyId);
      if (queuedPunches.length) {
        const existingPunchIds = new Set((scoped.punches || []).map(row => row.id));
        scoped.punches = [...(scoped.punches || []), ...queuedPunches.filter(row => !existingPunchIds.has(row.id))];
      }
    }

    if (state.session.role === "worker") {
      return {
        ...scoped,
        users: scoped.users.filter(user => user.id === state.session.userId),
        workers: scoped.workers.filter(worker => worker.id === state.session.workerId),
        punches: scoped.punches.filter(punch => punch.workerId === state.session.workerId),
        punchRequests: [],
        timesheets: scoped.timesheets.filter(timesheet => timesheet.workerId === state.session.workerId),
        approvals: scoped.approvals.filter(approval => approval.workerId === state.session.workerId),
        clientInvites: [],
        clients: scoped.clients.filter(client => client.id === getCurrentWorkerFrom(scoped)?.assignedClientId),
        sites: scoped.sites.filter(site => site.id === getCurrentWorkerFrom(scoped)?.assignedSiteId),
        assignments: [],
        subscriptions: []
      };
    }

    if (state.session.role === "clientManager") {
      const clientIds = state.session.assignedClientIds || [];
      const siteIds = state.session.assignedSiteIds || [];
      const filterAssigned = rows => rows.filter(row => clientIds.includes(row.clientId || row.assignedClientId) || siteIds.includes(row.siteId || row.assignedSiteId));
      return {
        ...scoped,
        users: scoped.users.filter(user => user.id === state.session.userId),
        clients: scoped.clients.filter(client => clientIds.includes(client.id)),
        sites: scoped.sites.filter(site => siteIds.includes(site.id)),
        workers: filterAssigned(scoped.workers),
        punches: filterAssigned(scoped.punches),
        punchRequests: filterAssigned(scoped.punchRequests),
        timesheets: filterAssigned(scoped.timesheets),
        approvals: filterAssigned(scoped.approvals),
        clientInvites: [],
        assignments: [],
        payrollRuns: [],
        subscriptions: [],
        auditLogs: []
      };
    }

    return scoped;
  }

  function getCurrentAgency() {
    const scoped = getScopedData();
    const sessionAgencyId = state.session.agencyId || state.session.agency?.id;
    return scoped.agencies.find(agency => agency.id === sessionAgencyId)
      || state.session.agency
      || state.cache.agencies.find(agency => agency.id === sessionAgencyId)
      || state.demoStore.agencies.find(agency => agency.id === sessionAgencyId)
      || null;
  }

  function getCurrentSubscription() {
    const scoped = getScopedData();
    const sessionAgencyId = state.session.agencyId || state.session.agency?.id;
    return (scoped.subscriptions || []).find(subscription => subscription.agencyId === sessionAgencyId) || null;
  }

  function getCurrentSettings() {
    const scoped = getScopedData();
    const sessionAgencyId = state.session.agencyId || state.session.agency?.id;
    return (scoped.settings || []).find(setting => setting.agencyId === sessionAgencyId || setting.id === sessionAgencyId)
      || scoped.settings[0]
      || null;
  }

  function getClientInvites(clientId = "", siteId = "") {
    const invites = (getScopedData().clientInvites || []).filter(Boolean);
    return invites.filter(invite => {
      const inviteClientIds = Array.isArray(invite.assignedClientIds) ? invite.assignedClientIds : [];
      const inviteSiteIds = Array.isArray(invite.assignedSiteIds) ? invite.assignedSiteIds : [];
      if (clientId && inviteClientIds.includes(clientId)) {
        return true;
      }
      if (siteId && inviteSiteIds.includes(siteId)) {
        return true;
      }
      return !clientId && !siteId;
    });
  }

  function getCurrentWorker() {
    return getCurrentWorkerFrom(getScopedData());
  }

  function getCurrentWorkerFrom(scoped) {
    return scoped.workers.find(worker => worker.id === state.session.workerId) || scoped.workers[0] || null;
  }

  function getWorker(workerId) {
    const scoped = getScopedData();
    return scoped.workers.find(worker => worker.id === workerId) || state.demoStore.workers.find(worker => worker.id === workerId) || null;
  }

  function getSite(siteId) {
    const scoped = getScopedData();
    return scoped.sites.find(site => site.id === siteId)
      || state.demoStore.sites.find(site => site.id === siteId)
      || state.cache.sites.find(site => site.id === siteId)
      || null;
  }

  function getAssignmentsForWorker(workerId) {
    return getScopedData().assignments.filter(assignment => assignment.workerId === workerId && assignment.status !== "inactive");
  }

  function getWorkerName(workerId) {
    const worker = getWorker(workerId);
    if (worker) {
      return fullName(worker);
    }

    const scoped = getScopedData();
    const embedded = []
      .concat(scoped.timesheets || [], scoped.approvals || [], scoped.punches || [])
      .find(row => row.workerId === workerId && (row.workerName || row.workerDisplayName));

    return embedded?.workerName || embedded?.workerDisplayName || "Unknown Worker";
  }

  function getUserName(userId) {
    const scoped = getScopedData();
    const user = scoped.users.find(item => item.id === userId)
      || state.cache.users.find(item => item.id === userId)
      || state.demoStore.users.find(item => item.id === userId);
    return user ? fullName(user) || user.email || user.id : "Unknown User";
  }

  function getClientName(clientId) {
    const scoped = getScopedData();
    const client = scoped.clients.find(item => item.id === clientId)
      || state.demoStore.clients.find(item => item.id === clientId)
      || state.cache.clients.find(item => item.id === clientId);
    return client ? client.name : "Unknown Client";
  }

  function getSiteName(siteId) {
    const scoped = getScopedData();
    const site = scoped.sites.find(item => item.id === siteId)
      || state.demoStore.sites.find(item => item.id === siteId)
      || state.cache.sites.find(item => item.id === siteId);
    return site ? site.name : "Unknown Site";
  }

  function getAgencyName(agencyId) {
    const agency = state.cache.agencies.find(item => item.id === agencyId)
      || state.demoStore.agencies.find(item => item.id === agencyId);
    return agency ? agency.name : "";
  }

  function getWorkerPunchState(workerId, scoped) {
    const punches = getWorkerPunchesForToday(workerId, scoped.punches);
    const lastPunch = punches[punches.length - 1];
    const allowed = {
      clockIn: false,
      startLunch: false,
      endLunch: false,
      clockOut: false
    };

    if (!lastPunch) {
      allowed.clockIn = true;
      return { key: "not-started", statusKey: "not-started", label: "Not Clocked In", allowed };
    }

    switch (lastPunch.action) {
      case "clockIn":
      case "endLunch":
        allowed.startLunch = true;
        allowed.clockOut = true;
        return { key: "clocked-in", statusKey: "clocked-in", label: "Clocked In", allowed };
      case "startLunch":
        allowed.endLunch = true;
        return { key: "on-lunch", statusKey: "on-lunch", label: "On Lunch", allowed };
      case "clockOut":
        return { key: "clocked-out", statusKey: "clocked-out", label: "Clocked Out", allowed };
      default:
        allowed.clockIn = true;
        return { key: "not-started", statusKey: "not-started", label: "Not Clocked In", allowed };
    }
  }

  function getWorkerLatestPunch(workerId, punches) {
    const todayPunches = getWorkerPunchesForToday(workerId, punches);
    return todayPunches[todayPunches.length - 1] || null;
  }

  function isDuplicatePunchAction(workerId, action, timestamp, ignorePunchId = "") {
    const targetTime = new Date(timestamp).getTime();
    if (!workerId || !action || !Number.isFinite(targetTime)) {
      return false;
    }
    return getWorkerPunches(workerId, getScopedData().punches).some(punch => {
      if (!punch || punch.id === ignorePunchId || punch.action !== action) {
        return false;
      }
      const punchTime = new Date(punch.timestamp).getTime();
      return Number.isFinite(punchTime) && Math.abs(punchTime - targetTime) <= 90 * 1000;
    });
  }

  function getWorkerPunches(workerId, punches) {
    return punches
      .filter(punch => punch.workerId === workerId)
      .slice()
      .sort((left, right) => compareDates(left.timestamp, right.timestamp));
  }

  function getWorkerPunchesForToday(workerId, punches) {
    const today = formatDateInput(state.now);
    return getWorkerPunches(workerId, punches).filter(punch => formatDateInput(new Date(punch.timestamp)) === today);
  }

  function getWorkerPunchesForDate(workerId, punches, dateValue) {
    return getWorkerPunches(workerId, punches).filter(punch => formatDateInput(punch.timestamp) === dateValue);
  }

  function getTimesheetPunches(timesheet, punches) {
    if (!timesheet) {
      return [];
    }
    const start = timesheet.payPeriodStart ? new Date(timesheet.payPeriodStart) : null;
    const end = timesheet.payPeriodEnd ? new Date(timesheet.payPeriodEnd) : null;
    return getWorkerPunches(timesheet.workerId, punches).filter(punch => {
      if (timesheet.clientId && punch.clientId && punch.clientId !== timesheet.clientId) {
        return false;
      }
      if (timesheet.siteId && punch.siteId && punch.siteId !== timesheet.siteId) {
        return false;
      }
      const timestamp = new Date(punch.timestamp);
      if (start && timestamp < start) {
        return false;
      }
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (timestamp > endOfDay) {
          return false;
        }
      }
      return true;
    });
  }

  function calculateHoursFromPunches(punches, now) {
    let hours = 0;
    let clockAnchor = null;

    punches.forEach(punch => {
      const timestamp = new Date(punch.timestamp);
      if (punch.action === "clockIn") {
        clockAnchor = timestamp;
      }
      if (punch.action === "startLunch" && clockAnchor) {
        hours += (timestamp - clockAnchor) / 36e5;
        clockAnchor = null;
      }
      if (punch.action === "endLunch") {
        clockAnchor = timestamp;
      }
      if (punch.action === "clockOut" && clockAnchor) {
        hours += (timestamp - clockAnchor) / 36e5;
        clockAnchor = null;
      }
    });

    if (clockAnchor) {
      hours += (now - clockAnchor) / 36e5;
    }

    return Math.max(hours, 0);
  }

  function getApprovalTimesheets(approvals) {
    const timesheets = getScopedData().timesheets;
    return approvals.map(approval => timesheets.find(timesheet => timesheet.id === approval.timesheetId)).filter(Boolean);
  }

  function buildPunchSummaryText(workerId, punches) {
    const todayPunches = getWorkerPunchesForToday(workerId, punches);
    if (!todayPunches.length) {
      return "No punches today";
    }
    return todayPunches.map(punch => `${PUNCH_LABELS[punch.action]} ${formatTime(punch.timestamp)}`).join(", ");
  }

  function buildTimesheetPunchSummaryText(timesheet, punches) {
    const rows = getTimesheetPunches(timesheet, punches);
    if (!rows.length) {
      return "No punches in this pay period";
    }
    return rows.map(punch => `${PUNCH_LABELS[punch.action]} ${formatDate(punch.timestamp)} ${formatTime(punch.timestamp)}`).join(", ");
  }

  function getUsageStats(scoped, agencyId) {
    const activeWorkers = scoped.workers.filter(worker => worker.status !== "inactive" && (!agencyId || worker.agencyId === agencyId)).length;
    const activeSites = scoped.sites.filter(site => site.status !== "inactive" && (!agencyId || site.agencyId === agencyId)).length;
    return { activeWorkers, activeSites };
  }

  function getPayPeriods(timesheets) {
    const map = new Map();
    timesheets.forEach(timesheet => {
      const key = `${timesheet.payPeriodStart}|${timesheet.payPeriodEnd}`;
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: `${formatDate(timesheet.payPeriodStart)} to ${formatDate(timesheet.payPeriodEnd)}`
        });
      }
    });
    return Array.from(map.values()).sort((left, right) => right.value.localeCompare(left.value));
  }

  function normalizeFilters() {
    const payPeriods = getPayPeriods(getScopedData().timesheets);
    if (!payPeriods.some(period => period.value === state.selectedPayPeriod)) {
      state.selectedPayPeriod = payPeriods[0]?.value || "";
    }
  }

  function getPlanDefinition(planId) {
    return PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.agency;
  }

  function getTrialDaysRemaining() {
    const agency = getCurrentAgency();
    const subscription = getCurrentSubscription();
    const trialEnd = subscription?.trialEnd || agency?.trialEnd;
    if (!trialEnd) {
      return 0;
    }
    const difference = Math.ceil((new Date(trialEnd) - state.now) / 86400000);
    return Math.max(difference, 0);
  }

  function isBillingLocked() {
    return BILLING_LOCK_STATUSES.has(state.session.subscriptionStatus || getCurrentSubscription()?.status || getCurrentAgency()?.subscriptionStatus);
  }

  function getPageTitle() {
    const titles = {
      landing: "Punch Clock",
      punch: "Punch Clock",
      dashboard: "Dashboard",
      workers: "Workers",
      clients: "Clients",
      sites: "Sites",
      assignments: "Assignments",
      "live-punches": "Live Punches",
      approvals: "Approvals",
      "client-approval": "Client Approval",
      payroll: "Payroll",
      margin: "Margin",
      exceptions: "Problems to Fix",
      "qr-codes": "Site QR",
      users: "Users",
      billing: "Billing",
      settings: "Settings"
    };
    return titles[state.route] || "Portaly";
  }

  function getModeBadgeText() {
    if (state.session.mode === "cloud") {
      return "Cloud Mode";
    }
    if (state.session.mode === "demo") {
      return "Demo Mode";
    }
    return "Public Site";
  }

  function getModeBadgeCopy() {
    if (state.session.mode === "cloud") {
      return "Cloud Mode: data syncs across devices";
    }
    if (state.session.mode === "demo") {
      return "Demo Mode: data only saves in this browser";
    }
    return "Public marketing site";
  }

  function getSubscriptionSummaryLine() {
    const agency = getCurrentAgency();
    if (!agency) {
      return "No agency selected";
    }
    if (agency.subscriptionStatus === "trialing") {
      return `Trialing · ${getTrialDaysRemaining()} days left`;
    }
    return `${formatStatusLabel(agency.subscriptionStatus)} · ${getPlanDefinition(agency.planId).label}`;
  }

  function getBrandName() {
    return getCurrentSettings()?.agencyName || getCurrentAgency()?.name || "Portaly";
  }

  function getBrandInitials() {
    return getCurrentSettings()?.logoInitials || initials(getBrandName());
  }

  function getSupportEmail() {
    return getCurrentSettings()?.supportEmail || DEFAULT_SUPPORT_EMAIL;
  }

  function getSupportPhone() {
    return getCurrentSettings()?.supportPhone || DEFAULT_SUPPORT_PHONE;
  }

  function applyTheme(color) {
    const appliedColor = normalizeColor(color || getCurrentSettings()?.primaryColor || getCurrentAgency()?.settings?.primaryColor || DEFAULT_BRAND);
    const rgb = hexToRgb(appliedColor);
    document.documentElement.style.setProperty("--brand", appliedColor);
    document.documentElement.style.setProperty("--brand-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }

  function getWorkerStatusMessage(statusKey) {
    switch (statusKey) {
      case "clocked-in":
        return "You are clocked in";
      case "on-lunch":
        return "Lunch started";
      case "clocked-out":
        return "Your shift is complete";
      default:
        return "You are not clocked in";
    }
  }

  function buildAgencySettings(input) {
    return {
      agencyName: input.agencyName || "Portaly Agency",
      logoInitials: input.logoInitials || initials(input.agencyName || "Portaly"),
      primaryColor: normalizeColor(input.primaryColor || DEFAULT_BRAND),
      supportEmail: input.supportEmail || DEFAULT_SUPPORT_EMAIL,
      supportPhone: input.supportPhone || DEFAULT_SUPPORT_PHONE,
      payrollContact: input.payrollContact || input.supportEmail || DEFAULT_SUPPORT_EMAIL,
      defaultPayPeriod: input.defaultPayPeriod || "Weekly",
      timezone: input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
      weekStartDay: input.weekStartDay || "Monday"
    };
  }

  function renderMetricCard(label, value, foot, badge) {
    return `
      <div class="metric-card">
        <div class="metric-top">
          <div>
            <span class="metric-label">${escapeHtml(label)}</span>
            <strong class="metric-value">${escapeHtml(String(value))}</strong>
            <p class="metric-foot">${escapeHtml(foot)}</p>
          </div>
          <span class="metric-icon">${escapeHtml(badge)}</span>
        </div>
      </div>
    `;
  }

  function renderFeatureCard(title, copy) {
    return `
      <div class="feature-card">
        <div class="card-icon">${escapeHtml(initials(title).slice(0, 2))}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function renderPricingCard(plan, highlight, context = "app") {
    const label = plan.price === null ? "Custom" : `$${plan.price}/month`;
    const marketingActionLabel = plan.id === "enterprise" ? "Request Enterprise" : "Start with Square";
    const action = context === "marketing"
      ? (plan.id === "enterprise"
        ? `<button class="button ${highlight ? "button-primary" : "button-secondary"}" data-action="book-live-demo" type="button">${escapeHtml(marketingActionLabel)}</button>`
        : `<button class="button ${highlight ? "button-primary" : "button-secondary"}" data-action="start-checkout" data-plan="${escapeHtml(plan.id)}" type="button">${escapeHtml(marketingActionLabel)}</button>`)
      : (plan.id === "enterprise"
        ? `<button class="button button-ghost" data-action="start-checkout" data-plan="${escapeHtml(plan.id)}" type="button">Contact Sales</button>`
        : `<button class="button ${highlight ? "button-primary" : "button-secondary"}" data-action="select-plan" data-plan="${escapeHtml(plan.id)}" type="button">${highlight ? "Selected Plan" : "Choose Plan"}</button>`);

    return `
      <div class="pricing-card ${highlight ? "is-highlighted" : ""}">
        ${context === "marketing" && highlight ? `<span class="pricing-recommendation">Recommended</span>` : ""}
        <p class="eyebrow">${escapeHtml(plan.label)}</p>
        <h3>${escapeHtml(plan.label)}</h3>
        <span class="pricing-price">${escapeHtml(label)}</span>
        <ul class="list">
          ${plan.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join("")}
        </ul>
        <div class="page-actions" style="margin-top: 18px;">
          ${action}
          ${context === "marketing" ? `<button class="button button-ghost" data-action="go-route" data-route="trial" type="button">Start 14-Day Trial</button>` : (plan.id !== "enterprise" ? `<button class="button button-ghost" data-action="go-route" data-route="trial" type="button">Start Free Trial</button>` : "")}
        </div>
      </div>
    `;
  }

  function renderFaq(title, copy) {
    return `
      <div class="faq-item">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function renderLandingKpiCard(value, label, copy) {
    return `
      <div class="landing-kpi-card">
        <strong class="landing-kpi-value">${escapeHtml(String(value))}</strong>
        <span class="landing-kpi-label">${escapeHtml(label)}</span>
        <p>${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function renderLandingHighlightCard(title, copy) {
    return `
      <div class="landing-kpi-card">
        <strong class="landing-kpi-label" style="font-size: 1.1rem;">${escapeHtml(title)}</strong>
        <p>${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function renderMarketingScreenshotCard(eyebrow, title, copy, body, footer = "") {
    return `
      <div class="surface-card marketing-screenshot-card">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p class="section-copy">${escapeHtml(copy)}</p>
        <div class="marketing-screenshot-frame">
          ${body}
        </div>
        ${footer ? `<div class="page-actions" style="margin-top: 18px;">${footer}</div>` : ""}
      </div>
    `;
  }

  function renderWorkflowLaneCard(title, copy, items) {
    return `
      <div class="surface-card workflow-lane-card">
        <p class="eyebrow">${escapeHtml(title)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p class="section-copy">${escapeHtml(copy)}</p>
        <ul class="list workflow-lane-list">
          ${(items || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function renderMarketingDemoRoleCard(title, copy, role) {
    const buttonLabel = role === "worker"
      ? "Open Worker Demo"
      : role === "clientManager"
        ? "Open Client Manager Demo"
        : "Open Agency Demo";
    return `
      <div class="surface-card demo-access-card">
        <p class="eyebrow">Interactive Demo</p>
        <h3>${escapeHtml(title)}</h3>
        <p class="section-copy">${escapeHtml(copy)}</p>
        <div class="page-actions" style="margin-top: 18px;">
          <button class="button button-primary" data-action="demo-login" data-role="${escapeHtml(role)}" type="button">${escapeHtml(buttonLabel)}</button>
        </div>
      </div>
    `;
  }

  function calculateMarketingRoi() {
    const workers = Math.max(Number(state.roi.workers || 0), 0);
    const adminHours = Math.max(Number(state.roi.adminHours || 0), 0);
    const disputes = Math.max(Number(state.roi.disputes || 0), 0);
    const monthlyHoursRecovered = adminHours * 4.33 * 0.55;
    const monthlyAdminSavings = monthlyHoursRecovered * 28;
    const monthlyDisputeSavings = disputes * 95;
    const monthlyWorkerVisibilitySavings = workers * 6;
    const monthlySavings = monthlyAdminSavings + monthlyDisputeSavings + monthlyWorkerVisibilitySavings;
    return {
      monthlyHoursRecovered,
      monthlyAdminSavings,
      monthlyDisputeSavings,
      monthlySavings,
      annualSavings: monthlySavings * 12
    };
  }

  function renderRoiMetricCard(label, value, copy) {
    return `
      <div class="metric-card roi-metric-card">
        <span class="metric-label">${escapeHtml(label)}</span>
        <strong class="metric-value">${escapeHtml(String(value))}</strong>
        <p class="metric-foot">${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function renderSubscriptionProviderCard(title, eyebrow, copy, bullets, actionHtml) {
    return `
      <div class="surface-card provider-option-card">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p class="section-copy">${escapeHtml(copy)}</p>
        <ul class="list provider-option-list">
          ${(bullets || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <div class="page-actions" style="margin-top: 18px;">
          ${actionHtml}
        </div>
      </div>
    `;
  }

  function renderDashboardPreviewCard(label, value, copy) {
    return `
      <div class="landing-dashboard-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
        <p>${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function renderFlowStep(number, title, copy) {
    return `
      <div class="flow-step">
        <div class="flow-number">${number}</div>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p class="helper-copy">${escapeHtml(copy)}</p>
        </div>
      </div>
    `;
  }

  function renderCompetitiveComparisonRow(label, spreadsheetValue, genericValue, portalyValue) {
    return `
      <tr>
        <th>${escapeHtml(label)}</th>
        <td>${escapeHtml(spreadsheetValue)}</td>
        <td>${escapeHtml(genericValue)}</td>
        <td>${escapeHtml(portalyValue)}</td>
      </tr>
    `;
  }

  function renderTestimonialCard(quote, name, title) {
    return `
      <div class="feature-card testimonial-card">
        <p class="testimonial-quote">"${escapeHtml(quote)}"</p>
        <strong class="testimonial-name">${escapeHtml(name)}</strong>
        <p class="testimonial-title">${escapeHtml(title)}</p>
      </div>
    `;
  }

  function renderDemoWorkflowCard(title, copy, badge) {
    return `
      <div class="demo-workflow-card">
        <span class="demo-workflow-badge">${escapeHtml(badge)}</span>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(copy)}</p>
        </div>
      </div>
    `;
  }

  function renderTrustBadge(label) {
    return `
      <div class="trust-badge-card">
        <span class="status-badge status-success">Included</span>
        <strong>${escapeHtml(label)}</strong>
      </div>
    `;
  }

  function getMarketingPreviewData() {
    const store = state.demoStore || emptyStore();
    const previewAgency = (store.agencies || [])[0] || null;
    const previewAgencyId = previewAgency?.id || "";
    const filterAgency = rows => (rows || []).filter(row => !row.agencyId || row.agencyId === previewAgencyId);
    const scoped = {
      agencies: previewAgency ? [previewAgency] : [],
      users: filterAgency(store.users),
      clients: filterAgency(store.clients),
      sites: filterAgency(store.sites),
      workers: filterAgency(store.workers),
      assignments: filterAgency(store.assignments),
      punches: filterAgency(store.punches),
      punchRequests: filterAgency(store.punchRequests),
      timesheets: filterAgency(store.timesheets),
      approvals: filterAgency(store.approvals),
      payrollRuns: filterAgency(store.payrollRuns),
      subscriptions: filterAgency(store.subscriptions),
      auditLogs: filterAgency(store.auditLogs),
      settings: filterAgency(store.settings)
    };
    const metrics = buildAgencyDashboardMetrics(scoped);
    const liveRows = buildLivePunchRows(scoped);
    const featuredRow = liveRows.find(row => row.baseStatusKey === "clocked-in" || row.baseStatusKey === "on-lunch") || liveRows[0] || null;
    const featuredWorker = featuredRow ? scoped.workers.find(worker => worker.id === featuredRow.workerId) : scoped.workers[0];
    const featuredPunchState = featuredWorker ? getWorkerPunchState(featuredWorker.id, scoped) : {
      key: "not-started",
      statusKey: "not-started",
      label: "Not Clocked In",
      allowed: {
        clockIn: true,
        startLunch: false,
        endLunch: false,
        clockOut: false
      }
    };
    const featuredClientName = featuredWorker?.assignedClientId ? getClientNameFromStore(featuredWorker.assignedClientId, scoped.clients) : "Client Site";
    const featuredSiteName = featuredWorker?.assignedSiteId ? getSiteNameFromStore(featuredWorker.assignedSiteId, scoped.sites) : "Warehouse Site";
    return {
      agencyName: previewAgency?.name || "Portaly Demo Agency",
      workerName: featuredWorker ? fullName(featuredWorker) : "Shift worker",
      clientName: featuredClientName,
      siteName: featuredSiteName,
      currentTime: formatDateTime(state.now),
      statusLabel: featuredPunchState.label || "Ready to Punch",
      statusKey: featuredPunchState.statusKey || "not-started",
      statusTone: featuredPunchState.statusKey === "on-lunch" ? "status-warning" : featuredPunchState.statusKey === "clocked-in" ? "status-success" : "status-neutral",
      allowed: featuredPunchState.allowed,
      metrics: {
        activeWorkers: metrics.activeWorkers,
        clockedInToday: scoped.workers.filter(worker => getWorkerPunchesForToday(worker.id, scoped.punches).length > 0).length,
        pendingApprovals: metrics.pendingApprovals,
        openAssignments: scoped.assignments.filter(assignment => String(assignment.status || "").toLowerCase() !== "ended").length,
        hoursThisWeek: sumNumbers(scoped.timesheets.map(timesheet => {
          const approvedHours = Number(timesheet.approvedHours || 0);
          if (approvedHours) {
            return approvedHours;
          }
          return Number(timesheet.regularHours || 0) + Number(timesheet.overtimeHours || 0);
        }))
      }
    };
  }

  function getClientNameFromStore(clientId, clients) {
    const client = (clients || []).find(item => item.id === clientId);
    return client ? client.name : "Unknown Client";
  }

  function getSiteNameFromStore(siteId, sites) {
    const site = (sites || []).find(item => item.id === siteId);
    return site ? site.name : "Unknown Site";
  }

  function renderDemoRoleCard(title, copy, role) {
    return `
      <div class="auth-card">
        <p class="eyebrow">${escapeHtml(title)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(copy)}</p>
        <div class="page-actions" style="margin-top: 16px;">
          <button class="button button-primary" data-action="demo-login" data-role="${escapeHtml(role)}" type="button">Demo as ${escapeHtml(title)}</button>
        </div>
      </div>
    `;
  }

  function renderEmptyState(title, copy) {
    return `
      <div class="empty-state">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function renderApprovalStatusCell(approval, timesheet, scoped) {
    const hasEditedPunches = !!timesheet && getTimesheetPunches(timesheet, scoped.punches).some(punch => punch.edited);
    const showClientEdited = approval?.clientEdited || timesheet?.clientEdited || hasEditedPunches;
    return `
      <div class="stack-sm">
        ${renderInlineStatus(approval?.status || timesheet?.status || "pending")}
        ${showClientEdited ? `<span class="status-badge status-warning">Client Edited</span>` : ""}
        ${hasEditedPunches ? `<span class="status-badge status-neutral">Edited Punch</span>` : ""}
      </div>
    `;
  }

  function shouldShowEmptyWorkspaceOnboarding(scoped) {
    if (!["agencyOwner", "agencyAdmin"].includes(state.session.role)) {
      return !scoped.clients.length && !scoped.sites.length && !scoped.workers.length && !scoped.assignments.length;
    }
    const hasClient = scoped.clients.some(client => client.status !== "inactive");
    const hasSite = scoped.sites.some(site => site.status !== "inactive");
    const hasWorker = scoped.workers.some(worker => worker.status !== "inactive");
    const hasAssignment = scoped.assignments.some(assignment => assignment.status !== "ended");
    const hasQrReadySite = scoped.sites.some(site => site.status !== "inactive" && site.clientId && site.qrEnabled !== false);
    return !(hasClient && hasSite && hasWorker && hasAssignment && hasQrReadySite);
  }

  function renderEmptyWorkspaceOnboarding() {
    return `
      <div class="surface-card">
        <div class="card-top">
          <div>
            <p class="eyebrow">Onboarding Wizard</p>
            <h2 class="page-heading">Launch your first live staffing workflow</h2>
          </div>
        </div>
        <p class="section-copy">Use these guided steps to move from a fresh workspace to a live client, site, worker roster, assignment plan, and QR punch station.</p>
        <div class="feature-grid" style="margin-top: 18px;">
          <div class="feature-card">
            <p class="eyebrow">Step 1</p>
            <h3>Add Client</h3>
            <p>Create the company record that workers, sites, approvals, and payroll will tie back to.</p>
            <div class="page-actions" style="margin-top: 16px;">
              <button class="button button-primary" data-action="open-client-form" type="button">Add Client</button>
            </div>
          </div>
          <div class="feature-card">
            <p class="eyebrow">Step 2</p>
            <h3>Add Site</h3>
            <p>Create the warehouse or job location so Portaly can route punches and approvals correctly.</p>
            <div class="page-actions" style="margin-top: 16px;">
              <button class="button button-secondary" data-action="open-site-form" type="button">Add Site</button>
            </div>
          </div>
          <div class="feature-card">
            <p class="eyebrow">Step 3</p>
            <h3>Add Worker</h3>
            <p>Create a worker record so you can assign them, track time, and prepare payroll.</p>
            <div class="page-actions" style="margin-top: 16px;">
              <button class="button button-secondary" data-action="open-worker-form" type="button">Add Worker</button>
            </div>
          </div>
          <div class="feature-card">
            <p class="eyebrow">Step 4</p>
            <h3>Assign Worker</h3>
            <p>Connect the worker to the client and site so the public punch page shows the right names.</p>
            <div class="page-actions" style="margin-top: 16px;">
              <button class="button button-secondary" data-action="open-assignment-form" type="button">Assign Worker</button>
            </div>
          </div>
          <div class="feature-card">
            <p class="eyebrow">Step 5</p>
            <h3>Generate QR</h3>
            <p>Confirm the live site, refresh the worker list, and generate the QR link workers will scan without logging in.</p>
            <div class="page-actions" style="margin-top: 16px;">
              <button class="button button-ghost" data-action="open-publish-punch-page" type="button">Generate Site QR</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSelectOptions(rows, selectedId, placeholder, labelKey = "name") {
    const optionRows = rows || [];
    const placeholderOption = placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : "";
    const options = optionRows.map(row => {
      const label = labelKey === "fullName" ? fullName(row) : (row[labelKey] || row.name || fullName(row) || row.id);
      return `<option value="${escapeAttribute(row.id)}" ${selectedId === row.id ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("");
    return `${placeholderOption}${options}`;
  }

  function renderStaticOptions(values, selectedValue, labelBuilder = value => formatStatusLabel(value)) {
    return values.map(value => `
      <option value="${escapeAttribute(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(labelBuilder(value))}</option>
    `).join("");
  }

  function buildSiteAddress(site) {
    if (!site) {
      return "-";
    }
    return [site.address, site.city, site.state, site.zip].filter(Boolean).join(", ") || "-";
  }

  function renderInlineStatus(value) {
    const label = formatStatusLabel(value);
    const tone = getStatusTone(value);
    return `<span class="status-badge ${tone}">${escapeHtml(label)}</span>`;
  }

  function renderUsageRow(label, count, limit) {
    const percent = limit ? Math.min((count / limit) * 100, 100) : 28;
    return `
      <div class="stack-sm">
        <div class="info-row">
          <strong>${escapeHtml(label)}</strong>
          <span class="helper-copy">${escapeHtml(limit === null ? `${count} used` : `${count} of ${limit}`)}</span>
        </div>
        <div class="usage-bar">
          <div class="usage-fill" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }

  function renderWorkerMeta(label, value) {
    return `
      <div class="worker-meta">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function renderDetailBox(label, value) {
    return `
      <div class="detail-box">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function renderQrBox() {
    return `
      <div class="qr-box">
        ${QR_PATTERN.map(value => `<span class="${value ? "filled" : ""}"></span>`).join("")}
      </div>
    `;
  }

  function renderQrCanvas(link, qrKey, label = "Portaly QR") {
    return `
      <div class="qr-canvas-shell">
        <canvas class="qr-canvas" width="220" height="220" data-qr-canvas="${escapeAttribute(qrKey)}" data-qr-link="${escapeAttribute(link)}" aria-label="${escapeAttribute(label)}"></canvas>
      </div>
    `;
  }

  function slugifyFilename(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || "site";
  }

  async function hydrateQrCanvases(root = document) {
    const canvases = Array.from(root.querySelectorAll("[data-qr-canvas]"));
    if (!canvases.length) {
      return;
    }

    if (!window.QRCode || typeof window.QRCode.toCanvas !== "function") {
      console.warn("[Portaly] QRCode library unavailable for QR rendering");
      canvases.forEach(canvas => {
        const wrapper = canvas.parentElement;
        if (wrapper) {
          wrapper.innerHTML = `<div class="qr-placeholder-copy">QR preview unavailable.</div>`;
        }
      });
      return;
    }

    await Promise.all(canvases.map(async canvas => {
      const link = String(canvas.dataset.qrLink || "").trim();
      if (!link) {
        return;
      }
      try {
        await window.QRCode.toCanvas(canvas, link, {
          width: Number(canvas.getAttribute("width")) || 220,
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff"
          }
        });
      } catch (error) {
        console.error("[Portaly] hydrateQrCanvases failed", {
          qrKey: canvas.dataset.qrCanvas || "",
          link,
          error
        });
      }
    }));
  }

  async function buildQrCanvasForLink(link) {
    if (!window.QRCode || typeof window.QRCode.toCanvas !== "function") {
      throw new Error("QR preview is not ready yet.");
    }
    const canvas = document.createElement("canvas");
    await window.QRCode.toCanvas(canvas, link, {
      width: 320,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    });
    return canvas;
  }

  async function getQrCanvasDataUrl(qrKey, link) {
    const selectorKey = typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(String(qrKey || ""))
      : String(qrKey || "");
    const existing = document.querySelector(`[data-qr-canvas="${selectorKey}"]`);
    if (existing instanceof HTMLCanvasElement) {
      return existing.toDataURL("image/png");
    }
    const canvas = await buildQrCanvasForLink(link);
    return canvas.toDataURL("image/png");
  }

  async function downloadQrCardPng({ qrKey, link, fileName }) {
    if (!link) {
      throw new Error("There is no punch link to download yet.");
    }
    const dataUrl = await getQrCanvasDataUrl(qrKey, link);
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = fileName || "portaly-qr.png";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    pushToast("QR code downloaded.", "success");
  }

  async function printQrCard({ qrKey, link, companyName, siteName }) {
    if (!link) {
      throw new Error("There is no punch link to print yet.");
    }
    const dataUrl = await getQrCanvasDataUrl(qrKey, link);
    const printWindow = window.open("", "_blank", "width=760,height=900");
    if (!printWindow) {
      throw new Error("Allow pop-ups to print this QR card.");
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Portaly QR Card</title>
        <style>
          body {
            margin: 0;
            font-family: "Plus Jakarta Sans", Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
          }
          .print-shell {
            max-width: 720px;
            margin: 0 auto;
            padding: 40px 28px;
            text-align: center;
          }
          .brand {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #1f6fff;
          }
          h1 {
            margin: 12px 0 8px;
            font-size: 34px;
          }
          h2 {
            margin: 0;
            font-size: 24px;
          }
          p {
            line-height: 1.6;
          }
          img {
            width: 320px;
            height: 320px;
            margin: 28px auto 20px;
            display: block;
            border: 18px solid #ffffff;
            box-shadow: 0 16px 42px rgba(15, 23, 42, 0.12);
            border-radius: 24px;
          }
          .url {
            margin-top: 20px;
            font-size: 13px;
            color: #475569;
            word-break: break-all;
          }
          .instructions {
            margin-top: 16px;
            color: #334155;
          }
        </style>
      </head>
      <body>
        <div class="print-shell">
          <div class="brand">Portaly</div>
          <h1>${escapeHtml(companyName || "Company Punch Station")}</h1>
          <h2>${escapeHtml(siteName || "Site QR")}</h2>
          <img src="${dataUrl}" alt="Portaly site punch QR code" />
          <p class="instructions">Scan to clock in, start lunch, end lunch, or clock out.</p>
          <p class="url">${escapeHtml(link)}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  }

  function buildWorkerLink(workerId) {
    return `${state.firebase.config.appUrl || DEFAULT_APP_URL}?mode=worker&workerId=${encodeURIComponent(workerId)}`;
  }

  function getOwnerClockRoute() {
    const agencyId = String(state.publicPunch?.agencyId || state.session.agencyId || state.session.agency?.id || "").trim();
    const companyId = String(state.publicPunch?.companyId || "").trim();
    const siteId = String(state.publicPunch?.siteId || "").trim();
    const params = new URLSearchParams();
    if (agencyId) {
      params.set("agencyId", agencyId);
    }
    if (companyId) {
      params.set("clientId", companyId);
    }
    if (siteId) {
      params.set("siteId", siteId);
    }
    const query = params.toString();
    return query ? `clock?${query}` : "clock";
  }

  function buildSitePunchLink(agencyId, companyId, siteId) {
    const baseUrl = state.firebase.config.appUrl || DEFAULT_APP_URL;
    const params = new URLSearchParams();
    if (agencyId) {
      params.set("agencyId", agencyId);
    }
    if (companyId) {
      params.set("clientId", companyId);
    }
    if (siteId) {
      params.set("siteId", siteId);
    }
    const query = params.toString();
    return `${baseUrl}#/punch${query ? `?${query}` : ""}`;
  }

  function buildSiteLink(siteId, options = {}) {
    const site = getSite(siteId);
    return buildSitePunchLink(
      site?.agencyId || options.agencyId || "",
      site?.clientId || options.clientId || "",
      siteId
    );
  }

  function normalizePublicWorkerOption(option) {
    if (!option) {
      return null;
    }
    const workerName = String(option.name || option.workerName || "").trim();
    if (!workerName) {
      return null;
    }
    return {
      id: String(option.id || option.workerId || "").trim(),
      name: workerName
    };
  }

  function normalizeSitePunchDirectory(directory) {
    if (!directory) {
      return null;
    }
    const workerOptions = Array.isArray(directory.publicWorkerOptions)
      ? directory.publicWorkerOptions.map(normalizePublicWorkerOption).filter(Boolean)
      : [];
    return {
      ...directory,
      id: String(directory.id || directory.siteId || "").trim(),
      agencyId: String(directory.agencyId || "").trim(),
      agencyName: String(directory.agencyName || "").trim() || "Staffing Agency",
      companyId: String(directory.companyId || directory.clientId || "").trim(),
      companyName: String(directory.companyName || directory.clientName || "").trim() || "Unknown Company",
      clientId: String(directory.clientId || directory.companyId || "").trim(),
      clientName: String(directory.clientName || directory.companyName || "").trim() || "Unknown Company",
      siteId: String(directory.siteId || directory.id || "").trim(),
      siteName: String(directory.siteName || directory.name || "").trim() || "Unknown Site",
      punchUrl: String(directory.punchUrl || buildSitePunchLink(directory.agencyId || "", directory.companyId || directory.clientId || "", directory.siteId || directory.id || "")).trim(),
      publicWorkerOptions: workerOptions,
      qrEnabled: directory.qrEnabled !== false,
      status: String(directory.status || "active").trim().toLowerCase() || "active"
    };
  }

  function isInactiveStatus(value) {
    return String(value || "").trim().toLowerCase() === "inactive";
  }

  function isActiveAssignmentStatus(value) {
    const normalized = String(value || "active").trim().toLowerCase();
    return normalized !== "inactive" && normalized !== "ended";
  }

  function getSitePunchWorkers(site, workers = [], assignments = []) {
    if (!site) {
      return [];
    }
    const siteId = String(site.id || site.siteId || "").trim();
    const assignedWorkerIds = new Set(
      (assignments || [])
        .filter(assignment => assignment && isActiveAssignmentStatus(assignment.status))
        .filter(assignment => String(assignment.siteId || "").trim() === siteId)
        .map(assignment => String(assignment.workerId || "").trim())
        .filter(Boolean)
    );
    const seen = new Set();
    return (workers || [])
      .filter(worker => worker && !isInactiveStatus(worker.status))
      .filter(worker => {
        const assignedSiteId = String(worker.assignedSiteId || "").trim();
        return assignedSiteId === siteId || assignedWorkerIds.has(String(worker.id || "").trim());
      })
      .map(worker => ({
        id: worker.id,
        name: fullName(worker) || worker.email || worker.id
      }))
      .filter(worker => {
        if (!worker.name || seen.has(worker.id || worker.name.toLowerCase())) {
          return false;
        }
        seen.add(worker.id || worker.name.toLowerCase());
        return true;
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  function buildSitePunchDirectory(site, options = {}) {
    if (!site) {
      return null;
    }
    const agencies = options.agencies || [];
    const clients = options.clients || [];
    const workers = options.workers || [];
    const assignments = options.assignments || [];
    const agencyName = (agencies.find(agency => agency.id === site.agencyId) || {}).name || getAgencyName(site.agencyId) || "Staffing Agency";
    const clientName = getClientNameFromStore(site.clientId, clients) || getClientName(site.clientId);
    const directory = normalizeSitePunchDirectory({
      id: site.id,
      agencyId: site.agencyId || state.session.agencyId || state.session.agency?.id || "",
      agencyName,
      companyId: site.clientId || "",
      companyName: clientName,
      clientId: site.clientId || "",
      clientName,
      siteId: site.id,
      siteName: site.name || "",
      qrEnabled: site.qrEnabled !== false,
      status: site.status || "active",
      punchUrl: buildSitePunchLink(site.agencyId || state.session.agencyId || state.session.agency?.id || "", site.clientId || "", site.id),
      publicWorkerOptions: getSitePunchWorkers(site, workers, assignments),
      updatedAt: new Date().toISOString()
    });
    return directory;
  }

  function buildDemoSitePunchDirectories() {
    const store = state.demoStore || emptyStore();
    return (store.sites || [])
      .filter(site => site && site.qrEnabled !== false && site.status !== "inactive")
      .map(site => buildSitePunchDirectory(site, {
        agencies: store.agencies || [],
        clients: store.clients || [],
        workers: store.workers || [],
        assignments: store.assignments || []
      }))
      .filter(Boolean);
  }

  function buildPublicPunchStateFromRecords(query = {}, source = {}) {
    const requestedAgencyId = String(query.agencyId || "").trim();
    const requestedCompanyId = String(query.companyId || "").trim();
    const requestedSiteId = String(query.siteId || "").trim();
    const sessionAgencyId = String(state.session.agencyId || state.session.agency?.id || "").trim();
    const scopedAgencyId = requestedAgencyId || sessionAgencyId;
    const agenciesSource = state.session.role === "platformOwner"
      ? (state.cache.agencies || [])
      : ((source.agencies || []).length ? (source.agencies || []) : (scopedAgencyId ? (state.cache.agencies || []).filter(agency => agency.id === scopedAgencyId) : []));
    const agencies = (agenciesSource || []).filter(Boolean).filter(agency => !scopedAgencyId || agency.id === scopedAgencyId);
    const clients = (source.clients || []).filter(client => client && !isInactiveStatus(client.status)).filter(client => !scopedAgencyId || client.agencyId === scopedAgencyId);
    const sites = (source.sites || []).filter(site => site && site.clientId && !isInactiveStatus(site.status)).filter(site => !scopedAgencyId || site.agencyId === scopedAgencyId);
    const workers = (source.workers || []).filter(worker => worker && !isInactiveStatus(worker.status)).filter(worker => !scopedAgencyId || worker.agencyId === scopedAgencyId);
    const assignments = (source.assignments || []).filter(assignment => assignment && isActiveAssignmentStatus(assignment.status)).filter(assignment => !scopedAgencyId || assignment.agencyId === scopedAgencyId);
    const requestedSite = requestedSiteId ? sites.find(site => site.id === requestedSiteId) || null : null;
    const resolvedAgencyId = requestedSite?.agencyId || scopedAgencyId || (agencies.length === 1 ? agencies[0].id : "");
    const agencyClients = clients.filter(client => !resolvedAgencyId || client.agencyId === resolvedAgencyId);
    const resolvedCompanyId = requestedSite?.clientId
      || (requestedCompanyId && agencyClients.some(client => client.id === requestedCompanyId) ? requestedCompanyId : "")
      || (agencyClients.length === 1 ? agencyClients[0].id : "");
    const agencySites = sites.filter(site => !resolvedAgencyId || site.agencyId === resolvedAgencyId);
    const clientSites = agencySites.filter(site => !resolvedCompanyId || site.clientId === resolvedCompanyId);
    const resolvedSiteId = requestedSite?.id
      || (requestedSiteId && clientSites.some(site => site.id === requestedSiteId) ? requestedSiteId : "")
      || (clientSites.length === 1 ? clientSites[0].id : "");
    const selectedSite = clientSites.find(site => site.id === resolvedSiteId) || null;
    const directories = agencySites
      .map(site => buildSitePunchDirectory(site, {
        agencies: agenciesSource,
        clients,
        workers,
        assignments
      }))
      .filter(Boolean);
    const directory = selectedSite
      ? buildSitePunchDirectory(selectedSite, {
        agencies: agenciesSource,
        clients,
        workers,
        assignments
      })
      : null;
    const siteWorkers = selectedSite ? getSitePunchWorkers(selectedSite, workers, assignments) : [];
    const agencyName = directory?.agencyName || agencies.find(agency => agency.id === resolvedAgencyId)?.name || getAgencyName(resolvedAgencyId) || "";
    const companyName = directory?.companyName || agencyClients.find(client => client.id === resolvedCompanyId)?.name || "";
    const siteName = directory?.siteName || selectedSite?.name || "";
    const emptyMessage = !agencyClients.length
      ? "Add a company/client first."
      : !agencySites.length
        ? "Add a worksite under a client."
        : !workers.length
          ? "Add workers or allow typed worker names."
          : "";

    console.log("Current agencyId", resolvedAgencyId || sessionAgencyId || "");
    console.log("Loaded clients", agencyClients.length);
    console.log("Loaded sites", agencySites.length);
    console.log("Loaded workers", workers.length);
    console.log("Selected site workers", siteWorkers.length);

    return {
      directories,
      agencies,
      clients: agencyClients,
      sites: agencySites,
      workers,
      assignments,
      siteWorkers,
      directory,
      agencyId: resolvedAgencyId || "",
      agencyName,
      companyId: directory?.companyId || resolvedCompanyId || "",
      companyName,
      siteId: directory?.siteId || resolvedSiteId || "",
      siteName,
      error: requestedSiteId && !selectedSite ? "This punch station could not be found. Ask your staffing agency to refresh the QR code." : "",
      emptyMessage
    };
  }

  function buildPublicPunchStateFromDirectories(query = {}, directories = []) {
    const normalizedDirectories = (directories || []).map(normalizeSitePunchDirectory).filter(Boolean);
    const agencyOptions = [...new Map(
      normalizedDirectories
        .map(directory => [directory.agencyId, { id: directory.agencyId, name: directory.agencyName }])
    ).values()].filter(option => option.id);
    const requestedAgencyId = String(query.agencyId || "").trim();
    const requestedCompanyId = String(query.companyId || "").trim();
    const requestedSiteId = String(query.siteId || "").trim();
    const resolvedAgencyId = requestedAgencyId && agencyOptions.some(option => option.id === requestedAgencyId)
      ? requestedAgencyId
      : (agencyOptions.length === 1 ? agencyOptions[0].id : "");
    const clientOptions = [...new Map(
      normalizedDirectories
        .filter(directory => !resolvedAgencyId || directory.agencyId === resolvedAgencyId)
        .map(directory => [directory.companyId, {
          id: directory.companyId,
          name: directory.companyName,
          agencyId: directory.agencyId
        }])
    ).values()].filter(option => option.id);
    const requestedDirectory = requestedSiteId
      ? normalizedDirectories.find(directory => directory.siteId === requestedSiteId && (!requestedAgencyId || directory.agencyId === requestedAgencyId) && (!requestedCompanyId || directory.companyId === requestedCompanyId)) || null
      : null;
    const resolvedCompanyId = requestedDirectory?.companyId
      || (requestedCompanyId && clientOptions.some(option => option.id === requestedCompanyId) ? requestedCompanyId : "")
      || (clientOptions.length === 1 ? clientOptions[0].id : "");
    const siteOptions = [...new Map(
      normalizedDirectories
        .filter(directory => (!resolvedAgencyId || directory.agencyId === resolvedAgencyId) && (!resolvedCompanyId || directory.companyId === resolvedCompanyId))
        .map(directory => [directory.siteId, {
          id: directory.siteId,
          siteId: directory.siteId,
          name: directory.siteName,
          siteName: directory.siteName,
          clientId: directory.companyId,
          companyId: directory.companyId,
          agencyId: directory.agencyId
        }])
    ).values()].filter(Boolean);
    const resolvedSiteId = requestedDirectory?.siteId
      || (requestedSiteId && siteOptions.some(option => option.siteId === requestedSiteId) ? requestedSiteId : "")
      || (siteOptions.length === 1 ? siteOptions[0].siteId : "");
    const directory = resolvedSiteId
      ? normalizedDirectories.find(item => item.siteId === resolvedSiteId && (!resolvedAgencyId || item.agencyId === resolvedAgencyId) && (!resolvedCompanyId || item.companyId === resolvedCompanyId)) || requestedDirectory || null
      : null;
    const allWorkers = [...new Map(
      normalizedDirectories
        .flatMap(item => item.publicWorkerOptions || [])
        .map(worker => [worker.id || worker.name.toLowerCase(), worker])
    ).values()];
    const siteWorkers = directory?.publicWorkerOptions || [];

    console.log("Current agencyId", directory?.agencyId || resolvedAgencyId || "");
    console.log("Loaded clients", clientOptions.length);
    console.log("Loaded sites", siteOptions.length);
    console.log("Loaded workers", allWorkers.length);
    console.log("Selected site workers", siteWorkers.length);

    return {
      directories: normalizedDirectories,
      agencies: agencyOptions,
      clients: clientOptions,
      sites: siteOptions,
      workers: allWorkers,
      assignments: [],
      siteWorkers,
      directory,
      agencyId: directory?.agencyId || resolvedAgencyId || "",
      agencyName: directory?.agencyName || agencyOptions.find(option => option.id === resolvedAgencyId)?.name || "",
      companyId: directory?.companyId || resolvedCompanyId || "",
      companyName: directory?.companyName || clientOptions.find(option => option.id === resolvedCompanyId)?.name || "",
      siteId: directory?.siteId || resolvedSiteId || "",
      siteName: directory?.siteName || siteOptions.find(option => option.siteId === resolvedSiteId)?.siteName || "",
      error: requestedSiteId && !directory ? "This punch station could not be found. Ask your staffing agency to refresh the QR code." : "",
      emptyMessage: !clientOptions.length
        ? "Add a company/client first."
        : !siteOptions.length
          ? "Add a worksite under a client."
          : !allWorkers.length
            ? "Add workers or allow typed worker names."
            : ""
    };
  }

  async function saveSitePunchDirectory(siteLike, options = {}) {
    const site = siteLike ? { ...siteLike } : null;
    if (!site?.id) {
      return null;
    }
    const shouldPublish = site.qrEnabled !== false && String(site.status || "active").toLowerCase() !== "inactive" && !!site.clientId;
    if (!shouldPublish) {
      if (!options.skipDelete) {
        try {
          await deleteData("sitePunchDirectories", site.id);
        } catch (error) {
          if (String(error?.message || "").trim()) {
            console.warn("[Portaly] saveSitePunchDirectory delete skipped", error);
          }
        }
      }
      return null;
    }

    const storeSource = state.session.mode === "demo" ? state.demoStore : getScopedData();
    const directory = buildSitePunchDirectory(site, {
      agencies: storeSource.agencies || [],
      clients: storeSource.clients || [],
      workers: storeSource.workers || [],
      assignments: storeSource.assignments || []
    });
    if (!directory) {
      return null;
    }
    return saveData("sitePunchDirectories", site.id, directory);
  }

  async function syncPunchDirectoriesForClient(clientId) {
    if (!clientId) {
      return;
    }
    const scoped = state.session.mode === "demo" ? state.demoStore : getScopedData();
    const relatedSites = (scoped.sites || []).filter(site => site.clientId === clientId);
    for (const site of relatedSites) {
      await saveSitePunchDirectory(site);
    }
  }

  async function syncPunchDirectoriesForWorker(worker, existing = null) {
    const siteIds = [...new Set([worker?.assignedSiteId, existing?.assignedSiteId].filter(Boolean))];
    const scoped = state.session.mode === "demo" ? state.demoStore : getScopedData();
    for (const siteId of siteIds) {
      const site = (scoped.sites || []).find(record => record.id === siteId) || getSite(siteId);
      if (site) {
        await saveSitePunchDirectory(site);
      }
    }
  }

  async function ensurePublishedSitePunchDirectories() {
    if (!canManageSites()) {
      return;
    }
    const scoped = state.session.mode === "demo" ? state.demoStore : getScopedData();
    const activeSites = (scoped.sites || []).filter(site => site && site.clientId && site.status !== "inactive" && site.qrEnabled !== false);
    for (const site of activeSites) {
      try {
        await saveSitePunchDirectory(site);
      } catch (error) {
        console.warn("[Portaly] ensurePublishedSitePunchDirectories skipped site", {
          siteId: site.id,
          error
        });
      }
    }
  }

  async function loadPublicPunchDirectories(query = {}) {
    const agencyId = String(query.agencyId || "").trim();
    const companyId = String(query.companyId || "").trim();
    const siteId = String(query.siteId || "").trim();

    if (state.firebase.ready && state.firebase.db) {
      if (siteId) {
        const snapshot = await state.firebase.db.collection("sitePunchDirectories").doc(siteId).get();
        const directory = snapshot.exists ? normalizeSitePunchDirectory({ id: snapshot.id, ...(snapshot.data() || {}) }) : null;
        if (!directory || directory.qrEnabled === false || directory.status === "inactive") {
          return [];
        }
        if (agencyId && directory.agencyId !== agencyId) {
          return [];
        }
        if (companyId && directory.companyId !== companyId) {
          return [];
        }
        return [directory];
      }

      return mapSnapshot(await state.firebase.db.collection("sitePunchDirectories").get())
        .map(normalizeSitePunchDirectory)
        .filter(directory => directory && directory.qrEnabled !== false && directory.status !== "inactive")
        .filter(directory => !agencyId || directory.agencyId === agencyId)
        .filter(directory => !companyId || directory.companyId === companyId);
    }

    return buildDemoSitePunchDirectories().filter(directory => {
      if (agencyId && directory.agencyId !== agencyId) {
        return false;
      }
      if (siteId && directory.siteId !== siteId) {
        return false;
      }
      if (companyId && directory.companyId !== companyId) {
        return false;
      }
      return true;
    });
  }

  async function loadDirectPublicPunchRecords(query = {}) {
    if (!state.firebase.ready || !state.firebase.db) {
      return null;
    }

    const agencyId = String(query.agencyId || "").trim();
    const companyId = String(query.companyId || "").trim();
    const siteId = String(query.siteId || "").trim();
    if (!agencyId || !companyId || !siteId) {
      return null;
    }

    console.log("[Portaly] direct public punch fallback", {
      agencyId,
      clientId: companyId,
      siteId
    });

    const siteSnapshot = await state.firebase.db.collection("sites").doc(siteId).get();
    if (!siteSnapshot.exists) {
      return null;
    }
    const site = { id: siteSnapshot.id, ...(siteSnapshot.data() || {}) };
    if (isInactiveStatus(site.status) || site.agencyId !== agencyId || site.clientId !== companyId) {
      return null;
    }

    const clientSnapshot = await state.firebase.db.collection("clients").doc(companyId).get();
    if (!clientSnapshot.exists) {
      return null;
    }
    const client = { id: clientSnapshot.id, ...(clientSnapshot.data() || {}) };
    if (isInactiveStatus(client.status) || client.agencyId !== agencyId) {
      return null;
    }

    let agency = null;
    try {
      const agencySnapshot = await state.firebase.db.collection("agencies").doc(agencyId).get();
      if (agencySnapshot.exists) {
        agency = { id: agencySnapshot.id, ...(agencySnapshot.data() || {}) };
      }
    } catch (error) {
      console.warn("[Portaly] direct public punch agency read skipped", {
        agencyId,
        errorCode: error?.code || "",
        errorMessage: error?.message || String(error || "")
      });
    }

    const agencies = agency ? [agency] : [{ id: agencyId, name: getAgencyName(agencyId) || "Staffing Agency" }];
    return buildPublicPunchStateFromRecords(query, {
      agencies,
      clients: [client],
      sites: [site],
      workers: [],
      assignments: []
    });
  }

  async function loadPublicPunchState() {
    const punchHash = parsePublicPunchHash();
    if (!punchHash) {
      state.publicPunch = {
        loading: false,
        error: "",
        directories: [],
        agencies: [],
        clients: [],
        sites: [],
        workers: [],
        assignments: [],
        siteWorkers: [],
        directory: null,
        agencyId: "",
        agencyName: "",
        companyId: "",
        companyName: "",
        siteId: "",
        siteName: "",
        saving: false,
        fallbackNotice: "",
        emptyMessage: "",
        requestHelpMessage: "",
        requestDraft: null,
        lastMessage: "",
        lastAction: "",
        lastSavedAt: "",
        lastStatus: "",
        lastWorkerName: ""
      };
      return null;
    }

    const previous = state.publicPunch || {};
    state.publicPunch = {
      ...previous,
      loading: true,
      error: "",
      agencyId: punchHash.agencyId,
      companyId: punchHash.companyId,
      siteId: punchHash.siteId,
      companyName: "",
      siteName: "",
      emptyMessage: ""
    };

    try {
      const shouldUseSessionSource = state.session.mode !== "public" && !!state.session.role && state.session.role !== "worker";
      let nextState;
      if (shouldUseSessionSource) {
        nextState = buildPublicPunchStateFromRecords(punchHash, getScopedData());
      } else {
        const directories = await loadPublicPunchDirectories(punchHash);
        nextState = buildPublicPunchStateFromDirectories(punchHash, directories);
        if ((!directories.length || nextState.error) && punchHash.agencyId && punchHash.companyId && punchHash.siteId) {
          const directState = await loadDirectPublicPunchRecords(punchHash);
          if (directState) {
            nextState = {
              ...directState,
              directories: directories.length ? directories : (directState.directories || [])
            };
          }
        }
      }

      state.publicPunch = {
        ...state.publicPunch,
        ...nextState,
        loading: false,
        saving: false,
        fallbackNotice: ""
      };
      return state.publicPunch;
    } catch (error) {
      const canUsePreviewFallback = window.location.protocol === "file:";
      if (canUsePreviewFallback) {
        console.warn("[Portaly] loadPublicPunchState preview fallback", {
          requestedAgencyId: punchHash.agencyId,
          requestedClientId: punchHash.companyId,
          requestedSiteId: punchHash.siteId,
          errorCode: error?.code || "",
          errorMessage: error?.message || String(error || "")
        });
        const directories = buildDemoSitePunchDirectories().filter(directory => {
          if (punchHash.agencyId && directory.agencyId !== punchHash.agencyId) {
            return false;
          }
          if (punchHash.companyId && directory.companyId !== punchHash.companyId) {
            return false;
          }
          if (punchHash.siteId && directory.siteId !== punchHash.siteId) {
            return false;
          }
          return true;
        });
        const fallbackState = buildPublicPunchStateFromDirectories(punchHash, directories);
        state.publicPunch = {
          ...state.publicPunch,
          ...fallbackState,
          loading: false,
          error: "",
          saving: false,
          fallbackNotice: "Live punch stations could not load in this local preview. Demo punch stations are shown below so you can still test the worker flow."
        };
        return state.publicPunch;
      }
      reportRuntimeIssue("loadPublicPunchState", error, {
        toastMessage: ""
      });
      state.publicPunch = {
        ...state.publicPunch,
        loading: false,
        directories: [],
        agencies: [],
        clients: [],
        sites: [],
        workers: [],
        assignments: [],
        siteWorkers: [],
        directory: null,
        saving: false,
        fallbackNotice: "",
        emptyMessage: "",
        error: "Portaly could not load this punch station right now. Check the link or try again in a moment."
      };
      return null;
    }
  }

  function buildPayrollCsv(timesheets, excelReady) {
    const rows = [
      ["Worker", "Client", "Site", "Approved Hours", "Regular Hours", "OT Hours", "Pay Rate", "Total Labor Cost", "Status"]
    ];

    timesheets.forEach(timesheet => {
      const payRate = Number(timesheet.payRate || getWorker(timesheet.workerId)?.payRate || 0);
      rows.push([
        getWorkerName(timesheet.workerId),
        getClientName(timesheet.clientId),
        getSiteName(timesheet.siteId),
        Number(timesheet.approvedHours || 0).toFixed(2),
        Number(timesheet.regularHours || 0).toFixed(2),
        Number(timesheet.overtimeHours || 0).toFixed(2),
        payRate.toFixed(2),
        calculateLaborCost(timesheet.regularHours, timesheet.overtimeHours, payRate).toFixed(2),
        formatStatusLabel(timesheet.status)
      ]);
    });

    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    return excelReady ? `\ufeff${csv}` : csv;
  }

  async function copyPayrollCsv(excelReady) {
    const scoped = getScopedData();
    const payPeriods = getPayPeriods(scoped.timesheets);
    const activePeriod = payPeriods.find(period => period.value === state.selectedPayPeriod) || payPeriods[0];
    const rows = activePeriod
      ? scoped.timesheets.filter(timesheet => `${timesheet.payPeriodStart}|${timesheet.payPeriodEnd}` === activePeriod.value)
      : scoped.timesheets;
    await copyText(buildPayrollCsv(rows, excelReady));
  }

  function calculateLaborCost(regularHours, overtimeHours, payRate) {
    const regular = Number(regularHours || 0) * Number(payRate || 0);
    const overtime = Number(overtimeHours || 0) * Number(payRate || 0) * 1.5;
    return regular + overtime;
  }

  function readFormValues(form) {
    const formData = new FormData(form);
    const values = {};
    for (const [key, value] of formData.entries()) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        values[key] = Array.isArray(values[key]) ? [...values[key], value] : [values[key], value];
      } else {
        values[key] = value;
      }
    }
    return values;
  }

  function mapSnapshot(snapshot) {
    return snapshot.docs.map(documentSnapshot => ({ id: documentSnapshot.id, ...documentSnapshot.data() }));
  }

  function renderToasts() {
    const root = document.getElementById("toastRoot");
    if (!root) {
      return;
    }
    root.innerHTML = state.toasts.map(toast => `<div class="toast ${toast.type}">${escapeHtml(toast.message)}</div>`).join("");
  }

  function pushToast(message, type = "success") {
    const id = createId("toast");
    state.toasts = [...state.toasts, { id, message, type }].slice(-4);
    renderToasts();
    window.setTimeout(() => {
      state.toasts = state.toasts.filter(toast => toast.id !== id);
      renderToasts();
    }, 2800);
  }

  async function copyText(value, successMessage = "") {
    if (!value) {
      throw new Error("There was nothing to copy.");
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      pushToast(successMessage || "Copied to clipboard.", "success");
      return;
    }

    window.prompt("Copy this text:", value);
  }

  function storeNotice(value) {
    window.localStorage.setItem(STORAGE_KEYS.routeNotice, value || "");
  }

  function loadStoredNotice() {
    return window.localStorage.getItem(STORAGE_KEYS.routeNotice) || "";
  }

  function startClock() {
    window.setInterval(() => {
      state.now = new Date();
      if (state.initialized && (state.session.role === "worker" || state.route === "punch" || state.route === "clock")) {
        renderApp();
      }
    }, 1000);
  }

  function buildDemoSeed() {
    const now = new Date();
    const payPeriodStart = startOfWeek(now);
    const payPeriodEnd = addDays(payPeriodStart, 6);

    const agencies = [
      {
        id: "agency_harbor",
        name: "Harbor Staffing Group",
        ownerUserId: "demo_agency_owner",
        planId: "agency",
        subscriptionStatus: "trialing",
        trialStart: addDays(now, -4).toISOString(),
        trialEnd: addDays(now, 10).toISOString(),
        createdAt: addDays(now, -22).toISOString(),
        updatedAt: now.toISOString(),
        settings: buildAgencySettings({
          agencyName: "Harbor Staffing Group",
          logoInitials: "HS",
          primaryColor: "#1f6fff",
          supportEmail: "ops@harborstaffing.com",
          supportPhone: "(214) 555-0188",
          payrollContact: "payroll@harborstaffing.com",
          defaultPayPeriod: "Weekly"
        })
      },
      {
        id: "agency_summit",
        name: "Summit Workforce Partners",
        ownerUserId: "summit_owner",
        planId: "growth",
        subscriptionStatus: "active",
        trialStart: addDays(now, -90).toISOString(),
        trialEnd: addDays(now, -76).toISOString(),
        createdAt: addDays(now, -120).toISOString(),
        updatedAt: addDays(now, -2).toISOString(),
        settings: buildAgencySettings({
          agencyName: "Summit Workforce Partners",
          logoInitials: "SW",
          primaryColor: "#1877f2",
          supportEmail: "support@summitworkforce.com",
          supportPhone: "(817) 555-0140",
          payrollContact: "payroll@summitworkforce.com",
          defaultPayPeriod: "Weekly"
        })
      }
    ];

    const users = [
      { id: "demo_platform_owner", role: "platformOwner", agencyId: "", firstName: "Paula", lastName: "North", email: "platform@portaly-demo.com", phone: "(800) 555-0100", status: "active", assignedClientIds: [], assignedSiteIds: [], workerId: "", createdAt: addDays(now, -120).toISOString() },
      { id: "demo_agency_owner", role: "agencyOwner", agencyId: "agency_harbor", firstName: "Hannah", lastName: "Cole", email: "owner@harborstaffing.com", phone: "(214) 555-0133", status: "active", assignedClientIds: [], assignedSiteIds: [], workerId: "", createdAt: addDays(now, -90).toISOString() },
      { id: "demo_agency_admin", role: "agencyAdmin", agencyId: "agency_harbor", firstName: "Marcus", lastName: "Reed", email: "admin@harborstaffing.com", phone: "(214) 555-0120", status: "active", assignedClientIds: [], assignedSiteIds: [], workerId: "", createdAt: addDays(now, -70).toISOString() },
      { id: "demo_client_manager", role: "clientManager", agencyId: "agency_harbor", firstName: "Diane", lastName: "Turner", email: "manager@northstar.com", phone: "(972) 555-0109", status: "active", assignedClientIds: ["client_northstar"], assignedSiteIds: ["site_dallas_dock_1", "site_dallas_dock_2"], workerId: "", createdAt: addDays(now, -40).toISOString() },
      { id: "demo_worker", role: "worker", agencyId: "agency_harbor", firstName: "Maria", lastName: "Ortiz", email: "maria.ortiz@worker-demo.com", phone: "(469) 555-0105", status: "active", assignedClientIds: ["client_northstar"], assignedSiteIds: ["site_dallas_dock_1"], workerId: "worker_maria_ortiz", createdAt: addDays(now, -40).toISOString() },
      { id: "summit_owner", role: "agencyOwner", agencyId: "agency_summit", firstName: "Devon", lastName: "Miles", email: "owner@summitworkforce.com", phone: "(817) 555-0168", status: "active", assignedClientIds: [], assignedSiteIds: [], workerId: "", createdAt: addDays(now, -100).toISOString() }
    ];

    const clients = [
      { id: "client_northstar", agencyId: "agency_harbor", name: "Northstar Fulfillment", contactName: "Diane Turner", contactEmail: "manager@northstar.com", phone: "(972) 555-0109", status: "active" },
      { id: "client_apex", agencyId: "agency_harbor", name: "Apex Cold Storage", contactName: "Will Sanders", contactEmail: "ops@apexcold.com", phone: "(817) 555-0146", status: "active" },
      { id: "client_blueline", agencyId: "agency_summit", name: "BlueLine Logistics", contactName: "Erin Flores", contactEmail: "sitelead@blueline.com", phone: "(682) 555-0112", status: "active" }
    ];

    const sites = [
      { id: "site_dallas_dock_1", agencyId: "agency_harbor", clientId: "client_northstar", name: "Dallas Dock 1", address: "2400 River Yard Rd, Dallas, TX", qrCodeUrl: "", status: "active" },
      { id: "site_dallas_dock_2", agencyId: "agency_harbor", clientId: "client_northstar", name: "Dallas Dock 2", address: "2410 River Yard Rd, Dallas, TX", qrCodeUrl: "", status: "active" },
      { id: "site_fort_worth_cold_hub", agencyId: "agency_harbor", clientId: "client_apex", name: "Fort Worth Cold Hub", address: "8900 Freezer Pkwy, Fort Worth, TX", qrCodeUrl: "", status: "active" },
      { id: "site_arlington_crossdock", agencyId: "agency_summit", clientId: "client_blueline", name: "Arlington Crossdock", address: "1550 Transfer Loop, Arlington, TX", qrCodeUrl: "", status: "active" }
    ];

    const workers = [
      buildWorker("worker_maria_ortiz", "agency_harbor", "Maria", "Ortiz", 18.5, "client_northstar", "site_dallas_dock_1", "demo_worker"),
      buildWorker("worker_james_carter", "agency_harbor", "James", "Carter", 19.25, "client_northstar", "site_dallas_dock_2"),
      { ...buildWorker("worker_alana_nguyen", "agency_harbor", "Alana", "Nguyen", 20.0, "client_apex", "site_fort_worth_cold_hub"), workerNoteType: "best", notes: "A joy to work with. Great attendance, helps train new temps, and clients ask for her by name." },
      { ...buildWorker("worker_eric_johnson", "agency_harbor", "Eric", "Johnson", 18.0, "client_apex", "site_fort_worth_cold_hub"), workerNoteType: "terminated", notes: "Do not return to this site.", terminationReason: "Client requested removal after repeated no-call/no-show issues and missed lunch documentation.", status: "inactive" },
      buildWorker("worker_tasha_brown", "agency_harbor", "Tasha", "Brown", 17.75, "client_northstar", "site_dallas_dock_1"),
      buildWorker("worker_leo_martinez", "agency_harbor", "Leo", "Martinez", 19.5, "client_northstar", "site_dallas_dock_2"),
      buildWorker("worker_nina_patel", "agency_summit", "Nina", "Patel", 21.0, "client_blueline", "site_arlington_crossdock"),
      buildWorker("worker_andre_lewis", "agency_summit", "Andre", "Lewis", 20.25, "client_blueline", "site_arlington_crossdock"),
      { ...buildWorker("worker_sofia_ramirez", "agency_summit", "Sofia", "Ramirez", 22.0, "client_blueline", "site_arlington_crossdock"), workerNoteType: "best", notes: "Best to work with on first shift. Reliable, fast learner, and requested by site supervisors." },
      buildWorker("worker_omar_hassan", "agency_summit", "Omar", "Hassan", 21.5, "client_blueline", "site_arlington_crossdock")
    ];

    const assignments = [
      buildAssignment("assignment_maria", "agency_harbor", "worker_maria_ortiz", "client_northstar", "site_dallas_dock_1", 18.5, 30.0, payPeriodStart),
      buildAssignment("assignment_james", "agency_harbor", "worker_james_carter", "client_northstar", "site_dallas_dock_2", 19.25, 31.0, payPeriodStart),
      buildAssignment("assignment_alana", "agency_harbor", "worker_alana_nguyen", "client_apex", "site_fort_worth_cold_hub", 20.0, 34.0, payPeriodStart),
      buildAssignment("assignment_eric", "agency_harbor", "worker_eric_johnson", "client_apex", "site_fort_worth_cold_hub", 18.0, 29.0, payPeriodStart),
      buildAssignment("assignment_tasha", "agency_harbor", "worker_tasha_brown", "client_northstar", "site_dallas_dock_1", 17.75, 29.5, payPeriodStart),
      buildAssignment("assignment_leo", "agency_harbor", "worker_leo_martinez", "client_northstar", "site_dallas_dock_2", 19.5, 32.0, payPeriodStart),
      buildAssignment("assignment_nina", "agency_summit", "worker_nina_patel", "client_blueline", "site_arlington_crossdock", 21.0, 34.5, payPeriodStart),
      buildAssignment("assignment_andre", "agency_summit", "worker_andre_lewis", "client_blueline", "site_arlington_crossdock", 20.25, 33.5, payPeriodStart),
      buildAssignment("assignment_sofia", "agency_summit", "worker_sofia_ramirez", "client_blueline", "site_arlington_crossdock", 22.0, 36.0, payPeriodStart),
      buildAssignment("assignment_omar", "agency_summit", "worker_omar_hassan", "client_blueline", "site_arlington_crossdock", 21.5, 35.5, payPeriodStart)
    ];

    const punches = [
      ...todayPunches(now, "agency_harbor", "worker_maria_ortiz", "assignment_maria", "client_northstar", "site_dallas_dock_1", [
        ["clockIn", 6, 58],
        ["startLunch", 11, 58],
        ["endLunch", 12, 27]
      ]),
      ...todayPunches(now, "agency_harbor", "worker_james_carter", "assignment_james", "client_northstar", "site_dallas_dock_2", [
        ["clockIn", 7, 12]
      ]),
      ...todayPunches(now, "agency_harbor", "worker_alana_nguyen", "assignment_alana", "client_apex", "site_fort_worth_cold_hub", [
        ["clockIn", 6, 49],
        ["startLunch", 12, 4]
      ]),
      ...todayPunches(now, "agency_harbor", "worker_eric_johnson", "assignment_eric", "client_apex", "site_fort_worth_cold_hub", [
        ["clockIn", 7, 1],
        ["startLunch", 11, 59],
        ["endLunch", 12, 29],
        ["clockOut", 16, 17]
      ]),
      ...todayPunches(now, "agency_harbor", "worker_leo_martinez", "assignment_leo", "client_northstar", "site_dallas_dock_2", [
        ["clockIn", 7, 2],
        ["clockIn", 7, 4]
      ]),
      ...todayPunches(now, "agency_summit", "worker_nina_patel", "assignment_nina", "client_blueline", "site_arlington_crossdock", [
        ["clockIn", 6, 55],
        ["startLunch", 12, 10],
        ["endLunch", 12, 38]
      ]),
      ...recentHistoryPunches(now, "agency_harbor", "worker_maria_ortiz", "assignment_maria", "client_northstar", "site_dallas_dock_1", 3),
      ...recentHistoryPunches(now, "agency_harbor", "worker_james_carter", "assignment_james", "client_northstar", "site_dallas_dock_2", 2),
      ...recentHistoryPunches(now, "agency_summit", "worker_nina_patel", "assignment_nina", "client_blueline", "site_arlington_crossdock", 2)
    ];

    if (punches[0]) {
      punches[0].edited = true;
      punches[0].notes = "Manual edit made by admin for corrected clock-in time.";
    }

    const timesheets = [
      buildTimesheet("timesheet_maria", "agency_harbor", "worker_maria_ortiz", "assignment_maria", "client_northstar", "site_dallas_dock_1", payPeriodStart, payPeriodEnd, 38, 2, 40, "pending", 18.5),
      buildTimesheet("timesheet_james", "agency_harbor", "worker_james_carter", "assignment_james", "client_northstar", "site_dallas_dock_2", payPeriodStart, payPeriodEnd, 36, 5, 41, "pending", 19.25),
      buildTimesheet("timesheet_alana", "agency_harbor", "worker_alana_nguyen", "assignment_alana", "client_apex", "site_fort_worth_cold_hub", payPeriodStart, payPeriodEnd, 40, 4, 44, "approved", 20.0),
      buildTimesheet("timesheet_eric", "agency_harbor", "worker_eric_johnson", "assignment_eric", "client_apex", "site_fort_worth_cold_hub", payPeriodStart, payPeriodEnd, 39, 0, 39, "rejected", 18.0, "Missing meal break attestation."),
      buildTimesheet("timesheet_tasha", "agency_harbor", "worker_tasha_brown", "assignment_tasha", "client_northstar", "site_dallas_dock_1", payPeriodStart, payPeriodEnd, 24, 0, 24, "approved", 17.75),
      buildTimesheet("timesheet_leo", "agency_harbor", "worker_leo_martinez", "assignment_leo", "client_northstar", "site_dallas_dock_2", payPeriodStart, payPeriodEnd, 32, 3, 35, "approved", 19.5),
      buildTimesheet("timesheet_nina", "agency_summit", "worker_nina_patel", "assignment_nina", "client_blueline", "site_arlington_crossdock", payPeriodStart, payPeriodEnd, 40, 3, 43, "approved", 21.0),
      buildTimesheet("timesheet_andre", "agency_summit", "worker_andre_lewis", "assignment_andre", "client_blueline", "site_arlington_crossdock", payPeriodStart, payPeriodEnd, 37, 2, 39, "approved", 20.25),
      buildTimesheet("timesheet_sofia", "agency_summit", "worker_sofia_ramirez", "assignment_sofia", "client_blueline", "site_arlington_crossdock", payPeriodStart, payPeriodEnd, 38, 1, 39, "approved", 22.0),
      buildTimesheet("timesheet_omar", "agency_summit", "worker_omar_hassan", "assignment_omar", "client_blueline", "site_arlington_crossdock", payPeriodStart, payPeriodEnd, 40, 0, 40, "approved", 21.5)
    ];

    const approvals = [
      buildApproval("approval_maria", "agency_harbor", "timesheet_maria", "worker_maria_ortiz", "client_northstar", "site_dallas_dock_1", "pending"),
      buildApproval("approval_james", "agency_harbor", "timesheet_james", "worker_james_carter", "client_northstar", "site_dallas_dock_2", "pending"),
      buildApproval("approval_alana", "agency_harbor", "timesheet_alana", "worker_alana_nguyen", "client_apex", "site_fort_worth_cold_hub", "approved", "Reviewed and approved by site lead."),
      buildApproval("approval_eric", "agency_harbor", "timesheet_eric", "worker_eric_johnson", "client_apex", "site_fort_worth_cold_hub", "rejected", "Missing meal break attestation.")
    ];

    const clientInvites = [];
    const punchRequests = [
      {
        id: "punch_request_maria_clock_out",
        agencyId: "agency_harbor",
        companyId: "client_northstar",
        companyName: "Northstar Fulfillment",
        clientId: "client_northstar",
        clientName: "Northstar Fulfillment",
        siteId: "site_dallas_dock_1",
        siteName: "Dallas Dock 1",
        workerId: "worker_maria_ortiz",
        workerName: "Maria Ortiz",
        workerMatched: true,
        requestedAction: "clockOut",
        requestedTimestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 42).toISOString(),
        requestedLocalDate: formatDateInput(now),
        reason: "Phone browser froze after shift ended.",
        status: "pending",
        source: "publicPunchPage",
        reviewedAt: "",
        reviewedBy: "",
        resolvedPunchId: "",
        deviceInfo: "Demo mobile browser"
      }
    ];

    const payrollRuns = [
      {
        id: "payroll_run_2026_week_1",
        agencyId: "agency_harbor",
        payPeriodStart: payPeriodStart.toISOString(),
        payPeriodEnd: payPeriodEnd.toISOString(),
        status: "draft",
        totalHours: 223,
        totalLaborCost: 4448.38,
        exportedAt: "",
        exportedBy: "demo_agency_admin"
      }
    ];

    const subscriptions = [
      {
        id: "subscription_harbor",
        agencyId: "agency_harbor",
        planId: "agency",
        status: "trialing",
        currentPeriodStart: "",
        currentPeriodEnd: "",
        trialStart: addDays(now, -4).toISOString(),
        trialEnd: addDays(now, 10).toISOString(),
        createdAt: addDays(now, -22).toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: "subscription_summit",
        agencyId: "agency_summit",
        planId: "growth",
        status: "active",
        currentPeriodStart: addDays(now, -14).toISOString(),
        currentPeriodEnd: addDays(now, 16).toISOString(),
        trialStart: addDays(now, -90).toISOString(),
        trialEnd: addDays(now, -76).toISOString(),
        createdAt: addDays(now, -120).toISOString(),
        updatedAt: addDays(now, -2).toISOString()
      }
    ];

    const auditLogs = [
      {
        id: "audit_manual_edit",
        agencyId: "agency_harbor",
        userId: "demo_agency_admin",
        role: "agencyAdmin",
        action: "manual_edit_made",
        entityType: "punches",
        entityId: punches[0]?.id || "",
        oldValue: null,
        newValue: { note: "Clock-in time corrected to 6:58 AM." },
        timestamp: now.toISOString()
      }
    ];

    const settings = [
      { id: "settings_harbor", agencyId: "agency_harbor", ...agencies[0].settings, createdAt: addDays(now, -22).toISOString(), updatedAt: now.toISOString() },
      { id: "settings_summit", agencyId: "agency_summit", ...agencies[1].settings, createdAt: addDays(now, -120).toISOString(), updatedAt: addDays(now, -2).toISOString() }
    ];

    const workerNames = Object.fromEntries(workers.map(worker => [worker.id, fullName(worker)]));
    const clientNames = Object.fromEntries(clients.map(client => [client.id, client.name]));
    const siteNames = Object.fromEntries(sites.map(site => [site.id, site.name]));

    [
      users,
      clients,
      sites,
      workers,
      assignments,
      punches,
      punchRequests,
      timesheets,
      approvals,
      clientInvites,
      payrollRuns,
      subscriptions,
      auditLogs,
      settings
    ].forEach(rows => ensureCollectionTimestamps(rows, now.toISOString()));

    punches.forEach(punch => {
      punch.workerName = workerNames[punch.workerId] || punch.workerName || "Unknown Worker";
      punch.clientName = clientNames[punch.clientId] || punch.clientName || "Unknown Client";
      punch.siteName = siteNames[punch.siteId] || punch.siteName || "Unknown Site";
    });

    timesheets.forEach(timesheet => {
      timesheet.workerName = workerNames[timesheet.workerId] || timesheet.workerName || "Unknown Worker";
      timesheet.clientName = clientNames[timesheet.clientId] || timesheet.clientName || "Unknown Client";
      timesheet.siteName = siteNames[timesheet.siteId] || timesheet.siteName || "Unknown Site";
    });

    approvals.forEach(approval => {
      approval.workerName = workerNames[approval.workerId] || approval.workerName || "Unknown Worker";
      approval.clientName = clientNames[approval.clientId] || approval.clientName || "Unknown Client";
      approval.siteName = siteNames[approval.siteId] || approval.siteName || "Unknown Site";
    });

    return {
      agencies,
      users,
      clientInvites,
      clients,
      sites,
      workers,
      assignments,
      punches,
      punchRequests,
      timesheets,
      approvals,
      payrollRuns,
      subscriptions,
      auditLogs,
      settings
    };
  }

  function buildCloudSampleBundle({ agencyId, ownerUserId, agencyName, planId }) {
    const seed = buildDemoSeed();
    const baseAgency = seed.agencies[0];
    const baseSettings = seed.settings[0];

    const agencies = [{
      id: agencyId,
      name: agencyName,
      ownerUserId,
      planId,
      subscriptionStatus: "trialing",
      trialStart: addDays(new Date(), 0).toISOString(),
      trialEnd: addDays(new Date(), 14).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        ...baseAgency.settings,
        agencyName
      }
    }];

    const clients = seed.clients
      .filter(client => client.agencyId === baseAgency.id)
      .map(client => ({ ...client, agencyId, id: `${client.id}_${agencyId}` }));

    const clientIdMap = mapIds(seed.clients.filter(client => client.agencyId === baseAgency.id), clients);
    const sites = seed.sites
      .filter(site => site.agencyId === baseAgency.id)
      .map(site => ({ ...site, agencyId, id: `${site.id}_${agencyId}`, clientId: clientIdMap[site.clientId] }));
    const siteIdMap = mapIds(seed.sites.filter(site => site.agencyId === baseAgency.id), sites);
    const workers = seed.workers
      .filter(worker => worker.agencyId === baseAgency.id)
      .map(worker => ({
        ...worker,
        agencyId,
        id: `${worker.id}_${agencyId}`,
        assignedClientId: clientIdMap[worker.assignedClientId],
        assignedSiteId: siteIdMap[worker.assignedSiteId],
        userId: ""
      }));
    const workerIdMap = mapIds(seed.workers.filter(worker => worker.agencyId === baseAgency.id), workers);
    const assignments = seed.assignments
      .filter(assignment => assignment.agencyId === baseAgency.id)
      .map(assignment => ({
        ...assignment,
        agencyId,
        id: `${assignment.id}_${agencyId}`,
        workerId: workerIdMap[assignment.workerId],
        clientId: clientIdMap[assignment.clientId],
        siteId: siteIdMap[assignment.siteId]
      }));
    const assignmentIdMap = mapIds(seed.assignments.filter(assignment => assignment.agencyId === baseAgency.id), assignments);
    const punches = seed.punches
      .filter(punch => punch.agencyId === baseAgency.id)
      .map(punch => ({
        ...punch,
        agencyId,
        id: `${punch.id}_${agencyId}`,
        workerId: workerIdMap[punch.workerId],
        assignmentId: assignmentIdMap[punch.assignmentId],
        clientId: clientIdMap[punch.clientId],
        siteId: siteIdMap[punch.siteId]
      }));
    const punchRequests = seed.punchRequests
      .filter(request => request.agencyId === baseAgency.id)
      .map(request => ({
        ...request,
        agencyId,
        id: `${request.id}_${agencyId}`,
        workerId: request.workerId ? workerIdMap[request.workerId] : null,
        companyId: clientIdMap[request.companyId || request.clientId] || "",
        clientId: clientIdMap[request.clientId || request.companyId] || "",
        siteId: siteIdMap[request.siteId] || ""
      }));
    const timesheets = seed.timesheets
      .filter(timesheet => timesheet.agencyId === baseAgency.id)
      .map(timesheet => ({
        ...timesheet,
        agencyId,
        id: `${timesheet.id}_${agencyId}`,
        workerId: workerIdMap[timesheet.workerId],
        assignmentId: assignmentIdMap[timesheet.assignmentId],
        clientId: clientIdMap[timesheet.clientId],
        siteId: siteIdMap[timesheet.siteId]
      }));
    const timesheetIdMap = mapIds(seed.timesheets.filter(timesheet => timesheet.agencyId === baseAgency.id), timesheets);
    const approvals = seed.approvals
      .filter(approval => approval.agencyId === baseAgency.id)
      .map(approval => ({
        ...approval,
        agencyId,
        id: `${approval.id}_${agencyId}`,
        timesheetId: timesheetIdMap[approval.timesheetId],
        workerId: workerIdMap[approval.workerId],
        clientId: clientIdMap[approval.clientId],
        siteId: siteIdMap[approval.siteId]
      }));
    const payrollRuns = seed.payrollRuns
      .filter(run => run.agencyId === baseAgency.id)
      .map(run => ({ ...run, agencyId, id: `${run.id}_${agencyId}` }));
    const subscriptions = [{
      id: `subscription_${agencyId}`,
      agencyId,
      planId,
      status: "trialing",
      currentPeriodStart: "",
      currentPeriodEnd: "",
      trialStart: addDays(new Date(), 0).toISOString(),
      trialEnd: addDays(new Date(), 14).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
    const auditLogs = seed.auditLogs
      .filter(log => log.agencyId === baseAgency.id)
      .map(log => ({ ...log, agencyId, id: `${log.id}_${agencyId}` }));
    const settings = [{
      ...baseSettings,
      agencyId,
      agencyName,
      id: `${baseSettings.id}_${agencyId}`
    }];

    return {
      agencies,
      clients,
      sites,
      workers,
      assignments,
      punches,
      punchRequests,
      timesheets,
      approvals,
      payrollRuns,
      subscriptions,
      auditLogs,
      settings
    };
  }

  function mapIds(sourceRows, targetRows) {
    return sourceRows.reduce((accumulator, row, index) => {
      accumulator[row.id] = targetRows[index].id;
      return accumulator;
    }, {});
  }

  function buildWorker(id, agencyId, firstName, lastName, payRate, clientId, siteId, userId = "") {
    return {
      id,
      agencyId,
      firstName,
      lastName,
      phone: `(555) ${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}-01${String(Math.floor(Math.random() * 90) + 10)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      payRate,
      status: "active",
      assignedClientId: clientId,
      assignedSiteId: siteId,
      userId,
      workerNoteType: "",
      notes: "",
      terminationReason: ""
    };
  }

  function buildAssignment(id, agencyId, workerId, clientId, siteId, payRate, billRate, startDate) {
    return {
      id,
      agencyId,
      workerId,
      clientId,
      siteId,
      payRate,
      billRate,
      startDate: startDate.toISOString(),
      endDate: "",
      status: "active"
    };
  }

  function buildTimesheet(id, agencyId, workerId, assignmentId, clientId, siteId, payPeriodStart, payPeriodEnd, regularHours, overtimeHours, approvedHours, status, payRate, adminNotes = "") {
    return {
      id,
      agencyId,
      workerId,
      assignmentId,
      clientId,
      siteId,
      payPeriodStart: payPeriodStart.toISOString(),
      payPeriodEnd: payPeriodEnd.toISOString(),
      regularHours,
      overtimeHours,
      approvedHours,
      status,
      approvedBy: "",
      approvedAt: "",
      adminNotes,
      payRate,
      clientEdited: false,
      clientEditedBy: "",
      clientEditedAt: "",
      clientEditReason: "",
      originalApprovedHours: approvedHours,
      originalRegularHours: regularHours,
      originalOvertimeHours: overtimeHours
    };
  }

  function buildApproval(id, agencyId, timesheetId, workerId, clientId, siteId, status, note = "") {
    return {
      id,
      agencyId,
      timesheetId,
      workerId,
      clientId,
      siteId,
      status,
      submittedAt: addDays(new Date(), -1).toISOString(),
      reviewedBy: "",
      reviewedAt: "",
      note,
      weekStart: "",
      weekEnd: "",
      approvalToken: `token_${id}`,
      tokenExpiresAt: addDays(new Date(), 30).toISOString(),
      clientEdited: false,
      clientEditedBy: "",
      clientEditedAt: "",
      clientEditReason: "",
      managerName: "",
      managerEmail: "",
      signatureDataUrl: "",
      signedAt: "",
      approvalNote: "",
      managerSignature: null
    };
  }

  function todayPunches(now, agencyId, workerId, assignmentId, clientId, siteId, entries) {
    return entries.map(([action, hour, minute], index) => ({
      id: `punch_${workerId}_${action}_${index}_${hour}${minute}`,
      agencyId,
      workerId,
      assignmentId,
      clientId,
      siteId,
      action,
      timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute).toISOString(),
      source: "demo",
      createdBy: "demo_agency_admin",
      edited: false,
      notes: ""
    }));
  }

  function recentHistoryPunches(now, agencyId, workerId, assignmentId, clientId, siteId, daysBack) {
    const rows = [];
    for (let index = 1; index <= daysBack; index += 1) {
      const baseDate = addDays(now, -index);
      rows.push(
        {
          id: `punch_hist_${workerId}_${index}_in`,
          agencyId,
          workerId,
          assignmentId,
          clientId,
          siteId,
          action: "clockIn",
          timestamp: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 7, 0).toISOString(),
          source: "demo",
          createdBy: "demo_agency_admin",
          edited: false,
          notes: ""
        },
        {
          id: `punch_hist_${workerId}_${index}_lunch_start`,
          agencyId,
          workerId,
          assignmentId,
          clientId,
          siteId,
          action: "startLunch",
          timestamp: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 12, 0).toISOString(),
          source: "demo",
          createdBy: "demo_agency_admin",
          edited: false,
          notes: ""
        },
        {
          id: `punch_hist_${workerId}_${index}_lunch_end`,
          agencyId,
          workerId,
          assignmentId,
          clientId,
          siteId,
          action: "endLunch",
          timestamp: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 12, 30).toISOString(),
          source: "demo",
          createdBy: "demo_agency_admin",
          edited: false,
          notes: ""
        },
        {
          id: `punch_hist_${workerId}_${index}_out`,
          agencyId,
          workerId,
          assignmentId,
          clientId,
          siteId,
          action: "clockOut",
          timestamp: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 16, 30).toISOString(),
          source: "demo",
          createdBy: "demo_agency_admin",
          edited: false,
          notes: ""
        }
      );
    }
    return rows;
  }

  function startOfWeek(date) {
    const clone = new Date(date);
    const day = clone.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    clone.setDate(clone.getDate() + diff);
    clone.setHours(0, 0, 0, 0);
    return clone;
  }

  function addDays(date, amount) {
    const clone = new Date(date);
    clone.setDate(clone.getDate() + amount);
    return clone;
  }

  function formatDateInput(value) {
    if (!value) {
      return "";
    }
    const date = value instanceof Date ? value : new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatTimeInput(value) {
    if (!value) {
      return "";
    }
    const date = value instanceof Date ? value : new Date(value);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatTime(value) {
    return new Date(value).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  function formatHours(value) {
    return `${Number(value || 0).toFixed(2)} hrs`;
  }

  function formatPercent(value) {
    return `${Number(value || 0).toFixed(1)}%`;
  }

  function formatStatusLabel(value) {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  function getStatusTone(value) {
    const normalized = String(value || "").toLowerCase();
    if (["approved", "active", "trialing", "clocked in", "clocked-in", "clear"].includes(normalized)) {
      return "status-success";
    }
    if (["rejected", "past_due", "past due", "unpaid", "expired_trial", "canceled", "duplicate punch"].includes(normalized)) {
      return "status-danger";
    }
    if (["pending", "warning", "on lunch", "on-lunch", "missing clock out"].includes(normalized)) {
      return "status-warning";
    }
    return "status-neutral";
  }

  function fullName(record) {
    if (!record) {
      return "";
    }
    return [record.firstName, record.lastName].filter(Boolean).join(" ").trim();
  }

  function initials(value) {
    return String(value || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join("") || "PT";
  }

  function sumNumbers(values) {
    return values.reduce((total, value) => total + Number(value || 0), 0);
  }

  function compareDates(left, right) {
    return new Date(left) - new Date(right);
  }

  function createId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeJsonParse(value) {
    try {
      return value ? JSON.parse(value) : null;
    } catch (_error) {
      return null;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function normalizeColor(value) {
    const raw = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(raw)) {
      return raw;
    }
    return DEFAULT_BRAND;
  }

  function isLocalFilePreview() {
    return window.location.protocol === "file:";
  }

  function ensureCollectionTimestamps(rows, fallbackIso) {
    rows.forEach(row => {
      const created = row.createdAt || row.timestamp || row.submittedAt || row.reviewedAt || fallbackIso;
      row.createdAt = created;
      row.updatedAt = row.updatedAt || created;
    });
  }

  function hexToRgb(hex) {
    const normalized = normalizeColor(hex).replace("#", "");
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16)
    };
  }

  function renderFatalError(error) {
    const root = document.getElementById("app");
    if (!root) {
      return;
    }
    root.innerHTML = `
      <div class="loading-card">
        <div class="surface-card">
          <p class="eyebrow">Portaly</p>
          <h2>Portaly failed to load.</h2>
          <p>Check console for startup error.</p>
          <p class="helper-copy" style="margin-top: 10px;">${escapeHtml(error.message || "Unknown startup error")}</p>
          <div class="page-actions" style="margin-top: 18px;">
            <button class="button button-primary" data-action="reload-app" type="button">Reload Portaly</button>
            <button class="button button-secondary" data-action="go-route" data-route="demo" type="button">Open Demo Mode</button>
          </div>
        </div>
      </div>
    `;
  }
})();
