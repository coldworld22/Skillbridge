import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
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
      div: React.forwardRef(({ children, whileHover, ...props }, ref) => (
        <div ref={ref} {...props}>{children}</div>
      )),
      button: React.forwardRef(({ children, whileHover, ...props }, ref) => (
        <button ref={ref} {...props}>{children}</button>
      )),
    },
  };
});

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

describe('Home page section scrolling', () => {
  const originalIntersectionObserver = window.IntersectionObserver;
  let observers = [];

  beforeEach(() => {
    observers = [];
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: jest.fn((callback, options) => {
        const observer = {
          callback,
          options,
          elements: [],
          observe(element) {
            this.elements.push(element);
          },
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
        observers.push(observer);
        return observer;
      }),
    });
  });

  afterEach(() => {
    observers = [];
    if (originalIntersectionObserver) {
      Object.defineProperty(window, 'IntersectionObserver', {
        configurable: true,
        writable: true,
        value: originalIntersectionObserver,
      });
    } else {
      delete window.IntersectionObserver;
    }
  });

  test('clicking the down arrow scrolls to the next section', async () => {
    let renderResult;
    await act(async () => {
      renderResult = render(<Home />);
    });

    const { container } = renderResult;
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(1);

    const nextSection = sections[1];
    const scrollSpy = jest.fn();
    nextSection.scrollIntoView = scrollSpy;

    const button = container.querySelector('button');
    fireEvent.click(button);

    expect(scrollSpy).toHaveBeenCalled();
  });

  test('scrolling updates the available navigation buttons', async () => {
    let renderResult;
    await act(async () => {
      renderResult = render(<Home />);
    });

    const { container } = renderResult;
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(2);

    const originalInnerHeight = window.innerHeight;
    const innerHeightDescriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      get: () => 1000,
    });

    const originalScrollHeight = document.documentElement.scrollHeight;
    const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollHeight');
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      get: () => 6000,
    });

    const originalScrollY = window.scrollY;
    const scrollYDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY');
    let scrollYValue = 0;
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => scrollYValue,
      set: (value) => {
        scrollYValue = value;
      },
    });

    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => cb();

    const setActiveSection = async (activeIndex) => {
      await waitFor(() => {
        expect(observers[0]?.elements.length).toBe(sections.length);
      });

      const observer = observers[0];
      scrollYValue = activeIndex * 1000;
      const entries = observer.elements.map((element, index) => {
        const baseTop = (index - activeIndex) * 1000;
        const top = baseTop;
        const bottom = top + 1000;

        if (typeof element.getBoundingClientRect !== 'function') {
          element.getBoundingClientRect = () => ({ top, bottom });
        }

        return {
          target: element,
          isIntersecting: index === activeIndex,
          intersectionRatio: index === activeIndex ? 1 : 0,
          boundingClientRect: { top, bottom },
        };
      });

      await act(async () => {
        observer.callback(entries, observer);
      });
    };

    const root = container.querySelector('[data-current-section]');
    expect(root).not.toBeNull();

    await setActiveSection(0);
    expect(container.querySelectorAll('[aria-label="Scroll to previous section"]').length).toBe(0);
    expect(container.querySelectorAll('[aria-label="Scroll to next section"]').length).toBe(1);
    expect(root?.getAttribute('data-current-section')).toBe('0');

    await setActiveSection(1);
    expect(root?.getAttribute('data-current-section')).toBe('1');
    expect(container.querySelectorAll('[aria-label="Scroll to previous section"]').length).toBe(1);
    expect(container.querySelectorAll('[aria-label="Scroll to next section"]').length).toBe(1);

    await setActiveSection(sections.length - 1);
    expect(container.querySelectorAll('[aria-label="Scroll to previous section"]').length).toBe(1);
    expect(container.querySelectorAll('[aria-label="Scroll to next section"]').length).toBe(0);
    expect(root?.getAttribute('data-current-section')).toBe(String(sections.length - 1));
    window.requestAnimationFrame = originalRAF;
    if (scrollYDescriptor) {
      Object.defineProperty(window, 'scrollY', scrollYDescriptor);
    } else {
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        get: () => originalScrollY,
        set: () => {},
      });
    }
    if (scrollHeightDescriptor) {
      Object.defineProperty(document.documentElement, 'scrollHeight', scrollHeightDescriptor);
    } else {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        configurable: true,
        get: () => originalScrollHeight,
      });
    }
    if (innerHeightDescriptor) {
      Object.defineProperty(window, 'innerHeight', innerHeightDescriptor);
    } else {
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        get: () => originalInnerHeight,
      });
    }
  });
});
