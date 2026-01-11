/**
 * Adds tenant scoping to invoices by introducing a tenant_id column, backfilling from
 * payments when available, and tightening constraints only when the supporting tables exist.
 * The migration is defensive to avoid failing in environments that have not yet created
 * tenants/payments tenant columns.
 */
exports.up = async function (knex) {
  const hasInvoices = await knex.schema.hasTable("invoices");
  if (!hasInvoices) return;

  const hasTenantTable = await knex.schema.hasTable("tenants");
  const hasPaymentsTable = await knex.schema.hasTable("payments");
  const hasPaymentsTenant =
    hasPaymentsTable && (await knex.schema.hasColumn("payments", "tenant_id"));
  const hasInvoiceTenant = await knex.schema.hasColumn("invoices", "tenant_id");

  if (!hasInvoiceTenant) {
    await knex.schema.alterTable("invoices", (table) => {
      table.uuid("tenant_id").nullable();
    });
  }

  if (hasPaymentsTenant) {
    await knex("invoices")
      .whereNull("tenant_id")
      .update({
        tenant_id: knex.raw(
          "(SELECT tenant_id FROM payments WHERE payments.id = invoices.payment_id)"
        ),
      });
  }

  if (hasTenantTable && hasPaymentsTenant) {
    const [{ count }] = await knex("invoices")
      .whereNull("tenant_id")
      .count({ count: "*" });
    if (Number(count || 0) === 0) {
      await knex.schema.alterTable("invoices", (table) => {
        table.uuid("tenant_id").notNullable().alter();
        table
          .foreign("tenant_id")
          .references("tenants.id")
          .onDelete("CASCADE");
      });
    }
  }

  const hasTenantIdNow = await knex.schema.hasColumn("invoices", "tenant_id");
  if (hasTenantIdNow) {
    await knex.raw("CREATE INDEX IF NOT EXISTS invoices_tenant_idx ON invoices(tenant_id)");
  }
};

exports.down = async function (knex) {
  const hasInvoices = await knex.schema.hasTable("invoices");
  if (!hasInvoices) return;

  const hasTenantId = await knex.schema.hasColumn("invoices", "tenant_id");
  if (!hasTenantId) return;

  await knex.raw("DROP INDEX IF EXISTS invoices_tenant_idx");
  await knex.raw("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_tenant_id_foreign");
  await knex.schema.alterTable("invoices", (table) => {
    table.dropColumn("tenant_id");
  });
};
