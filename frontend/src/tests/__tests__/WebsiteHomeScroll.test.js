import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Home from '../../pages/website/index';

function createMock(name) {
  return () => <div>{name}</div>;
}

jest.mock('../../components/website/sections/Navbar', () => createMock('Navbar'));
jest.mock('../../components/website/sections/Hero', () => createMock('Hero'));
jest.mock('../../components/website/sections/OnlineClasses', () => createMock('OnlineClasses'));
jest.mock('../../components/website/sections/TutorialsSection', () => createMock('TutorialsSection'));
jest.mock('../../components/website/sections/BooksSection', () => createMock('BooksSection'));
jest.mock('../../components/website/sections/LearningMarketplace', () => createMock('LearningMarketplace'));
jest.mock('../../components/website/sections/StudyCategories', () => createMock('StudyCategories'));
jest.mock('../../components/website/sections/StudyGroups', () => createMock('StudyGroups'));
jest.mock('../../components/website/sections/InstructorBooking', () => createMock('InstructorBooking'));
jest.mock('../../components/website/sections/SubscriptionPlans', () => createMock('SubscriptionPlans'));
jest.mock('../../components/website/sections/AITutoring', () => createMock('AITutoring'));
jest.mock('../../components/website/sections/CommunityEngagement', () => createMock('CommunityEngagement'));
jest.mock('../../components/website/sections/Footer', () => createMock('Footer'));
jest.mock('../../components/auth/IncompleteAlertModal', () => createMock('IncompleteAlertModal'));

jest.mock('../../store/auth/authStore', () => ({
  __esModule: true,
  default: () => ({ user: { role: 'student' } }),
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div ref={ref} {...props}>{children}</div>
      )),
      button: React.forwardRef(({ children, ...props }, ref) => (
        <button ref={ref} {...props}>{children}</button>
      )),
    },
  };
});

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

describe('Home page section scrolling', () => {
  test('clicking the down arrow scrolls to the next section', () => {
    const { container } = render(<Home />);
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(1);

    const nextSection = sections[1];
    const scrollSpy = jest.fn();
    nextSection.scrollIntoView = scrollSpy;

    const button = container.querySelector('button');
    fireEvent.click(button);

    expect(scrollSpy).toHaveBeenCalled();
  });
});
