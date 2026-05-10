/*
  Portaly frontend cloud configuration

  Safe for the browser:
  - Firebase web app config
  - Public app URL
  - Public backend URL placeholder

  Never place Square access tokens, webhook secrets, Stripe secret keys,
  Firebase Admin credentials, or private server keys here.
*/

window.PORTALY_FIREBASE_CONFIG = {
  enabled: true,
  trialDays: 14,
  appUrl: "https://zaspdragon.github.io/Portaly/",
  functionsBaseUrl: "",
  billingProvider: "square",

  apiKey: "AIzaSyDfF4mmLeI4IbOl3TsWJnCfMg_nsSfqTp0",
  authDomain: "portaly-d6617.firebaseapp.com",
  projectId: "portaly-d6617",
  storageBucket: "portaly-d6617.firebasestorage.app",
  messagingSenderId: "594971277057",
  appId: "1:594971277057:web:8a0f6c29370d741a45cd00",
  measurementId: "G-L8EHWRS2BZ"
};
