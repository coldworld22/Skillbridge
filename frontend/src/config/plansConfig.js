// config/plansConfig.js

const plansConfig = {
    basic: {
      maxAds: 1,
      maxAdDuration: 3, // days
      placements: ["dashboard"],
      allowBranding: false,
      showAnalytics: false
    },
    regular: {
      maxAds: 3,
      maxAdDuration: 7,
      placements: ["dashboard", "homepage"],
      allowBranding: true,
      showAnalytics: true
    },
    prime: {
      maxAds: 10,
      maxAdDuration: 30,
      placements: ["dashboard", "homepage", "email", "sidebar"],
      allowBranding: true,
      showAnalytics: true
    }
  };
  
  export default plansConfig;