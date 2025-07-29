import useSEOConfigStore from '@/store/seoConfigStore';
import { act } from '@testing-library/react';

jest.mock('../../services/admin/seoConfigService', () => ({
  fetchSEOConfig: jest.fn(async () => ({ metaTags: { '/': { title: 'Home' } } })),
  regenerateSitemap: jest.fn(async () => ({ updated: 'now' })),
  scanMetaIssues: jest.fn(async () => ({ stats: { pagesMissingMeta: 1 }, scannedAt: 'now' })),
  fetchPageList: jest.fn(async () => ['/','/about'])
}));

beforeEach(() => {
  const { clear } = useSEOConfigStore.getState();
  clear();
  window.localStorage.clear();
});

test('fetch loads settings', async () => {
  const { fetch } = useSEOConfigStore.getState();
  await act(async () => {
    await fetch();
  });
  const { settings, loaded } = useSEOConfigStore.getState();
  expect(loaded).toBe(true);
  expect(settings.metaTags['/'].title).toBe('Home');
});

test('update merges settings', () => {
  const { update } = useSEOConfigStore.getState();
  act(() => {
    update({ metaTags: { '/': { description: 'desc' } } });
  });
  const { settings } = useSEOConfigStore.getState();
  expect(settings.metaTags['/'].description).toBe('desc');
});

test('regenerate sets sitemapUpdated', async () => {
  const { regenerate } = useSEOConfigStore.getState();
  await act(async () => {
    await regenerate();
  });
  const { settings } = useSEOConfigStore.getState();
  expect(settings.sitemapUpdated).toBe('now');
});

test('scan updates stats', async () => {
  const { scan } = useSEOConfigStore.getState();
  await act(async () => {
    await scan();
  });
  const { settings } = useSEOConfigStore.getState();
  expect(settings.stats.pagesMissingMeta).toBe(1);
  expect(settings.lastChecked).toBe('now');
});

test('fetchPages loads page list', async () => {
  const { fetchPages } = useSEOConfigStore.getState();
  await act(async () => {
    await fetchPages();
  });
  const { pages } = useSEOConfigStore.getState();
  expect(pages).toEqual(['/', '/about']);
});
