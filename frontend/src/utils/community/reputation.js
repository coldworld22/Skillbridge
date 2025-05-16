export const getBadge = (count) => {
  if (count >= 50) return "🥇";
  if (count >= 30) return "🥈";
  if (count >= 10) return "🥉";
  return "";
};

export const calculateReputation = (upvotes, answers, acceptedAnswers) => {
  return upvotes * 2 + answers * 5 + acceptedAnswers * 10;
};
