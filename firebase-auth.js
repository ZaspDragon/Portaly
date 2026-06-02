(function () {
  const collections = window.PORTALY_FIREBASE_COLLECTIONS || {
    companies: "companies",
    users: "users"
  };

  let auth = null;
  let db = null;
  let authBootstrapped = false;

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  function sanitizeCode(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "");
  }

  function setStatus(id, message, isError) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? "#b42318" : "#425466";
  }

  function showToast(message) {
    if (window.PortalyApp && typeof window.PortalyApp.toast === "function") {
      window.PortalyApp.toast(message);
    }
  }

  function firebaseConfigured() {
    const cfg = window.PORTALY_FIREBASE_CONFIG || {};
    return Boolean(
      window.PORTALY_FIREBASE_ENABLED &&
      window.firebase &&
      cfg.apiKey &&
      cfg.authDomain &&
      cfg.projectId
    );
  }

  function initFirebase() {
    if (!firebaseConfigured()) return false;

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(window.PORTALY_FIREBASE_CONFIG);
    }

    auth = window.firebase.auth();
    db = window.firebase.firestore();
    return true;
  }

  function buildPortalLink(slug, portal) {
    const url = new URL(location.href);
    url.searchParams.set("company", slug);
    url.searchParams.set("portal", portal);
    return url.toString();
  }

  async function findCompanyByField(field, value) {
    const snap = await db
      .collection(collections.companies)
      .where(field, "==", value)
      .limit(1)
      .get();

    if (snap.empty) return null;

    const doc = snap.docs[0];
    return { companyId: doc.id, ...doc.data() };
  }

  async function loadUserProfile(uid) {
    const doc = await db.collection(collections.users).doc(uid).get();
    if (!doc.exists) return null;
    return { userId: uid, ...doc.data() };
  }

  async function loadCompany(companyId) {
    if (!companyId) return null;
    const doc = await db.collection(collections.companies).doc(companyId).get();
    if (!doc.exists) return null;
    return { companyId: doc.id, ...doc.data() };
  }

  function validateCompanyAccess(inputCode, companyRecord, profile) {
    const normalizedInput = sanitizeCode(inputCode);
    const companyCode = sanitizeCode(companyRecord?.companyCode || profile?.companyCode || "");
    const agencyNumber = sanitizeCode(companyRecord?.agencyNumber || "");
    const companySlug = slugify(companyRecord?.slug || profile?.companySlug || "");
    const slugInput = slugify(inputCode);

    return normalizedInput === companyCode ||
      normalizedInput === agencyNumber ||
      slugInput === companySlug;
  }

  function buildSession(profile, companyRecord) {
    return {
      mode: "firebase",
      userId: profile.userId,
      role: profile.role,
      displayName: profile.displayName || profile.ownerName || companyRecord?.ownerName || profile.email,
      email: profile.email || "",
      companyId: companyRecord?.companyId || profile.companyId || "",
      companyName: companyRecord?.companyName || companyRecord?.name || "Company Portal",
      companyCode: companyRecord?.companyCode || profile.companyCode || "",
      companySlug: companyRecord?.slug || profile.companySlug || "",
      agencyNumber: companyRecord?.agencyNumber || profile.companyCode || "",
      ownerName: companyRecord?.ownerName || profile.ownerName || profile.displayName || "",
      plan: companyRecord?.plan || "Starter",
      status: companyRecord?.status || profile.status || "Active",
      workerId: profile.workerId || "",
      workerNumber: profile.workerNumber || "",
      workerName: profile.workerName || profile.displayName || "",
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phone: profile.phone || ""
    };
  }

  async function completeSignIn(inputCode) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No signed-in Firebase user found.");

    const profile = await loadUserProfile(currentUser.uid);
    if (!profile) {
      throw new Error("No user profile found in Firestore for this account.");
    }

    const companyRecord = await loadCompany(profile.companyId);
    if (!companyRecord) {
      throw new Error("No company record found for this account.");
    }

    if (inputCode && !validateCompanyAccess(inputCode, companyRecord, profile)) {
      await auth.signOut();
      throw new Error("That company code does not match this account.");
    }

    return buildSession(profile, companyRecord);
  }

  async function handleCompanySignup(event) {
    event.preventDefault();
    if (!initFirebase()) {
      setStatus("companySignupStatus", "Firebase is off. Add your Firebase values in firebase-config.js and switch PORTALY_FIREBASE_ENABLED to true.", true);
      return;
    }

    const form = event.currentTarget;
    const companyName = form.companyName.value.trim();
    const ownerName = form.ownerName.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const companySlug = slugify(form.companySlug.value || companyName);
    const companyCode = sanitizeCode(
      (window.PortalyApp && typeof window.PortalyApp.buildCompanyCode === "function")
        ? window.PortalyApp.buildCompanyCode(companyName)
        : `${companySlug.slice(0, 6).toUpperCase()}-1001`
    );

    if (!companyName || !ownerName || !email || !password) {
      setStatus("companySignupStatus", "Fill in the company name, owner name, email, and password first.", true);
      return;
    }

    setStatus("companySignupStatus", "Creating company portal and Firebase owner account...", false);

    try {
      const existingSlug = await findCompanyByField("slug", companySlug);
      if (existingSlug) {
        throw new Error("That company slug is already taken. Pick a different slug.");
      }

      const existingCode = await findCompanyByField("companyCode", companyCode);
      if (existingCode) {
        throw new Error("That company code already exists. Change the company name or slug and try again.");
      }

      const credential = await auth.createUserWithEmailAndPassword(email, password);
      const companyId = `co-${Date.now().toString(36)}`;
      const companyRecord = {
        companyId,
        companyName,
        name: companyName,
        ownerName,
        adminEmail: email,
        companyCode,
        slug: companySlug,
        agencyNumber: companyCode,
        plan: "Starter",
        status: "Active",
        createdAt: new Date().toISOString()
      };

      await db.collection(collections.companies).doc(companyId).set(companyRecord);
      await db.collection(collections.users).doc(credential.user.uid).set({
        userId: credential.user.uid,
        companyId,
        role: "agency_admin",
        displayName: ownerName,
        ownerName,
        email,
        companyCode,
        companySlug,
        status: "active",
        createdAt: new Date().toISOString()
      });

      const workerLink = buildPortalLink(companySlug, "worker");
      const companyLink = buildPortalLink(companySlug, "company");
      const session = buildSession({
        userId: credential.user.uid,
        role: "agency_admin",
        displayName: ownerName,
        ownerName,
        email,
        companyId,
        companyCode,
        companySlug
      }, companyRecord);

      if (window.PortalyApp && typeof window.PortalyApp.applyExternalSession === "function") {
        window.PortalyApp.applyExternalSession(session);
      }

      setStatus(
        "companySignupStatus",
        `Company created. Code: ${companyCode}. Company portal: ${companyLink}. Worker portal: ${workerLink}`,
        false
      );
      showToast("Company portal created.");
      form.reset();
    } catch (error) {
      setStatus("companySignupStatus", error.message || "Company sign-up failed.", true);
    }
  }

  async function handleCompanyLogin(event) {
    event.preventDefault();
    if (!initFirebase()) {
      setStatus("companyLoginStatus", "Firebase is off. Add your Firebase values in firebase-config.js and switch PORTALY_FIREBASE_ENABLED to true.", true);
      return;
    }

    const form = event.currentTarget;
    const companyCode = form.companyCode.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    if (!companyCode || !email || !password) {
      setStatus("companyLoginStatus", "Enter the company code, work email, and password.", true);
      return;
    }

    setStatus("companyLoginStatus", "Signing into the company portal...", false);

    try {
      await auth.signInWithEmailAndPassword(email, password);
      const session = await completeSignIn(companyCode);

      if (session.role === "worker") {
        await auth.signOut();
        throw new Error("This account is marked as a worker. Use the worker login card instead.");
      }

      if (window.PortalyApp && typeof window.PortalyApp.applyExternalSession === "function") {
        window.PortalyApp.applyExternalSession(session);
      }

      setStatus("companyLoginStatus", `Signed in to ${session.companyName}.`, false);
      showToast("Company portal signed in.");
      form.password.value = "";
    } catch (error) {
      setStatus("companyLoginStatus", error.message || "Company login failed.", true);
    }
  }

  async function handleWorkerLogin(event) {
    event.preventDefault();
    if (!initFirebase()) {
      setStatus("workerLoginStatus", "Firebase is off. Add your Firebase values in firebase-config.js and switch PORTALY_FIREBASE_ENABLED to true.", true);
      return;
    }

    const form = event.currentTarget;
    const companyCode = form.companyCode.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    if (!companyCode || !email || !password) {
      setStatus("workerLoginStatus", "Enter the company code, worker email, and password.", true);
      return;
    }

    setStatus("workerLoginStatus", "Signing in as worker...", false);

    try {
      await auth.signInWithEmailAndPassword(email, password);
      const session = await completeSignIn(companyCode);

      if (session.role !== "worker") {
        await auth.signOut();
        throw new Error("This account is not marked as a worker profile in Firestore.");
      }

      if (window.PortalyApp && typeof window.PortalyApp.applyExternalSession === "function") {
        window.PortalyApp.applyExternalSession(session);
      }

      setStatus("workerLoginStatus", `Signed in to ${session.companyName} as ${session.displayName}.`, false);
      showToast("Worker portal signed in.");
      form.password.value = "";
    } catch (error) {
      setStatus("workerLoginStatus", error.message || "Worker login failed.", true);
    }
  }

  async function restoreFirebaseSession() {
    if (!initFirebase() || authBootstrapped) return;

    const unsubscribe = auth.onAuthStateChanged(async function (user) {
      unsubscribe();
      authBootstrapped = true;
      if (!user) return;

      try {
        const session = await completeSignIn("");
        if (window.PortalyApp && typeof window.PortalyApp.applyExternalSession === "function") {
          window.PortalyApp.applyExternalSession(session);
        }
      } catch (error) {
        console.warn("Portaly auth restore skipped:", error.message);
      }
    });
  }

  async function signOut() {
    if (!initFirebase() || !auth.currentUser) return;
    await auth.signOut();
  }

  function bindFormOnce(form, handler) {
    if (!form || form.dataset.bound === "true") return;
    form.addEventListener("submit", handler);
    form.dataset.bound = "true";
  }

  function bindAuthForms() {
    const companySignupForm = document.getElementById("companySignupForm");
    const companyLoginForm = document.getElementById("companyLoginForm");
    const workerLoginForm = document.getElementById("workerLoginForm");

    bindFormOnce(companySignupForm, handleCompanySignup);
    bindFormOnce(companyLoginForm, handleCompanyLogin);
    bindFormOnce(workerLoginForm, handleWorkerLogin);

    if (!firebaseConfigured()) {
      setStatus("companySignupStatus", "Firebase is off. Add your Firebase values in firebase-config.js and switch PORTALY_FIREBASE_ENABLED to true.", true);
      setStatus("companyLoginStatus", "Firebase is off. Once enabled, this card signs company owners and managers into their company portal.", true);
      setStatus("workerLoginStatus", "Firebase is off. Once enabled, workers sign in with their company code, email, and password.", true);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindAuthForms();
    restoreFirebaseSession();
  });

  window.PortalyFirebaseAuth = {
    refresh: bindAuthForms,
    signOut
  };
})();
