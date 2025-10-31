const db = require("../../config/database");

exports.createOffer = async (data) => {
  const [row] = await db("offers").insert(data).returning("*");
  return row;
};

// Determine the fee to charge for an offer based on the creator's plan
exports.calculateOfferFee = (user) => {
  if (user?.role?.toLowerCase() !== "instructor") return 0;
  // Instructors with a premium plan do not pay a fee
  const plan = user.plan || user.subscription || "";
  if (typeof plan === "string" && plan.toLowerCase() === "premium") {
    return 0;
  }
  // Default fee for non-premium instructors
  return 10; // flat fee; could be fetched from configuration later
};

// Summarise offers associated with a specific group
exports.getGroupOfferSummary = async (groupId) => {
  const row = await db("offers")
    .where({ group_id: groupId })
    .count("id as count")
    .sum({ total_fee: "fee" })
    .first();
  return {
    count: Number(row?.count || 0),
    total_fee: Number(row?.total_fee || 0),
  };
};

exports.getOffers = (options = {}) => {
  const {
    scope = "public",
    viewerId = null,
    includeMine = false,
    status,
    offerType,
    ownerRole,
    search,
    orderBy,
    orderDirection,
  } = options;

  const normalizedScope = String(scope).toLowerCase();
  const normalizedStatus = status ? String(status).toLowerCase() : "";
  const normalizedOfferType = offerType ? String(offerType).toLowerCase() : "";
  const normalizedOwnerRole = ownerRole ? String(ownerRole).toLowerCase() : "";

  const query = db("offers as o")
    .leftJoin("users as u", "o.student_id", "u.id")
    .leftJoin("offer_tag_map as m", "o.id", "m.offer_id")
    .leftJoin("offer_tags as t", "m.tag_id", "t.id")
    .select(
      "o.*",
      "u.full_name as student_name",
      "u.role as student_role",
      "u.avatar_url as student_avatar",
      "u.email as student_email",
      "u.phone as student_phone",
      db.raw(
        `COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::jsonb
        ) as tags`
      )
    )
    .groupBy(
      "o.id",
      "u.full_name",
      "u.role",
      "u.avatar_url",
      "u.email",
      "u.phone"
    );

  if (normalizedScope === "admin") {
    if (normalizedStatus && ["open", "closed", "cancelled"].includes(normalizedStatus)) {
      query.where("o.status", normalizedStatus);
    }
    if (normalizedOfferType && ["class", "tutorial"].includes(normalizedOfferType)) {
      query.where("o.offer_type", normalizedOfferType);
    }
    if (normalizedOwnerRole && ["student", "instructor"].includes(normalizedOwnerRole)) {
      query.whereRaw("LOWER(u.role) = ?", [normalizedOwnerRole]);
    }
  } else {
    query.where(function (qb) {
      qb.where(function (publicQb) {
        publicQb.where("o.status", "open").andWhere(function () {
          this.whereNull("o.expires_at").orWhere(
            "o.expires_at",
            ">",
            db.fn.now()
          );
        });
      });
      if (includeMine && viewerId) {
        qb.orWhere("o.student_id", viewerId);
      }
    });
  }

  if (search) {
    const term = `%${search}%`;
    query.andWhere(function (qb) {
      qb.whereRaw("o.title ILIKE ?", [term]).orWhereRaw(
        "o.description ILIKE ?",
        [term]
      );
    });
  }

  const allowedOrderColumns = ["created_at", "updated_at", "expires_at"];
  const column = allowedOrderColumns.includes(orderBy) ? orderBy : "created_at";
  const direction = orderDirection === "asc" ? "asc" : "desc";
  query.orderBy(`o.${column}`, direction);

  return query;
};

exports.getOfferById = (id, options = {}) => {
  const {
    scope = "public",
    viewerId = null,
    includeMine = false,
  } = options;

  const normalizedScope = String(scope).toLowerCase();

  const query = db("offers as o")
    .leftJoin("users as u", "o.student_id", "u.id")
    .leftJoin("offer_tag_map as m", "o.id", "m.offer_id")
    .leftJoin("offer_tags as t", "m.tag_id", "t.id")
    .select(
      "o.*",
      "u.full_name as student_name",
      "u.role as student_role",
      "u.avatar_url as student_avatar",
      "u.email as student_email",
      "u.phone as student_phone",
      db.raw(
        `COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::jsonb
        ) as tags`
      )
    )
    .where("o.id", id)
    .groupBy(
      "o.id",
      "u.full_name",
      "u.role",
      "u.avatar_url",
      "u.email",
      "u.phone"
    );

  if (normalizedScope !== "admin") {
    query.andWhere(function (qb) {
      qb.where(function (publicQb) {
        publicQb.where("o.status", "open").andWhere(function () {
          this.whereNull("o.expires_at").orWhere(
            "o.expires_at",
            ">",
            db.fn.now()
          );
        });
      });
      if (includeMine && viewerId) {
        qb.orWhere("o.student_id", viewerId);
      }
    });
  }

  return query.first();
};

exports.updateOffer = async (id, data) => {
  const [row] = await db("offers").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteOffer = (id) => {
  return db("offers").where({ id }).del();
};

exports.deleteExpiredOffers = () => {
  return db("offers")
    .whereNotNull("expires_at")
    .andWhere("expires_at", "<", db.fn.now())
    .del();
};

exports.addOfferTags = async (offerId, tagIds) => {
  if (!tagIds.length) return;
  const rows = tagIds.map((tag_id) => ({ offer_id: offerId, tag_id }));
  await db("offer_tag_map").insert(rows);
};

exports.getOfferTags = async (offerId) => {
  return db("offer_tag_map as m")
    .join("offer_tags as t", "m.tag_id", "t.id")
    .where("m.offer_id", offerId)
    .select("t.id", "t.name", "t.slug");
};

exports.countActiveOffersByUser = async (userId) => {
  const row = await db("offers")
    .where({ student_id: userId })
    .andWhere("status", "open")
    .andWhere(function () {
      this.whereNull("expires_at").orWhere("expires_at", ">", db.fn.now());
    })
    .count("id as count")
    .first();

  return Number(row?.count || 0);
};
