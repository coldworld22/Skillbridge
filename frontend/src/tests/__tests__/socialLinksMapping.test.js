import { toSocialLinksArray } from '@/utils/socialLinks';

describe('toSocialLinksArray', () => {
  test('maps admin social links to array', () => {
    const links = { twitter: 'https://x.com/user', facebook: '' };
    expect(toSocialLinksArray(links)).toEqual([
      { platform: 'twitter', url: 'https://x.com/user' },
    ]);
  });

  test('maps instructor social links to array', () => {
    const links = { github: 'https://github.com/test' };
    expect(toSocialLinksArray(links)).toEqual([
      { platform: 'github', url: 'https://github.com/test' },
    ]);
  });

  test('maps student social links to array and ignores blanks', () => {
    const links = { linkedin: 'https://linkedin.com/in/test', website: '   ' };
    expect(toSocialLinksArray(links)).toEqual([
      { platform: 'linkedin', url: 'https://linkedin.com/in/test' },
    ]);
  });
});
