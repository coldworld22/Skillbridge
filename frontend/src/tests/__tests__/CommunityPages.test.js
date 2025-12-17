/* eslint-disable react/display-name */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommunityPage from '../../pages/community';
import AskQuestionPage from '../../pages/community/ask';
import QuestionDetails from '../../pages/community/question/details';
import * as communityService from '../../services/communityService';

jest.mock('../../components/website/sections/Navbar', () => () => <div>Navbar</div>);
jest.mock('../../components/website/sections/Footer', () => () => <div>Footer</div>);
jest.mock('../../components/community/QuestionCard', () => ({ question }) => <div>{question.title}</div>);
jest.mock('../../components/community/Filters', () => () => <div />);
jest.mock('../../components/community/Pagination', () => () => <div />);
jest.mock('../../components/FileUploader', () => () => <div />);
// simple textarea mock for rich text editor
jest.mock('../../components/RichTextEditor', () => ({ onChange, value }) => (
  <textarea data-testid="editor" value={value} onChange={(e) => onChange && onChange(e.target.value)} />
));
jest.mock('react-markdown', () => (props) => <div>{props.children}</div>);

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

const mockUseRouter = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}));

jest.mock('../../services/communityService');

afterEach(() => {
  jest.clearAllMocks();
});

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ questions: [] }) })
  );
});

const { fetchDiscussions, createDiscussion, fetchDiscussionById, fetchReplies, createReply } = communityService;


describe('Community pages', () => {
  test('discussions load on community page', async () => {
    fetchDiscussions.mockResolvedValue([{ id: 1, title: 'First question' }]);
    mockUseRouter.mockReturnValue({});
    render(<CommunityPage />);
    expect(fetchDiscussions).toHaveBeenCalled();
    expect(await screen.findByText('First question')).toBeInTheDocument();
  });

  test('submitting a question triggers API call', async () => {
    createDiscussion.mockResolvedValue({});
    mockUseRouter.mockReturnValue({});
    render(<AskQuestionPage />);
    fireEvent.change(screen.getByPlaceholderText('Enter question title'), {
      target: { value: 'My Question' },
    });
    fireEvent.click(screen.getByText(/Submit Question/i));
    await waitFor(() => {
      expect(createDiscussion).toHaveBeenCalled();
    });
    const formData = createDiscussion.mock.calls[0][0];
    expect(formData.get('title')).toBe('My Question');
    expect(formData.get('content')).toBe('');
    expect(formData.get('tags')).toBe(JSON.stringify([]));
  });

  test('posting a reply displays it', async () => {
    fetchDiscussionById.mockResolvedValue({ id: 1, title: 'Q', content: '' });
    fetchReplies.mockResolvedValue([]);
    createReply.mockResolvedValue({
      id: 2,
      content: 'My reply',
      user_name: 'User',
      created_at: new Date().toISOString(),
    });
    mockUseRouter.mockReturnValue({ query: { id: '1' }, push: jest.fn() });
    render(<QuestionDetails />);
    expect(await screen.findByText('Q')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('editor'), {
      target: { value: 'My reply' },
    });
    fireEvent.click(screen.getByText('Post Reply'));
    await waitFor(() => {
      expect(createReply).toHaveBeenCalled();
    });
    expect(await screen.findByText('My reply')).toBeInTheDocument();
  });
});
