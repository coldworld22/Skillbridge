import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '@/pages/auth/login';
import useAuthStore from '@/store/auth/authStore';
import useNotificationStore from '@/store/notifications/notificationStore';
import useAppConfigStore from '@/store/appConfigStore';

jest.mock('../../services/socialLoginService', () => ({
  fetchSocialLoginConfig: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const loginMock = jest.fn().mockResolvedValue({ profile_complete: true, role: 'student' });

jest.mock('../../shared/components/auth/BackgroundAnimation', () => () => <div />);

jest.mock('react-google-recaptcha-v3', () => ({
  GoogleReCaptchaProvider: ({ children }) => children,
  useGoogleReCaptcha: () => ({ executeRecaptcha: jest.fn() }),
}));

const { fetchSocialLoginConfig: fetchCfg } = require('../../services/socialLoginService');

describe('Login reCAPTCHA config', () => {
  beforeEach(() => {
    loginMock.mockClear();
    fetchCfg.mockReset();
    useAuthStore.setState({ user: null, login: loginMock, hasHydrated: true, accessToken: null, logout: jest.fn() });
    useNotificationStore.setState({ fetch: jest.fn() });
    useAppConfigStore.setState({ settings: {}, fetch: jest.fn() });
  });

  it('re-fetches config on submit after initial failure', async () => {
    fetchCfg
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ recaptcha: { active: false } });

    render(<Login />);

    await waitFor(() => expect(fetchCfg).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(fetchCfg).toHaveBeenCalledTimes(2));
    expect(loginMock).toHaveBeenCalled();
  });
});
