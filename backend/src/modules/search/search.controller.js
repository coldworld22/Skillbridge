const service = require('./search.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');

exports.search = catchAsync(async (req, res) => {
  const q = req.query.q ? req.query.q.trim() : '';
  if (!q) return res.status(400).json({ error: 'Missing query string' });
  const tenantId = req.tenant?.id;

  const [classes, tutorials, books, instructors, offers, community, blog] =
    await Promise.all([
      service.searchClasses(q, tenantId),
      service.searchTutorials(q, tenantId),
      service.searchBooks(q, tenantId),
      service.searchInstructors(q, tenantId),
      service.searchOffers(q, tenantId),
      service.searchCommunity(q, tenantId),
      service.searchBlog(q, tenantId),
    ]);

  sendSuccess(res, {
    classes,
    tutorials,
    books,
    instructors,
    offers,
    community,
    blog,
  });
});
