import { render } from '@testing-library/react';
import SeoTags from '@/components/common/SeoTags';
import useSEOConfigStore from '@/store/seoConfigStore';

jest.mock('next/router', () => ({
  useRouter: () => ({ asPath: '/', locale: 'en', locales: ['en'], defaultLocale: 'en' }),
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ i18n: { options: { locales: ['en'] } } }),
}));

beforeEach(() => {
  useSEOConfigStore.persist?.clearStorage();
  useSEOConfigStore.setState({
    fetch: jest.fn(),
    loaded: true,
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

test('rejects schema with unexpected fields', () => {
  useSEOConfigStore.setState((s) => ({
    ...s,
    settings: {
      ...s.settings,
      jsonSchema: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'SkillBridge',
        url: 'https://example.com',
        evil: 'true',
      }),
    },
  }));
  const { container } = render(<SeoTags />);
  expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
});

