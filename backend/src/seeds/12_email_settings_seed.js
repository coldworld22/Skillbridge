const APP_DOMAIN = process.env.APP_DOMAIN || "example.com";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || `support@${APP_DOMAIN}`;
exports.seed = async function (knex) {
  await knex('settings').where({ key: 'email_settings' }).del();
  const now = new Date();
  const config = {
    fromName: 'SkillBridge Support',
    fromEmail: SUPPORT_EMAIL,
    replyTo: SUPPORT_EMAIL,
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    encryption: 'SSL',
    username: SUPPORT_EMAIL,
    password: 'Javaheat@18880',
    method: 'smtp',
    imapHost: 'imap.hostinger.com',
    imapPort: 993,
    imapEncryption: 'SSL',
    popHost: 'pop.hostinger.com',
    popPort: 995,
    popEncryption: 'SSL'
  };
  await knex('settings').insert({
    key: 'email_settings',
    value: JSON.stringify(config),
    created_at: now,
    updated_at: now,
  });
};
