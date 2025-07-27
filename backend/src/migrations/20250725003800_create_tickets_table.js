exports.up = function(knex) {
  return knex.schema.createTable('tickets', function(table) {
    table.increments('id');
    table.string('subject');
    table.text('description');
    table.enu('status', ['Open', 'Pending', 'Resolved', 'Closed']).defaultTo('Open');
    table.enu('priority', ['Low', 'Medium', 'High', 'Urgent']).defaultTo('Medium');
    // Users table uses UUID primary keys, so we store references as UUID as well
    table
      .uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .uuid('assigned_admin_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tickets');
};
