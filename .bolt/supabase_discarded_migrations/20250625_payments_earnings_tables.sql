-- Create comprehensive payment and earnings tables
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES "Gigs"(id),
    type TEXT NOT NULL CHECK (type IN ('payment_sent', 'payment_received', 'withdrawal', 'deposit', 'refund', 'escrow_release')),
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT NOT NULL,
    counterparty_id UUID REFERENCES auth.users(id),
    counterparty_name TEXT,
    payment_method TEXT CHECK (payment_method IN ('wallet', 'paystack', 'bank_transfer', 'circle')),
    transaction_hash TEXT,
    external_transaction_id TEXT,
    reference_number TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create bank_accounts table for user banking information
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_holder_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_code TEXT,
    routing_number TEXT,
    account_type TEXT DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings')),
    currency TEXT DEFAULT 'NGN',
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create earnings_summary table for quick earnings calculations
CREATE TABLE IF NOT EXISTS earnings_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_earned DECIMAL(12, 2) DEFAULT 0,
    total_withdrawn DECIMAL(12, 2) DEFAULT 0,
    available_balance DECIMAL(12, 2) DEFAULT 0,
    pending_earnings DECIMAL(12, 2) DEFAULT 0,
    this_month_earnings DECIMAL(12, 2) DEFAULT 0,
    last_month_earnings DECIMAL(12, 2) DEFAULT 0,
    gigs_completed INTEGER DEFAULT 0,
    avg_gig_value DECIMAL(12, 2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_gig_id ON transactions(gig_id);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_default ON bank_accounts(user_id, is_default) WHERE is_default = TRUE;

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = counterparty_id);

CREATE POLICY "Users can create their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all transactions
CREATE POLICY "Service role can manage all transactions" ON transactions
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for bank_accounts
CREATE POLICY "Users can manage their own bank accounts" ON bank_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all bank accounts
CREATE POLICY "Service role can manage all bank accounts" ON bank_accounts
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for earnings_summary
CREATE POLICY "Users can view their own earnings summary" ON earnings_summary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own earnings summary" ON earnings_summary
    FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all earnings summaries
CREATE POLICY "Service role can manage all earnings summaries" ON earnings_summary
    FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate and update earnings summary
CREATE OR REPLACE FUNCTION update_earnings_summary(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    earned DECIMAL(12, 2);
    withdrawn DECIMAL(12, 2);
    pending DECIMAL(12, 2);
    this_month DECIMAL(12, 2);
    last_month DECIMAL(12, 2);
    completed_gigs INTEGER;
    avg_value DECIMAL(12, 2);
BEGIN
    -- Calculate total earned (payments received)
    SELECT COALESCE(SUM(amount), 0) INTO earned
    FROM transactions 
    WHERE user_id = target_user_id 
    AND type = 'payment_received' 
    AND status = 'completed';
    
    -- Calculate total withdrawn
    SELECT COALESCE(SUM(amount), 0) INTO withdrawn
    FROM transactions 
    WHERE user_id = target_user_id 
    AND type = 'withdrawal' 
    AND status = 'completed';
    
    -- Calculate pending earnings
    SELECT COALESCE(SUM(amount), 0) INTO pending
    FROM transactions 
    WHERE user_id = target_user_id 
    AND type = 'payment_received' 
    AND status = 'pending';
    
    -- Calculate this month earnings
    SELECT COALESCE(SUM(amount), 0) INTO this_month
    FROM transactions 
    WHERE user_id = target_user_id 
    AND type = 'payment_received' 
    AND status = 'completed'
    AND created_at >= DATE_TRUNC('month', NOW());
    
    -- Calculate last month earnings
    SELECT COALESCE(SUM(amount), 0) INTO last_month
    FROM transactions 
    WHERE user_id = target_user_id 
    AND type = 'payment_received' 
    AND status = 'completed'
    AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    AND created_at < DATE_TRUNC('month', NOW());
    
    -- Calculate completed gigs
    SELECT COUNT(DISTINCT gig_id) INTO completed_gigs
    FROM transactions 
    WHERE user_id = target_user_id 
    AND type = 'payment_received' 
    AND status = 'completed'
    AND gig_id IS NOT NULL;
    
    -- Calculate average gig value
    IF completed_gigs > 0 THEN
        avg_value := earned / completed_gigs;
    ELSE
        avg_value := 0;
    END IF;
    
    -- Insert or update earnings summary
    INSERT INTO earnings_summary (
        user_id, 
        total_earned, 
        total_withdrawn, 
        available_balance, 
        pending_earnings,
        this_month_earnings,
        last_month_earnings,
        gigs_completed,
        avg_gig_value,
        last_updated
    ) VALUES (
        target_user_id,
        earned,
        withdrawn,
        earned - withdrawn,
        pending,
        this_month,
        last_month,
        completed_gigs,
        avg_value,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_earned = earned,
        total_withdrawn = withdrawn,
        available_balance = earned - withdrawn,
        pending_earnings = pending,
        this_month_earnings = this_month,
        last_month_earnings = last_month,
        gigs_completed = completed_gigs,
        avg_gig_value = avg_value,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a transaction and update earnings
CREATE OR REPLACE FUNCTION create_transaction(
    p_user_id UUID,
    p_type TEXT,
    p_amount DECIMAL,
    p_description TEXT,
    p_gig_id UUID DEFAULT NULL,
    p_counterparty_id UUID DEFAULT NULL,
    p_counterparty_name TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
BEGIN
    -- Insert transaction
    INSERT INTO transactions (
        user_id,
        type,
        amount,
        description,
        gig_id,
        counterparty_id,
        counterparty_name,
        payment_method,
        metadata,
        status
    ) VALUES (
        p_user_id,
        p_type,
        p_amount,
        p_description,
        p_gig_id,
        p_counterparty_id,
        p_counterparty_name,
        p_payment_method,
        p_metadata,
        'completed'
    ) RETURNING id INTO transaction_id;
    
    -- Update earnings summary
    PERFORM update_earnings_summary(p_user_id);
    
    -- If there's a counterparty, update their earnings too
    IF p_counterparty_id IS NOT NULL THEN
        PERFORM update_earnings_summary(p_counterparty_id);
    END IF;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user transaction history
CREATE OR REPLACE FUNCTION get_user_transactions(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_type TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    type TEXT,
    amount DECIMAL,
    currency TEXT,
    status TEXT,
    description TEXT,
    counterparty_name TEXT,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.type,
        t.amount,
        t.currency,
        t.status,
        t.description,
        t.counterparty_name,
        t.payment_method,
        t.created_at,
        t.metadata
    FROM transactions t
    WHERE t.user_id = p_user_id 
    AND (p_type IS NULL OR t.type = p_type)
    ORDER BY t.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;