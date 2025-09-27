import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { CreateOnlineClass } from '@/pages/dashboard/admin/online-classes/create';

const pushMock = jest.fn();
const addEventsMock = jest.fn();
const fetchNotificationsMock = jest.fn();
const fetchMessagesMock = jest.fn();
const mockCreateAdminClass = jest.fn();
const mockCreateClassLesson = jest.fn();
const mockUser = {
  id: 'user-1',
  full_name: 'Test Instructor',
  role: 'instructor',
};

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: pushMock,
    prefetch: jest.fn(),
    replace: jest.fn(),
    query: {},
  }),
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue ?? key,
    i18n: { dir: () => 'ltr' },
  }),
}));

jest.mock('next/dynamic', () => () => (props) => <div data-testid="react-quill" {...props} />);

jest.mock('react-quill', () => ({
  __esModule: true,
  default: (props) => <div data-testid="react-quill-editor" {...props} />,
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@/services/admin/categoryService', () => ({
  fetchAllCategories: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/admin/classTagService', () => ({
  fetchClassTags: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/admin/planService', () => ({
  fetchPlanIdentifiers: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/admin/instructorService', () => ({
  fetchAllInstructors: jest.fn().mockResolvedValue({
    instructors: [
      {
        id: 'user-1',
        full_name: 'Test Instructor',
        email: 'instructor@example.com',
      },
    ],
    meta: { hasNextPage: false },
  }),
}));

jest.mock('@/services/admin/classService', () => ({
  __esModule: true,
  createAdminClass: (...args) => mockCreateAdminClass(...args),
}));

jest.mock('@/services/instructor/classService', () => ({
  __esModule: true,
  createClassLesson: (...args) => mockCreateClassLesson(...args),
}));

jest.mock('@/store/auth/authStore', () => ({
  __esModule: true,
  default: () => ({
    user: mockUser,
  }),
}));

jest.mock('@/store/schedule/scheduleStore', () => ({
  __esModule: true,
  default: (selector) => selector({ addEvents: addEventsMock }),
}));

jest.mock('@/store/notifications/notificationStore', () => ({
  __esModule: true,
  default: (selector) => selector({ fetch: fetchNotificationsMock }),
}));

jest.mock('@/store/messages/messageStore', () => ({
  __esModule: true,
  default: (selector) => selector({ fetch: fetchMessagesMock }),
}));

const { toast } = require('react-toastify');

describe('CreateOnlineClass date validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCreateAdminClass.mockResolvedValue({
      id: 'class-1',
      title: 'Test Class',
      start_date: '2025-01-01T00:00:00.000Z',
    });

    mockCreateClassLesson.mockResolvedValue({});
  });

  const fillStepOne = (startDate, endDate) => {
    fireEvent.change(screen.getByPlaceholderText('class_title_label'), {
      target: { value: 'New Class' },
    });
    fireEvent.change(screen.getByPlaceholderText('start_date_label'), {
      target: { value: startDate },
    });
    fireEvent.change(screen.getByPlaceholderText('end_date_label'), {
      target: { value: endDate },
    });
    fireEvent.change(screen.getByPlaceholderText('price_label'), {
      target: { value: '100' },
    });
  };

  const fillLessonDetails = (container) => {
    fireEvent.change(screen.getByPlaceholderText('lesson_title_placeholder'), {
      target: { value: 'Lesson 1' },
    });

    const startTimeInput = container.querySelector('input[type="datetime-local"]');
    fireEvent.change(startTimeInput, {
      target: { value: '2025-01-02T10:00' },
    });
  };

  it('blocks submission when the end date is before the start date', async () => {
    const { container } = render(<CreateOnlineClass />);

    fillStepOne('2025-01-02', '2025-01-01');

    fireEvent.click(screen.getByText('next'));

    await waitFor(() => expect(screen.getByText('lesson_plan')).toBeInTheDocument());

    fillLessonDetails(container);

    fireEvent.click(screen.getByText('create_class'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('End date must be after the start date.');
    });

    expect(mockCreateAdminClass).not.toHaveBeenCalled();
  });

  it('allows submission when the end date is after the start date', async () => {
    const { container } = render(<CreateOnlineClass />);

    fillStepOne('2025-01-01', '2025-01-03');

    fireEvent.click(screen.getByText('next'));

    await waitFor(() => expect(screen.getByText('lesson_plan')).toBeInTheDocument());

    fillLessonDetails(container);

    fireEvent.click(screen.getByText('create_class'));

    await waitFor(() => {
      expect(mockCreateAdminClass).toHaveBeenCalledTimes(1);
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('class_created');
    expect(pushMock).toHaveBeenCalledWith('/dashboard/admin/online-classes');
  });
});
