import { render, screen } from '@testing-library/react';
import TutorialDetail from '../../pages/tutorials/[id]';
import useAuthStore from '@/store/auth/authStore';
import * as tutorialService from '../../services/tutorialService';

jest.mock('../../components/website/sections/Navbar', () => () => <div />);
jest.mock('../../components/website/sections/Footer', () => () => <div />);
jest.mock('../../components/shared/CustomVideoPlayer', () => () => <div data-testid="player" />);
jest.mock('../../components/tutorials/detail/TutorialHeader', () => () => <div />);
jest.mock('../../components/tutorials/detail/TutorialOverview', () => () => <div />);
jest.mock('../../components/tutorials/detail/InstructorBio', () => () => <div />);
jest.mock('../../components/tutorials/detail/ChapterList', () => () => <div />);
jest.mock('../../components/tutorials/detail/EnrollBanner', () => () => <div />);
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
  success: jest.fn(),
  error: jest.fn(),
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
  default: (selector) => selector({ addItem: jest.fn(), items: [] }),
}));

const { fetchTutorialDetails, fetchPublishedTutorials, fetchTutorialAssignments } = tutorialService;

describe('TutorialDetail page with no chapters', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 1 }, accessToken: 'token' });
    fetchPublishedTutorials.mockResolvedValue([]);
    fetchTutorialAssignments.mockResolvedValue([]);
  });

  it('shows placeholder when tutorial has no chapters', async () => {
    fetchTutorialDetails.mockResolvedValue({
      id: 1,
      title: 'Empty tutorial',
      description: '',
      chapters: [],
    });

    render(<TutorialDetail />);

    expect(await screen.findByTestId('no-video')).toBeInTheDocument();
    expect(screen.queryByTestId('player')).not.toBeInTheDocument();
  });
});
