export function safeEncodeURI(url) {
  return encodeURI(url).replace(/#/g, '%23');
}
