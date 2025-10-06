import React from 'react';
import { render, waitFor } from '@testing-library/react';
import AdminClassesTable from '../AdminClassesTable';

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }) => <a>{children}</a>,
}));

jest.mock('@/services/admin/classService', () => ({
  fetchAdminClasses: jest.fn(() => {
    const error = new Error('Forbidden');
    error.response = { status: 403 };
    return Promise.reject(error);
  }),
}));

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn(), success: jest.fn(), warn: jest.fn() },
}));

jest.mock('@/store/notifications/notificationStore', () => () => ({ fetch: jest.fn() }));
jest.mock('@/store/messages/messageStore', () => () => ({ fetch: jest.fn() }));

const mockUser = { id: 1, permissions: ['ADD_ONLINE_CLASS_RULE'] };

const storeState = {
  user: mockUser,
  accessToken: 'token',
  hasHydrated: true,
  setState: (partial) => Object.assign(storeState, partial),
};

const useAuthStoreMock = jest.fn((selector = (state) => state) => selector(storeState));
useAuthStoreMock.getState = () => storeState;

jest.mock('@/store/auth/authStore', () => {
  const store = (selector) => useAuthStoreMock(selector || ((state) => state));
  store.getState = () => storeState;
  return store;
});

describe('AdminClassesTable', () => {
  it('handles forbidden response without crashing', async () => {
    render(<AdminClassesTable />);
    await waitFor(() => {
      const message = document.body.textContent;
      if (!message?.includes('Unable to load classes')) {
        throw new Error('Auth error message not rendered yet');
      }
    });
  });
});
