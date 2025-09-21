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

  test('ignores nullish or non-string social link values without throwing', () => {
    const links = {
      linkedin: null,
      website: undefined,
      github: 0,
    };

    expect(() => toSocialLinksArray(links)).not.toThrow();
    expect(toSocialLinksArray(links)).toEqual([]);
  });

  test('ignores nullish social link values', () => {
    const links = {
      twitter: 'https://x.com/user',
      facebook: null,
      instagram: undefined,
    };

    expect(() => toSocialLinksArray(links)).not.toThrow();
    expect(toSocialLinksArray(links)).toEqual([
      { platform: 'twitter', url: 'https://x.com/user' },
    ]);
  });

  test('ignores non-string social link values', () => {
    const links = {
      twitter: 'https://x.com/user',
      facebook: { handle: 'user' },
      instagram: 1234,
    };

    expect(() => toSocialLinksArray(links)).not.toThrow();
    expect(toSocialLinksArray(links)).toEqual([
      { platform: 'twitter', url: 'https://x.com/user' },
    ]);
  });

  test('admin payload mapping remains stable for valid values', () => {
    const sanitizedData = {
      full_name: 'Admin User',
      email: 'admin@example.com',
      phone: '+14155552671',
      gender: 'female',
      date_of_birth: '1990-01-01',
      job_title: 'Director',
      department: 'Operations',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/admin',
        website: 'https://example.com',
      },
    };

    const social_links = toSocialLinksArray(sanitizedData.socialLinks);

    const payload = {
      full_name: sanitizedData.full_name,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      gender: sanitizedData.gender,
      date_of_birth: sanitizedData.date_of_birth,
      job_title: sanitizedData.job_title,
      department: sanitizedData.department,
      social_links,
    };

    expect(payload).toEqual({
      full_name: 'Admin User',
      email: 'admin@example.com',
      phone: '+14155552671',
      gender: 'female',
      date_of_birth: '1990-01-01',
      job_title: 'Director',
      department: 'Operations',
      social_links: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/admin' },
        { platform: 'website', url: 'https://example.com' },
      ],
    });
  });
});
