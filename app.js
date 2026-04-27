const STORAGE_KEY = "temptrack_pro_fixed_v3";

const seedData = {
  activeView: "login_portal",
  activeRole: "super_admin",
  activeAgencyId: "a1",
  activeClientId: "c1",
  activeWorkerId: "w1",
  agencies: [
    { id: "a1", agencyNumber: "TA-1001", name: "Elite Staffing Group", owner: "Maria Carter", plan: "Pro", status: "Active" },
    { id: "a2", agencyNumber: "TA-1002", name: "Rapid Labor Solutions", owner: "Derek Mills", plan: "Growth", status: "Active" }
  ],
  clients: [
    { id: "c1", agencyId: "a1", name: "Chadwell Supply", contact: "Receiving Manager", email: "manager@demo.com" },
    { id: "c2", agencyId: "a1", name: "Metro Foods DC", contact: "Ops Lead", email: "ops@demo.com" },
    { id: "c3", agencyId: "a2", name: "Northline Warehouse", contact: "Site Manager", email: "site@demo.com" }
  ],
  sites: [
    { id: "s1", agencyId: "a1", clientId: "c1", siteCode: "CHD-OH-001", address: "Canal Winchester, OH", gpsRequired: true },
    { id: "s2", agencyId: "a1", clientId: "c2", siteCode: "MFD-OH-002", address: "Columbus, OH", gpsRequired: false },
    { id: "s3", agencyId: "a2", clientId: "c3", siteCode: "NLW-OH-001", address: "Groveport, OH", gpsRequired: true }
  ],
  workers: [
    { id: "w1", agencyId: "a1", workerNumber: "TA-1001-W0001", firstName: "Angel", lastName: "Quincel", phone: "555-0101", status: "Active" },
    { id: "w2", agencyId: "a1", workerNumber: "TA-1001-W0002", firstName: "Henry", lastName: "Moore", phone: "555-0102", status: "Active" },
    { id: "w3", agencyId: "a1", workerNumber: "TA-1001-W0003", firstName: "Kris", lastName: "Brown", phone: "555-0103", status: "Active" },
    { id: "w4", agencyId: "a2", workerNumber: "TA-1002-W0001", firstName: "Dawitt", lastName: "Ali", phone: "555-0104", status: "Active" }
  ],
  assignments: [
    { id: "as1", agencyId: "a1", workerId: "w1", clientId: "c1", siteId: "s1", payRate: 18, billRate: 27, shiftStart: "07:00", shiftEnd: "15:30", active: true },
    { id: "as2", agencyId: "a1", workerId: "w2", clientId: "c1", siteId: "s1", payRate: 19, billRate: 29, shiftStart: "07:00", shiftEnd: "15:30", active: true },
    { id: "as3", agencyId: "a1", workerId: "w3", clientId: "c2", siteId: "s2", payRate: 18, billRate: 26, shiftStart: "08:00", shiftEnd: "16:30", active: true },
    { id: "as4", agencyId: "a2", workerId: "w4", clientId: "c3", siteId: "s3", payRate: 20, billRate: 31, shiftStart: "06:00", shiftEnd: "14:30", active: true }
  ],
  punches: [
    { id: "p1", agencyId: "a1", workerId: "w1", siteId: "s1", type: "Clock In", timestamp: todayAt("06:58"), gps: "Verified", photo: "Yes", status: "Approved" },
    { id: "p2", agencyId: "a1", workerId: "w2", siteId: "s1", type: "Clock In", timestamp: todayAt("07:11"), gps: "Verified", photo: "Yes", status: "Late" },
    { id: "p3", agencyId: "a1", workerId: "w3", siteId: "s2", type: "Clock In", timestamp: todayAt("08:03"), gps: "Not Required", photo: "No", status: "Approved" },
    { id: "p4", agencyId: "a1", workerId: "w1", siteId: "s1", type: "Start Lunch", timestamp: todayAt("12:00"), gps: "Verified", photo: "No", status: "Approved" },
    { id: "p5", agencyId: "a1", workerId: "w1", siteId: "s1", type: "End Lunch", timestamp: todayAt("12:31"), gps: "Verified", photo: "No", status: "Approved" }
  ],
  timesheets: [
    { id: "t1", agencyId: "a1", workerId: "w1", clientId: "c1", weekStart: weekStart(), regularHours: 38.5, overtimeHours: 0, agencyApproved: true, clientApproved: true, status: "Final Approved", disputeReason: "" },
    { id: "t2", agencyId: "a1", workerId: "w2", clientId: "c1", weekStart: weekStart(), regularHours: 41.25, overtimeHours: 1.25, agencyApproved: false, clientApproved: true, status: "Client Approved", disputeReason: "" },
    { id: "t3", agencyId: "a1", workerId: "w3", clientId: "c2", weekStart: weekStart(), regularHours: 29.75, overtimeHours: 0, agencyApproved: false, clientApproved: false, status: "Pending Client Review", disputeReason: "" },
    { id: "t4", agencyId: "a2", workerId: "w4", clientId: "c3", weekStart: weekStart(), regularHours: 40, overtimeHours: 0, agencyApproved: true, clientApproved: true, status: "Final Approved", disputeReason: "" }
  ],
  auditLogs: [
    { id: "log1", agencyId: "a1", timesheetId: "t1", action: "Client Approved", actorRole: "Client Manager", actorName: "Receiving Manager", timestamp: todayAt("15:10"), note: "Hours verified by client." },
    { id: "log2", agencyId: "a1", timesheetId: "t1", action: "Final Approved", actorRole: "Agency Admin", actorName: "Agency Admin", timestamp: todayAt("15:35"), note: "Ready for payroll export." }
  ]
};

function todayAt(time) {
  const d = new Date();
  const [h, m] = time.split(":");
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toISOString();
}

function weekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0,0,0,0);
  return monday.toISOString().slice(0,10);
}

let state = load();

function load() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) return structuredClone(seedData);
  try { return normalize(JSON.parse(existing)); } 
  catch { return structuredClone(seedData); }
}

function normalize(data) {
  const merged = { ...structuredClone(seedData), ...data };
  if (!merged.activeClientId || !merged.clients.some(c => c.id === merged.activeClientId)) {
    merged.activeClientId = merged.clients.find(c => c.agencyId === merged.activeAgencyId)?.id || merged.clients[0]?.id;
  }
  if (!merged.activeWorkerId || !merged.workers.some(w => w.id === merged.activeWorkerId)) {
    merged.activeWorkerId = merged.workers.find(w => w.agencyId === merged.activeAgencyId)?.id || merged.workers[0]?.id;
  }
  merged.timesheets = merged.timesheets.map(t => ({
    ...t,
    clientId: t.clientId || assignmentForWorkerInData(merged, t.workerId)?.clientId || null,
    status: t.status || inferTimesheetStatus(t),
    disputeReason: t.disputeReason || ""
  }));
  merged.auditLogs = merged.auditLogs || [];
  return merged;
}

