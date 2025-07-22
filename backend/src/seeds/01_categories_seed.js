const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

exports.seed = async function (knex) {
  await knex('categories').del();

  const now = new Date();

  const mainCategories = [
    'Technology',
    'Business',
    'Health & Medicine',
    'Engineering',
    'Design & Creativity',
    'Science',
    'Mathematics',
    'Languages',
    'Soft Skills',
    'Test Preparation',
  ];

  const subcategories = {
    Technology: [
      'Web Development',
      'AI & Machine Learning',
      'Cybersecurity',
      'Mobile Development',
      'Game Development',
      'Cloud Computing',
    ],
    Business: [
      'Marketing',
      'Finance & Accounting',
      'Entrepreneurship',
      'Sales & Negotiation',
      'Business Strategy',
      'Human Resources',
    ],
    'Health & Medicine': [
      'Nursing',
      'Public Health',
      'Nutrition & Dietetics',
      'Mental Health',
      'Medical Coding',
    ],
    Engineering: [
      'Mechanical Engineering',
      'Electrical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      'Industrial Design',
    ],
    'Design & Creativity': [
      'Graphic Design',
      'UX/UI Design',
      'Photography',
      'Interior Design',
      'Animation & Motion Graphics',
    ],
    Science: [
      'Physics',
      'Chemistry',
      'Biology',
      'Astronomy',
      'Environmental Science',
    ],
    Mathematics: ['Algebra', 'Calculus', 'Statistics', 'Geometry', 'Applied Math'],
    Languages: ['English', 'Arabic', 'French', 'Spanish', 'Chinese', 'Sign Language'],
    'Soft Skills': [
      'Communication',
      'Time Management',
      'Leadership',
      'Public Speaking',
      'Emotional Intelligence',
    ],
    'Test Preparation': ['SAT', 'IELTS', 'TOEFL', 'GRE', 'NCLEX'],
  };

  const categoryIds = {};

  for (const name of mainCategories) {
    const [id] = await knex('categories')
      .insert({
        name,
        slug: slugify(name),
        parent_id: null,
        created_at: now,
        updated_at: now,
      })
      .returning('id');

    categoryIds[name] = id;
  }

  for (const [parent, subs] of Object.entries(subcategories)) {
    for (const name of subs) {
      await knex('categories').insert({
        name,
        slug: slugify(name),
        parent_id: categoryIds[parent],
        created_at: now,
        updated_at: now,
      });
    }
  }
};
