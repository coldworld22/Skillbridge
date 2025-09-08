import { render, screen } from '@testing-library/react';

jest.mock('next/router', () => ({
  useRouter: () => ({ query: { id: '1' } }),
}));

jest.mock('../../hooks/withAuthProtection', () => (Component) => Component);

jest.mock('../../components/layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { dir: () => 'ltr' } }),
}));

const mockFetch = jest.fn();
jest.mock('../../services/admin/classService', () => ({
  fetchAdminClassById: (...args) => mockFetch(...args),
}));

import AdminClassDetailPage from '@/pages/dashboard/admin/online-classes/[id]';

test('sanitizes class description before rendering', async () => {
  const dirty = '<p>Safe</p><script>alert("x")</script><img src=x onerror=alert(1) />';
  mockFetch.mockResolvedValue({ description: dirty });

  render(<AdminClassDetailPage />);
  const paragraph = await screen.findByText('Safe');
  const html = paragraph.closest('.prose').innerHTML;

  expect(html).toContain('<p>Safe</p>');
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('onerror');
});