function inferTimesheetStatus(t) {
  if (t.agencyApproved && t.clientApproved) return "Final Approved";
  if (t.clientApproved) return "Client Approved";
  if (t.disputeReason) return "Disputed";
  return "Pending Client Review";
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function agency() {
  return state.agencies.find(a => a.id === state.activeAgencyId) || state.agencies[0];
}

function activeClient() {
  return state.clients.find(c => c.id === state.activeClientId) || agencyClients()[0];
}

function activeWorker() {
  return state.workers.find(w => w.id === state.activeWorkerId) || agencyWorkers()[0];
}

function agencyClients() {
  return state.clients.filter(c => c.agencyId === state.activeAgencyId);
}

function agencySites() {
  return state.sites.filter(s => s.agencyId === state.activeAgencyId);
}

function agencyWorkers() {
  return state.workers.filter(w => w.agencyId === state.activeAgencyId);
}

function clientSites() {
  return agencySites().filter(s => s.clientId === state.activeClientId);
}

function clientWorkerIds() {
  const siteIds = new Set(clientSites().map(s => s.id));
  return new Set(state.assignments.filter(a => a.agencyId === state.activeAgencyId && a.clientId === state.activeClientId && siteIds.has(a.siteId)).map(a => a.workerId));
}

function rowsFor(collection) {
  let rows = state[collection] || [];

  if (state.activeRole !== "super_admin" || state.activeView !== "agencies") {
    rows = rows.filter(row => row.agencyId === state.activeAgencyId);
  }

  if (state.activeRole === "client_manager") {
    if (collection === "clients") rows = rows.filter(r => r.id === state.activeClientId);
    if (collection === "sites") rows = rows.filter(r => r.clientId === state.activeClientId);
    if (collection === "assignments") rows = rows.filter(r => r.clientId === state.activeClientId);
    if (collection === "workers") {
      const ids = clientWorkerIds();
      rows = rows.filter(r => ids.has(r.id));
    }
    if (collection === "punches") {
      const siteIds = new Set(clientSites().map(s => s.id));
      rows = rows.filter(r => siteIds.has(r.siteId));
    }
    if (collection === "timesheets") rows = rows.filter(r => r.clientId === state.activeClientId);
  }

  if (state.activeRole === "worker") {
    if (collection === "workers") rows = rows.filter(r => r.id === state.activeWorkerId);
    if (collection === "punches") rows = rows.filter(r => r.workerId === state.activeWorkerId);
    if (collection === "timesheets") rows = rows.filter(r => r.workerId === state.activeWorkerId);
    if (collection === "assignments") rows = rows.filter(r => r.workerId === state.activeWorkerId);
    if (collection === "sites") {
      const siteIds = new Set(rowsFor("assignments").map(a => a.siteId));
      rows = rows.filter(r => siteIds.has(r.id));
    }
    if (collection === "clients") {
      const clientIds = new Set(rowsFor("assignments").map(a => a.clientId));
      rows = rows.filter(r => clientIds.has(r.id));
    }
  }

  return rows;
}

function clientName(id) {
  return state.clients.find(c => c.id === id)?.name || "Unknown Client";
}

function siteName(id) {
  const s = state.sites.find(site => site.id === id);
  return s ? `${s.siteCode} · ${s.address}` : "Unknown Site";
}

function workerName(id) {
  const w = state.workers.find(worker => worker.id === id);
  return w ? `${w.firstName} ${w.lastName}` : "Unknown Worker";
}

function assignmentForWorker(workerId) {
  return state.assignments.find(a => a.workerId === workerId && a.active);
}

function assignmentForWorkerInData(data, workerId) {
  return data.assignments.find(a => a.workerId === workerId && a.active);
}

const navByRole = {
  super_admin: [
    ["login_portal", "Login Options"],
    ["dashboard", "Command Center"],
    ["agencies", "Agencies"],
    ["clients", "Clients"],
    ["sites", "Job Sites / QR"],
    ["workers", "Workers"],
    ["assignments", "Assignments"],
    ["timesheets", "Timesheets"],
    ["reports", "Payroll & Margin"],
    ["timeclock", "QR Timeclock"]
  ],
  agency_admin: [
    ["login_portal", "Login Options"],
    ["dashboard", "Agency Dashboard"],
    ["clients", "Clients"],
    ["sites", "Job Sites / QR"],
    ["workers", "Workers"],
    ["assignments", "Assignments"],
    ["timesheets", "Timesheets"],
    ["reports", "Payroll & Margin"],
    ["timeclock", "QR Timeclock"]
  ],
  client_manager: [
    ["login_portal", "Login Options"],
    ["dashboard", "Client Dashboard"],
    ["workers", "Assigned Workers"],
    ["timesheets", "Approve Timesheets"],
    ["timeclock", "Site Timeclock"]
  ],
  worker: [
    ["login_portal", "Login Options"],
    ["timeclock", "Clock In / Out"],
    ["timesheets", "My Weekly Hours"]
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  applyUrlParams();
  bindBasics();
  renderShell();
  render();
  setInterval(updateClock, 1000);
});

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  const agencyNumber = params.get("agency");
  const siteCode = params.get("site");

  if (agencyNumber) {
    const foundAgency = state.agencies.find(a => a.agencyNumber.toLowerCase() === agencyNumber.toLowerCase());
    if (foundAgency) state.activeAgencyId = foundAgency.id;
  }

  if (siteCode) {
    const site = state.sites.find(s => s.agencyId === state.activeAgencyId && s.siteCode.toLowerCase() === siteCode.toLowerCase());
    if (site) {
      state.activeClientId = site.clientId;
      state.activeView = "timeclock";
    }
  }

  save();
}

