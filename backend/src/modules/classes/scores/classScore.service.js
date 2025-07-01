const db = require('../../../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateCode } = require('../../users/tutorials/certificate/certificate.service');

const getPolicy = async (classId) => {
  const existing = await db('class_scoring_policies').where({ class_id: classId }).first();
  if (existing) return existing;
  const [row] = await db('class_scoring_policies').insert({ class_id: classId }).returning('*');
  return row;
};

const setPolicy = async (classId, data) => {
  const existing = await db('class_scoring_policies').where({ class_id: classId }).first();
  if (existing) {
    const [row] = await db('class_scoring_policies').where({ class_id: classId }).update(data).returning('*');
    return row;
  }
  const [row] = await db('class_scoring_policies').insert({ class_id: classId, ...data }).returning('*');
  return row;
};

const saveStudentScore = async (classId, studentId, data) => {
  const existing = await db('student_class_scores').where({ class_id: classId, student_id: studentId }).first();
  if (existing) {
    const [row] = await db('student_class_scores')
      .where({ class_id: classId, student_id: studentId })
      .update(data)
      .returning('*');
    return row;
  }
  const [row] = await db('student_class_scores')
    .insert({ class_id: classId, student_id: studentId, ...data })
    .returning('*');
  return row;
};

const calculateForStudent = async (classId, studentId) => {
  const policy = await getPolicy(classId);
  const avgRes = await db('assignment_submissions as s')
    .join('class_assignments as a', 's.assignment_id', 'a.id')
    .where('a.class_id', classId)
    .where('s.user_id', studentId)
    .avg('s.grade as avg')
    .first();
  const assignmentAvg = parseFloat(avgRes?.avg) || 0;

  const lessonIds = await db('class_lessons').where({ class_id: classId }).pluck('id');
  const totalLessons = lessonIds.length;
  let attendancePercent = 0;
  if (totalLessons > 0) {
    const countRes = await db('class_attendance')
      .whereIn('lesson_id', lessonIds)
      .andWhere({ user_id: studentId, attended: true })
      .count('* as cnt')
      .first();
    attendancePercent = (parseInt(countRes.cnt, 10) / totalLessons) * 100;
  }

  const finalExamScore = 0;
  const totalScore = Math.round(
    assignmentAvg * (policy.assignment_weight / 100) +
      attendancePercent * (policy.attendance_weight / 100) +
      finalExamScore * (policy.final_exam_weight / 100),
  );
  const passed = totalScore >= policy.pass_score;

  await saveStudentScore(classId, studentId, {
    assignment_score: Math.round(assignmentAvg),
    attendance_score: Math.round(attendancePercent),
    final_exam_score: finalExamScore,
    total_score: totalScore,
    passed,
  });

  return getStudentScore(classId, studentId);
};

const calculateForClass = async (classId) => {
  const enrollments = await db('class_enrollments as ce')
    .join('users as u', 'ce.user_id', 'u.id')
    .where('ce.class_id', classId)
    .select('u.id as user_id', 'u.full_name');
  const results = [];
  for (const enr of enrollments) {
    const score = await calculateForStudent(classId, enr.user_id);
    results.push({ ...score, student_id: enr.user_id, full_name: enr.full_name });
  }
  return results;
};

const getStudentScore = async (classId, studentId) => {
  const row = await db('student_class_scores as scs')
    .leftJoin('certificates as c', function () {
      this.on('c.class_id', '=', 'scs.class_id').andOn('c.user_id', '=', 'scs.student_id');
    })
    .where('scs.class_id', classId)
    .andWhere('scs.student_id', studentId)
    .select('scs.*', 'c.id as certificate_id')
    .first();
  return row;
};

const issueCertificate = async (classId, studentId) => {
  let cert = await db('certificates').where({ class_id: classId, user_id: studentId }).first();
  if (cert) return cert;

  const score = await getStudentScore(classId, studentId);
  if (!score || !score.passed) {
    throw new Error('Student has not passed');
  }
  cert = {
    id: uuidv4(),
    user_id: studentId,
    class_id: classId,
    tutorial_id: null,
    template_id: null,
    certificate_code: generateCode().replace('TUT', 'CLS'),
    status: 'issued',
  };
  await db('certificates').insert(cert);
  await db('student_class_scores')
    .where({ class_id: classId, student_id: studentId })
    .update({ certificate_issued: true, issued_at: db.fn.now() });
  return cert;
};

module.exports = {
  getPolicy,
  setPolicy,
  calculateForClass,
  calculateForStudent,
  getStudentScore,
  issueCertificate,
};
