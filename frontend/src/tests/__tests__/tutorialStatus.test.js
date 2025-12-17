import { loadTutorialStatus } from '@/pages/tutorials/index';
import useAuthStore from '@/store/auth/authStore';
import { fetchTutorialProgress } from '../../services/tutorialService';

jest.mock('../../services/tutorialService', () => ({
  fetchTutorialProgress: jest.fn(),
}));

describe('loadTutorialStatus', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchTutorialProgress.mockReset();
    useAuthStore.setState({ user: { id: 1 } });
  });

  it('falls back to localStorage when API is unavailable', async () => {
    const tut = { id: 1, chapters: Array(4) };
    fetchTutorialProgress.mockRejectedValue(new Error('fail'));
    localStorage.setItem('enrolled-1-1', 'true');
    localStorage.setItem(
      'progress-tutorial-1-1',
      JSON.stringify({ completedChapters: [1, 2] })
    );

    const { enrolled, progress } = await loadTutorialStatus(tut);
    expect(enrolled).toBe(true);
    expect(progress).toBeCloseTo(50);
  });

  it('uses API data when available', async () => {
    const tut = { id: 2 };
    fetchTutorialProgress.mockResolvedValue({
      enrolled: true,
      status: 'in_progress',
      progress: 80,
    });

    const res = await loadTutorialStatus(tut);
    expect(fetchTutorialProgress).toHaveBeenCalledWith(2);
    expect(res.enrolled).toBe(true);
    expect(res.status).toBe('in_progress');
    expect(res.progress).toBe(80);
  });
});

