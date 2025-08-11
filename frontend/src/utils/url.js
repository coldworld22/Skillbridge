export function safeEncodeURI(url) {
  return encodeURI(url).replace(/#/g, '%23');
}

export function joinUrl(base, path) {
  return new URL(path, base).href;
}
