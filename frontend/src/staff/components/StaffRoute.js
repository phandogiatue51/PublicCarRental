import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "@chakra-ui/react"; // ADD THIS

const StaffRoute = ({ children }) => {
    const { getCurrentUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        if (!isAuthenticated()) {
            toast({
                title: "Access Denied",
                description: "Please log in to access staff portal",
                status: "error",
                duration: 5000,
            });
            navigate('/login', { replace: true });
            return;
        }

        const userData = getCurrentUser();
        const isStaff = userData?.role === "Staff" || userData?.role === 1;

        if (!isStaff) {
            toast({
                title: "Access Denied",
                description: "You don't have permission to access staff portal",
                status: "error",
                duration: 5000,
            });
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, getCurrentUser, navigate, toast]);

    const userData = getCurrentUser();
    const isStaff = userData?.role === "Staff" || userData?.role === 1;
    
    return isAuthenticated() && isStaff ? children : null;
};

export default StaffRoute;