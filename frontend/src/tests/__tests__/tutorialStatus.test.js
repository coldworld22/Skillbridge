import { loadTutorialStatus } from '@/pages/tutorials/index';

describe('loadTutorialStatus', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads enrollment and progress from localStorage', () => {
    const tut = { id: 1, chapters: Array(4) };
    localStorage.setItem('enrolled-1', 'true');
    localStorage.setItem(
      'progress-tutorial-1',
      JSON.stringify({ completedChapters: [1, 2] })
    );

    const { enrolled, progressPercent } = loadTutorialStatus(tut);
    expect(enrolled).toBe(true);
    expect(progressPercent).toBeCloseTo(50);
  });
});
