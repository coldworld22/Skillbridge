const logger = require("../utils/logger.js");
const db = require("../config/database");
const notificationService = require("../modules/notifications/notifications.service");
const mailService = require("../services/mailService");

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RENEWAL_THRESHOLD_DAYS = 7;
const FINAL_THRESHOLD_DAYS = 1;
const INTERVAL_MS = MS_PER_DAY; // run daily

const formatDate = (date) =>
  new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const sendReminder = async ({ user, plan, message, subject, type }) => {
  try {
    await notificationService.createNotification({
      user_id: user.id,
      type,
      message,
    });

    if (user.email) {
      await mailService.sendMail({
        to: user.email,
        subject,
        html: `<p>${message}</p><p>Plan: <strong>${plan.name}</strong></p>`,
      });
    }
  } catch (err) {
    logger.error(`Failed to send subscription reminder (${type}):`, err);
  }
};

async function runReminderSweep() {
  const now = new Date();

  let subscriptions = [];
  try {
    subscriptions = await db("user_subscriptions as us")
      .join("users as u", "us.user_id", "u.id")
      .join("plans as p", "us.plan_id", "p.id")
      .select(
        "us.id",
        "us.user_id",
        "us.plan_id",
        "us.start_date",
        "us.end_date",
        "us.status",
        "us.renewal_notice_sent_at",
        "us.expiry_notice_sent_at",
        "u.email",
        "u.full_name",
        "p.name as plan_name"
      )
      .where("us.status", "active")
      .andWhereNotNull("us.end_date");
  } catch (err) {
    logger.error("Failed to fetch subscriptions for reminder job:", err);
    return;
  }

  for (const sub of subscriptions) {
    const endDate = new Date(sub.end_date);
    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / MS_PER_DAY);
    const user = { id: sub.user_id, email: sub.email, full_name: sub.full_name };
    const plan = { id: sub.plan_id, name: sub.plan_name };

    if (diffMs <= 0) {
      // Subscription has expired
      if (!sub.expiry_notice_sent_at) {
        const message = `Your ${plan.name} plan expired on ${formatDate(
          endDate
        )}. Renew now to keep access to SkillBridge features.`;
        await sendReminder({
          user,
          plan,
          message,
          subject: "Your SkillBridge subscription has expired",
          type: "plan_expired",
        });
        await db("user_subscriptions")
          .where({ id: sub.id })
          .update({
            expiry_notice_sent_at: new Date(),
            status: "expired",
          });
      } else if (sub.status === "active") {
        await db("user_subscriptions")
          .where({ id: sub.id })
          .update({ status: "expired" });
      }
      continue;
    }

    if (
      diffDays <= RENEWAL_THRESHOLD_DAYS &&
      diffDays > FINAL_THRESHOLD_DAYS &&
      !sub.renewal_notice_sent_at
    ) {
      const message = `Your ${plan.name} plan renews on ${formatDate(
        endDate
      )}. Renew now to keep uninterrupted access.`;
      await sendReminder({
        user,
        plan,
        message,
        subject: "Your SkillBridge subscription renews soon",
        type: "plan_renewal_warning",
      });
      await db("user_subscriptions")
        .where({ id: sub.id })
        .update({ renewal_notice_sent_at: new Date() });
      continue;
    }

    if (
      diffDays <= FINAL_THRESHOLD_DAYS &&
      diffDays >= 0 &&
      !sub.expiry_notice_sent_at
    ) {
      const message = `Your ${plan.name} plan will expire on ${formatDate(
        endDate
      )}. Renew today to avoid losing access.`;
      await sendReminder({
        user,
        plan,
        message,
        subject: "Final reminder: subscription ending soon",
        type: "plan_final_warning",
      });
      await db("user_subscriptions")
        .where({ id: sub.id })
        .update({ expiry_notice_sent_at: new Date() });
      continue;
    }
  }
}

function startSubscriptionReminderJob() {
  const execute = async () => {
    try {
      await runReminderSweep();
    } catch (err) {
      logger.error("Subscription reminder job failed:", err);
    }
  };

  // Initial run shortly after startup
  setTimeout(execute, 30 * 1000);
  setInterval(execute, INTERVAL_MS);
}

module.exports = startSubscriptionReminderJob;
