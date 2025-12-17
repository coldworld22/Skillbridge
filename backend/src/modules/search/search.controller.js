const service = require('./search.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');

exports.search = catchAsync(async (req, res) => {
  const q = req.query.q ? req.query.q.trim() : '';
  if (!q) return res.status(400).json({ error: 'Missing query string' });

  const [classes, tutorials, books, instructors, offers, community, blog] =
    await Promise.all([
      service.searchClasses(q),
      service.searchTutorials(q),
      service.searchBooks(q),
      service.searchInstructors(q),
      service.searchOffers(q),
      service.searchCommunity(q),
      service.searchBlog(q),
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
