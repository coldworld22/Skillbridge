import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TutorialsSection, { getStars } from '@/components/website/sections/TutorialsSection';
import useTutorialListsStore from '@/store/tutorials/tutorialListsStore';
import useAuthStore from '@/store/auth/authStore';
import * as tutorialService from '../../services/tutorialService';

jest.mock('next/image', () => {
  function NextImage(props) {
    return <img {...props} />;
  }
  NextImage.displayName = 'NextImage';
  return NextImage;
});
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('next-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('framer-motion', () => {
  const motion = {
    div: function MotionDiv({ children, ...props }) {
      return <div {...props}>{children}</div>;
    },
    h2: function MotionH2({ children, ...props }) {
      return <h2 {...props}>{children}</h2>;
    },
    a: function MotionLink({ children, ...props }) {
      return <a {...props}>{children}</a>;
    },
    button: function MotionButton({ children, ...props }) {
      return <button {...props}>{children}</button>;
    },
  };
  motion.div.displayName = 'motion.div';
  motion.h2.displayName = 'motion.h2';
  motion.a.displayName = 'motion.a';
  motion.button.displayName = 'motion.button';
  return { motion };
});
const addItem = jest.fn().mockResolvedValue(undefined);
jest.mock('../../store/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => selector({ addItem }),
}));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../../services/tutorialService', () => ({
  fetchFeaturedTutorials: jest.fn(),
  getMyTutorialWishlist: jest.fn(),
  getMyTutorialFavorites: jest.fn(),
  getMyEnrolledTutorials: jest.fn(),
  addTutorialToWishlist: jest.fn().mockResolvedValue({}),
  removeTutorialFromWishlist: jest.fn().mockResolvedValue({}),
  addTutorialToFavorites: jest.fn().mockResolvedValue({}),
  removeTutorialFromFavorites: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../services/instructor/categoryService', () => ({
  fetchAllCategories: jest.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: { id: 1, role: 'student' } });
  useTutorialListsStore.setState({ wishlistIds: [], favoriteIds: [] });
});

describe('getStars rating clamp', () => {
  it('renders five muted stars for ratings below 0', () => {
    const { container } = render(<>{getStars(-2)}</>);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(5);
    icons.forEach((icon) => {
      expect(icon.getAttribute('class')).toEqual(expect.stringContaining('text-gray-600'));
    });
  });

  it('renders five stars for ratings above 5', () => {
    const { container } = render(<>{getStars(6.7)}</>);
    expect(container.querySelectorAll('svg').length).toBe(5);
  });
});

describe('tutorial list toggles', () => {
  it('toggles wishlist without refetching list', async () => {
    const { toggleWishlist } = useTutorialListsStore.getState();
    await toggleWishlist(5);
    expect(tutorialService.addTutorialToWishlist).toHaveBeenCalledWith(5);
    expect(tutorialService.getMyTutorialWishlist).not.toHaveBeenCalled();
    expect(useTutorialListsStore.getState().wishlistIds).toContain(5);
    await toggleWishlist(5);
    expect(tutorialService.removeTutorialFromWishlist).toHaveBeenCalledWith(5);
    expect(tutorialService.getMyTutorialWishlist).not.toHaveBeenCalled();
    expect(useTutorialListsStore.getState().wishlistIds).not.toContain(5);
  });

  it('toggles favorites without refetching list', async () => {
    const { toggleFavorite } = useTutorialListsStore.getState();
    await toggleFavorite(7);
    expect(tutorialService.addTutorialToFavorites).toHaveBeenCalledWith(7);
    expect(tutorialService.getMyTutorialFavorites).not.toHaveBeenCalled();
    expect(useTutorialListsStore.getState().favoriteIds).toContain(7);
    await toggleFavorite(7);
    expect(tutorialService.removeTutorialFromFavorites).toHaveBeenCalledWith(7);
    expect(tutorialService.getMyTutorialFavorites).not.toHaveBeenCalled();
    expect(useTutorialListsStore.getState().favoriteIds).not.toContain(7);
  });
});

test('add-to-cart uses discountPrice when present', async () => {
  tutorialService.fetchFeaturedTutorials.mockResolvedValue([
    {
      id: 1,
      title: 'Discounted Tutorial',
      price: 100,
      discountPrice: 50,
      currency: 'USD',
      level: 'Beginner',
      tags: [],
      instructor: 'Jane',
      category: 'General',
    },
  ]);
  tutorialService.getMyTutorialWishlist.mockResolvedValue([]);
  tutorialService.getMyTutorialFavorites.mockResolvedValue([]);
  tutorialService.getMyEnrolledTutorials.mockResolvedValue([]);

  render(<TutorialsSection />);
  const btn = await screen.findByRole('button', {
    name: /add tutorial to cart/i,
  });
  fireEvent.click(btn);
  await waitFor(() => expect(addItem).toHaveBeenCalled());
  expect(addItem).toHaveBeenCalledWith(
    expect.objectContaining({ price: 50 })
  );
});
