import React from 'react';
import { render, screen } from '@testing-library/react';
import AIRecommendations from '@/components/dashboard/AIRecommendations';

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, ...props }) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, whileHover, ...props }) => (
      <button {...props}>{children}</button>
    ),
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AIRecommendations', () => {
  it('links to the course dashboard page for each recommendation', () => {
    render(<AIRecommendations />);

    const links = screen.getAllByRole('link', {
      name: 'dashboardPage.view_course',
    });

    const expectedCourseIds = [4, 5, 6];

    expectedCourseIds.forEach((id, index) => {
      expect(links[index]).toHaveAttribute('href', `/dashboard/course/${id}`);
    });
  });
});
