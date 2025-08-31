import { render, screen } from '@testing-library/react';
import ChatHeader from '@/components/chat/ChatHeader';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

test('renders fallback when lastActive is missing', () => {
  const chat = {
    id: 1,
    name: 'Test User',
    isGroup: false,
    isOnline: false,
    profileImage: '/avatar.png',
  };

  render(<ChatHeader selectedChat={chat} />);
  expect(screen.getByText(/Last active/)).toBeInTheDocument();
});

