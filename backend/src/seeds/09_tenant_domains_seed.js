const crypto = require("crypto");

const logger = require("../utils/logger");
const { parseTenantDomainSeeds } = require("../utils/tenantDomainSeeds");

const toDomain = (value) => (value || "").trim().toLowerCase();

exports.seed = async function (knex) {
  const seeds = parseTenantDomainSeeds();
  if (!seeds.length) {
    logger.log("ℹ️ Skipping tenant domain seed (TENANT_DOMAIN_SEEDS is empty).");
    return;
  }

  const tenantSlugs = [
    ...new Set(seeds.map((seed) => seed.tenant_slug).filter(Boolean)),
  ];

  const tenants = tenantSlugs.length
    ? await knex("tenants").whereIn("slug", tenantSlugs).select("id", "slug")
    : [];
  const tenantBySlug = tenants.reduce((acc, row) => {
    acc[row.slug] = row.id;
    return acc;
  }, {});

  for (const seed of seeds) {
    const domain = toDomain(seed.domain);
    if (!domain) {
      logger.warn("Skipping tenant domain seed with missing domain.");
      continue;
    }

    const tenantId = seed.tenant_id || tenantBySlug[seed.tenant_slug];
    if (!tenantId) {
      logger.warn(`Skipping tenant domain ${domain}; tenant not found.`);
      continue;
    }

    const status = seed.status || "verified";
    const now = knex.fn.now();
    const payload = {
      tenant_id: tenantId,
      domain,
      status,
      verification_token:
        seed.verification_token || crypto.randomBytes(18).toString("hex"),
      verified_at: status === "verified" ? now : null,
      updated_at: now,
    };

    await knex("tenant_domains")
      .insert({ ...payload, created_at: now })
      .onConflict("domain")
      .merge(payload);

    logger.log(`✅ Seeded tenant domain ${domain} -> ${tenantId}`);
  }
};
