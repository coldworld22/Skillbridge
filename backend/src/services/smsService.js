const logger = require('../utils/logger.js');
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
    throw new Error("SMS service is disabled");
  }

  const provider = await getActiveProvider();
  if (!provider) {
    throw new Error("No active SMS gateway provider configured");
  }

  if (provider.name === 'Infobip') {
    const base = provider.region.startsWith('http')
      ? provider.region
      : `https://${provider.region}`;
    const url = `${base.replace(/\/$/, '')}/sms/2/text/advanced`;
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
      const auth = provider.apiKey.trim().startsWith('App ')
        ? provider.apiKey.trim()
        : `App ${provider.apiKey.trim()}`;
      logger.log(
        '[SMS] Sending request to Infobip:',
        JSON.stringify(
          {
            url,
            provider: { region: provider.region, senderId: provider.senderId },
            payload,
          },
          null,
          2
        )
      );
      const res = await fetchFn(url, {
        method: 'POST',
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch {
        json = null;
      }
      if (!res.ok) {
        logger.error('Infobip SMS error:', json || text);
      } else if (json && Array.isArray(json.messages)) {
        const status = json.messages[0]?.status;
        const desc = status?.description || 'unknown status';
        logger.log(`SMS sent via Infobip to ${to}: ${desc}`);
      } else {
        logger.log(`[SMS] SMS sent via Infobip to ${to}`);
      }
    } catch (err) {
      logger.error('Failed to send SMS via Infobip:', err.message);
    }
  } else {
    logger.log(`[SMS MOCK ${provider.name}] to ${to}: ${text}`);
  }
};
