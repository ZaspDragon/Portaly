/*
  Portaly Firebase Cloud Configuration
  Frontend-safe configuration only.

  NEVER place:
  - Firebase Admin SDK credentials
  - Square access tokens
  - Webhook secrets
  - Service account JSON
  in this file.
*/

window.PORTALY_FIREBASE_CONFIG = {
  enabled: true,

  // App
  appName: "Portaly",
  appUrl: "https://zaspdragon.github.io/Portaly/",

  // Trial Settings
  trialDays: 14,

  // Billing
  billingProvider: "square",

  // Firebase Functions
  // Leave blank for now until backend is deployed.
  // Example later:
  // "https://us-central1-portaly-d6617.cloudfunctions.net"
  functionsBaseUrl: "functionsBaseUrl: "https://us-central1-portaly-d6617.cloudfunctions.net",",

  // Firebase Web SDK Config
  apiKey: "AIzaSyDfF4mmLeI4IbOl3TsWJnCfMg_nsSfqTp0",
  authDomain: "portaly-d6617.firebaseapp.com",
  projectId: "portaly-d6617",
  storageBucket: "portaly-d6617.firebasestorage.app",
  messagingSenderId: "594971277057",
  appId: "1:594971277057:web:8a0f6c29370d741a45cd00",
  measurementId: "G-L8EHWRS2BZ",

  // Public App Settings
  features: {
    cloudMode: true,
    billing: true,
    qrPunches: true,
    approvals: true,
    payroll: true,
    clientInvites: true,
    workerSelfService: true,
    demoMode: true
  },

  // Invite Settings
  inviteConfig: {
    allowFrontendInviteLinks: true,
    inviteExpiryDays: 14,
    requireBackendForEmailSending: false
  },

  // UI Defaults
  ui: {
    defaultTheme: "light",
    primaryColor: "#1f6fff",
    companyName: "QR Legends"
  }
};
