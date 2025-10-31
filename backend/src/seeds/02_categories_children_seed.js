const { v4: uuidv4 } = require("uuid");

exports.seed = async function (knex) {
  const now = new Date();

  // Get parent IDs by slug
  const parents = await knex("categories")
    .whereNull("parent_id")
    .select("id", "slug");

  const getParentId = (slug) => parents.find((p) => p.slug === slug)?.id;

  const subcategories = [
    // Technology & Programming
    { name: "Web Development", slug: "web-development", parent: "technology-programming", icon: "Globe" },
    { name: "Mobile Apps", slug: "mobile-apps", parent: "technology-programming", icon: "Smartphone" },
    { name: "DevOps & Cloud", slug: "devops-cloud", parent: "technology-programming", icon: "CloudCog" },

    // Design & Creative Arts
    { name: "UI/UX Design", slug: "ui-ux-design", parent: "design-creative-arts", icon: "Component" },
    { name: "Graphic Design", slug: "graphic-design", parent: "design-creative-arts", icon: "PenTool" },
    { name: "Motion Graphics", slug: "motion-graphics", parent: "design-creative-arts", icon: "Clapperboard" },

    // Business & Finance
    { name: "Entrepreneurship", slug: "entrepreneurship", parent: "business-finance", icon: "Rocket" },
    { name: "Finance & Accounting", slug: "finance-accounting", parent: "business-finance", icon: "PiggyBank" },
    { name: "Project Management", slug: "project-management", parent: "business-finance", icon: "ClipboardCheck" },

    // Health & Wellness
    { name: "Nursing", slug: "nursing", parent: "health-wellness", icon: "Stethoscope" },
    { name: "Nutrition & Diet", slug: "nutrition-diet", parent: "health-wellness", icon: "Apple" },
    { name: "Mental Health", slug: "mental-health", parent: "health-wellness", icon: "Brain" },

    // Data & Analytics
    { name: "Data Science", slug: "data-science", parent: "data-analytics", icon: "Binary" },
    { name: "Machine Learning", slug: "machine-learning", parent: "data-analytics", icon: "Bot" },
    { name: "Business Intelligence", slug: "business-intelligence", parent: "data-analytics", icon: "PieChart" },

    // Marketing & Sales
    { name: "Digital Marketing", slug: "digital-marketing", parent: "marketing-sales", icon: "CursorClick" },
    { name: "Content Strategy", slug: "content-strategy", parent: "marketing-sales", icon: "FileText" },
    { name: "Sales Enablement", slug: "sales-enablement", parent: "marketing-sales", icon: "Handshake" },

    // Science & Engineering
    { name: "Physics", slug: "physics", parent: "science-engineering", icon: "Atom" },
    { name: "Electrical Engineering", slug: "electrical-engineering", parent: "science-engineering", icon: "CircuitBoard" },
    { name: "Environmental Science", slug: "environmental-science", parent: "science-engineering", icon: "Leaf" },

    // Languages & Communication
    { name: "English Language", slug: "english-language", parent: "languages-communication", icon: "BookOpen" },
    { name: "Arabic Language", slug: "arabic-language", parent: "languages-communication", icon: "Book" },
    { name: "Public Speaking", slug: "public-speaking", parent: "languages-communication", icon: "Mic" },

    // Personal Development
    { name: "Leadership Skills", slug: "leadership-skills", parent: "personal-development", icon: "Crown" },
    { name: "Productivity & Habits", slug: "productivity-habits", parent: "personal-development", icon: "AlarmClock" },
    { name: "Career Growth", slug: "career-growth", parent: "personal-development", icon: "TrendingUp" },

    // Education & Teaching
    { name: "Curriculum Design", slug: "curriculum-design", parent: "education-teaching", icon: "ChalkboardTeacher" },
    { name: "Classroom Management", slug: "classroom-management", parent: "education-teaching", icon: "Users" },
    { name: "Online Teaching", slug: "online-teaching", parent: "education-teaching", icon: "Laptop" },
  ];

  const rows = subcategories.map((s) => ({
    id: uuidv4(),
    name: s.name,
    slug: s.slug,
    status: "active",
    parent_id: getParentId(s.parent),
    image_url: null,
    icon: s.icon,
    created_at: now,
    updated_at: now,
  }));

  await knex("categories").insert(rows);
};
