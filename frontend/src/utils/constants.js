export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export const BOOK_PRICE_RANGE_DEFAULT = Number(
  process.env.NEXT_PUBLIC_BOOK_PRICE_RANGE_DEFAULT ?? 100
);
export const BOOK_PRICE_RANGE_MAX = Number(
  process.env.NEXT_PUBLIC_BOOK_PRICE_RANGE_MAX ?? 500
);
