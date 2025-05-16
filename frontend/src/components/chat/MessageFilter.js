const bannedKeywords = ['stupid', 'idiot', 'shut up', 'hate', 'kill']; // you can expand this

export function filterMessage(content) {
  const lowered = content.toLowerCase();
  const matched = bannedKeywords.filter((word) => lowered.includes(word));
  return {
    isClean: matched.length === 0,
    matchedWords: matched
  };
}
