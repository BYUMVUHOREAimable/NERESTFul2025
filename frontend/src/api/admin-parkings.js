import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
console.log("API Base URL for Admin Parkings:", API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Admin Parking Facility API Functions ---

export const adminGetAllParkings = async (params = {}) => {
  const response = await api.get("/admin/parkings", { params }); // Endpoint from parking.routes.js
  return response.data;
};

export const adminGetParkingById = async (parkingId) => {
  const response = await api.get(`/admin/parkings/${parkingId}`);
  return response.data;
};

export const adminCreateParking = async (parkingData) => {
  const response = await api.post("/admin/parkings", parkingData);
  return response.data;
};

export const adminUpdateParking = async (parkingId, parkingData) => {
  const response = await api.put(`/admin/parkings/${parkingId}`, parkingData);
  return response.data;
};

export const adminDeleteParking = async (parkingId) => {
  const response = await api.delete(`/admin/parkings/${parkingId}`);
  return response.data;
};