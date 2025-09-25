import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CacheManager from '@/components/pwa/CacheManager';
import { clearCache as mockClearCache } from '../../services/admin/cacheService';

jest.mock('../../services/admin/cacheService', () => ({
  clearCache: jest.fn(),
}));

const translationMap = {
  'cache_clear_success': 'Cache cleared successfully',
  'cache_clear_server_only': 'Browser cache unavailable; server cache cleared',
  'cache_clear_failed': 'Failed to clear cache',
};

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key) => translationMap[key] || key,
  }),
}));
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const { toast } = require('react-toastify');

var toastMock;

jest.mock('react-toastify', () => {
  toastMock = { success: jest.fn(), error: jest.fn() };
  return { toast: toastMock };
});

const setupEnvironment = () => {
  Object.defineProperty(window, 'caches', {
    value: { delete: jest.fn().mockResolvedValue(true) },
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: { ready: Promise.resolve({}), controller: {} },
    configurable: true,
  });
};

describe('CacheManager', () => {
  beforeEach(() => {
    setupEnvironment();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete window.caches;
    delete window.navigator.serviceWorker;
  });

  it('shows message when cache cleared', async () => {
    mockClearCache.mockResolvedValue({});
    render(<CacheManager />);
    const button = await screen.findByText('Clear Cache');
    fireEvent.click(button);
    await waitFor(() => expect(mockClearCache).toHaveBeenCalled());
    await screen.findByText('Cache cleared');
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Cache cleared')
    );
  });

  it('shows error message when clearing cache fails', async () => {
    mockClearCache.mockRejectedValue(new Error('fail'));
    render(<CacheManager />);
    const button = await screen.findByText('Clear Cache');
    fireEvent.click(button);
    await screen.findByText('Failed to clear cache');
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to clear cache')
    );
  });

  it('falls back to server cache clearing when Cache API is unavailable', async () => {
    delete window.caches;
    mockClearCache.mockResolvedValue({});
    render(<CacheManager />);
    const button = await screen.findByText('Clear Cache');
    fireEvent.click(button);
    await waitFor(() => expect(mockClearCache).toHaveBeenCalled());
    await screen.findByText('Browser cache unavailable; server cache cleared');
    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith(
        'Browser cache unavailable; server cache cleared'
      )
    );
  });
});
