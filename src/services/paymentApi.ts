import { supabaseLocal as supabase } from '../lib/supabaseLocal';

export interface BankAccount {
  id: string;
  user_id: string;
  account_holder_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  routing_number?: string;
  account_type: 'checking' | 'savings';
  currency: string;
  is_primary: boolean;
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_method?: 'instant' | 'micro_deposits' | 'manual';
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'bank_account' | 'card' | 'wallet';
  provider: 'circle' | 'stripe' | 'plaid';
  external_id: string;
  details: any;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Bank Account Management APIs
 */
export const bankAccountApi = {
  /**
   * Add a new bank account for a user
   */
  addBankAccount: async (bankAccountData: {
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    bank_code: string;
    routing_number?: string;
    account_type: 'checking' | 'savings';
    currency?: string;
  }): Promise<BankAccount> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in to add a bank account');
    }

    // Check if this is the user's first bank account (make it primary)
    const { data: existingAccounts } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('user_id', user.id);

    const isPrimary = !existingAccounts || existingAccounts.length === 0;

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        user_id: user.id,
        account_holder_name: bankAccountData.account_holder_name,
        account_number: bankAccountData.account_number,
        bank_name: bankAccountData.bank_name,
        bank_code: bankAccountData.bank_code,
        routing_number: bankAccountData.routing_number,
        account_type: bankAccountData.account_type,
        currency: bankAccountData.currency || 'USD',
        is_primary: isPrimary,
        is_verified: false,
        verification_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all bank accounts for the current user
   */
  getUserBankAccounts: async (): Promise<BankAccount[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in to view bank accounts');
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Set a bank account as primary
   */
  setPrimaryBankAccount: async (accountId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in');
    }

    // First, unset all accounts as primary
    await supabase
      .from('bank_accounts')
      .update({ is_primary: false })
      .eq('user_id', user.id);

    // Then set the selected account as primary
    const { error } = await supabase
      .from('bank_accounts')
      .update({ is_primary: true })
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  /**
   * Delete a bank account
   */
  deleteBankAccount: async (accountId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in');
    }

    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  /**
   * Update bank account verification status (admin only)
   */
  updateVerificationStatus: async (
    accountId: string, 
    status: 'verified' | 'failed',
    method?: 'instant' | 'micro_deposits' | 'manual'
  ): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in');
    }

    // Check if user is admin
    const userRole = user.user_metadata?.role || user.user_metadata?.role_title;
    if (userRole !== 'admin') {
      throw new Error('Only admins can update verification status');
    }

    const { error } = await supabase
      .from('bank_accounts')
      .update({
        verification_status: status,
        is_verified: status === 'verified',
        verification_method: method,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);

    if (error) throw error;
  }
};

/**
 * Payment Methods Management APIs
 */
export const paymentMethodApi = {
  /**
   * Add a new payment method
   */
  addPaymentMethod: async (paymentMethodData: {
    type: 'bank_account' | 'card' | 'wallet';
    provider: 'circle' | 'stripe' | 'plaid';
    external_id: string;
    details: any;
  }): Promise<PaymentMethod> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in to add a payment method');
    }

    // Check if this is the user's first payment method (make it default)
    const { data: existingMethods } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('user_id', user.id);

    const isDefault = !existingMethods || existingMethods.length === 0;

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        type: paymentMethodData.type,
        provider: paymentMethodData.provider,
        external_id: paymentMethodData.external_id,
        details: paymentMethodData.details,
        is_default: isDefault,
        is_verified: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all payment methods for the current user
   */
  getUserPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in to view payment methods');
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Set a payment method as default
   */
  setDefaultPaymentMethod: async (methodId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in');
    }

    // First, unset all methods as default
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Then set the selected method as default
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', methodId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  /**
   * Delete a payment method
   */
  deletePaymentMethod: async (methodId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in');
    }

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', methodId)
      .eq('user_id', user.id);

    if (error) throw error;
  }
};

/**
 * Admin Payment APIs
 */
export const adminPaymentApi = {
  /**
   * Get all bank accounts (admin only)
   */
  getAllBankAccounts: async (
    status?: 'pending' | 'verified' | 'failed',
    page = 1,
    limit = 20
  ): Promise<{
    accounts: BankAccount[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in');
    }

    // Check if user is admin
    const userRole = user.user_metadata?.role || user.user_metadata?.role_title;
    if (userRole !== 'admin') {
      throw new Error('Only admins can view all bank accounts');
    }

    let query = supabase
      .from('bank_accounts')
      .select('*, Profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq('verification_status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      accounts: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  },

  /**
   * Get all payment methods (admin only)
   */
  getAllPaymentMethods: async (
    page = 1,
    limit = 20
  ): Promise<{
    methods: PaymentMethod[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in');
    }

    // Check if user is admin
    const userRole = user.user_metadata?.role || user.user_metadata?.role_title;
    if (userRole !== 'admin') {
      throw new Error('Only admins can view all payment methods');
    }

    const { data, error, count } = await supabase
      .from('payment_methods')
      .select('*, Profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return {
      methods: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  },

  /**
   * Verify a bank account (admin only)
   */
  verifyBankAccount: async (
    accountId: string,
    method: 'instant' | 'micro_deposits' | 'manual' = 'manual'
  ): Promise<void> => {
    await bankAccountApi.updateVerificationStatus(accountId, 'verified', method);
  },

  /**
   * Reject a bank account verification (admin only)
   */
  rejectBankAccount: async (accountId: string): Promise<void> => {
    await bankAccountApi.updateVerificationStatus(accountId, 'failed');
  }
};