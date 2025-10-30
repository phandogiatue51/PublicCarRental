import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "@chakra-ui/react";
import { Spinner, Center, Text } from "@chakra-ui/react";

const StaffRoute = ({ children }) => {
    const { getCurrentUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [isChecking, setIsChecking] = useState(true);
    const [accessGranted, setAccessGranted] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            setIsChecking(true);
            setAccessGranted(false);
            
            const authenticated = isAuthenticated();
            
            if (!authenticated) {
                toast({
                    title: "Access Denied",
                    description: "Please log in to access staff portal",
                    status: "error",
                    duration: 5000,
                    position: "bottom-right",
                });
                navigate('/login', { replace: true });
                return;
            }

            const userData = getCurrentUser();
            const isStaff = userData?.role === "Staff";
            
            if (!isStaff) {
                toast({
                    title: "Access Denied",
                    description: "You don't have permission to access staff portal",
                    status: "error",
                    duration: 5000,
                    position: "bottom-right",
                });
                navigate('/', { replace: true });
                return;
            }
            
            setAccessGranted(true);
            setIsChecking(false);
        };

        checkAuth();
    }, [isAuthenticated, getCurrentUser, navigate, toast]);

    if (isChecking) {
        return (
            <Center h="100vh" flexDirection="column">
                <Spinner size="xl" />
                <Text mt={4}>Checking staff permissions...</Text>
            </Center>
        );
    }

    return accessGranted ? children : null;
};

export default StaffRoute;