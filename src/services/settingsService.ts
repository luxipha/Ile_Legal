import { supabaseLocal as supabase } from '../lib/supabaseLocal';

interface PaymentProvider {
  name: string;
  enabled: boolean;
  apiKey?: string;          // For Circle: API Key, For Paystack: Public Key
  secretKey?: string;       // Secret Key for all providers
  webhookUrl?: string;      // Webhook URL for payment notifications
  callbackUrl?: string;     // Callback URL for payment redirects (Paystack)
  testMode: boolean;
  escrowWalletId?: string;  // Only for Circle
}

interface AppSettings {
  paymentProviders: PaymentProvider[];
  lastUpdated: string;
}

const SETTINGS_KEY = 'app_settings';

/**
 * Service for managing application settings
 */
export class SettingsService {
  private static cache: AppSettings | null = null;
  private static cacheExpiry: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current application settings
   */
  static async getSettings(): Promise<AppSettings> {
    // Check cache first
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      // Load from database
      const { data, error } = await supabase
        .from('app_settings')
        .select('settings')
        .eq('key', SETTINGS_KEY)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('Database fetch failed:', error);
      }

      if (data?.settings) {
        this.cache = data.settings as AppSettings;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        console.log('Settings loaded from database:', this.cache);
        return this.cache;
      }
    } catch (error) {
      console.warn('Database not available:', error);
    }

    // Fallback to localStorage if database fails
    try {
      const localSettings = localStorage.getItem('ile_app_settings');
      if (localSettings) {
        const settings = JSON.parse(localSettings) as AppSettings;
        this.cache = settings;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        console.log('Settings loaded from localStorage fallback:', settings);
        return settings;
      }
    } catch (error) {
      console.warn('localStorage fallback failed:', error);
    }

    // Return default settings if none found
    const defaultSettings: AppSettings = {
      paymentProviders: [
        { 
          name: "Circle", 
          enabled: true, 
          testMode: true,
          apiKey: "TEST_API_KEY:10a0b7b4cedfaa42d6ce306592fec59f:cfae665cde083f9236de7be92d08f54c",
          escrowWalletId: "52a2c755-6045-5217-8d70-8ac28dc221ba"
        },
        { name: "Flutterwave", enabled: false, testMode: true },
        { name: "Paystack", enabled: true, testMode: true }
      ],
      lastUpdated: new Date().toISOString()
    };

    this.cache = defaultSettings;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    console.log('Using default settings (no saved settings found):', defaultSettings);
    return defaultSettings;
  }

  /**
   * Save application settings
   */
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      settings.lastUpdated = new Date().toISOString();

      // Save to database - try update first, then insert if not exists
      const { error: updateError } = await supabase
        .from('app_settings')
        .update({
          settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('key', SETTINGS_KEY);

      // If update failed because row doesn't exist, insert it
      if (updateError && updateError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert({
            key: SETTINGS_KEY,
            settings: settings,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      console.log('Settings saved to database successfully:', settings);

      // Update cache
      this.cache = settings;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    } catch (error) {
      console.warn('Database save failed, using localStorage fallback:', error);
      // Fallback to localStorage
      localStorage.setItem('ile_app_settings', JSON.stringify(settings));
      console.log('Settings saved to localStorage fallback:', settings);
      
      // Update cache
      this.cache = settings;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    }
  }

  /**
   * Get Circle API configuration
   */
  static async getCircleConfig(): Promise<PaymentProvider | null> {
    const settings = await this.getSettings();
    return settings.paymentProviders.find(p => p.name === 'Circle') || null;
  }

  /**
   * Update payment providers
   */
  static async updatePaymentProviders(providers: PaymentProvider[]): Promise<void> {
    const settings = await this.getSettings();
    settings.paymentProviders = providers;
    await this.saveSettings(settings);
  }

  /**
   * Clear cache (useful for development)
   */
  static clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Debug method to check current settings
   */
  static async debugSettings(): Promise<void> {
    console.log('=== SETTINGS DEBUG ===');
    this.clearCache();
    const settings = await this.getSettings();
    console.log('Current settings:', settings);
    console.log('Paystack provider:', settings.paymentProviders.find(p => p.name === 'Paystack'));
    console.log('localStorage:', localStorage.getItem('ile_app_settings'));
    console.log('=== END DEBUG ===');
  }
}