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
            
            // Store JWT token
            localStorage.setItem("jwtToken", data.token);
            
            // Decode and store user info
            const userInfo = decodeJWT(data.token);
            if (userInfo) {
                console.log("🔍 Decoded JWT user info:", userInfo);
                
                // Store all user data for easy access
                localStorage.setItem("userData", JSON.stringify(userInfo));
                localStorage.setItem("userRole", userInfo.Role?.toString());
                localStorage.setItem("accountId", userInfo.AccountId?.toString());
                localStorage.setItem("email", userInfo.Email || "");
                localStorage.setItem("renterId", userInfo.RenterId?.toString() || "");
                localStorage.setItem("staffId", userInfo.StaffId?.toString() || "");
                localStorage.setItem("stationId", userInfo.StationId?.toString() || "");
                localStorage.setItem("isAdmin", userInfo.IsAdmin?.toString() || "false");
                localStorage.setItem("fullName", userInfo.FullName || "");
                localStorage.setItem("phoneNumber", userInfo.PhoneNumber || "");
            }
            
            console.log("✅ JWT token and user data stored");
            
            // Dispatch custom event to notify components of auth state change
            window.dispatchEvent(new CustomEvent('authStateChanged'));

            // Handle navigation based on role - use the role from decoded JWT
            const role = userInfo?.Role?.toString();
            console.log("🎯 Navigation role:", role);
            
            switch (role) {
                case "EVRenter": // EVRenter
                    navigate("/");
                    break;
                case "Staff": // Staff
                    navigate("/staff");
                    break;
                case "Admin": // Admin
                    navigate("/admin");
                    break;
                default: {
                    console.warn("Unknown role, navigating home:", role);
                    navigate("/");
                    break;
                }
            }
            
            return data;
            
        } catch (err) {
            const errorMessage = err.message || "Login failed. Please check your credentials.";
            setError(errorMessage);
            console.error("❌ Login error:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // In your useAuth hook - REPLACE the decodeJWT function with this:

// Robust JWT decoding function
const decodeJWT = (token) => {
    try {
        if (!token) return null;
        
        // Split the token into parts
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('❌ Invalid JWT token format: expected 3 parts');
            return null;
        }
        
        // Base64Url decode the payload (second part)
        const payload = parts[1];
        
        // Add padding if needed
        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        switch (base64.length % 4) {
            case 2: base64 += '=='; break;
            case 3: base64 += '='; break;
        }
        
        try {
            // Use decodeURIComponent with escape/unescape for proper character handling
            const decodedPayload = atob(base64);
            const utf8Payload = decodeURIComponent(
                decodedPayload.split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')
            );
            
            const userData = JSON.parse(utf8Payload);
            return userData;
            
        } catch (parseError) {
            console.error('❌ Error parsing JWT payload:', parseError);
            
            // Fallback: try direct parsing without URI decoding
            try {
                const decodedPayload = atob(base64);
                const userData = JSON.parse(decodedPayload);
                return userData;
            } catch (fallbackError) {
                console.error('❌ Fallback JWT parsing also failed:', fallbackError);
                return null;
            }
        }
        
    } catch (error) {
        console.error("❌ JWT decoding error:", error);
        return null;
    }
};

    // Logout helper placed before hooks that reference it (memoized)
    const logout = useCallback(() => {
        const itemsToRemove = [
            "jwtToken", "userData", "userRole", "accountId", "email",
            "renterId", "staffId", "stationId", "isAdmin", "fullName", "phoneNumber"
        ];
        itemsToRemove.forEach(item => localStorage.removeItem(item));
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        navigate("/login");
    }, [navigate]);

    // Get current user data - with fallbacks
    const getCurrentUser = useCallback(() => {
        try {
            // First try to get from JWT token
            const token = localStorage.getItem("jwtToken");
            if (token) {
                const userData = decodeJWT(token);
                if (userData) {
                    return {
                        accountId: userData.AccountId,
                        email: userData.Email,
                        role: userData.Role?.toString(), // Ensure role is string
                        renterId: userData.RenterId,
                        staffId: userData.StaffId,
                        stationId: userData.StationId,
                        isAdmin: userData.IsAdmin === "true" || userData.IsAdmin === true,
                        fullName: userData.FullName,
                        phoneNumber: userData.PhoneNumber
                    };
                }
            }
            
            // Fallback to localStorage items
            const userRole = localStorage.getItem("userRole");
            if (userRole) {
                return {
                    accountId: localStorage.getItem("accountId"),
                    email: localStorage.getItem("email"),
                    role: userRole,
                    renterId: localStorage.getItem("renterId"),
                    staffId: localStorage.getItem("staffId"),
                    stationId: localStorage.getItem("stationId"),
                    isAdmin: localStorage.getItem("isAdmin") === "true",
                    fullName: localStorage.getItem("fullName"),
                    phoneNumber: localStorage.getItem("phoneNumber")
                };
            }
            
            return null;
        } catch (error) {
            console.error("❌ Error getting current user:", error);
            return null;
        }
    }, []);

    // Check if user is authenticated
    const isAuthenticated = useCallback(() => {
        try {
            const token = localStorage.getItem("jwtToken");
            if (!token) return false;

            const userData = decodeJWT(token);
            if (!userData) return false;

            // Check token expiration
            const expiration = userData.exp;
            if (expiration) {
                const currentTime = Date.now() / 1000; // Convert to seconds
                if (currentTime >= expiration) {
                    console.log("❌ Token expired");
                    logout();
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error("❌ Authentication check error:", error);
            return false;
        }
    }, [logout]);

    // Get authorization header for API calls
    const getAuthHeader = () => {
        const token = localStorage.getItem("jwtToken");
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    // logout defined above

    // Improved role checking
    const hasRole = (role) => {
        const user = getCurrentUser();
        if (!user || !user.role) return false;
        
        // Convert both to string for comparison
        return user.role.toString() === role.toString();
    };

    return {
        login,
        logout,
        getCurrentUser,
        isAuthenticated,
        getAuthHeader,
        hasRole,
        loading,
        error,
        setError
    };
}