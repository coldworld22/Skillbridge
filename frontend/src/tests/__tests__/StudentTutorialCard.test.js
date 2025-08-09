import { render, screen } from '@testing-library/react';
import StudentTutorialCard from '@/components/tutorials/StudentTutorialCard';

describe('StudentTutorialCard', () => {
  const tutorial = {
    id: 1,
    title: 'Sample Tutorial',
    category: 'Education',
    instructor: 'Jane Doe',
    thumbnail: '/sample-thumbnail.jpg',
    totalLessons: 10,
    completedLessons: 5,
    isCompleted: false,
    rating: 4.5,
  };

  it('renders thumbnail with lazy loading', () => {
    render(<StudentTutorialCard tutorial={tutorial} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });
});
