const STORAGE_KEY = "portaly_staffing_saas_demo_v2";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", badge: "DB" },
  { id: "agencies", label: "Agencies", badge: "AG" },
  { id: "clients", label: "Clients", badge: "CL" },
  { id: "sites", label: "Sites", badge: "SI" },
  { id: "workers", label: "Workers", badge: "WK" },
  { id: "assignments", label: "Assignments", badge: "AS" },
  { id: "timeclock", label: "QR Timeclock", badge: "QR" },
  { id: "approvals", label: "Client Approvals", badge: "AP" },
  { id: "payroll", label: "Payroll", badge: "PY" },
  { id: "margin", label: "Margin Reports", badge: "MR" },
  { id: "settings", label: "Settings", badge: "ST" }
];

const ROLE_LABELS = {
  super_admin: "Platform Owner",
  agency_admin: "Agency Admin",
  client_manager: "Client Manager",
  worker: "Worker"
};

const ROLE_HOME = {
  super_admin: "agencies",
  agency_admin: "dashboard",
  client_manager: "approvals",
  worker: "timeclock"
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

let state = loadState();
let toastTimer = 0;

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  applyUrlParams();
  normalizeSelections(state);
  applyTheme();
  renderShell();
  renderView();
});

function loadState() {
  const seed = buildSeedState();
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return normalizeLoadedState(seed, seed);
  }

  try {
    return normalizeLoadedState(JSON.parse(raw), seed);
  } catch {
    return normalizeLoadedState(seed, seed);
  }
}

function normalizeLoadedState(input, seed) {
  const merged = {
    ...seed,
    ...input,
    agencies: Array.isArray(input.agencies) && input.agencies.length ? input.agencies : seed.agencies,
    clients: Array.isArray(input.clients) && input.clients.length ? input.clients : seed.clients,
    sites: Array.isArray(input.sites) && input.sites.length ? input.sites : seed.sites,
    workers: Array.isArray(input.workers) && input.workers.length ? input.workers : seed.workers,
    assignments: Array.isArray(input.assignments) && input.assignments.length ? input.assignments : seed.assignments,
    punches: Array.isArray(input.punches) && input.punches.length ? input.punches : seed.punches,
    timesheets: Array.isArray(input.timesheets) && input.timesheets.length ? input.timesheets : seed.timesheets,
    auditTrail: Array.isArray(input.auditTrail) && input.auditTrail.length ? input.auditTrail : seed.auditTrail,
    settingsByAgency: {
      ...seed.settingsByAgency,
      ...(input.settingsByAgency || {})
    }
  };

  merged.currentView = NAV_ITEMS.some(item => item.id === merged.currentView) ? merged.currentView : seed.currentView;
  merged.currentRole = ROLE_LABELS[merged.currentRole] ? merged.currentRole : seed.currentRole;
  merged.punchMessage = merged.punchMessage || seed.punchMessage;

  merged.agencies = merged.agencies.map((agencyRecord, index) => ({
    ...agencyRecord,
    code: agencyRecord.code || buildAgencyCode(agencyRecord.name, index)
  }));

  merged.assignments = merged.assignments.map(record => ({ ...record, active: record.active !== false }));
  merged.timesheets = merged.timesheets.map(syncTimesheet);
  normalizeSelections(merged);
  return merged;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function buildSeedState() {
  const currentWeek = toISODate(startOfWeek(new Date()));
  const previousWeek = toISODate(addDays(parseISODate(currentWeek), -7));

  const agencies = [
    {
      id: "agency_1",
      code: "BRS-1201",
      name: "BlueRidge Staffing Partners",
      owner: "Melissa Grant",
      plan: "Agency",
      payrollEmail: "payroll@blueridgestaffing.com",
      supportPhone: "(614) 555-0188"
    },
    {
      id: "agency_2",
      code: "HLG-2210",
      name: "Harbor Labor Group",
      owner: "Darius Webb",
      plan: "Growth",
      payrollEmail: "ops@harborlaborgroup.com",
      supportPhone: "(502) 555-0140"
    }
  ];

  const clients = [
    {
      id: "client_1",
      agencyId: "agency_1",
      name: "NorthPeak Logistics",
      contactName: "Dana Wilson",
      contactTitle: "Warehouse Operations Manager",
      email: "dana.wilson@northpeaklogistics.com"
    },
    {
      id: "client_2",
      agencyId: "agency_1",
      name: "Summit Fresh Foods",
      contactName: "Eric Madden",
      contactTitle: "Distribution Supervisor",
      email: "eric.madden@summitfresh.com"
    },
    {
      id: "client_3",
      agencyId: "agency_2",
      name: "Apex Retail Distribution",
      contactName: "Kelly Monroe",
      contactTitle: "Regional Site Lead",
      email: "kelly.monroe@apexretail.com"
    }
  ];

  const sites = [
    {
      id: "site_1",
      agencyId: "agency_1",
      clientId: "client_1",
      name: "NorthPeak East DC",
      code: "NPL-EAST",
      address: "3800 Alum Creek Dr, Columbus, OH",
      shiftProfile: "Day shift"
    },
    {
      id: "site_2",
      agencyId: "agency_1",
      clientId: "client_1",
      name: "NorthPeak Overflow Yard",
      code: "NPL-OVR",
      address: "7815 Green Pointe Dr, Groveport, OH",
      shiftProfile: "Day shift"
    },
    {
      id: "site_3",
      agencyId: "agency_1",
      clientId: "client_2",
      name: "Summit Fresh Cold Storage",
      code: "SFF-COLD",
      address: "5151 Commerce Center Dr, Lockbourne, OH",
      shiftProfile: "Cold chain"
    },
    {
      id: "site_4",
      agencyId: "agency_2",
      clientId: "client_3",
      name: "Apex Retail South Hub",
      code: "ARD-SOUTH",
      address: "1450 Logistics Way, Louisville, KY",
      shiftProfile: "Split shift"
    }
  ];

  const workers = [
    workerSeed("worker_1", "agency_1", "Mia", "Hernandez", "Forklift Operator", "mia.hernandez@blueridge-demo.com", "(614) 555-0101"),
    workerSeed("worker_2", "agency_1", "Caleb", "Foster", "Order Selector", "caleb.foster@blueridge-demo.com", "(614) 555-0102"),
    workerSeed("worker_3", "agency_1", "Jasmine", "Brooks", "Packer", "jasmine.brooks@blueridge-demo.com", "(614) 555-0103"),
    workerSeed("worker_4", "agency_1", "Terrance", "Lee", "Loader", "terrance.lee@blueridge-demo.com", "(614) 555-0104"),
    workerSeed("worker_5", "agency_1", "Olivia", "Price", "Inventory Associate", "olivia.price@blueridge-demo.com", "(614) 555-0105"),
    workerSeed("worker_6", "agency_1", "Andre", "Collins", "Sanitation Lead", "andre.collins@blueridge-demo.com", "(614) 555-0106"),
    workerSeed("worker_7", "agency_2", "Sofia", "Nguyen", "Reach Truck Operator", "sofia.nguyen@harbor-demo.com", "(502) 555-0107"),
    workerSeed("worker_8", "agency_2", "Marcus", "Bell", "Shipping Clerk", "marcus.bell@harbor-demo.com", "(502) 555-0108"),
    workerSeed("worker_9", "agency_2", "Nia", "Turner", "Pallet Sorter", "nia.turner@harbor-demo.com", "(502) 555-0109"),
    workerSeed("worker_10", "agency_2", "Devonte", "Hayes", "Dock Associate", "devonte.hayes@harbor-demo.com", "(502) 555-0110")
  ];

  const assignments = [
    assignmentSeed("assignment_1", "agency_1", "worker_1", "client_1", "site_1", "Forklift Operator", 19.5, 31, "07:00", "15:30"),
    assignmentSeed("assignment_2", "agency_1", "worker_2", "client_1", "site_1", "Order Selector", 18, 29, "07:00", "15:30"),
    assignmentSeed("assignment_3", "agency_1", "worker_3", "client_1", "site_2", "Packer", 18.75, 29.5, "06:30", "15:00"),
    assignmentSeed("assignment_4", "agency_1", "worker_4", "client_1", "site_2", "Loader", 19, 30, "07:00", "15:30"),
    assignmentSeed("assignment_5", "agency_1", "worker_5", "client_2", "site_3", "Inventory Control", 20.5, 33, "08:00", "16:30"),
    assignmentSeed("assignment_6", "agency_1", "worker_6", "client_2", "site_3", "Sanitation Lead", 21.25, 34, "08:00", "16:30"),
    assignmentSeed("assignment_7", "agency_2", "worker_7", "client_3", "site_4", "Reach Truck Operator", 19.75, 31.5, "06:00", "14:30"),
    assignmentSeed("assignment_8", "agency_2", "worker_8", "client_3", "site_4", "Shipping Clerk", 18.5, 29, "06:00", "14:30"),
    assignmentSeed("assignment_9", "agency_2", "worker_9", "client_3", "site_4", "Pallet Sorter", 17.75, 28.5, "14:00", "22:30"),
    assignmentSeed("assignment_10", "agency_2", "worker_10", "client_3", "site_4", "Dock Associate", 18.25, 29.25, "14:00", "22:30")
  ];

  const timesheets = [
    createTimesheet("ts_1", "agency_1", "worker_1", "client_1", "site_1", "assignment_1", currentWeek, [8, 8, 8, 8, 6], "approved", "finalized", { approvalNote: "Approved by Dana Wilson." }),
    createTimesheet("ts_2", "agency_1", "worker_2", "client_1", "site_1", "assignment_2", currentWeek, [8, 8, 8, 8, 8.5], "pending", "ready", {}),
    createTimesheet("ts_3", "agency_1", "worker_3", "client_1", "site_2", "assignment_3", currentWeek, [8, 8, 7.5, 8, 7.5], "pending", "ready", {
      manualEdited: true,
      manualNote: "Agency adjusted Tuesday scan after a scanner battery swap."
    }),
    createTimesheet("ts_4", "agency_1", "worker_4", "client_1", "site_2", "assignment_4", currentWeek, [8.5, 8.5, 8.5, 8.5, 8], "approved", "finalized", { approvalNote: "Outbound dock volume verified." }),
    createTimesheet("ts_5", "agency_1", "worker_5", "client_2", "site_3", "assignment_5", currentWeek, [8, 8, 8, 8, 8], "approved", "ready", { approvalNote: "Client approved for payroll review." }),
    createTimesheet("ts_6", "agency_1", "worker_6", "client_2", "site_3", "assignment_6", currentWeek, [7.5, 7.5, 7.5, 8, 8], "rejected", "hold", { rejectionNote: "Thursday sanitation hours need dock lead confirmation." }),
    createTimesheet("ts_7", "agency_2", "worker_7", "client_3", "site_4", "assignment_7", currentWeek, [8, 8, 8, 8, 7], "approved", "finalized", { approvalNote: "Approved by Kelly Monroe." }),
    createTimesheet("ts_8", "agency_2", "worker_8", "client_3", "site_4", "assignment_8", currentWeek, [8, 8, 8, 8, 8], "pending", "ready", {}),
    createTimesheet("ts_9", "agency_2", "worker_9", "client_3", "site_4", "assignment_9", currentWeek, [8, 8, 8, 7.5, 7.5], "approved", "finalized", { approvalNote: "PM crew released cleanly." }),
    createTimesheet("ts_10", "agency_2", "worker_10", "client_3", "site_4", "assignment_10", currentWeek, [8, 8, 8, 8, 8.5], "approved", "finalized", { approvalNote: "Dock closeout approved." }),
    createTimesheet("ts_11", "agency_1", "worker_1", "client_1", "site_1", "assignment_1", previousWeek, [8, 8, 8, 8, 8], "approved", "finalized", { approvalNote: "Previous pay period finalized." }),
    createTimesheet("ts_12", "agency_1", "worker_2", "client_1", "site_1", "assignment_2", previousWeek, [8, 8, 8, 8, 7.5], "approved", "finalized", { approvalNote: "Previous pay period finalized." }),
    createTimesheet("ts_13", "agency_1", "worker_3", "client_1", "site_2", "assignment_3", previousWeek, [8, 8, 8, 8, 7], "approved", "finalized", { approvalNote: "Previous pay period finalized." }),
    createTimesheet("ts_14", "agency_1", "worker_4", "client_1", "site_2", "assignment_4", previousWeek, [8, 8, 8, 8, 8.5], "approved", "finalized", { approvalNote: "Previous pay period finalized." }),
    createTimesheet("ts_15", "agency_1", "worker_5", "client_2", "site_3", "assignment_5", previousWeek, [8, 8, 8, 8, 8], "approved", "finalized", { approvalNote: "Previous pay period finalized." }),
    createTimesheet("ts_16", "agency_1", "worker_6", "client_2", "site_3", "assignment_6", previousWeek, [8, 8, 8, 8, 7.5], "approved", "finalized", { approvalNote: "Previous pay period finalized." }),
    createTimesheet("ts_17", "agency_2", "worker_7", "client_3", "site_4", "assignment_7", previousWeek, [8, 8, 8, 8, 8], "approved", "finalized", { approvalNote: "Previous pay period finalized." }),
    createTimesheet("ts_18", "agency_2", "worker_8", "client_3", "site_4", "assignment_8", previousWeek, [8, 8, 8, 8, 8], "approved", "finalized", { approvalNote: "Previous pay period finalized." }),
    createTimesheet("ts_19", "agency_2", "worker_9", "client_3", "site_4", "assignment_9", previousWeek, [8, 8, 8, 8, 7.5], "approved", "finalized", { approvalNote: "Previous pay period finalized." }),
    createTimesheet("ts_20", "agency_2", "worker_10", "client_3", "site_4", "assignment_10", previousWeek, [8, 8, 8, 8, 8], "approved", "finalized", { approvalNote: "Previous pay period finalized." })
  ];

  const punches = [
    punchSeed("punch_1", "agency_1", "worker_1", "site_1", "Clock In", makeTimestamp(0, "06:56")),
    punchSeed("punch_2", "agency_1", "worker_1", "site_1", "Start Lunch", makeTimestamp(0, "11:59")),
    punchSeed("punch_3", "agency_1", "worker_1", "site_1", "End Lunch", makeTimestamp(0, "12:28")),
    punchSeed("punch_4", "agency_1", "worker_1", "site_1", "Clock Out", makeTimestamp(0, "15:34")),
    punchSeed("punch_5", "agency_1", "worker_2", "site_1", "Clock In", makeTimestamp(0, "07:12")),
    punchSeed("punch_6", "agency_1", "worker_2", "site_1", "Start Lunch", makeTimestamp(0, "12:02")),
    punchSeed("punch_7", "agency_1", "worker_2", "site_1", "End Lunch", makeTimestamp(0, "12:31")),
    punchSeed("punch_8", "agency_1", "worker_3", "site_2", "Clock In", makeTimestamp(0, "06:33")),
    punchSeed("punch_9", "agency_1", "worker_3", "site_2", "Start Lunch", makeTimestamp(0, "11:57")),
    punchSeed("punch_10", "agency_1", "worker_4", "site_2", "Clock In", makeTimestamp(0, "07:09")),
    punchSeed("punch_11", "agency_1", "worker_4", "site_2", "Clock In", makeTimestamp(0, "07:12")),
    punchSeed("punch_12", "agency_1", "worker_4", "site_2", "Clock Out", makeTimestamp(0, "15:21")),
    punchSeed("punch_13", "agency_1", "worker_5", "site_3", "Clock In", makeTimestamp(0, "08:17")),
    punchSeed("punch_14", "agency_2", "worker_7", "site_4", "Clock In", makeTimestamp(0, "05:58")),
    punchSeed("punch_15", "agency_2", "worker_7", "site_4", "Start Lunch", makeTimestamp(0, "10:58")),
    punchSeed("punch_16", "agency_2", "worker_7", "site_4", "End Lunch", makeTimestamp(0, "11:27")),
    punchSeed("punch_17", "agency_2", "worker_7", "site_4", "Clock Out", makeTimestamp(0, "14:35")),
    punchSeed("punch_18", "agency_2", "worker_8", "site_4", "Clock In", makeTimestamp(0, "06:02")),
    punchSeed("punch_19", "agency_2", "worker_8", "site_4", "Clock Out", makeTimestamp(0, "14:29")),
    punchSeed("punch_20", "agency_2", "worker_9", "site_4", "Clock In", makeTimestamp(0, "13:58")),
    punchSeed("punch_21", "agency_2", "worker_10", "site_4", "Clock In", makeTimestamp(0, "14:02")),
    punchSeed("punch_22", "agency_1", "worker_5", "site_3", "Clock Out", makeTimestamp(-1, "16:31")),
    punchSeed("punch_23", "agency_1", "worker_6", "site_3", "Clock In", makeTimestamp(-1, "07:58"))
  ];

  const auditTrail = [
    auditSeed("audit_1", "agency_1", "Timesheet approved", "NorthPeak approved Mia Hernandez for final payroll.", makeTimestamp(0, "15:40"), "Client Manager"),
    auditSeed("audit_2", "agency_1", "Payroll finalized", "Terrance Lee moved into the final approved queue.", makeTimestamp(0, "16:04"), "Agency Admin"),
    auditSeed("audit_3", "agency_1", "Manual edit noted", "Jasmine Brooks Tuesday hours were corrected after a scanner battery swap.", makeTimestamp(0, "13:10"), "Agency Admin"),
    auditSeed("audit_4", "agency_1", "Client rejection", "Summit Fresh sent Andre Collins back for review with a note.", makeTimestamp(0, "12:42"), "Client Manager"),
    auditSeed("audit_5", "agency_2", "Pay period exported", "Previous-week payroll was exported for Apex Retail.", makeTimestamp(-1, "17:05"), "Agency Admin"),
    auditSeed("audit_6", "agency_1", "QR link shared", "NorthPeak East DC punch link copied for a supervisor kickoff.", makeTimestamp(-1, "09:11"), "Agency Admin")
  ];

  return {
    currentView: "dashboard",
    currentRole: "agency_admin",
    currentAgencyId: "agency_1",
    currentClientId: "client_1",
    currentWorkerId: "worker_1",
    currentWeek,
    selectedWeekStart: currentWeek,
    punchSiteId: "site_1",
    punchMessage: "Ready for the next worker punch.",
    agencies,
    clients,
    sites,
    workers,
    assignments,
    punches,
    timesheets,
    auditTrail,
    settingsByAgency: {
      agency_1: {
        agencyName: "BlueRidge Staffing Partners",
        logoText: "BP",
        primaryColor: "#1f6fff",
        payrollContactEmail: "payroll@blueridgestaffing.com",
        supportPhone: "(614) 555-0188"
      },
      agency_2: {
        agencyName: "Harbor Labor Group",
        logoText: "HG",
        primaryColor: "#145bdb",
        payrollContactEmail: "ops@harborlaborgroup.com",
        supportPhone: "(502) 555-0140"
      }
    }
  };
}

function workerSeed(id, agencyId, firstName, lastName, title, email, phone) {
  return {
    id,
    agencyId,
    firstName,
    lastName,
    title,
    email,
    phone,
    status: "Active"
  };
}

function assignmentSeed(id, agencyId, workerId, clientId, siteId, title, payRate, billRate, shiftStart, shiftEnd) {
  return {
    id,
    agencyId,
    workerId,
    clientId,
    siteId,
    title,
    payRate,
    billRate,
    shiftStart,
    shiftEnd,
    active: true
  };
}

function createTimesheet(id, agencyId, workerId, clientId, siteId, assignmentId, weekStart, hours, clientStatus, agencyStatus, extras) {
  const days = WEEKDAY_LABELS.map((label, index) => ({
    label,
    date: toISODate(addDays(parseISODate(weekStart), index)),
    hours: round2(Number(hours[index] || 0))
  }));

  const totalHours = round2(days.reduce((sum, day) => sum + day.hours, 0));
  const regularHours = round2(Math.min(totalHours, 40));
  const overtimeHours = round2(Math.max(totalHours - 40, 0));
  const approvedHours = clientStatus === "approved" ? totalHours : 0;

  return syncTimesheet({
    id,
    agencyId,
    workerId,
    clientId,
    siteId,
    assignmentId,
    weekStart,
    days,
    totalHours,
    regularHours,
    overtimeHours,
    approvedHours,
    clientStatus,
    agencyStatus,
    approvalNote: extras.approvalNote || "",
    rejectionNote: extras.rejectionNote || "",
    manualEdited: Boolean(extras.manualEdited),
    manualNote: extras.manualNote || "",
    updatedAt: new Date().toISOString()
  });
}

function punchSeed(id, agencyId, workerId, siteId, type, timestamp) {
  return {
    id,
    agencyId,
    workerId,
    siteId,
    type,
    timestamp
  };
}

function auditSeed(id, agencyId, title, note, timestamp, actor) {
  return {
    id,
    agencyId,
    title,
    note,
    timestamp,
    actor
  };
}

function bindEvents() {
  const roleSelect = document.getElementById("roleSelect");
  const agencySelect = document.getElementById("agencySelect");
  const clientSelect = document.getElementById("clientSelect");
  const workerSelect = document.getElementById("workerSelect");
  const menuButton = document.getElementById("menuButton");
  const mobileOverlay = document.getElementById("mobileOverlay");
  const resetDemoBtn = document.getElementById("resetDemoBtn");

  roleSelect.addEventListener("change", event => {
    state.currentRole = event.target.value;
    state.currentView = ROLE_HOME[state.currentRole] || "dashboard";
    saveState();
    renderShell();
    renderView();
  });

  agencySelect.addEventListener("change", event => {
    state.currentAgencyId = event.target.value;
    normalizeSelections(state);
    applyTheme();
    saveState();
    renderShell();
    renderView();
  });

  clientSelect.addEventListener("change", event => {
    state.currentClientId = event.target.value;
    saveState();
    renderShell();
    renderView();
  });

  workerSelect.addEventListener("change", event => {
    state.currentWorkerId = event.target.value;
    const nextAssignment = activeAssignmentForWorker(state.currentWorkerId);
    if (nextAssignment) {
      state.punchSiteId = nextAssignment.siteId;
    }
    saveState();
    renderShell();
    renderView();
  });

  menuButton.addEventListener("click", toggleMobileMenu);
  mobileOverlay.addEventListener("click", closeMobileMenu);

  resetDemoBtn.addEventListener("click", () => {
    state = normalizeLoadedState(buildSeedState(), buildSeedState());
    localStorage.removeItem(STORAGE_KEY);
    applyTheme();
    renderShell();
    renderView();
    toast("Demo data reset.");
  });

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("change", handleDocumentChange);
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) {
      closeMobileMenu();
    }
  });
}

