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

      console.log(
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
      const bodyText = await res.text();
      console.log('[SMS] Infobip response:', res.status, bodyText);
      if (!res.ok) {
        console.error('[SMS] Infobip SMS error:', bodyText);
      } else {
        console.log(`[SMS] SMS sent via Infobip to ${to}`);
      }
    } catch (err) {
      console.error('Failed to send SMS via Infobip:', err.message);
    }
  } else {
    console.log(`[SMS MOCK ${provider.name}] to ${to}: ${text}`);
  }
};
