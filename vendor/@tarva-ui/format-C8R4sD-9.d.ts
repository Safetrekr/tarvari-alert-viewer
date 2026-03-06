/**
 * Number formatting utilities for data display components.
 */
interface FormatNumberOptions {
    /** Locale for formatting (default: 'en-NZ') */
    locale?: string;
    /** Number style */
    style?: 'decimal' | 'currency' | 'percent';
    /** Currency code (only for style: 'currency') */
    currency?: string;
    /** Minimum fraction digits */
    minimumFractionDigits?: number;
    /** Maximum fraction digits */
    maximumFractionDigits?: number;
    /** Notation style */
    notation?: 'standard' | 'compact';
}
/**
 * Format a number with Intl.NumberFormat.
 */
declare function formatNumber(value: number | null | undefined, options?: FormatNumberOptions): string;
/**
 * Format a number as currency.
 */
declare function formatCurrency(value: number | null | undefined, options?: Omit<FormatNumberOptions, 'style'>): string;
/**
 * Format a number as percentage.
 * @param value - Value between 0 and 1 (e.g., 0.75 for 75%)
 */
declare function formatPercent(value: number | null | undefined, options?: Omit<FormatNumberOptions, 'style'>): string;
/**
 * Format a number in compact notation (e.g., 1.2K, 3.4M).
 */
declare function formatCompact(value: number | null | undefined, options?: Omit<FormatNumberOptions, 'notation'>): string;
interface FormatDateOptions {
    /** Locale for formatting (default: 'en-NZ') */
    locale?: string;
    /** Date format style */
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    /** Time format style */
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
}
/**
 * Format a date value.
 */
declare function formatDate(value: Date | string | number | null | undefined, options?: FormatDateOptions): string;
/**
 * Format a date as relative time (e.g., "2 hours ago").
 */
declare function formatRelativeTime(value: Date | string | number | null | undefined, options?: {
    locale?: string;
}): string;
/**
 * Calculate percentage change between two values.
 */
declare function calculateChange(current: number, previous: number): number | null;
/**
 * Format a change value with sign (e.g., "+12.5%" or "-8.3%").
 */
declare function formatChange(change: number | null | undefined, options?: Omit<FormatNumberOptions, 'style'>): string;

export { type FormatDateOptions as F, type FormatNumberOptions as a, formatCompact as b, calculateChange as c, formatCurrency as d, formatDate as e, formatChange as f, formatNumber as g, formatPercent as h, formatRelativeTime as i };
