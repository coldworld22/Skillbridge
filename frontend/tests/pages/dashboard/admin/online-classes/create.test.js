import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import ProtectedCreateOnlineClass, {
  CreateOnlineClass,
} from '@/pages/dashboard/admin/online-classes/create';

const pushMock = jest.fn();
const replaceMock = jest.fn();
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
const adminUser = {
  id: 'admin-1',
  full_name: 'Admin User',
  role: 'admin',
  permissions: ['manage_online_classes'],
};
const createLessonResultsProxy = () =>
  new Proxy(
    {},
    {
      get: () => ({ status: 'fulfilled', value: {} }),
    }
  );
const createSuccessfulLessonsProxy = () =>
  new Proxy(
    {},
    {
      get: () => true,
    }
  );
const validTestToken = 'a.eyJleHAiOjk5OTk5OTk5OTl9.c';
const authState = {
  user: { ...mockUser },
  accessToken: validTestToken,
  logout: jest.fn(),
  hasHydrated: true,
};

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: pushMock,
    prefetch: jest.fn(),
    replace: replaceMock,
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
  default: (selector) => (selector ? selector(authState) : authState),
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
    authState.user = { ...mockUser };
    authState.accessToken = validTestToken;
    authState.hasHydrated = true;
    authState.logout = jest.fn();
    replaceMock.mockReset();
    mockCreateAdminClass.mockReset();
    mockCreateClassLesson.mockReset();
    global.lessonResults = createLessonResultsProxy();
    global.successfulLessons = createSuccessfulLessonsProxy();

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
    render(<CreateOnlineClass />);

    fillStepOne('2025-01-02', '2025-01-01');

    fireEvent.click(screen.getByText('next'));

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

  it('retries only failed lessons without duplicating successful uploads', async () => {
    const { container } = render(<CreateOnlineClass />);

    fillStepOne('2025-01-01', '2025-01-03');

    fireEvent.click(screen.getByText('next'));

    await waitFor(() => expect(screen.getByText('lesson_plan')).toBeInTheDocument());

    const firstTitleInput = screen.getAllByPlaceholderText('lesson_title_placeholder')[0];
    fireEvent.change(firstTitleInput, { target: { value: 'Lesson 1' } });

    let dateInputs = container.querySelectorAll('input[type="datetime-local"]');
    fireEvent.change(dateInputs[0], { target: { value: '2025-01-02T10:00' } });

    fireEvent.click(screen.getByText('add_lesson_button'));

    const titleInputs = screen.getAllByPlaceholderText('lesson_title_placeholder');
    fireEvent.change(titleInputs[1], { target: { value: 'Lesson 2' } });

    dateInputs = container.querySelectorAll('input[type="datetime-local"]');
    fireEvent.change(dateInputs[1], { target: { value: '2025-01-02T12:00' } });

    mockCreateClassLesson.mockImplementationOnce(() => Promise.resolve({ id: 'lesson-1' }));
    mockCreateClassLesson.mockImplementationOnce(() => Promise.reject(new Error('Lesson failed')));

    fireEvent.click(screen.getByText('create_class'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(mockCreateAdminClass).toHaveBeenCalledTimes(1);
    expect(mockCreateClassLesson).toHaveBeenCalledTimes(2);

    expect(
      await screen.findByText('This lesson was uploaded successfully and will be skipped on retry.')
    ).toBeInTheDocument();

    mockCreateClassLesson.mockImplementationOnce(() => Promise.resolve({ id: 'lesson-2' }));

    const secondLessonTitle = screen.getAllByPlaceholderText('lesson_title_placeholder')[1];
    fireEvent.change(secondLessonTitle, { target: { value: 'Lesson 2 updated' } });

    fireEvent.click(screen.getByText('create_class'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('class_created');
    });

    expect(mockCreateAdminClass).toHaveBeenCalledTimes(1);
    expect(mockCreateClassLesson).toHaveBeenCalledTimes(3);

    const retryCall = mockCreateClassLesson.mock.calls[2];
    expect(retryCall[0]).toBe('class-1');
    expect(retryCall[1].get('title')).toBe('Lesson 2 updated');
  });
});

describe('ProtectedCreateOnlineClass access control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authState.user = { ...adminUser };
    authState.accessToken = validTestToken;
    authState.hasHydrated = true;
    authState.logout = jest.fn();
    replaceMock.mockReset();
    mockCreateAdminClass.mockReset();
    mockCreateClassLesson.mockReset();
    global.lessonResults = createLessonResultsProxy();
    global.successfulLessons = createSuccessfulLessonsProxy();
  });

  it('redirects non-admin roles before loading the form', async () => {
    authState.user = {
      id: 'user-2',
      full_name: 'Student User',
      role: 'student',
      permissions: [],
    };

    render(<ProtectedCreateOnlineClass />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/error/403');
    });

    expect(mockCreateAdminClass).not.toHaveBeenCalled();
  });
});
