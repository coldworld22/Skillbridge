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
    info: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('next-i18next', () => ({
  i18n: {
    t: (key) =>
      ({
        'dashboard.cache_cleared': 'Cache cleared',
        'dashboard.cache_cleared_server_only':
          'Browser cache unavailable; server cache cleared',
        'dashboard.cache_cleared_server_only_hint':
          'Server cache cleared. Browser cache was not available.',
        'dashboard.cache_clear_failed': 'Failed to clear cache',
      }[key] ?? key),
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
    mockClearCache.mockReset();
    toast.success.mockClear();
    toast.info.mockClear();
    toast.error.mockClear();
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
    expect(toast.success).toHaveBeenCalledWith('Cache cleared');
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('shows error message when clearing cache fails', async () => {
    mockClearCache.mockRejectedValue(new Error('fail'));
    render(<CacheManager />);
    const button = await screen.findByText('Clear Cache');
    fireEvent.click(button);
    await screen.findByText('Failed to clear cache');
    expect(toast.error).toHaveBeenCalledWith('Failed to clear cache');
  });

  it('falls back to server cache clearing when Cache API is unavailable', async () => {
    delete window.caches;
    mockClearCache.mockResolvedValue({});
    render(<CacheManager />);
    const button = await screen.findByText('Clear Cache');
    fireEvent.click(button);
    await waitFor(() => expect(mockClearCache).toHaveBeenCalled());
    await screen.findByText('Browser cache unavailable; server cache cleared');
    expect(toast.success).toHaveBeenCalledWith(
      'Browser cache unavailable; server cache cleared'
    );
    expect(toast.info).toHaveBeenCalledWith(
      'Server cache cleared. Browser cache was not available.'
    );
  });
});
