/**
 * Currency formatting utilities
 */

/**
 * Format a number as currency with the correct symbol and decimal places
 * 
 * @param amount The numeric amount to format
 * @param currency The 3-letter currency code (USD, EUR, etc.)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount === null || amount === undefined) {
    return '';
  }
  
  // Currency formatting options
  const currencyFormats: Record<string, { symbol: string, position: 'before' | 'after', locale: string }> = {
    'USD': { symbol: '$', position: 'before', locale: 'en-US' },
    'EUR': { symbol: '€', position: 'after', locale: 'de-DE' },
    'GBP': { symbol: '£', position: 'before', locale: 'en-GB' },
    'CAD': { symbol: '$', position: 'before', locale: 'en-CA' },
    'AUD': { symbol: '$', position: 'before', locale: 'en-AU' },
    'JPY': { symbol: '¥', position: 'before', locale: 'ja-JP' }
  };
  
  // Default format if currency not found
  const format = currencyFormats[currency] || { symbol: '$', position: 'before', locale: 'en-US' };
  
  try {
    // Format number according to locale
    const formatter = new Intl.NumberFormat(format.locale, {
      style: 'decimal',
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2
    });
    
    const formattedNumber = formatter.format(amount);
    
    // Add currency symbol in the correct position
    return format.position === 'before' 
      ? `${format.symbol}${formattedNumber}` 
      : `${formattedNumber} ${format.symbol}`;
  } catch (error) {
    // Fallback for older browsers
    return `${format.position === 'before' ? format.symbol : ''}${amount.toFixed(2)}${format.position === 'after' ? ` ${format.symbol}` : ''}`;
  }
}

/**
 * Get currency symbol for a given currency code
 * 
 * @param currency 3-letter currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': '$',
    'AUD': '$',
    'JPY': '¥'
  };
  
  return symbols[currency] || '$';
}