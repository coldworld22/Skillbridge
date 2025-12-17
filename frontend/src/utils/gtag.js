let gtagLoaded = false;

export const loadGtagScript = (id, dataAttrKey = "data-gtag-id") => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!id) return;

  const selector = `script[${dataAttrKey}="${id}"]`;
  if (document.querySelector(selector)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  script.setAttribute(dataAttrKey, id);
  document.head.appendChild(script);
};

export const ensureGtag = () => {
  if (typeof window === "undefined") return null;

  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(){ window.dataLayer.push(arguments); };
  }

  if (!gtagLoaded) {
    window.gtag("js", new Date());
    gtagLoaded = true;
  }

  return window.gtag;
};

export const configureGtag = (id, config = {}) => {
  const gtag = ensureGtag();
  if (!gtag || !id) return;
  gtag("config", id, config);
};

export const sendGtagEvent = (eventName, params = {}) => {
  const gtag = ensureGtag();
  if (!gtag) return;
  gtag("event", eventName, params);
};
