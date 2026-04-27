const STORAGE_KEY = "temptrack_pro_demo_v1";

const seedData = {
  activeView: "dashboard",
  activeRole: "super_admin",
  activeAgencyId: "a1",
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
    { id: "as1", agencyId: "a1", workerId: "w1", clientId: "c1", siteId: "s1", payRate: 18, billRate: 27, shiftStart: "07:00", shiftEnd: "15:30" },
    { id: "as2", agencyId: "a1", workerId: "w2", clientId: "c1", siteId: "s1", payRate: 19, billRate: 29, shiftStart: "07:00", shiftEnd: "15:30" },
    { id: "as3", agencyId: "a1", workerId: "w3", clientId: "c2", siteId: "s2", payRate: 18, billRate: 26, shiftStart: "08:00", shiftEnd: "16:30" },
    { id: "as4", agencyId: "a2", workerId: "w4", clientId: "c3", siteId: "s3", payRate: 20, billRate: 31, shiftStart: "06:00", shiftEnd: "14:30" }
  ],
  punches: [
    { id: "p1", agencyId: "a1", workerId: "w1", siteId: "s1", type: "Clock In", timestamp: todayAt("06:58"), gps: "Verified", photo: "Yes", status: "Approved" },
    { id: "p2", agencyId: "a1", workerId: "w2", siteId: "s1", type: "Clock In", timestamp: todayAt("07:11"), gps: "Verified", photo: "Yes", status: "Late" },
    { id: "p3", agencyId: "a1", workerId: "w3", siteId: "s2", type: "Clock In", timestamp: todayAt("08:03"), gps: "Not Required", photo: "No", status: "Approved" },
    { id: "p4", agencyId: "a1", workerId: "w1", siteId: "s1", type: "Start Lunch", timestamp: todayAt("12:00"), gps: "Verified", photo: "No", status: "Approved" },
    { id: "p5", agencyId: "a1", workerId: "w1", siteId: "s1", type: "End Lunch", timestamp: todayAt("12:31"), gps: "Verified", photo: "No", status: "Approved" }
  ],
  timesheets: [
    { id: "t1", agencyId: "a1", workerId: "w1", weekStart: weekStart(), regularHours: 38.5, overtimeHours: 0, agencyApproved: true, clientApproved: true },
    { id: "t2", agencyId: "a1", workerId: "w2", weekStart: weekStart(), regularHours: 41.25, overtimeHours: 1.25, agencyApproved: true, clientApproved: false },
    { id: "t3", agencyId: "a1", workerId: "w3", weekStart: weekStart(), regularHours: 29.75, overtimeHours: 0, agencyApproved: false, clientApproved: false },
    { id: "t4", agencyId: "a2", workerId: "w4", weekStart: weekStart(), regularHours: 40, overtimeHours: 0, agencyApproved: true, clientApproved: true }
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
  try { return JSON.parse(existing); } 
  catch { return structuredClone(seedData); }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function agency() {
  return state.agencies.find(a => a.id === state.activeAgencyId) || state.agencies[0];
}

function scoped(collection) {
  if (state.activeRole === "super_admin" && state.activeView === "agencies") return state[collection];
  return state[collection].filter(row => row.agencyId === state.activeAgencyId);
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
  return state.assignments.find(a => a.workerId === workerId);
}

const navByRole = {
  super_admin: [
    ["dashboard", "Command Center"],
    ["agencies", "Agencies"],
    ["clients", "Clients"],
    ["sites", "Job Sites / QR"],
    ["workers", "Workers"],
    ["timesheets", "Timesheets"],
    ["reports", "Payroll & Margin"],
    ["timeclock", "QR Timeclock"]
  ],
  agency_admin: [
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
    ["dashboard", "Client Dashboard"],
    ["workers", "Assigned Workers"],
    ["timesheets", "Approve Timesheets"],
    ["timeclock", "Site Timeclock"]
  ],
  worker: [
    ["timeclock", "Clock In / Out"],
    ["timesheets", "My Weekly Hours"]
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  bindBasics();
  renderShell();
  render();
  setInterval(updateClock, 1000);
});

function bindBasics() {
  document.getElementById("roleSelect").addEventListener("change", e => {
    state.activeRole = e.target.value;
    state.activeView = navByRole[state.activeRole][0][0];
    save();
    renderShell();
    render();
  });

  document.getElementById("agencySelect").addEventListener("change", e => {
    state.activeAgencyId = e.target.value;
    save();
    renderShell();
    render();
  });

  document.getElementById("resetDemoBtn").addEventListener("click", () => {
    state = structuredClone(seedData);
    save();
    renderShell();
    render();
    toast("Demo data reset.");
  });

  document.getElementById("exportBtn").addEventListener("click", exportPayroll);

  document.addEventListener("click", e => {
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
  });

  document.addEventListener("submit", e => {
    e.preventDefault();
    if (e.target.id === "agencyForm") addAgency(new FormData(e.target));
    if (e.target.id === "workerForm") addWorker(new FormData(e.target));
    if (e.target.id === "clientForm") addClient(new FormData(e.target));
    if (e.target.id === "siteForm") addSite(new FormData(e.target));
  });
}

function renderShell() {
  document.getElementById("roleSelect").value = state.activeRole;
  document.getElementById("activeRoleLabel").textContent = roleLabel(state.activeRole);
  const agencySelect = document.getElementById("agencySelect");
  agencySelect.innerHTML = state.agencies.map(a => `<option value="${a.id}">${a.agencyNumber} · ${a.name}</option>`).join("");
  agencySelect.value = state.activeAgencyId;

  const nav = document.getElementById("nav");
  nav.innerHTML = navByRole[state.activeRole].map(([view, label]) => `
    <button class="nav-btn ${state.activeView === view ? "active" : ""}" data-view="${view}">${label}</button>
  `).join("");

  const title = navByRole[state.activeRole].find(([v]) => v === state.activeView)?.[1] || "Dashboard";
  document.getElementById("pageTitle").textContent = title;
}

function roleLabel(role) {
  return role.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function render() {
  const view = document.getElementById("view");
  const map = {
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
  const punches = scoped("punches");
  const workers = scoped("workers");
  const timesheets = scoped("timesheets");
  const present = new Set(punches.filter(p => p.type === "Clock In").map(p => p.workerId)).size;
  const late = punches.filter(p => p.status === "Late").length;
  const totalHours = timesheets.reduce((sum, t) => sum + t.regularHours + t.overtimeHours, 0);
  const otRisk = timesheets.filter(t => t.regularHours + t.overtimeHours >= 38).length;
  const missing = Math.max(workers.length - present, 0);
  return { present, late, totalHours, otRisk, missing, workers: workers.length };
}

function dashboardView() {
  const s = dashboardStats();
  return `
    <div class="grid kpi-grid">
      ${kpi("Present Today", s.present, "Workers clocked in", "green")}
      ${kpi("Late Punches", s.late, "Needs review", s.late ? "yellow" : "green")}
      ${kpi("No-Show Risk", s.missing, "Assigned but not clocked", s.missing ? "red" : "green")}
      ${kpi("Weekly Hours", s.totalHours.toFixed(2), "Regular + OT", "blue")}
    </div>

    <div class="grid two-col" style="margin-top:16px;">
      <div class="card">
        <h3>Live Attendance</h3>
        ${punchTable(scoped("punches").slice(-8).reverse())}
      </div>
      <div class="card">
        <h3>Agency Snapshot</h3>
        <div class="list">
          ${state.agencies.map(a => `
            <div class="list-item">
              <div>
                <div class="strong">${a.name}</div>
                <div class="muted small">${a.agencyNumber} · ${a.plan}</div>
              </div>
              <span class="badge green">${a.status}</span>
            </div>
          `).join("")}
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
      <p class="note"><span class="badge ${color === "blue" ? "" : color}">${note}</span></p>
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
        <p class="muted">Every record is tied to an agency number. This is how one app can serve many temp agencies while keeping data separated.</p>
        <div class="qr-box">Example: TA-1001 → Clients → Sites → Workers → Punches → Timesheets</div>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Agencies</h3>
      <div class="table-wrap">
        <table><thead><tr><th>Agency #</th><th>Name</th><th>Owner</th><th>Plan</th><th>Status</th></tr></thead>
        <tbody>${state.agencies.map(a => `<tr><td>${a.agencyNumber}</td><td>${a.name}</td><td>${a.owner}</td><td>${a.plan}</td><td><span class="badge green">${a.status}</span></td></tr>`).join("")}</tbody></table>
      </div>
    </div>
  `;
}

function clientsView() {
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
        <p class="muted">Clients can approve hours, see who showed up, report no-shows, and request more temps. That is what makes agencies pay.</p>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Clients for ${agency().agencyNumber}</h3>
      <div class="table-wrap"><table><thead><tr><th>Client</th><th>Contact</th><th>Email</th></tr></thead>
      <tbody>${scoped("clients").map(c => `<tr><td>${c.name}</td><td>${c.contact}</td><td>${c.email}</td></tr>`).join("")}</tbody></table></div>
    </div>
  `;
}

function sitesView() {
  return `
    <div class="grid two-col">
      <div class="card">
        <h3>Add Job Site</h3>
        <form id="siteForm" class="form-grid">
          <div><label>Client</label><select name="clientId">${scoped("clients").map(c => `<option value="${c.id}">${c.name}</option>`).join("")}</select></div>
          <div><label>Site Code</label><input name="siteCode" required placeholder="CHD-OH-001"></div>
          <div class="wide"><label>Address</label><input name="address" required placeholder="City, State"></div>
          <div class="wide"><label>GPS Required</label><select name="gpsRequired"><option value="true">Yes</option><option value="false">No</option></select></div>
          <button class="primary-btn wide">Add Site</button>
        </form>
      </div>
      <div class="card">
        <h3>QR Timeclock Setup</h3>
        <div class="qr-box">${qrLink(scoped("sites")[0])}</div>
        <p class="muted small">Print this on a wall sign. Workers scan it to punch into the right agency and site.</p>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Job Sites</h3>
      <div class="table-wrap"><table><thead><tr><th>Client</th><th>Site Code</th><th>Address</th><th>GPS</th><th>QR Link</th></tr></thead>
      <tbody>${scoped("sites").map(s => `<tr><td>${clientName(s.clientId)}</td><td>${s.siteCode}</td><td>${s.address}</td><td>${s.gpsRequired ? "Required" : "Optional"}</td><td>${qrLink(s)}</td></tr>`).join("")}</tbody></table></div>
    </div>
  `;
}

function qrLink(site) {
  if (!site) return "Create a site first.";
  return `${location.origin}${location.pathname}?agency=${agency().agencyNumber}&site=${site.siteCode}`;
}

function workersView() {
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
        <p class="muted small">Worker IDs inherit the agency number so reports never mix between companies.</p>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Workers</h3>
      <div class="table-wrap"><table><thead><tr><th>Worker #</th><th>Name</th><th>Phone</th><th>Status</th><th>Assigned Site</th></tr></thead>
      <tbody>${scoped("workers").map(w => {
        const as = assignmentForWorker(w.id);
        return `<tr><td>${w.workerNumber}</td><td>${w.firstName} ${w.lastName}</td><td>${w.phone}</td><td><span class="badge green">${w.status}</span></td><td>${as ? siteName(as.siteId) : "Unassigned"}</td></tr>`
      }).join("")}</tbody></table></div>
    </div>
  `;
}

function assignmentsView() {
  return `
    <div class="card">
      <h3>Assignments</h3>
      <div class="table-wrap"><table><thead><tr><th>Worker</th><th>Client</th><th>Site</th><th>Shift</th><th>Pay</th><th>Bill</th><th>Margin</th></tr></thead>
      <tbody>${scoped("assignments").map(a => `<tr>
        <td>${workerName(a.workerId)}</td><td>${clientName(a.clientId)}</td><td>${siteName(a.siteId)}</td>
        <td>${a.shiftStart} - ${a.shiftEnd}</td><td>$${a.payRate}/hr</td><td>$${a.billRate}/hr</td><td><span class="badge green">$${a.billRate - a.payRate}/hr</span></td>
      </tr>`).join("")}</tbody></table></div>
    </div>
  `;
}

function timesheetsView() {
  const rows = scoped("timesheets");
  return `
    <div class="card">
      <h3>Weekly Timesheets</h3>
      <div class="table-wrap"><table><thead><tr><th>Week</th><th>Worker</th><th>Regular</th><th>OT</th><th>Total</th><th>Agency</th><th>Client</th><th>Action</th></tr></thead>
      <tbody>${rows.map(t => `<tr>
        <td>${t.weekStart}</td><td>${workerName(t.workerId)}</td><td>${t.regularHours}</td><td>${t.overtimeHours}</td><td>${(t.regularHours + t.overtimeHours).toFixed(2)}</td>
        <td><span class="badge ${t.agencyApproved ? "green" : "yellow"}">${t.agencyApproved ? "Approved" : "Pending"}</span></td>
        <td><span class="badge ${t.clientApproved ? "green" : "yellow"}">${t.clientApproved ? "Approved" : "Pending"}</span></td>
        <td><button class="secondary-btn" data-approve="${t.id}">Approve</button></td>
      </tr>`).join("")}</tbody></table></div>
    </div>
  `;
}

function reportsView() {
  const rows = scoped("timesheets").map(t => {
    const as = assignmentForWorker(t.workerId) || { payRate: 0, billRate: 0 };
    const hours = t.regularHours + t.overtimeHours;
    return { ...t, hours, pay: hours * as.payRate, bill: hours * as.billRate, margin: hours * (as.billRate - as.payRate) };
  });
  const totals = rows.reduce((a, r) => ({ hours: a.hours + r.hours, pay: a.pay + r.pay, bill: a.bill + r.bill, margin: a.margin + r.margin }), {hours:0,pay:0,bill:0,margin:0});
  return `
    <div class="grid kpi-grid">
      ${kpi("Total Hours", totals.hours.toFixed(2), "Payroll hours", "blue")}
      ${kpi("Worker Pay", "$" + totals.pay.toFixed(2), "Estimated payroll", "yellow")}
      ${kpi("Client Billing", "$" + totals.bill.toFixed(2), "Estimated invoice", "green")}
      ${kpi("Gross Margin", "$" + totals.margin.toFixed(2), "Agency profit", "green")}
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Payroll & Margin Report</h3>
      <div class="table-wrap"><table><thead><tr><th>Worker</th><th>Hours</th><th>Pay Estimate</th><th>Bill Estimate</th><th>Margin</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${workerName(r.workerId)}</td><td>${r.hours.toFixed(2)}</td><td>$${r.pay.toFixed(2)}</td><td>$${r.bill.toFixed(2)}</td><td><span class="badge green">$${r.margin.toFixed(2)}</span></td></tr>`).join("")}</tbody></table></div>
    </div>
  `;
}

function timeclockView() {
  const workers = scoped("workers");
  const sites = scoped("sites");
  return `
    <div class="worker-clock card">
      <p class="eyebrow">${agency().agencyNumber}</p>
      <h3>QR Timeclock</h3>
      <div class="clock-face" id="clockFace">--:--:--</div>
      <div class="form-grid">
        <div>
          <label>Worker</label>
          <select id="clockWorker">${workers.map(w => `<option value="${w.id}">${w.workerNumber} · ${w.firstName} ${w.lastName}</option>`).join("")}</select>
        </div>
        <div>
          <label>Job Site</label>
          <select id="clockSite">${sites.map(s => `<option value="${s.id}">${s.siteCode} · ${clientName(s.clientId)}</option>`).join("")}</select>
        </div>
      </div>
      <div class="punch-grid">
        <button class="punch-btn in" data-punch="Clock In">Clock In</button>
        <button class="punch-btn lunch" data-punch="Start Lunch">Start Lunch</button>
        <button class="punch-btn blue" data-punch="End Lunch">End Lunch</button>
        <button class="punch-btn out" data-punch="Clock Out">Clock Out</button>
      </div>
      <p class="muted small">Demo saves punches locally. Supabase can replace localStorage for real SaaS data.</p>
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Recent Punches</h3>
      ${punchTable(scoped("punches").slice(-10).reverse())}
    </div>
  `;
}

function punchTable(rows) {
  return `<div class="table-wrap"><table><thead><tr><th>Time</th><th>Worker</th><th>Site</th><th>Type</th><th>GPS</th><th>Photo</th><th>Status</th></tr></thead>
  <tbody>${rows.map(p => `<tr><td>${new Date(p.timestamp).toLocaleString()}</td><td>${workerName(p.workerId)}</td><td>${siteName(p.siteId)}</td><td>${p.type}</td><td>${p.gps}</td><td>${p.photo}</td><td><span class="badge ${p.status === "Late" ? "yellow" : "green"}">${p.status}</span></td></tr>`).join("")}</tbody></table></div>`;
}

function updateClock() {
  const el = document.getElementById("clockFace");
  if (el) el.textContent = new Date().toLocaleTimeString();
}

function createPunch(type) {
  const workerId = document.getElementById("clockWorker")?.value || scoped("workers")[0]?.id;
  const siteId = document.getElementById("clockSite")?.value || scoped("sites")[0]?.id;
  if (!workerId || !siteId) return toast("Add at least one worker and job site first.");
  const site = state.sites.find(s => s.id === siteId);
  const as = assignmentForWorker(workerId);
  const late = type === "Clock In" && as && new Date().toTimeString().slice(0,5) > as.shiftStart;
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
  save();
  render();
  toast(`${type} saved.`);
}

function approveTimesheet(id) {
  const t = state.timesheets.find(row => row.id === id);
  if (!t) return;
  if (state.activeRole === "client_manager") t.clientApproved = true;
  else {
    t.agencyApproved = true;
    t.clientApproved = true;
  }
  save();
  render();
  toast("Timesheet approved.");
}

function addAgency(fd) {
  const next = 1001 + state.agencies.length;
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
  save();
  renderShell();
  render();
  toast("Agency created with unique number.");
}

function addClient(fd) {
  state.clients.push({
    id: "c" + crypto.randomUUID(),
    agencyId: state.activeAgencyId,
    name: fd.get("name"),
    contact: fd.get("contact"),
    email: fd.get("email")
  });
  save();
  render();
  toast("Client added.");
}

function addSite(fd) {
  state.sites.push({
    id: "s" + crypto.randomUUID(),
    agencyId: state.activeAgencyId,
    clientId: fd.get("clientId"),
    siteCode: fd.get("siteCode"),
    address: fd.get("address"),
    gpsRequired: fd.get("gpsRequired") === "true"
  });
  save();
  render();
  toast("Job site added.");
}

function addWorker(fd) {
  const count = scoped("workers").length + 1;
  const num = String(count).padStart(4, "0");
  state.workers.push({
    id: "w" + crypto.randomUUID(),
    agencyId: state.activeAgencyId,
    workerNumber: `${agency().agencyNumber}-W${num}`,
    firstName: fd.get("firstName"),
    lastName: fd.get("lastName"),
    phone: fd.get("phone"),
    status: fd.get("status")
  });
  save();
  render();
  toast("Worker added.");
}

function exportPayroll() {
  const rows = scoped("timesheets").map(t => {
    const as = assignmentForWorker(t.workerId) || { payRate: 0, billRate: 0 };
    const hours = t.regularHours + t.overtimeHours;
    return {
      agency_number: agency().agencyNumber,
      worker: workerName(t.workerId),
      week_start: t.weekStart,
      regular_hours: t.regularHours,
      overtime_hours: t.overtimeHours,
      total_hours: hours,
      pay_rate: as.payRate,
      bill_rate: as.billRate,
      estimated_pay: (hours * as.payRate).toFixed(2),
      estimated_bill: (hours * as.billRate).toFixed(2),
      estimated_margin: (hours * (as.billRate - as.payRate)).toFixed(2),
      agency_approved: t.agencyApproved,
      client_approved: t.clientApproved
    };
  });
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
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  return [keys.join(","), ...rows.map(row => keys.map(k => JSON.stringify(row[k] ?? "")).join(","))].join("\n");
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
