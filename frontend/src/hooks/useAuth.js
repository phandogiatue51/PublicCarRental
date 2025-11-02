import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { accountAPI } from "../services/api";
import { useToast } from "@chakra-ui/react";

const decodeJWT = (token) => {
    try {
        if (!token) return null;

        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('❌ Invalid JWT token format: expected 3 parts');
            return null;
        }

        const payload = parts[1];

        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        switch (base64.length % 4) {
            case 2: base64 += '=='; break;
            case 3: base64 += '='; break;
        }

        const decodedPayload = atob(base64);
        const userData = JSON.parse(decodedPayload);

        return userData;

    } catch (error) {
        console.error("❌ JWT decoding error:", error);
        return null;
    }
};

export function useAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const toast = useToast();

    const login = async (identifier, password) => {
        setError("");
        setLoading(true);

        try {
            const data = await accountAPI.login({
                Identifier: identifier,
                Password: password
            });

            console.log('✅ Login successful:', data);

            localStorage.setItem("jwtToken", data.token);

            const userInfo = decodeJWT(data.token);
            let role = null;

            if (userInfo) {
                console.log("🔍 Decoded JWT user info:", userInfo);

                localStorage.setItem("userData", JSON.stringify(userInfo));
                localStorage.setItem("userRole", userInfo.Role?.toString());
                localStorage.setItem("accountId", userInfo.AccountId?.toString());
                localStorage.setItem("email", userInfo.Email || "");
                localStorage.setItem("fullName", data.fullName || "");

                localStorage.setItem("renterId", userInfo.RenterId?.toString() || "");
                localStorage.setItem("staffId", userInfo.StaffId?.toString() || "");
                localStorage.setItem("stationId", userInfo.StationId?.toString() || "");
                localStorage.setItem("isAdmin", userInfo.IsAdmin?.toString() || "false");
                role = userInfo.Role?.toString();
            }

            console.log("✅ JWT token and user data stored");

            toast({
                title: "Login Successful!",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top"
            });

            window.dispatchEvent(new CustomEvent('authStateChanged'));

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

            let displayMessage = "Login failed. Please check your credentials.";
            try {
                const errorJsonString = err.message.match(/\{.*\}/);
                if (errorJsonString) {
                    const errorObj = JSON.parse(errorJsonString[0]);
                    displayMessage = errorObj.message || displayMessage;
                }
            } catch (e) { /* silent fail */ }

            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = useCallback(() => {
        const itemsToRemove = [
            "jwtToken", "userData", "userRole", "accountId", "email",
            "renterId", "staffId", "stationId", "isAdmin", "fullName", "phoneNumber"
        ];
        itemsToRemove.forEach(item => localStorage.removeItem(item));

        toast({
            title: "Logged out successfully!",
            status: "info",
            duration: 3000,
            isClosable: true,
            position: "top",
        });

        window.dispatchEvent(new CustomEvent('authStateChanged'));
        setTimeout(() => {
            navigate("/login");
        }, 1000);
    }, [navigate, toast]);

    // Get current user data - with fallbacks
    const getCurrentUser = useCallback(() => {
        try {
            const token = localStorage.getItem("jwtToken");
            if (token) {
                const userData = decodeJWT(token);
                if (userData) {
                    return {
                        accountId: userData.AccountId,
                        email: userData.Email,
                        role: userData.Role?.toString(),
                        renterId: userData.RenterId,
                        staffId: userData.StaffId,
                        stationId: userData.StationId,
                        isAdmin: userData.IsAdmin === "true" || userData.IsAdmin === true,
                        fullName: localStorage.getItem("fullName"),
                        phoneNumber: ""
                    };
                }
            }

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
                    phoneNumber: localStorage.getItem("phoneNumber") || ""
                };
            }

            return null;
        } catch (error) {
            console.error("❌ Error getting current user:", error);
            return null;
        }
    }, []);

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