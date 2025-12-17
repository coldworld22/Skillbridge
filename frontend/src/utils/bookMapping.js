import { buildUrl } from "@/utils/url";

export const mapBookForCart = (book) => ({
  id: book.id,
  name: book.title,
  author: book.author,
  category_name: book.category_name,
  rating: book.rating,
  price: book.price,
  item_type: "book",
  cover_url:
    book.cover_image_url ||
    buildUrl(book.cover_image) ||
    "/images/default-book-cover.jpg",
});

export const mapBookForWishlist = (book) => ({
  book_id: book.id,
  title: book.title,
  author: book.author,
  category_name: book.category_name,
  rating: book.rating,
  price: book.price,
  cover_url:
    book.cover_image_url ||
    buildUrl(book.cover_image) ||
    "/images/default-book-cover.jpg",
});
