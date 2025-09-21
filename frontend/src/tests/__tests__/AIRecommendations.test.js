import React from 'react';
import { render, screen } from '@testing-library/react';
import AIRecommendations from '@/components/dashboard/AIRecommendations';

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, ...props }) => (
      <button {...props}>{children}</button>
    ),
  },
}));

describe('AIRecommendations', () => {
  it('renders provided recommended courses', () => {
    const courses = [
      { id: 1, title: 'Test Course 1', category: 'Category A' },
      { id: 2, title: 'Test Course 2', category: 'Category B' },
    ];

    render(<AIRecommendations recommendedCourses={courses} />);

    courses.forEach((course) => {
      expect(screen.getByText(course.title)).toBeInTheDocument();
      expect(
        screen.getByText(`dashboardPage.category: ${course.category}`)
      ).toBeInTheDocument();
    });
  });
});
