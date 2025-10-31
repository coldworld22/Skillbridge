const PROVIDER_META = [
  {
    key: "chatgpt",
    label: "ChatGPT",
    hasCredentials: (cfg) => Boolean(cfg?.apiKey),
  },
  {
    key: "deepseek",
    label: "DeepSeek AI",
    hasCredentials: (cfg) => Boolean(cfg?.apiKey),
  },
  {
    key: "gemini",
    label: "Gemini",
    hasCredentials: (cfg) => Boolean(cfg?.apiKey),
  },
];

const isActive = (settings, key) => {
  const cfg = settings?.[key];
  if (!cfg || cfg.active === false) return false;
  const meta = PROVIDER_META.find((m) => m.key === key);
  return meta?.hasCredentials(cfg);
};

export const computeAvailableProviders = (settings = {}) => {
  const providers = PROVIDER_META.filter((meta) =>
    isActive(settings, meta.key)
  ).map((meta) => ({
    key: meta.key,
    label: meta.label,
  }));

  const requestedDefault = settings?.aiDefault?.provider;
  let defaultProvider =
    providers.find((p) => p.key === requestedDefault)?.key || null;
  if (!defaultProvider) {
    defaultProvider = providers.length ? providers[0].key : null;
  }

  return {
    providers,
    defaultProvider,
  };
};

export default {
  computeAvailableProviders,
};
