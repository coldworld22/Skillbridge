const React = require('react');
const { render, screen } = require('@testing-library/react');

describe('social platform icon fallbacks', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('renders fallback icon when an unknown platform is provided', () => {
    jest.isolateModules(() => {
      jest.doMock('@shared/socialPlatforms.json', () => ['linkedin', 'mystery'], { virtual: true });

      const { allowedPlatforms, defaultPlatformIcon } = require('@/utils/socialPlatforms');
      const SocialLinksSection = require('@/components/instructor/profile/SocialLinksSection').default;

      const fallbackEntry = allowedPlatforms.find((platform) => platform.name === 'mystery');
      expect(fallbackEntry).toBeDefined();
      expect(fallbackEntry.Icon).toBe(defaultPlatformIcon.Icon);
      expect(fallbackEntry.className).toBe(defaultPlatformIcon.className);

      render(
        <SocialLinksSection socialLinks={{}} onChange={() => {}} t={(value) => value} />
      );

      expect(screen.getByText('Mystery')).toBeInTheDocument();
      expect(screen.getAllByRole('textbox')).toHaveLength(2);
    });
  });
});
