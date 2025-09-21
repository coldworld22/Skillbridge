import React from 'react';
import { render, screen } from '@testing-library/react';
import InstructorProfilePage, { getServerSideProps } from '@/pages/instructors/[id]';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

const { renderToString } = require('react-dom/server');

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/store/auth/authStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({ user: { role: 'student' } })),
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts = {}) => {
      if (key === 'instructor_rating' && opts.count) {
        return `${opts.count} rating`;
      }
      return key;
    },
  }),
}));

jest.mock('react-toastify', () => ({
  __esModule: true,
  toast: { info: jest.fn() },
}));

jest.mock('@/components/layouts/StudentLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="student-layout">{children}</div>,
}));

jest.mock('@/components/layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

jest.mock('@/components/layouts/InstructorLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="instructor-layout">{children}</div>,
}));

jest.mock('@/components/student/instructors/BookingRequestModal', () => ({
  __esModule: true,
  default: ({ onClose }) => (
    <div>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('@/components/shared/CustomVideoPlayer', () => ({
  __esModule: true,
  default: () => <div data-testid="video-player" />,
}));

jest.mock('@/services/public/instructorService', () => ({
  fetchPublicInstructorById: jest.fn(),
  fetchInstructorStats: jest.fn(),
}));

const { useRouter } = require('next/router');
const { fetchPublicInstructorById, fetchInstructorStats } = require('@/services/public/instructorService');

describe('InstructorProfilePage SSR join date consistency', () => {
  beforeEach(() => {
    useRouter.mockReturnValue({
      query: { id: '1' },
      push: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reuses the server-formatted join date string during client render', async () => {
    fetchPublicInstructorById.mockResolvedValue({
      id: '1',
      full_name: 'Test Instructor',
      avatar_url: '/avatar.png',
      created_at: '2023-01-15T12:34:56Z',
      expertise: ['Math'],
      experience: 5,
      rating: 4.5,
      bio: 'Biography',
      email: 'test@example.com',
      phone: '12345',
      pricing: '$10',
      demo_video_url: null,
      is_online: true,
    });
    fetchInstructorStats.mockResolvedValue({ classes: 3, tutorials: 2 });

    const context = { params: { id: '1' }, locale: 'en-GB' };
    const result = await getServerSideProps(context);

    expect(result.props.joinDate).toBe('15 January 2023');

    const serverHTML = renderToString(<InstructorProfilePage {...result.props} />);
    expect(serverHTML).toContain(result.props.joinDate);

    render(<InstructorProfilePage {...result.props} />);
    expect(screen.getByText(`Joined ${result.props.joinDate}`)).toBeInTheDocument();
  });
});