function bindBasics() {
  document.getElementById("roleSelect").addEventListener("change", e => {
    state.activeRole = e.target.value;
    state.activeView = navByRole[state.activeRole][0][0];
    ensureSelections();
    save();
    renderShell();
    render();
  });

  document.getElementById("agencySelect").addEventListener("change", e => {
    state.activeAgencyId = e.target.value;
    ensureSelections();
    save();
    renderShell();
    render();
  });

  document.getElementById("clientSelect").addEventListener("change", e => {
    state.activeClientId = e.target.value;
    ensureSelections();
    save();
    renderShell();
    render();
  });

  document.getElementById("workerSelect").addEventListener("change", e => {
    state.activeWorkerId = e.target.value;
    save();
    renderShell();
    render();
  });

  document.getElementById("resetDemoBtn").addEventListener("click", () => {
    state = structuredClone(seedData);
    localStorage.removeItem(STORAGE_KEY);
    save();
    renderShell();
    render();
    toast("Demo data reset.");
  });

  document.getElementById("exportBtn").addEventListener("click", exportPayroll);

  document.addEventListener("click", e => {
    const loginRole = e.target.closest("[data-login-role]")?.dataset.loginRole;
    const loginView = e.target.closest("[data-login-view]")?.dataset.loginView;
    if (loginRole) {
      state.activeRole = loginRole;
      state.activeView = loginView || navByRole[loginRole][0][0];
      ensureSelections();
      save();
      renderShell();
      render();
      return;
    }

    const view = e.target.closest("[data-view]")?.dataset.view;
    if (view) {
      state.activeView = view;
      save();
      renderShell();
      render();
    }

    const punch = e.target.closest("[data-punch]")?.dataset.punch;
    if (punch) createPunch(punch);

    const approve = e.target.closest("[data-approve]")?.dataset.approve;
    if (approve) approveTimesheet(approve);

    const reject = e.target.closest("[data-reject]")?.dataset.reject;
    if (reject) rejectTimesheet(reject);

    const copy = e.target.closest("[data-copy]")?.dataset.copy;
    if (copy) copyText(copy);
  });

  document.addEventListener("input", e => {
    if (e.target.id === "workerNameInput") {
      const display = document.getElementById("enteredNameDisplay");
      if (display) display.textContent = e.target.value || "-";
    }
  });

  document.addEventListener("submit", e => {
    e.preventDefault();
    if (e.target.id === "agencyForm") addAgency(new FormData(e.target));
    if (e.target.id === "workerForm") addWorker(new FormData(e.target));
    if (e.target.id === "clientForm") addClient(new FormData(e.target));
    if (e.target.id === "siteForm") addSite(new FormData(e.target));
    if (e.target.id === "assignmentForm") addAssignment(new FormData(e.target));
  });
}

function ensureSelections() {
  if (!agencyClients().some(c => c.id === state.activeClientId)) state.activeClientId = agencyClients()[0]?.id || "";
  if (!agencyWorkers().some(w => w.id === state.activeWorkerId)) state.activeWorkerId = agencyWorkers()[0]?.id || "";
}

function renderShell() {
  document.getElementById("roleSelect").value = state.activeRole;

  const agencySelect = document.getElementById("agencySelect");
  agencySelect.innerHTML = state.agencies.map(a => `<option value="${a.id}">${a.agencyNumber} · ${a.name}</option>`).join("");
  agencySelect.value = state.activeAgencyId;

  const clientSelect = document.getElementById("clientSelect");
  clientSelect.innerHTML = agencyClients().map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  clientSelect.value = state.activeClientId;

  const workerSelect = document.getElementById("workerSelect");
  workerSelect.innerHTML = agencyWorkers().map(w => `<option value="${w.id}">${w.workerNumber} · ${w.firstName} ${w.lastName}</option>`).join("");
  workerSelect.value = state.activeWorkerId;

  document.getElementById("clientBox").style.display = state.activeRole === "client_manager" ? "block" : "none";
  document.getElementById("workerBox").style.display = state.activeRole === "worker" ? "block" : "none";
  document.getElementById("agencyBox").style.display = "block";

  const nav = document.getElementById("nav");
  nav.innerHTML = navByRole[state.activeRole].map(([view, label]) => `
    <button class="nav-btn ${state.activeView === view ? "active" : ""}" data-view="${view}">${label}</button>
  `).join("");

  const title = navByRole[state.activeRole].find(([v]) => v === state.activeView)?.[1] || "Dashboard";
  document.getElementById("pageTitle").textContent = title;

  const context = state.activeRole === "client_manager"
    ? `${agency().agencyNumber} · ${activeClient()?.name || "Client"}`
    : state.activeRole === "worker"
      ? `${agency().agencyNumber} · ${workerName(state.activeWorkerId)}`
      : `${agency().agencyNumber} · ${agency().name}`;

  document.getElementById("activeContextLabel").textContent = context;
}

function render() {
  const view = document.getElementById("view");
  const map = {
    login_portal: loginPortalView,
    dashboard: dashboardView,
    agencies: agenciesView,
    clients: clientsView,
    sites: sitesView,
    workers: workersView,
    assignments: assignmentsView,
    timesheets: timesheetsView,
    reports: reportsView,
    timeclock: timeclockView
  };
  view.innerHTML = (map[state.activeView] || dashboardView)();
  updateClock();
}

function dashboardStats() {
  const punches = rowsFor("punches");
  const workers = rowsFor("workers");
  const timesheets = rowsFor("timesheets");
  const present = new Set(punches.filter(p => p.type === "Clock In").map(p => p.workerId)).size;
  const late = punches.filter(p => p.status === "Late").length;
  const totalHours = timesheets.reduce((sum, t) => sum + Number(t.regularHours) + Number(t.overtimeHours), 0);
  const missing = Math.max(workers.length - present, 0);
  return { present, late, totalHours, missing, workers: workers.length };
}


function loginPortalView() {
  return `
    <div class="login-hero card">
      <div>
        <p class="eyebrow">TimeClock Pro Style</p>
        <h3>Choose a portal login</h3>
        <p class="muted">Each login type has a different purpose. Workers get a simple punch screen. Managers and agencies get approvals, corrections, exports, and reporting.</p>
      </div>
      <div class="login-mini-clock" id="miniClock">--:--:--</div>
    </div>

    <div class="portal-grid">
      ${portalCard("worker", "Worker Punch", "Scan QR, enter name, clock in, lunch, and clock out.", "Open Worker Punch", "timeclock")}
      ${portalCard("client_manager", "Client Manager", "Approve or dispute weekly hours for your assigned job site.", "Open Client Portal", "timesheets")}
      ${portalCard("agency_admin", "Agency Admin", "Manage workers, assignments, payroll export, and final approval.", "Open Agency Portal", "dashboard")}
      ${portalCard("super_admin", "Super Admin", "Create agencies, demo accounts, and oversee all tenants.", "Open Admin Portal", "agencies")}
    </div>

    <div class="grid three-col" style="margin-top:14px;">
      <div class="card">
        <h3>Worker Side</h3>
        <p class="muted">Designed like your QRTimeclock app: mobile-first, name entry, four big punch buttons, and instant punch confirmation.</p>
      </div>
      <div class="card">
        <h3>Manager Side</h3>
        <p class="muted">Live punch feed, weekly signoff, manual corrections, dispute history, and approval lockout.</p>
      </div>
      <div class="card">
        <h3>Agency Side</h3>
        <p class="muted">Workers, clients, sites, assignments, pay/bill rates, margin dashboard, and payroll CSV export.</p>
      </div>
    </div>
  `;
}

