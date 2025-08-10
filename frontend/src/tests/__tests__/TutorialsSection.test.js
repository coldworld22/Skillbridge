import { render } from '@testing-library/react';
import { getStars } from '@/components/website/sections/TutorialsSection';

describe('getStars rating clamp', () => {
  it('renders no stars for ratings below 0', () => {
    const { container } = render(<>{getStars(-2)}</>);
    expect(container.querySelectorAll('svg').length).toBe(0);
  });

  it('renders five stars for ratings above 5', () => {
    const { container } = render(<>{getStars(6.7)}</>);
    expect(container.querySelectorAll('svg').length).toBe(5);
  });
});
