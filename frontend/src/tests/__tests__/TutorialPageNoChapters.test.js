import { render, screen } from '@testing-library/react';
import TutorialDetail from '../../pages/tutorials/[id]';
import useAuthStore from '@/store/auth/authStore';
import * as tutorialService from '../../services/tutorialService';

function createMock(name, props) {
  function MockComponent(p = props) {
    return <div {...p} />;
  }
  MockComponent.displayName = name;
  return MockComponent;
}

jest.mock('../../components/website/sections/Navbar', () => createMock('Navbar'));
jest.mock('../../components/website/sections/Footer', () => createMock('Footer'));
jest.mock('../../components/shared/CustomVideoPlayer', () => createMock('CustomVideoPlayer', { 'data-testid': 'player' }));
jest.mock('../../components/tutorials/detail/TutorialHeader', () => createMock('TutorialHeader'));
jest.mock('../../components/tutorials/detail/TutorialOverview', () => createMock('TutorialOverview'));
jest.mock('../../components/tutorials/detail/InstructorBio', () => createMock('InstructorBio'));
jest.mock('../../components/tutorials/detail/ChapterList', () => createMock('ChapterList'));
jest.mock('../../components/tutorials/detail/EnrollBanner', () => createMock('EnrollBanner'));
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
