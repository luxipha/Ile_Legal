--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA _realtime;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: calculate_overall_reputation(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_overall_reputation(user_uuid uuid) RETURNS TABLE(overall_score numeric, legal_review_score numeric, property_approval_score numeric, dispute_resolution_score numeric, total_completions integer, average_rating numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH score_data AS (
        SELECT 
            COALESCE(AVG(CASE WHEN reputation_type = 'legal_review' THEN score END), 0) as legal_review,
            COALESCE(AVG(CASE WHEN reputation_type = 'property_approval' THEN score END), 0) as property_approval,
            COALESCE(AVG(CASE WHEN reputation_type = 'dispute_resolution' THEN score END), 0) as dispute_resolution,
            COALESCE(SUM(successful_completions), 0) as total_completions
        FROM reputation_scores 
        WHERE user_id = user_uuid
    ),
    rating_data AS (
        SELECT COALESCE(AVG(rating::decimal), 0) as avg_rating
        FROM reputation_events 
        WHERE user_id = user_uuid AND rating IS NOT NULL
    )
    SELECT 
        -- Weighted overall score
        ROUND((
            (sd.legal_review * 0.35) + 
            (sd.property_approval * 0.30) + 
            (sd.dispute_resolution * 0.25) +
            (LEAST(sd.total_completions * 2, 20) * 0.10) -- Completion bonus, capped at 20 points
        )::decimal, 2) as overall_score,
        ROUND(sd.legal_review::decimal, 2) as legal_review_score,
        ROUND(sd.property_approval::decimal, 2) as property_approval_score,
        ROUND(sd.dispute_resolution::decimal, 2) as dispute_resolution_score,
        sd.total_completions::integer,
        ROUND(rd.avg_rating::decimal, 2) as average_rating
    FROM score_data sd, rating_data rd;
END;
$$;


--
-- Name: mark_messages_read(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_messages_read(p_conversation_id uuid, p_user_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_user_type TEXT;
  v_update_query TEXT;
BEGIN
  -- Determine if user is buyer or seller
  SELECT 
    CASE 
      WHEN c.buyer_id = p_user_id THEN 'buyer'
      WHEN c.seller_id = p_user_id THEN 'seller'
      ELSE NULL
    END INTO v_user_type
  FROM conversations c
  WHERE c.id = p_conversation_id;
  
  -- Mark messages as read where user is not the sender
  UPDATE messages
  SET read_at = NOW()
  WHERE 
    conversation_id = p_conversation_id AND
    sender_id != p_user_id AND
    read_at IS NULL;
    
  -- Reset unread counter for this user
  v_update_query := format('
    UPDATE conversations 
    SET %I = 0
    WHERE id = %L
  ', v_user_type || '_unread_count', p_conversation_id);
  
  EXECUTE v_update_query;
END;
$$;


--
-- Name: send_message(uuid, uuid, text, boolean, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.send_message(p_conversation_id uuid, p_sender_id uuid, p_content text, p_has_attachment boolean DEFAULT false, p_attachment_type text DEFAULT NULL::text, p_attachment_url text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insert the message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    has_attachment,
    attachment_type,
    attachment_url
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_has_attachment,
    p_attachment_type,
    p_attachment_url
  )
  RETURNING id INTO v_message_id;
  
  -- The trigger will handle updating the conversation
  
  RETURN v_message_id;
END;
$$;


--
-- Name: update_conversation_on_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversation_on_message() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_unread_field TEXT;
  v_update_query TEXT;
BEGIN
  -- Determine which unread counter to increment based on sender
  SELECT 
    CASE 
      WHEN NEW.sender_id = c.buyer_id THEN 'seller_unread_count'
      ELSE 'buyer_unread_count'
    END INTO v_unread_field
  FROM conversations c
  WHERE c.id = NEW.conversation_id;
  
  -- Update conversation with dynamic field name
  v_update_query := format('
    UPDATE conversations 
    SET 
      updated_at = NOW(), 
      last_message_id = %L,
      %I = %I + 1
    WHERE id = %L
  ', NEW.id, v_unread_field, v_unread_field, NEW.conversation_id);
  
  EXECUTE v_update_query;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_reputation_after_event(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_reputation_after_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update or insert reputation score
    INSERT INTO reputation_scores (user_id, reputation_type, score, total_reviews, successful_completions, average_rating)
    VALUES (
        NEW.user_id,
        CASE 
            WHEN NEW.event_type LIKE '%legal%' OR NEW.event_type LIKE '%gig%' THEN 'legal_review'
            WHEN NEW.event_type LIKE '%property%' THEN 'property_approval'
            WHEN NEW.event_type LIKE '%dispute%' THEN 'dispute_resolution'
            ELSE 'legal_review'
        END,
        GREATEST(0, COALESCE(NEW.score_change, 0)),
        1,
        CASE WHEN COALESCE(NEW.score_change, 0) > 0 THEN 1 ELSE 0 END,
        COALESCE(NEW.rating, 0)
    )
    ON CONFLICT (user_id, reputation_type) 
    DO UPDATE SET
        score = LEAST(100, reputation_scores.score + GREATEST(-10, COALESCE(NEW.score_change, 0))),
        total_reviews = reputation_scores.total_reviews + 1,
        successful_completions = reputation_scores.successful_completions + 
            CASE WHEN COALESCE(NEW.score_change, 0) > 0 THEN 1 ELSE 0 END,
        average_rating = (
            (reputation_scores.average_rating * reputation_scores.total_reviews + COALESCE(NEW.rating, 0)) 
            / (reputation_scores.total_reviews + 1)
        ),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: extensions; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: tenants; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL,
    migrations_ran integer DEFAULT 0
);


--
-- Name: Bids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Bids" (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    gig_id uuid,
    seller_id uuid,
    buyer_id uuid,
    amount numeric(10,2) NOT NULL,
    description text,
    status text DEFAULT 'pending'::text,
    CONSTRAINT "Bids_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: TABLE "Bids"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Bids" IS 'Bids placed by sellers on gigs posted by buyers';


--
-- Name: Disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Disputes" (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    gig_id uuid,
    buyer_id uuid,
    seller_id uuid,
    details text NOT NULL,
    status text DEFAULT 'pending'::text,
    comments text,
    resolution_decision text,
    outcome text,
    refund_amount text,
    resolution_comment text,
    CONSTRAINT "Disputes_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text, 'resolved'::text])))
);


--
-- Name: TABLE "Disputes"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Disputes" IS 'Dispute resolution system for gig conflicts';


--
-- Name: Disputes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Disputes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Disputes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Disputes_id_seq" OWNED BY public."Disputes".id;


--
-- Name: Feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Feedback" (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    free_response text NOT NULL,
    rating integer,
    gig_id integer NOT NULL,
    creator uuid,
    recipient uuid,
    CONSTRAINT "Feedback_rating_check" CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: TABLE "Feedback"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Feedback" IS 'Rating and review system for completed gigs';


--
-- Name: Gigs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Gigs" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    seller_id uuid,
    title text,
    description text,
    price numeric(10,2),
    status text,
    categories text[] DEFAULT '{}'::text[],
    budget numeric(10,2),
    deadline timestamp with time zone,
    buyer_id uuid,
    attachments text[] DEFAULT '{}'::text[],
    is_flagged boolean DEFAULT false,
    bids integer[] DEFAULT '{}'::integer[]
);


--
-- Name: TABLE "Gigs"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Gigs" IS 'Gigs posted by buyers for legal services';


--
-- Name: PaymentLogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PaymentLogs" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid,
    buyer_id uuid,
    amount numeric(10,2),
    method text,
    attempt_time timestamp with time zone DEFAULT now(),
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE "PaymentLogs"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."PaymentLogs" IS 'Audit trail for payment attempts';


--
-- Name: Payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payments" (
    id text NOT NULL,
    task_id uuid,
    buyer_id uuid,
    seller_id uuid,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'NGN'::text,
    payment_method text NOT NULL,
    status text DEFAULT 'pending'::text,
    description text,
    wallet_address text,
    transaction_hash text,
    paystack_reference text,
    paystack_access_code text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT "Payments_payment_method_check" CHECK ((payment_method = ANY (ARRAY['wallet'::text, 'paystack'::text, 'bank'::text]))),
    CONSTRAINT "Payments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])))
);


--
-- Name: TABLE "Payments"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Payments" IS 'Payment transactions for gigs';


--
-- Name: Profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Profiles" (
    id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    first_name text,
    last_name text,
    avatar_url text,
    email text,
    user_type text,
    bio text,
    location text,
    website text,
    phone text,
    circle_wallet_id uuid,
    circle_wallet_address text,
    circle_wallet_created_at timestamp with time zone,
    circle_wallet_status text,
    verification_status text
);


--
-- Name: TABLE "Profiles"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Profiles" IS 'User profiles with extended information';


--
-- Name: Withdrawals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Withdrawals" (
    id text NOT NULL,
    user_id uuid,
    amount numeric(10,2) NOT NULL,
    method text NOT NULL,
    bank_account_id text,
    wallet_address text,
    status text DEFAULT 'pending'::text,
    transaction_hash text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT "Withdrawals_method_check" CHECK ((method = ANY (ARRAY['bank'::text, 'wallet'::text]))),
    CONSTRAINT "Withdrawals_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: TABLE "Withdrawals"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Withdrawals" IS 'Withdrawal requests from users';


--
-- Name: Work Submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Work Submissions" (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    gig_id uuid NOT NULL,
    seller_id uuid,
    deliverables text[] DEFAULT '{}'::text[],
    notes text DEFAULT ''::text,
    blockchain_hashes jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'submitted'::text,
    storage_type text DEFAULT 'supabase'::text,
    ipfs_data jsonb,
    CONSTRAINT "Work Submissions_status_check" CHECK ((status = ANY (ARRAY['submitted'::text, 'approved'::text, 'revision requested'::text]))),
    CONSTRAINT "Work Submissions_storage_type_check" CHECK ((storage_type = ANY (ARRAY['supabase'::text, 'ipfs'::text])))
);


--
-- Name: TABLE "Work Submissions"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Work Submissions" IS 'Work deliverable submissions from sellers to buyers';


--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_actions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    admin_id uuid,
    action_type text NOT NULL,
    target_id uuid NOT NULL,
    details jsonb DEFAULT '{}'::jsonb
);


--
-- Name: TABLE admin_actions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.admin_actions IS 'Log of all admin actions for audit trail';


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    settings jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    gig_id uuid,
    last_message_id uuid,
    buyer_unread_count integer DEFAULT 0,
    seller_unread_count integer DEFAULT 0
);


