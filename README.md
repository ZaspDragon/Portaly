# Portaly — TempTrack Pro

A multi-role QR TimeClock and staffing agency portal — built with vanilla HTML, CSS, and JavaScript. Deployable on GitHub Pages with zero build step.

## Live Demo

[https://zaspdragon.github.io/Portaly/](https://zaspdragon.github.io/Portaly/)

## Features

### Role-Based Access
- **Super Admin** — Manage agencies, tenants, plans, and override approvals
- **Agency Admin** — Manage workers, assignments, clients, sites, timesheets, and payroll export
- **Client Manager** — Approve or dispute worker timesheets for assigned locations
- **Worker** — Clock in/out, start/end lunch, and view weekly hours

### Core Modules
- **Multi-Tenant Agencies** — Each agency gets a unique number (TA-1001, TA-1002, etc.) with isolated data
- **Client & Site Management** — Add clients, create job sites with site codes
- **Worker Management** — Auto-generated worker IDs inheriting agency number (TA-1001-W0001)
- **Assignments** — Link workers to clients, sites, shifts, pay rates, and bill rates with margin tracking
- **QR Timeclock** — Clock In / Start Lunch / End Lunch / Clock Out with live punch feed
- **Timesheet Approval** — Multi-stage workflow: Pending → Client Approved → Final Approved (or Disputed)
- **Audit Trail** — Full history of approval/dispute actions with actor, role, and timestamp
- **Payroll & Margin Report** — Hours, pay estimates, billing estimates, and gross margin by worker
- **CSV Export** — Download payroll data as CSV for external processing
- **QR Site Links** — URL parameters (`?agency=TA-1001&site=CHD-OH-001`) route workers directly to their site timeclock

### Demo Sign-In
Each role has a pre-filled demo login card with credentials. Click *Reset Demo Data* to restore seed data.

### Mobile Responsive
- Slide-out sidebar with hamburger menu on mobile
- Touch-friendly punch buttons and navigation
- Responsive tables with horizontal scroll

## Files

- `index.html` — App shell with sidebar, role selectors, and view container
- `app.js` — Full application logic, state management, CRUD, and localStorage persistence
- `style.css` — Responsive styling with sidebar layout, mobile breakpoints, and timeclock UI

## How to Deploy

1. Create a new GitHub repository
2. Upload all files to the root
3. In repo Settings → Pages, deploy from `main` branch root
4. Visit `https://<username>.github.io/<repo-name>/`

## Usage Notes

- Browser location/HTTPS is required for GPS features (GitHub Pages provides HTTPS)
- After first deploy, click **Reset Demo Data** once to initialize seed data
- Demo credentials are pre-filled on each sign-in card
