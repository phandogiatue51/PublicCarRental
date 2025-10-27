import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Button, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue, Spinner, Alert,
    AlertIcon, AlertTitle, AlertDescription, Badge, Select, HStack, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalCloseButton, VStack, Divider, Progress
} from '@chakra-ui/react';
import {
    createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable
} from '@tanstack/react-table';
import {
    MdChevronLeft, MdChevronRight, MdDriveEta, MdLocationOn, MdRefresh, MdBattery6Bar
} from 'react-icons/md';
import { vehicleAPI, modelAPI, brandAPI, typeAPI, stationAPI } from '../../services/api';

const columnHelper = createColumnHelper();

const VehicleList = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sorting, setSorting] = useState([]);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Color mode values - moved to top to avoid conditional hook calls
    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
    const brandColor = useColorModeValue('brand.500', 'white');
    const cardBg = useColorModeValue('white', 'gray.800');

    // Filter state
    const [filter, setFilter] = useState({ modelId: '', typeId: '', brandId: '', stationId: '', status: '' });
    const [models, setModels] = useState([]);
    const [brands, setBrands] = useState([]);
    const [types, setTypes] = useState([]);
    const [stations, setStations] = useState([]);

    // Detect staff stationId from localStorage/sessionStorage (hide station selector if present)
    const presetStationId = (typeof window !== 'undefined') ? (localStorage.getItem('stationId') || sessionStorage.getItem('stationId')) : '';

    // Fetch vehicles from API
    const fetchVehicles = async () => {
        try {
            setLoading(true);
            setError(null);
            // Prefer filter endpoint with current filters
            const query = {
                modelId: filter.modelId ? Number(filter.modelId) : undefined,
                typeId: filter.typeId ? Number(filter.typeId) : undefined,
                brandId: filter.brandId ? Number(filter.brandId) : undefined,
                status: filter.status !== '' ? Number(filter.status) : undefined,
                stationId: (presetStationId || filter.stationId) ? Number(presetStationId || filter.stationId) : undefined,
            };
            let response = await vehicleAPI.filter(query);
            if (!Array.isArray(response) || response.length === 0) {
                console.warn('vehicleAPI.filter returned empty; falling back to getAll');
                response = await vehicleAPI.getAll();
            }
            console.log('Vehicles response:', response);
            const list = Array.isArray(response) ? response : [];
            setVehicles(list);
            setTotalItems(list.length || 0);
        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setError(err.message || 'Failed to fetch vehicles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load filter dropdown options and then fetch
        (async () => {
            try {
                let [m, b, t, s] = await Promise.all([
                    modelAPI.getAll(),
                    brandAPI.getAll(),
                    typeAPI.getAll(),
                    stationAPI.getAll(),
                ]);
                // Fallback to filterModels if models list empty
                if (!Array.isArray(m) || m.length === 0) {
                    m = await modelAPI.filterModels(undefined, undefined, undefined);
                }
                setModels(Array.isArray(m) ? m : []);
                setBrands(Array.isArray(b) ? b : []);
                setTypes(Array.isArray(t) ? t : []);
                setStations(Array.isArray(s) ? s : []);
            } catch (e) { /* ignore */ }
            fetchVehicles();
        })();
    }, []);

    // Re-fetch when filters change
    useEffect(() => {
        fetchVehicles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.modelId, filter.typeId, filter.brandId, filter.status, filter.stationId]);

    // Pagination calculations - memoized for performance
    const paginationData = useMemo(() => {
        const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedVehicles = safeVehicles.slice(startIndex, endIndex);

        return {
            totalPages,
            startIndex,
            endIndex,
            paginatedVehicles
        };
    }, [vehicles, currentPage, pageSize, totalItems]);

    const { totalPages, startIndex, endIndex, paginatedVehicles } = paginationData;

    // Pagination handlers - memoized for performance
    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handlePageSizeChange = useCallback((newPageSize) => {
        setPageSize(parseInt(newPageSize));
        setCurrentPage(1); // Reset to first page when changing page size
    }, []);

    const goToFirstPage = useCallback(() => setCurrentPage(1), []);
    const goToLastPage = useCallback(() => setCurrentPage(totalPages), [totalPages]);
    const goToPreviousPage = useCallback(() => setCurrentPage(prev => Math.max(prev - 1, 1)), []);
    const goToNextPage = useCallback(() => setCurrentPage(prev => Math.min(prev + 1, totalPages)), [totalPages]);

    // Handle view vehicle details
    const handleView = useCallback((vehicle) => {
        setSelectedVehicle(vehicle);
        setIsDetailModalOpen(true);
    }, []);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        fetchVehicles();
    }, []);

    // Get status badge color
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

    // Get status text
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

    const onFilterChange = (key) => (e) => {
        setFilter((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const clearFilters = () => {
        setFilter({ modelId: '', typeId: '', brandId: '', stationId: '', status: '' });
    };

    // Get battery color based on level
    const getBatteryColor = (level) => {
        if (level >= 80) return 'green';
        if (level >= 50) return 'yellow';
        if (level >= 20) return 'orange';
        return 'red';
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return 'N/A';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const columns = useMemo(() => [
        columnHelper.accessor('vehicleId', {
            id: 'vehicleId',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    ID
                </Text>
            ),
            cell: (info) => (
                <Text color={textColor} fontSize="sm" fontWeight="700">
                    {info.getValue()}
                </Text>
            ),
        }),
        columnHelper.accessor('licensePlate', {
            id: 'licensePlate',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    LICENSE PLATE
                </Text>
            ),
            cell: (info) => (
                <Flex align="center" gap={2}>
                    <Icon as={MdDriveEta} color="gray.500" />
                    <Text color={textColor} fontSize="sm" fontWeight="700">
                        {info.getValue()}
                    </Text>
                </Flex>
            ),
        }),
        columnHelper.accessor('modelName', {
            id: 'model',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    MODEL
                </Text>
            ),
            cell: (info) => (
                <Flex align="center" gap={2}>
                    <Text color={textColor} fontSize="sm" fontWeight="700">
                        {info.getValue()}
                    </Text>
                </Flex>
            ),
        }),

        columnHelper.accessor('batteryLevel', {
            id: 'battery',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    BATTERY
                </Text>
            ),
            cell: (info) => {
                const level = info.getValue();
                return (
                    <Flex align="center" gap={2}>
                        <Icon as={MdBattery6Bar} color={`${getBatteryColor(level)}.500`} />
                        <VStack spacing={1} align="start">
                            <Text color={textColor} fontSize="sm" fontWeight="bold">
                                {level}%
                            </Text>
                            <Progress
                                value={level}
                                size="sm"
                                colorScheme={getBatteryColor(level)}
                                width="60px"
                                borderRadius="md"
                            />
                        </VStack>
                    </Flex>
                );
            },
        }),
        columnHelper.accessor('stationName', {
            id: 'station',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    STATION
                </Text>
            ),
            cell: (info) => (
                <Flex align="center" gap={2}>
                    <Icon as={MdLocationOn} color="gray.500" />
                    <Text color={textColor} fontSize="sm">
                        {info.getValue()}
                    </Text>
                </Flex>
            ),
        }),
        columnHelper.accessor('status', {
            id: 'status',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    STATUS
                </Text>
            ),
            cell: (info) => {
                const status = info.getValue();
                return (
                    <Badge
                        colorScheme={getStatusColor(status)}
                        variant="solid"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="bold"
                    >
                        {getStatusText(status)}
                    </Badge>
                );
            },
        }),

    ], [textColor, handleView]);

    const table = useReactTable({
        data: paginatedVehicles,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        debugTable: true,
    });

    // Handle modal close
    const handleDetailModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedVehicle(null);
    };

    // Memoized page numbers calculation
    const pageNumbers = useMemo(() => {
        const maxVisiblePages = 5;
        const pages = [];

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is 5 or less
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Smart pagination logic
            let startPage, endPage;

            if (currentPage <= 3) {
                startPage = 1;
                endPage = maxVisiblePages;
            } else if (currentPage >= totalPages - 2) {
                startPage = totalPages - maxVisiblePages + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - 2;
                endPage = currentPage + 2;
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }

        return pages;
    }, [currentPage, totalPages]);

    if (loading) {
        return (
            <Box>
                <Flex justify="center" align="center" minH="200px">
                    <Spinner size="xl" color={brandColor} />
                    <Text ml={4} color={textColor}>
                        Loading vehicles...
                    </Text>
                </Flex>
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error!</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Flex justify="center" mt={4}>
                    <Button onClick={fetchVehicles} colorScheme="blue">
                        Retry
                    </Button>
                </Flex>
            </Box>
        );
    }

    return (
        <Box>
            <Flex direction="column" gap="20px" me="auto">
                {/* Header */}
                <Flex
                    mt="45px"
                    justifyContent="space-between"
                    direction={{ base: 'column', md: 'row' }}
                    align={{ base: 'start', md: 'center' }}
                >
                    <Text color={textColor} fontSize="2xl" ms="24px" fontWeight="700">
                        Vehicle Management
                    </Text>
                    <HStack spacing={3}>
                        {/* Filters */}
                        <Select placeholder="Model" value={filter.modelId} onChange={onFilterChange('modelId')} size="sm" width="160px">
                            {models.map(m => (<option key={m.modelId} value={m.modelId}>{m.name}</option>))}
                        </Select>
                        <Select placeholder="Type" value={filter.typeId} onChange={onFilterChange('typeId')} size="sm" width="140px">
                            {types.map(t => (<option key={t.typeId} value={t.typeId}>{t.name}</option>))}
                        </Select>
                        <Select placeholder="Brand" value={filter.brandId} onChange={onFilterChange('brandId')} size="sm" width="160px">
                            {brands.map(b => (<option key={b.brandId} value={b.brandId}>{b.name}</option>))}
                        </Select>
                        {presetStationId ? null : (
                            <Select placeholder="Station" value={filter.stationId} onChange={onFilterChange('stationId')} size="sm" width="180px">
                                {stations.map(s => (<option key={s.stationId} value={s.stationId}>{s.name}</option>))}
                            </Select>
                        )}
                        <Select placeholder="Status" value={filter.status} onChange={onFilterChange('status')} size="sm" width="140px">
                            <option value="0">To Be Rented</option>
                            <option value="1">Renting</option>
                            <option value="2">Charging</option>
                            <option value="3">To Be Checkup</option>
                            <option value="4">In Maintenance</option>
                            <option value="5">Available</option>
                        </Select>
                        <Button onClick={clearFilters} size="sm" variant="outline">Clear</Button>
                        <Button
                            leftIcon={<Icon as={MdRefresh} />}
                            colorScheme="gray"
                            variant="outline"
                            onClick={handleRefresh}
                        >
                            Refresh
                        </Button>
                    </HStack>
                </Flex>

                {/* Table */}
                <Box
                    bg={cardBg}
                    borderRadius="lg"
                    border="1px"
                    borderColor={borderColor}
                    overflow="hidden"
                >
                    <Table variant="simple" color="gray.500" mb="24px" mt="12px">
                        <Thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <Tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <Th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            pe="10px"
                                            borderColor={borderColor}
                                            cursor="pointer"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <Flex
                                                justifyContent="space-between"
                                                align="center"
                                                fontSize={{ sm: "10px", lg: "12px" }}
                                                color="gray.400"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </Flex>
                                        </Th>
                                    ))}
                                </Tr>
                            ))}
                        </Thead>
                        <Tbody>
                            {table
                                .getRowModel()
                                .rows
                                .map((row) => (
                                    <Tr key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <Td
                                                key={cell.id}
                                                fontSize={{ sm: '14px' }}
                                                minW={{ sm: '150px', md: '200px', lg: 'auto' }}
                                                borderColor="transparent"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </Td>
                                        ))}
                                    </Tr>
                                ))}
                        </Tbody>
                    </Table>
                </Box>

                {/* Pagination Controls */}
                <Box
                    bg={cardBg}
                    borderRadius="lg"
                    border="1px"
                    borderColor={borderColor}
                    p={4}
                >
                    <Flex justify="space-between" align="center">
                        <HStack spacing={4}>
                            <Text fontSize="sm" color={textColor}>
                                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} vehicles
                            </Text>
                            <HStack spacing={2}>
                                <Text fontSize="sm" color={textColor}>Rows per page:</Text>
                                <Select
                                    value={pageSize}
                                    onChange={(e) => handlePageSizeChange(e.target.value)}
                                    size="sm"
                                    width="80px"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </Select>
                            </HStack>
                        </HStack>

                        <HStack spacing={2}>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={goToFirstPage}
                                isDisabled={currentPage === 1}
                                leftIcon={<Icon as={MdChevronLeft} />}
                            >
                                First
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={goToPreviousPage}
                                isDisabled={currentPage === 1}
                                leftIcon={<Icon as={MdChevronLeft} />}
                            >
                                Previous
                            </Button>

                            <HStack spacing={1}>
                                {pageNumbers.map((pageNum) => (
                                    <Button
                                        key={pageNum}
                                        size="sm"
                                        variant={currentPage === pageNum ? "solid" : "outline"}
                                        colorScheme={currentPage === pageNum ? "blue" : "gray"}
                                        onClick={() => handlePageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                ))}
                            </HStack>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={goToNextPage}
                                isDisabled={currentPage === totalPages}
                                rightIcon={<Icon as={MdChevronRight} />}
                            >
                                Next
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={goToLastPage}
                                isDisabled={currentPage === totalPages}
                                rightIcon={<Icon as={MdChevronRight} />}
                            >
                                Last
                            </Button>
                        </HStack>
                    </Flex>
                </Box>
            </Flex>

            {/* Vehicle Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={handleDetailModalClose} size="lg" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <Flex align="center" gap={2}>
                            <Icon as={MdDriveEta} />
                            Vehicle Details
                        </Flex>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        {selectedVehicle && (
                            <VStack spacing={4} align="stretch">
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Vehicle ID</Text>
                                    <Text color={textColor}>{selectedVehicle.vehicleId}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>License Plate</Text>
                                    <Text color={textColor}>{selectedVehicle.licensePlate}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Model</Text>
                                    <Text color={textColor}>{selectedVehicle.modelName}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Battery Level</Text>
                                    <Flex align="center" gap={2}>
                                        <Text color={textColor}>{selectedVehicle.batteryLevel}%</Text>
                                        <Progress
                                            value={selectedVehicle.batteryLevel}
                                            size="sm"
                                            colorScheme={getBatteryColor(selectedVehicle.batteryLevel)}
                                            width="100px"
                                            borderRadius="md"
                                        />
                                    </Flex>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Station</Text>
                                    <Text color={textColor}>{selectedVehicle.stationName}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Status</Text>
                                    <Badge
                                        colorScheme={getStatusColor(selectedVehicle.status)}
                                        variant="solid"
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                        fontSize="sm"
                                        fontWeight="bold"
                                    >
                                        {getStatusText(selectedVehicle.status)}
                                    </Badge>
                                </Box>
                                {selectedVehicle.rentalPrice && (
                                    <>
                                        <Divider />
                                        <Box>
                                            <Text fontWeight="bold" color={textColor} mb={2}>Rental Price</Text>
                                            <Text color={textColor}>{formatCurrency(selectedVehicle.rentalPrice)}</Text>
                                        </Box>
                                    </>
                                )}
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default VehicleList;