function portalCard(role, title, description, button, targetView) {
  return `
    <div class="portal-card card">
      <div class="portal-icon">${title.split(" ").map(w => w[0]).join("").slice(0,2)}</div>
      <h3>${title}</h3>
      <p class="muted">${description}</p>
      <button class="secondary-btn" data-login-role="${role}" data-login-view="${targetView}">${button}</button>
    </div>
  `;
}

function dashboardView() {
  const s = dashboardStats();
  return `
    <div class="grid kpi-grid">
      ${kpi("Present Today", s.present, "Clocked in", "green")}
      ${kpi("Late Punches", s.late, "Needs review", s.late ? "yellow" : "green")}
      ${kpi("No-Show Risk", s.missing, "Not clocked", s.missing ? "red" : "green")}
      ${kpi("Weekly Hours", s.totalHours.toFixed(2), "Regular + OT", "blue")}
    </div>

    <div class="grid two-col" style="margin-top:14px;">
      <div class="card">
        <h3>Live Attendance</h3>
        ${punchTable(rowsFor("punches").slice(-8).reverse())}
      </div>
      <div class="card">
        <h3>Portal Health</h3>
        <div class="list">
          <div class="list-item"><div><div class="strong">Agency Data Separation</div><div class="muted small">Current view only shows the selected agency or client.</div></div><span class="badge green">Fixed</span></div>
          <div class="list-item"><div><div class="strong">QR Link Routing</div><div class="muted small">Agency and site parameters now preselect the timeclock context.</div></div><span class="badge green">Fixed</span></div>
          <div class="list-item"><div><div class="strong">Client Approval Flow</div><div class="muted small">Client Manager only sees assigned client workers and timesheets.</div></div><span class="badge green">Fixed</span></div>
        </div>
      </div>
    </div>
  `;
}

function kpi(label, value, note, color) {
  return `
    <div class="card kpi-card">
      <p class="label">${label}</p>
      <div class="value">${value}</div>
      <p class="note"><span class="badge ${color}">${note}</span></p>
    </div>
  `;
}

function agenciesView() {
  return `
    <div class="grid two-col">
      <div class="card">
        <h3>Create Agency</h3>
        <form id="agencyForm" class="form-grid">
          <div><label>Agency Name</label><input name="name" required placeholder="Example Staffing LLC"></div>
          <div><label>Owner</label><input name="owner" required placeholder="Owner name"></div>
          <div><label>Plan</label><select name="plan"><option>Starter</option><option>Growth</option><option>Pro</option><option>Enterprise</option></select></div>
          <div><label>Status</label><select name="status"><option>Active</option><option>Trial</option><option>Paused</option></select></div>
          <button class="primary-btn wide">Add Agency</button>
        </form>
      </div>
      <div class="card">
        <h3>Multi-Tenant Rule</h3>
        <p class="muted">Every agency gets a unique number. All clients, sites, workers, assignments, punches, and timesheets stay tied to that agency.</p>
        <div class="qr-box">Example: TA-1001 → Site QR → Worker Punch → Timesheet → Payroll Export</div>
      </div>
    </div>
    <div class="card" style="margin-top:14px;">
      <h3>Agencies</h3>
      <div class="table-wrap">
        <table><thead><tr><th>Agency #</th><th>Name</th><th>Owner</th><th>Plan</th><th>Status</th></tr></thead>
        <tbody>${state.agencies.map(a => `<tr><td>${a.agencyNumber}</td><td>${a.name}</td><td>${a.owner}</td><td>${a.plan}</td><td><span class="badge green">${a.status}</span></td></tr>`).join("")}</tbody></table>
      </div>
    </div>
  `;
}

function clientsView() {
  const clients = rowsFor("clients");
  return `
    <div class="grid two-col">
      <div class="card">
        <h3>Add Client</h3>
        <form id="clientForm" class="form-grid">
          <div><label>Client Name</label><input name="name" required placeholder="Warehouse / Company"></div>
          <div><label>Contact</label><input name="contact" required placeholder="Site contact"></div>
          <div class="wide"><label>Email</label><input name="email" type="email" required placeholder="contact@company.com"></div>
          <button class="primary-btn wide">Add Client</button>
        </form>
      </div>
      <div class="card">
        <h3>Client Portal Value</h3>
        <p class="muted">The buyer gets a professional approval portal instead of messy texts, spreadsheets, and handwritten temp sheets.</p>
      </div>
    </div>
    <div class="card" style="margin-top:14px;">
      <h3>Clients</h3>
      ${clients.length ? `<div class="table-wrap"><table><thead><tr><th>Client</th><th>Contact</th><th>Email</th><th>Sites</th></tr></thead>
      <tbody>${clients.map(c => `<tr><td>${c.name}</td><td>${c.contact}</td><td>${c.email}</td><td>${state.sites.filter(s => s.clientId === c.id).length}</td></tr>`).join("")}</tbody></table></div>` : empty("No clients added yet.")}
    </div>
  `;
}

function sitesView() {
  const sites = rowsFor("sites");
  return `
    <div class="grid two-col">
      <div class="card">
        <h3>Add Job Site</h3>
        <form id="siteForm" class="form-grid">
          <div><label>Client</label><select name="clientId" required>${agencyClients().map(c => `<option value="${c.id}">${c.name}</option>`).join("")}</select></div>
          <div><label>Site Code</label><input name="siteCode" required placeholder="CHD-OH-001"></div>
          <div class="wide"><label>Address</label><input name="address" required placeholder="City, State"></div>
          <div class="wide"><label>GPS Required</label><select name="gpsRequired"><option value="true">Yes</option><option value="false">No</option></select></div>
          <button class="primary-btn wide">Add Site</button>
        </form>
      </div>
      <div class="card">
        <h3>QR Timeclock Link</h3>
        <div class="qr-box">${qrLink(sites[0])}</div>
        <p class="muted small">This link now opens the right agency/site context automatically.</p>
        ${sites[0] ? `<button class="secondary-btn" data-copy="${qrLink(sites[0])}">Copy First Site Link</button>` : ""}
      </div>
    </div>
    <div class="card" style="margin-top:14px;">
      <h3>Job Sites</h3>
      ${sites.length ? `<div class="table-wrap"><table><thead><tr><th>Client</th><th>Site Code</th><th>Address</th><th>GPS</th><th>QR Link</th></tr></thead>
      <tbody>${sites.map(s => `<tr><td>${clientName(s.clientId)}</td><td>${s.siteCode}</td><td>${s.address}</td><td>${s.gpsRequired ? "Required" : "Optional"}</td><td>${qrLink(s)}</td></tr>`).join("")}</tbody></table></div>` : empty("No job sites added yet.")}
    </div>
  `;
}

