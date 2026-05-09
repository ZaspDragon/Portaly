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
      squarePaymentLink: "PASTE_STARTER_SQUARE_PAYMENT_LINK_HERE"
    },
    agency: {
      id: "agency",
      name: "Agency",
      price: 249,
      label: "$249/month",
      workerLimit: 100,
      siteLimit: 5,
      squarePaymentLink: "PASTE_AGENCY_SQUARE_PAYMENT_LINK_HERE"
    },
    growth: {
      id: "growth",
      name: "Growth",
      price: 499,
      label: "$499/month",
      workerLimit: null,
      siteLimit: null,
      squarePaymentLink: "PASTE_GROWTH_SQUARE_PAYMENT_LINK_HERE"
    }
  }
};
