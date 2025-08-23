import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TutorialDetail from '../../pages/tutorials/[id]';
import useAuthStore from '@/store/auth/authStore';
import * as tutorialService from '../../services/tutorialService';

const addItem = jest.fn();

function createMock(name) {
  function Mock() {
    return <div />;
  }
  Mock.displayName = name;
  return Mock;
}

jest.mock('../../components/website/sections/Navbar', () => createMock('Navbar'));
jest.mock('../../components/website/sections/Footer', () => createMock('Footer'));
jest.mock('../../components/shared/CustomVideoPlayer', () => createMock('CustomVideoPlayer'));
jest.mock('../../components/tutorials/detail/TutorialHeader', () => createMock('TutorialHeader'));
jest.mock('../../components/tutorials/detail/TutorialOverview', () => createMock('TutorialOverview'));
jest.mock('../../components/tutorials/detail/InstructorBio', () => createMock('InstructorBio'));
jest.mock('../../components/tutorials/detail/ChapterList', () => createMock('ChapterList'));
jest.mock('../../components/tutorials/detail/LoginPrompt', () => createMock('LoginPrompt'));
jest.mock('../../components/tutorials/detail/VideoPreviewList', () => createMock('VideoPreviewList'));
jest.mock('../../components/tutorials/detail/TestQuiz', () => createMock('TestQuiz'));
jest.mock('../../components/tutorials/detail/BackButton', () => createMock('BackButton'));
jest.mock('../../components/tutorials/detail/ReviewsSection', () => createMock('ReviewsSection'));
jest.mock('../../components/tutorials/detail/CommentsSection', () => createMock('CommentsSection'));
jest.mock('../../components/tutorials/detail/RelatedTutorials', () => createMock('RelatedTutorials'));
jest.mock('../../components/classes/CourseProgress', () => createMock('CourseProgress'));
jest.mock('../../components/tutorials/detail/TutorialSkeleton', () => createMock('TutorialSkeleton'));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ query: { id: '1' }, push: jest.fn() }),
}));

jest.mock('../../hooks/useTutorialProgress', () => jest.fn(() => ({
  progress: { completedChapters: [], lastIndex: 0 },
  saveTime: jest.fn(),
  completeChapter: jest.fn(),
  setIndex: jest.fn(),
  startTimeFor: jest.fn(() => 0),
}))); 

jest.mock('../../services/tutorialService');

jest.mock('../../store/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => selector({ addItem, items: [{ id: 1 }] }),
}));

const { fetchTutorialDetails, fetchPublishedTutorials, fetchTutorialAssignments } = tutorialService;

describe('TutorialDetail add to cart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: { id: 1, role: 'student' }, accessToken: 'token' });
    fetchPublishedTutorials.mockResolvedValue([]);
    fetchTutorialAssignments.mockResolvedValue([]);
    fetchTutorialDetails.mockResolvedValue({
      id: 1,
      title: 'Test Tutorial',
      description: '',
      price: 20,
      chapters: [],
    });
  });

  it('shows toast when item already in cart', async () => {
    render(<TutorialDetail />);
    const button = await screen.findByRole('button', { name: /add to cart/i });
    fireEvent.click(button);
    await waitFor(() => expect(addItem).not.toHaveBeenCalled());
    const toast = require('react-hot-toast').default;
    expect(toast.error).toHaveBeenCalledWith('Already in cart');
  });
});