--
-- Name: filecoin_storage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.filecoin_storage (
    id integer NOT NULL,
    user_id uuid,
    original_filename text NOT NULL,
    file_size bigint NOT NULL,
    upload_timestamp timestamp with time zone DEFAULT now(),
    ipfs_cid text NOT NULL,
    piece_id text NOT NULL,
    storage_duration integer DEFAULT 365,
    retrieval_cost numeric(10,8),
    payment_amount numeric(10,8),
    payment_timestamp timestamp with time zone,
    contract_tx_id text,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: filecoin_storage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.filecoin_storage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: filecoin_storage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.filecoin_storage_id_seq OWNED BY public.filecoin_storage.id;


--
-- Name: legal_case_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_case_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    case_type text NOT NULL,
    gig_id uuid,
    client_id uuid,
    case_title text NOT NULL,
    case_description text,
    completion_status text NOT NULL,
    completion_date timestamp with time zone,
    hours_worked numeric(5,2),
    documentation_ipfs_cid text,
    final_deliverable_ipfs_cid text,
    blockchain_verification_tx text,
    court_admissible boolean DEFAULT true,
    quality_score integer,
    client_satisfaction integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT legal_case_completions_client_satisfaction_check CHECK (((client_satisfaction >= 1) AND (client_satisfaction <= 5))),
    CONSTRAINT legal_case_completions_quality_score_check CHECK (((quality_score >= 1) AND (quality_score <= 5)))
);


