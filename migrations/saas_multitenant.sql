BEGIN;

-- Enums (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
    CREATE TYPE membership_role AS ENUM ('tenant_admin','instructor','student');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
    CREATE TYPE membership_status AS ENUM ('active','pending','revoked');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active','disabled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_role') THEN
    CREATE TYPE platform_role AS ENUM ('none','super_admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_state') THEN
    CREATE TYPE subscription_state AS ENUM ('trial','active','grace','suspended','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'domain_status') THEN
    CREATE TYPE domain_status AS ENUM ('pending','verified','disabled');
  END IF;
END$$;

-- Core tables
CREATE TABLE IF NOT EXISTS tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  status     subscription_state NOT NULL DEFAULT 'active',
  plan_id    UUID REFERENCES plans(id),
  branding   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS platform_role platform_role NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS tenant_memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        membership_role NOT NULL,
  status      membership_status NOT NULL DEFAULT 'active',
  invited_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS tenant_memberships_user_idx ON tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS tenant_memberships_tenant_role_idx ON tenant_memberships(tenant_id, role);

CREATE TABLE IF NOT EXISTS tenant_domains (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain              TEXT NOT NULL UNIQUE,
  status              domain_status NOT NULL DEFAULT 'pending',
  verification_token  TEXT NOT NULL,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenant_domains_verified_idx ON tenant_domains(domain) WHERE status = 'verified';

CREATE TABLE IF NOT EXISTS subscriptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id        UUID NOT NULL REFERENCES plans(id),
  state          subscription_state NOT NULL,
  period_start   TIMESTAMPTZ NOT NULL,
  period_end     TIMESTAMPTZ NOT NULL,
  trial_end      TIMESTAMPTZ,
  cancel_at      TIMESTAMPTZ,
  provider       TEXT,
  provider_sub   TEXT,
  provider_cust  TEXT,
  meta           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);
CREATE INDEX IF NOT EXISTS subscriptions_state_idx ON subscriptions(state);
CREATE INDEX IF NOT EXISTS subscriptions_provider_sub_idx ON subscriptions(provider, provider_sub);

-- Optional overrides/counters
CREATE TABLE IF NOT EXISTS feature_overrides (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key  TEXT NOT NULL,
  limit_type   TEXT NOT NULL CHECK (limit_type IN ('count','storage_bytes','boolean')),
  limit_value  BIGINT,
  enabled      BOOLEAN,
  UNIQUE (tenant_id, feature_key)
);

CREATE TABLE IF NOT EXISTS usage_counters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key   TEXT NOT NULL,
  current_value BIGINT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, feature_key)
);

-- Seed plan/tenant and backfill tenant_id on tenant-owned tables
DO $$
DECLARE
  default_plan   UUID;
  default_tenant UUID;
  tbl TEXT;
  tenant_tables TEXT[] := ARRAY[
    'ad_analytics','ad_views','ads','admin_audit_logs','admin_profiles',
    'assignment_submissions','blog_posts','book_cart','book_categories','book_purchases','book_reviews','book_tag_map','book_wishlist','bookings','books',
    'cart_items','carts','categories','certificate_templates','certificate_verifications','certificates','chat_moderation',
    'class_assignments','class_attendance','class_comments','class_enrollments','class_lessons','class_likes','class_reminder_subscriptions','class_resources','class_reviews','class_scoring_policies','class_tag_map','class_tags','class_views','class_wishlist',
    'community_contributors','community_discussion_tags','community_discussions','community_likes','community_replies','community_reports','community_tags','community_views','community_votes',
    'coupons','faqs','group_join_requests','group_members','group_messages','group_tag_map','group_tags','groups',
    'instructor_certificates','instructor_profiles','instructor_reviews','instructor_wallets',
    'integration_logs','integrations','invoices',
    'messages','notifications',
    'offer_messages','offer_responses','offer_tag_map','offer_tags','offers',
    'online_classes',
    'payments','payment_schedules','payouts',
    'popup_announcements',
    'refresh_tokens',
    'settings',
    'social_accounts',
    'student_class_scores','student_preferences','student_profiles',
    'support_attachments','support_messages','support_tickets','suspicious_logs',
    'tags',
    'ticket_attachments','ticket_messages','ticket_tags','tickets',
    'tutorial_assignment_submissions','tutorial_assignments','tutorial_chapters','tutorial_comments','tutorial_enrollments','tutorial_favorites','tutorial_reviews','tutorial_tag_map','tutorial_views','tutorial_wishlist','tutorials',
    'user_roles','user_social_links','user_subscriptions',
    'verifications',
    'video_call_messages','video_call_participants','video_calls'
  ];
