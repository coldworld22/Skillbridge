exports.seed = async function(knex) {
  await knex('community_replies').del();
  await knex('community_discussions').del();

  const users = await knex('users').select('id').limit(2);
  if (!users.length) return;

  const [user1, user2 = users[0]] = users;
  const now = knex.fn.now();

  const [discussion1] = await knex('community_discussions')
    .insert({
      id: knex.raw('uuid_generate_v4()'),
      user_id: user1.id || user1,
      title: 'How to get started with SkillBridge?',
      content: 'I am new to SkillBridge. Can someone guide me through the basics?',
      tags: JSON.stringify(['getting-started']),
      created_at: now,
      updated_at: now
    })
    .returning('id');

  const [discussion2] = await knex('community_discussions')
    .insert({
      id: knex.raw('uuid_generate_v4()'),
      user_id: (user2.id || user2),
      title: 'Best resources for learning JavaScript?',
      content: 'What are the best tutorials or courses for learning JavaScript?',
      tags: JSON.stringify(['javascript', 'resources']),
      created_at: now,
      updated_at: now
    })
    .returning('id');

  await knex('community_replies').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      discussion_id: discussion1.id || discussion1,
      user_id: user2.id || user2,
      content: 'You can start by exploring the official docs and SkillBridge tutorials.',
      is_answer: true,
      created_at: now,
      updated_at: now
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      discussion_id: discussion2.id || discussion2,
      user_id: user1.id || user1,
      content: 'I recommend checking out the MDN web docs and online courses.',
      is_answer: false,
      created_at: now,
      updated_at: now
    }
  ]);
};