--
-- Name: legal_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    credential_type text NOT NULL,
    issuing_authority text NOT NULL,
    credential_number text,
    credential_name text NOT NULL,
    jurisdiction text,
    issued_date date,
    expiry_date date,
    verification_status text DEFAULT 'pending'::text,
    blockchain_tx_id text,
    ipfs_cid text,
    verifier_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone,
    has_attachment boolean DEFAULT false,
    attachment_type text,
    attachment_url text
);


--
-- Name: professional_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professional_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    achievement_type text NOT NULL,
    achievement_title text NOT NULL,
    achievement_description text,
    issuing_organization text,
    achievement_date date,
    verification_document_ipfs text,
    blockchain_record_tx text,
    reputation_impact numeric(5,2),
    public_visible boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: property_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id text NOT NULL,
    property_address text NOT NULL,
    approver_id uuid,
    client_id uuid,
    approval_type text NOT NULL,
    approval_status text NOT NULL,
    approval_conditions text[],
    legal_opinion text,
    supporting_documents_ipfs text[],
    blockchain_record_tx text,
    legal_opinion_ipfs_cid text,
    expiry_date date,
    jurisdiction text NOT NULL,
    accuracy_verified boolean DEFAULT false,
    verification_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: reputation_attestations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reputation_attestations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_user_id uuid,
    attester_id uuid,
    attestation_type text NOT NULL,
    attestation_score integer,
    attestation_text text NOT NULL,
    professional_relationship text,
    years_known integer,
    evidence_ipfs_cid text,
    blockchain_tx_id text,
    weight numeric(3,2) DEFAULT 1.00,
    verified boolean DEFAULT false,
    verification_method text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reputation_attestations_attestation_score_check CHECK (((attestation_score >= 1) AND (attestation_score <= 5)))
);


