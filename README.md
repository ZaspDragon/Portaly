# Portaly

Portaly is a staffing-agency SaaS demo that runs as a static GitHub Pages frontend while supporting:

- a public marketing site
- open demo access with local sample data
- Firebase Authentication for real users
- Firestore cloud data for real agencies
- Stripe-ready subscription billing through Firebase Functions

The frontend stays plain `HTML`, `CSS`, and `JavaScript`. No npm or frontend build step is required.

## Files

- `index.html`
- `style.css`
- `app.js`
- `firebase-config.js`
- `firestore.rules`
- `functions/index.js`

## Architecture

### Public site

The public site includes:

- Landing page
- Pricing
- Demo Access
- Login
- Start Free Trial
- Forgot Password
- Billing Required
- Trial Expired

### Demo Mode

Demo Mode stays open to everyone.

- no Firebase login required
- sample staffing data only
- changes save to `localStorage`
- reset demo button included
- never writes demo data to Firestore
- never opens real Stripe checkout

### Cloud Mode

Cloud Mode is for real staffing agencies.

- real users authenticate with Firebase Authentication
- agency data saves to Firestore
- role-based routing is enforced in the UI
- Stripe billing actions go through Firebase Functions

## Firebase frontend setup

Portaly uses browser CDN module imports in `index.html`.

It does **not** use bundler-style imports such as:

```js
import { initializeApp } from "firebase/app";
```

Instead, `index.html` loads Firebase directly from Google’s browser module URLs and exposes a `window.PortalyFirebase` bridge before `app.js` runs.

### Firebase modules loaded

- `firebase-app.js`
- `firebase-auth.js`
- `firebase-firestore.js`
- `firebase-analytics.js`

### Window bridge

`index.html` exposes:

- `window.PortalyFirebase`
- `window.dispatchEvent(new Event("portaly-firebase-ready"))`

The bridge includes:

- app/auth/db handles
- auth helpers
- Firestore helpers
- imported Firebase functions for browser use

## Firebase project config

The frontend config is already placed in `firebase-config.js` for:

- `projectId: portaly-d6617`

If you need to change environments, update `firebase-config.js`.

Current config fields in that file:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `measurementId`
- `functionsBaseUrl`
- `stripePublishableKey`
- `stripePriceIds`

## Firebase console steps

### 1. Create or open the Firebase project

1. Open Firebase Console.
2. Open project `portaly-d6617` or create your own.
3. Add a Web App if needed.

### 2. Enable Authentication

1. Open `Authentication`.
2. Click `Get started`.
3. Enable `Email/Password`.

### 3. Enable Firestore

1. Open `Firestore Database`.
2. Create the database.
3. Choose your preferred region.
4. Deploy the rules from `firestore.rules`.

### 4. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

## Firestore collections

Portaly uses these collections:

- `agencies`
- `users`
- `clients`
- `sites`
- `workers`
- `assignments`
- `punches`
- `timesheets`
- `approvals`
- `payrollRuns`
- `subscriptions`
- `auditLogs`
- `settings`

## Role model

Portaly routes users by role:

- `platformOwner`
- `agencyOwner`
- `agencyAdmin`
- `clientManager`
- `worker`

### Route behavior

- `platformOwner` -> platform dashboard
- `agencyOwner` -> owner dashboard
- `agencyAdmin` -> agency operations dashboard
- `clientManager` -> approvals only
- `worker` -> worker punch screen

## Firestore rules behavior

`firestore.rules` is set up to enforce:

- real agency data requires Firebase Authentication
- demo users do not write to Firestore
- platform owners can access all agencies
- agency owners and agency admins are scoped to their agency
- client managers are limited to assigned client and site approval data
- workers are limited to their own worker and punch data
- audit logs can be created, but not edited or deleted
- unmatched access is denied by default

### Practical note on field-level security

Firestore rules cannot hide individual fields inside a document.

That means if you want client-visible or worker-visible documents to exclude sensitive fields like pay rate or bill rate, the safest long-term pattern is:

- keep sensitive payroll and margin data in owner/admin-only collections
- duplicate only approval-safe display fields into client-facing records

The current app follows that direction in the UI and collection access patterns.

## Trial signup flow

The Start Free Trial form does this:

1. Creates a Firebase Auth user
2. Creates `agencies/{agencyId}`
3. Creates `users/{uid}`
4. Creates `settings/{settingId}`
5. Creates `subscriptions/{subscriptionId}`
6. Sets:
   - `subscriptionStatus = trialing`
   - `trialStart = now`
   - `trialEnd = 14 days later`
7. Optionally loads sample onboarding data into Firestore

## Stripe setup

Stripe must run through backend code only.

Do **not** place these in frontend files:

- Stripe secret key
- Stripe webhook secret
- Firebase Admin credentials

### 1. Create Stripe products and prices

Create recurring monthly prices for:

- Starter - `$99/month`
- Agency - `$249/month`
- Growth - `$499/month`

Enterprise can remain manual.

### 2. Add Stripe price IDs

Update:

- `firebase-config.js`
- `app.js` plan objects if you want named placeholders or internal references

Populate the frontend config placeholders:

- `stripePriceIds.starter`
- `stripePriceIds.agency`
- `stripePriceIds.growth`

### 3. Add the Stripe publishable key

Put the publishable key in `firebase-config.js`.

### 4. Add Stripe secrets to Firebase Functions

Set these secret values:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

### 5. Configure function params

The sample backend expects these params:

- `APP_URL`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_AGENCY`
- `STRIPE_PRICE_GROWTH`

Set them in your Firebase Functions v2 deployment flow.

### 6. Stripe webhook endpoint

After deploying functions, add this webhook endpoint in Stripe:

`https://us-central1-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`

Recommended webhook events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid`

## Firebase Functions backend

The sample backend in `functions/index.js` includes:

- `createCheckoutSession`
- `createBillingPortalSession`
- `stripeWebhook`

It also keeps subscription records synced into:

- `agencies`
- `subscriptions`

### Functions dependencies

Inside the `functions/` folder:

```bash
npm install firebase-admin firebase-functions stripe
```

### Deploy functions

```bash
firebase deploy --only functions
```

## GitHub Pages deployment

### Frontend deploy steps

1. Commit:
   - `index.html`
   - `style.css`
   - `app.js`
   - `firebase-config.js`
2. Push to GitHub.
3. Enable GitHub Pages.
4. Use the repository root as the published source if desired.
5. Open the Pages URL and test:
   - landing page
   - demo mode
   - login
   - worker route

## What to test

### Demo checks

- Demo logins work without Firebase login
- Reset Demo Data restores sample data
- Demo edits stay local to the browser
- Demo never opens real Stripe checkout

### Cloud checks

- Real signup creates Firebase Auth user
- Real signup creates Firestore agency and owner profile
- Trial signup creates a subscription record
- Real login routes by role
- Worker login opens the punch page
- Client manager does not see billing or margin pages
- Demo data never writes to Firestore
- Cloud records save to Firestore

### Billing checks

- Billing page loads for agency owner
- Manage Billing button calls the backend endpoint
- Checkout button calls the backend endpoint
- Billing lock prevents owner/admin operations when subscription is not current

## Notes

- The frontend is GitHub Pages compatible.
- Demo Mode and Cloud Mode are intentionally separate.
- The app stays usable without Stripe configured because demo access remains open.
- Real billing starts only after backend secrets and webhook handling are deployed.
