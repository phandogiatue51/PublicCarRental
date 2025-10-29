import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Button, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr, Spinner, Alert,
    AlertIcon, AlertTitle, AlertDescription, Badge, useToast, Progress, HStack
} from '@chakra-ui/react';
import {
    createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable
} from '@tanstack/react-table';
import { MdRefresh } from 'react-icons/md';
import { vehicleAPI, modelAPI, brandAPI, typeAPI, stationAPI } from '../../../services/api';

// Import components
import VehicleActions from './VehicleActions';
import VehicleUpdateModal from './VehicleUpdateModal';
import VehicleAccidentModal from './../AccidentReport/VehicleAccidentModal';
import FilterBar from './FilterBar';
import Pagination from '../../../components/Pagination';
const columnHelper = createColumnHelper();

const VehicleList = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sorting, setSorting] = useState([]);

    // Modal states
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isAccidentModalOpen, setIsAccidentModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    // Add to your existing state
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const [availableVehicles, setAvailableVehicles] = useState([]);
    // Filters
    const [filter, setFilter] = useState({ modelId: '', typeId: '', brandId: '', stationId: '', status: '' });
    const [models, setModels] = useState([]);
    const [brands, setBrands] = useState([]);
    const [types, setTypes] = useState([]);
    const [stations, setStations] = useState([]);

    const toast = useToast();

    const presetStationId = (typeof window !== 'undefined') ? (localStorage.getItem('stationId') || sessionStorage.getItem('stationId')) : '';

    // Add this function
    const checkAvailableVehicles = async () => {
        try {
            setLoading(true);

            // Use presetStationId from localStorage, fallback to 0
            const stationId = presetStationId ? Number(presetStationId) : 0;

            // Convert date strings to ISO format
            const startTimeISO = startTime ? new Date(startTime).toISOString() : new Date().toISOString();
            const endTimeISO = endTime ? new Date(endTime).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Default to 24 hours from now

            const response = await vehicleAPI.getAvaiable(stationId, startTimeISO, endTimeISO);

            setAvailableVehicles(Array.isArray(response) ? response : []);
            setShowAvailableOnly(true);

            toast({
                title: 'Success',
                description: `Found ${response?.length || 0} available vehicles`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to check available vehicles',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleShowAllVehicles = useCallback(() => {
        setShowAvailableOnly(false);
        fetchVehicles();
    }, []);

    useEffect(() => {
        if (filter.brandId) {
            // If brand is selected, filter models by that brand
            const filtered = models.filter(model => model.brandId === parseInt(filter.brandId));

            // Clear model selection if the current model doesn't belong to selected brand
            if (filter.modelId && !filtered.some(model => model.modelId === parseInt(filter.modelId))) {
                setFilter(prev => ({ ...prev, modelId: '' }));
            }
        }
        // If no brand is selected, we'll show all models in the FilterBar
    }, [filter.brandId, models, filter.modelId]);



    // Fetch data
    const fetchVehicles = async () => {
        try {
            setLoading(true);
            setError(null);
            const query = {
                modelId: filter.modelId ? Number(filter.modelId) : undefined,
                typeId: filter.typeId ? Number(filter.typeId) : undefined,
                brandId: filter.brandId ? Number(filter.brandId) : undefined,
                status: filter.status !== '' ? Number(filter.status) : undefined,
                stationId: (presetStationId || filter.stationId) ? Number(presetStationId || filter.stationId) : undefined,
            };

            let response = await vehicleAPI.filter(query);

            // If filter returns empty array, that means NO vehicles match the filter
            // Don't fall back to getAll() - show the empty result
            if (!Array.isArray(response)) {
                response = []; // Ensure it's always an array
            }

            console.log('Vehicles response:', response);
            const list = response; // Use the filtered result directly
            setVehicles(list);
            setTotalItems(list.length);
        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setError(err.message || 'Failed to fetch vehicles');
        } finally {
            setLoading(false);
        }
    };

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                let [m, b, t, s] = await Promise.all([
                    modelAPI.getAll(),
                    brandAPI.getAll(),
                    typeAPI.getAll(),
                    stationAPI.getAll(),
                ]);

                if (!Array.isArray(m) || m.length === 0) {
                    m = await modelAPI.filterModels(undefined, undefined, undefined);
                }

                setModels(Array.isArray(m) ? m : []);
                setBrands(Array.isArray(b) ? b : []);
                setTypes(Array.isArray(t) ? t : []);
                setStations(Array.isArray(s) ? s : []);
            } catch (e) { /* ignore */ }
            await fetchVehicles();
        };
        loadData();
    }, []);

    // Re-fetch when filters change
    useEffect(() => {
        fetchVehicles();
    }, [filter.modelId, filter.typeId, filter.brandId, filter.status, filter.stationId]);

    // Action handlers
    const handleUpdate = useCallback((vehicle) => {
        setSelectedVehicle(vehicle);
        setIsUpdateModalOpen(true);
    }, []);

    const handleReportIssue = useCallback((vehicle) => {
        setSelectedVehicle(vehicle);
        setIsAccidentModalOpen(true);
    }, []);

    const handleActivate = useCallback(async (vehicle) => {
        try {
            await vehicleAPI.update(vehicle.vehicleId, {
                licensePlate: vehicle.licensePlate,
                batteryLevel: vehicle.batteryLevel,
                status: 5,
                stationId: vehicle.stationId,
                modelId: vehicle.modelId
            });
            toast({ title: 'Success', description: 'Vehicle activated', status: 'success', duration: 3000 });
            await fetchVehicles();
        } catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to activate', status: 'error', duration: 5000 });
        }
    }, [toast]);

    const handleFinishCharging = useCallback(async () => {
        await fetchVehicles();
    }, []);

    const handleModalSuccess = useCallback(async () => {
        await fetchVehicles();
    }, []);

    // Table configuration
    const columns = useMemo(() => [
        columnHelper.accessor('vehicleId', {
            header: 'ID',
            cell: (info) => <Text fontWeight="700">{info.getValue()}</Text>,
        }),
        columnHelper.accessor('licensePlate', {
            header: 'LICENSE PLATE',
            cell: (info) => <Text fontWeight="700">{info.getValue()}</Text>,
        }),
        columnHelper.accessor('modelName', {
            header: 'MODEL',
            cell: (info) => <Text>{info.getValue()}</Text>,
        }),
        columnHelper.accessor('batteryLevel', {
            header: 'BATTERY',
            cell: (info) => <BatteryCell level={info.getValue()} />,
        }),
        columnHelper.accessor('stationName', {
            header: 'STATION',
            cell: (info) => <Text>{info.getValue()}</Text>,
        }),
        columnHelper.accessor('status', {
            header: 'STATUS',
            cell: (info) => <StatusBadge status={info.getValue()} />,
        }),
        columnHelper.display({
            id: "actions",
            header: "ACTIONS",
            cell: (info) => (
                <VehicleActions
                    vehicle={info.row.original}
                    onUpdate={handleUpdate}
                    onReport={handleReportIssue}
                    onActivate={handleActivate}
                    onFinishCharging={handleFinishCharging}
                />
            ),
        }),
    ], [handleUpdate, handleReportIssue, handleActivate, handleFinishCharging]);

    // Pagination
    // Replace your existing pagination data calculation with:
    const displayVehicles = showAvailableOnly ? availableVehicles : vehicles;
    const displayTotalItems = showAvailableOnly ? availableVehicles.length : totalItems;

    // Then update your paginationData to use displayVehicles:
    const paginationData = useMemo(() => {
        const safeVehicles = Array.isArray(displayVehicles) ? displayVehicles : [];
        const totalPages = Math.ceil(displayTotalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedVehicles = safeVehicles.slice(startIndex, endIndex);

        return { totalPages, startIndex, endIndex, paginatedVehicles };
    }, [displayVehicles, currentPage, pageSize, displayTotalItems]);
    const { totalPages, startIndex, endIndex, paginatedVehicles } = paginationData;

    const table = useReactTable({
        data: paginatedVehicles, // This now comes from paginationData
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} onRetry={fetchVehicles} />;

    return (
        <Box>
            <Flex direction="column" gap="20px">
                {/* Header */}
                <Flex justify="space-between" align="center">
                    <Text fontSize="2xl" fontWeight="700">
                        {showAvailableOnly ? 'Available Vehicles' : 'Vehicle Management'}
                    </Text>
                </Flex>

                <FilterBar
                    filter={filter}
                    setFilter={setFilter}
                    models={models}
                    types={types}
                    brands={brands}
                    stations={stations}
                    presetStationId={presetStationId}
                    startTime={startTime}
                    setStartTime={setStartTime}
                    endTime={endTime}
                    setEndTime={setEndTime}
                    onCheckAvailability={checkAvailableVehicles}
                    showAvailableOnly={showAvailableOnly}
                    onShowAllVehicles={handleShowAllVehicles}
                />


                {/* Table */}
                <TableComponent table={table} />
            </Flex>
            {/* Pagination - Using your reusable component */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={displayTotalItems}  // Use displayTotalItems instead of totalItems
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                startIndex={startIndex}
                endIndex={endIndex}
            />

            <VehicleUpdateModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                vehicle={selectedVehicle}
                onSuccess={handleModalSuccess}
            />

            <VehicleAccidentModal
                isOpen={isAccidentModalOpen}
                onClose={() => setIsAccidentModalOpen(false)}
                vehicle={selectedVehicle}
                onSuccess={handleModalSuccess}
            />
        </Box>
    );
};

const BatteryCell = ({ level }) => {
    const getBatteryColor = (level) => {
        if (level >= 80) return 'green';
        if (level >= 50) return 'yellow';
        if (level >= 20) return 'orange';
        return 'red';
    };

    return (
        <Flex align="center" gap={2}>
            <Text fontWeight="bold">{level}%</Text>
            <Progress
                value={level}
                size="sm"
                colorScheme={getBatteryColor(level)}
                width="60px"
                borderRadius="md"
            />
        </Flex>
    );
};

// Simple component for status badge
const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 0: return 'orange';
            case 1: return 'blue';
            case 2: return 'purple';
            case 3: return 'red';
            case 4: return 'orange';
            case 5: return 'green';
            default: return 'gray';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 0: return 'To Be Rented';
            case 1: return 'Renting';
            case 2: return 'Charging';
            case 3: return 'To Be Checkup';
            case 4: return 'In Maintenance';
            case 5: return 'Available';
            default: return 'Unknown';
        }
    };

    return (
        <Badge colorScheme={getStatusColor(status)} variant="solid" px={3} py={1} borderRadius="full">
            {getStatusText(status)}
        </Badge>
    );
};

// Loading state component
const LoadingState = () => (
    <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" />
        <Text ml={4}>Loading vehicles...</Text>
    </Flex>
);

// Error state component  
const ErrorState = ({ error, onRetry }) => (
    <Box>
        <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Flex justify="center" mt={4}>
            <Button onClick={onRetry} colorScheme="blue">Retry</Button>
        </Flex>
    </Box>
);

// Table component
const TableComponent = ({ table }) => (
    <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" overflow="hidden">
        <Table variant="simple">
            <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <Th key={header.id} borderColor="gray.200">
                                <Flex justify="space-between" align="center" fontSize="12px" color="gray.400">
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </Flex>
                            </Th>
                        ))}
                    </Tr>
                ))}
            </Thead>
            <Tbody>
                {table.getRowModel().rows.map((row) => (
                    <Tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <Td key={cell.id} borderColor="transparent">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Td>
                        ))}
                    </Tr>
                ))}
            </Tbody>
        </Table>
    </Box>
);

export default VehicleList;