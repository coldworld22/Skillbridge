import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CacheManager from '@/components/pwa/CacheManager';
import { clearCache as mockClearCache } from '../../services/admin/cacheService';
import { toast } from 'react-toastify';

jest.mock('../../services/admin/cacheService', () => ({
  clearCache: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('next-i18next', () => ({
  i18n: { t: (key: string) => key },
}));

const setupEnvironment = () => {
  Object.defineProperty(window, 'caches', {
    value: { delete: jest.fn().mockResolvedValue(true) },
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: { ready: Promise.resolve({}) },
    configurable: true,
  });
};

describe('CacheManager', () => {
  beforeEach(() => {
    setupEnvironment();
    (mockClearCache as jest.Mock).mockReset();
    (toast.success as jest.Mock).mockReset();
    (toast.error as jest.Mock).mockReset();
  });

  it('shows success toast when cache cleared', async () => {
    (mockClearCache as jest.Mock).mockResolvedValue({});
    render(<CacheManager />);
    const button = await screen.findByText('Clear Cache');
    fireEvent.click(button);
    await waitFor(() => expect(mockClearCache).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('dashboard.cache_cleared');
  });

  it('shows error toast when clearing cache fails', async () => {
    (mockClearCache as jest.Mock).mockRejectedValue(new Error('fail'));
    render(<CacheManager />);
    const button = await screen.findByText('Clear Cache');
    fireEvent.click(button);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('dashboard.cache_clear_failed'));
  });
});
