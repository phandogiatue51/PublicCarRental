 import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { accountAPI } from "../services/api";

export function useAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const login = async (identifier, password) => {
        setError("");
        setLoading(true);

        try {
            const data = await accountAPI.login({
                Identifier: identifier,
                Password: password
            });
            
            console.log('✅ Login successful:', data);
            
            // Store JWT token and basic user info for compatibility
            localStorage.setItem("jwtToken", data.token);
            
            // Store user info for backward compatibility with existing components
            const userInfo = decodeJWT(data.token);
            if (userInfo) {
                localStorage.setItem("userRole", userInfo.Role);
                localStorage.setItem("accountId", userInfo.AccountId);
                localStorage.setItem("email", userInfo.Email);
                localStorage.setItem("renterId", userInfo.RenterId || "");
                localStorage.setItem("staffId", userInfo.StaffId || "");
                localStorage.setItem("stationId", userInfo.StationId || "");
                localStorage.setItem("isAdmin", userInfo.IsAdmin || "false");
                localStorage.setItem("fullName", userInfo.FullName || "");
                localStorage.setItem("phoneNumber", userInfo.PhoneNumber || "");
            }
            
            console.log("✅ JWT token and user data stored");
            
            // Dispatch custom event to notify components of auth state change
            window.dispatchEvent(new CustomEvent('authStateChanged'));

            // Handle navigation based on role
            switch (data.role.toString()) {
                case "0": // EVRenter
                    navigate("/");
                    break;
                case "1": // Staff
                    navigate("/staff");
                    break;
                case "2": // Admin
                    navigate("/admin");
                    break;
                default:
                    navigate("/");
                    break;
            }
            
            return data;
            
        } catch (err) {
            const errorMessage = err.message || "Login failed. Please check your credentials.";
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Get current user data by decoding JWT token
    const getCurrentUser = useCallback(() => {
        const token = localStorage.getItem("jwtToken");
        if (!token) return null;
        
        try {
            const userData = decodeJWT(token);
            return {
            
                accountId: userData.AccountId,
                email: userData.Email,
                role: userData.Role,
                renterId: userData.RenterId,
                staffId: userData.StaffId,
                stationId: userData.StationId,
                isAdmin: userData.IsAdmin === "true"
            };
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    }, []);

    // Simple JWT decoding
    const decodeJWT = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error("Error decoding JWT:", error);
            throw new Error("Invalid token");
        }
    };

    // Check if user is authenticated
    const isAuthenticated = useCallback(() => {
        const token = localStorage.getItem("jwtToken");
        if (!token) return false;

        try {
            const userData = decodeJWT(token);
            // Optional: Check token expiration
            const expiration = userData.exp;
            if (expiration && Date.now() >= expiration * 1000) {
                // Clear expired token
                localStorage.removeItem("jwtToken");
                window.dispatchEvent(new CustomEvent('authStateChanged'));
                return false;
            }
            return true;
        } catch (error) {
            // Clear invalid token
            localStorage.removeItem("jwtToken");
            return false;
        }
    }, []);

    // Get authorization header for API calls
    const getAuthHeader = () => {
        const token = localStorage.getItem("jwtToken");
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const logout = () => {
        // Clear all auth-related data
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("accountId");
        localStorage.removeItem("email");
        localStorage.removeItem("renterId");
        localStorage.removeItem("staffId");
        localStorage.removeItem("stationId");
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("fullName");
        localStorage.removeItem("phoneNumber");
        
        // Dispatch custom event to notify components of auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        navigate("/login");
    };

    // Check if user has specific role
    const hasRole = (role) => {
        const user = getCurrentUser();
        return user && user.role === role.toString();
    };

    return {
        login,        logout,        getCurrentUser,        isAuthenticated,        getAuthHeader,        hasRole,        loading,        error,        setError
    };
}