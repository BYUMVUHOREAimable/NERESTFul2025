import axios from "axios"

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";
console.log("API Base URL:", API_URL);

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Get all users with optional filters
export const getAllUsers = async ({ search, role, sortBy, order } = {}) => {
  const params = new URLSearchParams()
  if (search) params.append("search", search)
  if (role) params.append("role", role)
  if (sortBy) params.append("sortBy", sortBy)
  if (order) params.append("order", order)

  const response = await api.get(`/admin/users?${params.toString()}`)
  return response.data
}

// Get user by ID
export const getUserById = async (id) => {
  const response = await api.get(`/admin/users/${id}`)
  return response.data
}

// Create user
export const createUser = async (userData) => {
  const response = await api.post("/admin/users", userData)
  return response.data
}

// Update user
export const updateUser = async ({ id, ...userData }) => {
  const response = await api.put(`/admin/users/${id}`, userData)
  return response.data
}

// Delete user
export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`)
  return response.data
}

// Update user role
export const updateUserRole = async ({ id, roleName }) => {
  const response = await api.put(`/admin/users/${id}`, { roleName })
  return response.data
}

// Get all roles
export const getAllRoles = async () => {
  const response = await api.get("/admin/roles")
  return response.data
}

// Get all permissions
export const getAllPermissions = async () => {
  const response = await api.get("/admin/permissions")
  return response.data
}
