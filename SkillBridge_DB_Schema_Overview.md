# SkillBridge Database Schema Overview


## Users Tables

### `users`
- **Purpose**: Master user record
- **Primary Key**: `id (uuid)`
- **Foreign Keys**: `—`

### `roles`
- **Purpose**: Role definitions
- **Primary Key**: `id`
- **Foreign Keys**: `—`

### `permissions`
- **Purpose**: System permissions
- **Primary Key**: `id`
- **Foreign Keys**: `created_by → users(id)`

### `role_permissions`
- **Purpose**: Links roles to permissions
- **Primary Key**: `role_id + permission_id`
- **Foreign Keys**: `assigned_by → users(id)`

### `user_roles`
- **Purpose**: Links users to roles
- **Primary Key**: `user_id + role_id`
- **Foreign Keys**: `—`

### `password_resets`
- **Purpose**: Handles password reset OTPs
- **Primary Key**: `id`
- **Foreign Keys**: `user_id → users(id)`
- **Columns**: `user_id`, `code`, `expires_at`, `used`, `created_at`


## Classes Tables

### `online_classes`
- **Purpose**: Main class info
- **Primary Key**: `id`
- **Foreign Keys**: `instructor_id → users(id)`

### `class_lessons`
- **Purpose**: Lessons per class
- **Primary Key**: `id`
- **Foreign Keys**: `class_id → online_classes(id)`

### `class_enrollments`
- **Purpose**: Tracks student enrollments
- **Primary Key**: `id`
- **Foreign Keys**: `user_id, class_id`

### `class_attendance`
- **Purpose**: Per-lesson attendance
- **Primary Key**: `id`
- **Foreign Keys**: `user_id, lesson_id`

### `class_assignments`
- **Purpose**: Assignments per class
- **Primary Key**: `id`
- **Foreign Keys**: `class_id`

### `assignment_submissions`
- **Purpose**: Student assignment uploads
- **Primary Key**: `id`
- **Foreign Keys**: `assignment_id, user_id`

### `class_reviews`
- **Purpose**: Student class feedback
- **Primary Key**: `id`
- **Foreign Keys**: `class_id, user_id`

### `class_likes`
- **Purpose**: Track class likes by students
- **Primary Key**: `id`
- **Foreign Keys**: `user_id, class_id`

### `class_wishlist`
- **Purpose**: Students' saved classes
- **Primary Key**: `id`
- **Foreign Keys**: `user_id, class_id`

### `class_comments`
- **Purpose**: Threaded class discussions
- **Primary Key**: `id`
- **Foreign Keys**: `class_id, user_id, parent_id`

### `class_tags`
- **Purpose**: Tag library for classes
- **Primary Key**: `id`
- **Foreign Keys**: `—`

### `class_tag_map`
- **Purpose**: Links classes to tags
- **Primary Key**: `(class_id, tag_id)`
- **Foreign Keys**: `class_id, tag_id`

### `class_views`
- **Purpose**: Track class page hits
- **Primary Key**: `id`
- **Foreign Keys**: `class_id, viewer_id`

### `class_scoring_policies`
- **Purpose**: Grading weights & pass mark
- **Primary Key**: `class_id (PK)`
- **Foreign Keys**: `class_id`

### `student_class_scores`
- **Purpose**: Aggregate scores per student
- **Primary Key**: `id`
- **Foreign Keys**: `class_id, student_id`


## Tutorials Tables

### `tutorials`
- **Purpose**: Tutorial master table
- **Primary Key**: `id`
- **Foreign Keys**: `creator_id, category_id → categories(id)`
- **Columns**: `moderation_status`, `rejection_reason`

### `tutorial_chapters`
- **Purpose**: Chapters per tutorial
- **Primary Key**: `id`
- **Foreign Keys**: `tutorial_id`

### `tutorial_enrollments`
- **Purpose**: User tutorial tracking
- **Primary Key**: `id`
- **Foreign Keys**: `tutorial_id, user_id`

### `tutorial_reviews`
- **Purpose**: Tutorial ratings/comments
- **Primary Key**: `id`
- **Foreign Keys**: `tutorial_id, user_id`

### `tutorial_comments`
- **Purpose**: Live chat/comments
- **Primary Key**: `id`
- **Foreign Keys**: `chapter_id, user_id`

### `tutorial_tests`
- **Purpose**: Quiz data (JSON)
- **Primary Key**: `id`
- **Foreign Keys**: `chapter_id`

### `tutorial_chapter_completions`
- **Purpose**: Watch tracking
- **Primary Key**: `id`
- **Foreign Keys**: `chapter_id, user_id`

### `tutorial_tags`
- **Purpose**: Available tags
- **Primary Key**: `id`
- **Foreign Keys**: `—`

### `tutorial_tag_map`
- **Purpose**: Links tutorials to tags
- **Primary Key**: `tutorial_id + tag_id`
- **Foreign Keys**: `—`


## Certificates Tables

### `certificate_templates`
- **Purpose**: Custom template library
- **Primary Key**: `id`
- **Foreign Keys**: `—`

### `certificates`
- **Purpose**: Issued certs
- **Primary Key**: `id`
- **Foreign Keys**: `user_id, class_id, template_id`

### `certificate_verifications`
- **Purpose**: Logs public scans/verifications
- **Primary Key**: `id`
- **Foreign Keys**: `certificate_id`


## Payments Tables

### `payment_methods_config`
- **Purpose**: Available payment methods
- **Primary Key**: `id`
- **Foreign Keys**: `—`
- **Columns**: `name`, `type`, `icon`, `active`, `settings`, `is_default`

