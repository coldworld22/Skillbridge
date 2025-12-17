import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react';
import Hero from '../../components/website/sections/Hero';
import { fetchAds, recordAdView, recordAdClick } from '../../services/adsService';

jest.mock('next/image', () => ({ src, alt, ...rest }) => <img src={src} alt={alt} {...rest} />);
jest.mock('next/link', () => ({ children }) => <>{children}</>);
jest.mock('next-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('framer-motion', () => {
  const React = require('react');
  const Mock = React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  ));
  return {
    motion: new Proxy({}, { get: () => Mock }),
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});
jest.mock('react-swipeable', () => ({ useSwipeable: () => ({}) }));
jest.mock('typewriter-effect', () => () => <div>Typewriter</div>);
jest.mock('../../components/website/AdMediaModal', () => () => <div />);
jest.mock('../../components/shared/SidebarMenu', () => () => <div />);
jest.mock('../../components/shared/Chatbot', () => () => <div />);
jest.mock('../../store/appConfigStore', () => {
  const store = { settings: {}, fetch: jest.fn(), loaded: true };
  return { __esModule: true, default: (selector) => selector(store) };
});
jest.mock('../../store/auth/authStore', () => ({
  __esModule: true,
  default: (selector) =>
    selector({
      user: { id: 1, roles: ['student'] },
      isAuthenticated: () => true,
    }),
}));
jest.mock('../../services/adsService', () => ({
  fetchAds: jest.fn(),
  recordAdView: jest.fn(),
  recordAdClick: jest.fn(),
}));

describe('Hero ad rotations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    fetchAds.mockResolvedValue({
      data: [
        {
          id: 1,
          title: 'Ad1',
          description: '',
          image: '',
          video: null,
          link: '#',
          end_at: null,
        },
        {
          id: 2,
          title: 'Ad2',
          description: '',
          image: '',
          video: null,
          link: '#',
          end_at: null,
        },
      ],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('records a single view per ad rotation', async () => {
    render(<Hero />);

    await waitFor(() => expect(fetchAds).toHaveBeenCalledWith({ role: 'student' }));
    await waitFor(() => expect(recordAdView).toHaveBeenCalledTimes(1));

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    await waitFor(() => expect(recordAdView).toHaveBeenCalledTimes(2));

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    await waitFor(() => expect(recordAdView).toHaveBeenCalledTimes(3));
  });

  test('records a click when ad link is followed', async () => {
    const { findByText } = render(<Hero />);

    await waitFor(() => expect(fetchAds).toHaveBeenCalled());

    fireEvent.click(await findByText('learn_more'));

    expect(recordAdClick).toHaveBeenCalledWith(1);
  });
});
