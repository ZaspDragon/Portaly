# Portaly

Portaly is a staffing-agency SaaS app that runs as a static GitHub Pages frontend with:

- a public marketing site
- open Demo Mode with local sample data
- Firebase Authentication for real logins
- Firestore for cloud agency data
- Square payment links today
- Square-ready Firebase Functions for future subscription automation

The frontend stays plain `HTML`, `CSS`, and `JavaScript`. No npm or frontend build step is required.

## Files

- `index.html`
- `style.css`
- `app.js`
- `firebase-config.js`
- `billing-config.js`
- `firestore.rules`
- `functions/index.js`
- `functions/package.json`

## Product modes

### Public site

Routes:

- `#/landing`
- `#/pricing`
- `#/demo`
- `#/login`
- `#/trial`
- `#/complete-profile`
- `#/trial-success`
- `#/forgot-password`
- `#/billing-required`
- `#/trial-expired`

### Demo Mode

- no Firebase login required
- sample staffing data only
- saves to `localStorage`
- reset demo button included
- never writes demo data to Firestore
- never changes real Square billing

### Cloud Mode

- real users authenticate with Firebase Authentication
- agency data saves to Firestore
- role-based routing is enforced in the UI
- new trial workspaces start empty unless `Load sample data` is checked

## Firebase setup

### 1. Create or open a Firebase project

1. Open the Firebase Console.
2. Create a project or open your existing project.
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

### 4. Add frontend Firebase config

Update `firebase-config.js` with your Firebase web config.

Current frontend config uses:

- `enabled`
- `trialDays`
- `appUrl`
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `measurementId`
- `functionsBaseUrl`

Portaly now points invite emails to:

```js
functionsBaseUrl: "https://us-central1-portaly-d6617.cloudfunctions.net"
```

### 5. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

## Firestore collections

Portaly uses:

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

- `platformOwner`
- `agencyOwner`
- `agencyAdmin`
- `clientManager`
- `worker`

### Route behavior

- `platformOwner` -> platform dashboard
- `agencyOwner` -> owner dashboard
- `agencyAdmin` -> operations dashboard
- `clientManager` -> approvals only
- `worker` -> worker punch screen

## Trial signup flow

The `#/trial` form:

1. Creates a Firebase Auth user with email and password.
2. Creates:
   - `agencies/{agencyId}`
   - `users/{uid}`
   - `settings/{settingId}`
   - `subscriptions/{subscriptionId}`
3. Sets:
   - `role = agencyOwner`
   - `subscriptionStatus = trialing`
   - `billingProvider = square`
   - `trialStart = now`
   - `trialEnd = 14 days later`
4. Starts the workspace empty by default.
5. Only loads sample data if `Load sample data` is checked.

If a Firebase Auth account exists but `users/{uid}` is missing, Portaly routes the user to `#/complete-profile` so they can finish creating the agency workspace.

## Sample data safety

Demo data stays separate from real agency data.

- Demo Mode uses only `localStorage`
- Cloud Mode uses Firestore
- `Delete Sample Data` removes only sample-style operational records for the current agency
- it does **not** delete:
  - `agencies`
  - `users`
  - `settings`
  - `subscriptions`

## Firestore rules behavior

`firestore.rules` is set up to enforce:

- real agency data requires Firebase Authentication
- the first signed-in owner can create initial onboarding records
- platform owners can access all agencies
- agency owners and agency admins are scoped to their agency
- client managers are limited to assigned client and site approval data
- workers are limited to their own worker and punch data
- audit logs can be created, but not edited or deleted

## Square billing

Portaly uses worker-based billing with Square-ready payment links and metrics:

- Starter: `$49/month`, includes 10 active workers, then `$4/month` per additional active worker
- Growth: `$249/month`, includes 50 active workers, then `$3/month` per additional active worker
- Enterprise: custom pricing

The frontend never stores:

- Square access tokens
- Square webhook secrets
- Firebase Admin credentials

### Frontend billing config

`billing-config.js` includes:

- `provider`
- `functionsBaseUrl`
- `starterPaymentLink`
- `growthPaymentLink`
- `enterprisePaymentLink`

If `functionsBaseUrl` is blank, Portaly stores worker billing metrics directly in Firestore from the Billing page and shows professional placeholders for pause, resume, cancel, refresh, payment history, and payment method actions.

## Firebase Functions v2

Portaly uses Firebase Functions v2 with CommonJS in `functions/index.js`.

Current functions include:

