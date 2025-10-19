import {
  FaBookOpen,
  FaUsers,
  FaBullhorn,
  FaChalkboardTeacher,
  FaChartLine,
} from "react-icons/fa";

export const PLAN_FEATURE_CATEGORIES = {
  student: [
    {
      key: "learning",
      label: "Learning resources",
      description:
        "Books, tutorials, and class materials included with each subscription tier.",
      icon: FaBookOpen,
      features: [
        {
          key: "books_download",
          label: "Download premium books",
          description:
            "Save course books and resources for offline study whenever your plan covers them.",
          type: "boolean",
        },
      ],
    },
    {
      key: "community",
      label: "Community & groups",
      description:
        "Collaborate with classmates inside study groups and open community discussions.",
      icon: FaUsers,
      features: [
        {
          key: "groups_create",
          label: "Create study groups",
          description: "Launch private or public groups for your cohorts.",
          type: "boolean",
        },
        {
          key: "groups_join_limit",
          label: "Groups you can join",
          description: "Number of active groups you can participate in at once.",
          type: "limit",
          suffix: "groups",
          unlimitedLabel: "Unlimited groups",
        },
        {
          key: "community_post",
          label: "Post & reply in community",
          description: "Ask questions, share wins, and answer peers inside the SkillBridge community.",
          type: "boolean",
        },
      ],
    },
    {
      key: "creator_tools",
      label: "Creator tools",
      description: "Publish your own content and classes on SkillBridge.",
      icon: FaChalkboardTeacher,
      features: [
        {
          key: "classes_create",
          label: "Publish online classes",
          description: "Host live or on-demand classes for other learners.",
          type: "boolean",
        },
      ],
    },
    {
      key: "commerce",
      label: "Marketplace fees",
      description: "Platform revenue share applied when you sell digital products.",
      icon: FaChartLine,
      features: [
        {
          key: "commission_rate",
          label: "Platform commission",
          description: "Percentage kept by SkillBridge on every sale you make.",
          type: "percentage",
        },
      ],
    },
  ],
  instructor: [
    {
      key: "publishing",
      label: "Course publishing",
      description: "Limits and tools for launching premium classes and tutorials.",
      icon: FaChalkboardTeacher,
      features: [
        {
          key: "classes_create",
          label: "Publish online classes",
          description: "Create and publish premium courses for your learners.",
          type: "boolean",
        },
        {
          key: "max_courses",
          label: "Published class limit",
          description: "Number of classes you can keep published simultaneously.",
          type: "number",
          source: "plan",
          suffix: "classes",
        },
      ],
    },
    {
      key: "advertising",
      label: "Advertising & promotion",
      description: "Boost visibility for launches with in-platform ads and analytics.",
      icon: FaBullhorn,
      features: [
        {
          key: "ad_credits",
          label: "Ad credits per cycle",
          description: "Credits automatically available for running campaigns.",
          type: "number",
          source: "plan",
          suffix: "credits",
        },
        {
          key: "ads_max_ads",
          label: "Simultaneous ad slots",
          description: "How many ads you can run at once.",
          type: "number",
        },
        {
          key: "ads_max_duration",
          label: "Max ad duration",
          description: "How long each ad can stay live.",
          type: "number",
          suffix: "days",
        },
        {
          key: "ads_allow_branding",
          label: "Custom branding",
          description: "Upload branded creatives and custom assets for campaigns.",
          type: "boolean",
        },
        {
          key: "ads_show_analytics",
          label: "Advanced ad analytics",
          description: "Unlock detailed performance dashboards for every campaign.",
          type: "boolean",
        },
      ],
    },
    {
      key: "community",
      label: "Community & groups",
      description: "Engage with learners and collaborators across the platform.",
      icon: FaUsers,
      features: [
        {
          key: "groups_create",
          label: "Create instructor communities",
          description: "Build niche learning spaces for your students.",
          type: "boolean",
        },
        {
          key: "groups_join_limit",
          label: "Groups you can join",
          description: "Maximum groups you can participate in simultaneously.",
          type: "limit",
          suffix: "groups",
          unlimitedLabel: "Unlimited groups",
        },
        {
          key: "community_post",
          label: "Post & reply in community",
          description: "Share updates, announcements, and answer student questions.",
          type: "boolean",
        },
      ],
    },
    {
      key: "resources",
      label: "Digital resources",
      description: "Manage downloadable materials and premium book bundles.",
      icon: FaBookOpen,
      features: [
        {
          key: "books_download",
          label: "Download proof copies & assets",
          description: "Download your own teaching materials or bundled student books.",
          type: "boolean",
        },
      ],
    },
    {
      key: "commerce",
      label: "Marketplace fees",
      description: "Platform revenue share applied to every sale you make.",
      icon: FaChartLine,
      features: [
        {
          key: "commission_rate",
          label: "Platform commission",
          description: "Percentage retained by SkillBridge on each transaction.",
          type: "percentage",
        },
      ],
    },
  ],
};