--
-- Name: reputation_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reputation_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_type text NOT NULL,
    config_data jsonb NOT NULL,
    effective_date date DEFAULT CURRENT_DATE,
    created_by uuid,
    description text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reputation_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reputation_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_type text NOT NULL,
    gig_id uuid,
    reviewer_id uuid,
    score_change numeric(5,2),
    rating integer,
    review_text text,
    response_text text,
    evidence_ipfs_cid text,
    blockchain_tx_id text NOT NULL,
    block_height bigint,
    verified_on_chain boolean DEFAULT false,
    "timestamp" timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reputation_events_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: reputation_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reputation_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    reputation_type text NOT NULL,
    score numeric(5,2) DEFAULT 0.00,
    total_reviews integer DEFAULT 0,
    successful_completions integer DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0.00,
    blockchain_tx_id text,
    last_blockchain_update timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_documents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    document_type text NOT NULL,
    document_url text NOT NULL,
    verification_status text DEFAULT 'pending'::text,
    verified_at timestamp with time zone,
    verified_by uuid,
    rejection_reason text,
    CONSTRAINT user_documents_verification_status_check CHECK ((verification_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: TABLE user_documents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_documents IS 'User verification documents for admin review';


--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    requested_info text,
    created_by uuid,
    read_at timestamp with time zone
);


--
-- Name: TABLE user_notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_notifications IS 'User notification system for platform communications';


--
-- Name: user_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_verifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    verification_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    verified_at timestamp with time zone,
    verification_data jsonb
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: Disputes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Disputes" ALTER COLUMN id SET DEFAULT nextval('public."Disputes_id_seq"'::regclass);


--
-- Name: filecoin_storage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filecoin_storage ALTER COLUMN id SET DEFAULT nextval('public.filecoin_storage_id_seq'::regclass);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: Bids Bids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bids"
    ADD CONSTRAINT "Bids_pkey" PRIMARY KEY (id);


--
-- Name: Disputes Disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Disputes"
    ADD CONSTRAINT "Disputes_pkey" PRIMARY KEY (id);


--
-- Name: Feedback Feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_pkey" PRIMARY KEY (id);


--
-- Name: Gigs Gigs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Gigs"
    ADD CONSTRAINT "Gigs_pkey" PRIMARY KEY (id);


--
-- Name: PaymentLogs PaymentLogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentLogs"
    ADD CONSTRAINT "PaymentLogs_pkey" PRIMARY KEY (id);


--
-- Name: Payments Payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "Payments_pkey" PRIMARY KEY (id);


--
-- Name: Profiles Profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profiles"
    ADD CONSTRAINT "Profiles_pkey" PRIMARY KEY (id);


--
-- Name: Withdrawals Withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Withdrawals"
    ADD CONSTRAINT "Withdrawals_pkey" PRIMARY KEY (id);


--
-- Name: Work Submissions Work Submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Work Submissions"
    ADD CONSTRAINT "Work Submissions_pkey" PRIMARY KEY (id);


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_key_key UNIQUE (key);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_buyer_id_seller_id_gig_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_seller_id_gig_id_key UNIQUE (buyer_id, seller_id, gig_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: filecoin_storage filecoin_storage_piece_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filecoin_storage
    ADD CONSTRAINT filecoin_storage_piece_id_key UNIQUE (piece_id);


--
-- Name: filecoin_storage filecoin_storage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filecoin_storage
    ADD CONSTRAINT filecoin_storage_pkey PRIMARY KEY (id);


--
-- Name: legal_case_completions legal_case_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_case_completions
    ADD CONSTRAINT legal_case_completions_pkey PRIMARY KEY (id);


--
-- Name: legal_credentials legal_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_credentials
    ADD CONSTRAINT legal_credentials_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: professional_achievements professional_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_achievements
    ADD CONSTRAINT professional_achievements_pkey PRIMARY KEY (id);


--
-- Name: property_approvals property_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_approvals
    ADD CONSTRAINT property_approvals_pkey PRIMARY KEY (id);


--
-- Name: reputation_attestations reputation_attestations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_attestations
    ADD CONSTRAINT reputation_attestations_pkey PRIMARY KEY (id);


--
-- Name: reputation_config reputation_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_config
    ADD CONSTRAINT reputation_config_pkey PRIMARY KEY (id);


--
-- Name: reputation_events reputation_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_events
    ADD CONSTRAINT reputation_events_pkey PRIMARY KEY (id);


--
-- Name: reputation_scores reputation_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_scores
    ADD CONSTRAINT reputation_scores_pkey PRIMARY KEY (id);


--
-- Name: reputation_scores reputation_scores_user_id_reputation_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_scores
    ADD CONSTRAINT reputation_scores_user_id_reputation_type_key UNIQUE (user_id, reputation_type);


--
-- Name: user_documents user_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_documents
    ADD CONSTRAINT user_documents_pkey PRIMARY KEY (id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_verifications user_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_verifications
    ADD CONSTRAINT user_verifications_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: extensions_tenant_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE INDEX extensions_tenant_external_id_index ON _realtime.extensions USING btree (tenant_external_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON _realtime.extensions USING btree (tenant_external_id, type);


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX tenants_external_id_index ON _realtime.tenants USING btree (external_id);


--
-- Name: idx_admin_actions_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions USING btree (admin_id);


--
-- Name: idx_admin_actions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_type ON public.admin_actions USING btree (action_type);


--
-- Name: idx_app_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_settings_key ON public.app_settings USING btree (key);


--
-- Name: idx_bids_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_buyer_id ON public."Bids" USING btree (buyer_id);


--
-- Name: idx_bids_gig_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_gig_id ON public."Bids" USING btree (gig_id);


--
-- Name: idx_bids_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_seller_id ON public."Bids" USING btree (seller_id);


--
-- Name: idx_bids_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bids_status ON public."Bids" USING btree (status);


--
-- Name: idx_conversations_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_buyer_id ON public.conversations USING btree (buyer_id);


--
-- Name: idx_conversations_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_seller_id ON public.conversations USING btree (seller_id);


--
-- Name: idx_disputes_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_buyer_id ON public."Disputes" USING btree (buyer_id);


--
-- Name: idx_disputes_gig_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_gig_id ON public."Disputes" USING btree (gig_id);


--
-- Name: idx_disputes_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_seller_id ON public."Disputes" USING btree (seller_id);


--
-- Name: idx_disputes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_status ON public."Disputes" USING btree (status);


--
-- Name: idx_feedback_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_creator ON public."Feedback" USING btree (creator);


--
-- Name: idx_feedback_gig_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_gig_id ON public."Feedback" USING btree (gig_id);


--
-- Name: idx_feedback_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_recipient ON public."Feedback" USING btree (recipient);


--
-- Name: idx_filecoin_storage_ipfs_cid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_filecoin_storage_ipfs_cid ON public.filecoin_storage USING btree (ipfs_cid);


--
-- Name: idx_filecoin_storage_piece_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_filecoin_storage_piece_id ON public.filecoin_storage USING btree (piece_id);


--
-- Name: idx_filecoin_storage_upload_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_filecoin_storage_upload_timestamp ON public.filecoin_storage USING btree (upload_timestamp DESC);


--
-- Name: idx_filecoin_storage_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_filecoin_storage_user_id ON public.filecoin_storage USING btree (user_id);


--
-- Name: idx_gigs_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gigs_buyer_id ON public."Gigs" USING btree (buyer_id);


--
-- Name: idx_gigs_is_flagged; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gigs_is_flagged ON public."Gigs" USING btree (is_flagged);


--
-- Name: idx_legal_case_completions_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_case_completions_client_id ON public.legal_case_completions USING btree (client_id);


--
-- Name: idx_legal_case_completions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_case_completions_user_id ON public.legal_case_completions USING btree (user_id);


--
-- Name: idx_legal_credentials_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_credentials_status ON public.legal_credentials USING btree (verification_status);


--
-- Name: idx_legal_credentials_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_credentials_user_id ON public.legal_credentials USING btree (user_id);


--
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);


--
-- Name: idx_payment_logs_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_logs_buyer_id ON public."PaymentLogs" USING btree (buyer_id);


--
-- Name: idx_payment_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_logs_created_at ON public."PaymentLogs" USING btree (created_at DESC);


--
-- Name: idx_payment_logs_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_logs_task_id ON public."PaymentLogs" USING btree (task_id);


--
-- Name: idx_payments_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_buyer_id ON public."Payments" USING btree (buyer_id);


--
-- Name: idx_payments_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_created_at ON public."Payments" USING btree (created_at DESC);


--
-- Name: idx_payments_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_seller_id ON public."Payments" USING btree (seller_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_status ON public."Payments" USING btree (status);


--
-- Name: idx_payments_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_task_id ON public."Payments" USING btree (task_id);


--
-- Name: idx_property_approvals_approver_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_approvals_approver_id ON public.property_approvals USING btree (approver_id);


--
-- Name: idx_reputation_attestations_attester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reputation_attestations_attester ON public.reputation_attestations USING btree (attester_id);


--
-- Name: idx_reputation_attestations_subject_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reputation_attestations_subject_user ON public.reputation_attestations USING btree (subject_user_id);


--
-- Name: idx_reputation_events_blockchain_tx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reputation_events_blockchain_tx ON public.reputation_events USING btree (blockchain_tx_id);


--
-- Name: idx_reputation_events_gig_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reputation_events_gig_id ON public.reputation_events USING btree (gig_id);


--
-- Name: idx_reputation_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reputation_events_user_id ON public.reputation_events USING btree (user_id);


--
-- Name: idx_reputation_scores_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reputation_scores_type ON public.reputation_scores USING btree (reputation_type);


--
-- Name: idx_reputation_scores_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reputation_scores_user_id ON public.reputation_scores USING btree (user_id);


--
-- Name: idx_user_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_documents_status ON public.user_documents USING btree (verification_status);


--
-- Name: idx_user_documents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_documents_user_id ON public.user_documents USING btree (user_id);


--
-- Name: idx_user_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_notifications_read ON public.user_notifications USING btree (read_at);


--
-- Name: idx_user_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id);


--
-- Name: idx_user_verifications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_verifications_status ON public.user_verifications USING btree (status);


--
-- Name: idx_user_verifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_verifications_user_id ON public.user_verifications USING btree (user_id);


--
-- Name: idx_withdrawals_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawals_created_at ON public."Withdrawals" USING btree (created_at DESC);


--
-- Name: idx_withdrawals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawals_status ON public."Withdrawals" USING btree (status);


--
-- Name: idx_withdrawals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawals_user_id ON public."Withdrawals" USING btree (user_id);


--
-- Name: idx_work_submissions_gig_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_submissions_gig_id ON public."Work Submissions" USING btree (gig_id);


--
-- Name: idx_work_submissions_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_submissions_seller_id ON public."Work Submissions" USING btree (seller_id);


--
-- Name: idx_work_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_submissions_status ON public."Work Submissions" USING btree (status);


--
-- Name: messages update_conversation_after_message_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversation_after_message_insert AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();


--
-- Name: filecoin_storage update_filecoin_storage_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_filecoin_storage_updated_at BEFORE UPDATE ON public.filecoin_storage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: Gigs update_gigs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON public."Gigs" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reputation_events update_reputation_scores_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reputation_scores_trigger AFTER INSERT ON public.reputation_events FOR EACH ROW EXECUTE FUNCTION public.update_reputation_after_event();


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_tenant_external_id_fkey FOREIGN KEY (tenant_external_id) REFERENCES _realtime.tenants(external_id) ON DELETE CASCADE;


--
-- Name: Bids Bids_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bids"
    ADD CONSTRAINT "Bids_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: Bids Bids_gig_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bids"
    ADD CONSTRAINT "Bids_gig_id_fkey" FOREIGN KEY (gig_id) REFERENCES public."Gigs"(id) ON DELETE CASCADE;


--
-- Name: Bids Bids_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bids"
    ADD CONSTRAINT "Bids_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: Disputes Disputes_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Disputes"
    ADD CONSTRAINT "Disputes_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: Disputes Disputes_gig_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Disputes"
    ADD CONSTRAINT "Disputes_gig_id_fkey" FOREIGN KEY (gig_id) REFERENCES public."Gigs"(id) ON DELETE CASCADE;


--
-- Name: Disputes Disputes_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Disputes"
    ADD CONSTRAINT "Disputes_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: Feedback Feedback_creator_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_creator_fkey" FOREIGN KEY (creator) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: Feedback Feedback_recipient_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_recipient_fkey" FOREIGN KEY (recipient) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: Gigs Gigs_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Gigs"
    ADD CONSTRAINT "Gigs_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id);


--
-- Name: PaymentLogs PaymentLogs_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentLogs"
    ADD CONSTRAINT "PaymentLogs_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: Payments Payments_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "Payments_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: Payments Payments_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "Payments_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: Payments Payments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "Payments_task_id_fkey" FOREIGN KEY (task_id) REFERENCES public."Gigs"(id) ON DELETE CASCADE;


--
-- Name: Withdrawals Withdrawals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Withdrawals"
    ADD CONSTRAINT "Withdrawals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: Work Submissions Work Submissions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Work Submissions"
    ADD CONSTRAINT "Work Submissions_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_actions admin_actions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id);


--
-- Name: conversations conversations_gig_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_gig_id_fkey FOREIGN KEY (gig_id) REFERENCES public."Gigs"(id);


--
-- Name: conversations conversations_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id);


--
-- Name: filecoin_storage filecoin_storage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filecoin_storage
    ADD CONSTRAINT filecoin_storage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: legal_case_completions legal_case_completions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_case_completions
    ADD CONSTRAINT legal_case_completions_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: legal_case_completions legal_case_completions_gig_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_case_completions
    ADD CONSTRAINT legal_case_completions_gig_id_fkey FOREIGN KEY (gig_id) REFERENCES public."Gigs"(id) ON DELETE SET NULL;


--
-- Name: legal_case_completions legal_case_completions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_case_completions
    ADD CONSTRAINT legal_case_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: legal_credentials legal_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_credentials
    ADD CONSTRAINT legal_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: legal_credentials legal_credentials_verifier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_credentials
    ADD CONSTRAINT legal_credentials_verifier_id_fkey FOREIGN KEY (verifier_id) REFERENCES auth.users(id);


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id);


--
-- Name: professional_achievements professional_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_achievements
    ADD CONSTRAINT professional_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: property_approvals property_approvals_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_approvals
    ADD CONSTRAINT property_approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: property_approvals property_approvals_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_approvals
    ADD CONSTRAINT property_approvals_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: reputation_attestations reputation_attestations_attester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_attestations
    ADD CONSTRAINT reputation_attestations_attester_id_fkey FOREIGN KEY (attester_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reputation_attestations reputation_attestations_subject_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_attestations
    ADD CONSTRAINT reputation_attestations_subject_user_id_fkey FOREIGN KEY (subject_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reputation_config reputation_config_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_config
    ADD CONSTRAINT reputation_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: reputation_events reputation_events_gig_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_events
    ADD CONSTRAINT reputation_events_gig_id_fkey FOREIGN KEY (gig_id) REFERENCES public."Gigs"(id) ON DELETE SET NULL;


--
-- Name: reputation_events reputation_events_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_events
    ADD CONSTRAINT reputation_events_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: reputation_events reputation_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_events
    ADD CONSTRAINT reputation_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reputation_scores reputation_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reputation_scores
    ADD CONSTRAINT reputation_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_documents user_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_documents
    ADD CONSTRAINT user_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_documents user_documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_documents
    ADD CONSTRAINT user_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id);


--
-- Name: user_notifications user_notifications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_verifications user_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_verifications
    ADD CONSTRAINT user_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: app_settings Admins can manage app settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage app settings" ON public.app_settings USING (((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role_title'::text) = 'admin'::text)));


--
-- Name: reputation_scores Anyone can view reputation scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view reputation scores" ON public.reputation_scores FOR SELECT USING (true);


--
-- Name: Bids; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Bids" ENABLE ROW LEVEL SECURITY;

--
-- Name: Bids Bids are viewable by gig owner and bidder; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Bids are viewable by gig owner and bidder" ON public."Bids" FOR SELECT USING (((auth.uid() = seller_id) OR (auth.uid() = buyer_id) OR (auth.uid() IN ( SELECT "Gigs".buyer_id
   FROM public."Gigs"
  WHERE ("Gigs".id = "Bids".gig_id)))));


