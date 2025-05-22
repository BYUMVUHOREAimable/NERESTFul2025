// Configuration file for the XYZ LTD Parking Management System
export const API_URL = process.env.VITE_API_URL || "http://localhost:5000/api";

// API URL for file uploads
export const APP_CONFIG = {
  appName: "XYZ LTD Parking Management System",
  appVersion: "1.0.0",
  appDescription: "A comprehensive Parking management system",
  appAuthor: "XYZ LTD Company",
  appWebsite: "https://XYZLTD.com",
};

// Default values for pagination
export const PAGINATION_DEFAULTS = {
  itemsPerPage: 10,
  maxPagesToShow: 5,
};


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
