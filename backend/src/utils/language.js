const db = require("../config/database");

const getDefaultLanguage = async () => {
  const [lang] = await db("languages").where({ is_default: true });
  return lang?.code || "en";
};

module.exports = { getDefaultLanguage };
