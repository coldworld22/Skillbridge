import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TutorialDetail from '../../pages/tutorials/[id]';
import useAuthStore from '@/store/auth/authStore';
import * as tutorialService from '../../services/tutorialService';

const addItem = jest.fn();

jest.mock('../../components/website/sections/Navbar', () => () => <div />);
jest.mock('../../components/website/sections/Footer', () => () => <div />);
jest.mock('../../components/shared/CustomVideoPlayer', () => () => <div />);
jest.mock('../../components/tutorials/detail/TutorialHeader', () => () => <div />);
jest.mock('../../components/tutorials/detail/TutorialOverview', () => () => <div />);
jest.mock('../../components/tutorials/detail/InstructorBio', () => () => <div />);
jest.mock('../../components/tutorials/detail/ChapterList', () => () => <div />);
jest.mock('../../components/tutorials/detail/LoginPrompt', () => () => <div />);
jest.mock('../../components/tutorials/detail/VideoPreviewList', () => () => <div />);
jest.mock('../../components/tutorials/detail/TestQuiz', () => () => <div />);
jest.mock('../../components/tutorials/detail/BackButton', () => () => <div />);
jest.mock('../../components/tutorials/detail/ReviewsSection', () => () => <div />);
jest.mock('../../components/tutorials/detail/CommentsSection', () => () => <div />);
jest.mock('../../components/tutorials/detail/RelatedTutorials', () => () => <div />);
jest.mock('../../components/classes/CourseProgress', () => () => <div />);
jest.mock('../../components/tutorials/detail/TutorialSkeleton', () => () => <div />);

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

