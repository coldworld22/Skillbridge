import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InstructorSchedule from '@/pages/dashboard/instructor/schedule';

const baseNow = new Date('2024-01-01T10:00:00.000Z');
const lessonStart = new Date(baseNow.getTime() + 5 * 60 * 1000);
const lessonEnd = new Date(lessonStart.getTime() + 60 * 60 * 1000);

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) =>
      typeof options?.count !== 'undefined' ? `${key}:${options.count}` : key,
  }),
}));

jest.mock('../../components/shared/CalendarView', () => {
  function MockCalendarView({ onEventClick }) {
    return (
      <button
        type="button"
        onClick={() =>
          onEventClick({
            event: {
              id: 'lesson-1',
              start: lessonStart.toISOString(),
            },
          })
        }
      >
        cal
      </button>
    );
  }
  MockCalendarView.displayName = 'CalendarView';
  return MockCalendarView;
});

jest.mock('../../components/layouts/InstructorLayout', () => {
  function MockInstructorLayout({ children }) {
    return <div>{children}</div>;
  }
  MockInstructorLayout.displayName = 'InstructorLayout';
  return MockInstructorLayout;
});

jest.mock('../../services/instructor/classService', () => ({
  fetchInstructorScheduleEvents: jest.fn(() =>
    Promise.resolve([
      {
        id: 'lesson-1',
        title: 'Lesson: Intro',
        start: lessonStart.toISOString(),
        end: lessonEnd.toISOString(),
        extendedProps: {
          type: 'lesson',
          lessonId: '1',
          classId: 'class-10',
          displayTitle: 'Intro',
        },
      },
    ])
  ),
}));

jest.mock('../../services/lessonService', () => ({
  getLessonRoomLink: jest.fn(() => Promise.resolve('http://room')),
}));

const { getLessonRoomLink } = require('../../services/lessonService');
const { fetchInstructorScheduleEvents } = require('../../services/instructor/classService');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(baseNow);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Join live session link', () => {
  it('requests room link when lesson is live', async () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
    render(<InstructorSchedule />);
    await waitFor(() => expect(fetchInstructorScheduleEvents).toHaveBeenCalled());
    jest.setSystemTime(new Date(lessonStart.getTime() + 30 * 1000));
    fireEvent.click(screen.getByText('cal'));
    await waitFor(() => expect(getLessonRoomLink).toHaveBeenCalledWith('1'));
    openSpy.mockRestore();
  });
});
