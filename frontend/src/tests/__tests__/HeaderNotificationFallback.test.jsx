import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/dashboard/Header';
import LinkText from '@/components/shared/LinkText';

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/dashboard/student',
    query: {},
    push: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(function MockLink({ children, href, ...rest }, ref) {
      return React.createElement('a', { href, ref, ...rest }, children);
    }),
  };
});

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

jest.mock('react-toastify', () => ({
  toast: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key,
  }),
}));

jest.mock('@/services/instructor/instructorService', () => ({
  toggleInstructorStatus: jest.fn(),
}));

jest.mock('@/components/shared/LinkText', () => {
  const React = require('react');
  const mockComponent = jest.fn(({ text }) => <span data-testid="link-text">{text}</span>);
  return {
    __esModule: true,
    default: mockComponent,
  };
});

jest.mock('@/store/notifications/notificationStore', () => {
  const store = {
    items: [
      { id: 1, read: false, message: undefined },
      { id: 2, read: false, message: 'https://example.com' },
    ],
    fetch: jest.fn().mockResolvedValue(),
    startPolling: jest.fn(),
    stopPolling: jest.fn(),
    markRead: jest.fn(),
  };
  const useStore = jest.fn((selector = (s) => s) => selector(store));
  useStore.getState = () => store;
  useStore.setState = (partial) => {
    const value = typeof partial === 'function' ? partial(store) : partial;
    Object.assign(store, value);
  };
  return {
    __esModule: true,
    default: useStore,
  };
});

jest.mock('@/store/messages/messageStore', () => {
  const store = {
    items: [],
    fetch: jest.fn().mockResolvedValue(),
    startPolling: jest.fn(),
    stopPolling: jest.fn(),
    markRead: jest.fn(),
  };
  const useStore = jest.fn((selector = (s) => s) => selector(store));
  useStore.getState = () => store;
  useStore.setState = (partial) => {
    const value = typeof partial === 'function' ? partial(store) : partial;
    Object.assign(store, value);
  };
  return {
    __esModule: true,
    default: useStore,
  };
});

jest.mock('@/store/auth/authStore', () => {
  const store = {
    user: { role: 'student', is_online: true },
    hasHydrated: true,
    logout: jest.fn(),
    setUser: jest.fn(),
  };
  const useStore = jest.fn((selector = (s) => s) => selector(store));
  useStore.getState = () => store;
  useStore.setState = (partial) => {
    const value = typeof partial === 'function' ? partial(store) : partial;
    Object.assign(store, value);
  };
  return {
    __esModule: true,
    default: useStore,
  };
});

jest.mock('@/store/appConfigStore', () => {
  const store = {
    settings: {},
    fetch: jest.fn().mockResolvedValue(),
  };
  const useStore = jest.fn((selector = (s) => s) => selector(store));
  useStore.getState = () => store;
  useStore.setState = (partial) => {
    const value = typeof partial === 'function' ? partial(store) : partial;
    Object.assign(store, value);
  };
  return {
    __esModule: true,
    default: useStore,
  };
});

describe('Header notification rendering', () => {
  it('renders fallback message when notification message is missing', () => {
    render(<Header />);

    fireEvent.click(screen.getByLabelText('Toggle notifications'));

    expect(LinkText).toHaveBeenCalledTimes(1);
    expect(LinkText.mock.calls[0][0]).toEqual({ text: 'https://example.com' });
    expect(screen.getByText('Notification')).toBeInTheDocument();
  });
});
