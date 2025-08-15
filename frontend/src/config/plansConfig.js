// config/plansConfig.js

const plansConfig = {
    basic: {
      maxAds: 1,
      maxAdDuration: 3, // days
      placements: ["dashboard"],
      allowBranding: false,
      showAnalytics: false,
      booksPurchaseLimit: 5,
      booksPublishLimit: 0
    },
    regular: {
      maxAds: 3,
      maxAdDuration: 7,
      placements: ["dashboard", "homepage"],
      allowBranding: false,
      showAnalytics: true,
      booksPurchaseLimit: 20,
      booksPublishLimit: 10
    },
    prime: {
      maxAds: 10,
      maxAdDuration: 30,
      placements: ["dashboard", "homepage", "email", "sidebar"],
      allowBranding: true,
      showAnalytics: true,
      booksPurchaseLimit: Infinity,
      booksPublishLimit: Infinity
    }
  };
  
  export default plansConfig;
