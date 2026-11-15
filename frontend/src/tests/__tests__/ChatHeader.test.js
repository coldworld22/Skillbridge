import { render, screen } from '@testing-library/react';
import ChatHeader from '@/components/chat/ChatHeader';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

test('omits the last active label when lastActive is missing', () => {
  const chat = {
    id: 1,
    name: 'Test User',
    isGroup: false,
    isOnline: false,
    profileImage: '/avatar.png',
  };

  render(<ChatHeader selectedChat={chat} />);
  expect(screen.getByText('Test User')).toBeInTheDocument();
  expect(screen.queryByText(/Last active/)).not.toBeInTheDocument();
});

test('shows the last active label when lastActive is set', () => {
  const chat = {
    id: 1,
    name: 'Test User',
    isGroup: false,
    isOnline: false,
    profileImage: '/avatar.png',
    lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  };

  render(<ChatHeader selectedChat={chat} />);
  expect(screen.getByText(/Last active/)).toBeInTheDocument();
});

