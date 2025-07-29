let discussions = [
  {
    id: '1',
    title: 'How to use useEffect in React?',
    content: "I'm struggling to understand the use cases for useEffect.",
    tags: ['React', 'Hooks'],
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Best practices for database indexing?',
    content: 'What are the best indexing strategies for MySQL?',
    tags: ['Database', 'MySQL'],
    created_at: new Date().toISOString(),
  },
];

exports.listDiscussions = async () => discussions;

exports.getDiscussion = async (id) => discussions.find((d) => d.id === id);

// Utility for tests to reset data
exports.__setDiscussions = (data) => {
  discussions = data;
};

const { v4: uuidv4 } = require('uuid');
const notificationService = require('../../notifications/notifications.service');
const messageService = require('../../messages/messages.service');
const userModel = require('../../users/user.model');
const emailUtil = require('../../../utils/email');

async function notifyAllUsers(discussion) {
  const admins = await userModel.findAdmins();
  const instructors = await userModel.findInstructors();
  const students = await userModel.findStudents();
  const sender = admins[0];
  const ids = [
    ...admins.map((a) => a.id),
    ...instructors.map((i) => i.id),
    ...students.map((s) => s.id),
  ].filter((id) => id !== discussion.user_id);

  const message = `New question posted: ${discussion.title}`;

  for (const id of ids) {
    await notificationService.createNotification({
      user_id: id,
      type: 'community',
      message,
    });
    if (sender) {
      await messageService.createMessage({
        sender_id: sender.id,
        receiver_id: id,
        message,
      });
    }
    const info = await userModel.findContactInfo(id);
    if (info?.email) {
      await emailUtil.sendNewDiscussionEmail(
        info.email,
        discussion.user_name,
        discussion.title
      );
    }
  }
}

exports.createDiscussion = async (data) => {
  const disc = {
    id: uuidv4(),
    user_id: data.user_id,
    user_name: data.user_name,
    title: data.title,
    content: data.content,
    tags: data.tags || [],
    created_at: new Date().toISOString(),
  };
  discussions.push(disc);
  await notifyAllUsers(disc);
  return disc;
};
