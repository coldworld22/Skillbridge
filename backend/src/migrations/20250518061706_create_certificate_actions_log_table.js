// 📁 migrations/YYYYMMDD_create_certificate_actions_log_table.js


exports.up = function (knex) {
  return knex.schema.createTable('certificate_actions_log', (table) => {

    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('certificate_id').notNullable().references('id').inTable('certificates').onDelete('CASCADE');
    table.uuid('performed_by').references('id').inTable('users').onDelete('SET NULL');
    table.enu('action', ['issued', 'revoked', 'downloaded', 'resent']).notNullable();
    table.text('notes');
    table.timestamp('performed_at').defaultTo(knex.fn.now());
  });
};


exports.down = function (knex) {
  return knex.schema.dropTable('certificate_actions_log');

};
