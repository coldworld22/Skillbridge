import { computeUnreadCounts } from '@/pages/messages/utils';

describe('computeUnreadCounts', () => {
  it('updates user unread counts when new messages arrive', () => {
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];

    // Start with no messages
    let updated = computeUnreadCounts(users, []);
    expect(updated.find(u => u.id === 1).unreadMessages).toBe(0);
    expect(updated.find(u => u.id === 2).unreadMessages).toBe(0);

    // Add an unread message from Alice
    const messages = [
      { id: 10, sender_id: 1, read: false },
    ];

    updated = computeUnreadCounts(users, messages);
    const alice = updated.find(u => u.id === 1);
    const bob = updated.find(u => u.id === 2);

    expect(alice.unreadMessages).toBe(1);
    expect(alice.unread).toBe(1);
    expect(bob.unreadMessages).toBe(0);
  });
});
