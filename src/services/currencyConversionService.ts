/**
 * Currency Conversion Service
 * Handles conversion between NGN (Naira) and USDC for crypto payments
 */

export interface ConversionRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
  source: string;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  fee: number;
  totalAmount: number;
}

class CurrencyConversionService {
  private cachedRates: Map<string, ConversionRate> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Convert NGN to USDC for crypto payments
   */
  async convertNgnToUsdc(ngnAmount: number): Promise<ConversionResult> {
    try {
      const rate = await this.getExchangeRate('NGN', 'USDC');
      const convertedAmount = ngnAmount / rate.rate;
      const fee = convertedAmount * 0.02; // 2% conversion fee
      const totalAmount = convertedAmount + fee;

      return {
        originalAmount: ngnAmount,
        originalCurrency: 'NGN',
        convertedAmount: parseFloat(convertedAmount.toFixed(6)),
        convertedCurrency: 'USDC',
        exchangeRate: rate.rate,
        fee: parseFloat(fee.toFixed(6)),
        totalAmount: parseFloat(totalAmount.toFixed(6))
      };
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw new Error('Unable to convert currency. Please try again.');
    }
  }

  /**
   * Convert USDC to NGN for display purposes
   */
  async convertUsdcToNgn(usdcAmount: number): Promise<ConversionResult> {
    try {
      const rate = await this.getExchangeRate('NGN', 'USDC');
      const convertedAmount = usdcAmount * rate.rate;

      return {
        originalAmount: usdcAmount,
        originalCurrency: 'USDC',
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        convertedCurrency: 'NGN',
        exchangeRate: rate.rate,
        fee: 0,
        totalAmount: parseFloat(convertedAmount.toFixed(2))
      };
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw new Error('Unable to convert currency. Please try again.');
    }
  }

  /**
   * Get current exchange rate between two currencies
   */
  async getExchangeRate(from: string, to: string): Promise<ConversionRate> {
    const cacheKey = `${from}-${to}`;
    const cached = this.cachedRates.get(cacheKey);

    // Check if cached rate is still valid
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheExpiry) {
      return cached;
    }

    try {
      // For now, use a fallback rate since we don't have API access
      // In production, you'd use a real API like CoinGecko, CurrencyAPI, etc.
      const rate = await this.fetchExchangeRate(from, to);
      
      const conversionRate: ConversionRate = {
        from,
        to,
        rate: rate,
        lastUpdated: new Date(),
        source: 'fallback'
      };

      this.cachedRates.set(cacheKey, conversionRate);
      return conversionRate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      
      // Return fallback rate if API fails
      const fallbackRate: ConversionRate = {
        from,
        to,
        rate: this.getFallbackRate(from, to),
        lastUpdated: new Date(),
        source: 'fallback'
      };

      return fallbackRate;
    }
  }

  /**
   * Fetch exchange rate from external API
   * TODO: Implement with real API when available
   */
  private async fetchExchangeRate(from: string, to: string): Promise<number> {
    // For demo purposes, we'll use a mock API call
    // In production, replace with actual API
    
    if (from === 'NGN' && to === 'USDC') {
      // Try to get real USD/NGN rate and assume USDC ≈ USD
      try {
        // This is a fallback - in production use proper API
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          return data.rates.NGN || 1600; // Fallback to ~1600 NGN per USD
        }
      } catch (error) {
        console.warn('Exchange rate API failed, using fallback');
      }
    }

    return this.getFallbackRate(from, to);
  }

  /**
   * Get fallback exchange rates when API is unavailable
   */
  private getFallbackRate(from: string, to: string): number {
    const rates: { [key: string]: number } = {
      'NGN-USDC': 1600, // 1 USDC ≈ 1600 NGN (approximate)
      'USDC-NGN': 0.000625, // 1 NGN ≈ 0.000625 USDC
      'NGN-USD': 1600,
      'USD-NGN': 0.000625
    };

    const key = `${from}-${to}`;
    return rates[key] || 1;
  }

  /**
   * Format currency amount with proper symbols
   */
  formatCurrency(amount: number, currency: string): string {
    const formatters: { [key: string]: Intl.NumberFormat } = {
      'NGN': new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }),
      'USDC': new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      }),
      'USD': new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      })
    };

    const formatter = formatters[currency] || formatters['USD'];
    const formatted = formatter.format(amount);
    
    // Add USDC suffix for USDC amounts
    if (currency === 'USDC') {
      return `$${formatted} USDC`;
    }
    
    return formatted;
  }

  /**
   * Get supported currency pairs
   */
  getSupportedPairs(): string[] {
    return ['NGN-USDC', 'USDC-NGN'];
  }

  /**
   * Check if wallet payment should use conversion
   */
  shouldConvertCurrency(paymentCurrency: string, walletCurrency: string): boolean {
    return paymentCurrency === 'NGN' && walletCurrency === 'USDC';
  }
}

export const currencyConversionService = new CurrencyConversionService();