"use client"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../context/auth-context"
import { Loader } from "../components/ui/loader"

export const ProtectedRoute = ({ requiredPermission }) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <Loader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