function qrLink(site) {
  if (!site) return "Create a site first.";
  return `${location.origin}${location.pathname}?agency=${agency().agencyNumber}&site=${site.siteCode}`;
}

function workersView() {
  const workers = rowsFor("workers");
  return `
    <div class="grid two-col">
      <div class="card">
        <h3>Add Worker</h3>
        <form id="workerForm" class="form-grid">
          <div><label>First Name</label><input name="firstName" required></div>
          <div><label>Last Name</label><input name="lastName" required></div>
          <div><label>Phone</label><input name="phone" required></div>
          <div><label>Status</label><select name="status"><option>Active</option><option>Inactive</option></select></div>
          <button class="primary-btn wide">Add Worker</button>
        </form>
      </div>
      <div class="card">
        <h3>Worker ID Format</h3>
        <div class="qr-box">${agency().agencyNumber}-W0001</div>
        <p class="muted small">Worker IDs inherit the agency number to prevent reporting mix-ups.</p>
      </div>
    </div>
    <div class="card" style="margin-top:14px;">
      <h3>${state.activeRole === "client_manager" ? "Assigned Workers" : "Workers"}</h3>
      ${workers.length ? `<div class="table-wrap"><table><thead><tr><th>Worker #</th><th>Name</th><th>Phone</th><th>Status</th><th>Client / Site</th></tr></thead>
      <tbody>${workers.map(w => {
        const as = assignmentForWorker(w.id);
        return `<tr><td>${w.workerNumber}</td><td>${w.firstName} ${w.lastName}</td><td>${w.phone}</td><td><span class="badge green">${w.status}</span></td><td>${as ? `${clientName(as.clientId)} / ${siteName(as.siteId)}` : "Unassigned"}</td></tr>`
      }).join("")}</tbody></table></div>` : empty("No workers found for this view.")}
    </div>
  `;
}

function assignmentsView() {
  const rows = rowsFor("assignments");
  return `
    <div class="grid two-col">
      <div class="card">
        <h3>Create Assignment</h3>
        <form id="assignmentForm" class="form-grid">
          <div><label>Worker</label><select name="workerId" required>${agencyWorkers().map(w => `<option value="${w.id}">${w.workerNumber} · ${w.firstName} ${w.lastName}</option>`).join("")}</select></div>
          <div><label>Client</label><select name="clientId" required>${agencyClients().map(c => `<option value="${c.id}">${c.name}</option>`).join("")}</select></div>
          <div><label>Job Site</label><select name="siteId" required>${agencySites().map(s => `<option value="${s.id}">${s.siteCode} · ${clientName(s.clientId)}</option>`).join("")}</select></div>
          <div><label>Shift Start</label><input name="shiftStart" type="time" value="07:00" required></div>
          <div><label>Shift End</label><input name="shiftEnd" type="time" value="15:30" required></div>
          <div><label>Pay Rate</label><input name="payRate" type="number" min="0" step="0.01" value="18" required></div>
          <div><label>Bill Rate</label><input name="billRate" type="number" min="0" step="0.01" value="27" required></div>
          <button class="primary-btn wide">Create Assignment</button>
        </form>
      </div>
      <div class="card">
        <h3>Why This Matters</h3>
        <p class="muted">Assignments connect worker, client, site, shift, pay rate, and bill rate. That makes timesheets and profit reports make sense.</p>
      </div>
    </div>
    <div class="card" style="margin-top:14px;">
      <h3>Assignments</h3>
      ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Worker</th><th>Client</th><th>Site</th><th>Shift</th><th>Pay</th><th>Bill</th><th>Margin</th></tr></thead>
      <tbody>${rows.map(a => `<tr>
        <td>${workerName(a.workerId)}</td><td>${clientName(a.clientId)}</td><td>${siteName(a.siteId)}</td>
        <td>${a.shiftStart} - ${a.shiftEnd}</td><td>$${Number(a.payRate).toFixed(2)}/hr</td><td>$${Number(a.billRate).toFixed(2)}/hr</td><td><span class="badge green">$${(Number(a.billRate) - Number(a.payRate)).toFixed(2)}/hr</span></td>
      </tr>`).join("")}</tbody></table></div>` : empty("No assignments yet.")}
    </div>
  `;
}

function timesheetsView() {
  const rows = rowsFor("timesheets");
  return `
    <div class="grid two-col">
      <div class="card">
        <h3>${state.activeRole === "worker" ? "My Weekly Hours" : "Weekly Timesheets"}</h3>
        ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Week</th><th>Worker</th><th>Client</th><th>Regular</th><th>OT</th><th>Total</th><th>Status</th><th>Agency</th><th>Client</th><th>Action</th></tr></thead>
        <tbody>${rows.map(t => `<tr>
          <td>${t.weekStart}</td>
          <td>${workerName(t.workerId)}</td>
          <td>${clientName(t.clientId)}</td>
          <td>${t.regularHours}</td>
          <td>${t.overtimeHours}</td>
          <td>${(Number(t.regularHours) + Number(t.overtimeHours)).toFixed(2)}</td>
          <td>${statusBadge(t.status)}</td>
          <td><span class="badge ${t.agencyApproved ? "green" : "yellow"}">${t.agencyApproved ? "Approved" : "Pending"}</span></td>
          <td><span class="badge ${t.clientApproved ? "green" : t.status === "Disputed" ? "red" : "yellow"}">${t.clientApproved ? "Approved" : t.status === "Disputed" ? "Disputed" : "Pending"}</span></td>
          <td>${approvalActions(t)}</td>
        </tr>`).join("")}</tbody></table></div>` : empty("No timesheets found for this view.")}
      </div>

      <div class="card">
        <h3>Approval Rules</h3>
        <div class="list">
          <div class="list-item"><div><div class="strong">Worker</div><div class="muted small">Can view hours only. No approval access.</div></div><span class="badge red">Locked</span></div>
          <div class="list-item"><div><div class="strong">Client Manager</div><div class="muted small">Can approve or dispute client-side hours.</div></div><span class="badge blue">Client</span></div>
          <div class="list-item"><div><div class="strong">Agency Admin</div><div class="muted small">Can finalize only after client approval.</div></div><span class="badge green">Final</span></div>
          <div class="list-item"><div><div class="strong">Super Admin</div><div class="muted small">Can override for demo/admin purposes.</div></div><span class="badge blue">Override</span></div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <h3>Approval / Dispute History</h3>
      ${auditLogTable(rows.map(r => r.id))}
    </div>
  `;
}

