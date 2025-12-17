import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StudentClassRoom } from '@/pages/dashboard/student/online-classes/[id]';
import {
  fetchClassDetails,
  fetchClassLessons,
  fetchClassAssignments,
} from '@/services/classService';
import { fetchClassResources } from '@/services/classResourceService';
import { fetchSessionStatus } from '@/services/videoCallService';

const classId = 'a626a28d-1aaf-499d-b4d3-84ea8b65034e';
const pushMock = jest.fn();
const videoCallProps = [];

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: classId },
    push: pushMock,
  }),
}));

jest.mock('next-i18next', () => {
  const React = require('react');
  return {
    useTranslation: () => ({
      t: (key, options) =>
        typeof options?.count !== 'undefined' ? `${key}:${options.count}` : key,
    }),
  };
});

jest.mock('@/components/video-call/VideoCallScreen', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) => {
      videoCallProps.push(props);
      return React.createElement('div', { 'data-testid': 'student-video-call' });
    },
  };
});

jest.mock('@/components/students/StudentScoreSummary', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement('div', { 'data-testid': 'student-score-summary' }),
  };
});

jest.mock('@/services/classService', () => ({
  fetchClassDetails: jest.fn(),
  fetchClassLessons: jest.fn(),
  fetchClassAssignments: jest.fn(),
}));

jest.mock('@/services/classResourceService', () => ({
  fetchClassResources: jest.fn(),
}));

jest.mock('@/services/videoCallService', () => ({
  fetchSessionStatus: jest.fn(),
}));

const baseDetails = {
  id: classId,
  title: 'AI Mastery Intensive',
  instructor: 'Dr. Emmy Noether',
  startDate: '2024-02-01T10:00:00.000Z',
  endDate: '2024-02-01T18:00:00.000Z',
  lessons: [
    { title: 'Kickoff Workshop', duration: '60m' },
    { title: 'Neural Network Lab', duration: '45m' },
  ],
};

const lessonList = [
  { title: 'Kickoff Workshop', duration: '60m' },
  { title: 'Neural Network Lab', duration: '45m' },
];

const assignmentList = [
  {
    id: 'assignment-1',
    title: 'Lab Prep',
    status: 'Pending',
    dueDate: '2024-02-02T10:00:00.000Z',
    createdAt: '2024-02-01T09:00:00.000Z',
  },
];

const resourceList = [
  {
    id: 'resource-1',
    title: 'Slide Deck',
    resource_type: 'file',
    downloadUrl: 'https://example.com/slides.pdf',
    created_at: '2024-01-31T12:00:00.000Z',
  },
];

describe('StudentClassRoom dashboard view', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-01T12:00:00.000Z'));
    pushMock.mockReset();
    videoCallProps.length = 0;

    fetchClassDetails.mockReset();
    fetchClassLessons.mockReset();
    fetchClassAssignments.mockReset();
    fetchClassResources.mockReset();
    fetchSessionStatus.mockReset();

    fetchClassDetails.mockResolvedValue(baseDetails);
    fetchClassLessons.mockResolvedValue(lessonList);
    fetchClassAssignments.mockResolvedValue(assignmentList);
    fetchClassResources.mockResolvedValue(resourceList);
    fetchSessionStatus.mockResolvedValue({
      live: false,
      reportedAt: '2024-02-01T11:55:00.000Z',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders student actions and tracks completion for the class', async () => {
    await act(async () => {
      render(<StudentClassRoom />);
    });

    await waitFor(() => expect(fetchClassDetails).toHaveBeenCalledWith(classId));
    await waitFor(() => expect(fetchClassResources).toHaveBeenCalledWith(classId));

    expect(screen.getByText(/AI Mastery Intensive/)).toBeInTheDocument();
    expect(screen.getByTestId('student-video-call')).toBeInTheDocument();
    expect(screen.getByText('student_online_class.assignment_start')).toBeInTheDocument();
    expect(screen.getByText('student_online_class.download_button')).toBeInTheDocument();

    const markButtons = screen.getAllByText('student_online_class.mark_complete');
    markButtons.forEach((button) => fireEvent.click(button));

    const certificateBanner = await screen.findByText((content) =>
      content.includes('student_online_class.certificate_message'),
    );
    expect(certificateBanner).toBeInTheDocument();

    fireEvent.click(screen.getByText('student_online_class.assignment_start'));
    expect(pushMock).toHaveBeenCalledWith('/dashboard/student/assignments/assignment-1');

    const lastCallProps = videoCallProps[videoCallProps.length - 1];
    expect(lastCallProps).toMatchObject({ chatId: classId });

    expect(fetchSessionStatus).toHaveBeenCalled();
  });
});