--
-- Name: Gigs Buyers can insert their own gigs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can insert their own gigs" ON public."Gigs" FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: Gigs Buyers can update their own gigs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can update their own gigs" ON public."Gigs" FOR UPDATE USING ((auth.uid() = buyer_id));


--
-- Name: Disputes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Disputes" ENABLE ROW LEVEL SECURITY;

--
-- Name: Feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Feedback" ENABLE ROW LEVEL SECURITY;

--
-- Name: Gigs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Gigs" ENABLE ROW LEVEL SECURITY;

--
-- Name: Gigs Gigs are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gigs are viewable by everyone" ON public."Gigs" FOR SELECT USING (true);


--
-- Name: PaymentLogs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."PaymentLogs" ENABLE ROW LEVEL SECURITY;

--
-- Name: Payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Payments" ENABLE ROW LEVEL SECURITY;

--
-- Name: Profiles Profile access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profile access policy" ON public."Profiles" USING (((auth.uid() = id) OR ((auth.jwt() ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role_title'::text) = 'admin'::text)));


--
-- Name: Profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings Public can read app settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read app settings" ON public.app_settings FOR SELECT USING (true);


--
-- Name: Bids Sellers and buyers can update bids; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers and buyers can update bids" ON public."Bids" FOR UPDATE USING (((auth.uid() = seller_id) OR (auth.uid() = buyer_id) OR (auth.uid() IN ( SELECT "Gigs".buyer_id
   FROM public."Gigs"
  WHERE ("Gigs".id = "Bids".gig_id)))));


