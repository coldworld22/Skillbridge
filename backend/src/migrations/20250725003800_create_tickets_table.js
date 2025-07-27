exports.up = function(knex) {
  return knex.schema.createTable('tickets', function(table) {
    table.increments('id');
    table.string('subject');
    table.text('description');
    table.enu('status', ['Open', 'Pending', 'Resolved', 'Closed']).defaultTo('Open');
    table.enu('priority', ['Low', 'Medium', 'High', 'Urgent']).defaultTo('Medium');
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.integer('assigned_admin_id').unsigned().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tickets');
};
