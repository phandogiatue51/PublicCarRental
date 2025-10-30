import React, { useState, useEffect } from 'react';
import {
    Box, Grid, GridItem, Card, CardBody, Text, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Icon,
    Flex, useColorModeValue, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import {
    MdPerson, MdDriveEta, MdAssignment, MdReceipt
} from 'react-icons/md';
import { renterAPI, vehicleAPI, contractAPI, invoiceAPI } from '../../services/api';
import IncomingCheckins from '../components/Dashboard/IncomingCheckins';
import IncomingCheckouts from '../components/Dashboard/IncomingCheckouts';
import MaintenanceQueue from '../components/Dashboard/MaintenanceQueue';
import LowBatteryVehicles from '../components/Dashboard/LowBatteryVehicles';
import AvailableVehicles from '../components/Dashboard/AvailableVehicles';
import CheckinsCheckoutsByDay from '../components/Dashboard/Charts/CheckinsCheckoutsByDay';
import AvailableByModelBar from '../components/Dashboard/Charts/AvailableByModelBar';

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
    const [stationId, setStationId] = useState(null);

    const textColor = useColorModeValue('gray.600', 'white');
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        // Get stationId from localStorage
        const storedStationId = localStorage.getItem('stationId');
        console.log('StaffDashboard - StationId from localStorage:', storedStationId);
        
        if (storedStationId) {
            setStationId(parseInt(storedStationId));
        } else {
            setError('No station assigned. Please contact administrator.');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (stationId) {
            fetchDashboardData();
        }
    }, [stationId]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching dashboard data for stationId:', stationId);

            // Fetch data filtered by stationId
            const [vehicles, contracts, invoices] = await Promise.all([
                vehicleAPI.filter({ stationId }), // Filter vehicles by station
                contractAPI.filter({ stationId }), // Filter contracts by station
                invoiceAPI.getByStation(stationId) // Get invoices by station
            ]);

            console.log('Dashboard data:', { vehicles, contracts, invoices });

            // Calculate stats
            const activeContracts = contracts?.filter(contract => 
                contract.status === 'Active' || contract.status === 0
            ) || [];
            
            const availableVehicles = vehicles?.filter(vehicle => 
                vehicle.status === 'Available' || vehicle.status === 0
            ) || [];

            // Get renters from contracts (unique)
            const uniqueRenterIds = new Set(contracts?.map(c => c.renterId) || []);

            setStats({
                totalRenters: uniqueRenterIds.size,
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
                Staff Dashboard {stationId && `(Station ${stationId})`}
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
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                    <GridItem>
                        <CheckinsCheckoutsByDay stationId={stationId} days={7} count={200} />
                    </GridItem>
                    <GridItem>
                        <AvailableByModelBar stationId={stationId} top={8} />
                    </GridItem>
                </Grid>
            </Box>

            <Box mt={8}>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                    <GridItem>
                        <IncomingCheckins stationId={stationId} count={5} />
                    </GridItem>
                    <GridItem>
                        <IncomingCheckouts stationId={stationId} count={5} />
                    </GridItem>
                    <GridItem>
                        <MaintenanceQueue stationId={stationId} />
                    </GridItem>
                    <GridItem>
                        <LowBatteryVehicles stationId={stationId} />
                    </GridItem>
                    <GridItem colSpan={{ base: 1, md: 2 }}>
                        <AvailableVehicles stationId={stationId} />
                    </GridItem>
                </Grid>
            </Box>

            
        </Box>
    );
};

export default StaffDashboard;
