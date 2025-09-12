import { ZodError } from 'zod';
import { profileSchema as adminProfileSchema } from '@/pages/dashboard/admin/profile/edit';
import { instructorProfileSchema } from '@/pages/dashboard/instructor/profile/edit';
import { studentProfileSchema } from '@/pages/dashboard/student/profile/edit';

describe('profile schema socialLinks URL validation', () => {
  const common = {
    full_name: 'John Doe',
    phone: '+14155552671',
    gender: 'male',
    date_of_birth: '1990-01-01',
  };

  test('admin profile rejects invalid URL', () => {
    const data = {
      ...common,
      email: 'admin@example.com',
      job_title: 'Manager',
      department: 'IT',
      socialLinks: { twitter: 'not-a-url' },
    };
    expect(() => adminProfileSchema.parse(data)).toThrow(ZodError);
    try {
      adminProfileSchema.parse(data);
    } catch (err) {
      expect(err.errors[0].message).toBe('invalid_url');
    }
  });

  test('instructor profile rejects invalid URL', () => {
    const data = {
      ...common,
      experience: 1,
      socialLinks: { twitter: 'invalid-url' },
    };
    expect(() => instructorProfileSchema.parse(data)).toThrow(ZodError);
    try {
      instructorProfileSchema.parse(data);
    } catch (err) {
      expect(err.errors[0].message).toBe('invalid_url');
    }
  });

  test('student profile rejects invalid URL', () => {
    const data = {
      ...common,
      education_level: 'High School',
      socialLinks: { twitter: 'bad' },
    };
    expect(() => studentProfileSchema.parse(data)).toThrow(ZodError);
    try {
      studentProfileSchema.parse(data);
    } catch (err) {
      expect(err.errors[0].message).toBe('invalid_url');
    }
  });
});
