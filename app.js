(() => {
  "use strict";

  const COLLECTIONS = [
    "agencies",
    "users",
    "clients",
    "sites",
    "workers",
    "assignments",
    "punches",
    "timesheets",
    "approvals",
    "payrollRuns",
    "subscriptions",
    "auditLogs",
    "settings"
  ];

  const STORAGE_KEYS = {
    demo: "portaly_demo_store_v6",
    session: "portaly_session_v6",
    routeNotice: "portaly_route_notice_v6"
  };

  const DEFAULT_BRAND = "#1f6fff";
  const DEFAULT_SUPPORT_EMAIL = "support@portaly-demo.com";
  const DEFAULT_SUPPORT_PHONE = "(800) 555-0199";
  const BILLING_LOCK_STATUSES = new Set(["past_due", "unpaid", "expired_trial", "canceled"]);
  const PUBLIC_ROUTES = new Set(["landing", "pricing", "demo", "login", "trial", "trial-success", "billing-required", "forgot-password", "trial-expired"]);
  const WORKER_ROUTES = new Set(["worker-punch", "my-history", "help", "billing-required"]);
  const CLIENT_ROUTES = new Set(["approvals", "help", "billing-required"]);
  const DEFAULT_APP_URL = `${window.location.origin}${window.location.pathname}`;

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
      stripePriceId: "STRIPE_PRICE_STARTER",
      features: ["QR punches", "Basic payroll export", "Up to 25 workers", "1 client site"]
    },
    agency: {
      id: "agency",
      name: "Agency",
      label: "Agency",
      price: 249,
      workerLimit: 100,
      siteLimit: 5,
      stripePriceId: "STRIPE_PRICE_AGENCY",
      features: ["Client approvals", "Payroll exports", "Exception alerts", "Up to 100 workers"]
    },
    growth: {
      id: "growth",
      name: "Growth",
      label: "Growth",
      price: 499,
      workerLimit: null,
      siteLimit: null,
      stripePriceId: "STRIPE_PRICE_GROWTH",
      features: ["Unlimited workers", "Unlimited clients and sites", "White-label branding", "Advanced reports"]
    },
    enterprise: {
      id: "enterprise",
      name: "Enterprise",
      label: "Enterprise",
      price: null,
      workerLimit: null,
      siteLimit: null,
      stripePriceId: "CUSTOM",
      features: ["Multi-branch agencies", "Custom integrations", "Dedicated onboarding", "Contact sales"]
    }
  };

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", badge: "DB", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "workers", label: "Workers", badge: "WK", roles: ["agencyOwner", "agencyAdmin"] },
    { id: "clients", label: "Clients", badge: "CL", roles: ["agencyOwner", "agencyAdmin"] },
    { id: "sites", label: "Sites", badge: "ST", roles: ["agencyOwner", "agencyAdmin"] },
    { id: "assignments", label: "Assignments", badge: "AS", roles: ["agencyOwner", "agencyAdmin"] },
    { id: "live-punches", label: "Live Punches", badge: "LP", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "approvals", label: "Approvals", badge: "AP", roles: ["platformOwner", "agencyOwner", "agencyAdmin", "clientManager"] },
    { id: "payroll", label: "Payroll", badge: "PY", roles: ["agencyOwner", "agencyAdmin"] },
    { id: "margin", label: "Margin", badge: "MR", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "exceptions", label: "Problems to Fix", badge: "PF", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] },
    { id: "qr-codes", label: "QR Codes", badge: "QR", roles: ["agencyOwner", "agencyAdmin"] },
    { id: "users", label: "Users", badge: "US", roles: ["platformOwner", "agencyOwner"] },
    { id: "billing", label: "Billing", badge: "BL", roles: ["platformOwner", "agencyOwner"] },
    { id: "settings", label: "Settings", badge: "SE", roles: ["platformOwner", "agencyOwner", "agencyAdmin"] }
  ];

  const PUNCH_LABELS = {
    clockIn: "Clock In",
    startLunch: "Start Lunch",
    endLunch: "End Lunch",
    clockOut: "Clock Out"
  };

  const QR_PATTERN = [1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0];

  const state = {
    initialized: false,
    loading: false,
    mobileNavOpen: false,
    route: "landing",
    selectedPlan: "agency",
    selectedPayPeriod: "",
    now: new Date(),
    notice: loadStoredNotice(),
    modal: null,
    toasts: [],
    pendingLink: null,
    filters: {
      liveStatus: "all",
      liveClient: "all",
      liveSite: "all"
    },
    firebase: {
      config: window.PORTALY_FIREBASE_CONFIG || {},
      ready: false,
      app: null,
      auth: null,
      db: null,
      api: null,
      stripe: null,
      error: ""
    },
    session: {
      mode: "public",
      role: null,
      userId: null,
      agencyId: null,
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
    createAuditLog
  };

  document.addEventListener("DOMContentLoaded", () => {
    void initializeApp();
  });

  window.addEventListener("hashchange", () => {
    void handleHashChange();
  });

  window.addEventListener("unhandledrejection", event => {
    if (state.initialized) {
      console.error(event.reason);
      pushToast("Something went wrong. Please try again.", "danger");
    }
  });

  window.addEventListener("error", event => {
    if (state.initialized && event.error) {
      console.error(event.error);
    }
  });

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
      normalizeFilters();
      applyTheme();
      state.initialized = true;
      renderApp();
      startClock();
    } catch (error) {
      console.error(error);
      renderFatalError(error);
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
  }

  async function initializeFirebase() {
    const config = normalizeFirebaseConfig(window.PORTALY_FIREBASE_CONFIG || {});
    state.firebase.config = config;

    if (!config.enabled) {
      return;
    }

    await waitForFirebaseLayer();

    if (!window.PortalyFirebase) {
      state.firebase.error = "Firebase browser modules did not load.";
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

      if (config.stripePublishableKey && window.Stripe) {
        state.firebase.stripe = window.Stripe(config.stripePublishableKey);
      }
    } catch (error) {
      console.error(error);
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
      const unsubscribe = state.firebase.auth.onAuthStateChanged(user => {
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
      appUrl: config.appUrl || DEFAULT_APP_URL,
      functionsBaseUrl: config.functionsBaseUrl || "",
      stripePublishableKey: config.stripePublishableKey || "",
      stripePriceIds: config.stripePriceIds || {}
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
        </div>
      </div>
    `;
  }

  async function handleHashChange() {
    if (!state.initialized) {
      return;
    }
    state.route = normalizeRoute(parseHashRoute());
    state.mobileNavOpen = false;
    applyBodyState();
    renderApp();
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
      state.notice = "Site QR links work in demo today. For live agencies, pair them with worker sign-in.";
      storeNotice(state.notice);
      navigate("demo", { replace: true });
      return;
    }

    state.route = normalizeRoute(parseHashRoute());
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
    const hash = window.location.hash.replace(/^#\/?/, "").trim();
    if (!hash) {
      return getHomeRoute();
    }
    if (hash.startsWith("worker/")) {
      return "worker-punch";
    }
    return hash;
  }

  function parseWorkerHash() {
    const hash = window.location.hash.replace(/^#\/?/, "").trim();
    if (!hash.startsWith("worker/")) {
      return "";
    }
    return hash.split("/")[1] || "";
  }

  function getHomeRoute() {
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
    const candidate = route || getHomeRoute();
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
    state.authUser = authUser;
    const profile = await loadCloudUserProfile(authUser.uid);

    if (!profile) {
      pushToast("Your user profile is missing in Firestore.", "danger");
      setPublicSession();
      return;
    }

    state.session = buildSessionFromUser(profile, "cloud");
    state.session.email = authUser.email || profile.email || "";
    state.session.name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email || "Cloud User";

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

  function buildSessionFromUser(user, mode) {
    return {
      mode,
      role: user.role,
      userId: user.id,
      agencyId: user.agencyId || null,
      workerId: user.workerId || null,
      email: user.email || "",
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.displayName || user.email || ROLE_META[user.role]?.label || "User",
      assignedClientIds: Array.isArray(user.assignedClientIds) ? user.assignedClientIds : [],
      assignedSiteIds: Array.isArray(user.assignedSiteIds) ? user.assignedSiteIds : [],
      subscriptionStatus: null
    };
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
    const results = await Promise.all(collections.map(async collection => {
      const rows = await getData(collection);
      return [collection, rows];
    }));

    state.cache = emptyStore();
    results.forEach(([collection, rows]) => {
      state.cache[collection] = rows;
    });

    syncSubscriptionStatus();
    applyTheme();
  }

  function collectionsForRole(role) {
    if (role === "platformOwner") {
      return COLLECTIONS.slice();
    }

    if (role === "worker") {
      return ["agencies", "users", "clients", "sites", "workers", "punches", "timesheets", "settings"];
    }

    if (role === "clientManager") {
      return ["agencies", "users", "clients", "sites", "punches", "timesheets", "approvals", "settings"];
    }

    return COLLECTIONS.slice();
  }

  function syncSubscriptionStatus() {
    const agency = getCurrentAgency();
    const subscription = getCurrentSubscription();
    state.session.subscriptionStatus = subscription?.status || (agency ? agency.subscriptionStatus : null);
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
    const agencyId = state.session.agencyId;
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
      if (role === "worker") {
        const snapshot = await db.collection("users").doc(state.session.userId).get();
        return snapshot.exists ? [{ id: snapshot.id, ...snapshot.data() }] : [];
      }
      return mapSnapshot(await db.collection("users").where("agencyId", "==", agencyId).get()).filter(user => {
        if (role === "clientManager") {
          return user.id === state.session.userId;
        }
        return true;
      });
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
    const payload = {
      ...existing,
      ...data,
      id: recordId,
      updatedAt: now,
      createdAt: existing?.createdAt || data.createdAt || now
    };

    if (state.session.mode === "cloud") {
      await state.firebase.db.collection(collection).doc(recordId).set(payload, { merge: false });
    } else {
      const store = loadDemoStore();
      const rows = (store[collection] || []).filter(row => row.id !== recordId);
      rows.push(payload);
      store[collection] = rows;
      writeDemoStore(store);
      state.demoStore = store;
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
      return;
    }

    const store = loadDemoStore();
    store[collection] = (store[collection] || []).filter(row => row.id !== id);
    writeDemoStore(store);
    state.demoStore = store;
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

  async function createAuditLog(action, entityType, entityId, oldValue, newValue) {
    return appendAuditLog(action, entityType, entityId, oldValue, newValue);
  }

  function findRecord(collection, id) {
    const source = state.session.mode === "demo" ? state.demoStore : state.cache;
    return (source[collection] || []).find(row => row.id === id) || null;
  }

  function loadDemoStore() {
    const parsed = safeJsonParse(window.localStorage.getItem(STORAGE_KEYS.demo));
    if (parsed && COLLECTIONS.every(collection => Array.isArray(parsed[collection]))) {
      return parsed;
    }
    const seed = buildDemoSeed();
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
          if (window.confirm("Reset the demo back to the original sample data?")) {
            resetDemoStore();
            if (state.session.mode === "demo") {
              await refreshSessionData();
            }
            pushToast("Demo data reset in this browser.", "success");
            renderApp();
          }
          break;
        case "open-worker-form":
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
        case "open-client-form":
          state.modal = { type: "client-form", clientId: trigger.dataset.clientId || "" };
          renderApp();
          break;
        case "open-site-form":
          state.modal = { type: "site-form", siteId: trigger.dataset.siteId || "" };
          renderApp();
          break;
        case "open-payroll-edit":
          state.modal = { type: "payroll-edit", timesheetId: trigger.dataset.timesheetId || "" };
          renderApp();
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
          state.modal = null;
          renderApp();
          break;
        case "approve-timesheet":
          await approveTimesheet(trigger.dataset.timesheetId || "", "");
          break;
        case "reject-timesheet":
          await rejectTimesheet(trigger.dataset.timesheetId || "", trigger.dataset.note || "");
          break;
        case "punch-action":
          await capturePunch(trigger.dataset.punch || "");
          break;
        case "copy-link":
          await copyText(trigger.dataset.copy || "");
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
        case "manage-billing":
          await openBillingPortal();
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
        case "worker-save":
          await saveWorkerForm(values);
          break;
        case "client-save":
          await saveClientForm(values);
          break;
        case "site-save":
          await saveSiteForm(values);
          break;
        case "payroll-save":
          await savePayrollForm(values);
          break;
        case "settings-save":
          await saveSettingsForm(values);
          break;
        case "reject-note":
          await submitRejectNote(values);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(error);
      pushToast(error.message || "We could not save that change.", "danger");
    }
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

    if (target.name === "payPeriod") {
      state.selectedPayPeriod = target.value;
      renderApp();
      return;
    }

    if (target.name === "primaryColor") {
      applyTheme(target.value || DEFAULT_BRAND);
    }
  }

  async function handleLogout() {
    state.modal = null;
    state.mobileNavOpen = false;
    if (state.session.mode === "cloud" && state.firebase.ready) {
      await state.firebase.auth.signOut();
      state.authUser = null;
    }
    setPublicSession();
    state.cache = emptyStore();
    navigate("landing", { replace: true });
    pushToast("You are signed out.", "success");
  }

  async function submitLogin(values) {
    if (!state.firebase.ready) {
      throw new Error("Cloud Mode is not configured yet. Use Demo Mode until Firebase is enabled.");
    }

    if (!values.email || !values.password) {
      throw new Error("Enter your email and password.");
    }

    const result = await state.firebase.auth.signInWithEmailAndPassword(values.email, values.password);
    await establishCloudSession(result.user);
    await refreshSessionData();
    persistSession();

    if (state.pendingLink && state.pendingLink.type === "worker" && state.session.role === "worker" && state.session.workerId === state.pendingLink.workerId) {
      state.pendingLink = null;
      navigate("worker-punch", { replace: true });
      pushToast("Welcome back. Your punch screen is ready.", "success");
      return;
    }

    navigate(getHomeRoute(), { replace: true });
    pushToast(`Logged in as ${ROLE_META[state.session.role].label}.`, "success");
  }

  async function submitForgotPassword(values) {
    if (!state.firebase.ready) {
      throw new Error("Cloud Mode is not configured yet. Add Firebase first.");
    }

    if (!values.email) {
      throw new Error("Enter the email address for the account.");
    }

    await state.firebase.auth.sendPasswordResetEmail(values.email);
    pushToast("Password reset email sent.", "success");
    navigate("login", { replace: true });
  }

  async function submitTrialSignup(values) {
    if (!state.firebase.ready) {
      throw new Error("Cloud Mode is not configured yet. Add your Firebase config first.");
    }

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
    const agencyId = createId("agency");
    const authResult = await state.firebase.auth.createUserWithEmailAndPassword(values.email, values.password);
    const uid = authResult.user.uid;

    const agencyDoc = {
      id: agencyId,
      name: values.agencyName,
      ownerUserId: uid,
      planId: selectedPlan,
      subscriptionStatus: "trialing",
      trialStart: trialStart.toISOString(),
      trialEnd: trialEnd.toISOString(),
      stripeCustomerId: "",
      stripeSubscriptionId: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: buildAgencySettings({
        agencyName: values.agencyName,
        logoInitials: initials(values.agencyName),
        primaryColor: DEFAULT_BRAND,
        supportEmail: values.email,
        supportPhone: values.phone,
        payrollContact: values.email,
        defaultPayPeriod: "Weekly"
      })
    };

    const userDoc = {
      id: uid,
      agencyId,
      role: "agencyOwner",
      firstName: values.ownerFirstName,
      lastName: values.ownerLastName,
      email: values.email,
      phone: values.phone,
      status: "active",
      assignedClientIds: [],
      assignedSiteIds: [],
      workerId: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const settingDoc = {
      id: createId("setting"),
      agencyId,
      ...agencyDoc.settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const subscriptionDoc = {
      id: createId("subscription"),
      agencyId,
      stripeCustomerId: "",
      stripeSubscriptionId: "",
      planId: selectedPlan,
      status: "trialing",
      currentPeriodStart: "",
      currentPeriodEnd: "",
      trialStart: trialStart.toISOString(),
      trialEnd: trialEnd.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const batch = state.firebase.db.batch();
    batch.set(state.firebase.db.collection("agencies").doc(agencyId), agencyDoc);
    batch.set(state.firebase.db.collection("users").doc(uid), userDoc);
    batch.set(state.firebase.db.collection("settings").doc(settingDoc.id), settingDoc);
    batch.set(state.firebase.db.collection("subscriptions").doc(subscriptionDoc.id), subscriptionDoc);
    await batch.commit();

    if (values.loadSampleData === "on") {
      await loadSampleDataIntoCloud(agencyId, uid, values.agencyName, selectedPlan);
    }

    await establishCloudSession(authResult.user);
    await refreshSessionData();
    navigate("trial-success", { replace: true });
    pushToast("Your 14-day free trial is ready.", "success");
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
    const workerId = values.id || createId("worker");
    const existing = findRecord("workers", workerId);
    const willBeActive = values.status !== "inactive";
    enforcePlanLimit("worker", willBeActive, existing);

    const worker = {
      agencyId: state.session.agencyId,
      firstName: values.firstName || "",
      lastName: values.lastName || "",
      phone: values.phone || "",
      email: values.email || "",
      payRate: Number(values.payRate || 0),
      status: values.status || "active",
      assignedClientId: values.assignedClientId || "",
      assignedSiteId: values.assignedSiteId || "",
      userId: existing?.userId || ""
    };

    await saveData("workers", workerId, worker);
    await syncTimesheetPayRates(workerId, worker.payRate);
    await appendAuditLog("worker_saved", "workers", workerId, existing, worker);
    await refreshSessionData();
    state.modal = null;
    pushToast(existing ? "Worker updated." : "Worker added.", "success");
    renderApp();
  }

  async function syncTimesheetPayRates(workerId, payRate) {
    const timesheets = getScopedData().timesheets.filter(timesheet => timesheet.workerId === workerId);
    await Promise.all(timesheets.map(timesheet => updateData("timesheets", timesheet.id, { payRate })));
  }

  async function saveClientForm(values) {
    const clientId = values.id || createId("client");
    const existing = findRecord("clients", clientId);
    const client = {
      agencyId: state.session.agencyId,
      name: values.name || "",
      contactName: values.contactName || "",
      contactEmail: values.contactEmail || "",
      phone: values.phone || "",
      status: values.status || "active"
    };
    await saveData("clients", clientId, client);
    await appendAuditLog("client_saved", "clients", clientId, existing, client);
    await refreshSessionData();
    state.modal = null;
    pushToast(existing ? "Client updated." : "Client added.", "success");
    renderApp();
  }

  async function saveSiteForm(values) {
    const siteId = values.id || createId("site");
    const existing = findRecord("sites", siteId);
    const willBeActive = values.status !== "inactive";
    enforcePlanLimit("site", willBeActive, existing);

    const site = {
      agencyId: state.session.agencyId,
      clientId: values.clientId || "",
      name: values.name || "",
      address: values.address || "",
      qrCodeUrl: values.qrCodeUrl || "",
      status: values.status || "active"
    };
    await saveData("sites", siteId, site);
    await appendAuditLog("site_saved", "sites", siteId, existing, site);
    await refreshSessionData();
    state.modal = null;
    pushToast(existing ? "Site updated." : "Site added.", "success");
    renderApp();
  }

  async function savePayrollForm(values) {
    const existing = findRecord("timesheets", values.id);
    if (!existing) {
      throw new Error("That timesheet could not be found.");
    }

    const updated = {
      approvedHours: Number(values.approvedHours || 0),
      regularHours: Number(values.regularHours || 0),
      overtimeHours: Number(values.overtimeHours || 0),
      payRate: Number(values.payRate || 0),
      status: values.status || existing.status,
      adminNotes: values.adminNotes || ""
    };

    await updateData("timesheets", existing.id, updated);
    await appendAuditLog("timesheet_edited", "timesheets", existing.id, existing, updated);
    await refreshSessionData();
    state.modal = null;
    pushToast("Payroll row updated.", "success");
    renderApp();
  }

  async function saveSettingsForm(values) {
    const settingsRecord = getCurrentSettings();
    const agency = getCurrentAgency();
    const nextSettings = buildAgencySettings({
      agencyName: values.agencyName || agency?.name || "Portaly Agency",
      logoInitials: values.logoInitials || initials(values.agencyName || agency?.name || "Portaly"),
      primaryColor: values.primaryColor || DEFAULT_BRAND,
      supportEmail: values.supportEmail || DEFAULT_SUPPORT_EMAIL,
      supportPhone: values.supportPhone || DEFAULT_SUPPORT_PHONE,
      payrollContact: values.payrollContact || values.supportEmail || DEFAULT_SUPPORT_EMAIL,
      defaultPayPeriod: values.defaultPayPeriod || "Weekly"
    });

    if (agency) {
      await updateData("agencies", agency.id, {
        name: nextSettings.agencyName,
        settings: nextSettings
      });
    }

    if (settingsRecord) {
      await updateData("settings", settingsRecord.id, nextSettings);
    } else {
      await saveData("settings", createId("setting"), {
        agencyId: state.session.agencyId,
        ...nextSettings
      });
    }

    await appendAuditLog("settings_saved", "settings", settingsRecord?.id || "new", settingsRecord, nextSettings);
    await refreshSessionData();
    applyTheme(nextSettings.primaryColor);
    pushToast("Settings saved.", "success");
    renderApp();
  }

  async function submitRejectNote(values) {
    if (!state.modal) {
      return;
    }
    if (state.modal.targetType === "timesheet") {
      await rejectTimesheet(state.modal.targetId, values.note || "");
    }
  }

  async function approveTimesheet(timesheetId, note) {
    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      throw new Error("That timesheet could not be found.");
    }

    const approvalRecord = getScopedData().approvals.find(approval => approval.timesheetId === timesheetId);
    const updated = {
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: state.session.userId,
      adminNotes: note || timesheet.adminNotes || ""
    };

    await updateData("timesheets", timesheetId, updated);
    if (approvalRecord) {
      await updateData("approvals", approvalRecord.id, {
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: state.session.userId,
        note: note || approvalRecord.note || ""
      });
    }
    await appendAuditLog("timesheet_approved", "timesheets", timesheetId, timesheet, updated);
    await refreshSessionData();
    state.modal = null;
    pushToast("Timesheet approved.", "success");
    renderApp();
  }

  async function rejectTimesheet(timesheetId, note) {
    if (!note) {
      throw new Error("Please add a rejection note.");
    }

    const timesheet = findRecord("timesheets", timesheetId);
    if (!timesheet) {
      throw new Error("That timesheet could not be found.");
    }

    const approvalRecord = getScopedData().approvals.find(approval => approval.timesheetId === timesheetId);
    const updated = {
      status: "rejected",
      approvedAt: new Date().toISOString(),
      approvedBy: state.session.userId,
      adminNotes: note
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
    await appendAuditLog("timesheet_rejected", "timesheets", timesheetId, timesheet, updated);
    await refreshSessionData();
    state.modal = null;
    pushToast("Timesheet rejected with note.", "warning");
    renderApp();
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

    await saveData("punches", createId("punch"), punch);
    await appendAuditLog("punch_captured", "punches", punch.id || "new", null, punch);
    await refreshSessionData();

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

  async function appendAuditLog(action, entityType, entityId, oldValue, newValue) {
    if (!state.session.role || state.session.mode === "public") {
      return;
    }
    const audit = {
      agencyId: state.session.agencyId || "",
      userId: state.session.userId || "",
      role: state.session.role || "",
      action,
      entityType,
      entityId,
      oldValue: oldValue || null,
      newValue: newValue || null,
      timestamp: new Date().toISOString()
    };
    await saveData("auditLogs", createId("audit"), audit);
  }

  async function startBillingCheckout(planId) {
    const plan = getPlanDefinition(planId);
    if (!plan || plan.id === "enterprise") {
      window.location.href = "mailto:sales@portaly-demo.com?subject=Portaly%20Enterprise%20Plan";
      return;
    }

    if (state.session.mode !== "cloud") {
      pushToast("Billing is disabled in Demo Mode. Open Cloud Mode to test real subscriptions.", "warning");
      return;
    }

    if (!state.firebase.config.functionsBaseUrl) {
      throw new Error("Add your Functions base URL in firebase-config.js first.");
    }

    const response = await authenticatedPost("/createCheckoutSession", {
      planId,
      trialDays: getTrialDaysRemaining()
    });

    if (response.url) {
      window.location.href = response.url;
      return;
    }

    if (response.checkoutUrl) {
      window.location.href = response.checkoutUrl;
      return;
    }

    throw new Error("Checkout session did not return a URL.");
  }

  async function openBillingPortal() {
    if (state.session.mode !== "cloud") {
      pushToast("Billing is disabled in Demo Mode.", "warning");
      return;
    }

    if (!state.firebase.config.functionsBaseUrl) {
      throw new Error("Add your Functions base URL in firebase-config.js first.");
    }

    const response = await authenticatedPost("/createBillingPortalSession", {});
    if (response.url) {
      window.location.href = response.url;
      return;
    }

    throw new Error("Billing portal did not return a URL.");
  }

  async function authenticatedPost(path, payload) {
    const user = state.firebase.auth.currentUser;
    if (!user) {
      throw new Error("You need to log in again before opening billing.");
    }

    const token = await user.getIdToken();
    const base = (state.firebase.config.functionsBaseUrl || "").replace(/\/$/, "");
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload || {})
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || `Request failed with status ${response.status}.`);
    }
    return body;
  }

  function renderApp() {
    const root = document.getElementById("app");
    if (!root) {
      return;
    }

    state.route = normalizeRoute(state.route || parseHashRoute());
    applyBodyState();

    let html = "";
    if (state.session.role === "worker" && state.session.mode !== "public") {
      html = renderWorkerShell();
    } else if (state.session.mode === "public" || !state.session.role) {
      html = renderPublicShell();
    } else {
      html = renderOwnerShell();
    }

    root.innerHTML = html + renderModal();
    renderToasts();
  }

  function applyBodyState() {
    document.body.classList.toggle("nav-open", !!state.mobileNavOpen);
    document.body.dataset.layout = getLayoutMode();
  }

  function getLayoutMode() {
    if (state.session.role === "worker" && state.session.mode !== "public") {
      return "worker";
    }
    if (state.session.mode === "public" || !state.session.role) {
      return "public";
    }
    return "app";
  }

  function renderPublicShell() {
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
              <p class="eyebrow">Staffing Agency Platform</p>
              <h1>${escapeHtml(getBrandName())}</h1>
            </div>
          </div>
          <div class="marketing-links">
            <button class="marketing-link" data-action="go-route" data-route="landing" type="button">How It Works</button>
            <button class="marketing-link" data-action="go-route" data-route="pricing" type="button">Pricing</button>
            <button class="marketing-link" data-action="go-route" data-route="demo" type="button">Try Demo</button>
            <button class="marketing-link" data-action="go-route" data-route="login" type="button">Login</button>
          </div>
          <div class="marketing-actions">
            <button class="button button-secondary" data-action="go-route" data-route="demo" type="button">Try Demo</button>
            <button class="button button-primary" data-action="go-route" data-route="trial" type="button">Start Free Trial</button>
          </div>
        </div>
      </header>
    `;
  }

  function renderPublicPage() {
    switch (state.route) {
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
      case "landing":
      default:
        return renderMarketingLanding(false);
    }
  }

  function renderMarketingLanding(focusPricing) {
    const planCards = Object.values(PLAN_DEFINITIONS).map(plan => renderPricingCard(plan, focusPricing && plan.id === state.selectedPlan)).join("");
    return `
      <main class="hero-shell">
        <section class="section">
          <div class="container hero-grid">
            <div class="hero-copy">
              <p class="eyebrow">QR Timeclock & Staffing Agency Operations Platform</p>
              <h2>QR Timeclock & Staffing Agency Operations Platform</h2>
              <p>Track worker punches, client approvals, payroll exports, and gross margin from one clean platform.</p>
              <div class="hero-actions">
                <button class="button button-primary button-large" data-action="go-route" data-route="trial" type="button">Start Free Trial</button>
                <button class="button button-secondary button-large" data-action="go-route" data-route="demo" type="button">Try Demo</button>
                <button class="button button-ghost button-large" data-action="go-route" data-route="login" type="button">Login</button>
                <button class="button button-ghost button-large" data-action="go-route" data-route="pricing" type="button">View Pricing</button>
              </div>
              <div class="hero-stat-grid">
                ${renderHeroStat("14-day trial", "Create a real agency account and start in Cloud Mode.")}
                ${renderHeroStat("Open demo", "Walk through owner, client, and worker roles with sample data.")}
                ${renderHeroStat("Worker-first UX", "Clock in and out in seconds from a simple kiosk screen.")}
              </div>
            </div>
            <div class="hero-panel">
              <p class="eyebrow">How It Works</p>
              <div class="hero-flow">
                ${renderFlowStep(1, "Workers punch with QR or login", "Keep clock in, lunch, and clock out simple on phone or kiosk.")}
                ${renderFlowStep(2, "Clients approve hours", "Client managers review submitted labor without seeing pay or margin data.")}
                ${renderFlowStep(3, "Admins export payroll", "Edit timesheets, export CSV, and review exceptions in one place.")}
                ${renderFlowStep(4, "Owners watch margin", "See revenue, labor cost, and gross profit by worker, client, and site.")}
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Built for Staffing Agencies</p>
                <h2 class="section-title">Built for staffing agencies that still chase paper timecards</h2>
              </div>
              <p class="section-copy">Portaly gives owners, payroll teams, client approvers, and workers separate experiences that still stay connected.</p>
            </div>
            <div class="feature-grid">
              ${renderFeatureCard("QR worker punches", "Clock in and out from a mobile-first punch screen with clear status and recent history.")}
              ${renderFeatureCard("Client approvals", "Route submitted hours to client managers without exposing pay rate or margin details.")}
              ${renderFeatureCard("Payroll export", "Review weekly time, edit payroll rows, and export CSV from one clean queue.")}
              ${renderFeatureCard("Gross margin visibility", "Track pay rate, bill rate, revenue, labor cost, and gross profit by assignment.")}
              ${renderFeatureCard("Multi-site tracking", "Manage agencies with multiple clients, sites, and assignment flows from one workspace.")}
              ${renderFeatureCard("Audit trail", "Keep a history of punches, payroll edits, approvals, and manual changes.")}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container info-grid">
            <div class="surface-card">
              <p class="eyebrow">Worker QR Clock-In</p>
              <h2 class="page-heading">Simple enough for the warehouse floor</h2>
              <p class="section-copy">Workers see one large screen with their name, assignment, site, current time, status, and four large buttons: Clock In, Start Lunch, End Lunch, and Clock Out.</p>
            </div>
            <div class="surface-card">
              <p class="eyebrow">Client Approvals</p>
              <h2 class="page-heading">Approvals without agency financial noise</h2>
              <p class="section-copy">Client managers review hours, approve or reject timesheets with notes, and stay scoped to their own client or site only.</p>
            </div>
            <div class="surface-card">
              <p class="eyebrow">Payroll Export</p>
              <h2 class="page-heading">Move from approved time to payroll faster</h2>
              <p class="section-copy">Payroll teams can edit approved hours, regular hours, overtime, pay rate, and notes, then export CSV or print a weekly PDF view.</p>
            </div>
            <div class="surface-card">
              <p class="eyebrow">Gross Margin Visibility</p>
              <h2 class="page-heading">Owners get a clean margin picture</h2>
              <p class="section-copy">See revenue, labor cost, gross profit, margin percent, usage limits, and subscription status from the same dashboard.</p>
            </div>
          </div>
        </section>

        <section class="section" id="pricing">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">Pricing</p>
                <h2 class="section-title">Plans for agencies growing from one site to many</h2>
              </div>
              <p class="section-copy">Every real account starts with a 14-day free trial. Demo Mode stays free and local to the browser.</p>
            </div>
            <div class="pricing-grid">
              ${planCards}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-header">
              <div>
                <p class="eyebrow">FAQ</p>
                <h2 class="section-title">Questions agency owners usually ask first</h2>
              </div>
            </div>
            <div class="feature-grid">
              ${renderFaq("Can I keep a public demo open?", "Yes. Demo Mode runs on sample data in localStorage and never touches Firestore or billing.")}
              ${renderFaq("Can workers log in directly?", "Yes. Worker accounts go straight to the punch screen and only see their own punch history.")}
              ${renderFaq("How do subscriptions work?", "Real agencies start with a 14-day trial, then move into Stripe-managed monthly billing.")}
              ${renderFaq("Will this still deploy on GitHub Pages?", "Yes. The frontend stays plain HTML, CSS, and JavaScript with no npm or build step required.")}
            </div>
          </div>
        </section>
      </main>
    `;
  }

  function renderDemoAccessHub() {
    return `
      <main class="auth-shell">
        <div class="container auth-grid">
          <div class="stack-lg">
            <div class="auth-card">
              <p class="eyebrow">Access Hub</p>
              <h3>Choose a Portal</h3>
              <p>Demo Mode stays public and separate from real user accounts. Changes only save in this browser.</p>
              <div class="page-actions" style="margin-top: 18px;">
                <span class="mode-badge">Demo Mode - sample data only</span>
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

    return `
      <main class="auth-shell">
        <div class="container auth-grid">
          <div class="auth-card">
            <p class="eyebrow">Cloud Mode</p>
            <h3>Login</h3>
            <p>Real users sign in with Firebase Authentication. Workers go straight to the punch screen. Client managers land in Approvals. Owners and admins land in the command center.</p>
            ${localPreviewWarning}
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
                <button class="button button-primary button-block" type="submit">Login</button>
              </div>
            </form>
            <div class="auth-link-row">
              <button class="button button-ghost" data-action="go-route" data-route="trial" type="button">Create Account / Start Free Trial</button>
              <button class="marketing-link" data-action="go-route" data-route="forgot-password" type="button">Forgot password?</button>
            </div>
          </div>
          <div class="stack-md">
            <div class="support-card">
              <p class="eyebrow">Two Data Modes</p>
              <h3>Demo Mode stays local. Cloud Mode syncs.</h3>
              <p>Demo Mode uses localStorage only and does not create real accounts or billing records. Cloud Mode uses Firebase Authentication, Firestore, and Stripe-ready billing.</p>
            </div>
            <div class="support-card">
              <p class="eyebrow">Need a quick walkthrough?</p>
              <h3>Use the public demo first</h3>
              <p>Try the owner, client manager, and worker flows before you connect Firebase or Stripe.</p>
              <div class="page-actions" style="margin-top: 16px;">
                <button class="button button-secondary" data-action="go-route" data-route="demo" type="button">Try Demo</button>
                <button class="button button-ghost" data-action="go-route" data-route="pricing" type="button">View Pricing</button>
              </div>
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
            ${configReady ? "" : `
              <div class="notice-card warning" style="margin: 18px 0;">
                <div>
                  <strong>Cloud Mode is not configured yet.</strong>
                  <p>Paste your Firebase config into <code>firebase-config.js</code> before using real sign-up.</p>
                </div>
              </div>
            `}
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
                <input type="checkbox" name="loadSampleData" checked />
                <span>Load sample clients, sites, workers, timesheets, and punches into the new agency.</span>
              </label>
              <div class="page-actions">
                <button class="button button-primary button-block" type="submit">Start Free Trial</button>
              </div>
            </form>
          </div>
          <div class="stack-md">
            <div class="support-card">
              <p class="eyebrow">What happens next</p>
              <h3>Real account setup</h3>
              <ul class="list">
                <li>Create Firebase Auth user</li>
                <li>Create agency record in Firestore</li>
                <li>Create owner user profile</li>
                <li>Set subscription status to trialing</li>
                <li>Route you into onboarding</li>
              </ul>
            </div>
            <div class="support-card">
              <p class="eyebrow">Billing</p>
              <h3>Stripe starts after the trial</h3>
              <p>Portaly only uses Stripe secret keys inside Firebase Functions or your backend. The frontend never stores secret billing credentials.</p>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function renderTrialSuccessPage() {
    return `
      <main class="auth-shell">
        <div class="container">
          <div class="auth-card" style="max-width: 760px; margin: 0 auto;">
            <p class="eyebrow">Trial Started</p>
            <h3>Your agency workspace is ready</h3>
            <p>You now have ${Math.max(getTrialDaysRemaining(), 0)} days left in your free trial. Continue into the onboarding dashboard, invite your team, and load payroll-ready sample records if you chose that option.</p>
            <div class="page-actions" style="margin-top: 20px;">
              <button class="button button-primary" data-action="go-route" data-route="${escapeHtml(getHomeRoute())}" type="button">Continue to Dashboard</button>
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
            <p class="muted-text">QR punches, approvals, payroll, and margin visibility for staffing agencies.</p>
          </div>
          <div class="marketing-actions">
            <button class="button button-secondary" data-action="go-route" data-route="demo" type="button">Try Demo</button>
            <button class="button button-primary" data-action="go-route" data-route="trial" type="button">Start Free Trial</button>
          </div>
        </div>
      </footer>
    `;
  }

  function renderOwnerShell() {
    const pageTitle = getPageTitle();
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
            <h2>${escapeHtml(ROLE_META[state.session.role].label)}</h2>
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
                <p class="eyebrow">${escapeHtml(ROLE_META[state.session.role].label)}</p>
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

    return `
      <section class="stack-lg">
        <div class="metrics-grid">
          ${renderMetricCard("Active Workers", metrics.activeWorkers, "Workers with active records", "AW")}
          ${renderMetricCard("Workers Clocked In Now", metrics.clockedInNow, "Workers currently active on shift", "CI")}
          ${renderMetricCard("Workers On Lunch", metrics.onLunch, "Workers currently on lunch", "LU")}
          ${renderMetricCard("Missing Clock Outs", metrics.missingClockOuts, "Workers with no clock out yet", "MC")}
          ${renderMetricCard("Pending Client Approvals", metrics.pendingApprovals, "Timesheets waiting on approval", "AP")}
          ${renderMetricCard("Payroll Hours This Week", formatHours(metrics.payrollHours), "Approved and submitted time this week", "PY")}
          ${renderMetricCard("Estimated Gross Margin", formatCurrency(metrics.grossProfit), `${formatPercent(metrics.marginPercent)} average margin`, "GM")}
          ${renderMetricCard("Active Clients", metrics.activeClients, "Clients with active records", "CL")}
          ${renderMetricCard("Active Sites", metrics.activeSites, "Sites currently in service", "SI")}
          ${renderMetricCard("Subscription Status", formatStatusLabel(metrics.subscriptionStatus), `${escapeHtml(plan.label)} plan`, "SS")}
        </div>

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
                <button class="button button-primary" data-action="open-worker-form" type="button">Add Worker</button>
                <button class="button button-secondary" data-action="open-client-form" type="button">Add Client</button>
                <button class="button button-secondary" data-action="open-site-form" type="button">Add Site</button>
                <button class="button button-ghost" data-action="go-route" data-route="qr-codes" type="button">Generate QR</button>
                <button class="button button-ghost" data-action="go-route" data-route="approvals" type="button">Review Approvals</button>
                <button class="button button-ghost" data-action="go-route" data-route="payroll" type="button">Export Payroll</button>
                ${state.session.role === "agencyOwner" ? `<button class="button button-ghost" data-action="go-route" data-route="billing" type="button">Manage Billing</button>` : ""}
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
              <button class="button button-primary" data-action="open-worker-form" type="button">Add Worker</button>
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
                    return `
                      <tr>
                        <td>
                          <strong>${escapeHtml(fullName(worker))}</strong>
                          <div class="inline-note">${escapeHtml(worker.phone || worker.email || "No contact info")}</div>
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
      </section>
    `;
  }

  function renderClientsPage() {
    const clients = getScopedData().clients;
    return `
      <section class="stack-lg">
        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Clients</p>
              <h2 class="page-heading">Client accounts</h2>
            </div>
            <button class="button button-primary" data-action="open-client-form" type="button">Add Client</button>
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
                      <td><button class="button button-ghost" data-action="open-client-form" data-client-id="${escapeHtml(client.id)}" type="button">Edit</button></td>
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
            <button class="button button-primary" data-action="open-site-form" type="button">Add Site</button>
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
                      <td>${escapeHtml(site.address || "-")}</td>
                      <td>${renderInlineStatus(site.status)}</td>
                      <td>${escapeHtml(String(scoped.workers.filter(worker => worker.assignedSiteId === site.id).length))}</td>
                      <td><button class="button button-ghost" data-action="open-site-form" data-site-id="${escapeHtml(site.id)}" type="button">Edit</button></td>
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
      return true;
    });

    return `
      <section class="stack-lg">
        <div class="filter-card">
          <div class="table-top">
            <div>
              <p class="eyebrow">Live Punches</p>
              <h2 class="page-heading">Today's punch activity</h2>
            </div>
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
              <label for="live-client">Client</label>
              <select id="live-client" name="liveClient">
                <option value="all">All clients</option>
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
          </div>
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
                    <th>Last Action</th>
                    <th>Last Punch Time</th>
                    <th>Current Status</th>
                    <th>Hours Today</th>
                    <th>Exception Flag</th>
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
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No punches match these filters", "Try clearing the filters or wait until workers start punching in today.")}
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
                    return `
                      <tr>
                        <td>${escapeHtml(getWorkerName(approval.workerId))}</td>
                        <td>${escapeHtml(getClientName(approval.clientId))}</td>
                        <td>${escapeHtml(getSiteName(approval.siteId))}</td>
                        <td>${escapeHtml(formatHours(timesheet?.approvedHours || 0))}</td>
                        <td>${escapeHtml(buildPunchSummaryText(approval.workerId, scoped.punches))}</td>
                        <td>${renderInlineStatus(approval.status)}</td>
                        <td>
                          <div class="table-actions">
                            <button class="button button-primary" data-action="approve-timesheet" data-timesheet-id="${escapeHtml(approval.timesheetId)}" type="button">Approve</button>
                            <button class="button button-danger" data-action="open-reject-modal" data-target-type="timesheet" data-target-id="${escapeHtml(approval.timesheetId)}" type="button">Reject</button>
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
                  ${renderInlineStatus(approval.status)}
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
    const worker = scoped.workers[0];
    const site = scoped.sites[0];
    const workerLink = worker ? buildWorkerLink(worker.id) : "";
    const siteLink = site ? buildSiteLink(site.id) : "";

    return `
      <section class="stack-lg">
        <div class="split-grid">
          <div class="link-card">
            <p class="eyebrow">Generate Worker QR</p>
            <h3>Worker punch link card</h3>
            <p>Use worker-specific links for the safest punch experience. In Cloud Mode, the worker still has to sign in with the correct account.</p>
            ${worker ? `
              <div class="qr-preview">
                ${renderQrBox()}
              </div>
              <div class="stack-sm" style="margin-top: 16px;">
                <strong>${escapeHtml(getWorkerName(worker.id))}</strong>
                <p class="helper-copy">${escapeHtml(workerLink)}</p>
                <p class="helper-copy">Open this link on a phone or print the card for QR-ready worker access.</p>
                <div class="page-actions">
                  <button class="button button-secondary" data-action="copy-link" data-copy="${escapeHtml(workerLink)}" type="button">Copy Link</button>
                  <button class="button button-ghost" data-action="print-view" type="button">Print QR Card</button>
                </div>
              </div>
            ` : renderEmptyState("No workers to generate", "Add a worker first, then return here to create a QR-style link card.")}
          </div>
          <div class="link-card">
            <p class="eyebrow">Generate Site QR</p>
            <h3>Client / site punch link</h3>
            <p>A site card can be printed on location today. For live agencies, pair site access with authenticated worker selection.</p>
            ${site ? `
              <div class="qr-preview">
                ${renderQrBox()}
              </div>
              <div class="stack-sm" style="margin-top: 16px;">
                <strong>${escapeHtml(site.name)}</strong>
                <p class="helper-copy">${escapeHtml(siteLink)}</p>
                <p class="helper-copy">Print this site card and place it where workers start their shift.</p>
                <div class="page-actions">
                  <button class="button button-secondary" data-action="copy-link" data-copy="${escapeHtml(siteLink)}" type="button">Copy Link</button>
                  <button class="button button-ghost" data-action="print-view" type="button">Print QR Card</button>
                </div>
              </div>
            ` : renderEmptyState("No sites to generate", "Add a site first so Portaly can generate a printable link card.")}
          </div>
        </div>
      </section>
    `;
  }

  function renderUsersPage() {
    const users = getScopedData().users;
    return `
      <section class="stack-lg">
        <div class="notice-card">
          <div>
            <strong>User profiles live in Firestore. Sign-in credentials live in Firebase Authentication.</strong>
            <p>For Cloud Mode, pair each user profile with a matching Firebase Auth account. Demo Mode stays local and does not create real sign-ins.</p>
          </div>
        </div>
        <div class="table-shell">
          <div class="table-top">
            <div>
              <p class="eyebrow">Users</p>
              <h2 class="page-heading">Role-based access profiles</h2>
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
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState("No user profiles yet", "Create a Firebase Auth account, then add a matching Firestore profile to route people by role.")}
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

    return `
      <section class="stack-lg">
        <div class="metrics-grid">
          ${renderMetricCard("Current Plan", plan.label, "Monthly plan tier", "PL")}
          ${renderMetricCard("Trial Days Remaining", Math.max(getTrialDaysRemaining(), 0), "Days left before billing starts", "TD")}
          ${renderMetricCard("Subscription Status", formatStatusLabel(subscription?.status || agency?.subscriptionStatus || "trialing"), "Stripe and Firestore status", "SS")}
          ${renderMetricCard("Worker / Site Usage", `${usage.activeWorkers}${plan.workerLimit ? ` / ${plan.workerLimit}` : ""} workers`, `${usage.activeSites}${plan.siteLimit ? ` / ${plan.siteLimit}` : ""} sites`, "US")}
        </div>

        ${["past_due", "unpaid", "expired_trial"].includes(subscription?.status || agency?.subscriptionStatus) ? `
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
          <p class="helper-copy">Next billing date placeholder: ${escapeHtml(formatDate(nextBillingDate))}</p>
          <div class="page-actions" style="margin-top: 18px;">
            <button class="button button-primary" data-action="start-checkout" data-plan="${escapeHtml(plan.id)}" type="button">Start Paid Subscription</button>
            <button class="button button-secondary" data-action="manage-billing" type="button">Manage Billing</button>
          </div>
        </div>

        <div class="pricing-grid">
          ${Object.values(PLAN_DEFINITIONS).map(item => renderPricingCard(item, item.id === (agency?.planId || state.selectedPlan))).join("")}
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
      defaultPayPeriod: settings?.defaultPayPeriod || "Weekly"
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
            <div class="page-actions">
              <button class="button button-primary" type="submit">Save Settings</button>
            </div>
          </form>
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
        <div class="support-card">
          <p class="eyebrow">Help</p>
          <h3>Need a correction?</h3>
          <p>If a punch is missing or wrong, reach out to your agency so they can correct the record and keep payroll accurate.</p>
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

  function renderWorkerFormModal() {
    const worker = state.modal.workerId ? getScopedData().workers.find(item => item.id === state.modal.workerId) : null;
    const scoped = getScopedData();
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
                <label for="worker-email">Email</label>
                <input id="worker-email" name="email" type="email" value="${escapeAttribute(worker?.email || "")}" />
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
                <input id="site-qr-url" name="qrCodeUrl" type="text" value="${escapeAttribute(site?.qrCodeUrl || "")}" placeholder="${escapeAttribute(buildSiteLink(site?.id || "site_example"))}" />
              </div>
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
    if (state.session.mode === "demo") {
      return `
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
        ${trialNotice}
        <div class="notice-card">
          <div>
            <strong>Cloud Mode: data syncs across devices</strong>
            <p>Real users, live agency records, and subscription status now come from Firebase and Stripe-ready backend endpoints.</p>
          </div>
        </div>
      `;
    }

    return "";
  }

  function buildAgencyDashboardMetrics(scoped) {
    const marginRows = buildMarginRows(scoped);
    const grossProfit = sumNumbers(marginRows.map(row => row.grossProfit));
    const revenue = sumNumbers(marginRows.map(row => row.revenue));
    const agency = getCurrentAgency();
    const subscription = getCurrentSubscription();
    return {
      activeWorkers: scoped.workers.filter(worker => worker.status !== "inactive").length,
      clockedInNow: buildLivePunchRows(scoped).filter(row => row.baseStatusKey === "clocked-in").length,
      onLunch: buildLivePunchRows(scoped).filter(row => row.baseStatusKey === "on-lunch").length,
      missingClockOuts: buildLivePunchRows(scoped).filter(row => row.exception === "Missing clock out").length,
      pendingApprovals: scoped.approvals.filter(approval => approval.status === "pending").length,
      payrollHours: sumNumbers(scoped.timesheets.map(timesheet => timesheet.approvedHours || 0)),
      grossProfit,
      marginPercent: revenue ? (grossProfit / revenue) * 100 : 0,
      activeClients: scoped.clients.filter(client => client.status !== "inactive").length,
      activeSites: scoped.sites.filter(site => site.status !== "inactive").length,
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
      const assignment = scoped.assignments.find(item => item.workerId === timesheet.workerId) || null;
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

    const agencyId = state.session.agencyId;
    const filterAgency = rows => (rows || []).filter(row => !row.agencyId || row.agencyId === agencyId);
    const scoped = {
      agencies: (source.agencies || []).filter(agency => agency.id === agencyId),
      users: filterAgency(source.users),
      clients: filterAgency(source.clients),
      sites: filterAgency(source.sites),
      workers: filterAgency(source.workers),
      assignments: filterAgency(source.assignments),
      punches: filterAgency(source.punches),
      timesheets: filterAgency(source.timesheets),
      approvals: filterAgency(source.approvals),
      payrollRuns: filterAgency(source.payrollRuns),
      subscriptions: filterAgency(source.subscriptions),
      auditLogs: filterAgency(source.auditLogs),
      settings: filterAgency(source.settings)
    };

    if (state.session.role === "worker") {
      return {
        ...scoped,
        users: scoped.users.filter(user => user.id === state.session.userId),
        workers: scoped.workers.filter(worker => worker.id === state.session.workerId),
        punches: scoped.punches.filter(punch => punch.workerId === state.session.workerId),
        timesheets: scoped.timesheets.filter(timesheet => timesheet.workerId === state.session.workerId),
        approvals: scoped.approvals.filter(approval => approval.workerId === state.session.workerId),
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
        timesheets: filterAssigned(scoped.timesheets),
        approvals: filterAssigned(scoped.approvals),
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
    return scoped.agencies[0] || state.demoStore.agencies.find(agency => agency.id === state.session.agencyId) || null;
  }

  function getCurrentSubscription() {
    const scoped = getScopedData();
    return (scoped.subscriptions || []).find(subscription => subscription.agencyId === state.session.agencyId) || null;
  }

  function getCurrentSettings() {
    const scoped = getScopedData();
    return scoped.settings[0] || null;
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
      dashboard: "Dashboard",
      workers: "Workers",
      clients: "Clients",
      sites: "Sites",
      assignments: "Assignments",
      "live-punches": "Live Punches",
      approvals: "Approvals",
      payroll: "Payroll",
      margin: "Margin",
      exceptions: "Problems to Fix",
      "qr-codes": "QR Codes",
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
      defaultPayPeriod: input.defaultPayPeriod || "Weekly"
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

  function renderPricingCard(plan, highlight) {
    const label = plan.price === null ? "Custom" : `$${plan.price}/month`;
    const action = plan.id === "enterprise"
      ? `<a class="button button-ghost" href="mailto:sales@portaly-demo.com?subject=Portaly%20Enterprise">Contact Sales</a>`
      : `<button class="button ${highlight ? "button-primary" : "button-secondary"}" data-action="select-plan" data-plan="${escapeHtml(plan.id)}" type="button">${highlight ? "Selected Plan" : "Choose Plan"}</button>`;

    return `
      <div class="pricing-card ${highlight ? "is-highlighted" : ""}">
        <p class="eyebrow">${escapeHtml(plan.label)}</p>
        <h3>${escapeHtml(plan.label)}</h3>
        <span class="pricing-price">${escapeHtml(label)}</span>
        <ul class="list">
          ${plan.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join("")}
        </ul>
        <div class="page-actions" style="margin-top: 18px;">
          ${action}
          ${plan.id !== "enterprise" ? `<button class="button button-ghost" data-action="go-route" data-route="trial" type="button">Start Free Trial</button>` : ""}
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

  function renderHeroStat(value, copy) {
    return `
      <div class="hero-stat">
        <strong class="hero-stat-value">${escapeHtml(value)}</strong>
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

  function buildWorkerLink(workerId) {
    return `${state.firebase.config.appUrl || DEFAULT_APP_URL}?mode=worker&workerId=${encodeURIComponent(workerId)}`;
  }

  function buildSiteLink(siteId) {
    return `${state.firebase.config.appUrl || DEFAULT_APP_URL}?mode=site&siteId=${encodeURIComponent(siteId)}`;
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
      values[key] = value;
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

  async function copyText(value) {
    if (!value) {
      throw new Error("There was nothing to copy.");
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      pushToast("Copied to clipboard.", "success");
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
      if (state.session.role === "worker" && state.initialized) {
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
        stripeCustomerId: "",
        stripeSubscriptionId: "",
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
        stripeCustomerId: "cus_demo_summit",
        stripeSubscriptionId: "sub_demo_summit",
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
      buildWorker("worker_alana_nguyen", "agency_harbor", "Alana", "Nguyen", 20.0, "client_apex", "site_fort_worth_cold_hub"),
      buildWorker("worker_eric_johnson", "agency_harbor", "Eric", "Johnson", 18.0, "client_apex", "site_fort_worth_cold_hub"),
      buildWorker("worker_tasha_brown", "agency_harbor", "Tasha", "Brown", 17.75, "client_northstar", "site_dallas_dock_1"),
      buildWorker("worker_leo_martinez", "agency_harbor", "Leo", "Martinez", 19.5, "client_northstar", "site_dallas_dock_2"),
      buildWorker("worker_nina_patel", "agency_summit", "Nina", "Patel", 21.0, "client_blueline", "site_arlington_crossdock"),
      buildWorker("worker_andre_lewis", "agency_summit", "Andre", "Lewis", 20.25, "client_blueline", "site_arlington_crossdock"),
      buildWorker("worker_sofia_ramirez", "agency_summit", "Sofia", "Ramirez", 22.0, "client_blueline", "site_arlington_crossdock"),
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
        stripeCustomerId: "",
        stripeSubscriptionId: "",
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
        stripeCustomerId: "cus_demo_summit",
        stripeSubscriptionId: "sub_demo_summit",
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
      timesheets,
      approvals,
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
      clients,
      sites,
      workers,
      assignments,
      punches,
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
      stripeCustomerId: "",
      stripeSubscriptionId: "",
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
      stripeCustomerId: "",
      stripeSubscriptionId: "",
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
      userId
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
      payRate
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
      note
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
    const date = value instanceof Date ? value : new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
          <h2>Something failed while starting the app</h2>
          <p>${escapeHtml(error.message || "Unknown startup error")}</p>
        </div>
      </div>
    `;
  }
})();
