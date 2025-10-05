import { useState, useEffect } from 'react';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const userData = getUserInfo();
        if (userData.role) {
            setUser(userData);
            setIsAuthenticated(true);
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    // Listen for storage changes to update auth state
    useEffect(() => {
        const handleStorageChange = () => {
            const userData = getUserInfo();
            if (userData.role) {
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Also listen for custom events (for same-tab updates)
        window.addEventListener('authStateChanged', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authStateChanged', handleStorageChange);
        };
    }, []);

    const getUserInfo = () => {
        return {
            role: sessionStorage.getItem("userRole"),
            accountId: sessionStorage.getItem("accountId"),
            email: sessionStorage.getItem("userEmail"),
            renterId: sessionStorage.getItem("renterId"),
            staffId: sessionStorage.getItem("staffId"),
            stationId: sessionStorage.getItem("stationId"),
            isAdmin: sessionStorage.getItem("isAdmin") === "true",
            isAuthenticated: !!sessionStorage.getItem("userRole")
        };
    };

    const logout = () => {
        // Clear all session storage
        sessionStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('authStateChanged'));
        window.location.href = "/login";
    };

    return {
        user,
        getUserInfo,
        logout,
        isAuthenticated
    };
};