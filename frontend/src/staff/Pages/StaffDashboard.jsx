import React, { useState, useEffect } from 'react';
import {
    Box,    Grid,    GridItem,    Card,    CardBody,    Text,    Stat,    StatLabel,    StatNumber,    StatHelpText,    StatArrow,    Icon,
    Flex,    useColorModeValue,    Spinner,    Alert,    AlertIcon,    AlertTitle,    AlertDescription
} from '@chakra-ui/react';
import {
    MdPerson,    MdDriveEta,    MdAssignment,
    MdReceipt} from 'react-icons/md';
import { renterAPI, vehicleAPI, contractAPI, invoiceAPI } from '../../services/api';

const StaffDashboard = () => {
    const [stats, setStats] = useState({
        totalRenters: 0,
        totalVehicles: 0,
        totalContracts: 0,
        totalInvoices: 0,
        activeContracts: 0,
        availableVehicles: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const textColor = useColorModeValue('gray.600', 'white');
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [renters, vehicles, contracts, invoices] = await Promise.all([
                renterAPI.getAll(),
                vehicleAPI.getAll(),
                contractAPI.getAll(),
                invoiceAPI.getAll()
            ]);

            const activeContracts = contracts?.filter(contract => contract.status === 0) || [];
            const availableVehicles = vehicles?.filter(vehicle => vehicle.status === 0) || [];

            setStats({
                totalRenters: renters?.length || 0,
                totalVehicles: vehicles?.length || 0,
                totalContracts: contracts?.length || 0,
                totalInvoices: invoices?.length || 0,
                activeContracts: activeContracts.length,
                availableVehicles: availableVehicles.length
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, trend, trendValue, color = 'blue' }) => (
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
                <Flex align="center" justify="space-between">
                    <Box>
                        <Stat>
                            <StatLabel color={textColor} fontSize="sm" fontWeight="medium">
                                {title}
                            </StatLabel>
                            <StatNumber color={textColor} fontSize="2xl" fontWeight="bold">
                                {value}
                            </StatNumber>
                            {trend && (
                                <StatHelpText>
                                    <StatArrow type={trend === 'up' ? 'increase' : 'decrease'} />
                                    {trendValue}
                                </StatHelpText>
                            )}
                        </Stat>
                    </Box>
                    <Icon as={icon} boxSize={8} color={`${color}.500`} />
                </Flex>
            </CardBody>
        </Card>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
                <Spinner size="xl" color="blue.500" />
                <Text ml={4} color={textColor}>Loading dashboard...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status="error">
                <AlertIcon />
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <Box>
            <Text fontSize="2xl" fontWeight="bold" color={textColor} mb={6}>
                Staff Dashboard
            </Text>

            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                <GridItem>
                    <StatCard
                        title="Total Renters"
                        value={stats.totalRenters}
                        icon={MdPerson}
                        color="green"
                    />
                </GridItem>

                <GridItem>
                    <StatCard
                        title="Total Vehicles"
                        value={stats.totalVehicles}
                        icon={MdDriveEta}
                        color="blue"
                    />
                </GridItem>

                <GridItem>
                    <StatCard
                        title="Total Contracts"
                        value={stats.totalContracts}
                        icon={MdAssignment}
                        color="purple"
                    />
                </GridItem>

                <GridItem>
                    <StatCard
                        title="Total Invoices"
                        value={stats.totalInvoices}
                        icon={MdReceipt}
                        color="orange"
                    />
                </GridItem>

                <GridItem>
                    <StatCard
                        title="Active Contracts"
                        value={stats.activeContracts}
                        icon={MdAssignment}
                        color="green"
                    />
                </GridItem>

                <GridItem>
                    <StatCard
                        title="Available Vehicles"
                        value={stats.availableVehicles}
                        icon={MdDriveEta}
                        color="teal"
                    />
                </GridItem>
            </Grid>

            <Box mt={8}>
                <Card bg={cardBg} border="1px" borderColor={borderColor}>
                    <CardBody>
                        <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
                            Quick Actions
                        </Text>
                        <Text color={textColor} fontSize="sm">
                            Use the navigation menu to view detailed information about renters, vehicles, contracts, and invoices.
                            All data is read-only for staff members.
                        </Text>
                    </CardBody>
                </Card>
            </Box>
        </Box>
    );
};

export default StaffDashboard;
