import { render, screen } from '@testing-library/react';
import PopupAnnouncement from '../../components/common/PopupAnnouncement';
import useAuthStore from '../../store/auth/authStore';

jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/' }),
}));

const mockGet = jest.fn();
jest.mock('../../services/api/api', () => ({
  get: (...args) => mockGet(...args),
}));

test('sanitizes popup message before rendering', async () => {
  const dirty = '<p>Safe</p><img src=x onerror="alert(1)" /><script>alert(1)</script>';
  mockGet.mockResolvedValue({ data: { data: [{ id: 1, message: dirty, once_per_session: false }] } });
  useAuthStore.setState({ user: null });

  render(<PopupAnnouncement />);
  const paragraph = await screen.findByText('Safe');
  const html = paragraph.parentElement.innerHTML;

  expect(html).toContain('<p>Safe</p>');
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('onerror');
});
