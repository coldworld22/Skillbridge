const db = require("../config/database");
const logger = require("../utils/logger");
const { resolveTenantByHost } = require("../middleware/tenant");
const { parseTenantDomainSeeds } = require("../utils/tenantDomainSeeds");

const toDomain = (value) => (value || "").trim().toLowerCase();

async function validateTenantDomains() {
  const seeds = parseTenantDomainSeeds();
  if (!seeds.length) {
    logger.log("ℹ️ No tenant domains to validate (TENANT_DOMAIN_SEEDS is empty).");
    return;
  }

  const tenantSlugs = [
    ...new Set(seeds.map((seed) => seed.tenant_slug).filter(Boolean)),
  ];
  const tenants = tenantSlugs.length
    ? await db("tenants").whereIn("slug", tenantSlugs).select("id", "slug")
    : [];
  const tenantBySlug = tenants.reduce((acc, row) => {
    acc[row.slug] = row.id;
    return acc;
  }, {});

  let mismatches = 0;

  for (const seed of seeds) {
    const domain = toDomain(seed.domain);
    if (!domain) {
      logger.warn("Skipping tenant domain validation with missing domain.");
      mismatches += 1;
      continue;
    }

    const expectedTenantId = seed.tenant_id || tenantBySlug[seed.tenant_slug];
    if (!expectedTenantId) {
      logger.warn(`Missing expected tenant ID for domain ${domain}.`);
      mismatches += 1;
      continue;
    }

    let actualTenantId = null;
    try {
      actualTenantId = await resolveTenantByHost(domain);
    } catch (err) {
      logger.warn(`Host resolution failed for ${domain}: ${err.message}`);
    }

    const match = actualTenantId === expectedTenantId;
    if (!match) {
      mismatches += 1;
    }

    logger.log(
      `🔎 Tenant domain check ${domain}: expected=${expectedTenantId} actual=${actualTenantId || "none"} match=${match}`,
    );
  }

  if (mismatches > 0) {
    logger.warn(`Tenant domain validation completed with ${mismatches} issue(s).`);
    process.exitCode = 1;
  } else {
    logger.log("✅ Tenant domain validation passed.");
  }
}

validateTenantDomains()
  .catch((err) => {
    logger.error("Tenant domain validation failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
