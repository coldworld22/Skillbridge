import { render, screen } from '@testing-library/react';
import AdAnalyticsPage from '../../pages/dashboard/admin/ads/analytics/[id]';

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ query: { id: '1' }, push: jest.fn() })
}));

jest.mock('../../components/layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock('../../components/common/PageHead', () => ({
  __esModule: true,
  default: () => null,
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('AdAnalyticsPage device rendering', () => {
  it('shows user agents with view counts', () => {
    const ad = {
      title: 'Ad',
      description: '',
      targetRoles: [],
      startAt: '',
      endAt: '',
      adType: '',
      isActive: true,
      image: '',
      views: 0,
      ctr: 0,
      conversions: 0,
      reach: 0,
      analytics: [],
      locationStats: [],
      devices: [
        { user_agent: 'Chrome', views: 12 },
        { user_agent: 'Firefox', views: 5 }
      ]
    };

    render(<AdAnalyticsPage ad={ad} />);
    expect(screen.getByText('Chrome (12), Firefox (5)')).toBeInTheDocument();
  });
});
