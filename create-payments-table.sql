-- Create Payments table for payment tracking
CREATE TABLE IF NOT EXISTS "Payments" (
    id TEXT PRIMARY KEY,
    task_id UUID REFERENCES "Gigs"(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('wallet', 'paystack', 'bank')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    description TEXT,
    wallet_address TEXT,
    transaction_hash TEXT,
    paystack_reference TEXT,
    paystack_access_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Withdrawals table for withdrawal tracking
CREATE TABLE IF NOT EXISTS "Withdrawals" (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('bank', 'wallet')),
    bank_account_id TEXT,
    wallet_address TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    transaction_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create PaymentLogs table for audit trail
CREATE TABLE IF NOT EXISTS "PaymentLogs" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2),
    method TEXT,
    attempt_time TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_task_id ON "Payments"(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer_id ON "Payments"(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_seller_id ON "Payments"(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON "Payments"(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON "Payments"(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON "Withdrawals"(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON "Withdrawals"(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON "Withdrawals"(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_logs_task_id ON "PaymentLogs"(task_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_buyer_id ON "PaymentLogs"(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON "PaymentLogs"(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE "Payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Withdrawals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentLogs" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Payments
CREATE POLICY "Users can view payments they're involved in" ON "Payments"
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role_title') = 'admin'
    );

CREATE POLICY "Users can create payments as buyers" ON "Payments"
    FOR INSERT WITH CHECK (
        auth.uid() = buyer_id OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role_title') = 'admin'
    );

CREATE POLICY "Users can update their payments" ON "Payments"
    FOR UPDATE USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role_title') = 'admin'
    );

-- RLS Policies for Withdrawals
CREATE POLICY "Users can view their own withdrawals" ON "Withdrawals"
    FOR SELECT USING (
        auth.uid() = user_id OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role_title') = 'admin'
    );

CREATE POLICY "Users can create their own withdrawals" ON "Withdrawals"
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role_title') = 'admin'
    );

-- RLS Policies for PaymentLogs
CREATE POLICY "Users can view logs for their payments" ON "PaymentLogs"
    FOR SELECT USING (
        auth.uid() = buyer_id OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role_title') = 'admin'
    );

CREATE POLICY "System can insert payment logs" ON "PaymentLogs"
    FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE "Payments" IS 'Payment transactions for gigs';
COMMENT ON TABLE "Withdrawals" IS 'Withdrawal requests from users';
COMMENT ON TABLE "PaymentLogs" IS 'Audit trail for payment attempts';