--
-- PostgreSQL database dump
--

\restrict MIUfT1fWtN7QgMTFqddg8XGebblgaJCidw6vMiHc3zCi6j0N0r2b5gygWEZXv5E

-- Dumped from database version 14.19 (Debian 14.19-1.pgdg13+1)
-- Dumped by pg_dump version 14.19 (Debian 14.19-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: class_resource_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.class_resource_type AS ENUM (
    'file',
    'link'
);


--
-- Name: online_class_access_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.online_class_access_type AS ENUM (
    'paid',
    'free'
);


--
-- Name: online_classes_access_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.online_classes_access_type_enum AS ENUM (
    'paid',
    'free'
);


--
-- Name: check_class_capacity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_class_capacity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      enrolled_count integer;
      max_cap integer;
    BEGIN
      IF NEW.status = 'cancelled' THEN
        RETURN NEW;
      END IF;

      SELECT COUNT(*) INTO enrolled_count
      FROM class_enrollments
      WHERE class_id = NEW.class_id AND status <> 'cancelled';

      SELECT max_students INTO max_cap
      FROM online_classes
      WHERE id = NEW.class_id;

      IF max_cap IS NOT NULL AND enrolled_count > max_cap THEN
        RAISE EXCEPTION 'Class is full';
      END IF;

      RETURN NEW;
    END;
    $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ad_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_analytics (
    ad_id uuid NOT NULL,
    views integer DEFAULT 0,
    clicks integer DEFAULT 0,
    ctr numeric(8,4) DEFAULT '0'::numeric,
    unique_viewers integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ad_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_views (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ad_id uuid NOT NULL,
    user_id uuid,
    viewed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(255),
    user_agent text,
    location character varying(255)
);


--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    admin_id uuid NOT NULL,
    action character varying(255) NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: admin_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_profiles (
    user_id uuid NOT NULL,
    job_title character varying(255),
    department character varying(255),
    identity_doc_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    image_url character varying(255),
    link_url character varying(255),
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    video_url character varying(255),
    is_active boolean DEFAULT false NOT NULL,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    target_roles text[] DEFAULT '{}'::text[],
    ad_type character varying(255),
    priority integer DEFAULT 0,
    allow_branding boolean DEFAULT false,
    price numeric(10,2) DEFAULT '0'::numeric,
    purchased_by uuid,
    purchased_at timestamp with time zone
);


--
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_url character varying(255),
    grade integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    text_answer text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: blacklisted_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blacklisted_tokens (
    id integer NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    token character varying(255)
);


--
-- Name: blacklisted_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blacklisted_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blacklisted_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blacklisted_tokens_id_seq OWNED BY public.blacklisted_tokens.id;


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    excerpt text,
    content text,
    image_url character varying(255),
    published_at date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: book_cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_cart (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    book_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: book_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: book_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_purchases (
    id integer NOT NULL,
    student_id uuid NOT NULL,
    book_id integer NOT NULL,
    price_paid numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    purchased_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: book_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.book_purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: book_purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.book_purchases_id_seq OWNED BY public.book_purchases.id;


--
-- Name: book_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_reviews (
    id integer NOT NULL,
    book_id integer,
    user_id uuid,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: book_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.book_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: book_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.book_reviews_id_seq OWNED BY public.book_reviews.id;


--
-- Name: book_tag_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_tag_map (
    book_id integer NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: book_wishlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_wishlist (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    book_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    instructor_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    notes text,
    status character varying(255) DEFAULT 'pending'::character varying,
    requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: books; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.books (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    detailed_description text,
    price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    pdf_url text,
    cover_image_url text,
    instructor_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    allow_preview boolean DEFAULT false NOT NULL,
    preview_pages jsonb,
    category_id uuid,
    short_description text,
    language character varying(255),
    license_type character varying(255),
    included_plans jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT books_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'active'::text, 'inactive'::text])))
);


--
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    item_id character varying(255) NOT NULL,
    name character varying(255),
    item_type character varying(255) DEFAULT 'class'::character varying NOT NULL,
    price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reminder_sent boolean DEFAULT false
);


--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    user_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    parent_id uuid,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    slug character varying(255) NOT NULL,
    image_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    icon character varying(255)
);


--
-- Name: certificate_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) DEFAULT 'Completion'::character varying,
    font_family character varying(255) DEFAULT 'Georgia, serif'::character varying,
    title_font character varying(255) DEFAULT '''Great Vibes'', cursive'::character varying,
    border_color character varying(255) DEFAULT '#FACC15'::character varying,
    logo text,
    background text,
    show_qr boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    active boolean DEFAULT true,
    sample_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    for_tutorials boolean DEFAULT true NOT NULL,
    for_online_classes boolean DEFAULT true NOT NULL
);


--
-- Name: certificate_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_verifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    certificate_id uuid NOT NULL,
    ip_address character varying(255),
    user_agent character varying(255),
    verified_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    tutorial_id uuid,
    class_id uuid,
    template_id uuid,
    certificate_code character varying(255) NOT NULL,
    status text DEFAULT 'issued'::text,
    revoked_at timestamp with time zone,
    reason character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    recipient_name_override character varying(255),
    instructor_name_override character varying(255),
    platform_name_override character varying(255),
    grade character varying(255),
    verification_url character varying(255),
    details jsonb,
    CONSTRAINT certificates_status_check CHECK ((status = ANY (ARRAY['issued'::text, 'revoked'::text, 'pending'::text])))
);


--
-- Name: chat_moderation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_moderation (
    id integer NOT NULL,
    user_id uuid,
    message text NOT NULL,
    matched_words jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    context_type character varying(255) DEFAULT 'direct_message'::character varying NOT NULL,
    context_id character varying(255),
    message_id integer,
    severity character varying(255) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(255) DEFAULT 'flagged'::character varying NOT NULL,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    auto_action_taken boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: chat_moderation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_moderation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_moderation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_moderation_id_seq OWNED BY public.chat_moderation.id;


--
-- Name: class_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    due_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type character varying(255) DEFAULT 'text'::character varying NOT NULL,
    allow_late boolean DEFAULT false NOT NULL,
    time_to_finish character varying(255),
    language character varying(255),
    starter_code text,
    grading_rubric text,
    questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    settings jsonb,
    supporting_resources jsonb
);


--
-- Name: class_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_attendance (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lesson_id uuid NOT NULL,
    user_id uuid NOT NULL,
    attended boolean DEFAULT false,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    class_id uuid NOT NULL
);


--
-- Name: class_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: class_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    class_id uuid NOT NULL,
    status character varying(255) DEFAULT 'enrolled'::character varying,
    enrolled_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: class_lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_lessons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    start_time timestamp with time zone,
    "order" integer,
    topic_file_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    duration integer
);


--
-- Name: class_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_likes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    class_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: class_reminder_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_reminder_subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    class_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: class_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_resources (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    resource_type public.class_resource_type NOT NULL,
    resource_url text NOT NULL,
    mime_type character varying(255),
    size integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: class_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: class_scoring_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_scoring_policies (
    class_id uuid NOT NULL,
    assignment_weight integer DEFAULT 50,
    attendance_weight integer DEFAULT 30,
    final_exam_weight integer DEFAULT 20,
    pass_score integer DEFAULT 60,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: class_tag_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_tag_map (
    class_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: class_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: class_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_views (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    viewer_id uuid,
    ip_address character varying(255),
    user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: class_wishlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_wishlist (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    class_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: community_contributors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_contributors (
    user_id uuid NOT NULL,
    discussions_count integer DEFAULT 0 NOT NULL,
    score integer DEFAULT 0 NOT NULL
);


--
-- Name: community_discussion_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_discussion_tags (
    discussion_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: community_discussions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_discussions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb,
    image_url character varying(255),
    resolved boolean DEFAULT false,
    locked boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: community_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_likes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    discussion_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: community_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_replies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    discussion_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    is_answer boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    file_url character varying(255)
);


--
-- Name: community_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reporter_id uuid NOT NULL,
    discussion_id uuid,
    reply_id uuid,
    reason text NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying,
    reported_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: community_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: community_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_views (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    discussion_id uuid NOT NULL,
    viewer_id uuid,
    ip_address character varying(255),
    user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: community_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_votes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    discussion_id uuid NOT NULL,
    vote integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(255) NOT NULL,
    discount_percent integer NOT NULL,
    expires_at timestamp with time zone,
    usage_limit integer,
    times_used integer DEFAULT 0,
    instructor_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    starts_at timestamp with time zone,
    applies_to text,
    applies_to_id uuid,
    CONSTRAINT coupons_applies_to_check CHECK ((applies_to = ANY (ARRAY['tutorial'::text, 'class'::text, 'plan'::text])))
);


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currencies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    symbol character varying(255) NOT NULL,
    exchange_rate numeric(14,6) DEFAULT '1'::numeric NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    auto_update boolean DEFAULT true NOT NULL,
    logo_url character varying(255),
    last_updated timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tax_rate numeric(5,2) DEFAULT '0'::numeric NOT NULL
);


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faqs (
    id integer NOT NULL,
    question character varying(500) NOT NULL,
    answer text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.faqs_id_seq OWNED BY public.faqs.id;


--
-- Name: group_join_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_join_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying,
    requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    responded_at timestamp with time zone
);


--
-- Name: group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(255) DEFAULT 'member'::character varying,
    disabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: group_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text,
    file_url character varying(255),
    audio_url character varying(255),
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: group_tag_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_tag_map (
    group_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: group_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    creator_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    visibility character varying(255) DEFAULT 'public'::character varying,
    requires_approval boolean DEFAULT false,
    cover_image character varying(255),
    category_id uuid,
    max_size integer,
    timezone character varying(255),
    status character varying(255) DEFAULT 'pending'::character varying,
    permissions jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: instructor_certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_certificates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    file_url character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: instructor_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_profiles (
    user_id uuid NOT NULL,
    expertise text,
    experience integer,
    bio text,
    certifications text,
    pricing character varying(255),
    demo_video_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    availability_slots jsonb DEFAULT '[]'::jsonb
);


--
-- Name: instructor_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    instructor_id uuid NOT NULL,
    student_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: instructor_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_wallets (
    instructor_id uuid NOT NULL,
    balance numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: integration_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    integration_id uuid NOT NULL,
    user_id uuid,
    action character varying(255),
    details jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integrations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    provider character varying(255) NOT NULL,
    api_key text,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(255) DEFAULT 'USD'::character varying NOT NULL,
    details jsonb,
    pdf_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- Name: languages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.languages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    icon_url character varying(255)
);


--
-- Name: license_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_logs (
    id integer NOT NULL,
    license_id integer,
    action character varying(255) NOT NULL,
    ip character varying(255),
    domain character varying(255),
    device character varying(255),
    status character varying(255),
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: license_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.license_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: license_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.license_logs_id_seq OWNED BY public.license_logs.id;


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licenses (
    id integer NOT NULL,
    purchase_code character varying(255) NOT NULL,
    domain character varying(255),
    email character varying(255),
    ip character varying(255),
    status character varying(255) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_check timestamp with time zone,
    verified_at timestamp with time zone
);


--
-- Name: licenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.licenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: licenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.licenses_id_seq OWNED BY public.licenses.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    booking_id uuid,
    message text,
    file_url character varying(255),
    audio_url character varying(255),
    reply_to_id uuid,
    read boolean DEFAULT false,
    read_at timestamp with time zone,
    pinned boolean DEFAULT false,
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(255)
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(255) NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp with time zone
);


--
-- Name: offer_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offer_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    response_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message text,
    reply_to_id uuid,
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: offer_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offer_responses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    offer_id uuid NOT NULL,
    instructor_id uuid NOT NULL,
    proposed_price numeric(10,2),
    estimated_time character varying(255),
    notes text,
    status character varying(255) DEFAULT 'pending'::character varying,
    responded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: offer_tag_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offer_tag_map (
    offer_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: offer_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offer_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    budget numeric(10,2),
    timeframe character varying(255),
    offer_type character varying(255),
    status character varying(255) DEFAULT 'open'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp with time zone,
    group_id uuid,
    fee numeric(10,2) DEFAULT '0'::numeric
);


--
-- Name: online_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.online_classes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    instructor_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    level character varying(255),
    cover_image character varying(255),
    start_date date,
    end_date date,
    category_id uuid,
    price numeric(10,2),
    max_students integer,
    language character varying(255),
    demo_video_url character varying(255),
    allow_installments boolean DEFAULT false,
    status text DEFAULT 'draft'::text,
    moderation_status text DEFAULT 'Pending'::text,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    included_plans jsonb DEFAULT '[]'::jsonb NOT NULL,
    access_type public.online_classes_access_type_enum DEFAULT 'paid'::public.online_classes_access_type_enum NOT NULL,
    CONSTRAINT online_classes_moderation_status_check CHECK ((moderation_status = ANY (ARRAY['Pending'::text, 'Approved'::text, 'Rejected'::text]))),
    CONSTRAINT online_classes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    code_hash character varying(100)
);


--
-- Name: payment_methods_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods_config (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    icon character varying(255),
    active boolean DEFAULT true NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payment_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_schedules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payment_id uuid NOT NULL,
    installment_number integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    method_id uuid,
    item_type character varying(255) NOT NULL,
    item_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(255) DEFAULT 'USD'::character varying NOT NULL,
    status character varying(255) DEFAULT 'pending_payment'::character varying NOT NULL,
    reference_id character varying(255),
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    installments integer DEFAULT 1,
    installment_number integer DEFAULT 1,
    next_due_date date,
    platform_fee numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    instructor_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    receipt_url character varying(255),
    bank_details jsonb,
    source character varying(255),
    coupon_id uuid
);


--
-- Name: payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payouts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    instructor_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(255) DEFAULT 'USD'::character varying NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    code character varying(255) NOT NULL,
    description character varying(255),
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: plan_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_features (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    plan_id uuid NOT NULL,
    feature_key character varying(255) NOT NULL,
    value character varying(255),
    description character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: plan_usage_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_usage_metrics (
    plan_id uuid NOT NULL,
    item_type character varying(255) NOT NULL,
    item_id text NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    instructor_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    subscription_id uuid NOT NULL
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    price_monthly numeric(10,2) DEFAULT '0'::numeric,
    price_yearly numeric(10,2) DEFAULT '0'::numeric,
    currency character varying(255) DEFAULT 'USD'::character varying,
    recommended boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    color character varying(255) DEFAULT '#1F2937'::character varying,
    style character varying(255),
    target_role text DEFAULT 'student'::text NOT NULL,
    max_courses integer,
    ad_credits integer DEFAULT 0,
    CONSTRAINT plans_target_role_check CHECK ((target_role = ANY (ARRAY['student'::text, 'instructor'::text])))
);


--
-- Name: popup_announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.popup_announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    audience character varying(255) DEFAULT 'all'::character varying NOT NULL,
    pages jsonb DEFAULT '[]'::jsonb NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    "position" character varying(255) DEFAULT 'center'::character varying,
    theme character varying(255) DEFAULT 'yellow'::character varying,
    once_per_session boolean DEFAULT true,
    active boolean DEFAULT true,
    author_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    user_id uuid,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: social_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    provider character varying(255) NOT NULL,
    provider_id character varying(255) NOT NULL,
    email character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: student_class_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_class_scores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    assignment_score integer,
    attendance_score integer,
    final_exam_score integer,
    total_score integer,
    passed boolean DEFAULT false,
    certificate_issued boolean DEFAULT false,
    issued_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: student_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_preferences (
    user_id uuid NOT NULL,
    preferred_language character varying(10) DEFAULT 'en'::character varying,
    subtitles_enabled boolean DEFAULT true,
    subtitle_language character varying(10) DEFAULT 'en'::character varying,
    playback_speed real DEFAULT '1'::real,
    two_factor_enabled boolean DEFAULT false,
    data_sharing_opt_in boolean DEFAULT true,
    show_profile_publicly boolean DEFAULT true,
    ui_theme character varying(20) DEFAULT 'system'::character varying,
    ui_reduce_motion boolean DEFAULT false,
    ui_high_contrast boolean DEFAULT false,
    ui_density character varying(20) DEFAULT 'comfortable'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_profiles (
    user_id uuid NOT NULL,
    education_level character varying(255),
    topics text,
    learning_goals text,
    identity_doc_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: support_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_attachments (
    id integer NOT NULL,
    message_id uuid,
    file_url character varying(255),
    file_name character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: support_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.support_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: support_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.support_attachments_id_seq OWNED BY public.support_attachments.id;


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subject character varying(255) NOT NULL,
    status character varying(255) DEFAULT 'open'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ticket_number character varying(255),
    priority character varying(255) DEFAULT 'medium'::character varying
);


--
-- Name: suspicious_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suspicious_logs (
    id integer NOT NULL,
    license_id integer,
    issue character varying(255) NOT NULL,
    details text,
    severity character varying(255) DEFAULT 'medium'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: suspicious_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suspicious_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suspicious_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suspicious_logs_id_seq OWNED BY public.suspicious_logs.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ticket_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_attachments (
    id integer NOT NULL,
    message_id integer,
    file_url character varying(255),
    file_name character varying(255)
);


--
-- Name: ticket_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_attachments_id_seq OWNED BY public.ticket_attachments.id;


--
-- Name: ticket_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_messages (
    id integer NOT NULL,
    ticket_id integer,
    sender_id uuid,
    message text,
    is_internal_note boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ticket_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_messages_id_seq OWNED BY public.ticket_messages.id;


--
-- Name: ticket_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_tags (
    id integer NOT NULL,
    ticket_id integer,
    tag character varying(255)
);


--
-- Name: ticket_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_tags_id_seq OWNED BY public.ticket_tags.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    subject character varying(255),
    description text,
    status text DEFAULT 'Open'::text,
    priority text DEFAULT 'Medium'::text,
    user_id uuid,
    assigned_admin_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tickets_priority_check CHECK ((priority = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Urgent'::text]))),
    CONSTRAINT tickets_status_check CHECK ((status = ANY (ARRAY['Open'::text, 'Pending'::text, 'Resolved'::text, 'Closed'::text])))
);


--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: tutorial_assignment_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_assignment_submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_url character varying(255),
    grade integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    text_answer text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tutorial_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutorial_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    due_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tutorial_chapters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_chapters (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutorial_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    video_url character varying(255),
    duration integer,
    "order" integer,
    is_preview boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tutorial_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutorial_id uuid NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tutorial_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    tutorial_id uuid NOT NULL,
    status character varying(255) DEFAULT 'enrolled'::character varying,
    enrolled_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tutorial_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_favorites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    tutorial_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tutorial_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutorial_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tutorial_tag_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_tag_map (
    tutorial_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: tutorial_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_views (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutorial_id uuid NOT NULL,
    viewer_id uuid,
    ip_address character varying(255),
    user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tutorial_wishlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_wishlist (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    tutorial_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tutorials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorials (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    instructor_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    level character varying(255),
    preview_video character varying(255),
    cover_image character varying(255),
    status text DEFAULT 'draft'::text,
    is_paid boolean DEFAULT false,
    price numeric(10,2),
    category_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    moderation_status text DEFAULT 'Pending'::text,
    rejection_reason text,
    duration integer,
    included_plans jsonb DEFAULT '[]'::jsonb NOT NULL,
    allow_installments boolean DEFAULT false NOT NULL,
    installments integer DEFAULT 1 NOT NULL,
    CONSTRAINT tutorials_moderation_status_check CHECK (((moderation_status IS NULL) OR (moderation_status = ANY (ARRAY['Pending'::text, 'Approved'::text, 'Rejected'::text])))),
    CONSTRAINT tutorials_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id integer NOT NULL
);


--
-- Name: user_social_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_social_links (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    platform character varying(255) NOT NULL,
    url character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    start_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    end_date timestamp with time zone,
    status character varying(255) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    renewal_notice_sent_at timestamp with time zone,
    expiry_notice_sent_at timestamp with time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    password_hash character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    avatar_url character varying(255),
    is_online boolean DEFAULT false,
    status character varying(255) DEFAULT 'pending'::character varying,
    profile_complete boolean DEFAULT false,
    is_email_verified boolean DEFAULT false,
    is_phone_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    gender character varying(255),
    date_of_birth date,
    last_login_at timestamp with time zone,
    last_login_ip character varying(45)
);


--
-- Name: verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(255) NOT NULL,
    code text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: video_call_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_call_messages (
    id integer NOT NULL,
    room_id character varying(255) NOT NULL,
    sender_id uuid,
    sender character varying(255),
    text text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_flagged boolean DEFAULT false NOT NULL,
    flag_severity character varying(255),
    moderation_status character varying(255) DEFAULT 'visible'::character varying NOT NULL,
    flag_metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    flagged_at timestamp with time zone
);


--
-- Name: video_call_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.video_call_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: video_call_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.video_call_messages_id_seq OWNED BY public.video_call_messages.id;


--
-- Name: video_call_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_call_participants (
    id integer NOT NULL,
    room_id character varying(255) NOT NULL,
    socket_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(255) DEFAULT 'participant'::character varying,
    is_muted boolean DEFAULT false,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    left_at timestamp with time zone
);


--
-- Name: video_call_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.video_call_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: video_call_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.video_call_participants_id_seq OWNED BY public.video_call_participants.id;


--
-- Name: video_calls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_calls (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    caller_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    room_id character varying(255) NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp with time zone
);


--
-- Name: blacklisted_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blacklisted_tokens ALTER COLUMN id SET DEFAULT nextval('public.blacklisted_tokens_id_seq'::regclass);


--
-- Name: book_purchases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_purchases ALTER COLUMN id SET DEFAULT nextval('public.book_purchases_id_seq'::regclass);


--
-- Name: book_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_reviews ALTER COLUMN id SET DEFAULT nextval('public.book_reviews_id_seq'::regclass);


--
-- Name: books id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: chat_moderation id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_moderation ALTER COLUMN id SET DEFAULT nextval('public.chat_moderation_id_seq'::regclass);


--
-- Name: faqs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs ALTER COLUMN id SET DEFAULT nextval('public.faqs_id_seq'::regclass);


--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Name: license_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_logs ALTER COLUMN id SET DEFAULT nextval('public.license_logs_id_seq'::regclass);


--
-- Name: licenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses ALTER COLUMN id SET DEFAULT nextval('public.licenses_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: support_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_attachments ALTER COLUMN id SET DEFAULT nextval('public.support_attachments_id_seq'::regclass);


--
-- Name: suspicious_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspicious_logs ALTER COLUMN id SET DEFAULT nextval('public.suspicious_logs_id_seq'::regclass);


--
-- Name: ticket_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_attachments ALTER COLUMN id SET DEFAULT nextval('public.ticket_attachments_id_seq'::regclass);


--
-- Name: ticket_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_messages ALTER COLUMN id SET DEFAULT nextval('public.ticket_messages_id_seq'::regclass);


--
-- Name: ticket_tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_tags ALTER COLUMN id SET DEFAULT nextval('public.ticket_tags_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: video_call_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_call_messages ALTER COLUMN id SET DEFAULT nextval('public.video_call_messages_id_seq'::regclass);


--
-- Name: video_call_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_call_participants ALTER COLUMN id SET DEFAULT nextval('public.video_call_participants_id_seq'::regclass);


--
-- Name: ad_analytics ad_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_analytics
    ADD CONSTRAINT ad_analytics_pkey PRIMARY KEY (ad_id);


--
-- Name: ad_views ad_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_views
    ADD CONSTRAINT ad_views_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_profiles admin_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_profiles
    ADD CONSTRAINT admin_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: ads ads_title_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_title_unique UNIQUE (title);


--
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: blacklisted_tokens blacklisted_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blacklisted_tokens
    ADD CONSTRAINT blacklisted_tokens_pkey PRIMARY KEY (id);


--
-- Name: blacklisted_tokens blacklisted_tokens_token_hash_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blacklisted_tokens
    ADD CONSTRAINT blacklisted_tokens_token_hash_unique UNIQUE (token_hash);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);


--
-- Name: book_cart book_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_cart
    ADD CONSTRAINT book_cart_pkey PRIMARY KEY (id);


--
-- Name: book_cart book_cart_student_id_book_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_cart
    ADD CONSTRAINT book_cart_student_id_book_id_unique UNIQUE (student_id, book_id);


--
-- Name: book_categories book_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_pkey PRIMARY KEY (id);


--
-- Name: book_categories book_categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_slug_unique UNIQUE (slug);


--
-- Name: book_purchases book_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_purchases
    ADD CONSTRAINT book_purchases_pkey PRIMARY KEY (id);


--
-- Name: book_reviews book_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_reviews
    ADD CONSTRAINT book_reviews_pkey PRIMARY KEY (id);


--
-- Name: book_tag_map book_tag_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_tag_map
    ADD CONSTRAINT book_tag_map_pkey PRIMARY KEY (book_id, tag_id);


--
-- Name: book_wishlist book_wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_wishlist
    ADD CONSTRAINT book_wishlist_pkey PRIMARY KEY (id);


--
-- Name: book_wishlist book_wishlist_student_id_book_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_wishlist
    ADD CONSTRAINT book_wishlist_student_id_book_id_unique UNIQUE (student_id, book_id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_user_id_item_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_item_id_unique UNIQUE (user_id, item_id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (user_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: certificate_templates certificate_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT certificate_templates_pkey PRIMARY KEY (id);


--
-- Name: certificate_verifications certificate_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_verifications
    ADD CONSTRAINT certificate_verifications_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_certificate_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_code_unique UNIQUE (certificate_code);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: chat_moderation chat_moderation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_moderation
    ADD CONSTRAINT chat_moderation_pkey PRIMARY KEY (id);


--
-- Name: class_assignments class_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT class_assignments_pkey PRIMARY KEY (id);


--
-- Name: class_attendance class_attendance_lesson_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_attendance
    ADD CONSTRAINT class_attendance_lesson_id_user_id_unique UNIQUE (lesson_id, user_id);


--
-- Name: class_attendance class_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_attendance
    ADD CONSTRAINT class_attendance_pkey PRIMARY KEY (id);


--
-- Name: class_comments class_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_comments
    ADD CONSTRAINT class_comments_pkey PRIMARY KEY (id);


--
-- Name: class_enrollments class_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT class_enrollments_pkey PRIMARY KEY (id);


--
-- Name: class_enrollments class_enrollments_user_id_class_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT class_enrollments_user_id_class_id_unique UNIQUE (user_id, class_id);


--
-- Name: class_lessons class_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_lessons
    ADD CONSTRAINT class_lessons_pkey PRIMARY KEY (id);


--
-- Name: class_likes class_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_likes
    ADD CONSTRAINT class_likes_pkey PRIMARY KEY (id);


--
-- Name: class_likes class_likes_user_id_class_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_likes
    ADD CONSTRAINT class_likes_user_id_class_id_unique UNIQUE (user_id, class_id);


--
-- Name: class_reminder_subscriptions class_reminder_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_reminder_subscriptions
    ADD CONSTRAINT class_reminder_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: class_reminder_subscriptions class_reminder_subscriptions_user_id_class_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_reminder_subscriptions
    ADD CONSTRAINT class_reminder_subscriptions_user_id_class_id_unique UNIQUE (user_id, class_id);


--
-- Name: class_resources class_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_resources
    ADD CONSTRAINT class_resources_pkey PRIMARY KEY (id);


--
-- Name: class_reviews class_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_reviews
    ADD CONSTRAINT class_reviews_pkey PRIMARY KEY (id);


--
-- Name: class_scoring_policies class_scoring_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_scoring_policies
    ADD CONSTRAINT class_scoring_policies_pkey PRIMARY KEY (class_id);


--
-- Name: class_tag_map class_tag_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_tag_map
    ADD CONSTRAINT class_tag_map_pkey PRIMARY KEY (class_id, tag_id);


--
-- Name: class_tags class_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_tags
    ADD CONSTRAINT class_tags_pkey PRIMARY KEY (id);


--
-- Name: class_tags class_tags_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_tags
    ADD CONSTRAINT class_tags_slug_unique UNIQUE (slug);


--
-- Name: class_views class_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_views
    ADD CONSTRAINT class_views_pkey PRIMARY KEY (id);


--
-- Name: class_wishlist class_wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_wishlist
    ADD CONSTRAINT class_wishlist_pkey PRIMARY KEY (id);


--
-- Name: class_wishlist class_wishlist_user_id_class_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_wishlist
    ADD CONSTRAINT class_wishlist_user_id_class_id_unique UNIQUE (user_id, class_id);


--
-- Name: community_contributors community_contributors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_contributors
    ADD CONSTRAINT community_contributors_pkey PRIMARY KEY (user_id);


--
-- Name: community_discussion_tags community_discussion_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_discussion_tags
    ADD CONSTRAINT community_discussion_tags_pkey PRIMARY KEY (discussion_id, tag_id);


--
-- Name: community_discussions community_discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_discussions
    ADD CONSTRAINT community_discussions_pkey PRIMARY KEY (id);


--
-- Name: community_likes community_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_likes
    ADD CONSTRAINT community_likes_pkey PRIMARY KEY (id);


--
-- Name: community_likes community_likes_user_id_discussion_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_likes
    ADD CONSTRAINT community_likes_user_id_discussion_id_unique UNIQUE (user_id, discussion_id);


--
-- Name: community_replies community_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_replies
    ADD CONSTRAINT community_replies_pkey PRIMARY KEY (id);


--
-- Name: community_reports community_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_reports
    ADD CONSTRAINT community_reports_pkey PRIMARY KEY (id);


--
-- Name: community_tags community_tags_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_tags
    ADD CONSTRAINT community_tags_name_unique UNIQUE (name);


--
-- Name: community_tags community_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_tags
    ADD CONSTRAINT community_tags_pkey PRIMARY KEY (id);


--
-- Name: community_tags community_tags_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_tags
    ADD CONSTRAINT community_tags_slug_unique UNIQUE (slug);


--
-- Name: community_views community_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_views
    ADD CONSTRAINT community_views_pkey PRIMARY KEY (id);


--
-- Name: community_votes community_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_votes
    ADD CONSTRAINT community_votes_pkey PRIMARY KEY (id);


--
-- Name: community_votes community_votes_user_id_discussion_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_votes
    ADD CONSTRAINT community_votes_user_id_discussion_id_unique UNIQUE (user_id, discussion_id);


--
-- Name: coupons coupons_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_unique UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_code_unique UNIQUE (code);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: group_join_requests group_join_requests_group_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_join_requests
    ADD CONSTRAINT group_join_requests_group_id_user_id_unique UNIQUE (group_id, user_id);


--
-- Name: group_join_requests group_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_join_requests
    ADD CONSTRAINT group_join_requests_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_group_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_user_id_unique UNIQUE (group_id, user_id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: group_messages group_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_pkey PRIMARY KEY (id);


--
-- Name: group_tag_map group_tag_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_tag_map
    ADD CONSTRAINT group_tag_map_pkey PRIMARY KEY (group_id, tag_id);


--
-- Name: group_tags group_tags_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_tags
    ADD CONSTRAINT group_tags_name_unique UNIQUE (name);


--
-- Name: group_tags group_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_tags
    ADD CONSTRAINT group_tags_pkey PRIMARY KEY (id);


--
-- Name: group_tags group_tags_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_tags
    ADD CONSTRAINT group_tags_slug_unique UNIQUE (slug);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: instructor_certificates instructor_certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_certificates
    ADD CONSTRAINT instructor_certificates_pkey PRIMARY KEY (id);


--
-- Name: instructor_profiles instructor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_profiles
    ADD CONSTRAINT instructor_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: instructor_reviews instructor_reviews_instructor_id_student_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_reviews
    ADD CONSTRAINT instructor_reviews_instructor_id_student_id_unique UNIQUE (instructor_id, student_id);


--
-- Name: instructor_reviews instructor_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_reviews
    ADD CONSTRAINT instructor_reviews_pkey PRIMARY KEY (id);


--
-- Name: instructor_wallets instructor_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_wallets
    ADD CONSTRAINT instructor_wallets_pkey PRIMARY KEY (instructor_id);


--
-- Name: integration_logs integration_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_logs
    ADD CONSTRAINT integration_logs_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: languages languages_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_code_unique UNIQUE (code);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: license_logs license_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_logs
    ADD CONSTRAINT license_logs_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_purchase_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_purchase_code_unique UNIQUE (purchase_code);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: offer_messages offer_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_messages
    ADD CONSTRAINT offer_messages_pkey PRIMARY KEY (id);


--
-- Name: offer_responses offer_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_responses
    ADD CONSTRAINT offer_responses_pkey PRIMARY KEY (id);


--
-- Name: offer_tag_map offer_tag_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_tag_map
    ADD CONSTRAINT offer_tag_map_pkey PRIMARY KEY (offer_id, tag_id);


--
-- Name: offer_tags offer_tags_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_tags
    ADD CONSTRAINT offer_tags_name_unique UNIQUE (name);


--
-- Name: offer_tags offer_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_tags
    ADD CONSTRAINT offer_tags_pkey PRIMARY KEY (id);


--
-- Name: offer_tags offer_tags_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_tags
    ADD CONSTRAINT offer_tags_slug_unique UNIQUE (slug);


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: online_classes online_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_classes
    ADD CONSTRAINT online_classes_pkey PRIMARY KEY (id);


--
-- Name: online_classes online_classes_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_classes
    ADD CONSTRAINT online_classes_slug_unique UNIQUE (slug);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: payment_methods_config payment_methods_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods_config
    ADD CONSTRAINT payment_methods_config_pkey PRIMARY KEY (id);


--
-- Name: payment_schedules payment_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_unique UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: plan_features plan_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_pkey PRIMARY KEY (id);


--
-- Name: plan_usage_metrics plan_usage_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_usage_metrics
    ADD CONSTRAINT plan_usage_metrics_pkey PRIMARY KEY (plan_id, subscription_id, item_type, item_id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: plans plans_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_slug_unique UNIQUE (slug);


--
-- Name: popup_announcements popup_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.popup_announcements
    ADD CONSTRAINT popup_announcements_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_unique UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: social_accounts social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);


--
-- Name: social_accounts social_accounts_provider_provider_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_provider_provider_id_unique UNIQUE (provider, provider_id);


--
-- Name: student_class_scores student_class_scores_class_id_student_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_class_scores
    ADD CONSTRAINT student_class_scores_class_id_student_id_unique UNIQUE (class_id, student_id);


--
-- Name: student_class_scores student_class_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_class_scores
    ADD CONSTRAINT student_class_scores_pkey PRIMARY KEY (id);


--
-- Name: student_preferences student_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_preferences
    ADD CONSTRAINT student_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: student_profiles student_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: support_attachments support_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_attachments
    ADD CONSTRAINT support_attachments_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_ticket_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_ticket_number_unique UNIQUE (ticket_number);


--
-- Name: suspicious_logs suspicious_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspicious_logs
    ADD CONSTRAINT suspicious_logs_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_unique UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tags tags_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_slug_unique UNIQUE (slug);


--
-- Name: ticket_attachments ticket_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_pkey PRIMARY KEY (id);


--
-- Name: ticket_messages ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: ticket_tags ticket_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_tags
    ADD CONSTRAINT ticket_tags_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tutorial_assignment_submissions tutorial_assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_assignment_submissions
    ADD CONSTRAINT tutorial_assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: tutorial_assignments tutorial_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_assignments
    ADD CONSTRAINT tutorial_assignments_pkey PRIMARY KEY (id);


--
-- Name: tutorial_chapters tutorial_chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_chapters
    ADD CONSTRAINT tutorial_chapters_pkey PRIMARY KEY (id);


--
-- Name: tutorial_comments tutorial_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_comments
    ADD CONSTRAINT tutorial_comments_pkey PRIMARY KEY (id);


--
-- Name: tutorial_enrollments tutorial_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_enrollments
    ADD CONSTRAINT tutorial_enrollments_pkey PRIMARY KEY (id);


--
-- Name: tutorial_enrollments tutorial_enrollments_user_id_tutorial_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_enrollments
    ADD CONSTRAINT tutorial_enrollments_user_id_tutorial_id_unique UNIQUE (user_id, tutorial_id);


--
-- Name: tutorial_favorites tutorial_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_favorites
    ADD CONSTRAINT tutorial_favorites_pkey PRIMARY KEY (id);


--
-- Name: tutorial_favorites tutorial_favorites_user_id_tutorial_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_favorites
    ADD CONSTRAINT tutorial_favorites_user_id_tutorial_id_unique UNIQUE (user_id, tutorial_id);


--
-- Name: tutorial_reviews tutorial_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_reviews
    ADD CONSTRAINT tutorial_reviews_pkey PRIMARY KEY (id);


--
-- Name: tutorial_tag_map tutorial_tag_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_tag_map
    ADD CONSTRAINT tutorial_tag_map_pkey PRIMARY KEY (tutorial_id, tag_id);


--
-- Name: tutorial_views tutorial_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_views
    ADD CONSTRAINT tutorial_views_pkey PRIMARY KEY (id);


--
-- Name: tutorial_wishlist tutorial_wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_wishlist
    ADD CONSTRAINT tutorial_wishlist_pkey PRIMARY KEY (id);


--
-- Name: tutorial_wishlist tutorial_wishlist_user_id_tutorial_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_wishlist
    ADD CONSTRAINT tutorial_wishlist_user_id_tutorial_id_unique UNIQUE (user_id, tutorial_id);


--
-- Name: tutorials tutorials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorials
    ADD CONSTRAINT tutorials_pkey PRIMARY KEY (id);


--
-- Name: tutorials tutorials_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorials
    ADD CONSTRAINT tutorials_slug_unique UNIQUE (slug);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_social_links user_social_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_social_links
    ADD CONSTRAINT user_social_links_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_phone_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_unique UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verifications verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);


--
-- Name: video_call_messages video_call_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_call_messages
    ADD CONSTRAINT video_call_messages_pkey PRIMARY KEY (id);


--
-- Name: video_call_participants video_call_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_call_participants
    ADD CONSTRAINT video_call_participants_pkey PRIMARY KEY (id);


--
-- Name: video_calls video_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_calls
    ADD CONSTRAINT video_calls_pkey PRIMARY KEY (id);


--
-- Name: blacklisted_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blacklisted_tokens_expires_at_index ON public.blacklisted_tokens USING btree (expires_at);


--
-- Name: blacklisted_tokens_token_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX blacklisted_tokens_token_unique ON public.blacklisted_tokens USING btree (token) WHERE (token IS NOT NULL);


--
-- Name: chat_moderation_context_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_moderation_context_status_idx ON public.chat_moderation USING btree (context_type, status);


--
-- Name: chat_moderation_message_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_moderation_message_idx ON public.chat_moderation USING btree (message_id);


--
-- Name: idx_tutorial_comments_tutorial_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tutorial_comments_tutorial_id ON public.tutorial_comments USING btree (tutorial_id);


--
-- Name: idx_tutorial_enrollments_tutorial_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tutorial_enrollments_tutorial_id ON public.tutorial_enrollments USING btree (tutorial_id);


--
-- Name: idx_tutorial_reviews_tutorial_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tutorial_reviews_tutorial_id ON public.tutorial_reviews USING btree (tutorial_id);


--
-- Name: idx_tutorial_views_tutorial_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tutorial_views_tutorial_id ON public.tutorial_views USING btree (tutorial_id);


--
-- Name: idx_tutorials_instructor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tutorials_instructor_id ON public.tutorials USING btree (instructor_id);


--
-- Name: tutorials_lower_title_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tutorials_lower_title_idx ON public.tutorials USING btree (lower((title)::text));


--
-- Name: tutorials_slug_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tutorials_slug_unique_idx ON public.tutorials USING btree (slug);


--
-- Name: video_call_messages_flag_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX video_call_messages_flag_idx ON public.video_call_messages USING btree (room_id, is_flagged);


--
-- Name: class_enrollments class_capacity_check; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER class_capacity_check AFTER INSERT OR UPDATE ON public.class_enrollments DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION public.check_class_capacity();


--
-- Name: ad_analytics ad_analytics_ad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_analytics
    ADD CONSTRAINT ad_analytics_ad_id_foreign FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_views ad_views_ad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_views
    ADD CONSTRAINT ad_views_ad_id_foreign FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_views ad_views_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_views
    ADD CONSTRAINT ad_views_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: admin_audit_logs admin_audit_logs_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: admin_profiles admin_profiles_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_profiles
    ADD CONSTRAINT admin_profiles_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ads ads_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ads ads_purchased_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_purchased_by_foreign FOREIGN KEY (purchased_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: assignment_submissions assignment_submissions_assignment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES public.class_assignments(id) ON DELETE CASCADE;


--
-- Name: assignment_submissions assignment_submissions_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: book_cart book_cart_book_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_cart
    ADD CONSTRAINT book_cart_book_id_foreign FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_cart book_cart_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_cart
    ADD CONSTRAINT book_cart_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: book_purchases book_purchases_book_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_purchases
    ADD CONSTRAINT book_purchases_book_id_foreign FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_purchases book_purchases_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_purchases
    ADD CONSTRAINT book_purchases_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: book_reviews book_reviews_book_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_reviews
    ADD CONSTRAINT book_reviews_book_id_foreign FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_reviews book_reviews_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_reviews
    ADD CONSTRAINT book_reviews_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: book_tag_map book_tag_map_book_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_tag_map
    ADD CONSTRAINT book_tag_map_book_id_foreign FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_tag_map book_tag_map_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_tag_map
    ADD CONSTRAINT book_tag_map_tag_id_foreign FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: book_wishlist book_wishlist_book_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_wishlist
    ADD CONSTRAINT book_wishlist_book_id_foreign FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_wishlist book_wishlist_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_wishlist
    ADD CONSTRAINT book_wishlist_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_instructor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_instructor_id_foreign FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: books books_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: books books_instructor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_instructor_id_foreign FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.carts(user_id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: certificate_verifications certificate_verifications_certificate_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_verifications
    ADD CONSTRAINT certificate_verifications_certificate_id_foreign FOREIGN KEY (certificate_id) REFERENCES public.certificates(id) ON DELETE CASCADE;


--
-- Name: certificates certificates_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: certificates certificates_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_template_id_foreign FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON DELETE SET NULL;


--
-- Name: certificates certificates_tutorial_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_tutorial_id_foreign FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: certificates certificates_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_moderation chat_moderation_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_moderation
    ADD CONSTRAINT chat_moderation_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: class_assignments class_assignments_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT class_assignments_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_attendance class_attendance_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_attendance
    ADD CONSTRAINT class_attendance_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_attendance class_attendance_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_attendance
    ADD CONSTRAINT class_attendance_lesson_id_foreign FOREIGN KEY (lesson_id) REFERENCES public.class_lessons(id) ON DELETE CASCADE;


--
-- Name: class_attendance class_attendance_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_attendance
    ADD CONSTRAINT class_attendance_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: class_comments class_comments_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_comments
    ADD CONSTRAINT class_comments_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_comments class_comments_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_comments
    ADD CONSTRAINT class_comments_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.class_comments(id) ON DELETE CASCADE;


--
-- Name: class_comments class_comments_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_comments
    ADD CONSTRAINT class_comments_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: class_enrollments class_enrollments_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT class_enrollments_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_enrollments class_enrollments_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT class_enrollments_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: class_lessons class_lessons_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_lessons
    ADD CONSTRAINT class_lessons_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_likes class_likes_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_likes
    ADD CONSTRAINT class_likes_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_likes class_likes_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_likes
    ADD CONSTRAINT class_likes_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: class_reminder_subscriptions class_reminder_subscriptions_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_reminder_subscriptions
    ADD CONSTRAINT class_reminder_subscriptions_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_reminder_subscriptions class_reminder_subscriptions_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_reminder_subscriptions
    ADD CONSTRAINT class_reminder_subscriptions_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: class_resources class_resources_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_resources
    ADD CONSTRAINT class_resources_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_reviews class_reviews_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_reviews
    ADD CONSTRAINT class_reviews_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_reviews class_reviews_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_reviews
    ADD CONSTRAINT class_reviews_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: class_scoring_policies class_scoring_policies_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_scoring_policies
    ADD CONSTRAINT class_scoring_policies_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_tag_map class_tag_map_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_tag_map
    ADD CONSTRAINT class_tag_map_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_tag_map class_tag_map_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_tag_map
    ADD CONSTRAINT class_tag_map_tag_id_foreign FOREIGN KEY (tag_id) REFERENCES public.class_tags(id) ON DELETE CASCADE;


--
-- Name: class_views class_views_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_views
    ADD CONSTRAINT class_views_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_views class_views_viewer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_views
    ADD CONSTRAINT class_views_viewer_id_foreign FOREIGN KEY (viewer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: class_wishlist class_wishlist_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_wishlist
    ADD CONSTRAINT class_wishlist_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: class_wishlist class_wishlist_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_wishlist
    ADD CONSTRAINT class_wishlist_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: community_contributors community_contributors_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_contributors
    ADD CONSTRAINT community_contributors_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: community_discussion_tags community_discussion_tags_discussion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_discussion_tags
    ADD CONSTRAINT community_discussion_tags_discussion_id_foreign FOREIGN KEY (discussion_id) REFERENCES public.community_discussions(id) ON DELETE CASCADE;


--
-- Name: community_discussion_tags community_discussion_tags_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_discussion_tags
    ADD CONSTRAINT community_discussion_tags_tag_id_foreign FOREIGN KEY (tag_id) REFERENCES public.community_tags(id) ON DELETE CASCADE;


--
-- Name: community_discussions community_discussions_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_discussions
    ADD CONSTRAINT community_discussions_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: community_likes community_likes_discussion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_likes
    ADD CONSTRAINT community_likes_discussion_id_foreign FOREIGN KEY (discussion_id) REFERENCES public.community_discussions(id) ON DELETE CASCADE;


--
-- Name: community_likes community_likes_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_likes
    ADD CONSTRAINT community_likes_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: community_replies community_replies_discussion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_replies
    ADD CONSTRAINT community_replies_discussion_id_foreign FOREIGN KEY (discussion_id) REFERENCES public.community_discussions(id) ON DELETE CASCADE;


--
-- Name: community_replies community_replies_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_replies
    ADD CONSTRAINT community_replies_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: community_reports community_reports_discussion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_reports
    ADD CONSTRAINT community_reports_discussion_id_foreign FOREIGN KEY (discussion_id) REFERENCES public.community_discussions(id) ON DELETE CASCADE;


--
-- Name: community_reports community_reports_reply_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_reports
    ADD CONSTRAINT community_reports_reply_id_foreign FOREIGN KEY (reply_id) REFERENCES public.community_replies(id) ON DELETE CASCADE;


--
-- Name: community_reports community_reports_reporter_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_reports
    ADD CONSTRAINT community_reports_reporter_id_foreign FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: community_views community_views_discussion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_views
    ADD CONSTRAINT community_views_discussion_id_foreign FOREIGN KEY (discussion_id) REFERENCES public.community_discussions(id) ON DELETE CASCADE;


--
-- Name: community_views community_views_viewer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_views
    ADD CONSTRAINT community_views_viewer_id_foreign FOREIGN KEY (viewer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: community_votes community_votes_discussion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_votes
    ADD CONSTRAINT community_votes_discussion_id_foreign FOREIGN KEY (discussion_id) REFERENCES public.community_discussions(id) ON DELETE CASCADE;


--
-- Name: community_votes community_votes_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_votes
    ADD CONSTRAINT community_votes_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: coupons coupons_instructor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_instructor_id_foreign FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: group_join_requests group_join_requests_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_join_requests
    ADD CONSTRAINT group_join_requests_group_id_foreign FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_join_requests group_join_requests_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_join_requests
    ADD CONSTRAINT group_join_requests_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_foreign FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_messages group_messages_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_group_id_foreign FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_messages group_messages_sender_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_sender_id_foreign FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_tag_map group_tag_map_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_tag_map
    ADD CONSTRAINT group_tag_map_group_id_foreign FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_tag_map group_tag_map_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_tag_map
    ADD CONSTRAINT group_tag_map_tag_id_foreign FOREIGN KEY (tag_id) REFERENCES public.group_tags(id) ON DELETE CASCADE;


--
-- Name: groups groups_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: groups groups_creator_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_creator_id_foreign FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: instructor_certificates instructor_certificates_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_certificates
    ADD CONSTRAINT instructor_certificates_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: instructor_profiles instructor_profiles_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_profiles
    ADD CONSTRAINT instructor_profiles_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: instructor_reviews instructor_reviews_instructor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_reviews
    ADD CONSTRAINT instructor_reviews_instructor_id_foreign FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: instructor_reviews instructor_reviews_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_reviews
    ADD CONSTRAINT instructor_reviews_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: instructor_wallets instructor_wallets_instructor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_wallets
    ADD CONSTRAINT instructor_wallets_instructor_id_foreign FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: integration_logs integration_logs_integration_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_logs
    ADD CONSTRAINT integration_logs_integration_id_foreign FOREIGN KEY (integration_id) REFERENCES public.integrations(id) ON DELETE CASCADE;


--
-- Name: integration_logs integration_logs_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_logs
    ADD CONSTRAINT integration_logs_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_payment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_payment_id_foreign FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: license_logs license_logs_license_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_logs
    ADD CONSTRAINT license_logs_license_id_foreign FOREIGN KEY (license_id) REFERENCES public.licenses(id) ON DELETE CASCADE;


--
-- Name: messages messages_booking_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_booking_id_foreign FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: messages messages_receiver_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_foreign FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_reply_to_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_reply_to_id_foreign FOREIGN KEY (reply_to_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: messages messages_sender_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_foreign FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: offer_messages offer_messages_reply_to_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_messages
    ADD CONSTRAINT offer_messages_reply_to_id_foreign FOREIGN KEY (reply_to_id) REFERENCES public.offer_messages(id) ON DELETE SET NULL;


--
-- Name: offer_messages offer_messages_response_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_messages
    ADD CONSTRAINT offer_messages_response_id_foreign FOREIGN KEY (response_id) REFERENCES public.offer_responses(id) ON DELETE CASCADE;


--
-- Name: offer_messages offer_messages_sender_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_messages
    ADD CONSTRAINT offer_messages_sender_id_foreign FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: offer_responses offer_responses_instructor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_responses
    ADD CONSTRAINT offer_responses_instructor_id_foreign FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: offer_responses offer_responses_offer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_responses
    ADD CONSTRAINT offer_responses_offer_id_foreign FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE;


--
-- Name: offer_tag_map offer_tag_map_offer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_tag_map
    ADD CONSTRAINT offer_tag_map_offer_id_foreign FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE;


--
-- Name: offer_tag_map offer_tag_map_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_tag_map
    ADD CONSTRAINT offer_tag_map_tag_id_foreign FOREIGN KEY (tag_id) REFERENCES public.offer_tags(id) ON DELETE CASCADE;


--
-- Name: offers offers_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_group_id_foreign FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: offers offers_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: online_classes online_classes_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_classes
    ADD CONSTRAINT online_classes_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: online_classes online_classes_instructor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_classes
    ADD CONSTRAINT online_classes_instructor_id_foreign FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_resets password_resets_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_schedules payment_schedules_payment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_payment_id_foreign FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: payments payments_coupon_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_coupon_id_foreign FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;


--
-- Name: payments payments_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_method_id_foreign FOREIGN KEY (method_id) REFERENCES public.payment_methods_config(id);


--
-- Name: payments payments_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payouts payouts_instructor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_instructor_id_foreign FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: permissions permissions_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: plan_features plan_features_plan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_plan_id_foreign FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- Name: plan_usage_metrics plan_usage_metrics_plan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_usage_metrics
    ADD CONSTRAINT plan_usage_metrics_plan_id_foreign FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- Name: popup_announcements popup_announcements_author_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.popup_announcements
    ADD CONSTRAINT popup_announcements_author_id_foreign FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_assigned_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_assigned_by_foreign FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: social_accounts social_accounts_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_class_scores student_class_scores_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_class_scores
    ADD CONSTRAINT student_class_scores_class_id_foreign FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE CASCADE;


--
-- Name: student_class_scores student_class_scores_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_class_scores
    ADD CONSTRAINT student_class_scores_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_preferences student_preferences_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_preferences
    ADD CONSTRAINT student_preferences_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_profiles student_profiles_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: support_attachments support_attachments_message_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_attachments
    ADD CONSTRAINT support_attachments_message_id_foreign FOREIGN KEY (message_id) REFERENCES public.support_messages(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_sender_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_sender_id_foreign FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_ticket_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_ticket_id_foreign FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: suspicious_logs suspicious_logs_license_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspicious_logs
    ADD CONSTRAINT suspicious_logs_license_id_foreign FOREIGN KEY (license_id) REFERENCES public.licenses(id) ON DELETE CASCADE;


--
-- Name: ticket_attachments ticket_attachments_message_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_message_id_foreign FOREIGN KEY (message_id) REFERENCES public.ticket_messages(id);


--
-- Name: ticket_messages ticket_messages_sender_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_sender_id_foreign FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ticket_messages ticket_messages_ticket_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_ticket_id_foreign FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_tags ticket_tags_ticket_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_tags
    ADD CONSTRAINT ticket_tags_ticket_id_foreign FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: tickets tickets_assigned_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_admin_id_foreign FOREIGN KEY (assigned_admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tutorial_assignment_submissions tutorial_assignment_submissions_assignment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_assignment_submissions
    ADD CONSTRAINT tutorial_assignment_submissions_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES public.tutorial_assignments(id) ON DELETE CASCADE;


--
-- Name: tutorial_assignment_submissions tutorial_assignment_submissions_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_assignment_submissions
    ADD CONSTRAINT tutorial_assignment_submissions_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tutorial_assignments tutorial_assignments_tutorial_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_assignments
    ADD CONSTRAINT tutorial_assignments_tutorial_id_foreign FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: tutorial_chapters tutorial_chapters_tutorial_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_chapters
    ADD CONSTRAINT tutorial_chapters_tutorial_id_foreign FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: tutorial_comments tutorial_comments_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_comments
    ADD CONSTRAINT tutorial_comments_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.tutorial_comments(id) ON DELETE CASCADE;


--
-- Name: tutorial_comments tutorial_comments_tutorial_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_comments
    ADD CONSTRAINT tutorial_comments_tutorial_id_foreign FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: tutorial_comments tutorial_comments_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_comments
    ADD CONSTRAINT tutorial_comments_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tutorial_enrollments tutorial_enrollments_tutorial_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_enrollments
    ADD CONSTRAINT tutorial_enrollments_tutorial_id_foreign FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: tutorial_enrollments tutorial_enrollments_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_enrollments
    ADD CONSTRAINT tutorial_enrollments_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tutorial_favorites tutorial_favorites_tutorial_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_favorites
    ADD CONSTRAINT tutorial_favorites_tutorial_id_foreign FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: tutorial_favorites tutorial_favorites_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_favorites
    ADD CONSTRAINT tutorial_favorites_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tutorial_reviews tutorial_reviews_tutorial_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_reviews
    ADD CONSTRAINT tutorial_reviews_tutorial_id_foreign FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: tutorial_reviews tutorial_reviews_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_reviews
    ADD CONSTRAINT tutorial_reviews_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tutorial_tag_map tutorial_tag_map_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_tag_map
    ADD CONSTRAINT tutorial_tag_map_tag_id_foreign FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: tutorial_tag_map tutorial_tag_map_tutorial_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_tag_map
    ADD CONSTRAINT tutorial_tag_map_tutorial_id_foreign FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: tutorial_views tutorial_views_tutorial_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_views
    ADD CONSTRAINT tutorial_views_tutorial_id_foreign FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: tutorial_views tutorial_views_viewer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_views
    ADD CONSTRAINT tutorial_views_viewer_id_foreign FOREIGN KEY (viewer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tutorial_wishlist tutorial_wishlist_tutorial_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_wishlist
    ADD CONSTRAINT tutorial_wishlist_tutorial_id_foreign FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: tutorial_wishlist tutorial_wishlist_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_wishlist
    ADD CONSTRAINT tutorial_wishlist_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tutorials tutorials_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorials
    ADD CONSTRAINT tutorials_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: tutorials tutorials_instructor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorials
    ADD CONSTRAINT tutorials_instructor_id_foreign FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_social_links user_social_links_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_social_links
    ADD CONSTRAINT user_social_links_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_foreign FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verifications verifications_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_calls video_calls_caller_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_calls
    ADD CONSTRAINT video_calls_caller_id_foreign FOREIGN KEY (caller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_calls video_calls_receiver_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_calls
    ADD CONSTRAINT video_calls_receiver_id_foreign FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict MIUfT1fWtN7QgMTFqddg8XGebblgaJCidw6vMiHc3zCi6j0N0r2b5gygWEZXv5E

