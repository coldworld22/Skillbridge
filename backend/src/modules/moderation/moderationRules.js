/**
 * Moderation rules covering abusive language, threats, and spam indicators.
 * NOTE: Offensive terms appear below because the system must detect them.
 */

const rules = [
  {
    id: "self_harm",
    label: "Self-harm encouragement",
    severity: "critical",
    patterns: [
      /\bkill\s+yourself\b/i,
      /\bgo\s+kill\s+yourself\b/i,
      /\bkys\b/i,
      /\bend\s+your\s+life\b/i,
      /\bgo\s+die\b/i,
    ],
  },
  {
    id: "violent_threat",
    label: "Violent threats",
    severity: "critical",
    patterns: [
      /\bi['’]m\s+going\s+to\s+(?:kill|shoot|stab|beat)\s+you\b/i,
      /\bi\s+will\s+(?:kill|hurt|break|destroy)\s+you\b/i,
      /\bi['’]?ll\s+(?:hunt|find)\s+you\b/i,
      /\b(?:pull|bring)\s+?a\s+gun\b/i,
    ],
  },
  {
    id: "hate_slur",
    label: "Hate speech and slurs",
    severity: "critical",
    patterns: [
      /\bnigger\b/i,
      /\bfaggot\b/i,
      /\bspic\b/i,
      /\bchink\b/i,
      /\bkike\b/i,
      /\bwetback\b/i,
      /\bretard(ed)?\b/i,
      /\bgo\s+back\s+to\s+your\s+country\b/i,
    ],
  },
  {
    id: "sexual_harassment",
    label: "Sexual harassment",
    severity: "high",
    patterns: [
      /\bsend\s+nudes\b/i,
      /\bshow\s+(?:me\s+)?your\s+(?:boobs|tits|breasts|ass)\b/i,
      /\bi\s+want\s+to\s+(?:touch|lick)\s+you\b/i,
      /\b(?:horny|slut|whore)\b/i,
      /\b(?:dick\s+pic|naked\s+pics?)\b/i,
    ],
  },
  {
    id: "harassment",
    label: "Harassment or abuse",
    severity: "high",
    patterns: [
      /\b(?:idiot|dumbass|moron|stupid|loser|trash|scum)\b/i,
      /\b(?:shut\s+up|shut\s+the\s+fuck\s+up)\b/i,
      /\byou(?:'re|\s+are)\s+(?:useless|pathetic|worthless)\b/i,
      /\byou(?:'re|\s+are)\s+(?:a\s+)*(?:disgrace|failure)\b/i,
    ],
  },
  {
    id: "profanity",
    label: "Strong profanity",
    severity: "medium",
    patterns: [
      /\b(?:fuck|shit|bitch|asshole|bastard|cunt|dick|prick)\b/i,
      /\b(?:motherfucker|mf+|f+uck+)\b/i,
      /\b(?:pussy|cock|blowjob|handjob)\b/i,
    ],
  },
  {
    id: "spam_links",
    label: "Suspicious spam or phishing",
    severity: "medium",
    patterns: [
      /https?:\/\/\S*(?:viagra|porn|xxx|casino|crypto|airdrop)\S*/i,
      /\b(?:free\s+crypto|win\s+\$?\d{2,}|click\s+this\s+link)\b/i,
      /\b(?:make\s+\$?\d{2,}\s+per\s+day)\b/i,
    ],
  },
  {
    id: "contact_drop",
    label: "Off-platform contact drop",
    severity: "low",
    patterns: [
      /\b(?:text|message|dm)\s+me\s+(?:at|on)\b/i,
      /\bwhatsapp\s+me\b/i,
      /\btelegram\s+me\b/i,
      /\b\d{3}[-\s.]?\d{3}[-\s.]?\d{4}\b/i,
      /\b@[a-z0-9_.]{3,}\b/i,
    ],
  },
];

module.exports = rules;
