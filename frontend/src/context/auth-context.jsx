import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser as fetchCurrentUser } from '../api/auth'; // API to get current user

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token')); // Initialize token from localStorage
  const [isLoading, setIsLoading] = useState(true); // To handle initial auth check

  const login = useCallback((userData, authToken) => {
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData); // userData from backend now includes firstName, lastName, role, permissions
    // console.log("AuthContext: User logged in", userData);
  }, []);

  const logout = useCallback(() => {
    // Call backend logout if you have one to invalidate refresh tokens (not applicable here)
    // For stateless JWT, just clear client-side
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // console.log("AuthContext: User logged out");
    // Optionally, could redirect here, but usually handled by components or ProtectedRoute
  }, []);

  // Check authentication status on initial load and when token changes
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        setIsLoading(true);
        try {
          // Fetch current user details using the token
          // The backend /auth/me should return { id, firstName, lastName, email, role, permissions }
          const currentUserData = await fetchCurrentUser(); // This API call uses the token from interceptor
          setUser(currentUserData);
          // console.log("AuthContext: User verified", currentUserData);
        } catch (error) {
          console.error("AuthContext: Failed to verify token, logging out", error);
          // Token might be invalid or expired
          logout(); // Clear invalid token and user state
        } finally {
          setIsLoading(false);
        }
      } else {
        setUser(null); // No token, so no user
        setIsLoading(false);
      }
    };
    verifyUser();
  }, [token, logout]); // Rerun if token changes

  const isAuthenticated = !!user && !!token; // User is authenticated if both user object and token exist

  const value = {
    user,         // Contains { id, firstName, lastName, email, role, permissions }
    token,
    isAuthenticated,
    isLoadingAuth: isLoading, // Renamed for clarity
    login,
    logout,
    // You can add a function to refetch user data if needed:
    // refreshUser: async () => {
    //   if (token) {
    //     try {
    //       const currentUserData = await fetchCurrentUser();
    //       setUser(currentUserData);
    //     } catch (error) { logout(); }
    //   }
    // }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};