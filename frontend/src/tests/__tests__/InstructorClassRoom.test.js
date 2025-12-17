import { render, screen, waitFor } from '@testing-library/react';
import { InstructorClassRoom } from '@/pages/dashboard/instructor/online-classes/[id]';
import { fetchClassManagementData } from '@/services/instructor/classService';

const classId = 'a626a28d-1aaf-499d-b4d3-84ea8b65034e';
const routerBack = jest.fn();
const videoCallProps = [];
const resourceUploadProps = [];

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: classId },
    back: routerBack,
    locale: 'en',
  }),
}));

jest.mock('next-i18next', () => {
  const React = require('react');
  return {
    useTranslation: () => ({
      t: (key, options) =>
        typeof options?.count !== 'undefined' ? `${key}:${options.count}` : key,
    }),
    Trans: ({ i18nKey }) => React.createElement('span', null, i18nKey),
  };
});

jest.mock('@/store/auth/authStore', () => ({
  __esModule: true,
  default: (selector) =>
    selector({
      user: {
        id: 'inst-001',
        full_name: 'Ada Instructor',
      },
    }),
}));

jest.mock('@/components/video-call/VideoCallScreen', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) => {
      videoCallProps.push(props);
      return React.createElement('div', { 'data-testid': 'video-call-screen' });
    },
  };
});

jest.mock('@/components/instructors/LessonManager', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'lesson-manager' }),
  };
});

jest.mock('@/components/instructors/StudentAttendancePanel', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement('div', { 'data-testid': 'attendance-panel' }),
  };
});

jest.mock('@/components/instructors/ResourceUploadSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) => {
      resourceUploadProps.push(props);
      return React.createElement('div', { 'data-testid': 'resource-upload' });
    },
  };
});

jest.mock('@/components/instructors/BreakoutRoomControl', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'breakout-control' }),
  };
});

jest.mock('@/components/instructors/CertificateIssuancePanel', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement('div', { 'data-testid': 'certificate-panel' }),
  };
});

jest.mock('@/components/instructors/AssignmentManager', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'assignment-manager' }),
  };
});

jest.mock('@/components/instructors/StudentProgressPanel', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement('div', { 'data-testid': 'student-progress-panel' }),
  };
});

jest.mock('@/services/instructor/classService', () => ({
  fetchClassManagementData: jest.fn(),
}));

const instructorClassResponse = {
  class: {
    id: classId,
    title: 'AI Mastery Intensive',
    instructor: 'Dr. Emmy Noether',
    start_date: '2024-02-02T10:00:00.000Z',
    scheduleStatus: 'Ongoing',
  },
  lessons: [
    { id: 'lesson-1', title: 'Kickoff Workshop', start_time: '2024-02-03T09:00:00.000Z' },
    { id: 'lesson-2', title: 'Neural Network Lab', start_time: '2024-02-04T09:00:00.000Z' },
  ],
  assignments: [{ id: 'assignment-1', title: 'Lab Prep' }],
  resources: [
    { id: 'resource-1', title: 'Slide Deck', resource_type: 'file' },
    { id: 'resource-2', title: 'Reference Links', resource_type: 'link' },
  ],
};

describe('InstructorClassRoom dashboard view', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-01T08:00:00.000Z'));
    routerBack.mockReset();
    videoCallProps.length = 0;
    resourceUploadProps.length = 0;
    fetchClassManagementData.mockReset();
    fetchClassManagementData.mockResolvedValue(instructorClassResponse);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads instructor data and exposes live teaching tools', async () => {
    render(<InstructorClassRoom />);

    await waitFor(() =>
      expect(fetchClassManagementData).toHaveBeenCalledWith(classId),
    );

    expect(await screen.findByText('AI Mastery Intensive')).toBeInTheDocument();
    expect(screen.getByText('lesson_count:2')).toBeInTheDocument();
    expect(screen.getByText('assignment_count:1')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Kickoff Workshop' })).toBeInTheDocument();
    expect(screen.getByText('dashboard:next_lesson_in')).toBeInTheDocument();
    const lastCallProps = videoCallProps[videoCallProps.length - 1];
    expect(lastCallProps).toMatchObject({ chatId: classId, userRole: 'host' });

  });
});
