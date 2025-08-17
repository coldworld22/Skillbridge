exports.up = function(knex) {
  return knex.schema.createTable('popup_announcements', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.string('audience').notNullable().defaultTo('all');
    table.jsonb('pages').notNullable().defaultTo('[]');
    table.timestamp('start_date');
    table.timestamp('end_date');
    table.string('position').defaultTo('center');
    table.string('theme').defaultTo('yellow');
    table.boolean('once_per_session').defaultTo(true);
    table.boolean('active').defaultTo(true);
    table.uuid('author_id').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('popup_announcements');
};
