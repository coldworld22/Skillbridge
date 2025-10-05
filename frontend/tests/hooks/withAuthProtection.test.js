import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import withAuthProtection from '@/hooks/withAuthProtection';

const replaceMock = jest.fn();
const logoutMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock('@/utils/auth/tokenUtils', () => ({
  isTokenExpired: jest.fn(() => false),
}));

let storeState;

const mockUseAuthStore = jest.fn();

jest.mock('@/store/auth/authStore', () => ({
  __esModule: true,
  default: (selector) => {
    const state = mockUseAuthStore();
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  },
}));

const TestComponent = () => <div>protected content</div>;

describe('withAuthProtection permissions', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    logoutMock.mockReset();
    storeState = {
      user: {
        id: 'admin-1',
        role: 'Admin',
        roles: ['Admin'],
        permissions: [],
      },
      accessToken: 'valid.token.value',
      hasHydrated: true,
      logout: logoutMock,
    };

    mockUseAuthStore.mockImplementation(() => storeState);
  });

  afterEach(() => {
    mockUseAuthStore.mockReset();
  });

  it('allows admins with manage_online_classes permission to continue', async () => {
    storeState.user.permissions = ['manage_online_classes'];

    const ProtectedComponent = withAuthProtection(TestComponent, {
      permissions: ['manage_online_classes'],
    });

    render(<ProtectedComponent />);

    await waitFor(() =>
      expect(screen.getByText('protected content')).toBeInTheDocument()
    );

    expect(replaceMock).not.toHaveBeenCalledWith('/error/403');
  });

  it('redirects to 403 when manage_online_classes is missing', async () => {
    const ProtectedComponent = withAuthProtection(TestComponent, {
      permissions: ['manage_online_classes'],
    });

    render(<ProtectedComponent />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/error/403');
    });
  });
});

