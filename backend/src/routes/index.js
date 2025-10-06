const express = require('express');
const router = express.Router();
const {
  requireInstallApiEnabled,
  router: installRouter,
} = require('../modules/install/install.routes');
const tutorialController = require('../modules/users/tutorials/tutorial.controller');

router.use('/api/csrf-token', require('./csrf.routes'));
// grouped routers
router.use(require('./auth'));
router.use(require('./payments'));
router.use('/api/bookings/admin', require('../modules/bookings/bookings.routes'));
router.use('/api/bookings/student', require('../modules/bookings/student.routes'));
router.use('/api/bookings/instructor', require('../modules/bookings/instructor.routes'));
router.use('/api/community/admin', require('../modules/community/admin/admin.routes'));
router.use('/api/community', require('../modules/community/public/public.routes'));
router.use('/api/related-questions', require('../modules/community/public/relatedQuestions.routes'));
router.use('/api/admin/cache', require('./cache.routes'));
router.use('/api/messages/config', require('../modules/messagesConfig/messagesConfig.routes'));
router.use('/api/social-login/config', require('../modules/socialLoginConfig/socialLoginConfig.routes'));
router.use('/api/app-config', require('../modules/appConfig/appConfig.routes'));
router.use('/api/license', require('../modules/license/license.routes'));
router.use('/api/third-party-config', require('../modules/thirdPartyConfig/thirdPartyConfig.routes'));
router.use('/api/google-analytics', require('../modules/googleAnalytics/googleAnalytics.routes'));
router.use('/api/adsense', require('../modules/adsense/adsense.routes'));
router.use('/api/ai-assistance', require('../modules/ai/ai.routes'));
router.use('/api/email-config', require('../modules/emailConfig/emailConfig.routes'));
router.use('/api/contact-config', require('../modules/contactConfig/contactConfig.routes'));
router.use('/api/contact', require('../modules/contact/contact.routes'));
router.use('/api/seo-config', require('../modules/seoConfig/seoConfig.routes'));
router.use('/api/popup-announcements', require('../modules/popupAnnouncements/popupAnnouncements.routes'));
router.use('/api/policies', require('../modules/policies/policies.routes'));
router.use('/api/ads', require('../modules/ads/ads.routes'));
router.use('/api/coupons', require('../modules/coupons/coupons.routes'));
router.use('/api/groups', require('../modules/groups/groups.routes'));
router.use('/api/offers', require('../modules/offers/offers.routes'));
router.use('/api/offers/:offerId/responses', require('../modules/offers/offerResponses.routes'));
router.use('/api/instructors', require('../modules/instructors/instructor.routes'));
router.use('/api/students', require('../modules/students/student.routes'));
router.use('/api/cart', require('../modules/cart/cart.routes'));
router.use('/api/notifications', require('../modules/notifications/notifications.routes'));
router.use('/api/system-errors', require('../modules/errorLogs/errorLogs.routes'));
router.use('/api/messages', require('../modules/messages/messages.routes'));
router.use('/api/chat', require('../modules/chat/chat.routes'));
router.use('/api/moderation', require('../modules/moderation/moderation.routes'));
router.use('/api/languages', require('../modules/languages/languages.routes'));
router.use('/api/currencies', require('../modules/currencies/currencies.routes'));
router.use('/api/blog', require('../modules/blog/blog.routes'));
router.use('/api/faqs', require('../modules/faqs/faqs.routes'));
router.use('/api/support', require('../modules/support/support.routes'));
router.use('/api/tickets', require('../modules/tickets/tickets.routes'));
router.use('/api/media', require('../modules/media/media.routes'));
router.use('/api/book-categories', require('../modules/bookCategories/bookCategories.routes'));
router.use('/api/books', require('../modules/books/book.routes'));
router.use('/api/instructor/books', require('../modules/books/instructorBook.routes'));
router.use('/api/book-reviews', require('../modules/bookReviews/bookReview.routes'));
router.use('/api/library', require('../modules/library/library.routes'));
router.use('/api/search', require('../modules/search/search.routes'));
// Installation routes are disabled by default for security reasons.
// They can be enabled explicitly via the INSTALL_API_ENABLED environment variable
// set to a truthy string such as "true", "1", "yes", or "on" (case-insensitive).
router.use('/api/install', requireInstallApiEnabled, installRouter);
router.use('/api/users/classes/lessons', require('./lesson.routes'));
router.use('/api/video-calls', require('./videoCalls.routes'));

// Public tutorials shortcuts (used by the marketing site)
router.get('/api/tutorials/featured', tutorialController.getFeaturedTutorials);

router.get('/', (_req, res) => res.send('🚀 SkillBridge API is live.'));

module.exports = router;