function statusBadge(status) {
  const cls = status === "Final Approved" ? "green" : status === "Client Approved" ? "blue" : status === "Disputed" ? "red" : "yellow";
  return `<span class="badge ${cls}">${status || "Pending Client Review"}</span>`;
}

function approvalActions(t) {
  if (state.activeRole === "worker") {
    return '<span class="muted small">View only</span>';
  }

  if (t.status === "Final Approved") {
    return '<span class="muted small">Locked</span>';
  }

  if (state.activeRole === "client_manager") {
    if (t.clientApproved) return '<span class="muted small">Client approved</span>';
    return `
      <button class="secondary-btn" data-approve="${t.id}">Approve</button>
      <button class="danger-btn" data-reject="${t.id}">Dispute</button>
    `;
  }

  if (state.activeRole === "agency_admin") {
    if (!t.clientApproved) return '<span class="muted small">Waiting on client</span>';
    return `<button class="secondary-btn" data-approve="${t.id}">Finalize</button>`;
  }

  if (state.activeRole === "super_admin") {
    return `
      <button class="secondary-btn" data-approve="${t.id}">Admin Approve</button>
      <button class="danger-btn" data-reject="${t.id}">Dispute</button>
    `;
  }

  return '<span class="muted small">No access</span>';
}

function auditLogTable(timesheetIds) {
  const logs = (state.auditLogs || [])
    .filter(log => log.agencyId === state.activeAgencyId && timesheetIds.includes(log.timesheetId))
    .slice()
    .reverse();

  if (!logs.length) return empty("No approval history yet.");

  return `<div class="table-wrap"><table><thead><tr><th>Time</th><th>Timesheet</th><th>Action</th><th>Actor</th><th>Note</th></tr></thead>
    <tbody>${logs.map(log => `<tr>
      <td>${new Date(log.timestamp).toLocaleString()}</td>
      <td>${workerName(state.timesheets.find(t => t.id === log.timesheetId)?.workerId)}</td>
      <td>${log.action}</td>
      <td>${log.actorName} · ${log.actorRole}</td>
      <td>${log.note || ""}</td>
    </tr>`).join("")}</tbody></table></div>`;
}

function reportsView() {
  const rows = rowsFor("timesheets").map(t => {
    const as = assignmentForWorker(t.workerId) || { payRate: 0, billRate: 0 };
    const hours = Number(t.regularHours) + Number(t.overtimeHours);
    return { ...t, hours, pay: hours * Number(as.payRate), bill: hours * Number(as.billRate), margin: hours * (Number(as.billRate) - Number(as.payRate)) };
  });
  const totals = rows.reduce((a, r) => ({ hours: a.hours + r.hours, pay: a.pay + r.pay, bill: a.bill + r.bill, margin: a.margin + r.margin }), {hours:0,pay:0,bill:0,margin:0});
  return `
    <div class="grid kpi-grid">
      ${kpi("Total Hours", totals.hours.toFixed(2), "Payroll hours", "blue")}
      ${kpi("Worker Pay", "$" + totals.pay.toFixed(2), "Estimated payroll", "yellow")}
      ${kpi("Client Billing", "$" + totals.bill.toFixed(2), "Estimated invoice", "green")}
      ${kpi("Gross Margin", "$" + totals.margin.toFixed(2), "Agency profit", "green")}
    </div>
    <div class="card" style="margin-top:14px;">
      <h3>Payroll & Margin Report</h3>
      ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Worker</th><th>Client</th><th>Hours</th><th>Pay Estimate</th><th>Bill Estimate</th><th>Margin</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${workerName(r.workerId)}</td><td>${clientName(r.clientId)}</td><td>${r.hours.toFixed(2)}</td><td>$${r.pay.toFixed(2)}</td><td>$${r.bill.toFixed(2)}</td><td><span class="badge green">$${r.margin.toFixed(2)}</span></td></tr>`).join("")}</tbody></table></div>` : empty("No payroll records found.")}
    </div>
  `;
}

function timeclockView() {
  const isWorker = state.activeRole === "worker";
  const workers = isWorker ? [activeWorker()].filter(Boolean) : rowsFor("workers");
  const sites = state.activeRole === "client_manager" ? clientSites() : isWorker ? rowsFor("sites") : agencySites();
  const selectedWorker = activeWorker();

  return `
    <div class="timeclock-layout">
      <section class="tc-worker-card card">
        <div class="tc-header">
          <div>
            <h3>Worker Punch</h3>
            <p>Scan the shared QR code, type your name, then tap the action you need.</p>
          </div>
          <span class="tc-status">Ready</span>
        </div>

        <label>Your name</label>
        ${isWorker ? `
          <input id="workerNameInput" value="${selectedWorker ? `${selectedWorker.firstName} ${selectedWorker.lastName}` : ""}" readonly />
          <input type="hidden" id="clockWorkerHidden" value="${selectedWorker?.id || ""}" />
        ` : `
          <input id="workerNameInput" list="workerNames" placeholder="Start typing worker name" value="${workers[0] ? `${workers[0].firstName} ${workers[0].lastName}` : ""}" />
          <datalist id="workerNames">
            ${workers.map(w => `<option data-id="${w.id}" value="${w.firstName} ${w.lastName}"></option>`).join("")}
          </datalist>
        `}

        <label style="margin-top:12px;">Job site</label>
        <select id="clockSite">${sites.map(s => `<option value="${s.id}">${s.siteCode} · ${clientName(s.clientId)}</option>`).join("")}</select>

        <div class="tc-punch-grid">
          <button class="tc-punch-btn clock-in" data-punch="Clock In">Clock In</button>
          <button class="tc-punch-btn lunch-start" data-punch="Start Lunch">Start Lunch</button>
          <button class="tc-punch-btn lunch-end" data-punch="End Lunch">End Lunch</button>
          <button class="tc-punch-btn clock-out" data-punch="Clock Out">Clock Out</button>
        </div>

        <div class="tc-summary">
          <div><span>Entered name</span><strong id="enteredNameDisplay">${selectedWorker ? `${selectedWorker.firstName} ${selectedWorker.lastName}` : "-"}</strong></div>
          <div><span>Last action</span><strong>${lastPunchForWorker(selectedWorker?.id)?.type || "-"}</strong></div>
          <div><span>Last punch</span><strong>${formatLastPunch(lastPunchForWorker(selectedWorker?.id))}</strong></div>
          <div><span>Status</span><strong>Enter your name and punch.</strong></div>
        </div>
      </section>

      <section class="card">
        <h3>Manager Sign In / Live View</h3>
        <p class="muted">Managers and admins use their login portal to view live punches, sign weekly timesheets, edit punches, manage users, and export agency sheets.</p>

        <div class="tc-tabs">
          <button class="tc-tab" data-view="dashboard">Live</button>
          <button class="tc-tab" data-view="timesheets">Weekly Signoff</button>
          <button class="tc-tab" data-view="timesheets">Edit Punches</button>
          <button class="tc-tab" data-view="workers">Users</button>
          <button class="tc-tab" data-view="reports">Agency Export</button>
        </div>

        <h3 style="margin-top:18px;">Live punch feed</h3>
        <p class="muted small">This updates as workers punch from their phones.</p>
        ${punchTable(rowsFor("punches").slice(-8).reverse())}
      </section>
    </div>
  `;
}

