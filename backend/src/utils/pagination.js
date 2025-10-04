const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
// Raised to support "All" selections in admin tables without truncating results.
// Aligns with the largest datasets exposed through our APIs while still
// preventing unbounded queries.
const MAX_LIMIT = 10000;

exports.parsePagination = ({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) => {
  let pageNum = parseInt(page, 10);
  let limitNum = parseInt(limit, 10);

  if (!Number.isInteger(pageNum) || pageNum < 1) {
    pageNum = DEFAULT_PAGE;
  }
  if (!Number.isInteger(limitNum) || limitNum < 1) {
    limitNum = DEFAULT_LIMIT;
  }
  if (limitNum > MAX_LIMIT) {
    limitNum = MAX_LIMIT;
  }
  return { page: pageNum, limit: limitNum, offset: (pageNum - 1) * limitNum };
};

