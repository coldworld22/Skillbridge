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
    },
    instructor: {
      label: "Instructor",
      rules: ["maxCourses", "adCredits"]
    }
  },
  plans: {
    Basic: {
      canJoin: { onlineClasses: false },
      canCreate: { onlineClasses: false },
      canViewPremium: { tutorials: false },
      canDownload: { tutorials: false },
      canPost: { community: false },
      canReply: { community: false },
      maxCourses: { instructor: 1 },
      adCredits: { instructor: 0 }
    },
    Regular: {
      canJoin: { onlineClasses: true },
      canCreate: { onlineClasses: false },
      canViewPremium: { tutorials: true },
      canDownload: { tutorials: false },
      canPost: { community: true },
      canReply: { community: true },
      maxCourses: { instructor: 5 },
      adCredits: { instructor: 100 }
    },
    Prime: {
      canJoin: { onlineClasses: true },
      canCreate: { onlineClasses: true },
      canViewPremium: { tutorials: true },
      canDownload: { tutorials: true },
      canPost: { community: true },
      canReply: { community: true },
      maxCourses: { instructor: 20 },
      adCredits: { instructor: 1000 }
    }
  }
};