function lastPunchForWorker(workerId) {
  if (!workerId) return null;
  return rowsFor("punches").filter(p => p.workerId === workerId).slice(-1)[0] || null;
}

function formatLastPunch(punch) {
  return punch ? new Date(punch.timestamp).toLocaleString() : "-";
}

function punchTable(rows) {
  if (!rows.length) return empty("No punches recorded yet.");
  return `<div class="table-wrap"><table><thead><tr><th>Time</th><th>Worker</th><th>Site</th><th>Type</th><th>GPS</th><th>Photo</th><th>Status</th></tr></thead>
  <tbody>${rows.map(p => `<tr><td>${new Date(p.timestamp).toLocaleString()}</td><td>${workerName(p.workerId)}</td><td>${siteName(p.siteId)}</td><td>${p.type}</td><td>${p.gps}</td><td>${p.photo}</td><td><span class="badge ${p.status === "Late" ? "yellow" : "green"}">${p.status}</span></td></tr>`).join("")}</tbody></table></div>`;
}

function empty(message) {
  return `<div class="empty-state">${message}</div>`;
}

function updateClock() {
  const el = document.getElementById("clockFace");
  if (el) el.textContent = new Date().toLocaleTimeString();

  const mini = document.getElementById("miniClock");
  if (mini) mini.textContent = new Date().toLocaleTimeString();
}

function createPunch(type) {
  const typedName = document.getElementById("workerNameInput")?.value?.trim();
  let workerId = document.getElementById("clockWorkerHidden")?.value || state.activeWorkerId;

  if (!workerId && typedName) {
    const match = agencyWorkers().find(w => `${w.firstName} ${w.lastName}`.toLowerCase() === typedName.toLowerCase());
    workerId = match?.id;
  }

  if (!workerId && typedName) {
    const [firstName, ...rest] = typedName.split(" ");
    const lastName = rest.join(" ") || "Temp";
    const count = agencyWorkers().length + 1;
    const num = String(count).padStart(4, "0");
    workerId = "w" + crypto.randomUUID();

    state.workers.push({
      id: workerId,
      agencyId: state.activeAgencyId,
      workerNumber: `${agency().agencyNumber}-W${num}`,
      firstName,
      lastName,
      phone: "",
      status: "Active"
    });

    const defaultSite = document.getElementById("clockSite")?.value || agencySites()[0]?.id;
    const site = state.sites.find(s => s.id === defaultSite);
    if (site) {
      state.assignments.push({
        id: "as" + crypto.randomUUID(),
        agencyId: state.activeAgencyId,
        workerId,
        clientId: site.clientId,
        siteId: site.id,
        payRate: 0,
        billRate: 0,
        shiftStart: "07:00",
        shiftEnd: "15:30",
        active: true
      });
    }
  }

  const siteId = document.getElementById("clockSite")?.value || agencySites()[0]?.id;
  if (!workerId || !siteId) return toast("Enter a worker name and choose a job site first.");

  const site = state.sites.find(s => s.id === siteId);
  const as = assignmentForWorker(workerId);
  const nowTime = new Date().toTimeString().slice(0,5);
  const late = type === "Clock In" && as?.shiftStart && nowTime > as.shiftStart;

  state.punches.push({
    id: "p" + crypto.randomUUID(),
    agencyId: state.activeAgencyId,
    workerId,
    siteId,
    type,
    timestamp: new Date().toISOString(),
    gps: site?.gpsRequired ? "Verified" : "Not Required",
    photo: type === "Clock In" ? "Yes" : "No",
    status: late ? "Late" : "Approved"
  });

  state.activeWorkerId = workerId;
  save();
  renderShell();
  render();
  toast(`${type} saved.`);
}

function approveTimesheet(id) {
  const t = state.timesheets.find(row => row.id === id);
  if (!t) return;

  if (state.activeRole === "worker") {
    return toast("Workers cannot approve their own time.");
  }

  if (t.status === "Final Approved" && state.activeRole !== "super_admin") {
    return toast("This timesheet is already finalized.");
  }

  if (state.activeRole === "client_manager") {
    if (t.clientId !== state.activeClientId) return toast("You can only approve your selected client's timesheets.");
    t.clientApproved = true;
    t.status = "Client Approved";
    t.disputeReason = "";
    addAuditLog(t.id, "Client Approved", "Hours verified by client.");
  }

  if (state.activeRole === "agency_admin") {
    if (!t.clientApproved) {
      return toast("Client must approve before agency final approval.");
    }
    t.agencyApproved = true;
    t.status = "Final Approved";
    addAuditLog(t.id, "Final Approved", "Approved by agency for payroll.");
  }

  if (state.activeRole === "super_admin") {
    t.clientApproved = true;
    t.agencyApproved = true;
    t.status = "Final Approved";
    t.disputeReason = "";
    addAuditLog(t.id, "Super Admin Override", "Timesheet approved by super admin.");
  }

  save();
  render();
  toast("Timesheet updated.");
}

