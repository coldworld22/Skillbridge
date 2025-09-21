import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CacheManager from '@/components/pwa/CacheManager';
import { clearCache as mockClearCache } from '../../services/admin/cacheService';

jest.mock('../../services/admin/cacheService', () => ({
  clearCache: jest.fn(),
}));
jest.mock('next-i18next', () => ({
  i18n: { t: (key) => key },
}));

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
  });

  it('shows error message when clearing cache fails', async () => {
    mockClearCache.mockRejectedValue(new Error('fail'));
    render(<CacheManager />);
    const button = await screen.findByText('Clear Cache');
    fireEvent.click(button);
    await screen.findByText('Failed to clear cache');
  });

  it('disables warm cache when service worker unavailable', async () => {
    mockClearCache.mockResolvedValue({});
    delete window.navigator.serviceWorker;
    render(<CacheManager strategy="B" />);
    const warmButton = await screen.findByText('Warm Cache');
    expect(warmButton).toBeDisabled();
  });

  it('clears server cache even when Cache API unavailable', async () => {
    mockClearCache.mockResolvedValue({});
    delete window.caches;
    render(<CacheManager />);
    const button = await screen.findByText('Clear Cache');
    fireEvent.click(button);
    await waitFor(() => expect(mockClearCache).toHaveBeenCalled());
    await screen.findByText('Server cache cleared. Browser cache unavailable.');
  });
});
