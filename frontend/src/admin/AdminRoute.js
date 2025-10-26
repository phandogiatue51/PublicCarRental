import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@chakra-ui/react"; 

const AdminRoute = ({ children }) => {
    const { getCurrentUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast(); 

    useEffect(() => {
        if (!isAuthenticated()) {
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
        const isAdmin = userData?.role === "Admin" || userData?.role === 2;

        if (!isAdmin) {
            toast({
                title: "Access Denied",
                description: "You don't have permission to access admin portal",
                status: "error",
                duration: 5000,
                position: "top-right",
            });
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, getCurrentUser, navigate, toast]);

    const userData = getCurrentUser();
    const isAdmin = userData?.role === "Admin" || userData?.role === 2;
    
    return isAuthenticated() && isAdmin ? children : null;
};

export default AdminRoute;