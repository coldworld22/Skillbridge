// utils/MessageFilter.js
import Filter from "bad-words";

const filter = new Filter();

export function isMessageClean(message) {
  return !filter.isProfane(message);
}

export function getProfanityList(message) {
  const words = message.split(" ");
  return words.filter((word) => filter.isProfane(word));
}

export function cleanMessage(message) {
  return filter.clean(message);
}

// Example Usage:
// isMessageClean("You are great") => true
// isMessageClean("This is stupid") => false
// getProfanityList("This is a dumb answer") => ["dumb"]
// cleanMessage("This is dumb") => "This is ****"