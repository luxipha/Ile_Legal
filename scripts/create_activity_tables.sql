-- Create admin_activity_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    action_description text NOT NULL,
    ip_address text,
    user_agent text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_sessions table for tracking login sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    session_token text NOT NULL,
    device_info text NOT NULL,
    ip_address text,
    location text,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_active timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_current boolean DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON public.admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON public.admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON public.admin_activity_log(action_type);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON public.user_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_current ON public.user_sessions(is_current);

-- Enable RLS on both tables
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_activity_log
-- Allow authenticated users to read their own activity logs
CREATE POLICY "Allow users to read their own activity logs" ON public.admin_activity_log
    FOR SELECT USING (auth.uid() = admin_id);

-- Allow authenticated users to insert their own activity logs
CREATE POLICY "Allow users to insert their own activity logs" ON public.admin_activity_log
    FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Allow service role full access
CREATE POLICY "Enable all access for service role" ON public.admin_activity_log
    FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for user_sessions
-- Allow authenticated users to read their own sessions
CREATE POLICY "Allow users to read their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own sessions
CREATE POLICY "Allow users to insert their own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own sessions
CREATE POLICY "Allow users to update their own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own sessions
CREATE POLICY "Allow users to delete their own sessions" ON public.user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Enable all access for service role sessions" ON public.user_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Create a function to automatically log login activities
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS trigger AS $$
BEGIN
    -- Only log for admin users (those with admin user_type)
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = NEW.user_id 
        AND user_type IN ('admin', 'super_admin', 'moderator', 'support')
    ) THEN
        INSERT INTO public.admin_activity_log (
            admin_id,
            action_type,
            action_description,
            metadata
        ) VALUES (
            NEW.user_id,
            'login',
            'User logged in',
            jsonb_build_object(
                'session_id', NEW.id,
                'device_info', NEW.device_info,
                'location', NEW.location
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic login logging
DROP TRIGGER IF EXISTS trigger_log_user_login ON public.user_sessions;
CREATE TRIGGER trigger_log_user_login
    AFTER INSERT ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_user_login();

COMMENT ON TABLE public.admin_activity_log IS 'Tracks admin user activities for audit purposes';
COMMENT ON TABLE public.user_sessions IS 'Tracks user login sessions and device information';