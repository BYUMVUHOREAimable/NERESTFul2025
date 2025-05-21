import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"; // Adjusted default port
console.log("API Base URL for Vehicles:", API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sessions/cookies if used, good practice for JWT too
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Assuming token is stored in localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Vehicle API Functions ---

// Get all vehicles for the authenticated user (My Vehicles)
export const getAllMyVehicles = async (params = {}) => {
  // Corresponds to `listMyVehicles` in vehicle.controller.js
  const response = await api.get("/vehicles", { params });
  return response.data;
};

// Get vehicle by ID (for the authenticated user)
export const getMyVehicleById = async (id) => {
  // Corresponds to `getMyVehicleById` in vehicle.controller.js
  const response = await api.get(`/vehicles/${id}`);
  return response.data;
};

// Create vehicle for the authenticated user
export const createVehicle = async (vehicleData) => {
  // Corresponds to `addVehicle` in vehicle.controller.js
  const response = await api.post("/vehicles", vehicleData);
  return response.data;
};

// Update vehicle for the authenticated user
export const updateMyVehicle = async (id, vehicleData) => {
  // Corresponds to `updateMyVehicle` in vehicle.controller.js
  const response = await api.put(`/vehicles/${id}`, vehicleData);
  return response.data;
};

// Delete vehicle for the authenticated user
export const deleteMyVehicle = async (id) => {
  // Corresponds to `deleteMyVehicle` in vehicle.controller.js
  const response = await api.delete(`/vehicles/${id}`);
  return response.data;
};

