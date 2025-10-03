import { act, fireEvent, render, waitFor } from '@testing-library/react';
import SeoTags from '@/components/common/SeoTags';
import useSEOConfigStore from '@/store/seoConfigStore';

jest.mock('next/router', () => ({
  useRouter: () => ({ asPath: '/', locale: 'en', locales: ['en'], defaultLocale: 'en' }),
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { options: { locales: ['en'] } },
  }),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

beforeEach(() => {
  useSEOConfigStore.persist?.clearStorage();
  if (useSEOConfigStore.persist?.hasHydrated) {
    useSEOConfigStore.persist.hasHydrated = () => true;
  }
  useSEOConfigStore.setState({
    fetch: jest.fn(),
    retry: jest.fn(),
    loading: false,
    failed: false,
    loaded: true,
    error: null,
    settings: { metaTags: {}, openGraph: {}, twitter: {}, jsonSchema: '' },
  }, true);
});

test('rejects malformed json schema input', () => {
  useSEOConfigStore.setState((s) => ({
    ...s,
    settings: { ...s.settings, jsonSchema: '</script><script>alert(1)</script>' },
  }));
  const { container } = render(<SeoTags />);
  expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
});

test('preserves additional json schema fields and sanitizes output', async () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SkillBridge',
    description: 'A <great> & inclusive place',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Example <Street>',
      addressLocality: 'Sample City',
    },
    sameAs: ['https://twitter.com/skillbridge'],
  };

  useSEOConfigStore.setState((s) => ({
    ...s,
    settings: {
      ...s.settings,
      jsonSchema: JSON.stringify(schema),
    },
  }));

  const { container } = render(<SeoTags />);
  await waitFor(() => {
    expect(container.querySelector('script[type="application/ld+json"]')).not.toBeNull();
  });
  const script = container.querySelector('script[type="application/ld+json"]');
  const scriptContent = script.textContent;
  expect(scriptContent).not.toContain('<');
  expect(scriptContent).not.toContain('>');
  expect(scriptContent).toContain('\\u003c');
  expect(scriptContent).toContain('\\u0026');

  const parsed = JSON.parse(scriptContent);
  expect(parsed.description).toBe(schema.description);
  expect(parsed.address.streetAddress).toBe(schema.address.streetAddress);
  expect(parsed.sameAs).toEqual(schema.sameAs);
});

test('does not fetch again when loading failed', () => {
  const fetchMock = jest.fn();
  useSEOConfigStore.setState((s) => ({
    ...s,
    fetch: fetchMock,
    loaded: false,
    failed: true,
    loading: false,
    error: 'Network error',
  }));

  render(<SeoTags />);

  expect(fetchMock).not.toHaveBeenCalled();
});

test('renders retry UI when loading fails', () => {
  const retryMock = jest.fn();
  useSEOConfigStore.setState((s) => ({
    ...s,
    loaded: false,
    failed: true,
    loading: false,
    error: 'Network error',
    retry: retryMock,
  }));

  const { getByRole, rerender } = render(<SeoTags />);

  expect(getByRole('alert')).toHaveTextContent('Network error');
  const button = getByRole('button', { name: /retry/i });
  expect(button).toBeEnabled();

  fireEvent.click(button);
  expect(retryMock).toHaveBeenCalled();

  // fallback when error cleared
  act(() => {
    useSEOConfigStore.setState((s) => ({ ...s, error: null }));
  });
  rerender(<SeoTags />);
  expect(getByRole('alert')).toHaveTextContent('Unable to load SEO settings.');
});

