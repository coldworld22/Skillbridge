const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  await knex('categories').del();

  const devId = uuidv4();
  const designId = uuidv4();

  const categories = [
    {
      id: devId,
      name: 'Development',
      slug: 'development',
      status: 'active',
      parent_id: null,
      image_url: '/uploads/categories/dev.jpg',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: designId,
      name: 'Design',
      slug: 'design',
      status: 'active',
      parent_id: null,
      image_url: '/uploads/categories/design.jpg',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Web Development',
      slug: 'web-development',
      status: 'active',
      parent_id: devId,
      image_url: '/uploads/categories/web.jpg',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Mobile Development',
      slug: 'mobile-development',
      status: 'active',
      parent_id: devId,
      image_url: '/uploads/categories/mobile.jpg',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'UI/UX Design',
      slug: 'ui-ux-design',
      status: 'active',
      parent_id: designId,
      image_url: '/uploads/categories/uiux.jpg',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('categories').insert(categories);
};
