/**
 * Currency and Number Formatting Utilities for Indian Rupees (INR).
 * This module replaces hardcoded USD/dollar references across the app.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  compactDisplay: 'short',
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format a number as standard INR currency (e.g., ₹1,250.50).
 */
export function formatCurrency(value: number): string {
  if (value == null || isNaN(value)) return '₹0.00';
  return inrFormatter.format(value);
}

/**
 * Format a large number as compact INR currency (e.g., ₹12.5L, ₹1.2Cr).
 */
export function formatCompactCurrency(value: number): string {
  if (value == null || isNaN(value)) return '₹0';
  
  // Custom logic to handle formatting accurately since 
  // 'en-IN' compact format outputs "T" (Thousands), "L" (Lakhs), "Cr" (Crores).
  const absVal = Math.abs(value);
  if (absVal >= 10000000) {
    return (value < 0 ? '-' : '') + '₹' + (absVal / 10000000).toFixed(2) + 'Cr';
  } else if (absVal >= 100000) {
    return (value < 0 ? '-' : '') + '₹' + (absVal / 100000).toFixed(2) + 'L';
  } else if (absVal >= 1000) {
    return (value < 0 ? '-' : '') + '₹' + (absVal / 1000).toFixed(1) + 'K';
  }
  return inrFormatter.format(value);
}

/**
 * Format a number as a percentage (e.g., 12.5%).
 */
export function formatPercentage(value: number): string {
  if (value == null || isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

/**
 * Format a number cleanly without currency symbols (e.g., 1,00,000).
 */
export function formatNumber(value: number): string {
  if (value == null || isNaN(value)) return '0';
  return numberFormatter.format(value);
}
