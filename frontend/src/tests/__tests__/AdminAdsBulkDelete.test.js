import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminAdsPage from '../../pages/dashboard/admin/ads/index';

jest.mock('next-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../../components/layouts/AdminLayout', () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock('../../components/admin/ads/PreviewModal', () => ({ __esModule: true, default: () => null }));
jest.mock('react-csv', () => ({ CSVLink: ({ children }) => <a>{children}</a> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }) => <a href={href}>{children}</a> }));

const adsMock = [
  { id: 1, title: 'Ad One', description: 'Desc1', isActive: true, targetRoles: [], adType: 'promotion' },
  { id: 2, title: 'Ad Two', description: 'Desc2', isActive: false, targetRoles: [], adType: 'event' },
];

jest.mock('../../services/admin/adService', () => ({
  fetchAds: jest.fn(),
  deleteAd: jest.fn(),
  updateAd: jest.fn(),
}));

describe('AdminAdsPage bulk deletion', () => {
  beforeEach(() => {
    const { fetchAds, deleteAd } = require('../../services/admin/adService');
    fetchAds.mockResolvedValue({ data: adsMock, meta: { total: 2 } });
    deleteAd.mockImplementation((id) =>
      id === 1 ? Promise.resolve() : Promise.reject(new Error('fail'))
    );
  });

  it('reports failures and keeps undeleted ads', async () => {
    render(<AdminAdsPage />);
    await screen.findByText('Ad One');
    fireEvent.click(screen.getByLabelText('Select Ad One'));
    fireEvent.click(screen.getByLabelText('Select Ad Two'));
    window.confirm = jest.fn(() => true);
    fireEvent.click(screen.getByText('delete_selected'));

    await waitFor(() => {
      const { toast } = require('react-toastify');
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Ad Two'));
      expect(toast.success).toHaveBeenCalled();
    });

    expect(screen.queryByText('Ad One')).not.toBeInTheDocument();
    expect(screen.getByText('Ad Two')).toBeInTheDocument();
  });
});
