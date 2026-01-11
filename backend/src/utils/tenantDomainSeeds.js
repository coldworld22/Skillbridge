const logger = require("./logger");

const parseTenantDomainSeeds = () => {
  const raw = process.env.TENANT_DOMAIN_SEEDS;
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      logger.warn("TENANT_DOMAIN_SEEDS must be a JSON array.");
      return [];
    }
    return parsed;
  } catch (err) {
    logger.warn("TENANT_DOMAIN_SEEDS is not valid JSON.");
    return [];
  }
};

module.exports = {
  parseTenantDomainSeeds,
};
