const db = require("../../config/database");
const { calculateCtr } = require("./ads.utils");

// Use native fetch when available; otherwise fall back to node-fetch
const fetchFn =
  typeof global.fetch === "function"
    ? (...args) => global.fetch(...args)
    : (...args) => import("node-fetch").then(({ default: f }) => f(...args));

// Base URL for IP lookup service. Allows override via environment variable
// but defaults to the secure ip-api endpoint.
const IP_API_BASE_URL = (
  process.env.IP_API_BASE_URL || "https://ip-api.com"
).replace(/\/$/, "");

const isIp = (ip) =>
  /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) ||
  /^[0-9a-fA-F:]+$/.test(ip);

async function lookupLocation(ip) {
  if (!ip || !isIp(ip)) return null;
  try {
    const res = await fetchFn(
      `${IP_API_BASE_URL}/json/${ip}?fields=status,country`
    );
    const data = await res.json();
    if (data.status === "success") {
      return data.country || null;
    }
  } catch (e) {
    // ignore network errors and return null
  }
  return null;
}

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
  includeAllDates = false,
  limit,
  offset,
  status,
  adType,
  search
) => {
  const query = db("ads")
    .modify((qb) => {
      const normalizedStatus = status?.toLowerCase();
      const normalizedType = adType?.toLowerCase();
      if (!includeInactive || normalizedStatus === "active") {
        qb.where({ is_active: true });
      } else if (normalizedStatus === "inactive") {
        qb.where({ is_active: false });
      }
      if (createdBy) qb.where({ created_by: createdBy });
      if (targetRole) {
        qb.where(function () {
          this.whereRaw(
            "target_roles IS NULL OR target_roles = '{}' OR ? = ANY(target_roles)",
            [targetRole]
          );
        });
      }
      if (normalizedType) qb.where({ ad_type: normalizedType });
      if (search) {
        const term = `%${search.toLowerCase()}%`;
        qb.where(function () {
          this.whereRaw("LOWER(title) LIKE ?", [term]).orWhereRaw(
            "LOWER(description) LIKE ?",
            [term]
          );
        });
      }
      if (onlyPurchased) qb.whereNotNull("purchased_at");
      if (!includeAllDates) {
        qb.where(function () {
          this.where("start_at", "<=", db.fn.now()).orWhereNull("start_at");
        });
        qb.where(function () {
          this.where("end_at", ">=", db.fn.now()).orWhereNull("end_at");
        });
      }
    })
    .orderBy("created_at", "desc");

  const countQuery = query
    .clone()
    .clearSelect()
    .clearOrder()
    .count("* as count")
    .first();

  if (Number.isFinite(limit)) query.limit(limit);
  if (Number.isFinite(offset)) query.offset(offset);

  const [rows, totalResult] = await Promise.all([query, countQuery]);
  const total = parseInt(totalResult.count, 10) || 0;

  return {
    data: rows,
    meta: {
      total,
      limit: Number.isFinite(limit) ? limit : undefined,
      offset: Number.isFinite(offset) ? offset : undefined,
    },
  };
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
    .where(function () {
      this.where("start_at", "<=", db.fn.now()).orWhereNull("start_at");
    })
    .where(function () {
      this.where("end_at", ">=", db.fn.now()).orWhereNull("end_at");
    })
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
  // Prepare all analytics queries
  const aggQuery = db("ad_views")
    .where({ ad_id: adId })
    .count("* as views")
    .countDistinct("user_id as unique_viewers")
    .first();

  const dailyQuery = db("ad_views")
    .select(db.raw("DATE(viewed_at) as day"))
    .count("* as views")
    .where({ ad_id: adId })
    .groupBy("day")
    .orderBy("day", "asc");

  const deviceQuery = db("ad_views")
    .select("user_agent")
    .count("* as views")
    .where({ ad_id: adId })
    .groupBy("user_agent")
    .orderBy("views", "desc");

  const ipQuery = db("ad_views")
    .select("ip_address")
    .count("* as views")
    .where({ ad_id: adId })
    .groupBy("ip_address")
    .orderBy("views", "desc");

  const locationQuery = db("ad_views")
    .select("location")
    .count("* as views")
    .where({ ad_id: adId })
    .whereNotNull("location")
    .groupBy("location")
    .orderBy("views", "desc");

  const analyticsRowQuery = db("ad_analytics").where({ ad_id: adId }).first();

  const [agg, daily, deviceRows, ipRows, locationRows, row] = await Promise.all([
    aggQuery,
    dailyQuery,
    deviceQuery,
    ipQuery,
    locationQuery,
    analyticsRowQuery,
  ]);

  const clicks = row?.clicks ?? 0;
  const views = Number(agg?.views) || 0;
  const ctr = row?.ctr ?? calculateCtr(clicks, views);

  return {
    views,
    clicks,
    ctr: Number(ctr) || 0,
    unique_viewers: Number(agg?.unique_viewers) || 0,
    devices: deviceRows.map((d) => ({ user_agent: d.user_agent, views: Number(d.views) })),
    ip_stats: ipRows.map((i) => ({ ip_address: i.ip_address, views: Number(i.views) })),
    location_stats: locationRows.map((l) => ({
      country: l.location,
      views: Number(l.views),
    })),
    analytics: daily.map((d) => ({ day: d.day, views: Number(d.views) })),
  };
};

// Increment view count and track unique viewers
exports.recordView = async (adId, userId, ipAddress, userAgent) => {
  const location = await lookupLocation(ipAddress);
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
      location: location || null,
    });

    const uniqueInc = isUnique ? 1 : 0;
    await trx("ad_analytics")
      .insert({
        ad_id: adId,
        views: 1,
        clicks: 0,
        ctr: 0,
        unique_viewers: uniqueInc,
      })
      .onConflict("ad_id")
      .merge({
        views: trx.raw("ad_analytics.views + 1"),
        unique_viewers: trx.raw("ad_analytics.unique_viewers + ?", [uniqueInc]),
      });

    await trx("ad_analytics")
      .where({ ad_id: adId })
      .update({
        ctr: trx.raw(
          "CASE WHEN views > 0 THEN (clicks::float / views) * 100 ELSE 0 END"
        ),
      });
  });
};

// Increment click count and recompute CTR
exports.recordClick = async (adId) => {
  return db.transaction(async (trx) => {
    await trx("ad_analytics")
      .insert({
        ad_id: adId,
        views: 0,
        clicks: 1,
        ctr: 0,
        unique_viewers: 0,
      })
      .onConflict("ad_id")
      .merge({
        clicks: trx.raw("ad_analytics.clicks + 1"),
      });

    await trx("ad_analytics")
      .where({ ad_id: adId })
      .update({
        ctr: trx.raw(
          "CASE WHEN views > 0 THEN (clicks::float / views) * 100 ELSE 0 END"
        ),
      });
  });
};
