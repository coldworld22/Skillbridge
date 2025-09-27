const db = require("../../../../config/database");
const { v4: uuidv4 } = require("uuid");
const { resolveTemplateId } = require("../../../certificateTemplates/certificateTemplates.service");


// Generate a unique certificate code
const generateCode = () => {
  return `TUT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
};

// Check if user completed the tutorial
// Now also verifies that all assignments have been submitted and passed
const isUserCompletedTutorial = async (userId, tutorialId) => {
  // Ensure tutorial progress is 100%
  const enrollment = await db("tutorial_enrollments")
    .where({ user_id: userId, tutorial_id: tutorialId })
    .where("progress", 100)
    .first();
  if (!enrollment) return false;

  // Get total assignments for the tutorial
  const [assignmentRow] = await db("tutorial_assignments")
    .where({ tutorial_id: tutorialId })
    .count("id as count");
  const totalAssignments = parseInt(assignmentRow?.count, 10) || 0;

  if (totalAssignments === 0) return true;

  // Count assignments submitted/passed by the user
  const [submittedRow] = await db("assignment_submissions as s")
    .join("tutorial_assignments as a", "s.assignment_id", "a.id")
    .where("a.tutorial_id", tutorialId)
    .where("s.user_id", userId)
    .where("s.grade", ">=", 60)
    .count("s.id as count");

  const passedAssignments = parseInt(submittedRow?.count, 10) || 0;

  return passedAssignments >= totalAssignments;
};

// Check if certificate already exists
const buildTemplateAwareQuery = () => {
  const query = db("certificates");
  applyTemplateJoin(query);
  return query.select("certificates.*", ...TEMPLATE_SELECT_FIELDS);
};

const findExisting = async (userId, tutorialId) => {
  const row = await buildTemplateAwareQuery()
    .where("certificates.user_id", userId)
    .where("certificates.tutorial_id", tutorialId)
    .first();

  return formatCertificateRow(row);
};

const findById = async (id) => {
  const row = await buildTemplateAwareQuery()
    .where("certificates.id", id)
    .first();

  return formatCertificateRow(row);
};

const resolveTemplateId = async (templateId) => {
  if (templateId) return templateId;
  const template = await templateService.getActiveTemplate();
  return template?.id || null;
};

// Create a new certificate
const issueCertificate = async ({ userId, tutorialId, templateId = null }) => {
  const resolvedTemplateId = await resolveTemplateId(templateId);

  const newCert = {
    id: uuidv4(),
    user_id: userId,
    tutorial_id: tutorialId,
    class_id: null,
    template_id: resolvedTemplateId,
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
  findById,
  issueCertificate,
};
