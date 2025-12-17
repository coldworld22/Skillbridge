import { render, screen } from '@testing-library/react';
import CourseProgress from '@/components/classes/CourseProgress';

describe('CourseProgress', () => {
  it('renders progress percentage', () => {
    render(<CourseProgress percentage={50} />);
    const bar = screen.getByTestId('course-progress-bar');
    expect(bar.style.width).toBe('50%');
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  it('caps percentage between 0 and 100', () => {
    render(<CourseProgress percentage={150} />);
    const bar = screen.getByTestId('course-progress-bar');
    expect(bar.style.width).toBe('100%');
    expect(screen.getByText('100% Complete')).toBeInTheDocument();
  });
});
