# Portaly

Portaly is a multi-role staffing agency portal that combines QR timeclock capture, client approvals, worker management, assignment tracking, payroll export, and gross-margin visibility in one static app.

It is built with plain HTML, CSS, and JavaScript so it can deploy straight to GitHub Pages with no build step.

## Live demo

[https://zaspdragon.github.io/Portaly/](https://zaspdragon.github.io/Portaly/)

## Product positioning

Portaly is designed to feel like a sellable agency operating system, not just a demo page. The experience is structured around the main staffing workflows:

- Worker punch capture from a simple QR-ready timeclock
- Client-side approval and dispute handling
- Agency-side assignment, payroll, and margin visibility
- Platform-owner control over agencies, plans, and tenants

## Core capabilities

### Role-based access
- Platform owner access for agency, tenant, and plan oversight
- Agency ops access for workers, clients, assignments, payroll, and exports
- Client approver access for reviewing assigned labor hours
- Worker access for punching and viewing weekly hours

### Operating modules
- Multi-tenant agency records with unique agency numbers
- Client and site management with QR-ready job-site links
- Worker onboarding with agency-linked worker IDs
- Assignment tracking with pay rate, bill rate, and spread visibility
- QR timeclock workflow for clock in, lunch, and clock out events
- Timesheet approval flow from pending to final approved
- Audit history for approvals and disputes
- Payroll and margin reporting with CSV export

## Tech stack

- `index.html` - app shell and layout
- `style.css` - visual system and responsive UI
- `app.js` - state, demo data, CRUD logic, and portal behavior

## Deploy

1. Push the repo to GitHub.
2. Enable GitHub Pages from the repository root on the main branch.
3. Visit the published Pages URL.

## Notes

- Demo data is stored in browser `localStorage`.
- Use `Reset Demo Data` to restore the seeded records.
- GitHub Pages gives the app HTTPS, which is helpful for browser APIs tied to secure contexts.