--
-- Name: Work Submissions Sellers can create submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can create submissions" ON public."Work Submissions" FOR INSERT WITH CHECK ((auth.uid() = seller_id));


--
-- Name: Bids Sellers can delete their own pending bids; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can delete their own pending bids" ON public."Bids" FOR DELETE USING (((auth.uid() = seller_id) AND (status = 'pending'::text)));


--
-- Name: Bids Sellers can insert bids; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can insert bids" ON public."Bids" FOR INSERT WITH CHECK ((auth.uid() = seller_id));


--
-- Name: PaymentLogs System can insert payment logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert payment logs" ON public."PaymentLogs" FOR INSERT WITH CHECK (true);


--
-- Name: reputation_attestations Users can create attestations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create attestations" ON public.reputation_attestations FOR INSERT WITH CHECK ((auth.uid() = attester_id));


--
-- Name: Disputes Users can create disputes for their gigs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create disputes for their gigs" ON public."Disputes" FOR INSERT WITH CHECK (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: Feedback Users can create feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create feedback" ON public."Feedback" FOR INSERT WITH CHECK ((auth.uid() = creator));


--
-- Name: Payments Users can create payments as buyers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create payments as buyers" ON public."Payments" FOR INSERT WITH CHECK (((auth.uid() = buyer_id) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role_title'::text) = 'admin'::text)));


