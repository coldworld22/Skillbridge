import { profileSchema as adminProfileSchema } from '@/pages/dashboard/admin/profile/edit';
import { instructorProfileSchema } from '@/pages/dashboard/instructor/profile/edit';
import { studentProfileSchema } from '@/pages/dashboard/student/profile/edit';

describe('profile schema allows empty social link URLs', () => {
  const common = {
    full_name: 'John Doe',
    phone: '+14155552671',
    gender: 'male',
    date_of_birth: '1990-01-01',
  };

  test('admin profile accepts empty social link', () => {
    const data = {
      ...common,
      email: 'admin@example.com',
      job_title: 'Manager',
      department: 'IT',
      socialLinks: { twitter: '' },
    };
    expect(() => adminProfileSchema.parse(data)).not.toThrow();
  });

  test('instructor profile accepts empty social link', () => {
    const data = {
      ...common,
      experience: 1,
      socialLinks: { twitter: '' },
    };
    expect(() => instructorProfileSchema.parse(data)).not.toThrow();
  });

  test('student profile accepts empty social link', () => {
    const data = {
      ...common,
      education_level: 'High School',
      socialLinks: { twitter: '' },
    };
    expect(() => studentProfileSchema.parse(data)).not.toThrow();
  });
});
