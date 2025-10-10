export const computeUnreadCounts = (list = [], messages = []) => {
  if (!Array.isArray(list)) return list;

  const counts = messages.reduce((acc, msg) => {
    if (msg && !msg.read) {
      const senderId = Number(msg.sender_id);
      if (!Number.isNaN(senderId)) {
        acc[senderId] = (acc[senderId] || 0) + 1;
      }
    }
    return acc;
  }, {});

  return list.map((user) => {
    const unread = counts[user.id] || 0;
    return {
      ...user,
      unread,
      unreadMessages: unread,
    };
  });
};

export default computeUnreadCounts;
