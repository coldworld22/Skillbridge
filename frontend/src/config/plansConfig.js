// config/plansConfig.js

const plansConfig = {
    basic: {
      maxAds: 1,
      maxAdDuration: 3, // days
      adCredits: 1,
      placements: ["dashboard"],
      allowBranding: false,
      showAnalytics: false
    },
    regular: {
      maxAds: 3,
      maxAdDuration: 7,
      adCredits: 3,
      placements: ["dashboard", "homepage"],
      allowBranding: false,
      showAnalytics: true
    },
    prime: {
      maxAds: 10,
      maxAdDuration: 30,
      adCredits: 10,
      placements: ["dashboard", "homepage", "email", "sidebar"],
      allowBranding: true,
      showAnalytics: true
    }
  };
  
  export default plansConfig;