### `payments`
- **Purpose**: All user payments
- **Primary Key**: `id`
- **Foreign Keys**: `user_id, method_id`

### `payouts`
- **Purpose**: Instructor withdrawal requests
- **Primary Key**: `id`
- **Foreign Keys**: `instructor_id`

### `transactions`
- **Purpose**: General ledger (all finance)
- **Primary Key**: `id`
- **Foreign Keys**: `user_id`


## Groups Tables

### `groups`
- **Purpose**: Group container
- **Primary Key**: `id`
- **Foreign Keys**: `creator_id`

### `group_members`
- **Purpose**: Users in groups
- **Primary Key**: `id`
- **Foreign Keys**: `group_id, user_id`

### `group_join_requests`
- **Purpose**: Approval queue
- **Primary Key**: `id`
- **Foreign Keys**: `group_id, user_id`

### `group_messages`
- **Purpose**: Chat messages
- **Primary Key**: `id`
- **Foreign Keys**: `group_id, sender_id`


## Community Tables

### `community_discussions`
- **Purpose**: Questions posted by users
- **Primary Key**: `id`
- **Foreign Keys**: `user_id`
- **Columns**: `title`, `content`, `resolved`, `locked`, timestamps

### `community_replies`
- **Purpose**: Answers/comments
- **Primary Key**: `id`
- **Foreign Keys**: `discussion_id, user_id`

### `community_tags`
- **Purpose**: Categorize discussions
- **Primary Key**: `id`

### `community_discussion_tags`
- **Purpose**: Many-to-many join of discussions and tags
- **Primary Key**: `(discussion_id, tag_id)`

### `community_reports`
- **Purpose**: User reports of inappropriate content
- **Primary Key**: `id`
- **Foreign Keys**: `reporter_id, discussion_id?, reply_id?`

### `community_votes`
- **Purpose**: Up/down votes on discussions or replies
- **Primary Key**: `id`
- **Foreign Keys**: `user_id, discussion_id?, reply_id?`

### `community_announcements`
- **Purpose**: Admin posts shown to the community
- **Primary Key**: `id`
- **Foreign Keys**: `author_id`

### `community_contributors`
- **Purpose**: Aggregate stats for active users
- **Primary Key**: `user_id (PK)`


## Bookings Tables

### `bookings`
- **Purpose**: Student↔Instructor slots
- **Primary Key**: `id`
- **Foreign Keys**: `student_id, instructor_id`

### `favorites`
- **Purpose**: Saved instructors
- **Primary Key**: `id`
- **Foreign Keys**: `student_id, instructor_id`

### `messages`
- **Purpose**: Booking chat
- **Primary Key**: `id`
- **Foreign Keys**: `sender_id, receiver_id, booking_id`


## Offers Tables

### `offers`
- **Purpose**: Student posts
- **Primary Key**: `id`
- **Foreign Keys**: `student_id`

### `offer_responses`
- **Purpose**: Instructor replies
- **Primary Key**: `id`
- **Foreign Keys**: `offer_id, instructor_id`

### `offer_messages`
- **Purpose**: Thread chat
- **Primary Key**: `id`
- **Foreign Keys**: `response_id, sender_id`


## Notifications Tables

### `notifications`
- **Purpose**: In-app alerts
- **Primary Key**: `id`
- **Foreign Keys**: `user_id`

### `notification_preferences`
- **Purpose**: Per-user toggle settings
- **Primary Key**: `user_id (PK)`
- **Foreign Keys**: `—`


## Admin Tables

### `settings`
- **Purpose**: Platform-wide config
- **Primary Key**: `key (PK)`
- **Foreign Keys**: `—`

### `seo_settings`
- **Purpose**: Meta tags + OG/JSON
- **Primary Key**: `page (PK)`
- **Foreign Keys**: `—`


## Plans Tables

### `plans`
- **Purpose**: Available tiers
- **Primary Key**: `id`
- **Foreign Keys**: `—`

### `plan_features`
- **Purpose**: Matrix of toggles/limits
- **Primary Key**: `id`
- **Foreign Keys**: `plan_id`

### `user_subscriptions`
- **Purpose**: User↔Plan tracking
- **Primary Key**: `id`
- **Foreign Keys**: `user_id, plan_id`


## Localization Tables

### `languages`
- **Purpose**: Multilingual setup
- **Primary Key**: `id`
- **Foreign Keys**: `—`

### `currencies`
- **Purpose**: Multi-currency config
- **Primary Key**: `id`
- **Foreign Keys**: `—`

### `exchange_rates`
- **Purpose**: Optional daily rates
- **Primary Key**: `id`
- **Foreign Keys**: `—`


## Ads Tables

### `ads`
- **Purpose**: Ad campaigns
- **Primary Key**: `id`
- **Foreign Keys**: `created_by`

### `ad_views`
- **Purpose**: Impression log
- **Primary Key**: `id`
- **Foreign Keys**: `ad_id`

### `ad_analytics`
- **Purpose**: CTR & stats
- **Primary Key**: `ad_id (PK)`
- **Foreign Keys**: `—`


## Integrations Tables

### `integrations`
- **Purpose**: Claude, GPT, etc.
- **Primary Key**: `id`
- **Foreign Keys**: `—`

### `integration_logs`
- **Purpose**: Per-use tracking
- **Primary Key**: `id`
- **Foreign Keys**: `integration_id, user_id`


## Security Tables

### `admin_audit_logs`
- **Purpose**: Admin action trail
- **Primary Key**: `id`
- **Foreign Keys**: `admin_id`
