const db = require('../../../../config/database');

exports.getByTutorial = async (tutorial_id) => {
  return db('tutorial_assignments')
    .where({ tutorial_id })
    .orderBy('created_at', 'asc');
};

exports.getById = async (id) => {
  return db('tutorial_assignments').where({ id }).first();
};

exports.createAssignment = async (data) => {
  const [row] = await db('tutorial_assignments').insert(data).returning('*');
  return row;
};

exports.updateAssignment = async (id, data) => {
  const [row] = await db('tutorial_assignments').where({ id }).update(data).returning('*');
  return row;
};

exports.deleteAssignment = async (id) => {
  return db('tutorial_assignments').where({ id }).del();
};

exports.getAllAssignments = async () => {
  return db('tutorial_assignments as a')
    .leftJoin('tutorials as t', 'a.tutorial_id', 't.id')
    .leftJoin('users as u', 't.instructor_id', 'u.id')
    .select(
      'a.id',
      'a.title',
      'a.description',
      'a.due_date',
      'a.tutorial_id',
      't.title as tutorial_title',
      'u.full_name as instructor'
    )
    .orderBy('a.created_at', 'desc');
};

exports.getAssignmentWithTutorial = async (id) => {
  return db('tutorial_assignments as a')
    .leftJoin('tutorials as t', 'a.tutorial_id', 't.id')
    .leftJoin('users as u', 't.instructor_id', 'u.id')
    .select(
      'a.*',
      't.title as tutorial_title',
      't.description as tutorial_description',
      't.cover_image as tutorial_cover_image',
      't.instructor_id',
      'u.full_name as instructor_name'
    )
    .where('a.id', id)
    .first();
};