function handleDocumentClick(event) {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    setView(viewButton.dataset.view);
    return;
  }

  const punchButton = event.target.closest("[data-punch]");
  if (punchButton) {
    createPunch(punchButton.dataset.punch);
    return;
  }

  const copyButton = event.target.closest("[data-copy-link]");
  if (copyButton) {
    copyText(copyButton.dataset.copyLink, "Punch link copied.");
    return;
  }

  const approveButton = event.target.closest("[data-approve-timesheet]");
  if (approveButton) {
    approveTimesheet(approveButton.dataset.approveTimesheet);
    return;
  }

  const rejectButton = event.target.closest("[data-reject-timesheet]");
  if (rejectButton) {
    rejectTimesheet(rejectButton.dataset.rejectTimesheet);
    return;
  }

  const finalizeButton = event.target.closest("[data-finalize-timesheet]");
  if (finalizeButton) {
    finalizeTimesheet(finalizeButton.dataset.finalizeTimesheet);
    return;
  }

  const exportButton = event.target.closest("[data-export]");
  if (exportButton) {
    const exportMode = exportButton.dataset.export;
    if (exportMode === "csv") exportPayrollCsv(false);
    if (exportMode === "excel") exportPayrollCsv(true);
    if (exportMode === "pdf") exportPayrollPdf();
  }
}

function handleDocumentChange(event) {
  if (event.target.id === "payrollWeekSelect") {
    state.selectedWeekStart = event.target.value;
    saveState();
    renderView();
  }

  if (event.target.id === "timeclockSiteSelect") {
    state.punchSiteId = event.target.value;
    saveState();
  }
}

function handleSubmit(event) {
  event.preventDefault();

  const formId = event.target.id;
  const data = new FormData(event.target);

  if (formId === "agencyForm") addAgency(data);
  if (formId === "clientForm") addClient(data);
  if (formId === "siteForm") addSite(data);
  if (formId === "workerForm") addWorker(data);
  if (formId === "assignmentForm") addAssignment(data);
  if (formId === "settingsForm") saveSettings(data);
}

