const db = require("../../config/database");

exports.createAd = async (data) => {
  const [row] = await db("ads").insert(data).returning("*");
  return row;
};

// Fetch ads with optional inclusion of inactive ones and ability to
// restrict results to a specific creator or target role
exports.getAds = async (includeInactive = false, createdBy, targetRole) => {
  return db("ads")
    .modify((qb) => {
      if (!includeInactive) qb.where({ is_active: true });
      if (createdBy) qb.where({ created_by: createdBy });
      if (targetRole) {
        qb.where(function () {
          this.whereRaw("target_roles = '{}' OR ? = ANY(target_roles)", [targetRole]);
        });
      }
    })
    .orderBy("created_at", "desc");
};

exports.getAdById = async (id) => {
  return db("ads").where({ id }).first();
};

exports.findByTitle = async (title) => {
  const normalized = title?.trim();
  if (!normalized) return null;
  // Normalize both sides of the comparison to avoid false positives
  // when titles contain extra whitespace or mixed casing.
  return db("ads")
    .whereRaw("LOWER(TRIM(title)) = ?", [normalized.toLowerCase()])
    .first();
};

exports.updateAd = async (id, data) => {
  const [row] = await db("ads").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteAd = (id) => {
  return db("ads").where({ id }).del();
};

// Record a single ad view. `userId` may be null for anonymous views.
exports.recordAdView = async (adId, userId) => {
  await db("ad_views").insert({ ad_id: adId, user_id: userId });
};

// Retrieve aggregated analytics for a given ad.
exports.getAdAnalytics = async (adId) => {
  // Aggregate total views and unique viewers from ad_views table
  const [agg] = await db("ad_views")
    .where({ ad_id: adId })
    .count("* as views")
    .countDistinct("user_id as unique_viewers");

  // Group views by day for line chart data
  const daily = await db("ad_views")
    .select(db.raw("DATE(viewed_at) as day"))
    .count("* as views")
    .where({ ad_id: adId })
    .groupBy("day")
    .orderBy("day", "asc");

  // Optional stored analytics such as clicks/ctr
  const row = await db("ad_analytics").where({ ad_id: adId }).first();
  const clicks = row?.clicks ?? 0;
  const ctr = row?.ctr ?? (agg.views ? clicks / agg.views : 0);

  return {
    views: Number(agg?.views) || 0,
    clicks,
    ctr: Number(ctr) || 0,
    unique_viewers: Number(agg?.unique_viewers) || 0,
    devices: [],
    location_stats: [],
    analytics: daily.map((d) => ({ day: d.day, views: Number(d.views) })),
  };
};
