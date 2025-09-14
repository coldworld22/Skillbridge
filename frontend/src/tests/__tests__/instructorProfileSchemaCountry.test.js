import { ZodError } from 'zod';
import { instructorProfileSchema } from '@/pages/dashboard/instructor/profile/edit';
import { getUserCountry } from '../../utils/getUserCountry';

jest.mock('../../utils/getUserCountry');

describe('instructorProfileSchema country-specific phone validation', () => {
  const base = {
    full_name: 'John Doe',
    gender: 'male',
    date_of_birth: '1990-01-01',
    experience: 1,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('client-side uses user country over fallback', () => {
    getUserCountry.mockReturnValue('GB');
    const user = { country: 'US' };
    const schema = instructorProfileSchema(user.country || getUserCountry());

    expect(() =>
      schema.parse({ ...base, phone: '4155552671' })
    ).not.toThrow();

    expect(() =>
      schema.parse({ ...base, phone: '07911123456' })
    ).toThrow(ZodError);
  });

  test('SSR uses fallback country when user country is missing', () => {
    getUserCountry.mockReturnValue('GB');
    const user = { country: undefined };
    const schema = instructorProfileSchema(user.country || getUserCountry());

    expect(() =>
      schema.parse({ ...base, phone: '07911123456' })
    ).not.toThrow();

    expect(() =>
      schema.parse({ ...base, phone: '4155552671' })
    ).toThrow(ZodError);
  });
});