- `sendClientManagerInviteEmail`
- `createClientManagerInvite`
- `verifyClientManagerInvite`
- `acceptClientManagerInvite`
- `createSquareSubscriptionLink`
- `cancelSquareSubscription`
- `pauseSquareSubscription`
- `resumeSquareSubscription`
- `swapSquareSubscriptionPlan`
- `getSquareSubscriptionStatus`
- `syncSquareSubscriptionToFirestore`
- `syncWorkerBillingMetrics`
- `updateSquarePaymentMethod`
- `squareWebhook`

### Create or reuse the Functions workspace

If you have not initialized functions in this Firebase project yet:

```bash
firebase login
firebase init functions
```

Choose:

- JavaScript
- Node.js 20
- do not overwrite your existing Portaly frontend files

### Install backend dependencies

Inside `functions/`:

```bash
npm install
```

This installs:

- `firebase-admin`
- `firebase-functions`
- `resend`

### Set Firebase Functions secrets and params

Set the required Square secrets:

```bash
firebase functions:secrets:set SQUARE_ACCESS_TOKEN
firebase functions:secrets:set SQUARE_WEBHOOK_SIGNATURE_KEY
```

Set the Resend secret used for automatic client manager invite emails:

```bash
firebase functions:secrets:set RESEND_API_KEY
```

Optional params you can customize later for Portaly email and Square behavior:

- `APP_URL`
- `INVITE_EMAIL_FROM`
- `INVITE_EMAIL_REPLY_TO`
- `SQUARE_API_BASE_URL`
- `SQUARE_API_VERSION`
- `SQUARE_PLAN_VARIATION_STARTER`
- `SQUARE_PLAN_VARIATION_GROWTH`
- `SQUARE_PAYMENT_LINK_STARTER`
- `SQUARE_PAYMENT_LINK_GROWTH`
- `SQUARE_PAYMENT_LINK_ENTERPRISE`

Legacy `agency` plan IDs and Square variation IDs are treated as Growth for backwards compatibility.

Defaults already included in `functions/index.js`:

- `APP_URL`
- `INVITE_EMAIL_FROM = Portaly <onboarding@resend.dev>`
- `INVITE_EMAIL_REPLY_TO = ""`

### Deploy functions

```bash
firebase deploy --only functions
```

### What `sendClientManagerInviteEmail` does

- verifies the Firebase Bearer token
- confirms the caller is `agencyOwner`, `agencyAdmin`, or `platformOwner`
- loads `clientInvites/{inviteToken}` for the current agency
- sends the invite email through Resend
- updates Firestore with:
  - `emailSentAt`
  - `emailSentBy`
  - `emailStatus: "sent"`

### Future Square automation

The app is prepared for:

- subscription cancel
- pause and resume
- plan swap
- subscription status sync
- webhook-driven Firestore updates

Recommended Square webhook events to monitor next:

- `payment.updated`
- `subscription.created`
- `subscription.updated`
- `invoice.payment_made`

## GitHub Pages deploy

1. Commit:
   - `index.html`
   - `style.css`
   - `app.js`
   - `firebase-config.js`
   - `billing-config.js`
2. Push to GitHub.
3. Enable GitHub Pages.
4. Publish from the repository root or your chosen Pages source.
5. Test the live site from the GitHub Pages URL, not only `file://`.

## What to test

### Public and demo

- landing page loads
- Demo Mode opens without Firebase login
- demo edits stay local to the browser
- reset demo restores sample data

### Cloud auth and onboarding

- new trial signup creates Firebase Auth user
- `users/{uid}` is created automatically
- `agencies/{agencyId}` is created automatically
- `settings/{settingId}` is created automatically
- `subscriptions/{subscriptionId}` is created automatically
- password reset works
- login works after password reset
- missing profile routes to `#/complete-profile`
- complete profile creates the missing workspace

### Operations

- agency owner can add client, site, and worker
- client notes save and display
- client manager only sees assigned approvals
- client manager can correct time with a reason
- client manager can approve and sign
- approved timecards lock after signature
- delete sample data clears operational sample records only

### Billing

- Billing page loads
- Square plan and status display correctly
- direct Square checkout links work
- placeholder self-service actions do not break if backend is not connected
- backend functions work once `functionsBaseUrl` and Firebase Functions are deployed

### Client manager invites

- create a client manager invite from Clients or Users
- invite link copies successfully
- `Send Invite Email` works after Functions + Resend are deployed
- invite opens `#/accept-invite/{token}`
- invite status remains `pending` until accepted

## Notes

- The frontend is GitHub Pages compatible.
- Demo Mode and Cloud Mode are intentionally separate.
- The app can run without the Square backend because checkout links still work.
- Full subscription self-service becomes active after the secure backend is deployed.
