// API URL
export const API_URL = process.env.VITE_API_URL || "http://localhost:5000/api";

// App configuration
export const APP_CONFIG = {
  appName: "Inventory Management System",
  appVersion: "1.0.0",
  appDescription: "A comprehensive inventory management system",
  appAuthor: "Your Company",
  appWebsite: "https://yourcompany.com",
};

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  itemsPerPage: 10,
  maxPagesToShow: 5,
};

// Date format options
export const DATE_FORMAT_OPTIONS = {
  short: { year: "numeric", month: "short", day: "numeric" },
  long: { year: "numeric", month: "long", day: "numeric" },
  time: { hour: "2-digit", minute: "2-digit" },
  dateTime: {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
};
