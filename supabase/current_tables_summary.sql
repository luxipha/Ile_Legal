CREATE TABLE public."Bids" (
CREATE TABLE public."Disputes" (
CREATE TABLE public."Feedback" (
CREATE TABLE public."Gigs" (
CREATE TABLE public."PaymentLogs" (
CREATE TABLE public."Payments" (
CREATE TABLE public."Profiles" (
CREATE TABLE public."Withdrawals" (
CREATE TABLE public."Work Submissions" (
CREATE TABLE public.admin_actions (
CREATE TABLE public.app_settings (
CREATE TABLE public.conversations (
CREATE TABLE public.filecoin_storage (
CREATE TABLE public.legal_case_completions (
CREATE TABLE public.legal_credentials (
CREATE TABLE public.messages (
CREATE TABLE public.professional_achievements (
CREATE TABLE public.property_approvals (
CREATE TABLE public.reputation_attestations (
CREATE TABLE public.reputation_config (
CREATE TABLE public.reputation_events (
CREATE TABLE public.reputation_scores (
CREATE TABLE public.user_documents (
CREATE TABLE public.user_notifications (
CREATE TABLE public.user_verifications (
ALTER TABLE ONLY public."Disputes" ALTER COLUMN id SET DEFAULT nextval('public."Disputes_id_seq"'::regclass);
ALTER TABLE ONLY public.filecoin_storage ALTER COLUMN id SET DEFAULT nextval('public.filecoin_storage_id_seq'::regclass);
ALTER TABLE ONLY public."Bids"
ALTER TABLE ONLY public."Disputes"
ALTER TABLE ONLY public."Feedback"
ALTER TABLE ONLY public."Gigs"
ALTER TABLE ONLY public."PaymentLogs"
ALTER TABLE ONLY public."Payments"
ALTER TABLE ONLY public."Profiles"
ALTER TABLE ONLY public."Withdrawals"
ALTER TABLE ONLY public."Work Submissions"
ALTER TABLE ONLY public.admin_actions
ALTER TABLE ONLY public.app_settings
ALTER TABLE ONLY public.app_settings
ALTER TABLE ONLY public.conversations
ALTER TABLE ONLY public.conversations
ALTER TABLE ONLY public.filecoin_storage
ALTER TABLE ONLY public.filecoin_storage
ALTER TABLE ONLY public.legal_case_completions
ALTER TABLE ONLY public.legal_credentials
ALTER TABLE ONLY public.messages
ALTER TABLE ONLY public.professional_achievements
ALTER TABLE ONLY public.property_approvals
ALTER TABLE ONLY public.reputation_attestations
ALTER TABLE ONLY public.reputation_config
ALTER TABLE ONLY public.reputation_events
ALTER TABLE ONLY public.reputation_scores
ALTER TABLE ONLY public.reputation_scores
ALTER TABLE ONLY public.user_documents
ALTER TABLE ONLY public.user_notifications
ALTER TABLE ONLY public.user_verifications
CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions USING btree (admin_id);
CREATE INDEX idx_admin_actions_type ON public.admin_actions USING btree (action_type);
CREATE INDEX idx_app_settings_key ON public.app_settings USING btree (key);
CREATE INDEX idx_bids_buyer_id ON public."Bids" USING btree (buyer_id);
CREATE INDEX idx_bids_gig_id ON public."Bids" USING btree (gig_id);
CREATE INDEX idx_bids_seller_id ON public."Bids" USING btree (seller_id);
CREATE INDEX idx_bids_status ON public."Bids" USING btree (status);
CREATE INDEX idx_conversations_buyer_id ON public.conversations USING btree (buyer_id);
CREATE INDEX idx_conversations_seller_id ON public.conversations USING btree (seller_id);
CREATE INDEX idx_disputes_buyer_id ON public."Disputes" USING btree (buyer_id);
CREATE INDEX idx_disputes_gig_id ON public."Disputes" USING btree (gig_id);
CREATE INDEX idx_disputes_seller_id ON public."Disputes" USING btree (seller_id);
CREATE INDEX idx_disputes_status ON public."Disputes" USING btree (status);
CREATE INDEX idx_feedback_creator ON public."Feedback" USING btree (creator);
CREATE INDEX idx_feedback_gig_id ON public."Feedback" USING btree (gig_id);
CREATE INDEX idx_feedback_recipient ON public."Feedback" USING btree (recipient);
CREATE INDEX idx_filecoin_storage_ipfs_cid ON public.filecoin_storage USING btree (ipfs_cid);
CREATE INDEX idx_filecoin_storage_piece_id ON public.filecoin_storage USING btree (piece_id);
CREATE INDEX idx_filecoin_storage_upload_timestamp ON public.filecoin_storage USING btree (upload_timestamp DESC);
CREATE INDEX idx_filecoin_storage_user_id ON public.filecoin_storage USING btree (user_id);
CREATE INDEX idx_gigs_buyer_id ON public."Gigs" USING btree (buyer_id);
CREATE INDEX idx_gigs_is_flagged ON public."Gigs" USING btree (is_flagged);
CREATE INDEX idx_legal_case_completions_client_id ON public.legal_case_completions USING btree (client_id);
CREATE INDEX idx_legal_case_completions_user_id ON public.legal_case_completions USING btree (user_id);
CREATE INDEX idx_legal_credentials_status ON public.legal_credentials USING btree (verification_status);
CREATE INDEX idx_legal_credentials_user_id ON public.legal_credentials USING btree (user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);
CREATE INDEX idx_payment_logs_buyer_id ON public."PaymentLogs" USING btree (buyer_id);
CREATE INDEX idx_payment_logs_created_at ON public."PaymentLogs" USING btree (created_at DESC);
CREATE INDEX idx_payment_logs_task_id ON public."PaymentLogs" USING btree (task_id);
CREATE INDEX idx_payments_buyer_id ON public."Payments" USING btree (buyer_id);
CREATE INDEX idx_payments_created_at ON public."Payments" USING btree (created_at DESC);
CREATE INDEX idx_payments_seller_id ON public."Payments" USING btree (seller_id);
CREATE INDEX idx_payments_status ON public."Payments" USING btree (status);
CREATE INDEX idx_payments_task_id ON public."Payments" USING btree (task_id);
CREATE INDEX idx_property_approvals_approver_id ON public.property_approvals USING btree (approver_id);
CREATE INDEX idx_reputation_attestations_attester ON public.reputation_attestations USING btree (attester_id);
CREATE INDEX idx_reputation_attestations_subject_user ON public.reputation_attestations USING btree (subject_user_id);
CREATE INDEX idx_reputation_events_blockchain_tx ON public.reputation_events USING btree (blockchain_tx_id);
CREATE INDEX idx_reputation_events_gig_id ON public.reputation_events USING btree (gig_id);
CREATE INDEX idx_reputation_events_user_id ON public.reputation_events USING btree (user_id);
CREATE INDEX idx_reputation_scores_type ON public.reputation_scores USING btree (reputation_type);
CREATE INDEX idx_reputation_scores_user_id ON public.reputation_scores USING btree (user_id);
CREATE INDEX idx_user_documents_status ON public.user_documents USING btree (verification_status);
CREATE INDEX idx_user_documents_user_id ON public.user_documents USING btree (user_id);
CREATE INDEX idx_user_notifications_read ON public.user_notifications USING btree (read_at);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id);
CREATE INDEX idx_user_verifications_status ON public.user_verifications USING btree (status);
CREATE INDEX idx_user_verifications_user_id ON public.user_verifications USING btree (user_id);
CREATE INDEX idx_withdrawals_created_at ON public."Withdrawals" USING btree (created_at DESC);
CREATE INDEX idx_withdrawals_status ON public."Withdrawals" USING btree (status);
CREATE INDEX idx_withdrawals_user_id ON public."Withdrawals" USING btree (user_id);
CREATE INDEX idx_work_submissions_gig_id ON public."Work Submissions" USING btree (gig_id);
CREATE INDEX idx_work_submissions_seller_id ON public."Work Submissions" USING btree (seller_id);
CREATE INDEX idx_work_submissions_status ON public."Work Submissions" USING btree (status);
ALTER TABLE ONLY public."Bids"
ALTER TABLE ONLY public."Bids"
ALTER TABLE ONLY public."Bids"
ALTER TABLE ONLY public."Disputes"
ALTER TABLE ONLY public."Disputes"
ALTER TABLE ONLY public."Disputes"
ALTER TABLE ONLY public."Feedback"
ALTER TABLE ONLY public."Feedback"
ALTER TABLE ONLY public."Gigs"
ALTER TABLE ONLY public."PaymentLogs"
ALTER TABLE ONLY public."Payments"
ALTER TABLE ONLY public."Payments"
ALTER TABLE ONLY public."Payments"
ALTER TABLE ONLY public."Withdrawals"
ALTER TABLE ONLY public."Work Submissions"
ALTER TABLE ONLY public.admin_actions
ALTER TABLE ONLY public.conversations
ALTER TABLE ONLY public.conversations
ALTER TABLE ONLY public.conversations
ALTER TABLE ONLY public.filecoin_storage
ALTER TABLE ONLY public.legal_case_completions
ALTER TABLE ONLY public.legal_case_completions
ALTER TABLE ONLY public.legal_case_completions
ALTER TABLE ONLY public.legal_credentials
ALTER TABLE ONLY public.legal_credentials
ALTER TABLE ONLY public.messages
ALTER TABLE ONLY public.messages
ALTER TABLE ONLY public.professional_achievements
ALTER TABLE ONLY public.property_approvals
ALTER TABLE ONLY public.property_approvals
ALTER TABLE ONLY public.reputation_attestations
ALTER TABLE ONLY public.reputation_attestations
ALTER TABLE ONLY public.reputation_config
ALTER TABLE ONLY public.reputation_events
ALTER TABLE ONLY public.reputation_events
ALTER TABLE ONLY public.reputation_events
ALTER TABLE ONLY public.reputation_scores
ALTER TABLE ONLY public.user_documents
ALTER TABLE ONLY public.user_documents
ALTER TABLE ONLY public.user_notifications
ALTER TABLE ONLY public.user_notifications
ALTER TABLE ONLY public.user_verifications
ALTER TABLE public."Bids" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Disputes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Gigs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PaymentLogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Withdrawals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Work Submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filecoin_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_case_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
