import { supabaseLocal as supabase } from '../lib/supabaseLocal';

interface PaymentProvider {
  name: string;
  enabled: boolean;
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  testMode: boolean;
  escrowWalletId?: string;
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
      // Try to get from database
      const { data, error } = await supabase
        .from('app_settings')
        .select('settings')
        .eq('key', SETTINGS_KEY)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching settings:', error);
      }

      if (data?.settings) {
        this.cache = data.settings as AppSettings;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return this.cache;
      }
    } catch (error) {
      console.error('Failed to fetch settings from database:', error);
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
        { name: "Stripe", enabled: false, testMode: true },
        { name: "PayPal", enabled: false, testMode: true },
        { name: "Flutterwave", enabled: false, testMode: true },
        { name: "Paystack", enabled: false, testMode: true }
      ],
      lastUpdated: new Date().toISOString()
    };

    this.cache = defaultSettings;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    return defaultSettings;
  }

  /**
   * Save application settings
   */
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      settings.lastUpdated = new Date().toISOString();

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: SETTINGS_KEY,
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Update cache
      this.cache = settings;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
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
}