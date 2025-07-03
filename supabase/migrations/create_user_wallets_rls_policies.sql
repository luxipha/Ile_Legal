-- Enable RLS on user_wallets table
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own wallets
CREATE POLICY "Users can view their own wallets" ON public.user_wallets
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own wallets
CREATE POLICY "Users can insert their own wallets" ON public.user_wallets
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own wallets
CREATE POLICY "Users can update their own wallets" ON public.user_wallets
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own wallets
CREATE POLICY "Users can delete their own wallets" ON public.user_wallets
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Policy: Service role can access all wallets (for admin functions)
CREATE POLICY "Service role can access all wallets" ON public.user_wallets
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_wallets TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;