const messagesConfigService = require("../modules/messagesConfig/messagesConfig.service");

const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const SMS_DISABLED = process.env.DISABLE_SMS === "true";

async function getActiveProvider() {
  const cfg = await messagesConfigService.getSettings();
  if (!cfg || !Array.isArray(cfg.providers)) return null;
  return cfg.providers.find(p => p.type === 'Gateway' && p.active);
}

exports.sendSMS = async ({ to, text }) => {
  if (SMS_DISABLED) {
    console.log(`[SMS DISABLED] to ${to}: ${text}`);
    return;
  }

  const provider = await getActiveProvider();
  if (!provider) {
    console.log(`[SMS] No active provider. Message to ${to}: ${text}`);
    return;
  }

  if (provider.name === 'Infobip') {
    const url = `${provider.region.replace(/\/$/, '')}/sms/2/text/advanced`;
    const payload = {
      messages: [
        {
          from: provider.senderId,
          destinations: [{ to }],
          text,
        },
      ],
    };
    try {
      const res = await fetchFn(url, {
        method: 'POST',
        headers: {
          Authorization: `App ${provider.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        console.error('Infobip SMS error:', msg);
      } else {
        console.log(`SMS sent via Infobip to ${to}`);
      }
    } catch (err) {
      console.error('Failed to send SMS via Infobip:', err.message);
    }
  } else {
    console.log(`[SMS MOCK ${provider.name}] to ${to}: ${text}`);
  }
};
