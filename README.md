# TempTrack Pro

A GitHub Pages-ready demo web app for a multi-tenant temp agency portal.

## What is included

- Multi-agency demo portal
- Unique agency numbers like `TA-1001`
- Role-based demo views:
  - Super Admin
  - Agency Admin
  - Client Manager
  - Worker
- Clients
- Job sites
- QR-style site links
- Workers
- Assignments
- QR timeclock
- Punch records
- Weekly timesheets
- Client approval flow
- Payroll CSV export
- Pay rate, bill rate, and margin reporting

## How to run locally

Open `index.html` in your browser.

## How to deploy to GitHub Pages

1. Create a new GitHub repo named `temptrack-pro`.
2. Upload these files:
   - `index.html`
   - `style.css`
   - `app.js`
   - `README.md`
3. Go to repo Settings.
4. Go to Pages.
5. Set source to `main` branch and root folder.
6. Save.
7. Your app will publish as:

`https://YOURUSERNAME.github.io/temptrack-pro/`

## Important

This version uses `localStorage` so it works on GitHub Pages with no backend.

For a real SaaS version, connect the app to Supabase and replace localStorage with:

- Supabase Auth
- PostgreSQL tables
- Row Level Security
- Stripe subscriptions
- Storage for punch photos

## Suggested Supabase Tables

- agencies
- users
- clients
- job_sites
- workers
- assignments
- punches
- timesheets
- invoices
- subscriptions

## Recommended next upgrade

Move this from GitHub Pages to a full stack deployment:

- Frontend: React / Next.js
- Backend: Supabase
- Auth: Supabase Auth
- Payments: Stripe
- Hosting: Vercel
