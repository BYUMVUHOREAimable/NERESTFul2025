import { DATE_FORMAT_OPTIONS } from "../config";

/**
 * Format a date string using Intl.DateTimeFormat
 * @param {string|Date} dateString - The date to format
 * @param {string} format - The format to use (short, long, time, dateTime)
 * @returns {string} The formatted date string
 */
export const formatDate = (dateString, format = "short") => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const options = DATE_FORMAT_OPTIONS[format] || DATE_FORMAT_OPTIONS.short;
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

/**
 * Get relative time (e.g., "2 hours ago", "yesterday")
 * @param {string|Date} dateString - The date to format
 * @returns {string} The relative time string
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return rtf.format(-Math.floor(diffInSeconds), "second");
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, "minute");
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, "hour");
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return rtf.format(-diffInDays, "day");
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, "month");
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return rtf.format(-diffInYears, "year");
};
