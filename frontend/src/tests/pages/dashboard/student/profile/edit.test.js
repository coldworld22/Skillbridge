const { render, fireEvent, waitFor, act, screen } = require('@testing-library/react');

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('@/components/layouts/StudentLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('@/store/auth/authStore', () => ({
  __esModule: true,
  default: () => ({
    user: { id: 1, role: 'student' },
    logout: jest.fn(),
    hasHydrated: true,
    setUser: jest.fn(),
  }),
}));

jest.mock('@/store/notifications/notificationStore', () => ({
  __esModule: true,
  default: () => ({ fetch: jest.fn() }),
}));

jest.mock('@/store/messages/messageStore', () => ({
  __esModule: true,
  default: () => ({ fetch: jest.fn() }),
}));

jest.mock('@/services/student/studentService', () => ({
  getStudentProfile: jest.fn().mockResolvedValue({
    full_name: '',
    phone: '',
    gender: 'male',
    date_of_birth: '',
    student: {},
    social_links: [],
    avatar_url: null,
  }),
  updateStudentProfile: jest.fn(),
  uploadStudentAvatar: jest.fn(),
  uploadStudentIdentity: jest.fn(),
}));

const studentService = require('@/services/student/studentService');
const StudentProfileEdit = require('@/pages/dashboard/student/profile/edit').default;

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = jest.fn();
});

const baseProfileResponse = {
  full_name: '',
  phone: '',
  gender: 'male',
  date_of_birth: '',
  student: {},
  social_links: [],
  avatar_url: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  studentService.getStudentProfile.mockResolvedValue({
    ...baseProfileResponse,
    student: { ...baseProfileResponse.student },
  });
  studentService.uploadStudentIdentity.mockImplementation(() => Promise.resolve());
  process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';
});

test('disables identity upload button during upload', async () => {
  let resolveUpload;
  studentService.uploadStudentIdentity.mockImplementation(
    () => {
      return new Promise((res) => {
        resolveUpload = res;
      });
    }
  );

  const { container } = render(<StudentProfileEdit />);

  await waitFor(() => {
    if (!container.querySelector('input[type="file"][accept="application/pdf"]')) {
      throw new Error('waiting for input');
    }
  });

  const input = container.querySelector('input[type="file"][accept="application/pdf"]');
  const file = new File(['dummy'], 'id.pdf', { type: 'application/pdf' });

  fireEvent.change(input, { target: { files: [file] } });

  expect(studentService.uploadStudentIdentity).toHaveBeenCalledTimes(1);
  expect(container.querySelector('input[type="file"][accept="application/pdf"]')).toBeNull();

  resolveUpload();
});

test('renders existing identity document link on load', async () => {
  const identityPath = '/uploads/docs/id.pdf';
  studentService.getStudentProfile.mockResolvedValueOnce({
    ...baseProfileResponse,
    student: { identity_doc_url: identityPath },
  });

  render(<StudentProfileEdit />);

  const viewPdfLink = await screen.findByRole('link', { name: 'view_pdf' });
  expect(viewPdfLink).toHaveAttribute(
    'href',
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${identityPath}`
  );
});
