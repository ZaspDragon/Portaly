// billing-config.js
// Frontend-safe Square billing config.
// Do NOT put Square Access Tokens or webhook secrets in this file.

window.PORTALY_BILLING_CONFIG = {
  provider: "square",
  environment: "sandbox",

  appUrl: "https://zaspdragon.github.io/Portaly/",

  // This is safe for frontend use.
  squareApplicationId: "sandbox-sq0idb-gGTHXygVt5FwfcJXSeY69A",

  // Get this from Square Developer Dashboard → Locations.
  squareLocationId: "L4QVEFPMEY582",

  // Later this will be your Firebase Functions URL.
  functionsBaseUrl: "",

  plans: {
    starter: {
      id: "starter",
      name: "Starter",
      price: 99,
      label: "$99/month",
      workerLimit: 25,
      siteLimit: 1,
      squarePaymentLink: "https://square.link/u/mfu6eun7"
    },

    agency: {
      id: "agency",
      name: "Agency",
      price: 249,
      label: "$249/month",
      workerLimit: 100,
      siteLimit: 5,
      squarePaymentLink: "https://square.link/u/ojz2a1Au"
    },

    growth: {
      id: "growth",
      name: "Growth",
      price: 499,
      label: "$499/month",
      workerLimit: null,
      siteLimit: null,
      squarePaymentLink: "https://square.link/u/Iy99LyYg"
    },

    enterprise: {
      id: "enterprise",
      name: "Enterprise",
      price: null,
      label: "Custom",
      workerLimit: null,
      siteLimit: null,
      squarePaymentLink: "https://square.link/u/96br6x5W"
    }
  }
};
