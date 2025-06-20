

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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."mark_messages_read"("p_conversation_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."mark_messages_read"("p_conversation_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_sender_id" "uuid", "p_content" "text", "p_has_attachment" boolean DEFAULT false, "p_attachment_type" "text" DEFAULT NULL::"text", "p_attachment_url" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_sender_id" "uuid", "p_content" "text", "p_has_attachment" boolean, "p_attachment_type" "text", "p_attachment_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_on_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."update_conversation_on_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_roles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_roles_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action_type" character varying(50) NOT NULL,
    "action_description" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "first_name" "text",
    "last_name" "text",
    "avatar_url" "text",
    "email" "text",
    "user_type" "text" DEFAULT 'buyer'::"text",
    "bio" "text",
    "location" "text",
    "website" "text",
    "phone" "text",
    "circle_wallet_id" "uuid",
    "circle_wallet_address" "text",
    "circle_wallet_created_at" timestamp with time zone,
    "circle_wallet_status" "text" DEFAULT 'pending'::"text",
    "verification_status" "text" DEFAULT 'unverified'::"text",
    "role_id" "uuid",
    "phone_number" "text",
    "name" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "is_system_role" boolean DEFAULT false,
    "color" character varying(7) DEFAULT '#6B7280'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_users" AS
 SELECT "p"."id",
    "p"."email",
    COALESCE((("p"."first_name" || ' '::"text") || "p"."last_name"), "p"."first_name", "p"."last_name", 'Unnamed'::"text") AS "name",
    "p"."phone_number",
    "p"."location",
    "p"."created_at",
    "r"."name" AS "role_name",
    "r"."display_name" AS "role_display_name",
    "r"."id" AS "role_id"
   FROM ("public"."profiles" "p"
     LEFT JOIN "public"."user_roles" "r" ON (("p"."role_id" = "r"."id")))
  WHERE (("p"."user_type" = 'admin'::"text") OR ("p"."role_id" IS NOT NULL));


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "buyer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "gig_id" "uuid",
    "last_message_id" "uuid",
    "buyer_unread_count" integer DEFAULT 0,
    "seller_unread_count" integer DEFAULT 0
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gigs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "seller_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2),
    "status" "text" DEFAULT 'draft'::"text"
);


ALTER TABLE "public"."gigs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    "has_attachment" boolean DEFAULT false,
    "attachment_type" "text",
    "attachment_url" "text"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "category" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role_id" "uuid",
    "permission_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_verifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "verification_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "verified_at" timestamp with time zone,
    "verification_data" "jsonb"
);


ALTER TABLE "public"."user_verifications" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_buyer_id_seller_id_gig_id_key" UNIQUE ("buyer_id", "seller_id", "gig_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_verifications"
    ADD CONSTRAINT "user_verifications_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_activity_log_action_type" ON "public"."admin_activity_log" USING "btree" ("action_type");



CREATE INDEX "idx_admin_activity_log_admin_id" ON "public"."admin_activity_log" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_activity_log_created_at" ON "public"."admin_activity_log" USING "btree" ("created_at");



CREATE INDEX "idx_conversations_buyer_id" ON "public"."conversations" USING "btree" ("buyer_id");



CREATE INDEX "idx_conversations_seller_id" ON "public"."conversations" USING "btree" ("seller_id");



CREATE INDEX "idx_gigs_seller_id" ON "public"."gigs" USING "btree" ("seller_id");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at");



CREATE INDEX "idx_permissions_category" ON "public"."permissions" USING "btree" ("category");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("id");



CREATE INDEX "idx_role_permissions_permission_id" ON "public"."role_permissions" USING "btree" ("permission_id");



CREATE INDEX "idx_role_permissions_role_id" ON "public"."role_permissions" USING "btree" ("role_id");



CREATE INDEX "idx_user_verifications_status" ON "public"."user_verifications" USING "btree" ("status");



CREATE INDEX "idx_user_verifications_user_id" ON "public"."user_verifications" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_conversation_after_message_insert" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_on_message"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_roles_updated_at"();



ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_verifications"
    ADD CONSTRAINT "user_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow read access to permissions" ON "public"."permissions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow read access to role_permissions" ON "public"."role_permissions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow read access to user_roles" ON "public"."user_roles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Gigs are viewable by everyone" ON "public"."gigs" FOR SELECT USING (true);



CREATE POLICY "Sellers can insert their own gigs" ON "public"."gigs" FOR INSERT WITH CHECK (("auth"."uid"() = "seller_id"));



CREATE POLICY "Sellers can update their own gigs" ON "public"."gigs" FOR UPDATE USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users can insert conversations they're part of" ON "public"."conversations" FOR INSERT WITH CHECK ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Users can insert messages in their conversations" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "messages"."conversation_id") AND (("c"."buyer_id" = "auth"."uid"()) OR ("c"."seller_id" = "auth"."uid"())))))));



CREATE POLICY "Users can insert their own verifications" ON "public"."user_verifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own verifications" ON "public"."user_verifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view messages in their conversations" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "messages"."conversation_id") AND (("c"."buyer_id" = "auth"."uid"()) OR ("c"."seller_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their own conversations" ON "public"."conversations" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Users can view their own verifications" ON "public"."user_verifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_activity_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_activity_log_policy" ON "public"."admin_activity_log" USING ((("auth"."uid"() = "admin_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."user_type" = 'admin'::"text"))))));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gigs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_profiles_read" ON "public"."profiles" FOR SELECT TO "anon" USING (true);



CREATE POLICY "unified_profiles_policy" ON "public"."profiles" TO "authenticated" USING ((("auth"."uid"() = "id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."user_type" = 'admin'::"text") OR ("p"."role_id" IS NOT NULL)))))));



ALTER TABLE "public"."user_verifications" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."mark_messages_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_messages_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_messages_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_sender_id" "uuid", "p_content" "text", "p_has_attachment" boolean, "p_attachment_type" "text", "p_attachment_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_sender_id" "uuid", "p_content" "text", "p_has_attachment" boolean, "p_attachment_type" "text", "p_attachment_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_sender_id" "uuid", "p_content" "text", "p_has_attachment" boolean, "p_attachment_type" "text", "p_attachment_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_on_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_on_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_on_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_roles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_roles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_roles_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."gigs" TO "anon";
GRANT ALL ON TABLE "public"."gigs" TO "authenticated";
GRANT ALL ON TABLE "public"."gigs" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."user_verifications" TO "anon";
GRANT ALL ON TABLE "public"."user_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_verifications" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
