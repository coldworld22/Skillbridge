// utils/plans/config.js

export const initialPlanConfig = {
  categories: {
    onlineClasses: {
      label: "Online Classes",
      rules: ["canJoin", "canCreate"]
    },
    tutorials: {
      label: "Tutorials",
      rules: ["canViewPremium", "canDownload"]
    },
    community: {
      label: "Community",
      rules: ["canPost", "canReply"]
    }
  },
  plans: {
    Basic: {
      canJoin: { onlineClasses: false },
      canCreate: { onlineClasses: false },
      canViewPremium: { tutorials: false },
      canDownload: { tutorials: false },
      canPost: { community: false },
      canReply: { community: false }
    },
    Regular: {
      canJoin: { onlineClasses: true },
      canCreate: { onlineClasses: false },
      canViewPremium: { tutorials: true },
      canDownload: { tutorials: false },
      canPost: { community: true },
      canReply: { community: true }
    },
    Premium: {
      canJoin: { onlineClasses: true },
      canCreate: { onlineClasses: true },
      canViewPremium: { tutorials: true },
      canDownload: { tutorials: true },
      canPost: { community: true },
      canReply: { community: true }
    }
  }
};
