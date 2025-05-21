import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
console.log("API Base URL for Reports:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Report API Functions ---

/**
 * Fetches the Exited Vehicles Report
 * @param {object} params - { startDate, endDate, page, limit, sortBy, order, parkingId }
 */
export const getExitedVehiclesReportApi = async (params = {}) => {
  const response = await api.get("/admin/reports/exited-vehicles", { params });
  return response.data; // Expects { data: [...], summary: {...}, pagination: {...} }
};

/**
 * Fetches the Entered Vehicles Report
 * @param {object} params - { startDate, endDate, page, limit, sortBy, order, parkingId }
 */
export const getEnteredVehiclesReportApi = async (params = {}) => {
  const response = await api.get("/admin/reports/entered-vehicles", { params });
  return response.data; // Expects { data: [...], summary: {...}, pagination: {...} }
};

// You might still need to fetch parkings for a filter dropdown
export const getParkingFacilitiesForFilter = async () => {
  const response = await api.get("/admin/parkings/selectable", { params: { limit: 200, sortBy: 'code' } }); // Use selectable endpoint
  return response.data?.data || []; // Assuming it returns { data: [...] }
};