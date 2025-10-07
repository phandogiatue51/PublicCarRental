import { useState } from "react";
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
            
            // Store ONLY the JWT token - that's all we need
            localStorage.setItem("jwtToken", data.token);
            
            console.log("✅ JWT token stored, user data available from token");

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
    const getCurrentUser = () => {
        const token = localStorage.getItem("jwtToken");
        if (!token) return null;
        
        try {
            const userData = decodeJWT(token);
            return {
                accountId: userData.AccountId,
                email: userData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
                role: userData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"],
                renterId: userData.RenterId,
                staffId: userData.StaffId,
                stationId: userData.StationId,
                isAdmin: userData.IsAdmin === "true"
            };
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    };

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
    const isAuthenticated = () => {
        const token = localStorage.getItem("jwtToken");
        if (!token) return false;

        try {
            const userData = decodeJWT(token);
            // Optional: Check token expiration
            const expiration = userData.exp;
            if (expiration && Date.now() >= expiration * 1000) {
                logout();
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    };

    // Get authorization header for API calls
    const getAuthHeader = () => {
        const token = localStorage.getItem("jwtToken");
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const logout = () => {
        // Clear ONLY the token
        localStorage.removeItem("jwtToken");
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