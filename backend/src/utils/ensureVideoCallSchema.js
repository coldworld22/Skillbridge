const db = require("../config/database");

let ensuring = null;
let ensured = false;

const TABLE_BUILDERS = [
  {
    name: "video_calls",
    build: (table, knex) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(knex.raw("uuid_generate_v4()"));
      table
        .uuid("caller_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .uuid("receiver_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.string("room_id").notNullable();
      table.string("status").defaultTo("pending");
      table.timestamp("started_at").defaultTo(knex.fn.now());
      table.timestamp("ended_at");
    },
  },
  {
    name: "video_call_participants",
    build: (table, knex) => {
      table.increments("id").primary();
      table.string("room_id").notNullable();
      table.string("socket_id").notNullable();
      table.string("name").notNullable();
      table.string("role").defaultTo("participant");
      table.boolean("is_muted").defaultTo(false);
      table.timestamp("joined_at").defaultTo(knex.fn.now());
      table.timestamp("left_at");
    },
  },
  {
    name: "video_call_messages",
    build: (table, knex) => {
      table.increments("id").primary();
      table.string("room_id").notNullable();
      table.uuid("sender_id");
      table.string("sender");
      table.text("text").notNullable();
      table.timestamp("timestamp").defaultTo(knex.fn.now());
    },
  },
];

async function ensureVideoCallSchema() {
  if (ensured) return;
  if (ensuring) {
    await ensuring;
    return;
  }
  if (!db?.schema?.hasTable) {
    ensured = true;
    return;
  }
  ensuring = (async () => {
    for (const { name, build } of TABLE_BUILDERS) {
      const exists = await db.schema.hasTable(name);
      if (!exists) {
        await db.schema.createTable(name, (table) => build(table, db));
      }
    }
    ensured = true;
  })();

  try {
    await ensuring;
  } finally {
    ensuring = null;
  }
}

module.exports = ensureVideoCallSchema;
