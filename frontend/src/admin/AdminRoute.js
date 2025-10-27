import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@chakra-ui/react";
import { Spinner, Center, Text } from "@chakra-ui/react";

const AdminRoute = ({ children }) => {
    const { getCurrentUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [isChecking, setIsChecking] = useState(true);
    const [accessGranted, setAccessGranted] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            console.log("🔍 AdminRoute - Checking authentication...");
            setIsChecking(true);
            setAccessGranted(false);
            
            const authenticated = isAuthenticated();
            console.log("🔍 AdminRoute - isAuthenticated:", authenticated);
            
            if (!authenticated) {
                console.log("❌ AdminRoute - Not authenticated, redirecting to login");
                toast({
                    title: "Access Denied",
                    description: "Please log in to access admin portal",
                    status: "error",
                    duration: 5000,
                    position: "top-right",
                });
                navigate('/login', { replace: true });
                return;
            }

            const userData = getCurrentUser();
            console.log("🔍 AdminRoute - User Data:", userData);
            
            // CONSISTENT role check - use the same logic everywhere
            const isAdmin = userData?.role === "Admin";
            console.log("🔍 AdminRoute - Is Admin:", isAdmin, "Role:", userData?.role);
            
            if (!isAdmin) {
                console.log("❌ AdminRoute - Not admin, redirecting to home");
                toast({
                    title: "Access Denied",
                    description: "You don't have permission to access admin portal",
                    status: "error",
                    duration: 5000,
                    position: "top-right",
                });
                navigate('/', { replace: true });
                return;
            }
            
            console.log("✅ AdminRoute - Authentication successful, granting access");
            setAccessGranted(true);
            setIsChecking(false);
        };

        checkAuth();
    }, [isAuthenticated, getCurrentUser, navigate, toast]);

    if (isChecking) {
        return (
            <Center h="100vh" flexDirection="column">
                <Spinner size="xl" />
                <Text mt={4}>Checking admin permissions...</Text>
            </Center>
        );
    }

    console.log("🎯 AdminRoute - Final render check:", { 
        accessGranted, 
        isChecking,
        userData: getCurrentUser() 
    });

    return accessGranted ? children : null;
};

export default AdminRoute;