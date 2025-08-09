import { handleShare } from '@/pages/tutorials/[id]';
import toast from 'react-hot-toast';

describe('handleShare fallback', () => {
  it('copies link to clipboard when navigator.share is unavailable', async () => {
    const writeText = jest.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    const toastSpy = jest.spyOn(toast, 'success').mockImplementation(() => {});

    await handleShare({ title: 'Test tutorial' });

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(toastSpy).toHaveBeenCalledWith('Link copied to clipboard!');

    toastSpy.mockRestore();
  });
});
