import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Icon, Button, useColorModeValue, useToast, Spinner } from '@chakra-ui/react';
import {
    MdDashboard, MdPerson, MdDriveEta, MdAssignment, MdReceipt, MdMenu, MdLogout, MdHome
} from 'react-icons/md';
import signalRService from '../../services/signalRService';

const StaffLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();

    // All hooks must be called at the top level
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'white');
    const pageBgColor = useColorModeValue('gray.50', 'gray.900');
    const loadingTextColor = useColorModeValue('gray.600', 'white');

    // Authentication check - TEMPORARILY DISABLED FOR TESTING
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('jwtToken');
            const userRole = localStorage.getItem('userRole');
            const staffId = localStorage.getItem('staffId');
            
            console.log('Staff Auth Check:', { token: !!token, userRole, staffId });
            
            // TEMPORARILY DISABLE AUTH FOR TESTING
            // TODO: Re-enable authentication in production
            console.log('⚠️ Authentication temporarily disabled for testing');
            setIsAuthenticated(true);
            setIsCheckingAuth(false);
            
            // Original auth check (commented out for testing)
     
        };

        checkAuth();
    }, [navigate, toast]);

    useEffect(() => {
        if (!isAuthenticated) return;

        signalRService.startConnection();

        const handleNotification = (notification) => {
            console.log('Staff received notification:', notification);

            if (notification?.type === 'NewBooking') {
                toast({
                    title: "🎉 New Booking!",
                    description: notification.message || `New booking received (ID: ${notification.bookingId})`,
                    status: "success",
                    duration: 6000,
                    isClosable: true,
                    position: "top-right"
                });
            }

            if (notification?.type === 'BookingConfirmed') {
                toast({
                    title: "✅ Booking Confirmed",
                    description: notification.message || "A booking has been confirmed",
                    status: "info",
                    duration: 6000,
                    isClosable: true,
                    position: "top-right"
                });
            }
        };

        signalRService.registerNotificationHandler(handleNotification);

        return () => {
            signalRService.unregisterNotificationHandler(handleNotification);
            signalRService.stopConnection();
        };
    }, [toast, isAuthenticated]);

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
        { path: '/renters', label: 'Renters', icon: MdPerson },
        { path: '/vehicles', label: 'Vehicles', icon: MdDriveEta },
        { path: '/contracts', label: 'Contracts', icon: MdAssignment },
        { path: '/invoices', label: 'Invoices', icon: MdReceipt },
        { path: '/models', label: 'Models', icon: MdDriveEta }
    ];

    const isActive = (path) => {
        return location.pathname === `/staff${path}`;
    };

    const handleNavigation = (path) => {
        navigate(`/staff${path}`);
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    const handleLogout = () => {
        // Clear all auth-related data from localStorage
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("accountId");
        localStorage.removeItem("fullName");
        localStorage.removeItem("email");
        localStorage.removeItem("staffId");
        localStorage.removeItem("stationId");
        localStorage.removeItem("renterId");
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("phoneNumber");

        // Dispatch custom event to notify components of auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));

        navigate('/');
    };

    // Show loading spinner while checking authentication
    if (isCheckingAuth) {
        return (
            <Box minH="100vh" bg={pageBgColor} display="flex" alignItems="center" justifyContent="center">
                <Flex direction="column" align="center" gap={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text color={loadingTextColor}>Checking authentication...</Text>
                </Flex>
            </Box>
        );
    }

    // Don't render if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <Box minH="100vh" bg={pageBgColor} display="flex" flexDirection="column">

            <Flex flex="1" overflow="hidden">
                {/* Sidebar */}
                <Box
                    w={{ base: sidebarOpen ? '250px' : '0', md: '250px' }}
                    bg={bgColor}
                    borderRight="1px"
                    borderColor={borderColor}
                    transition="width 0.3s"
                    overflow="hidden"
                    position={{ base: 'fixed', md: 'relative' }}
                    zIndex={{ base: 1000, md: 'auto' }}
                    display="flex"
                    flexDirection="column"
                >
                    <Box p={4} flex="1">
                        <Text fontSize="xl" fontWeight="bold" color={textColor} mb={8}>
                            Staff Portal
                        </Text>

                        <Box>
                            {menuItems.map((item) => (
                                <Button
                                    key={item.path}
                                    w="100%"
                                    justifyContent="flex-start"
                                    leftIcon={<Icon as={item.icon} />}
                                    variant={isActive(item.path) ? 'solid' : 'ghost'}
                                    colorScheme={isActive(item.path) ? 'blue' : 'gray'}
                                    mb={2}
                                    onClick={() => handleNavigation(item.path)}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Box>

                        <Box mt={8}>
                            <Button
                                w="100%"
                                leftIcon={<Icon as={MdHome} />}
                                colorScheme="green"
                                variant="ghost"
                                onClick={handleBackToHome}
                                mb={2}
                            >
                                Back to Home
                            </Button>

                            <Button
                                w="100%"
                                leftIcon={<Icon as={MdLogout} />}
                                colorScheme="red"
                                variant="ghost"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Main Content Area */}
                <Box
                    flex="1"
                    display="flex"
                    flexDirection="column"
                    minH="100vh"
                    ml={{ base: 0, md: 0 }}
                >
                    {/* Header */}
                    <Box
                        bg={bgColor}
                        borderBottom="1px"
                        borderColor={borderColor}
                        p={4}
                        display={{ base: 'flex', md: 'none' }}
                        justifyContent="space-between"
                        alignItems="center"
                        flexShrink={0}
                    >
                        <Button
                            variant="ghost"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <Icon as={MdMenu} />
                        </Button>
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            Staff Portal
                        </Text>
                    </Box>

                    {/* Page Content */}
                    <Box
                        p={6}
                        flex="1"
                        display="flex"
                        flexDirection="column"
                        overflow="auto"
                    >
                        <Outlet />
                    </Box>
                </Box>
            </Flex>
        </Box>
    );
};

export default StaffLayout;