BEGIN
  INSERT INTO plans (name, slug, price_monthly, price_yearly, currency, recommended, active, target_role)
  VALUES ('Legacy', 'default-tenant-plan', 0, 0, 'USD', false, true, 'student')
  ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
  RETURNING id INTO default_plan;
  IF default_plan IS NULL THEN
    SELECT id INTO default_plan FROM plans ORDER BY created_at LIMIT 1;
  END IF;

  INSERT INTO tenants (name, slug, status, plan_id)
  VALUES ('Default', 'default', 'active', default_plan)
  ON CONFLICT (slug) DO UPDATE SET plan_id = EXCLUDED.plan_id
  RETURNING id INTO default_tenant;

  INSERT INTO subscriptions (tenant_id, plan_id, state, period_start, period_end)
  VALUES (default_tenant, default_plan, 'active', now(), now() + interval '1 year')
  ON CONFLICT (tenant_id) DO NOTHING;

  INSERT INTO tenant_memberships (tenant_id, user_id, role, status)
  SELECT default_tenant, u.id, 'tenant_admin'::membership_role, 'active'::membership_status
  FROM users u
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  FOREACH tbl IN ARRAY tenant_tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid', tbl);
      EXECUTE format('UPDATE public.%I SET tenant_id = $1 WHERE tenant_id IS NULL', tbl) USING default_tenant;
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET NOT NULL', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE', tbl, tbl || '_tenant_fk');
    EXCEPTION
      WHEN duplicate_column THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(tenant_id)', tbl || '_tenant_idx', tbl);
    EXCEPTION
      WHEN duplicate_table THEN NULL;
    END;
  END LOOP;
END$$;

-- Rescope uniques to (tenant_id, field)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ads_tenant_title_unique') THEN
    ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_title_unique;
    ALTER TABLE ads ADD CONSTRAINT ads_tenant_title_unique UNIQUE (tenant_id, title);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_tenant_slug_unique') THEN
    ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_slug_unique;
    ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'book_categories_tenant_slug_unique') THEN
    ALTER TABLE book_categories DROP CONSTRAINT IF EXISTS book_categories_slug_unique;
    ALTER TABLE book_categories ADD CONSTRAINT book_categories_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_tenant_slug_unique') THEN
    ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_unique;
    ALTER TABLE categories ADD CONSTRAINT categories_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_tags_tenant_slug_unique') THEN
    ALTER TABLE class_tags DROP CONSTRAINT IF EXISTS class_tags_slug_unique;
    ALTER TABLE class_tags ADD CONSTRAINT class_tags_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_tags_tenant_name_unique') THEN
    ALTER TABLE community_tags DROP CONSTRAINT IF EXISTS community_tags_name_unique;
    ALTER TABLE community_tags DROP CONSTRAINT IF EXISTS community_tags_slug_unique;
    ALTER TABLE community_tags ADD CONSTRAINT community_tags_tenant_name_unique UNIQUE (tenant_id, name);
    ALTER TABLE community_tags ADD CONSTRAINT community_tags_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_tags_tenant_name_unique') THEN
    ALTER TABLE group_tags DROP CONSTRAINT IF EXISTS group_tags_name_unique;
    ALTER TABLE group_tags DROP CONSTRAINT IF EXISTS group_tags_slug_unique;
    ALTER TABLE group_tags ADD CONSTRAINT group_tags_tenant_name_unique UNIQUE (tenant_id, name);
    ALTER TABLE group_tags ADD CONSTRAINT group_tags_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_tags_tenant_name_unique') THEN
    ALTER TABLE offer_tags DROP CONSTRAINT IF EXISTS offer_tags_name_unique;
    ALTER TABLE offer_tags DROP CONSTRAINT IF EXISTS offer_tags_slug_unique;
    ALTER TABLE offer_tags ADD CONSTRAINT offer_tags_tenant_name_unique UNIQUE (tenant_id, name);
    ALTER TABLE offer_tags ADD CONSTRAINT offer_tags_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'online_classes_tenant_slug_unique') THEN
    ALTER TABLE online_classes DROP CONSTRAINT IF EXISTS online_classes_slug_unique;
    ALTER TABLE online_classes ADD CONSTRAINT online_classes_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_tenant_name_unique') THEN
    ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_unique;
    ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_slug_unique;
    ALTER TABLE tags ADD CONSTRAINT tags_tenant_name_unique UNIQUE (tenant_id, name);
    ALTER TABLE tags ADD CONSTRAINT tags_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tutorials_tenant_slug_unique') THEN
    ALTER TABLE tutorials DROP CONSTRAINT IF EXISTS tutorials_slug_unique;
    DROP INDEX IF EXISTS tutorials_lower_title_idx;
    DROP INDEX IF EXISTS tutorials_slug_unique_idx;
    ALTER TABLE tutorials ADD CONSTRAINT tutorials_tenant_slug_unique UNIQUE (tenant_id, slug);
    CREATE UNIQUE INDEX tutorials_lower_title_idx ON tutorials (tenant_id, lower(title));
  END IF;
END$$;

COMMIT;
