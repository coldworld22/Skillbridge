const express = require('express');
const router = express.Router();

router.use('/api/health', require('./health.routes'));
router.use('/api/cache', require('./cache.routes'));
router.use('/api/auth', require('../modules/auth/routes/auth.routes'));
router.use('/api/users', require('../modules/users/user.routes'));
router.use('/api/verify', require('../modules/verify/verify.routes'));
router.use('/api/license', require('../modules/license/license.routes'));
router.use(
  '/api/certificates',
  require('../modules/users/tutorials/certificate/certificatePublic.routes')
);
router.use(
  '/api/certificates/admin',
  require('../modules/users/tutorials/certificate/certificateAdmin.routes')
);
router.use('/api/certificate-templates', require('../modules/certificateTemplates/certificateTemplates.routes'));
router.use('/api/bookings/admin', require('../modules/bookings/bookings.routes'));
router.use('/api/bookings/student', require('../modules/bookings/student.routes'));
router.use('/api/bookings/instructor', require('../modules/bookings/instructor.routes'));
router.use('/api/community/admin', require('../modules/community/admin/admin.routes'));
router.use('/api/community', require('../modules/community/public/public.routes'));
router.use('/api/related-questions', require('../modules/community/public/relatedQuestions.routes'));
router.use('/api/roles', require('../modules/roles/roles.routes'));
router.use('/api/plans', require('../modules/plans/plans.routes'));
router.use(
  '/api/user-subscriptions',
  require('../modules/subscriptions/subscriptions.routes')
);
// Register admin routes before public routes to prevent public routes from catching
// requests intended for admin endpoints such as "/api/payment-methods/admin".
router.use(
  '/api/payment-methods/admin',
  require('../modules/paymentMethods/paymentMethods.routes')
);
router.use(
  '/api/payment-methods',
  require('../modules/paymentMethods/paymentMethods.public.routes')
);
router.use('/api/payments/student', require('../modules/payments/student.routes'));
router.use('/api/payments/instructor', require('../modules/payments/instructor.routes'));
router.use('/api/payments/bank', require('../modules/payments/bank.routes'));
router.use('/api/payments/crypto', require('../modules/payments/crypto.routes'));
router.use('/api/payments/coinbase', require('../modules/payments/coinbase.routes'));
// Alias for NOWPayments crypto gateway
router.use(
  '/api/payments/nowpayments',
  require('../modules/payments/crypto.routes')
);
// PayPal order creation and callback
router.use(
  '/api/payments/paypal',
  require('../modules/payments/paypal.routes')
);
router.use('/api/payments/stripe', require('../modules/payments/stripe.routes'));
router.use('/api/payments/admin', require('../modules/payments/payments.routes'));
router.use('/api/invoices/admin', require('../modules/invoices/invoices.routes'));
router.use('/api/invoices/student', require('../modules/invoices/student.routes'));
router.use('/api/invoices/instructor', require('../modules/invoices/instructor.routes'));
router.use(
  '/api/admin/payments/bank',
  require('../modules/payments/bank.admin.routes')
);
router.use('/api/admin/cache', require('./cache.routes'));
router.use('/api/payments/config', require('../modules/paymentConfig/paymentConfig.routes'));
router.use('/api/messages/config', require('../modules/messagesConfig/messagesConfig.routes'));
router.use('/api/social-login/config', require('../modules/socialLoginConfig/socialLoginConfig.routes'));
router.use('/api/app-config', require('../modules/appConfig/appConfig.routes'));
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
router.use('/api/payouts', require('../modules/payouts/payouts.routes'));
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
// set to the string "true" (case-insensitive).
if (process.env.INSTALL_API_ENABLED?.toLowerCase() === 'true') {
  router.use('/api/install', require('../modules/install/install.routes'));
}
router.use('/api/users/classes/lessons', require('./lesson.routes'));
router.use('/api/video-calls', require('./videoCalls.routes'));

router.get('/', (_req, res) => res.send('🚀 SkillBridge API is live.'));

module.exports = router;
