import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"; // Ensure this matches
console.log("API Base URL for Vehicle Entries:", API_URL);

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Vehicle Entry API Functions ---

/**
 * (Attendant/Admin) Records a new vehicle entry.
 * @param {object} entryData - { plate_number: string, parking_id: string (UUID) }
 */
export const recordVehicleEntryApi = async (entryData) => {
    const response = await api.post("/vehicle-entries/enter", entryData);
    return response.data; // Expects { message, vehicleEntry, ticketDownloadUrl }
};


export const getParkingFacilitiesForSelection = async (params = {}) => {

    const response = await api.get("/admin/parkings", { params: { ...params, limit: 200 } }); // Get enough for a select
    return response.data;
};


/**
 * (Attendant/Admin) Records a vehicle exit.
 * @param {string} vehicleEntryId - The UUID of the vehicle entry record.
 */
export const recordVehicleExitApi = async (vehicleEntryId) => {
    const response = await api.post(`/vehicle-entries/${vehicleEntryId}/exit`); // POST request
    return response.data; // Expects { message, vehicleEntry, billDownloadUrl, parkingStatus }
};

/**
 * (Attendant/Admin) Lists currently parked vehicles.
 * @param {object} params - Query parameters
 */
export const getCurrentlyParkedVehicles = async (params = {}) => {
    const response = await api.get("/vehicle-entries", { params: { ...params, status: "PARKED" } }); // Assuming list endpoint can filter by status
    return response.data;
}



export const listVehicleEntriesApi = async (params = {}) => {
    const response = await api.get("/vehicle-entries", { params });
    return response.data;
};

