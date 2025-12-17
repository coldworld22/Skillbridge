import { mapBookForCart, mapBookForWishlist } from '@/utils/bookMapping';

describe('bookMapping utilities', () => {
  const book = {
    id: 1,
    title: 'Test Book',
    author: 'Author Name',
    category_name: 'Category',
    rating: 4.5,
    price: 9.99,
    cover_image_url: '/cover.jpg',
  };

  it('maps book for cart', () => {
    expect(mapBookForCart(book)).toEqual({
      id: 1,
      name: 'Test Book',
      author: 'Author Name',
      category_name: 'Category',
      rating: 4.5,
      price: 9.99,
      item_type: 'book',
      cover_url: '/cover.jpg',
    });
  });

  it('maps book for wishlist', () => {
    expect(mapBookForWishlist(book)).toEqual({
      book_id: 1,
      title: 'Test Book',
      author: 'Author Name',
      category_name: 'Category',
      rating: 4.5,
      price: 9.99,
      cover_url: '/cover.jpg',
    });
  });
});
