const SENSITIVE_FIELDS = [
  'password_hash',
  'password',
  'reset_token',
  'verification_token',
];

function sanitizeUser(user) {
  if (!user) return user;
  const safe = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    if (field in safe) delete safe[field];
  }
  return safe;
}

module.exports = sanitizeUser;
