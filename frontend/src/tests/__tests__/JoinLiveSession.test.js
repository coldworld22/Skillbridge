import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InstructorSchedule from '@/pages/dashboard/instructor/schedule';

jest.mock('../../services/instructor/classService', () => ({
  fetchInstructorScheduleEvents: jest.fn(() => Promise.resolve([
    { id: 'lesson-1', title: 'L1', start: new Date().toISOString() },
  ])),
}));

jest.mock('../../services/lessonService', () => ({
  getLessonRoomLink: jest.fn(() => Promise.resolve('http://room')),
}));
const { getLessonRoomLink } = require('../../services/lessonService');

jest.mock('../../components/shared/CalendarView', () => ({ onEventClick }) => (
  <button onClick={() => onEventClick({ event: { id: 'lesson-1', start: new Date().toISOString(), extendedProps: {} } })}>cal</button>
));

jest.mock('../../components/layouts/InstructorLayout', () => ({ children }) => <div>{children}</div>);

describe('Join live session link', () => {
  it('requests room link when lesson is live', async () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
    render(<InstructorSchedule />);
    fireEvent.click(screen.getByText('cal'));
    await waitFor(() => expect(getLessonRoomLink).toHaveBeenCalledWith('1'));
    openSpy.mockRestore();
  });
});
