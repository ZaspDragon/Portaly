# TempTrack Pro — QR TimeClock & Agency Portal

> Multi-tenant staffing portal with QR timeclock, role-based access, timesheet approval workflows, payroll margin tracking, and CSV export. Built for temp agencies.

[![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://zaspdragon.github.io/Portaly/)

## Features

| Module | What it does |
|---|---|
| **Multi-Role Access** | Super Admin, Agency Admin, Client Manager, Worker — each sees only what they should |
| **Multi-Tenant Agencies** | Each agency gets a unique number; all data stays scoped to that agency |
| **QR Timeclock** | Workers punch Clock In / Start Lunch / End Lunch / Clock Out from any device |
| **Workers & Assignments** | Add workers, assign them to clients and sites with pay rate, bill rate, and shift times |
| **Timesheet Approval** | Client Manager approves → Agency Admin finalizes. Workers view only. Full audit trail |
| **Dispute Workflow** | Client or super admin can dispute timesheets with reasons; status resets for review |
| **Payroll & Margin Report** | KPI cards for total hours, worker pay, client billing, and gross margin |
| **CSV Export** | One-click payroll CSV export with pay/bill/margin per worker |
| **Job Sites & QR Links** | Create sites, generate QR timeclock URLs scoped to agency + site |
| **Mobile Responsive** | Hamburger sidebar on phones, full touch support, scrollable tables |

## Demo Roles

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@temptrackpro.com` | `admin123` |
| Agency Admin | `agency@temptrackpro.com` | `agency123` |
| Client Manager | `client@temptrackpro.com` | `client123` |
| Worker | `worker@temptrackpro.com` | `worker123` |

## Tech Stack

- **Zero dependencies** — pure HTML, CSS, and vanilla JavaScript
- **Google Fonts** — Inter typeface for clean typography
- **localStorage** — all data persists in the browser; "Reset Demo Data" restores defaults
- **GitHub Pages** — static deploy, no server required

## Getting Started

```bash
git clone https://github.com/ZaspDragon/Portaly.git
cd Portaly
# Open index.html in any browser — no build step needed
```

Or visit the live demo at [zaspdragon.github.io/Portaly](https://zaspdragon.github.io/Portaly/).

## File Structure

```
Portaly/
├── index.html     # App shell — sidebar, role/agency/client selectors, view container, toast
├── style.css      # Design system — variables, layout, cards, KPIs, timeclock, badges, mobile, print
├── app.js         # Application logic — state, multi-role rendering, CRUD, approval workflow, CSV export
└── README.md
```

## License

MIT
