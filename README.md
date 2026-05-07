# Portaly — QR TimeClock & Agency Portal

Portaly is a multi-role staffing agency portal that combines QR timeclock capture, client approvals, worker management, assignment tracking, payroll export, and gross-margin visibility in one static app.

It is built with plain HTML, CSS, and JavaScript so it can deploy straight to GitHub Pages with no build step.

[Live Demo](https://zaspdragon.github.io/Portaly/)

## Product positioning

Portaly is designed to feel like a sellable agency operating system, not just a demo page.

## Core capabilities

| Module | What it does |
|---|---|
| Multi-Role Access | Super Admin, Agency Admin, Client Manager, Worker — each sees only what they should |
| Multi-Tenant Agencies | Each agency gets a unique number; all data stays scoped to that agency |
| QR Timeclock | Workers punch Clock In / Start Lunch / End Lunch / Clock Out from any device |
| Workers & Assignments | Add workers, assign them to clients and sites with pay rate, bill rate, and shift times |
| Timesheet Approval | Client Manager approves, then Agency Admin finalizes |
| Dispute Workflow | Client or admin can dispute timesheets with reasons |
| Payroll & Margin Report | KPI cards for hours, worker pay, client billing, and gross margin |
| CSV Export | One-click payroll CSV export with pay, bill, and margin per worker |
| Job Sites & QR Links | Create sites and generate QR timeclock URLs scoped to agency and site |
| Mobile Responsive | Works on phones, tablets, and desktop |

## Demo Roles

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@temptrackpro.com` | `admin123` |
| Agency Admin | `agency@temptrackpro.com` | `agency123` |
| Client Manager | `client@temptrackpro.com` | `client123` |
| Worker | `worker@temptrackpro.com` | `worker123` |

## Tech Stack

- `index.html` — app shell and layout
- `style.css` — visual system and responsive UI
- `app.js` — state, demo data, CRUD logic, approval workflow, and CSV export
- `localStorage` — browser-based demo persistence
- GitHub Pages — static hosting

## Getting Started

```bash
git clone https://github.com/ZaspDragon/Portaly.git
cd Portaly
# Open index.html in any browser
