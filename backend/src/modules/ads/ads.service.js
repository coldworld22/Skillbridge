const db = require("../../config/database");

exports.createAd = async (data, trx) => {
  const query = trx || db;
  const [row] = await query("ads").insert(data).returning("*");
  return row;
};

// Fetch ads with optional inclusion of inactive ones and ability to
// restrict results to a specific creator or target role. When
// `onlyPurchased` is true, only ads that have been purchased are returned.
exports.getAds = async (
  includeInactive = false,
  createdBy,
  targetRole,
  onlyPurchased = false,
  includeAllDates = false
) => {
  return db("ads")
    .modify((qb) => {
      if (!includeInactive) qb.where({ is_active: true });
      if (createdBy) qb.where({ created_by: createdBy });
      if (targetRole) {
        qb.where(function () {
          this.whereRaw(
            "target_roles IS NULL OR target_roles = '{}' OR ? = ANY(target_roles)",
            [targetRole]
          );
        });
      }
      if (onlyPurchased) qb.whereNotNull("purchased_at");
      if (!includeAllDates) {
        qb.where("start_at", "<=", db.fn.now());
        qb.where("end_at", ">=", db.fn.now());
      }
    })
    .orderBy("created_at", "desc");
};

// Mark an ad as purchased by a user
exports.purchaseAd = async (id, userId) => {
  const [row] = await db("ads")
    .where({ id, purchased_at: null })
    .update({
      purchased_by: userId,
      purchased_at: db.fn.now(),
      is_active: true,
    })
    .returning("*");
  return row;
};

exports.getAdById = async (id) => {
  return db("ads").where({ id }).first();
};

exports.getPublicAdById = async (id) => {
  return db("ads")
    .select(
      "id",
      "title",
      "description",
      "link_url",
      "start_at",
      "end_at",
      "image_url",
      "video_url"
    )
    .where({ id, is_active: true })
    .where("start_at", "<=", db.fn.now())
    .where("end_at", ">=", db.fn.now())
    .first();
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

  // Aggregate views by device and IP
  const deviceRows = await db("ad_views")
    .select("user_agent")
    .count("* as views")
    .where({ ad_id: adId })
    .groupBy("user_agent")
    .orderBy("views", "desc");

  const ipRows = await db("ad_views")
    .select("ip_address")
    .count("* as views")
    .where({ ad_id: adId })
    .groupBy("ip_address")
    .orderBy("views", "desc");

  // Optional stored analytics such as clicks/ctr
  const row = await db("ad_analytics").where({ ad_id: adId }).first();
  const clicks = row?.clicks ?? 0;
  const ctr = row?.ctr ?? calculateCtr(clicks, agg.views);

  return {
    views: Number(agg?.views) || 0,
    clicks,
    ctr: Number(ctr) || 0,
    unique_viewers: Number(agg?.unique_viewers) || 0,
    devices: deviceRows.map((d) => ({ user_agent: d.user_agent, views: Number(d.views) })),
    ip_stats: ipRows.map((i) => ({ ip_address: i.ip_address, views: Number(i.views) })),
    location_stats: [],
    analytics: daily.map((d) => ({ day: d.day, views: Number(d.views) })),
  };
};

// Increment view count and track unique viewers
exports.recordView = async (adId, userId, ipAddress, userAgent) => {
  return db.transaction(async (trx) => {
    // Check if this viewer is unique before inserting the view record
    let isUnique = false;
    if (userId) {
      const existing = await trx("ad_views")
        .where({ ad_id: adId, user_id: userId })
        .first();
      if (!existing) {
        isUnique = true;
      }
    } else if (ipAddress) {
      const existing = await trx("ad_views")
        .where({ ad_id: adId, ip_address: ipAddress })
        .first();
      if (!existing) {
        isUnique = true;
      }
    }

    // Log the view event
    await trx("ad_views").insert({
      ad_id: adId,
      user_id: userId || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    });

    const analytics = await trx("ad_analytics").where({ ad_id: adId }).first();
    if (analytics) {
      const views = analytics.views + 1;
      const clicks = analytics.clicks;
      const updates = {
        views,
        ctr: calculateCtr(clicks, views),
      };
      if (isUnique) {
        updates.unique_viewers = analytics.unique_viewers + 1;
      }
      await trx("ad_analytics").where({ ad_id: adId }).update(updates);
    } else {
      await trx("ad_analytics").insert({
        ad_id: adId,
        views: 1,
        clicks: 0,
        ctr: 0,
        unique_viewers: isUnique ? 1 : 0,
      });
    }
  });
};

// Increment click count and recompute CTR
exports.recordClick = async (adId) => {
  return db.transaction(async (trx) => {
    const analytics = await trx("ad_analytics").where({ ad_id: adId }).first();
    if (analytics) {
      const clicks = analytics.clicks + 1;
      const ctr = calculateCtr(clicks, analytics.views);
      await trx("ad_analytics").where({ ad_id: adId }).update({
        clicks,
        ctr,
      });
    } else {
      await trx("ad_analytics").insert({
        ad_id: adId,
        views: 0,
        clicks: 1,
        ctr: 0,
        unique_viewers: 0,
      });
    }
  });
};
