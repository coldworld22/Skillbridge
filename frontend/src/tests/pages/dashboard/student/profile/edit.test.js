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

jest.mock('@/services/student/studentService.js', () => ({
  getStudentProfile: jest.fn(),
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

beforeEach(() => {
  jest.clearAllMocks();
  studentService.getStudentProfile.mockResolvedValue({
    full_name: '',
    phone: '',
    gender: 'male',
    date_of_birth: '',
    student: {},
    social_links: [],
    avatar_url: null,
  });
});

test('uploads identity document and triggers preview creation', async () => {
  studentService.uploadStudentIdentity.mockResolvedValue({});

  const { container } = render(<StudentProfileEdit />);

  await waitFor(() => {
    if (!container.querySelector('input[type="file"][accept="application/pdf"]')) {
      throw new Error('waiting for input');
    }
  });

  const input = container.querySelector('input[type="file"][accept="application/pdf"]');
  const file = new File(['dummy'], 'id.pdf', { type: 'application/pdf' });

  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => {
    expect(studentService.uploadStudentIdentity).toHaveBeenCalledWith(1, file);
  });
  expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
});

test('shows uploaded state when identity document exists', async () => {
  const identityUrl = '/uploads/student/identity.pdf';
  studentService.getStudentProfile.mockResolvedValueOnce({
    full_name: '',
    phone: '',
    gender: 'male',
    date_of_birth: '',
    student: { identity_doc_url: identityUrl },
    social_links: [],
    avatar_url: null,
  });

  render(<StudentProfileEdit />);

  await waitFor(() => {
    expect(screen.getByText('id_uploaded')).toBeInTheDocument();
  });

  const viewLink = screen.getByRole('link', { name: 'view_pdf' });
  expect(viewLink).toHaveAttribute('href', identityUrl);
});