function rejectTimesheet(id) {
  const t = state.timesheets.find(row => row.id === id);
  if (!t) return;

  if (state.activeRole === "worker") {
    return toast("Workers cannot dispute or approve timesheets.");
  }

  if (state.activeRole === "agency_admin") {
    return toast("Agency admins should send disputed hours back to the client/worker review process.");
  }

  if (state.activeRole === "client_manager" && t.clientId !== state.activeClientId) {
    return toast("You can only dispute your selected client's timesheets.");
  }

  const reason = prompt("Enter dispute reason:", t.disputeReason || "Hours need review.");
  if (!reason) return;

  t.clientApproved = false;
  t.agencyApproved = false;
  t.status = "Disputed";
  t.disputeReason = reason;
  addAuditLog(t.id, "Disputed", reason);

  save();
  render();
  toast("Timesheet disputed.");
}

function addAuditLog(timesheetId, action, note) {
  const actorMap = {
    super_admin: ["Super Admin", "System Owner"],
    agency_admin: ["Agency Admin", "Agency Admin"],
    client_manager: ["Client Manager", activeClient()?.contact || activeClient()?.name || "Client Manager"],
    worker: ["Worker", workerName(state.activeWorkerId)]
  };
  const [actorRole, actorName] = actorMap[state.activeRole] || ["User", "Unknown"];

  state.auditLogs = state.auditLogs || [];
  state.auditLogs.push({
    id: "log" + crypto.randomUUID(),
    agencyId: state.activeAgencyId,
    timesheetId,
    action,
    actorRole,
    actorName,
    timestamp: new Date().toISOString(),
    note
  });
}

function addAgency(fd) {
  const usedNumbers = state.agencies.map(a => Number(a.agencyNumber.replace("TA-", ""))).filter(Boolean);
  const next = Math.max(1000, ...usedNumbers) + 1;
  const id = "a" + crypto.randomUUID();

  state.agencies.push({
    id,
    agencyNumber: `TA-${next}`,
    name: fd.get("name"),
    owner: fd.get("owner"),
    plan: fd.get("plan"),
    status: fd.get("status")
  });

  state.activeAgencyId = id;
  state.activeClientId = "";
  state.activeWorkerId = "";
  save();
  renderShell();
  render();
  toast("Agency created with unique number.");
}

function addClient(fd) {
  const id = "c" + crypto.randomUUID();
  state.clients.push({
    id,
    agencyId: state.activeAgencyId,
    name: fd.get("name"),
    contact: fd.get("contact"),
    email: fd.get("email")
  });
  state.activeClientId = id;
  save();
  renderShell();
  render();
  toast("Client added.");
}

function addSite(fd) {
  if (!fd.get("clientId")) return toast("Add a client first.");
  state.sites.push({
    id: "s" + crypto.randomUUID(),
    agencyId: state.activeAgencyId,
    clientId: fd.get("clientId"),
    siteCode: fd.get("siteCode"),
    address: fd.get("address"),
    gpsRequired: fd.get("gpsRequired") === "true"
  });
  save();
  renderShell();
  render();
  toast("Job site added.");
}

function addWorker(fd) {
  const existing = agencyWorkers().length + 1;
  const num = String(existing).padStart(4, "0");
  const id = "w" + crypto.randomUUID();

  state.workers.push({
    id,
    agencyId: state.activeAgencyId,
    workerNumber: `${agency().agencyNumber}-W${num}`,
    firstName: fd.get("firstName"),
    lastName: fd.get("lastName"),
    phone: fd.get("phone"),
    status: fd.get("status")
  });

  state.activeWorkerId = id;
  save();
  renderShell();
  render();
  toast("Worker added.");
}

function addAssignment(fd) {
  const workerId = fd.get("workerId");
  const clientId = fd.get("clientId");
  const siteId = fd.get("siteId");

  if (!workerId || !clientId || !siteId) return toast("Add worker, client, and site first.");

  const site = state.sites.find(s => s.id === siteId);
  if (site.clientId !== clientId) return toast("Selected site does not belong to that client.");

  state.assignments = state.assignments.map(a => a.workerId === workerId ? { ...a, active: false } : a);

  state.assignments.push({
    id: "as" + crypto.randomUUID(),
    agencyId: state.activeAgencyId,
    workerId,
    clientId,
    siteId,
    payRate: Number(fd.get("payRate")),
    billRate: Number(fd.get("billRate")),
    shiftStart: fd.get("shiftStart"),
    shiftEnd: fd.get("shiftEnd"),
    active: true
  });

  const existingTs = state.timesheets.find(t => t.workerId === workerId && t.weekStart === weekStart());
  if (!existingTs) {
    state.timesheets.push({
      id: "t" + crypto.randomUUID(),
      agencyId: state.activeAgencyId,
      workerId,
      clientId,
      weekStart: weekStart(),
      regularHours: 0,
      overtimeHours: 0,
      agencyApproved: false,
      clientApproved: false,
      status: "Pending Client Review",
      disputeReason: ""
    });
  }

  save();
  renderShell();
  render();
  toast("Assignment created.");
}

function exportPayroll() {
  const rows = rowsFor("timesheets").map(t => {
    const as = assignmentForWorker(t.workerId) || { payRate: 0, billRate: 0 };
    const hours = Number(t.regularHours) + Number(t.overtimeHours);
    return {
      agency_number: agency().agencyNumber,
      client: clientName(t.clientId),
      worker: workerName(t.workerId),
      week_start: t.weekStart,
      regular_hours: t.regularHours,
      overtime_hours: t.overtimeHours,
      total_hours: hours.toFixed(2),
      pay_rate: Number(as.payRate || 0).toFixed(2),
      bill_rate: Number(as.billRate || 0).toFixed(2),
      estimated_pay: (hours * Number(as.payRate || 0)).toFixed(2),
      estimated_bill: (hours * Number(as.billRate || 0)).toFixed(2),
      estimated_margin: (hours * (Number(as.billRate || 0) - Number(as.payRate || 0))).toFixed(2),
      agency_approved: t.agencyApproved,
      client_approved: t.clientApproved
    };
  });

  if (!rows.length) return toast("No payroll data to export.");

  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${agency().agencyNumber}-payroll-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Payroll CSV exported.");
}

function toCsv(rows) {
  const keys = Object.keys(rows[0]);
  return [keys.join(","), ...rows.map(row => keys.map(k => JSON.stringify(row[k] ?? "")).join(","))].join("\n");
}

function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    toast("QR link copied.");
  } else {
    toast("Copy this link manually from the table.");
  }
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