function setView(view) {
  if (!NAV_ITEMS.some(item => item.id === view)) return;
  state.currentView = view;
  saveState();
  renderShell();
  renderView();
  closeMobileMenu();
}

function renderShell() {
  const roleSelect = document.getElementById("roleSelect");
  const agencySelect = document.getElementById("agencySelect");
  const clientSelect = document.getElementById("clientSelect");
  const workerSelect = document.getElementById("workerSelect");
  const nav = document.getElementById("nav");
  const contextLabel = document.getElementById("contextLabel");
  const pageTitle = document.getElementById("pageTitle");
  const brandMark = document.getElementById("brandMark");
  const brandCopy = document.querySelector(".brand-copy");

  roleSelect.innerHTML = Object.entries(ROLE_LABELS)
    .map(([value, label]) => `<option value="${safe(value)}">${safe(label)}</option>`)
    .join("");
  roleSelect.value = state.currentRole;

  agencySelect.innerHTML = state.agencies
    .map(agencyRecord => `<option value="${safe(agencyRecord.id)}">${safe(agencyRecord.code)} - ${safe(agencyRecord.name)}</option>`)
    .join("");
  agencySelect.value = state.currentAgencyId;

  clientSelect.innerHTML = clientsForCurrentAgency()
    .map(clientRecord => `<option value="${safe(clientRecord.id)}">${safe(clientRecord.name)}</option>`)
    .join("");
  clientSelect.value = state.currentClientId;

  workerSelect.innerHTML = workersForCurrentAgency()
    .map(workerRecord => `<option value="${safe(workerRecord.id)}">${safe(fullWorkerName(workerRecord.id))}</option>`)
    .join("");
  workerSelect.value = state.currentWorkerId;

  nav.innerHTML = NAV_ITEMS.map(item => `
    <button class="nav-button ${state.currentView === item.id ? "active" : ""}" data-view="${safe(item.id)}" type="button">
      <span class="nav-badge">${safe(item.badge)}</span>
      <span>${safe(item.label)}</span>
    </button>
  `).join("");

  const page = NAV_ITEMS.find(item => item.id === state.currentView);
  const settings = currentAgencySettings();

  brandMark.textContent = (settings.logoText || initials(currentAgency()?.name || "Portaly", 2)).slice(0, 3).toUpperCase();
  brandCopy.textContent = `${settings.agencyName || currentAgency()?.name || "Agency workspace"} demo workspace`;
  pageTitle.textContent = page ? page.label : "Dashboard";
  contextLabel.textContent = renderContextLabel();
}

function renderView() {
  const view = document.getElementById("view");
  const renderers = {
    dashboard: dashboardView,
    agencies: agenciesView,
    clients: clientsView,
    sites: sitesView,
    workers: workersView,
    assignments: assignmentsView,
    timeclock: timeclockView,
    approvals: approvalsView,
    payroll: payrollView,
    margin: marginView,
    settings: settingsView
  };

  view.innerHTML = (renderers[state.currentView] || dashboardView)();
}