--
-- Name: Withdrawals Users can create their own withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own withdrawals" ON public."Withdrawals" FOR INSERT WITH CHECK (((auth.uid() = user_id) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role_title'::text) = 'admin'::text)));


--
-- Name: conversations Users can insert conversations they're part of; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert conversations they're part of" ON public.conversations FOR INSERT WITH CHECK (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: messages Users can insert messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert messages in their conversations" ON public.messages FOR INSERT WITH CHECK (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid())))))));


--
-- Name: filecoin_storage Users can insert own storage records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own storage records" ON public.filecoin_storage FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: legal_credentials Users can insert their own credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own credentials" ON public.legal_credentials FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: Profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public."Profiles" FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_verifications Users can insert their own verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own verifications" ON public.user_verifications FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: filecoin_storage Users can update own storage records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own storage records" ON public.filecoin_storage FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.user_notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_verifications Users can update their own verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own verifications" ON public.user_verifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: Payments Users can update their payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their payments" ON public."Payments" FOR UPDATE USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role_title'::text) = 'admin'::text)));


--
-- Name: user_documents Users can upload their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload their own documents" ON public.user_documents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reputation_attestations Users can view attestations about themselves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view attestations about themselves" ON public.reputation_attestations FOR SELECT USING (((auth.uid() = subject_user_id) OR (auth.uid() = attester_id)));


