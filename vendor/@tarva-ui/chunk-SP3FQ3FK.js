import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/utils/format.ts
function formatNumber(value, options = {}) {
  if (value == null || isNaN(value)) return "";
  const {
    locale = "en-NZ",
    style = "decimal",
    currency = "NZD",
    minimumFractionDigits,
    maximumFractionDigits,
    notation = "standard"
  } = options;
  return new Intl.NumberFormat(locale, {
    style,
    currency: style === "currency" ? currency : void 0,
    minimumFractionDigits,
    maximumFractionDigits,
    notation
  }).format(value);
}
function formatCurrency(value, options = {}) {
  return formatNumber(value, {
    ...options,
    style: "currency",
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2
  });
}
function formatPercent(value, options = {}) {
  return formatNumber(value, {
    ...options,
    style: "percent",
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 1
  });
}
function formatCompact(value, options = {}) {
  return formatNumber(value, {
    ...options,
    notation: "compact",
    maximumFractionDigits: options.maximumFractionDigits ?? 1
  });
}
function formatDate(value, options = {}) {
  if (value == null) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "";
  const { locale = "en-NZ", dateStyle = "medium", timeStyle } = options;
  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle
  }).format(date);
}
function formatRelativeTime(value, options = {}) {
  if (value == null) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "";
  const { locale = "en-NZ" } = options;
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1e3);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diffDay > 0) return rtf.format(-diffDay, "day");
  if (diffHour > 0) return rtf.format(-diffHour, "hour");
  if (diffMin > 0) return rtf.format(-diffMin, "minute");
  return rtf.format(-diffSec, "second");
}
function calculateChange(current, previous) {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous) * 100;
}
function formatChange(change, options = {}) {
  if (change == null) return "";
  const formatted = formatNumber(Math.abs(change), {
    ...options,
    minimumFractionDigits: options.minimumFractionDigits ?? 1,
    maximumFractionDigits: options.maximumFractionDigits ?? 1
  });
  const sign = change > 0 ? "+" : change < 0 ? "-" : "";
  return `${sign}${formatted}%`;
}

export { calculateChange, cn, formatChange, formatCompact, formatCurrency, formatDate, formatNumber, formatPercent, formatRelativeTime };
//# sourceMappingURL=chunk-SP3FQ3FK.js.map
//# sourceMappingURL=chunk-SP3FQ3FK.js.map