function dashboardView() {
  const metrics = dashboardMetrics();
  const exceptions = buildExceptions().slice(0, 6);
  const recent = recentActivity().slice(0, 6);
  const settings = currentAgencySettings();

  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Portaly</p>
        <h3>QR Timeclock &amp; Agency Operations Platform</h3>
        <p>Track worker punches, client approvals, payroll exports, and gross margin from one clean dashboard.</p>
        <div class="hero-actions">
          <button class="button button-primary" data-view="dashboard" type="button">Try Demo</button>
          <button class="button button-secondary" data-view="timeclock" type="button">Open Worker Punch</button>
          <button class="button button-ghost" data-view="payroll" type="button">View Payroll Workflow</button>
        </div>
        <div class="hero-proof">
          <span class="tiny-pill">${safe(settings.agencyName || currentAgency()?.name || "Agency")}</span>
          <span class="tiny-pill">${safe(metrics.activeSitesLabel)}</span>
          <span class="tiny-pill">${safe(metrics.readyHoursLabel)}</span>
        </div>
      </div>

      <div class="hero-rail">
        ${heroStat("Live worker punches", String(metrics.workersClockedInToday), "Workers clocked in across today's active sites.")}
        ${heroStat("Pending approvals", String(metrics.pendingApprovals), "Client-side timecards still waiting for signoff.")}
        ${heroStat("Estimated gross margin", formatCurrency(metrics.grossMargin), "Current-week spread modeled from bill and pay rates.")}
      </div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Executive Dashboard</p>
          <h3>Live agency operations at a glance</h3>
          <p>Built for staffing agencies that need one credible place to see labor activity, payroll readiness, and account health.</p>
        </div>
      </div>

      <div class="metric-grid">
        ${metricCard("WK", "Workers Clocked In Today", String(metrics.workersClockedInToday), "Unique workers with a live punch today.")}
        ${metricCard("AP", "Pending Client Approvals", String(metrics.pendingApprovals), "Timecards waiting for client signoff.")}
        ${metricCard("EX", "Missing Punches", String(metrics.missingPunches), "Open lunch or missing clock-out exceptions.")}
        ${metricCard("HR", "Payroll Hours This Week", formatHours(metrics.payrollHours), "Current pay-period total hours.")}
        ${metricCard("GM", "Estimated Gross Margin", formatCurrency(metrics.grossMargin), "Revenue less labor cost for the week.")}
        ${metricCard("ST", "Active Client Sites", String(metrics.activeSites), "Live staffing locations for this agency.")}
      </div>
    </section>

    <section class="split-grid">
      <div class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Product Credibility</p>
            <h3>Built for staffing agencies that still chase paper timecards</h3>
            <p>Position the demo around operational trust, clean approval flows, and margin visibility instead of just punch capture.</p>
          </div>
        </div>

        <div class="feature-grid">
          ${featureCard("QR", "QR worker punches", "Open the mobile punch flow in seconds and keep daily attendance visible.")}
          ${featureCard("CA", "Client approvals", "Let client managers approve or reject labor hours with notes.")}
          ${featureCard("PX", "Payroll exports", "Push approved hours into CSV, Excel-ready CSV, or print-to-PDF handoff.")}
          ${featureCard("GM", "Gross margin visibility", "Model pay, bill, spread, and margin per worker or site.")}
          ${featureCard("MS", "Multi-site tracking", "Run multiple warehouses and overflow locations in one agency workspace.")}
          ${featureCard("AT", "Audit trail", "Keep visible notes for approvals, manual edits, exports, and settings changes.")}
        </div>
      </div>

      <div class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Exceptions</p>
            <h3>Attention items that payroll ops can’t miss</h3>
            <p>These alerts come straight from punch activity, approval state, and manual edits stored in the demo data.</p>
          </div>
        </div>

        <div class="exception-list">
          ${exceptions.length ? exceptions.map(renderExceptionCard).join("") : emptyState("No exceptions in this agency view.")}
        </div>
      </div>
    </section>

    <section class="split-grid">
      <div class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Recent Activity</p>
            <h3>Visible audit trail for demos and ops conversations</h3>
          </div>
        </div>

        <div class="timeline">
          ${recent.length ? recent.map(renderTimelineItem).join("") : emptyState("No recent audit events yet.")}
        </div>
      </div>

      <div class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Pricing Preview</p>
            <h3>Simple packaging for staffing owners and investors</h3>
          </div>
        </div>

        <div class="pricing-grid">
          ${pricingCard("Starter", "$99/month", ["Up to 25 workers", "1 client site", "QR punches", "Basic payroll export"])}
          ${pricingCard("Agency", "$249/month", ["Up to 100 workers", "5 client sites", "Client approvals", "Payroll exports", "Exception alerts"])}
          ${pricingCard("Growth", "$499/month", ["Unlimited clients", "Advanced reports", "White-label branding", "Priority setup"])}
          ${pricingCard("Enterprise", "Custom", ["Multi-branch agencies", "Custom integrations", "Dedicated onboarding"])}
        </div>
      </div>
    </section>
  `;
}

function agenciesView() {
  const agencies = state.agencies;

  return `
    <section class="page-intro card">
      <div class="page-intro-header">
        <div>
          <p class="eyebrow">Agency Management</p>
          <h3>Multi-agency staffing demo portfolio</h3>
          <p>Show how Portaly supports multiple staffing brands while keeping payroll contacts, branding, and site operations distinct.</p>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Agency directory</h3>
            <p>Use the active agency selector in the sidebar to swap the full product context.</p>
          </div>
        </div>

        <div class="site-grid">
          ${agencies.map(agencyCard).join("")}
        </div>
      </div>

      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Add demo agency</h3>
            <p>Keep the existing static app flexible for sales demos without adding a backend.</p>
          </div>
        </div>

        <form id="agencyForm" class="form-grid">
          <div>
            <label>Agency name</label>
            <input name="name" type="text" placeholder="Lakefront Staffing Group" required />
          </div>
          <div>
            <label>Owner</label>
            <input name="owner" type="text" placeholder="Jordan Blake" required />
          </div>
          <div>
            <label>Payroll contact email</label>
            <input name="payrollEmail" type="email" placeholder="payroll@agency.com" required />
          </div>
          <div>
            <label>Support phone</label>
            <input name="supportPhone" type="text" placeholder="(555) 555-0100" required />
          </div>
          <div>
            <label>Plan</label>
            <select name="plan">
              <option>Starter</option>
              <option selected>Agency</option>
              <option>Growth</option>
              <option>Enterprise</option>
            </select>
          </div>
          <div>
            <label>Primary color</label>
            <input name="primaryColor" type="color" value="#1f6fff" />
          </div>
          <div class="form-span-2 form-actions">
            <button class="button button-primary" type="submit">Add Agency</button>
          </div>
        </form>
      </div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <h3>Agency operating snapshot</h3>
          <p>Quick reference for plan level, client footprint, labor count, and payroll contact routing.</p>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Agency</th>
              <th>Plan</th>
              <th>Clients</th>
              <th>Sites</th>
              <th>Workers</th>
              <th>Payroll Contact</th>
              <th>Support</th>
            </tr>
          </thead>
          <tbody>
            ${agencies.map(agencyRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function clientsView() {
  const clients = clientsForCurrentAgency();

  return `
    <section class="page-intro card">
      <div class="page-intro-header">
        <div>
          <p class="eyebrow">Client Accounts</p>
          <h3>Client relationships tied directly to sites and approvals</h3>
          <p>Each client account in the demo owns its own locations, assigned workers, and approval queue.</p>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Client list</h3>
            <p>Switch the client focus in the sidebar to preview the manager approval experience.</p>
          </div>
        </div>

        <div class="site-grid">
          ${clients.map(clientCard).join("")}
        </div>
      </div>

      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Add client account</h3>
            <p>Create another warehouse or distribution customer for the active agency.</p>
          </div>
        </div>

        <form id="clientForm" class="form-grid">
          <div>
            <label>Client name</label>
            <input name="name" type="text" placeholder="Anchor Distribution" required />
          </div>
          <div>
            <label>Contact name</label>
            <input name="contactName" type="text" placeholder="Casey Miller" required />
          </div>
          <div>
            <label>Contact title</label>
            <input name="contactTitle" type="text" placeholder="Site Operations Manager" required />
          </div>
          <div>
            <label>Email</label>
            <input name="email" type="email" placeholder="casey@anchor.com" required />
          </div>
          <div class="form-span-2 form-actions">
            <button class="button button-primary" type="submit">Add Client</button>
          </div>
        </form>
      </div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <h3>Client approval readiness</h3>
          <p>Count the current sites, assigned workers, and pending approvals per client account.</p>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Primary Contact</th>
              <th>Sites</th>
              <th>Assigned Workers</th>
              <th>Pending Approvals</th>
            </tr>
          </thead>
          <tbody>
            ${clients.map(clientRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function sitesView() {
  const sites = sitesForCurrentAgency();

  return `
    <section class="page-intro card">
      <div class="page-intro-header">
        <div>
          <p class="eyebrow">Sites</p>
          <h3>Warehouse locations with QR-ready punch entry points</h3>
          <p>These site cards make the GitHub Pages demo feel closer to a real warehouse rollout with shareable worker punch links.</p>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Active client sites</h3>
            <p>Every site carries a direct worker punch route into the static demo.</p>
          </div>
        </div>

        <div class="site-grid">
          ${sites.map(siteCard).join("")}
        </div>
      </div>

      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Add site</h3>
            <p>Create another warehouse, overflow yard, or cold-storage location for the active agency.</p>
          </div>
        </div>

        <form id="siteForm" class="form-grid">
          <div>
            <label>Client</label>
            <select name="clientId">
              ${clientsForCurrentAgency().map(clientRecord => `<option value="${safe(clientRecord.id)}">${safe(clientRecord.name)}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Site name</label>
            <input name="name" type="text" placeholder="NorthPeak West Annex" required />
          </div>
          <div>
            <label>Site code</label>
            <input name="code" type="text" placeholder="NPL-WEST" required />
          </div>
          <div>
            <label>Shift profile</label>
            <input name="shiftProfile" type="text" placeholder="Weekend shift" required />
          </div>
          <div class="form-span-2">
            <label>Address</label>
            <input name="address" type="text" placeholder="4200 Warehouse Blvd, Columbus, OH" required />
          </div>
          <div class="form-span-2 form-actions">
            <button class="button button-primary" type="submit">Add Site</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function workersView() {
  const workers = workersForCurrentAgency();

  return `
    <section class="page-intro card">
      <div class="page-intro-header">
        <div>
          <p class="eyebrow">Workers</p>
          <h3>Active staffing roster with assignment and contact context</h3>
          <p>Use the worker selector for a clean mobile punch demo, or scan the table below for titles, sites, and status.</p>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Worker roster</h3>
            <p>Active assignments, sites, and titles stay visible for client and agency walkthroughs.</p>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Title</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Assignment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${workers.map(workerRow).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Add worker</h3>
            <p>New worker profiles save to localStorage and show up immediately in the punch flow.</p>
          </div>
        </div>

        <form id="workerForm" class="form-grid">
          <div>
            <label>First name</label>
            <input name="firstName" type="text" placeholder="Riley" required />
          </div>
          <div>
            <label>Last name</label>
            <input name="lastName" type="text" placeholder="Parker" required />
          </div>
          <div>
            <label>Title</label>
            <input name="title" type="text" placeholder="Picker / Packer" required />
          </div>
          <div>
            <label>Phone</label>
            <input name="phone" type="text" placeholder="(555) 555-0112" required />
          </div>
          <div class="form-span-2">
            <label>Email</label>
            <input name="email" type="email" placeholder="riley@agency-demo.com" required />
          </div>
          <div class="form-span-2 form-actions">
            <button class="button button-primary" type="submit">Add Worker</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function assignmentsView() {
  const assignments = assignmentsForCurrentAgency();

  return `
    <section class="page-intro card">
      <div class="page-intro-header">
        <div>
          <p class="eyebrow">Assignments</p>
          <h3>Pay rates, bill rates, shifts, and site placement</h3>
          <p>This is the staffing economics layer that makes payroll and gross margin reporting feel real.</p>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Assignment sheet</h3>
            <p>Each assignment connects the worker, client, site, shift window, pay rate, and bill rate.</p>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Client</th>
                <th>Site</th>
                <th>Shift</th>
                <th>Pay Rate</th>
                <th>Bill Rate</th>
                <th>Spread</th>
              </tr>
            </thead>
            <tbody>
              ${assignments.map(assignmentRow).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Add assignment</h3>
            <p>Update worker placement without leaving the static app.</p>
          </div>
        </div>

        <form id="assignmentForm" class="form-grid">
          <div>
            <label>Worker</label>
            <select name="workerId">
              ${workersForCurrentAgency().map(workerRecord => `<option value="${safe(workerRecord.id)}">${safe(fullWorkerName(workerRecord.id))}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Client</label>
            <select name="clientId">
              ${clientsForCurrentAgency().map(clientRecord => `<option value="${safe(clientRecord.id)}">${safe(clientRecord.name)}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Site</label>
            <select name="siteId">
              ${sitesForCurrentAgency().map(siteRecord => `<option value="${safe(siteRecord.id)}">${safe(siteRecord.code)} - ${safe(siteRecord.name)}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Title</label>
            <input name="title" type="text" placeholder="Forklift Operator" required />
          </div>
          <div>
            <label>Shift start</label>
            <input name="shiftStart" type="time" value="07:00" required />
          </div>
          <div>
            <label>Shift end</label>
            <input name="shiftEnd" type="time" value="15:30" required />
          </div>
          <div>
            <label>Pay rate</label>
            <input name="payRate" type="number" min="0" step="0.01" value="18.00" required />
          </div>
          <div>
            <label>Bill rate</label>
            <input name="billRate" type="number" min="0" step="0.01" value="29.00" required />
          </div>
          <div class="form-span-2 form-actions">
            <button class="button button-primary" type="submit">Save Assignment</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function timeclockView() {
  const worker = currentWorker();
  const assignment = activeAssignmentForWorker(worker?.id);
  const site = state.sites.find(record => record.id === state.punchSiteId) || (assignment ? siteById(assignment.siteId) : sitesForCurrentAgency()[0]);
  const workerHistory = punchesForWorker(worker?.id).slice(0, 8);

  return `
    <section class="page-intro card">
      <div class="page-intro-header">
        <div>
          <p class="eyebrow">Worker QR Punch</p>
          <h3>Simple mobile-first punch flow</h3>
          <p>Clean worker context, four large punch actions, instant confirmation, and a short recent history feed.</p>
        </div>
      </div>
    </section>

    <section class="timeclock-layout">
      <div class="card timeclock-panel">
        <div class="worker-banner">
          <span class="eyebrow">Selected Worker</span>
          <strong>${safe(worker ? fullWorkerName(worker.id) : "No worker selected")}</strong>
          <span class="worker-meta">${safe(assignment?.title || worker?.title || "Unassigned worker")} · ${safe(clientById(assignment?.clientId)?.name || "No client")} · ${safe(site ? `${site.code} - ${site.name}` : "No site selected")}</span>
        </div>

        <div class="field-group">
          <label for="timeclockSiteSelect">Punch site</label>
          <select id="timeclockSiteSelect">
            ${punchSiteOptions(worker?.id).map(siteRecord => `<option value="${safe(siteRecord.id)}" ${siteRecord.id === site?.id ? "selected" : ""}>${safe(siteRecord.code)} - ${safe(siteRecord.name)}</option>`).join("")}
          </select>
        </div>

        <div class="punch-button-grid">
          <button class="punch-button clock-in" data-punch="Clock In" type="button">Clock In</button>
          <button class="punch-button lunch-start" data-punch="Start Lunch" type="button">Start Lunch</button>
          <button class="punch-button lunch-end" data-punch="End Lunch" type="button">End Lunch</button>
          <button class="punch-button clock-out" data-punch="Clock Out" type="button">Clock Out</button>
        </div>

        <div class="confirmation-banner">${safe(state.punchMessage)}</div>
      </div>

      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Recent punch history</h3>
            <p>Show the last several actions for the selected worker, including the newest confirmation.</p>
          </div>
        </div>

        <div class="history-list">
          ${workerHistory.length ? workerHistory.map(renderHistoryItem).join("") : emptyState("No punch history yet for this worker.")}
        </div>
      </div>
    </section>
  `;
}

function approvalsView() {
  const client = currentClient();
  const timesheets = timesheetsForClient(state.currentClientId, state.selectedWeekStart);
  const assignedWorkers = workersAssignedToClient(state.currentClientId);
  const pendingCount = timesheets.filter(record => record.clientStatus === "pending").length;
  const approvedCount = timesheets.filter(record => record.clientStatus === "approved").length;
  const rejectedCount = timesheets.filter(record => record.clientStatus === "rejected").length;

  return `
    <section class="page-intro card">
      <div class="page-intro-header">
        <div>
          <p class="eyebrow">Client Approval Portal</p>
          <h3>${safe(client?.name || "Client")} manager review view</h3>
          <p>See assigned workers, review daily and weekly hours, approve clean time, or reject with notes before payroll export.</p>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="summary-grid">
        ${summaryCard("PD", "Pending approval count", String(pendingCount))}
        ${summaryCard("OK", "Approved this week", String(approvedCount))}
        ${summaryCard("RJ", "Rejected this week", String(rejectedCount))}
        ${summaryCard("CR", "Assigned crew", String(assignedWorkers.length))}
      </div>
    </section>

    <section class="split-grid">
      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Workers assigned to this site group</h3>
            <p>Client managers can quickly verify the crew attached to their warehouses.</p>
          </div>
        </div>

        <div class="site-grid">
          ${assignedWorkers.length ? assignedWorkers.map(clientWorkerCard).join("") : emptyState("No workers are assigned to this client yet.")}
        </div>
      </div>

      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Approval queue</h3>
            <p>Approve timesheets, or reject them with a note that stays visible in the audit trail.</p>
          </div>
        </div>

        <div class="approval-list">
          ${timesheets.length ? timesheets.map(renderApprovalCard).join("") : emptyState("No timesheets exist for this client in the selected week.")}
        </div>
      </div>
    </section>
  `;
}

function payrollView() {
  const weeks = availableWeeksForCurrentAgency();
  const rows = payrollRows(state.selectedWeekStart);
  const totals = payrollTotals(rows);

  return `
    <section class="page-intro card">
      <div class="page-intro-header">
        <div>
          <p class="eyebrow">Payroll Export Center</p>
          <h3>Weekly payroll handoff without leaving the static demo</h3>
          <p>Select a pay period, review approved and pending hours, then export CSV, Excel-ready CSV, or a print-to-PDF timesheet packet.</p>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="toolbar">
        <div class="field-group">
          <label for="payrollWeekSelect">Weekly pay period</label>
          <select id="payrollWeekSelect">
            ${weeks.map(week => `<option value="${safe(week)}" ${week === state.selectedWeekStart ? "selected" : ""}>Week of ${safe(formatDate(week))}</option>`).join("")}
          </select>
        </div>

        <div class="toolbar-actions">
          <button class="button button-secondary" data-export="csv" type="button">Export CSV</button>
          <button class="button button-ghost" data-export="excel" type="button">Export Excel-ready CSV</button>
          <button class="button button-primary" data-export="pdf" type="button">Export Weekly Timesheet PDF</button>
        </div>
      </div>

      <div class="metric-grid" style="margin-top: 18px;">
        ${metricCard("AH", "Approved Hours", formatHours(totals.approvedHours), "Hours approved by the client.")}
        ${metricCard("RG", "Regular Hours", formatHours(totals.regularHours), "Straight-time hours for the week.")}
        ${metricCard("OT", "Overtime Hours", formatHours(totals.overtimeHours), "Hours above forty.")}
        ${metricCard("PR", "Avg Pay Rate", formatCurrency(totals.averagePayRate), "Weighted average pay rate.")}
        ${metricCard("LC", "Total Labor Cost", formatCurrency(totals.totalLaborCost), "Modeled payroll cost for this period.")}
        ${metricCard("FA", "Final Approved", String(totals.finalApproved), "Timesheets ready to export.")}
      </div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <h3>Payroll detail</h3>
          <p>Approved hours, regular, overtime, pay rate, and total labor cost per worker.</p>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Worker</th>
              <th>Client</th>
              <th>Site</th>
              <th>Approved Hours</th>
              <th>Regular</th>
              <th>OT</th>
              <th>Pay Rate</th>
              <th>Total Labor Cost</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(payrollRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function marginView() {
  const rows = payrollRows(state.selectedWeekStart);
  const totals = payrollTotals(rows);
  const marginPercent = totals.totalRevenue ? (totals.totalGrossProfit / totals.totalRevenue) * 100 : 0;

  return `
    <section class="page-intro card">
      <div class="page-intro-header">
        <div>
          <p class="eyebrow">Gross Margin Report</p>
          <h3>See pay, bill, revenue, labor cost, and margin in one report</h3>
          <p>Revenue = Bill Rate × Hours. Labor Cost = Pay Rate × Hours. Gross Profit = Revenue - Labor Cost. Margin % = Gross Profit / Revenue × 100.</p>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="formula-grid">
        ${formulaCard("Revenue", "Bill Rate × Hours")}
        ${formulaCard("Labor Cost", "Pay Rate × Hours")}
        ${formulaCard("Gross Profit", "Revenue - Labor Cost")}
        ${formulaCard("Margin %", "Gross Profit / Revenue × 100")}
      </div>
    </section>

    <section class="card">
      <div class="metric-grid">
        ${metricCard("RV", "Revenue", formatCurrency(totals.totalRevenue), "Projected client billing for the selected week.")}
        ${metricCard("LC", "Labor Cost", formatCurrency(totals.totalLaborCost), "Projected payroll cost for the selected week.")}
        ${metricCard("GP", "Gross Profit", formatCurrency(totals.totalGrossProfit), "Revenue minus labor cost.")}
        ${metricCard("M%", "Margin %", `${formatPercent(marginPercent)}`, "Gross profit divided by revenue.")}
        ${metricCard("BR", "Avg Bill Rate", formatCurrency(totals.averageBillRate), "Weighted average bill rate.")}
        ${metricCard("PR", "Avg Pay Rate", formatCurrency(totals.averagePayRate), "Weighted average pay rate.")}
      </div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <h3>Margin detail by worker</h3>
          <p>Use this report to show staffing owners how Portaly surfaces spread and profitability before payroll leaves the system.</p>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Worker</th>
              <th>Client</th>
              <th>Hours Worked</th>
              <th>Pay Rate</th>
              <th>Bill Rate</th>
              <th>Revenue</th>
              <th>Labor Cost</th>
              <th>Gross Profit</th>
              <th>Margin %</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(marginRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function settingsView() {
  const settings = currentAgencySettings();

  return `
    <section class="page-intro card">
      <div class="page-intro-header">
        <div>
          <p class="eyebrow">White-Label Settings</p>
          <h3>Customize the agency-facing demo brand</h3>
          <p>Save agency name, logo placeholder, primary color, payroll contact email, and support phone to localStorage.</p>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="card">
        <div class="section-heading">
          <div>
            <h3>Brand controls</h3>
            <p>These changes update the active agency workspace instantly after saving.</p>
          </div>
        </div>

        <form id="settingsForm" class="form-grid">
          <div>
            <label>Agency name</label>
            <input name="agencyName" type="text" value="${safe(settings.agencyName)}" required />
          </div>
          <div>
            <label>Logo placeholder</label>
            <input name="logoText" type="text" value="${safe(settings.logoText)}" maxlength="3" required />
          </div>
          <div>
            <label>Primary color</label>
            <input name="primaryColor" type="color" value="${safe(settings.primaryColor)}" />
          </div>
          <div>
            <label>Payroll contact email</label>
            <input name="payrollContactEmail" type="email" value="${safe(settings.payrollContactEmail)}" required />
          </div>
          <div class="form-span-2">
            <label>Support phone number</label>
            <input name="supportPhone" type="text" value="${safe(settings.supportPhone)}" required />
          </div>
          <div class="form-span-2 form-actions">
            <button class="button button-primary" type="submit">Save Settings</button>
          </div>
        </form>
      </div>

      <div class="card settings-preview">
        <div class="section-heading">
          <div>
            <h3>Brand preview</h3>
            <p>Use this preview to sell the white-label angle of the staffing platform.</p>
          </div>
        </div>

        <div class="brand-preview-shell">
          <div class="brand-preview-header">
            <div class="brand-mark">${safe(settings.logoText)}</div>
            <div class="brand-preview-copy">
              <h4>${safe(settings.agencyName)}</h4>
              <p class="muted">Powered by Portaly</p>
            </div>
          </div>

          <div class="settings-list">
            <div><span>Primary color</span><strong>${safe(settings.primaryColor)}</strong></div>
            <div><span>Payroll contact</span><strong>${safe(settings.payrollContactEmail)}</strong></div>
            <div><span>Support phone</span><strong>${safe(settings.supportPhone)}</strong></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function agencyCard(agencyRecord) {
  const settings = settingsForAgency(agencyRecord.id);
  return `
    <article class="site-card">
      <header>
        <div>
          <h4>${safe(agencyRecord.name)}</h4>
          <p class="site-meta">${safe(agencyRecord.code)} · ${safe(agencyRecord.plan)}</p>
        </div>
        ${statusBadge(agencyRecord.id === state.currentAgencyId ? "Active Workspace" : "Available", agencyRecord.id === state.currentAgencyId ? "status-approved" : "status-neutral")}
      </header>
      <p>${safe(agencyRecord.owner)} leads this branch with ${safe(countLabel(clientsForAgency(agencyRecord.id).length, "client"))} and ${safe(countLabel(workersForAgency(agencyRecord.id).length, "worker"))}.</p>
      <div class="site-tags">
        <span class="tiny-pill">${safe(settings.payrollContactEmail)}</span>
        <span class="tiny-pill">${safe(settings.supportPhone)}</span>
      </div>
    </article>
  `;
}

function agencyRow(agencyRecord) {
  const settings = settingsForAgency(agencyRecord.id);
  return `
    <tr>
      <td>${safe(agencyRecord.code)} - ${safe(agencyRecord.name)}</td>
      <td>${safe(agencyRecord.plan)}</td>
      <td>${clientsForAgency(agencyRecord.id).length}</td>
      <td>${sitesForAgency(agencyRecord.id).length}</td>
      <td>${workersForAgency(agencyRecord.id).length}</td>
      <td>${safe(settings.payrollContactEmail)}</td>
      <td>${safe(settings.supportPhone)}</td>
    </tr>
  `;
}

function clientCard(clientRecord) {
  return `
    <article class="site-card">
      <header>
        <div>
          <h4>${safe(clientRecord.name)}</h4>
          <p class="site-meta">${safe(clientRecord.contactName)} · ${safe(clientRecord.contactTitle)}</p>
        </div>
        ${statusBadge(`${timesheetsForClient(clientRecord.id, state.selectedWeekStart).filter(record => record.clientStatus === "pending").length} pending`, "status-warning")}
      </header>
      <p>${safe(clientRecord.email)}</p>
      <div class="site-tags">
        <span class="tiny-pill">${safe(countLabel(sitesForClient(clientRecord.id).length, "site"))}</span>
        <span class="tiny-pill">${safe(countLabel(workersAssignedToClient(clientRecord.id).length, "assigned worker"))}</span>
      </div>
    </article>
  `;
}

function clientRow(clientRecord) {
  return `
    <tr>
      <td>${safe(clientRecord.name)}</td>
      <td>${safe(clientRecord.contactName)} - ${safe(clientRecord.contactTitle)}</td>
      <td>${sitesForClient(clientRecord.id).length}</td>
      <td>${workersAssignedToClient(clientRecord.id).length}</td>
      <td>${timesheetsForClient(clientRecord.id, state.selectedWeekStart).filter(record => record.clientStatus === "pending").length}</td>
    </tr>
  `;
}

function siteCard(siteRecord) {
  const link = timeclockUrlForSite(siteRecord);
  return `
    <article class="site-card">
      <header>
        <div>
          <h4>${safe(siteRecord.name)}</h4>
          <p class="site-meta">${safe(siteRecord.code)} · ${safe(clientById(siteRecord.clientId)?.name || "No client")}</p>
        </div>
        ${statusBadge("QR ready", "status-approved")}
      </header>
      <p>${safe(siteRecord.address)}</p>
      <div class="site-tags">
        <span class="tiny-pill">${safe(siteRecord.shiftProfile)}</span>
        <span class="tiny-pill">${safe(countLabel(workersAssignedToSite(siteRecord.id).length, "worker"))}</span>
      </div>
      <div class="table-actions">
        <a class="button button-secondary" href="${safe(link)}">Open Punch Link</a>
        <button class="button button-ghost" data-copy-link="${safe(link)}" type="button">Copy Link</button>
      </div>
    </article>
  `;
}

function workerRow(workerRecord) {
  const assignment = activeAssignmentForWorker(workerRecord.id);
  return `
    <tr>
      <td>${safe(fullWorkerName(workerRecord.id))}</td>
      <td>${safe(workerRecord.title)}</td>
      <td>${safe(workerRecord.email)}</td>
      <td>${safe(workerRecord.phone)}</td>
      <td>${safe(assignment ? `${clientById(assignment.clientId)?.name || ""} · ${siteById(assignment.siteId)?.code || ""}` : "Unassigned")}</td>
      <td>${statusBadge(workerRecord.status, "status-approved")}</td>
    </tr>
  `;
}

function assignmentRow(record) {
  return `
    <tr>
      <td>${safe(fullWorkerName(record.workerId))}</td>
      <td>${safe(clientById(record.clientId)?.name || "No client")}</td>
      <td>${safe(siteById(record.siteId)?.code || "")}</td>
      <td>${safe(record.shiftStart)} - ${safe(record.shiftEnd)}</td>
      <td>${safe(formatCurrency(record.payRate))}</td>
      <td>${safe(formatCurrency(record.billRate))}</td>
      <td>${safe(formatCurrency(record.billRate - record.payRate))}</td>
    </tr>
  `;
}

function renderApprovalCard(timesheet) {
  const statusClass = approvalStatusClass(timesheet);
  const noteValue = timesheet.clientStatus === "rejected" ? timesheet.rejectionNote : timesheet.approvalNote;
  return `
    <article class="approval-card">
      <header>
        <div>
          <h4>${safe(fullWorkerName(timesheet.workerId))}</h4>
          <p class="approval-meta">${safe(siteById(timesheet.siteId)?.code || "")} · ${safe(clientById(timesheet.clientId)?.name || "")}</p>
        </div>
        ${statusBadge(approvalStatusLabel(timesheet), statusClass)}
      </header>

      <div class="hours-strip">
        ${timesheet.days.map(day => `<div class="hours-chip">${safe(day.label)}<strong>${safe(formatHours(day.hours))}</strong></div>`).join("")}
      </div>

      <div class="compact-stats">
        <span>Weekly hours: ${safe(formatHours(timesheet.totalHours))}</span>
        <span>Regular: ${safe(formatHours(timesheet.regularHours))}</span>
        <span>OT: ${safe(formatHours(timesheet.overtimeHours))}</span>
        <span>Approved: ${safe(formatHours(timesheet.approvedHours))}</span>
      </div>

      <div class="field-group">
        <label for="note_${safe(timesheet.id)}">Approval notes</label>
        <textarea id="note_${safe(timesheet.id)}" data-note-input="${safe(timesheet.id)}" placeholder="Approve with a note, or explain why this timesheet needs to be rejected.">${safe(noteValue)}</textarea>
      </div>

      <div class="approval-footer">
        <div class="inline-pills">
          ${timesheet.manualEdited ? `<span class="tiny-pill">Manual edit: ${safe(timesheet.manualNote || "Yes")}</span>` : ""}
        </div>
        <div class="approval-actions">
          <button class="button button-secondary" data-approve-timesheet="${safe(timesheet.id)}" type="button">Approve Timesheet</button>
          <button class="button button-danger" data-reject-timesheet="${safe(timesheet.id)}" type="button">Reject with Note</button>
        </div>
      </div>
    </article>
  `;
}

function payrollRow(row) {
  const timesheet = row.timesheet;
  const showFinalize = timesheet.clientStatus === "approved" && timesheet.agencyStatus !== "finalized";
  return `
    <tr>
      <td>${safe(row.workerName)}</td>
      <td>${safe(row.clientName)}</td>
      <td>${safe(row.siteName)}</td>
      <td>${safe(formatHours(row.approvedHours))}</td>
      <td>${safe(formatHours(row.regularHours))}</td>
      <td>${safe(formatHours(row.overtimeHours))}</td>
      <td>${safe(formatCurrency(row.payRate))}</td>
      <td>${safe(formatCurrency(row.laborCost))}</td>
      <td>${statusBadge(approvalStatusLabel(timesheet), approvalStatusClass(timesheet))}</td>
      <td>
        ${showFinalize
          ? `<button class="button button-ghost" data-finalize-timesheet="${safe(timesheet.id)}" type="button">Finalize</button>`
          : `<span class="help-text">${safe(timesheet.agencyStatus === "finalized" ? "Ready" : "Waiting")}</span>`}
      </td>
    </tr>
  `;
}

function marginRow(row) {
  return `
    <tr>
      <td>${safe(row.workerName)}</td>
      <td>${safe(row.clientName)}</td>
      <td>${safe(formatHours(row.totalHours))}</td>
      <td>${safe(formatCurrency(row.payRate))}</td>
      <td>${safe(formatCurrency(row.billRate))}</td>
      <td>${safe(formatCurrency(row.revenue))}</td>
      <td>${safe(formatCurrency(row.laborCost))}</td>
      <td>${safe(formatCurrency(row.grossProfit))}</td>
      <td>${safe(formatPercent(row.marginPercent))}</td>
    </tr>
  `;
}

function clientWorkerCard(workerRecord) {
  const assignment = activeAssignmentForWorker(workerRecord.id);
  return `
    <article class="worker-card">
      <header>
        <div>
          <h4>${safe(fullWorkerName(workerRecord.id))}</h4>
          <p class="worker-meta">${safe(workerRecord.title)}</p>
        </div>
        ${statusBadge("Assigned", "status-approved")}
      </header>
      <p>${safe(siteById(assignment?.siteId)?.code || "No site")} · ${safe(siteById(assignment?.siteId)?.name || "")}</p>
      <div class="worker-tags">
        <span class="tiny-pill">${safe(assignment?.shiftStart || "--:--")} - ${safe(assignment?.shiftEnd || "--:--")}</span>
        <span class="tiny-pill">${safe(formatCurrency(assignment?.billRate || 0))} bill</span>
      </div>
    </article>
  `;
}

function renderExceptionCard(item) {
  const severityClass = item.severity === "high" ? "status-danger" : item.severity === "medium" ? "status-warning" : "status-neutral";
  return `
    <article class="exception-item">
      <header>
        <div>
          <h4>${safe(item.title)}</h4>
          <p class="exception-meta">${safe(item.meta)}</p>
        </div>
        ${statusBadge(item.category, severityClass)}
      </header>
      <p>${safe(item.note)}</p>
    </article>
  `;
}

function renderTimelineItem(item) {
  return `
    <article class="timeline-item">
      <div class="timeline-icon">AT</div>
      <div>
        <div class="timeline-time">${safe(formatDateTime(item.timestamp))} · ${safe(item.actor)}</div>
        <h4>${safe(item.title)}</h4>
        <p class="timeline-note">${safe(item.note)}</p>
      </div>
    </article>
  `;
}

function renderHistoryItem(punch) {
  return `
    <article class="history-item">
      <header>
        <div>
          <h4>${safe(punch.type)}</h4>
          <p class="history-meta">${safe(siteById(punch.siteId)?.code || "")} · ${safe(formatDateTime(punch.timestamp))}</p>
        </div>
        ${statusBadge(punchStatus(punch), punchStatus(punch) === "Late" ? "status-warning" : "status-approved")}
      </header>
    </article>
  `;
}

function heroStat(label, value, copy) {
  return `
    <div class="hero-stat">
      <span>${safe(label)}</span>
      <strong>${safe(value)}</strong>
      <p>${safe(copy)}</p>
    </div>
  `;
}

function metricCard(icon, label, value, note) {
  return `
    <article class="metric-card">
      <div class="metric-header">
        <div>
          <div class="metric-label">${safe(label)}</div>
          <div class="metric-value">${safe(value)}</div>
        </div>
        <span class="metric-icon">${safe(icon)}</span>
      </div>
      <div class="metric-note">${safe(note)}</div>
    </article>
  `;
}

function featureCard(icon, title, copy) {
  return `
    <article class="feature-card">
      <span class="feature-icon">${safe(icon)}</span>
      <h4>${safe(title)}</h4>
      <p>${safe(copy)}</p>
    </article>
  `;
}

function pricingCard(name, price, items) {
  return `
    <article class="pricing-card">
      <h4>${safe(name)}</h4>
      <div class="pricing-price">${safe(price)}</div>
      <ul>
        ${items.map(item => `<li>${safe(item)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function formulaCard(title, formula) {
  return `
    <article class="formula-card">
      <span class="eyebrow eyebrow-tight">${safe(title)}</span>
      <code>${safe(formula)}</code>
    </article>
  `;
}

function summaryCard(icon, label, value) {
  return `
    <article class="summary-card">
      <div class="summary-top">
        <div>
          <div class="summary-label">${safe(label)}</div>
          <div class="summary-value">${safe(value)}</div>
        </div>
        <span class="summary-icon">${safe(icon)}</span>
      </div>
    </article>
  `;
}

function dashboardMetrics() {
  const currentWeekTimesheets = timesheetsForAgencyWeek(state.currentAgencyId, state.currentWeek);
  const todayPunches = punchesForAgency(state.currentAgencyId).filter(record => isTodayTimestamp(record.timestamp));
  const workersClockedInToday = new Set(todayPunches.filter(record => record.type === "Clock In").map(record => record.workerId)).size;
  const pendingApprovals = currentWeekTimesheets.filter(record => record.clientStatus === "pending").length;
  const exceptions = buildExceptions();
  const missingPunches = exceptions.filter(item => item.key === "missing_clock_out" || item.key === "open_lunch").length;
  const payrollHours = currentWeekTimesheets.reduce((sum, record) => sum + record.totalHours, 0);
  const grossMargin = payrollRows(state.currentWeek).reduce((sum, row) => sum + row.grossProfit, 0);
  const activeSites = sitesForAgency(state.currentAgencyId).length;
  const readyHours = currentWeekTimesheets.filter(record => record.agencyStatus === "finalized").reduce((sum, record) => sum + record.totalHours, 0);

  return {
    workersClockedInToday,
    pendingApprovals,
    missingPunches,
    payrollHours,
    grossMargin,
    activeSites,
    activeSitesLabel: `${activeSites} active client sites`,
    readyHoursLabel: `${formatHours(readyHours)} ready payroll hours`
  };
}

function buildExceptions() {
  const exceptions = [];
  const todayPunches = punchesForAgency(state.currentAgencyId)
    .filter(record => isTodayTimestamp(record.timestamp))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const byWorker = new Map();

  todayPunches.forEach(record => {
    if (!byWorker.has(record.workerId)) {
      byWorker.set(record.workerId, []);
    }
    byWorker.get(record.workerId).push(record);
  });

  byWorker.forEach((records, workerId) => {
    const assignment = activeAssignmentForWorker(workerId);
    const firstClockIn = records.find(record => record.type === "Clock In");

    const latestLunchStart = [...records].reverse().find(record => record.type === "Start Lunch");
    const latestLunchEnd = [...records].reverse().find(record => record.type === "End Lunch");
    const lunchOpen = latestLunchStart && (!latestLunchEnd || new Date(latestLunchStart.timestamp) > new Date(latestLunchEnd.timestamp));

    if (lunchOpen) {
      exceptions.push({
        key: "open_lunch",
        category: "Lunch started but not ended",
        severity: "high",
        title: fullWorkerName(workerId),
        meta: `${siteById(records[0].siteId)?.code || "Site"} · ${clientById(assignment?.clientId)?.name || "Client"}`,
        note: "Lunch was started and never ended on today's punch flow."
      });
    } else {
      const latestClockIn = [...records].reverse().find(record => record.type === "Clock In");
      const latestClockOut = [...records].reverse().find(record => record.type === "Clock Out");
      if (latestClockIn && !latestClockOut) {
        exceptions.push({
          key: "missing_clock_out",
          category: "Clocked in but no clock out",
          severity: "high",
          title: fullWorkerName(workerId),
          meta: `${siteById(records[0].siteId)?.code || "Site"} · ${clientById(assignment?.clientId)?.name || "Client"}`,
          note: "The worker has a live clock-in today with no matching clock-out."
        });
      }
    }

    if (firstClockIn && assignment) {
      const scheduled = parseTimestampOnSameDay(firstClockIn.timestamp, assignment.shiftStart);
      const minutesLate = Math.round((new Date(firstClockIn.timestamp) - scheduled) / 60000);
      if (minutesLate > 5) {
        exceptions.push({
          key: "late_punch",
          category: "Late punch",
          severity: "medium",
          title: fullWorkerName(workerId),
          meta: `${siteById(records[0].siteId)?.code || "Site"} · ${minutesLate} minutes late`,
          note: `Clock-in landed after the scheduled ${assignment.shiftStart} start time.`
        });
      }
    }

    for (let index = 1; index < records.length; index += 1) {
      const current = records[index];
      const previous = records[index - 1];
      const deltaMinutes = Math.round((new Date(current.timestamp) - new Date(previous.timestamp)) / 60000);

      if (current.type === previous.type && deltaMinutes <= 10) {
        exceptions.push({
          key: "duplicate_punch",
          category: "Duplicate punch",
          severity: "low",
          title: fullWorkerName(workerId),
          meta: `${siteById(current.siteId)?.code || "Site"} · ${current.type}`,
          note: "Two identical punch actions were recorded within ten minutes."
        });
        break;
      }
    }
  });

  timesheetsForAgencyWeek(state.currentAgencyId, state.currentWeek).forEach(record => {
    if (record.clientStatus === "pending") {
      exceptions.push({
        key: "missing_approval",
        category: "Missing approval",
        severity: "medium",
        title: fullWorkerName(record.workerId),
        meta: `${clientById(record.clientId)?.name || "Client"} · Week of ${formatDate(record.weekStart)}`,
        note: "This timecard still needs client review before payroll export."
      });
    }

    if (record.manualEdited) {
      exceptions.push({
        key: "manual_edit",
        category: "Manual edit made",
        severity: "low",
        title: fullWorkerName(record.workerId),
        meta: `${clientById(record.clientId)?.name || "Client"} · Week of ${formatDate(record.weekStart)}`,
        note: record.manualNote || "The timesheet was adjusted manually and should be reviewed."
      });
    }
  });

  return exceptions;
}

function recentActivity() {
  return auditTrailForAgency(state.currentAgencyId)
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function approveTimesheet(id) {
  if (state.currentRole === "worker") {
    toast("Workers cannot approve timesheets.");
    return;
  }

  const timesheet = state.timesheets.find(record => record.id === id);
  if (!timesheet) return;

  const noteInput = document.querySelector(`[data-note-input="${id}"]`);
  const note = String(noteInput?.value || "").trim();

  timesheet.clientStatus = "approved";
  timesheet.agencyStatus = timesheet.agencyStatus === "hold" ? "ready" : timesheet.agencyStatus;
  timesheet.approvedHours = timesheet.totalHours;
  timesheet.rejectionNote = "";
  timesheet.approvalNote = note || "Approved in the client approval portal.";
  timesheet.updatedAt = new Date().toISOString();
  syncTimesheet(timesheet);

  addAudit("Timesheet approved", `${fullWorkerName(timesheet.workerId)} was approved for ${clientById(timesheet.clientId)?.name || "the client"}.`, state.currentAgencyId);

  saveState();
  renderView();
  toast("Timesheet approved.");
}

function rejectTimesheet(id) {
  if (state.currentRole === "worker") {
    toast("Workers cannot reject timesheets.");
    return;
  }

  const timesheet = state.timesheets.find(record => record.id === id);
  if (!timesheet) return;

  const noteInput = document.querySelector(`[data-note-input="${id}"]`);
  const note = String(noteInput?.value || "").trim();

  if (!note) {
    toast("Add a rejection note before rejecting this timesheet.");
    return;
  }

  timesheet.clientStatus = "rejected";
  timesheet.agencyStatus = "hold";
  timesheet.approvedHours = 0;
  timesheet.rejectionNote = note;
  timesheet.approvalNote = "";
  timesheet.updatedAt = new Date().toISOString();
  syncTimesheet(timesheet);

  addAudit("Timesheet rejected", `${fullWorkerName(timesheet.workerId)} was sent back with a client note.`, state.currentAgencyId);

  saveState();
  renderView();
  toast("Timesheet rejected with note.");
}

function finalizeTimesheet(id) {
  if (state.currentRole === "worker") {
    toast("Workers cannot finalize payroll.");
    return;
  }

  const timesheet = state.timesheets.find(record => record.id === id);
  if (!timesheet) return;

  if (timesheet.clientStatus !== "approved") {
    toast("The client must approve this timesheet before payroll finalization.");
    return;
  }

  timesheet.agencyStatus = "finalized";
  timesheet.updatedAt = new Date().toISOString();
  syncTimesheet(timesheet);

  addAudit("Payroll finalized", `${fullWorkerName(timesheet.workerId)} moved into the final approved payroll queue.`, state.currentAgencyId);

  saveState();
  renderView();
  toast("Timesheet finalized for payroll.");
}

function createPunch(type) {
  const worker = currentWorker();
  if (!worker) {
    toast("Select a worker first.");
    return;
  }

  const site = siteById(state.punchSiteId) || siteById(activeAssignmentForWorker(worker.id)?.siteId);
  if (!site) {
    toast("Select a punch site first.");
    return;
  }

  const record = {
    id: uid("punch"),
    agencyId: state.currentAgencyId,
    workerId: worker.id,
    siteId: site.id,
    type,
    timestamp: new Date().toISOString()
  };

  state.punches.push(record);
  state.punchMessage = `${type} saved for ${fullWorkerName(worker.id)} at ${site.code} on ${formatDateTime(record.timestamp)}.`;

  addAudit("Worker punch captured", `${fullWorkerName(worker.id)} recorded ${type.toLowerCase()} at ${site.code}.`, state.currentAgencyId);

  saveState();
  renderView();
  toast(`${type} recorded.`);
}

function saveSettings(data) {
  const currentAgencyRecord = currentAgency();
  if (!currentAgencyRecord) return;

  const agencyName = String(data.get("agencyName") || "").trim();
  const logoText = String(data.get("logoText") || "").trim().slice(0, 3).toUpperCase();
  const primaryColor = String(data.get("primaryColor") || "#1f6fff");
  const payrollContactEmail = String(data.get("payrollContactEmail") || "").trim();
  const supportPhone = String(data.get("supportPhone") || "").trim();

  currentAgencyRecord.name = agencyName;
  currentAgencyRecord.payrollEmail = payrollContactEmail;
  currentAgencyRecord.supportPhone = supportPhone;

  state.settingsByAgency[state.currentAgencyId] = {
    agencyName,
    logoText: logoText || initials(agencyName, 2),
    primaryColor,
    payrollContactEmail,
    supportPhone
  };

  addAudit("White-label settings updated", `${agencyName} branding and support details were saved in the demo.`, state.currentAgencyId);

  applyTheme();
  saveState();
  renderShell();
  renderView();
  toast("Settings saved.");
}

function addAgency(data) {
  const nextId = uid("agency");
  const name = String(data.get("name") || "").trim();
  const owner = String(data.get("owner") || "").trim();
  const payrollEmail = String(data.get("payrollEmail") || "").trim();
  const supportPhone = String(data.get("supportPhone") || "").trim();
  const plan = String(data.get("plan") || "Agency");
  const primaryColor = String(data.get("primaryColor") || "#1f6fff");

  const agencyRecord = {
    id: nextId,
    code: buildAgencyCode(name, state.agencies.length + 1),
    name,
    owner,
    plan,
    payrollEmail,
    supportPhone
  };

  state.agencies.push(agencyRecord);
  state.settingsByAgency[nextId] = {
    agencyName: name,
    logoText: initials(name, 2),
    primaryColor,
    payrollContactEmail: payrollEmail,
    supportPhone
  };

  state.currentAgencyId = nextId;
  normalizeSelections(state);
  applyTheme();
  addAudit("Agency created", `${name} was added to the staffing demo workspace.`, nextId);
  saveState();
  renderShell();
  renderView();
  toast("Agency added.");
}

function addClient(data) {
  const clientRecord = {
    id: uid("client"),
    agencyId: state.currentAgencyId,
    name: String(data.get("name") || "").trim(),
    contactName: String(data.get("contactName") || "").trim(),
    contactTitle: String(data.get("contactTitle") || "").trim(),
    email: String(data.get("email") || "").trim()
  };

  state.clients.push(clientRecord);
  state.currentClientId = clientRecord.id;
  addAudit("Client added", `${clientRecord.name} was added to the agency client list.`, state.currentAgencyId);
  saveState();
  renderShell();
  renderView();
  toast("Client added.");
}

function addSite(data) {
  const siteRecord = {
    id: uid("site"),
    agencyId: state.currentAgencyId,
    clientId: String(data.get("clientId") || state.currentClientId),
    name: String(data.get("name") || "").trim(),
    code: String(data.get("code") || "").trim().toUpperCase(),
    address: String(data.get("address") || "").trim(),
    shiftProfile: String(data.get("shiftProfile") || "").trim()
  };

  state.sites.push(siteRecord);
  state.punchSiteId = siteRecord.id;
  addAudit("Site added", `${siteRecord.name} was added to the demo site list.`, state.currentAgencyId);
  saveState();
  renderView();
  toast("Site added.");
}

function addWorker(data) {
  const workerRecord = {
    id: uid("worker"),
    agencyId: state.currentAgencyId,
    firstName: String(data.get("firstName") || "").trim(),
    lastName: String(data.get("lastName") || "").trim(),
    title: String(data.get("title") || "").trim(),
    email: String(data.get("email") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    status: "Active"
  };

  state.workers.push(workerRecord);
  state.currentWorkerId = workerRecord.id;
  addAudit("Worker added", `${fullWorkerName(workerRecord.id)} was added to the roster.`, state.currentAgencyId);
  saveState();
  renderShell();
  renderView();
  toast("Worker added.");
}

function addAssignment(data) {
  const workerId = String(data.get("workerId") || "");
  const clientId = String(data.get("clientId") || "");
  const siteId = String(data.get("siteId") || "");

  if (!workerId || !clientId || !siteId) {
    toast("Choose a worker, client, and site.");
    return;
  }

  state.assignments = state.assignments.map(record => (
    record.workerId === workerId ? { ...record, active: false } : record
  ));

  const assignment = {
    id: uid("assignment"),
    agencyId: state.currentAgencyId,
    workerId,
    clientId,
    siteId,
    title: String(data.get("title") || "").trim(),
    shiftStart: String(data.get("shiftStart") || "07:00"),
    shiftEnd: String(data.get("shiftEnd") || "15:30"),
    payRate: Number(data.get("payRate") || 0),
    billRate: Number(data.get("billRate") || 0),
    active: true
  };

  state.assignments.push(assignment);
  state.currentWorkerId = workerId;
  state.currentClientId = clientId;
  state.punchSiteId = siteId;

  const existingCurrentWeekTimesheet = state.timesheets.find(record => (
    record.workerId === workerId &&
    record.weekStart === state.currentWeek &&
    record.agencyId === state.currentAgencyId
  ));

  if (!existingCurrentWeekTimesheet) {
    state.timesheets.push(createTimesheet(
      uid("timesheet"),
      state.currentAgencyId,
      workerId,
      clientId,
      siteId,
      assignment.id,
      state.currentWeek,
      [0, 0, 0, 0, 0],
      "pending",
      "ready",
      {}
    ));
  }

  addAudit("Assignment saved", `${fullWorkerName(workerId)} was assigned to ${siteById(siteId)?.name || "the selected site"}.`, state.currentAgencyId);

  saveState();
  renderShell();
  renderView();
  toast("Assignment saved.");
}

function exportPayrollCsv(excelMode) {
  const rows = payrollRows(state.selectedWeekStart);
  if (!rows.length) {
    toast("No payroll rows are available for export.");
    return;
  }

  const payload = rows.map(row => ({
    agency: currentAgency()?.name || "",
    week_start: row.weekStart,
    worker: row.workerName,
    client: row.clientName,
    site: row.siteName,
    approved_hours: formatHours(row.approvedHours),
    regular_hours: formatHours(row.regularHours),
    overtime_hours: formatHours(row.overtimeHours),
    pay_rate: row.payRate.toFixed(2),
    total_labor_cost: row.laborCost.toFixed(2),
    bill_rate: row.billRate.toFixed(2),
    revenue: row.revenue.toFixed(2),
    gross_profit: row.grossProfit.toFixed(2),
    margin_percent: formatPercent(row.marginPercent),
    status: approvalStatusLabel(row.timesheet)
  }));

  const csv = toCsv(payload);
  const prefix = excelMode ? "\uFEFF" : "";
  const fileName = `${slugify(currentAgency()?.name || "portaly")}-${state.selectedWeekStart}-${excelMode ? "excel" : "payroll"}.csv`;
  downloadFile(fileName, prefix + csv, "text/csv;charset=utf-8;");

  addAudit("Payroll exported", `${excelMode ? "Excel-ready CSV" : "CSV"} payroll export generated for ${state.selectedWeekStart}.`, state.currentAgencyId);
  saveState();
  toast(excelMode ? "Excel-ready CSV exported." : "CSV exported.");
}

function exportPayrollPdf() {
  const rows = payrollRows(state.selectedWeekStart);
  if (!rows.length) {
    toast("No payroll rows are available for PDF export.");
    return;
  }

  const printable = window.open("", "_blank");
  if (!printable) {
    toast("Allow pop-ups to export the PDF print view.");
    return;
  }

  printable.document.write(`
    <html>
      <head>
        <title>Portaly Weekly Timesheet</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #17324d; }
          h1 { margin-bottom: 4px; }
          p { color: #5f738a; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border: 1px solid #d9e5f2; padding: 10px 12px; text-align: left; font-size: 13px; }
          th { background: #f3f8ff; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; }
        </style>
      </head>
      <body>
        <h1>${safe(currentAgency()?.name || "Portaly")}</h1>
        <p>Weekly Timesheet Report · Week of ${safe(formatDate(state.selectedWeekStart))}</p>
        <table>
          <thead>
            <tr>
              <th>Worker</th>
              <th>Client</th>
              <th>Site</th>
              <th>Approved Hours</th>
              <th>Regular</th>
              <th>OT</th>
              <th>Pay Rate</th>
              <th>Total Labor Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td>${safe(row.workerName)}</td>
                <td>${safe(row.clientName)}</td>
                <td>${safe(row.siteName)}</td>
                <td>${safe(formatHours(row.approvedHours))}</td>
                <td>${safe(formatHours(row.regularHours))}</td>
                <td>${safe(formatHours(row.overtimeHours))}</td>
                <td>${safe(formatCurrency(row.payRate))}</td>
                <td>${safe(formatCurrency(row.laborCost))}</td>
                <td>${safe(approvalStatusLabel(row.timesheet))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printable.document.close();
  printable.focus();
  printable.print();

  addAudit("PDF print view opened", `Weekly timesheet print view opened for ${state.selectedWeekStart}.`, state.currentAgencyId);
  saveState();
  toast("Weekly timesheet PDF view opened.");
}

function payrollRows(weekStart) {
  return timesheetsForAgencyWeek(state.currentAgencyId, weekStart).map(timesheet => {
    const assignment = state.assignments.find(record => record.id === timesheet.assignmentId) || activeAssignmentForWorker(timesheet.workerId);
    const payRate = Number(assignment?.payRate || 0);
    const billRate = Number(assignment?.billRate || 0);
    const laborCost = round2(payRate * timesheet.totalHours);
    const revenue = round2(billRate * timesheet.totalHours);
    const grossProfit = round2(revenue - laborCost);
    const marginPercent = revenue ? (grossProfit / revenue) * 100 : 0;

    return {
      timesheet,
      weekStart: timesheet.weekStart,
      workerName: fullWorkerName(timesheet.workerId),
      clientName: clientById(timesheet.clientId)?.name || "",
      siteName: siteById(timesheet.siteId)?.name || "",
      approvedHours: timesheet.approvedHours,
      regularHours: timesheet.regularHours,
      overtimeHours: timesheet.overtimeHours,
      totalHours: timesheet.totalHours,
      payRate,
      billRate,
      laborCost,
      revenue,
      grossProfit,
      marginPercent
    };
  });
}

function payrollTotals(rows) {
  const totals = rows.reduce((accumulator, row) => {
    accumulator.approvedHours += row.approvedHours;
    accumulator.regularHours += row.regularHours;
    accumulator.overtimeHours += row.overtimeHours;
    accumulator.totalLaborCost += row.laborCost;
    accumulator.totalRevenue += row.revenue;
    accumulator.totalGrossProfit += row.grossProfit;
    accumulator.weightedPayRate += row.payRate * row.totalHours;
    accumulator.weightedBillRate += row.billRate * row.totalHours;
    accumulator.totalHours += row.totalHours;
    accumulator.finalApproved += row.timesheet.agencyStatus === "finalized" ? 1 : 0;
    return accumulator;
  }, {
    approvedHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    totalLaborCost: 0,
    totalRevenue: 0,
    totalGrossProfit: 0,
    weightedPayRate: 0,
    weightedBillRate: 0,
    totalHours: 0,
    finalApproved: 0
  });

  totals.averagePayRate = totals.totalHours ? totals.weightedPayRate / totals.totalHours : 0;
  totals.averageBillRate = totals.totalHours ? totals.weightedBillRate / totals.totalHours : 0;
  return totals;
}

function settingsForAgency(agencyId) {
  const agencyRecord = state.agencies.find(record => record.id === agencyId);
  const stored = state.settingsByAgency[agencyId] || {};
  return {
    agencyName: stored.agencyName || agencyRecord?.name || "Agency",
    logoText: stored.logoText || initials(stored.agencyName || agencyRecord?.name || "Agency", 2),
    primaryColor: stored.primaryColor || "#1f6fff",
    payrollContactEmail: stored.payrollContactEmail || agencyRecord?.payrollEmail || "",
    supportPhone: stored.supportPhone || agencyRecord?.supportPhone || ""
  };
}

function currentAgencySettings() {
  return settingsForAgency(state.currentAgencyId);
}

function applyTheme() {
  const settings = currentAgencySettings();
  const hex = settings.primaryColor || "#1f6fff";
  const rgb = hexToRgb(hex);

  document.documentElement.style.setProperty("--brand", hex);
  document.documentElement.style.setProperty("--brand-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", hex);
  }
}

function addAudit(title, note, agencyId) {
  state.auditTrail.push({
    id: uid("audit"),
    agencyId,
    title,
    note,
    timestamp: new Date().toISOString(),
    actor: ROLE_LABELS[state.currentRole]
  });
}

function normalizeSelections(targetState) {
  if (!targetState.agencies.some(record => record.id === targetState.currentAgencyId)) {
    targetState.currentAgencyId = targetState.agencies[0]?.id || "";
  }

  const clients = targetState.clients.filter(record => record.agencyId === targetState.currentAgencyId);
  if (!clients.some(record => record.id === targetState.currentClientId)) {
    targetState.currentClientId = clients[0]?.id || "";
  }

  const workers = targetState.workers.filter(record => record.agencyId === targetState.currentAgencyId);
  if (!workers.some(record => record.id === targetState.currentWorkerId)) {
    targetState.currentWorkerId = workers[0]?.id || "";
  }

  const workerAssignment = targetState.assignments.find(record => record.workerId === targetState.currentWorkerId && record.active !== false) || null;
  const agencySites = targetState.sites.filter(record => record.agencyId === targetState.currentAgencyId);
  const sameClientSites = workerAssignment
    ? agencySites.filter(record => record.clientId === workerAssignment.clientId)
    : agencySites;
  const punchSiteIds = sameClientSites.length ? sameClientSites.map(record => record.id) : agencySites.map(record => record.id);

  if (!punchSiteIds.includes(targetState.punchSiteId)) {
    targetState.punchSiteId = workerAssignment?.siteId || punchSiteIds[0] || agencySites[0]?.id || "";
  }

  const weeks = [...new Set(targetState.timesheets.filter(record => record.agencyId === targetState.currentAgencyId).map(record => record.weekStart))]
    .sort((a, b) => new Date(b) - new Date(a));

  if (!weeks.includes(targetState.selectedWeekStart)) {
    targetState.selectedWeekStart = weeks[0] || targetState.currentWeek;
  }
}

function syncTimesheet(timesheet) {
  const totalHours = round2(timesheet.days.reduce((sum, day) => sum + Number(day.hours || 0), 0));
  timesheet.totalHours = totalHours;
  timesheet.regularHours = round2(Math.min(totalHours, 40));
  timesheet.overtimeHours = round2(Math.max(totalHours - 40, 0));
  if (timesheet.clientStatus === "approved" && Number(timesheet.approvedHours || 0) === 0) {
    timesheet.approvedHours = totalHours;
  }
  if (timesheet.clientStatus !== "approved") {
    timesheet.approvedHours = 0;
  }
  return timesheet;
}

function currentAgency() {
  return state.agencies.find(record => record.id === state.currentAgencyId) || null;
}

function currentClient() {
  return state.clients.find(record => record.id === state.currentClientId) || clientsForCurrentAgency()[0] || null;
}

function currentWorker() {
  return state.workers.find(record => record.id === state.currentWorkerId) || workersForCurrentAgency()[0] || null;
}

function agencies() {
  return state.agencies;
}

function clientsForAgency(agencyId) {
  return state.clients.filter(record => record.agencyId === agencyId);
}

function clientsForCurrentAgency() {
  return clientsForAgency(state.currentAgencyId);
}

function sitesForAgency(agencyId) {
  return state.sites.filter(record => record.agencyId === agencyId);
}

function sitesForCurrentAgency() {
  return sitesForAgency(state.currentAgencyId);
}

function workersForAgency(agencyId) {
  return state.workers.filter(record => record.agencyId === agencyId);
}

function workersForCurrentAgency() {
  return workersForAgency(state.currentAgencyId);
}

function assignmentsForCurrentAgency() {
  return assignmentsForAgency(state.currentAgencyId);
}

function assignmentsForAgency(agencyId) {
  return state.assignments.filter(record => record.agencyId === agencyId && record.active !== false);
}

function punchesForAgency(agencyId) {
  return state.punches.filter(record => record.agencyId === agencyId);
}

function auditTrailForAgency(agencyId) {
  return state.auditTrail.filter(record => record.agencyId === agencyId);
}

function clientById(id) {
  return state.clients.find(record => record.id === id) || null;
}

function siteById(id) {
  return state.sites.find(record => record.id === id) || null;
}

function activeAssignmentForWorker(workerId) {
  return state.assignments.find(record => record.workerId === workerId && record.active !== false) || null;
}

function punchesForWorker(workerId) {
  return state.punches
    .filter(record => record.workerId === workerId)
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function timesheetsForAgencyWeek(agencyId, weekStart) {
  return state.timesheets.filter(record => record.agencyId === agencyId && record.weekStart === weekStart);
}

function timesheetsForClient(clientId, weekStart) {
  return state.timesheets.filter(record => record.clientId === clientId && record.weekStart === weekStart);
}

function workersAssignedToClient(clientId) {
  const ids = new Set(state.assignments.filter(record => record.clientId === clientId && record.active !== false).map(record => record.workerId));
  return state.workers.filter(record => ids.has(record.id));
}

function workersAssignedToSite(siteId) {
  const ids = new Set(state.assignments.filter(record => record.siteId === siteId && record.active !== false).map(record => record.workerId));
  return state.workers.filter(record => ids.has(record.id));
}

function sitesForClient(clientId) {
  return state.sites.filter(record => record.clientId === clientId);
}

function availableWeeksForCurrentAgency() {
  return [...new Set(state.timesheets.filter(record => record.agencyId === state.currentAgencyId).map(record => record.weekStart))]
    .sort((a, b) => new Date(b) - new Date(a));
}

function renderContextLabel() {
  const roleLabel = ROLE_LABELS[state.currentRole] || "Demo Role";
  const agencyName = currentAgencySettings().agencyName || currentAgency()?.name || "Agency";

  if (state.currentRole === "client_manager") {
    return `${roleLabel} · ${agencyName} · ${currentClient()?.name || "Client Focus"}`;
  }

  if (state.currentRole === "worker") {
    return `${roleLabel} · ${agencyName} · ${fullWorkerName(state.currentWorkerId)}`;
  }

  return `${roleLabel} · ${agencyName}`;
}

function timeclockUrlForSite(siteRecord) {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("view", "timeclock");
  url.searchParams.set("agency", siteRecord.agencyId);
  url.searchParams.set("site", siteRecord.id);
  url.searchParams.set("role", "worker");
  return url.toString();
}

function punchSiteOptions(workerId, agencyId = state.currentAgencyId) {
  const assignment = activeAssignmentForWorker(workerId);
  const allSites = sitesForAgency(agencyId);

  if (!assignment) {
    return allSites;
  }

  const assignedSite = siteById(assignment.siteId);
  if (!assignedSite) {
    return allSites;
  }

  const sameClientSites = allSites.filter(record => record.clientId === assignment.clientId);
  const deduped = new Map([[assignedSite.id, assignedSite]]);
  sameClientSites.forEach(record => deduped.set(record.id, record));
  return [...deduped.values()];
}

function approvalStatusLabel(timesheet) {
  if (timesheet.clientStatus === "rejected") return "Rejected";
  if (timesheet.clientStatus === "approved" && timesheet.agencyStatus === "finalized") return "Final Approved";
  if (timesheet.clientStatus === "approved") return "Client Approved";
  return "Pending Approval";
}

function approvalStatusClass(timesheet) {
  if (timesheet.clientStatus === "rejected") return "status-danger";
  if (timesheet.clientStatus === "approved" && timesheet.agencyStatus === "finalized") return "status-final";
  if (timesheet.clientStatus === "approved") return "status-approved";
  return "status-warning";
}

function punchStatus(punch) {
  const assignment = activeAssignmentForWorker(punch.workerId);
  if (punch.type !== "Clock In" || !assignment) {
    return "Saved";
  }

  const scheduled = parseTimestampOnSameDay(punch.timestamp, assignment.shiftStart);
  const minutesLate = Math.round((new Date(punch.timestamp) - scheduled) / 60000);
  return minutesLate > 5 ? "Late" : "Saved";
}

function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const agencyId = params.get("agency");
  const clientId = params.get("client");
  const workerId = params.get("worker");
  const siteId = params.get("site");
  const view = params.get("view");
  const role = params.get("role");

  if (role && ROLE_LABELS[role]) {
    state.currentRole = role;
  }

  if (agencyId && state.agencies.some(record => record.id === agencyId)) {
    state.currentAgencyId = agencyId;
  }

  if (clientId && state.clients.some(record => record.id === clientId)) {
    state.currentClientId = clientId;
  }

  if (workerId && state.workers.some(record => record.id === workerId)) {
    state.currentWorkerId = workerId;
  }

  if (siteId && state.sites.some(record => record.id === siteId)) {
    state.punchSiteId = siteId;
  }

  if (view && NAV_ITEMS.some(item => item.id === view)) {
    state.currentView = view;
  }

  saveState();
}

function toggleMobileMenu() {
  document.body.classList.toggle("sidebar-open");
}

function closeMobileMenu() {
  document.body.classList.remove("sidebar-open");
}

function copyText(value, message) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value)
      .then(() => toast(message))
      .catch(() => toast("Copy failed. You can copy the link manually."));
    return;
  }

  toast("Copy failed. You can copy the link manually.");
}

function toCsv(rows) {
  const keys = Object.keys(rows[0]);
  return [
    keys.join(","),
    ...rows.map(row => keys.map(key => JSON.stringify(row[key] ?? "")).join(","))
  ].join("\n");
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.classList.remove("show");
  }, 2400);
}

function emptyState(message) {
  return `<div class="empty-state">${safe(message)}</div>`;
}

function statusBadge(label, className) {
  return `<span class="status-badge ${className}">${safe(label)}</span>`;
}

function fullWorkerName(workerId) {
  const worker = state.workers.find(record => record.id === workerId);
  return worker ? `${worker.firstName} ${worker.lastName}` : "Unknown Worker";
}

function countLabel(count, singular) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatHours(value) {
  return Number(value || 0).toFixed(2);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDate(isoDate) {
  return parseISODate(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseISODate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = next.getDay();
  const shift = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + shift);
  return next;
}

function makeTimestamp(dayOffset, time) {
  const base = addDays(new Date(), dayOffset);
  const [hours, minutes] = String(time).split(":").map(Number);
  const local = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0, 0);
  return local.toISOString();
}

function parseTimestampOnSameDay(timestamp, time) {
  const date = new Date(timestamp);
  const [hours, minutes] = String(time).split(":").map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function safe(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function initials(value, maxLength) {
  const parts = String(value || "")
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "PT";
  return parts.map(part => part[0]).join("").slice(0, maxLength || 2).toUpperCase();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildAgencyCode(name, index) {
  const initialsValue = initials(name, 3) || "AGY";
  return `${initialsValue}-${String(1200 + index).padStart(4, "0")}`;
}

function uid(prefix) {
  const fallback = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const base = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : fallback;
  return `${prefix}_${base.slice(0, 12)}`;
}

function hexToRgb(hex) {
  const normalized = String(hex || "#1f6fff").replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map(char => char + char).join("")
    : normalized;

  const int = parseInt(full, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function isTodayTimestamp(timestamp) {
  return toISODate(new Date(timestamp)) === toISODate(new Date());
}
