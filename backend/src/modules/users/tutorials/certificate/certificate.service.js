const db = require("../../../../config/database");
const { v4: uuidv4 } = require("uuid");

// Generate a unique certificate code
const generateCode = () => {
  return `TUT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
};

// Check if user completed the tutorial
const isUserCompletedTutorial = async (userId, tutorialId) => {
  const enrollment = await db("tutorial_enrollments")
    .where({ user_id: userId, tutorial_id: tutorialId, status: "completed" })
    .first();
  return !!enrollment;
};

// Check if certificate already exists
const findExisting = async (userId, tutorialId) => {
  return await db("certificates")
    .where({ user_id: userId, tutorial_id: tutorialId })
    .first();
};

// Create a new certificate
const issueCertificate = async ({ userId, tutorialId, templateId = null }) => {
  const newCert = {
    id: uuidv4(),
    user_id: userId,
    tutorial_id: tutorialId,
    class_id: null,
    template_id: templateId,
    certificate_code: generateCode(),
    status: "issued"
  };

  await db("certificates").insert(newCert);
  return newCert;
};

module.exports = {
  generateCode,
  isUserCompletedTutorial,
  findExisting,
  issueCertificate,
};
