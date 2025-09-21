import React from 'react';
import { render, screen } from '@testing-library/react';
import AIRecommendations from '../../components/dashboard/AIRecommendations';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  const MockComponent = React.forwardRef(({ children, whileHover, ...rest }, ref) => (
    <div ref={ref} {...rest}>
      {children}
    </div>
  ));

  return {
    motion: new Proxy(
      {},
      {
        get: () => MockComponent,
      }
    ),
  };
});

describe('AIRecommendations', () => {
  it('renders courses provided through props', () => {
    const recommendedCourses = [
      { id: 1, title: 'Course One', category: 'Category One' },
      { id: 2, title: 'Course Two', category: 'Category Two' },
    ];

    render(<AIRecommendations recommendedCourses={recommendedCourses} />);

    recommendedCourses.forEach((course) => {
      expect(screen.getByText(course.title)).toBeInTheDocument();
      expect(
        screen.getByText(`dashboardPage.category: ${course.category}`)
      ).toBeInTheDocument();
    });
  });
});