--
-- Name: Disputes Users can view disputes they're involved in; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view disputes they're involved in" ON public."Disputes" FOR SELECT USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: Feedback Users can view feedback they created or received; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view feedback they created or received" ON public."Feedback" FOR SELECT USING (((auth.uid() = creator) OR (auth.uid() = recipient)));


--
-- Name: PaymentLogs Users can view logs for their payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view logs for their payments" ON public."PaymentLogs" FOR SELECT USING (((auth.uid() = buyer_id) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role_title'::text) = 'admin'::text)));


--
-- Name: messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid()))))));


--
-- Name: filecoin_storage Users can view own storage records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own storage records" ON public.filecoin_storage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: Payments Users can view payments they're involved in; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view payments they're involved in" ON public."Payments" FOR SELECT USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role_title'::text) = 'admin'::text)));


--
-- Name: property_approvals Users can view property approvals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view property approvals" ON public.property_approvals FOR SELECT USING (((auth.uid() = approver_id) OR (auth.uid() = client_id)));


--
-- Name: legal_credentials Users can view public credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view public credentials" ON public.legal_credentials FOR SELECT USING ((verification_status = 'verified'::text));


--
-- Name: legal_case_completions Users can view relevant case completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view relevant case completions" ON public.legal_case_completions FOR SELECT USING (((auth.uid() = user_id) OR (auth.uid() = client_id)));


--
-- Name: Work Submissions Users can view submissions for their gigs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view submissions for their gigs" ON public."Work Submissions" FOR SELECT USING (((auth.uid() = seller_id) OR (auth.uid() IN ( SELECT "Gigs".buyer_id
   FROM public."Gigs"
  WHERE ("Gigs".id = "Work Submissions".gig_id)))));


--
-- Name: conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: legal_credentials Users can view their own credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own credentials" ON public.legal_credentials FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_documents Users can view their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own documents" ON public.user_documents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.user_notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: reputation_scores Users can view their own reputation scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reputation scores" ON public.reputation_scores FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_verifications Users can view their own verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own verifications" ON public.user_verifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: Withdrawals Users can view their own withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own withdrawals" ON public."Withdrawals" FOR SELECT USING (((auth.uid() = user_id) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role_title'::text) = 'admin'::text)));


--
-- Name: Withdrawals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Withdrawals" ENABLE ROW LEVEL SECURITY;

--
-- Name: Work Submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Work Submissions" ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_actions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: filecoin_storage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.filecoin_storage ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_case_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legal_case_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legal_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: professional_achievements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.professional_achievements ENABLE ROW LEVEL SECURITY;

--
-- Name: property_approvals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.property_approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: reputation_attestations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reputation_attestations ENABLE ROW LEVEL SECURITY;

--
-- Name: reputation_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reputation_config ENABLE ROW LEVEL SECURITY;

--
-- Name: reputation_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;

--
-- Name: reputation_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reputation_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: user_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: user_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: user_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

