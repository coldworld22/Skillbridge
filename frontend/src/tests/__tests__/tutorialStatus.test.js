import { loadTutorialStatus, loadTutorialStatuses } from '@/pages/tutorials/index';
import useAuthStore from '@/store/auth/authStore';
import { fetchTutorialProgress, fetchTutorialProgressBatch } from '../../services/tutorialService';

jest.mock('../../services/tutorialService', () => ({
  fetchTutorialProgress: jest.fn(),
  fetchTutorialProgressBatch: jest.fn(),
}));

describe('loadTutorialStatus', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchTutorialProgress.mockReset();
    fetchTutorialProgressBatch.mockReset();
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

describe('loadTutorialStatuses', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchTutorialProgressBatch.mockReset();
    useAuthStore.setState({ user: { id: 1 } });
  });

  it('returns map from API data', async () => {
    const tutorials = [{ id: 1 }, { id: 2 }];
    fetchTutorialProgressBatch.mockResolvedValue({
      1: { enrolled: true, status: 'completed', progress: 100 },
      2: { enrolled: false, status: null, progress: 0 },
    });

    const res = await loadTutorialStatuses(tutorials);
    expect(fetchTutorialProgressBatch).toHaveBeenCalledWith([1, 2]);
    expect(res).toEqual({
      1: { enrolled: true, status: 'completed', progress: 100 },
      2: { enrolled: false, status: null, progress: 0 },
    });
  });

  it('falls back to localStorage when API fails', async () => {
    const tutorials = [{ id: 3, chapters: Array(4) }];
    fetchTutorialProgressBatch.mockRejectedValue(new Error('fail'));
    localStorage.setItem('enrolled-1-3', 'true');
    localStorage.setItem(
      'progress-tutorial-1-3',
      JSON.stringify({ completedChapters: [1, 2] }),
    );

    const res = await loadTutorialStatuses(tutorials);
    expect(res[3].enrolled).toBe(true);
    expect(res[3].progress).toBeCloseTo(50);
  });
});

